import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export interface FlashlightAssetInfo {
  hasCustomModel: boolean;
  targetDir?: string;
  modelUrl: string | null;
  modelFormat: string | null;
  textures: {
    roughness?: string;
    normal?: string;
    baseColor?: string;
    metallic?: string;
    ao?: string;
    emissive?: string;
  };
  allFiles: string[];
  manifest?: {
    scaleMultiplier?: number;
    rotationOffsetDegrees?: [number, number, number];
    positionOffset?: [number, number, number];
  } | null;
}

export class FlashlightModelManager {
  public rootGroup: THREE.Group;
  public modelContainer: THREE.Group;
  public lensMesh: THREE.Mesh | null = null;
  public lensGlowLight: THREE.PointLight;
  public isFlashlightOn = false;

  public onTexturesLoaded?: (maps: {
    baseColorMap: THREE.Texture | null;
    emissiveMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
  }) => void;

  private currentModel: THREE.Object3D | null = null;
  private isCustomLoaded = false;
  private currentModelSource = 'default';

  // Base viewmodel transform (realistic in-hand flashlight positioning)
  private readonly defaultPosition = new THREE.Vector3(0.22, -0.22, -0.40);
  private readonly defaultRotation = new THREE.Euler(0.04, -0.06, 0.02, 'YXZ');

  // Sway & bobbing states
  private swayOffset = new THREE.Vector3();
  private swayRotation = new THREE.Euler();
  private bobTimer = 0;
  private breathTimer = 0;

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'FlashlightViewModelRoot';
    this.rootGroup.position.copy(this.defaultPosition);
    this.rootGroup.rotation.copy(this.defaultRotation);

    this.modelContainer = new THREE.Group();
    this.modelContainer.name = 'FlashlightModelContainer';
    this.rootGroup.add(this.modelContainer);

    // Subtle local glow at the lens bezel
    this.lensGlowLight = new THREE.PointLight(0xffecd0, 0, 0.8, 2);
    this.lensGlowLight.position.set(0, 0, -0.16);
    this.rootGroup.add(this.lensGlowLight);

    // Soft viewmodel fill light so flashlight body, textures, and emissive details are clearly visible
    const vmFill = new THREE.PointLight(0xfff6ea, 0.7, 1.2, 1.5);
    vmFill.position.set(0.08, 0.12, 0.05);
    this.rootGroup.add(vmFill);

    // Build the high-detail default flashlight model initially
    this.buildDefaultTacticalFlashlight();

    // Check for custom model dropped into /public/models/flashlight/
    this.scanAndLoadCustomModel();
  }

  /**
   * Loads the dropped custom 3D model & textures by reading the static manifest.json that
   * ships alongside them in /public/models/flashlight/. This is a plain static-file fetch —
   * there is no backend/API route in this project, so we must never depend on one here.
   */
  public async scanAndLoadCustomModel(): Promise<boolean> {
    const baseDir = '/models/flashlight/';
    const resolveAsset = (fileName?: string | null): string | undefined =>
      fileName ? `${baseDir}${fileName.replace(/^\/+/, '')}` : undefined;

    try {
      // cache: 'no-store' so a re-dropped/updated model or texture is picked up on next load
      // instead of being served from a stale browser cache.
      const res = await fetch(`${baseDir}manifest.json`, { cache: 'no-store' });
      if (!res.ok) {
        console.log(
          `[Flashlight] No manifest.json found at ${baseDir} (status ${res.status}) - Using high-detail tactical torch. Drop your model + textures + manifest.json into /public/models/flashlight/ anytime!`
        );
        return false;
      }

      const manifestData = await res.json();
      const modelFile: string | undefined = manifestData.model;
      if (!modelFile) {
        console.warn('[Flashlight] manifest.json found but has no "model" field — using default torch.');
        return false;
      }

      const modelUrl = resolveAsset(modelFile)!;
      const ext = modelFile.split('.').pop()?.toLowerCase() || 'obj';
      const format = ext === 'glb' || ext === 'gltf' ? 'gltf' : 'obj';

      const textures = {
        baseColor: resolveAsset(manifestData.textures?.baseColor),
        roughness: resolveAsset(manifestData.textures?.roughness),
        emissive: resolveAsset(manifestData.textures?.emissive),
        normal: resolveAsset(manifestData.textures?.normal),
        metallic: resolveAsset(manifestData.textures?.metallic),
        ao: resolveAsset(manifestData.textures?.ao),
      };

      const manifest = {
        scaleMultiplier: manifestData.scaleMultiplier,
        rotationOffsetDegrees: manifestData.rotationOffsetDegrees,
        positionOffset: manifestData.positionOffset,
      };

      console.log('[Flashlight] Custom 3D model detected via manifest.json:', modelUrl, textures);
      await this.loadModelFromUrl(modelUrl, format, textures, manifest);
      return true;
    } catch (err) {
      console.warn('[Flashlight] Asset scan notice (falling back to default torch):', err);
    }
    return false;
  }

  /**
   * Loads a 3D model from URL with optional PBR textures
   */
  public async loadModelFromUrl(
    modelUrl: string,
    format: string,
    textures?: FlashlightAssetInfo['textures'],
    manifest?: FlashlightAssetInfo['manifest']
  ) {
    try {
      let object: THREE.Object3D;

      if (format === 'obj') {
        const objLoader = new OBJLoader();
        object = await new Promise<THREE.Object3D>((resolve, reject) => {
          objLoader.load(modelUrl, resolve, undefined, reject);
        });
      } else {
        // GLTF / GLB default
        const gltfLoader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          gltfLoader.load(modelUrl, resolve, undefined, reject);
        });
        object = gltf.scene || gltf.scenes[0];
      }

      // Load external textures if provided
      const textureLoader = new THREE.TextureLoader();
      let roughnessMap: THREE.Texture | null = null;
      let normalMap: THREE.Texture | null = null;
      let baseColorMap: THREE.Texture | null = null;
      let metallicMap: THREE.Texture | null = null;
      let aoMap: THREE.Texture | null = null;
      let emissiveMap: THREE.Texture | null = null;

      if (textures) {
        if (textures.roughness) {
          roughnessMap = await textureLoader.loadAsync(textures.roughness).catch((err) => {
            console.warn('[Flashlight] Roughness load notice:', err);
            return null;
          });
          if (roughnessMap) {
            roughnessMap.wrapS = THREE.RepeatWrapping;
            roughnessMap.wrapT = THREE.RepeatWrapping;
            roughnessMap.needsUpdate = true;
          }
        }
        if (textures.normal) {
          normalMap = await textureLoader.loadAsync(textures.normal).catch(() => null);
          if (normalMap) {
            normalMap.wrapS = THREE.RepeatWrapping;
            normalMap.wrapT = THREE.RepeatWrapping;
            normalMap.needsUpdate = true;
          }
        }
        if (textures.baseColor) {
          baseColorMap = await textureLoader.loadAsync(textures.baseColor).catch((err) => {
            console.warn('[Flashlight] BaseColor load notice:', err);
            return null;
          });
          if (baseColorMap) {
            baseColorMap.colorSpace = THREE.SRGBColorSpace;
            baseColorMap.wrapS = THREE.RepeatWrapping;
            baseColorMap.wrapT = THREE.RepeatWrapping;
            baseColorMap.needsUpdate = true;
          }
        }
        if (textures.emissive) {
          emissiveMap = await textureLoader.loadAsync(textures.emissive).catch((err) => {
            console.warn('[Flashlight] Emissive load notice:', err);
            return null;
          });
          if (emissiveMap) {
            emissiveMap.colorSpace = THREE.SRGBColorSpace;
            emissiveMap.wrapS = THREE.RepeatWrapping;
            emissiveMap.wrapT = THREE.RepeatWrapping;
            emissiveMap.needsUpdate = true;
          }
        }
        if (textures.metallic) {
          metallicMap = await textureLoader.loadAsync(textures.metallic).catch(() => null);
        }
        if (textures.ao) {
          aoMap = await textureLoader.loadAsync(textures.ao).catch(() => null);
        }
      }

      // Normalize model dimensions and orientation
      const mountedModel = this.normalizeAndOrientModel(object, manifest, {
        roughnessMap,
        normalMap,
        baseColorMap,
        metallicMap,
        aoMap,
        emissiveMap,
      });

      // Clear existing model and mount new one
      while (this.modelContainer.children.length > 0) {
        this.modelContainer.remove(this.modelContainer.children[0]);
      }

      this.currentModel = mountedModel;
      this.modelContainer.add(mountedModel);
      this.isCustomLoaded = true;
      this.currentModelSource = modelUrl;

      // Trigger callback with all 3 loaded textures for spotlight projection
      this.onTexturesLoaded?.({
        baseColorMap,
        emissiveMap,
        roughnessMap,
      });

      // Update state
      this.setFlashlightOn(this.isFlashlightOn);
      console.log('[Flashlight] Custom 3D model successfully mounted to character hand!');
    } catch (err) {
      console.error('[Flashlight] Error loading custom 3D model:', err);
    }
  }

  /**
   * Loads custom files directly from browser File objects (Drag & drop or file picker)
   */
  public async loadFromClientFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const modelFile = fileArray.find((f) => /\.(glb|gltf|obj)$/i.test(f.name));
    if (!modelFile) {
      throw new Error('No .glb, .gltf, or .obj 3D model file found in the dropped files.');
    }

    // Also upload them to server /public/models/flashlight/ so they persist!
    const uploadPayload: Array<{ name: string; base64: string }> = [];

    for (const f of fileArray) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(',');
          resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
        };
        reader.readAsDataURL(f);
      });
      uploadPayload.push({ name: f.name, base64 });
    }

    try {
      await fetch('/api/flashlight-assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: uploadPayload }),
      });
    } catch (err) {
      console.warn('[Flashlight] Could not persist to disk via upload API:', err);
    }

    // Now reload from server scanner to get full synced paths
    await this.scanAndLoadCustomModel();
  }

  /**
   * Measures bounding box, centers handle, auto-scales to realistic torch size (~28cm),
   * auto-orients beam forward along -Z, and applies PBR textures.
   */
  private normalizeAndOrientModel(
    object: THREE.Object3D,
    manifest?: FlashlightAssetInfo['manifest'],
    maps?: {
      roughnessMap: THREE.Texture | null;
      normalMap: THREE.Texture | null;
      baseColorMap: THREE.Texture | null;
      metallicMap: THREE.Texture | null;
      aoMap: THREE.Texture | null;
      emissiveMap: THREE.Texture | null;
    }
  ): THREE.Group {
    // 1. Compute bounding box before adjustments
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // 2. Center object pivot at its geometric center
    object.position.sub(center);

    // Wrap in an alignment pivot group
    const alignGroup = new THREE.Group();
    alignGroup.name = 'CustomModelAlignGroup';
    alignGroup.add(object);

    // 3. Find principal elongated axis of the flashlight model
    const maxDim = Math.max(size.x, size.y, size.z);
    let targetLength = 0.28; // Realistic substantial handheld torch size (~28cm)

    if (manifest?.scaleMultiplier) {
      targetLength *= manifest.scaleMultiplier;
    }

    const scale = maxDim > 0.0001 ? targetLength / maxDim : 1;
    alignGroup.scale.setScalar(scale);

    // 4. Auto-rotation: orient longest axis along -Z (pointing forward away from player)
    if (size.y >= size.x && size.y >= size.z) {
      // Longest along Y -> rotate 90 deg around X to point along -Z
      alignGroup.rotation.x = -Math.PI / 2;
    } else if (size.x >= size.y && size.x >= size.z) {
      // Longest along X -> rotate 90 deg around Y to point along -Z
      alignGroup.rotation.y = Math.PI / 2;
    }

    // Apply manual rotation offset if specified in manifest
    if (manifest?.rotationOffsetDegrees) {
      const [rx, ry, rz] = manifest.rotationOffsetDegrees;
      alignGroup.rotation.x += THREE.MathUtils.degToRad(rx);
      alignGroup.rotation.y += THREE.MathUtils.degToRad(ry);
      alignGroup.rotation.z += THREE.MathUtils.degToRad(rz);
    }

    if (manifest?.positionOffset) {
      const [px, py, pz] = manifest.positionOffset;
      alignGroup.position.x += px;
      alignGroup.position.y += py;
      alignGroup.position.z += pz;
    }

    // 5. Apply textures and shadow flags to meshes
    let firstMeshWithLens: THREE.Mesh | null = null;

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false; // Viewmodel in first-person shouldn't cast self shadows on hands
        mesh.receiveShadow = false;

        const hasBaseColor = Boolean(maps?.baseColorMap);
        const hasRoughness = Boolean(maps?.roughnessMap);
        const hasEmissive = Boolean(maps?.emissiveMap);

        const mat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: maps?.baseColorMap || null,
          roughnessMap: maps?.roughnessMap || null,
          roughness: hasRoughness ? 0.65 : 0.45,
          emissiveMap: maps?.emissiveMap || null,
          emissive: hasEmissive ? new THREE.Color(0xffffff) : new THREE.Color(0x000000),
          emissiveIntensity: 0,
          normalMap: maps?.normalMap || null,
          metalnessMap: maps?.metallicMap || null,
          metalness: maps?.metallicMap ? 1.0 : 0.35,
          aoMap: maps?.aoMap || null,
        });

        mesh.material = mat;
        mat.needsUpdate = true;

        const nameLower = mesh.name.toLowerCase();
        if (nameLower.includes('lens') || nameLower.includes('glass') || nameLower.includes('light')) {
          firstMeshWithLens = mesh;
        }
      }
    });

    this.lensMesh = firstMeshWithLens;
    return alignGroup;
  }

  /**
   * Default high-detail tactical flashlight model with knurled grip, flared bezel,
   * lens dish, and click switch.
   */
  public buildDefaultTacticalFlashlight() {
    while (this.modelContainer.children.length > 0) {
      this.modelContainer.remove(this.modelContainer.children[0]);
    }

    const torch = new THREE.Group();
    torch.name = 'TacticalFlashlightDefault';
    torch.scale.setScalar(1.15); // Sturdy, clear handheld tactical torch size

    // Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.35,
      metalness: 0.88,
    });

    const knurledGripMat = new THREE.MeshStandardMaterial({
      color: 0x0f1114,
      roughness: 0.7,
      metalness: 0.5,
    });

    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.25,
      metalness: 0.95,
    });

    const chromeReflectorMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.05,
      metalness: 1.0,
    });

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.1,
    });

    // 1. Main Tube Handle (pointing along -Z)
    const handleGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.14, 16);
    const handleMesh = new THREE.Mesh(handleGeo, metalMat);
    handleMesh.rotation.x = Math.PI / 2;
    handleMesh.position.set(0, 0, 0);
    torch.add(handleMesh);

    // 2. Knurled Grip Rings
    const gripGeo = new THREE.CylinderGeometry(0.0175, 0.0175, 0.08, 16);
    const gripMesh = new THREE.Mesh(gripGeo, knurledGripMat);
    gripMesh.rotation.x = Math.PI / 2;
    gripMesh.position.set(0, 0, 0.01);
    torch.add(gripMesh);

    // 3. Tailcap (back end)
    const tailcapGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 16);
    const tailcapMesh = new THREE.Mesh(tailcapGeo, bezelMat);
    tailcapMesh.rotation.x = Math.PI / 2;
    tailcapMesh.position.set(0, 0, 0.08);
    torch.add(tailcapMesh);

    // Tailcap Rubber Switch Button
    const buttonGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 12);
    const buttonMesh = new THREE.Mesh(buttonGeo, rubberMat);
    buttonMesh.rotation.x = Math.PI / 2;
    buttonMesh.position.set(0, 0, 0.095);
    torch.add(buttonMesh);

    // 4. Head Transition Cone (front flare)
    const coneGeo = new THREE.CylinderGeometry(0.026, 0.016, 0.035, 16);
    const coneMesh = new THREE.Mesh(coneGeo, bezelMat);
    coneMesh.rotation.x = -Math.PI / 2;
    coneMesh.position.set(0, 0, -0.085);
    torch.add(coneMesh);

    // 5. Bezel Head Cylinder
    const headGeo = new THREE.CylinderGeometry(0.027, 0.026, 0.045, 16);
    const headMesh = new THREE.Mesh(headGeo, bezelMat);
    headMesh.rotation.x = -Math.PI / 2;
    headMesh.position.set(0, 0, -0.125);
    torch.add(headMesh);

    // 6. Chrome Reflector Bowl (recessed dish)
    const reflectorGeo = new THREE.ConeGeometry(0.023, 0.025, 16, 1, true);
    const reflectorMesh = new THREE.Mesh(reflectorGeo, chromeReflectorMat);
    reflectorMesh.rotation.x = Math.PI / 2;
    reflectorMesh.position.set(0, 0, -0.135);
    torch.add(reflectorMesh);

    // 7. Glass Front Lens
    const lensGeo = new THREE.CircleGeometry(0.024, 20);
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(0, 0, -0.147);
    torch.add(lensMesh);
    this.lensMesh = lensMesh;

    // 8. Crenelated Bezel Ring (tactical front notches)
    const ringGeo = new THREE.TorusGeometry(0.0265, 0.002, 8, 20);
    const ringMesh = new THREE.Mesh(ringGeo, bezelMat);
    ringMesh.position.set(0, 0, -0.148);
    torch.add(ringMesh);

    this.modelContainer.add(torch);
    this.currentModel = torch;
    this.isCustomLoaded = false;
    this.currentModelSource = 'default';
  }

  /**
   * Updates flashlight visual state when light is toggled
   */
  public setFlashlightOn(isOn: boolean) {
    this.isFlashlightOn = isOn;
    this.lensGlowLight.intensity = isOn ? 0.8 : 0;

    if (this.currentModel) {
      this.currentModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissiveMap) {
            mat.emissive.set(0xffffff);
            mat.emissiveIntensity = isOn ? 1.6 : 0;
            mat.needsUpdate = true;
          }
        }
      });
    }

    if (this.lensMesh && (this.lensMesh.material as THREE.MeshStandardMaterial)) {
      const mat = this.lensMesh.material as THREE.MeshStandardMaterial;
      if (isOn) {
        mat.emissive.set(0xffeedd);
        mat.emissiveIntensity = 2.4;
      } else {
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
      mat.needsUpdate = true;
    }
  }

  /**
   * Smooth first-person viewmodel animation (sway, walk bob, idle breathing)
   */
  public update(
    delta: number,
    isMoving: boolean,
    isSprinting: boolean,
    mouseDeltaX: number,
    mouseDeltaY: number
  ) {
    // 1. Mouse sway lag
    const maxSway = 0.06;
    const targetSwayX = THREE.MathUtils.clamp(-mouseDeltaX * 0.0006, -maxSway, maxSway);
    const targetSwayY = THREE.MathUtils.clamp(mouseDeltaY * 0.0006, -maxSway, maxSway);

    this.swayOffset.x += (targetSwayX - this.swayOffset.x) * 12 * delta;
    this.swayOffset.y += (targetSwayY - this.swayOffset.y) * 12 * delta;

    const targetRotZ = -targetSwayX * 1.5;
    const targetRotX = targetSwayY * 1.2;
    this.swayRotation.z += (targetRotZ - this.swayRotation.z) * 10 * delta;
    this.swayRotation.x += (targetRotX - this.swayRotation.x) * 10 * delta;

    // 2. Idle breathing animation
    this.breathTimer += delta * 1.8;
    const breathY = Math.sin(this.breathTimer) * 0.002;
    const breathX = Math.cos(this.breathTimer * 0.5) * 0.0015;

    // 3. Walking bobbing animation
    let bobX = 0;
    let bobY = 0;
    let bobRotZ = 0;

    if (isMoving) {
      const bobFreq = isSprinting ? 14 : 9;
      this.bobTimer += delta * bobFreq;

      const bobAmp = isSprinting ? 0.018 : 0.009;
      bobY = Math.sin(this.bobTimer * 2) * bobAmp;
      bobX = Math.cos(this.bobTimer) * (bobAmp * 0.8);
      bobRotZ = Math.sin(this.bobTimer) * (isSprinting ? 0.04 : 0.02);
    } else {
      this.bobTimer = 0;
    }

    // Apply combined transforms to rootGroup
    this.rootGroup.position.set(
      this.defaultPosition.x + this.swayOffset.x + breathX + bobX,
      this.defaultPosition.y + this.swayOffset.y + breathY + bobY,
      this.defaultPosition.z
    );

    this.rootGroup.rotation.set(
      this.defaultRotation.x + this.swayRotation.x,
      this.defaultRotation.y,
      this.defaultRotation.z + this.swayRotation.z + bobRotZ
    );
  }

  public getModelStatus() {
    return {
      isCustom: this.isCustomLoaded,
      source: this.currentModelSource,
    };
  }
}

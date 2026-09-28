import * as THREE from 'three';
import { sound } from '../audio/SoundManager';
import { StoreWorld, InteractiveObject } from './StoreWorld';
import { FlashlightModelManager } from './FlashlightModelManager';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  public isLocked = false;
  public flashlight: THREE.SpotLight;
  public flashlightMesh: THREE.Object3D;
  public flashlightManager: FlashlightModelManager;
  public isFlashlightOn = false;

  // Movement parameters
  private moveSpeed = 4.2;
  private sprintSpeed = 6.8;
  private crouchSpeed = 2.4;
  private playerRadius = 0.38;
  private normalHeight = 1.75;
  private crouchHeight = 1.1;
  private currentHeight = 1.75;

  // Head bobbing & mouse sway
  private bobTimer = 0;
  private footstepTimer = 0;
  private lastMouseDeltaX = 0;
  private lastMouseDeltaY = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  public isCrouched = false;
  public isSprinting = false;
  public canMove = true;

  // Interactive targeting
  private raycaster = new THREE.Raycaster();
  private clickRaycaster = new THREE.Raycaster();
  public targetedObject: InteractiveObject | null = null;
  public mouseSensitivity = 0.0022;
  public onObjectClicked?: (object: InteractiveObject) => void;
  public activeWorld: StoreWorld | null = null;

  private prevMouseX: number | null = null;
  private prevMouseY: number | null = null;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    // Initial start position: Behind the checkout counter in spacious clerk aisle
    this.position = new THREE.Vector3(-10.4, this.normalHeight, 9.8);
    this.camera.position.copy(this.position);
    this.euler.y = -Math.PI / 2; // Facing across checkout counter towards customers and front doors
    this.camera.quaternion.setFromEuler(this.euler);
    this.isLocked = false;

    // Flashlight spotlight beam attached directly to camera with projection cookie
    this.flashlight = new THREE.SpotLight(0xfff7ee, 0, 38, Math.PI / 4.2, 0.45, 1.2);
    this.flashlight.position.set(0.20, -0.16, -0.22);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 512;
    this.flashlight.shadow.mapSize.height = 512;
    this.flashlight.shadow.bias = -0.001;

    // Spotlight target positioned forward in camera space
    this.flashlight.target.position.set(0, 0, -10);

    // Attach spotlight and its target directly to camera
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);

    // Flashlight Model Manager (supports custom .glb / .gltf / .obj + textures from /public/models/flashlight/)
    this.flashlightManager = new FlashlightModelManager();
    this.camera.add(this.flashlightManager.rootGroup);
    this.flashlightMesh = this.flashlightManager.modelContainer;

    // Generate initial optical projection beam cookie
    this.updateFlashlightProjectionMap();

    // Hook up textures callback to update spotlight projection map with all 3 loaded textures
    this.flashlightManager.onTexturesLoaded = (maps) => {
      this.updateFlashlightProjectionMap(maps.baseColorMap, maps.emissiveMap, maps.roughnessMap);
    };

    this.bindEvents();
  }

  /**
   * Constructs a high-resolution projection light cookie for the camera's THREE.SpotLight,
   * combining the loaded BaseColor, Emissive, and Roughness flashlight textures.
   */
  public updateFlashlightProjectionMap(
    baseColorTex?: THREE.Texture | null,
    emissiveTex?: THREE.Texture | null,
    roughnessTex?: THREE.Texture | null
  ) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.46;

    // Fill background with black (outer non-illuminated region)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Draw circular beam area
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Base optical beam gradient (warm halogen/incandescent torch core)
    const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    baseGrad.addColorStop(0, '#ffffff');
    baseGrad.addColorStop(0.32, '#fff7ea');
    baseGrad.addColorStop(0.68, '#f5deb3');
    baseGrad.addColorStop(0.90, '#887050');
    baseGrad.addColorStop(1.0, '#000000');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // 1. Modulate with BaseColor texture (optical reflector tint and texture pattern)
    if (baseColorTex && baseColorTex.image) {
      try {
        ctx.globalAlpha = 0.55;
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(baseColorTex.image as CanvasImageSource, 0, 0, size, size);
      } catch {
        // Ignore cross-origin / format exceptions
      }
    }

    // 2. Modulate with Emissive texture (intense bulb filament hotspot)
    if (emissiveTex && emissiveTex.image) {
      try {
        ctx.globalAlpha = 0.75;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(emissiveTex.image as CanvasImageSource, 0, 0, size, size);
      } catch {
        // Ignore
      }
    }

    // 3. Modulate with Roughness texture (microfacet lens diffusion & rim scatter)
    if (roughnessTex && roughnessTex.image) {
      try {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = 'soft-light';
        ctx.drawImage(roughnessTex.image as CanvasImageSource, 0, 0, size, size);
      } catch {
        // Ignore
      }
    }

    // Concentric parabolic lens rings
    ctx.globalAlpha = 0.12;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#ffffff';
    for (let i = 1; i <= 6; i++) {
      ctx.lineWidth = 1.5 + (i % 2);
      ctx.beginPath();
      ctx.arc(cx, cy, (r * i) / 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Smooth Gaussian-like radial vignette edge falloff
    ctx.globalCompositeOperation = 'destination-in';
    const vigGrad = ctx.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
    vigGrad.addColorStop(0, 'rgba(0,0,0,1)');
    vigGrad.addColorStop(0.85, 'rgba(0,0,0,0.55)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, size, size);

    const projTexture = new THREE.CanvasTexture(canvas);
    projTexture.wrapS = THREE.ClampToEdgeWrapping;
    projTexture.wrapT = THREE.ClampToEdgeWrapping;
    projTexture.minFilter = THREE.LinearMipmapLinearFilter;
    projTexture.magFilter = THREE.LinearFilter;
    projTexture.generateMipmaps = true;

    this.flashlight.map = projTexture;
    this.flashlight.map.needsUpdate = true;
  }

  public resetPosition(x = -10.4, y = this.normalHeight, z = 9.8, lookY = -Math.PI / 2) {
    this.position.set(x, y, z);
    this.camera.position.copy(this.position);
    this.euler.set(0, lookY, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
    this.velocity.set(0, 0, 0);
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
  }

  public destroy() {
    this.camera.remove(this.flashlight);
    this.camera.remove(this.flashlight.target);
    this.camera.remove(this.flashlightManager.rootGroup);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
  }

  public lock() {
    const now = performance.now();
    if (now - this.lastLockAttemptTime < 350) return;
    this.lastLockAttemptTime = now;

    try {
      if (!document.pointerLockElement) {
        const promise = this.domElement.requestPointerLock?.();
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err) => {
            // Silently ignore expected user gesture / frequency browser rejection
            if (err.name !== 'SecurityError') {
              // Expected
            }
          });
        }
      }
    } catch (err) {
      // Ignore browser pointer lock restrictions
    }
  }

  public unlock() {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } catch (err) {
      // Ignore
    }
  }

  private lastLockAttemptTime = 0;

  private onPointerLockChange = () => {
    this.isLocked = document.pointerLockElement === this.domElement;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isLocked || !this.canMove) return;

    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    this.lastMouseDeltaX = movementX;
    this.lastMouseDeltaY = movementY;

    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;

    // Limit vertical look angle
    this.euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  };

  private onPointerDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    // If mouse was unlocked, clicking the canvas locks it back in!
    if (!this.isLocked) {
      this.lock();
    }

    if (!this.activeWorld) return;

    // Raycast from exact screen click position into the 3D world
    const rect = this.domElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.clickRaycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);
    this.clickRaycaster.far = 3.6;

    const interactiveMeshes = this.activeWorld.interactives.map((item) => item.mesh);
    const intersects = this.clickRaycaster.intersectObjects(interactiveMeshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const found = this.activeWorld.interactives.find((item) => {
        let current: THREE.Object3D | null = hitMesh;
        while (current) {
          if (current === item.mesh) return true;
          current = current.parent;
        }
        return false;
      });

      if (found) {
        this.onObjectClicked?.(found);
      }
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Toggle mouse pointer lock with Q
    if (e.code === 'KeyQ') {
      if (this.isLocked) {
        this.unlock();
      } else {
        this.lock();
      }
    }

    if (e.code === 'KeyF') {
      this.toggleFlashlight();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  public toggleFlashlight() {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.intensity = this.isFlashlightOn ? 42.0 : 0;
    this.flashlightManager.setFlashlightOn(this.isFlashlightOn);
    sound.playFlashlightClick();
  }

  public update(delta: number, world: StoreWorld) {
    this.activeWorld = world;

    if (!this.canMove) {
      this.flashlightManager.update(delta, false, false, 0, 0);
      this.updateRaycasting(world);
      return;
    }

    // Determine speed
    this.isCrouched = Boolean(this.keys['KeyC'] || this.keys['ControlLeft']);
    this.isSprinting = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !this.isCrouched;

    let targetSpeed = this.moveSpeed;
    if (this.isSprinting) targetSpeed = this.sprintSpeed;
    if (this.isCrouched) targetSpeed = this.crouchSpeed;

    // Calculate move direction in camera coordinate space
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) {
      moveDir.normalize();
    }

    // Velocity update with damping
    const accel = isMoving ? targetSpeed : 0;
    this.velocity.x = moveDir.x * accel;
    this.velocity.z = moveDir.z * accel;

    // Proposed new position
    const proposedPos = this.position.clone();
    proposedPos.x += this.velocity.x * delta;
    proposedPos.z += this.velocity.z * delta;

    // Collision Resolution with StoreWorld collision boxes
    this.resolveCollisions(proposedPos, world.collisionBoxes);

    // Height / Crouch interpolation
    const targetHeight = this.isCrouched ? this.crouchHeight : this.normalHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * 10 * delta;
    this.position.y = this.currentHeight;

    // Head bobbing
    if (isMoving && this.isLocked) {
      const bobSpeed = this.isSprinting ? 14 : 9;
      this.bobTimer += delta * bobSpeed;
      const bobOffset = Math.sin(this.bobTimer) * (this.isSprinting ? 0.05 : 0.025);
      this.camera.position.y = this.position.y + bobOffset;

      // Footstep audio
      this.footstepTimer += delta * (this.isSprinting ? 1.9 : 1.3);
      if (this.footstepTimer >= 0.7) {
        sound.playFootstep(this.isSprinting);
        this.footstepTimer = 0;
      }
    } else {
      this.camera.position.y = this.position.y;
      this.bobTimer = 0;
      this.footstepTimer = 0.5;
    }

    this.camera.position.x = this.position.x;
    this.camera.position.z = this.position.z;

    // Update Flashlight Viewmodel sway, walk bobbing, and idle breath
    this.flashlightManager.update(
      delta,
      isMoving && this.isLocked,
      this.isSprinting,
      this.lastMouseDeltaX,
      this.lastMouseDeltaY
    );
    this.lastMouseDeltaX = 0;
    this.lastMouseDeltaY = 0;

    // Raycast for interactive objects
    this.updateRaycasting(world);
  }

  private resolveCollisions(proposed: THREE.Vector3, boxes: THREE.Box3[]) {
    // Store & Exterior bounding perimeter: X (-17.5 to 17.5), Z (-41.5 to 14.2)
    proposed.x = Math.max(-17.5, Math.min(17.5, proposed.x));
    proposed.z = Math.max(-41.5, Math.min(14.2, proposed.z));

    const playerBox = new THREE.Box3();

    // De-penetration safety: if player is ever overlapping any collision box, push them out into open space
    const currentBox = new THREE.Box3();
    currentBox.setFromCenterAndSize(this.position, new THREE.Vector3(this.playerRadius * 2, 1.8, this.playerRadius * 2));
    for (const b of boxes) {
      if (currentBox.intersectsBox(b)) {
        const center = new THREE.Vector3();
        b.getCenter(center);
        const pushDir = this.position.clone().sub(center);
        pushDir.y = 0;
        if (pushDir.lengthSq() < 0.001) pushDir.set(-1, 0, 0);
        pushDir.normalize();
        this.position.addScaledVector(pushDir, 0.1);
      }
    }

    // Test X motion
    const testPosX = new THREE.Vector3(proposed.x, proposed.y, this.position.z);
    playerBox.setFromCenterAndSize(testPosX, new THREE.Vector3(this.playerRadius * 2, 1.8, this.playerRadius * 2));
    let collideX = false;
    for (const b of boxes) {
      if (playerBox.intersectsBox(b)) {
        collideX = true;
        break;
      }
    }
    if (!collideX) {
      this.position.x = proposed.x;
    }

    // Test Z motion
    const testPosZ = new THREE.Vector3(this.position.x, proposed.y, proposed.z);
    playerBox.setFromCenterAndSize(testPosZ, new THREE.Vector3(this.playerRadius * 2, 1.8, this.playerRadius * 2));
    let collideZ = false;
    for (const b of boxes) {
      if (playerBox.intersectsBox(b)) {
        collideZ = true;
        break;
      }
    }
    if (!collideZ) {
      this.position.z = proposed.z;
    }
  }

  private updateRaycasting(world: StoreWorld) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    this.raycaster.far = 3.2; // 3.2m interaction reach

    const interactiveMeshes = world.interactives.map((item) => item.mesh);
    const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      // Find matching interactive object (or parent)
      const found = world.interactives.find((item) => {
        let current: THREE.Object3D | null = hitMesh;
        while (current) {
          if (current === item.mesh) return true;
          current = current.parent;
        }
        return false;
      });

      this.targetedObject = found || null;
    } else {
      this.targetedObject = null;
    }
  }
}

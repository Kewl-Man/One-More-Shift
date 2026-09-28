import * as THREE from 'three';
import { sound } from '../audio/SoundManager';

// Procedural texture generators
export function createTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b8b4a6';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 64;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const isAlt = (x / tileSize + y / tileSize) % 2 === 0;
      ctx.fillStyle = isAlt ? '#c2beb0' : '#ada899';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      if (Math.random() > 0.4) {
        ctx.fillStyle = 'rgba(70, 60, 50, 0.08)';
        ctx.fillRect(x + 4 + Math.random() * 20, y + 4 + Math.random() * 20, 15, 8);
      }
    }
  }

  ctx.strokeStyle = '#5a554a';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 10);
  return texture;
}

export function createCeilingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dcdad1';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(60, 60, 60, 0.25)';
  for (let y = 8; y < 256; y += 12) {
    for (let x = 8; x < 256; x += 12) {
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#8a8880';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 10);
  return texture;
}

export function createSignTexture(text: string, sub: string, bgColor = '#1e3a5f', textColor = '#ffffff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = textColor;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 54);

  ctx.font = '18px monospace';
  ctx.fillStyle = '#dddddd';
  ctx.fillText(sub, 256, 92);

  return new THREE.CanvasTexture(canvas);
}

export function createEmergencyDoorSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Red background with dark border
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 512, 256);

  // Diagonal yellow/black hazard stripe top and bottom
  const stripeW = 24;
  for (let x = -stripeW; x < 512 + stripeW; x += stripeW * 2) {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW - 20, 24);
    ctx.lineTo(x - 20, 24);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, 232);
    ctx.lineTo(x + stripeW, 232);
    ctx.lineTo(x + stripeW - 20, 256);
    ctx.lineTo(x - 20, 256);
    ctx.fill();
  }

  // Inner white box
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 32, 480, 192);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMERGENCY EXIT ONLY', 256, 95);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('ALARM WILL SOUND', 256, 145);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('PUSH CRASH BAR TO OPEN', 256, 185);

  return new THREE.CanvasTexture(canvas);
}

export function createDarkAlleyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Very dark damp pavement
  ctx.fillStyle = '#0f1114';
  ctx.fillRect(0, 0, 512, 512);

  // Gritty noise and oil stains
  for (let i = 0; i < 9000; i++) {
    const v = Math.floor(10 + Math.random() * 25);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // Cracks and moisture puddles (NO yellow parking lines!)
  ctx.strokeStyle = '#050608';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 80;
      cy += (Math.random() - 0.5) * 80;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

export function createBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a2018';
  ctx.fillRect(0, 0, 256, 256);

  const brickH = 24;
  const brickW = 48;
  for (let y = 0; y < 256; y += brickH) {
    const isShifted = (y / brickH) % 2 === 1;
    const startX = isShifted ? -brickW / 2 : 0;
    for (let x = startX; x < 256 + brickW; x += brickW) {
      const shade = Math.floor(40 + Math.random() * 25);
      ctx.fillStyle = `rgb(${shade + 30}, ${shade - 10}, ${shade - 15})`;
      ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
    }
  }

  ctx.strokeStyle = '#181818';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 256; y += brickH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  return texture;
}

export function createConveyorBeltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#121417';
  ctx.fillRect(0, 0, 256, 256);

  const ribCount = 16;
  const ribHeight = 256 / ribCount;
  for (let i = 0; i < ribCount; i++) {
    const y = i * ribHeight;
    ctx.fillStyle = '#262a30';
    ctx.fillRect(0, y, 256, ribHeight * 0.45);

    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(0, y + ribHeight * 0.45, 256, ribHeight * 0.55);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, y + 1, 256, 1);
  }

  ctx.fillStyle = '#343840';
  ctx.fillRect(0, 0, 10, 256);
  ctx.fillRect(246, 0, 10, 256);

  ctx.fillStyle = '#ffaa00';
  for (let y = 8; y < 256; y += 32) {
    ctx.fillRect(10, y, 4, 16);
    ctx.fillRect(242, y, 4, 16);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 6);
  return texture;
}

export interface InteractiveObject {
  id: string;
  name: string;
  prompt: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  type?: 'register' | 'door' | 'telephone' | 'cctv' | 'breaker' | 'counter_item' | 'optical_scanner' | 'back_door';
}

export interface CCTVCameraDef {
  id: number;
  name: string;
  locationName: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

interface LightDampeningState {
  lightIndex: number;
  duration: number;
  remaining: number;
  targetFactor: number;
  flickerSpeed: number;
}

export class StoreWorld {
  public scene: THREE.Scene;
  public collisionBoxes: THREE.Box3[] = [];
  public interactives: InteractiveObject[] = [];
  public lights: THREE.PointLight[] = [];
  public isBlackout = false;
  private flickerTimer = 0;
  private activeLightDampeners: LightDampeningState[] = [];

  // Door states
  public isFrontDoorLocked = false;
  public isBackDoorOpen = false;
  public backDoorMesh: THREE.Group | null = null;
  public doorCollisionBox: THREE.Box3 | null = null;

  // Checkout conveyor & scanner
  public conveyorBeltMesh: THREE.Mesh | null = null;
  public conveyorTexture: THREE.CanvasTexture | null = null;
  public scannerLaserMesh: THREE.Mesh | null = null;
  public scannerLight: THREE.PointLight | null = null;
  private isConveyorMoving = false;
  private scannerPulseTimer = 0;

  // Rain & Exterior
  private rainParticles: THREE.Points | null = null;
  private stormFlashTimer = 0;
  private stormLight: THREE.DirectionalLight | null = null;

  // Spark particles & lights for broken breaker
  private sparkParticles: THREE.Points | null = null;
  public breakerSparkLight: THREE.PointLight | null = null;
  public breakerInteractiveObj: InteractiveObject | null = null;

  // Physical CCTV camera mesh groups
  public cctvMeshes: THREE.Group[] = [];

  // CCTV definitions (high vantage angles with clear sightlines, no obstructions)
  public cctvDefs: CCTVCameraDef[] = [
    {
      id: 1,
      name: 'CAM-01',
      locationName: 'FRONT PARKING LOT & ROUTE 9',
      position: new THREE.Vector3(0, 5.2, 17.5),
      target: new THREE.Vector3(0, 1.2, 38.0),
      fov: 74,
    },
    {
      id: 2,
      name: 'CAM-02',
      locationName: 'CHECKOUT CONVEYOR & REGISTER',
      position: new THREE.Vector3(-6.2, 3.6, 12.8),
      target: new THREE.Vector3(-8.8, 1.1, 9.8),
      fov: 68,
    },
    {
      id: 3,
      name: 'CAM-03',
      locationName: 'AISLE 1 & 2 (MAIN GROCERY)',
      // Shelves sit at x = -4.5 and x = 0.5 (each 1.6 wide), so the walkway between them is
      // centered around x = -2.0. The old x = 0.0 position sat INSIDE the x = 0.5 shelf's
      // footprint, which blocked this camera's own sightline partway down the aisle.
      position: new THREE.Vector3(-2.0, 3.6, 10.5),
      target: new THREE.Vector3(-2.0, 1.0, -10.0),
      fov: 70,
    },
    {
      id: 4,
      name: 'CAM-04',
      locationName: 'AISLE 6 (FAR RIGHT BLIND SPOT)',
      position: new THREE.Vector3(8.5, 3.6, 10.5),
      target: new THREE.Vector3(8.5, 1.0, -10.0),
      fov: 70,
    },
    {
      id: 5,
      name: 'CAM-05',
      locationName: 'BACK STORAGE ROOM & DESK',
      position: new THREE.Vector3(4.5, 3.6, -13.5),
      target: new THREE.Vector3(-3.0, 1.2, -18.2),
      fov: 70,
    },
    {
      id: 6,
      name: 'CAM-06',
      locationName: 'REAR DARK ALLEY & BREAKER',
      position: new THREE.Vector3(0.0, 3.6, -20.2),
      target: new THREE.Vector3(9.5, 1.6, -28.5),
      fov: 74,
    },
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildStore();
  }

  private buildStore() {
    const tileTex = createTileTexture();
    const ceilTex = createCeilingTexture();

    // 1. Store Floor (Z: -19 to 15, X: -13 to 13)
    const floorGeo = new THREE.PlaneGeometry(26, 34);
    const floorMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      roughness: 0.35,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Ceiling
    const ceilGeo = new THREE.PlaneGeometry(26, 34);
    const ceilMat = new THREE.MeshStandardMaterial({
      map: ceilTex,
      roughness: 0.9,
    });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 4.2, -2);
    this.scene.add(ceil);

    // 3. Perimeter Interior Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x909497,
      roughness: 0.85,
    });

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 34), wallMat);
    leftWall.position.set(-13, 2.1, -2);
    this.scene.add(leftWall);
    this.addCollision(leftWall);

    // Right Wall (Drink Coolers embedded)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 34), wallMat);
    rightWall.position.set(13, 2.1, -2);
    this.scene.add(rightWall);
    this.addCollision(rightWall);

    // Front Storefront
    this.buildFrontStorefront();

    // Compact Realistic Back Storage Partition (Z = -12)
    this.buildBackroomPartition();

    // Aisles
    this.buildAisles();

    // Cooler Wall
    this.buildCoolerWall();

    // Checkout Counter & Conveyor Belt & Wall Telephone
    this.buildCheckoutCounter();

    // Storage Room Interior & Rear Back Door
    this.buildStorageRoom();

    // Physical CCTV Camera Models
    this.buildCctvCameraMeshes();

    // Lighting Fixtures
    this.setupLighting();

    // Dark Rainy Exterior (Back Alley with Outdoor Electrical Breaker & Parking)
    this.buildExterior();
  }

  private addCollision(mesh: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(mesh);
    this.collisionBoxes.push(box);
  }

  private buildFrontStorefront() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88bbcc,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
      metalness: 0.1,
    });

    const leftFront = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 0.4), frameMat);
    leftFront.position.set(-8.5, 2.1, 15);
    this.scene.add(leftFront);
    this.addCollision(leftFront);

    const rightFront = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 0.4), frameMat);
    rightFront.position.set(8.5, 2.1, 15);
    this.scene.add(rightFront);
    this.addCollision(rightFront);

    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 0.4), frameMat);
    doorHeader.position.set(0, 3.6, 15);
    this.scene.add(doorHeader);

    // Neon Storefront Sign
    const signTex = createSignTexture('K&M MART', 'OPEN 24 HOURS • OVERNIGHT SHIFT', '#0a233b', '#62dbfb');
    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1.4, 0.2),
      new THREE.MeshStandardMaterial({ map: signTex, emissive: 0x0a2a4a, emissiveIntensity: 0.6 })
    );
    signMesh.position.set(0, 3.5, 15.3);
    this.scene.add(signMesh);

    // Front Sliding Glass Doors
    const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 3.0, 0.15), glassMat);
    frontDoor.position.set(0, 1.5, 15);
    this.scene.add(frontDoor);

    // Interactive Front Door Deadbolt
    const lockMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xcca022, metalness: 0.9, roughness: 0.2 })
    );
    lockMesh.rotation.z = Math.PI / 2;
    lockMesh.position.set(0.6, 1.4, 14.85);
    this.scene.add(lockMesh);

    this.interactives.push({
      id: 'front_door_lock',
      name: 'Front Door Deadbolt',
      prompt: 'Lock / Unlock Front Entrance [E]',
      mesh: lockMesh,
      position: new THREE.Vector3(0, 1.4, 14.8),
      type: 'door',
    });
  }

  private buildBackroomPartition() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x82888c, roughness: 0.85 });

    // Partition wall at Z = -12 (X: -13 to 13)
    // Left segment (X: -13 to -4)
    const partLeft = new THREE.Mesh(new THREE.BoxGeometry(9.0, 4.2, 0.3), wallMat);
    partLeft.position.set(-8.5, 2.1, -12);
    this.scene.add(partLeft);
    this.addCollision(partLeft);

    // Doorway opening (X: -4 to -1.6)
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.3), wallMat);
    doorHeader.position.set(-2.8, 3.5, -12);
    this.scene.add(doorHeader);

    // Right segment (X: -1.6 to 13)
    const partRight = new THREE.Mesh(new THREE.BoxGeometry(14.6, 4.2, 0.3), wallMat);
    partRight.position.set(5.7, 2.1, -12);
    this.scene.add(partRight);
    this.addCollision(partRight);

    // "EMPLOYEES ONLY" Warning Sign
    const empSignTex = createSignTexture('EMPLOYEES ONLY', 'AUTHORIZED STAFF ONLY', '#441111', '#ffcccc');
    const empSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.55, 0.05),
      new THREE.MeshStandardMaterial({ map: empSignTex })
    );
    empSign.position.set(-2.8, 3.2, -11.82);
    this.scene.add(empSign);
  }

  private buildAisles() {
    const shelfXPositions = [-4.5, 0.5, 5.5];
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.7, roughness: 0.4 });

    shelfXPositions.forEach((xPos, index) => {
      const aisleNum = index * 2 + 1;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 15), shelfMat);
      shelf.position.set(xPos, 1.2, -1);
      this.scene.add(shelf);
      this.addCollision(shelf);

      this.populateShelfItems(xPos);

      const aisleSignTex = createSignTexture(
        `AISLE ${aisleNum} & ${aisleNum + 1}`,
        index === 2 ? 'BEVERAGES • SPECIALS' : 'GROCERY • ESSENTIALS',
        '#1d2d44',
        '#ffffff'
      );
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ map: aisleSignTex })
      );
      sign.position.set(xPos, 3.2, 6.5);
      this.scene.add(sign);
    });
  }

  private populateShelfItems(shelfX: number) {
    const itemColors = [0xbb2222, 0x2277bb, 0x22aa55, 0xddaa22, 0x8844aa, 0xee7722];
    const itemMatCache = itemColors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));

    for (let z = -7; z <= 5; z += 1.8) {
      for (let tier = 0; tier < 3; tier++) {
        const y = 0.55 + tier * 0.75;
        const sideOffset = (Math.random() > 0.5 ? 1 : -1) * 0.72;
        const mat = itemMatCache[Math.floor(Math.random() * itemMatCache.length)];

        if (tier === 0) {
          const can = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 8), mat);
          can.position.set(shelfX + sideOffset, y, z);
          this.scene.add(can);
        } else {
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.18), mat);
          box.position.set(shelfX + sideOffset, y, z);
          this.scene.add(box);
        }
      }
    }
  }

  private buildCoolerWall() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x202428, metalness: 0.8, roughness: 0.2 });
    // NOTE: was MeshPhysicalMaterial + transmission, which forces a real-time transmission
    // render pass PER DOOR (6 of them here) and was a major source of frame lag. A transparent
    // MeshStandardMaterial reads as the same tinted glass at a fraction of the render cost.
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88bbcc,
      transparent: true,
      opacity: 0.4,
      roughness: 0.08,
      metalness: 0.1,
    });

    const coolerHousing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 18), frameMat);
    coolerHousing.position.set(12.3, 1.6, -1);
    this.scene.add(coolerHousing);
    this.addCollision(coolerHousing);

    for (let z = -8; z <= 6; z += 2.8) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.8, 2.4), glassMat);
      door.position.set(11.55, 1.6, z);
      this.scene.add(door);
    }

    // 2 optimized cooler bank lights instead of 6 separate point lights
    [-4, 3].forEach((z) => {
      const light = new THREE.PointLight(0xccf0ff, 6.0, 7.0);
      light.position.set(11.8, 2.2, z);
      this.scene.add(light);
    });
  }

  private buildCheckoutCounter() {
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.6 });

    // Main checkout counter
    const mainCounter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.05, 3.6), counterMat);
    mainCounter.position.set(-8.5, 0.525, 10.4);
    this.scene.add(mainCounter);
    this.addCollision(mainCounter);

    // Moving Conveyor Belt Mesh
    this.conveyorTexture = createConveyorBeltTexture();
    const beltMat = new THREE.MeshStandardMaterial({
      map: this.conveyorTexture,
      roughness: 0.85,
      metalness: 0.15,
    });
    this.conveyorBeltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 2.5), beltMat);
    this.conveyorBeltMesh.position.set(-8.5, 1.07, 10.95);
    this.conveyorBeltMesh.receiveShadow = true;
    this.scene.add(this.conveyorBeltMesh);

    // Metal guide rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5a6069, metalness: 0.85, roughness: 0.25 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.5), railMat);
    railL.position.set(-8.88, 1.11, 10.95);
    this.scene.add(railL);

    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.5), railMat);
    railR.position.set(-8.12, 1.11, 10.95);
    this.scene.add(railR);

    // Recessed Optical Barcode Scanner Zone (Z = 9.55)
    const scannerBezelMat = new THREE.MeshStandardMaterial({ color: 0x889098, metalness: 0.9, roughness: 0.2 });
    const scannerBezel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.025, 0.38), scannerBezelMat);
    scannerBezel.position.set(-8.5, 1.065, 9.55);
    this.scene.add(scannerBezel);

    const scannerGlassMat = new THREE.MeshStandardMaterial({
      color: 0x051a14,
      metalness: 0.6,
      roughness: 0.1,
      transparent: true,
      opacity: 0.92,
    });
    const scannerGlass = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.02, 0.28), scannerGlassMat);
    scannerGlass.position.set(-8.5, 1.072, 9.55);
    this.scene.add(scannerGlass);

    // Glowing Optical Laser Line Bar
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    this.scannerLaserMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.018), laserMat);
    this.scannerLaserMesh.rotation.x = -Math.PI / 2;
    this.scannerLaserMesh.position.set(-8.5, 1.078, 9.55);
    this.scene.add(this.scannerLaserMesh);

    this.scannerLight = new THREE.PointLight(0xff0022, 1.2, 1.4);
    this.scannerLight.position.set(-8.5, 1.15, 9.55);
    this.scene.add(this.scannerLight);

    const scannerHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    scannerHitbox.position.set(-8.5, 1.15, 9.55);
    this.scene.add(scannerHitbox);

    this.interactives.push({
      id: 'optical_scanner',
      name: 'Optical Barcode Scanner',
      prompt: 'Scan item on belt [Click or E]',
      mesh: scannerHitbox,
      position: new THREE.Vector3(-8.5, 1.15, 9.55),
      type: 'optical_scanner',
    });

    // Bagging Area Tray (Z = 8.85) - NO CARDBOARD BOXES
    const baggingTrayMat = new THREE.MeshStandardMaterial({ color: 0x444b54, metalness: 0.7, roughness: 0.35 });
    const baggingTray = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.03, 0.68), baggingTrayMat);
    baggingTray.position.set(-8.5, 1.06, 8.85);
    this.scene.add(baggingTray);

    // Cash Register POS Terminal (Z = 9.15)
    const regBaseMat = new THREE.MeshStandardMaterial({ color: 0x181b1e, metalness: 0.7, roughness: 0.3 });
    const regBase = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.42), regBaseMat);
    regBase.position.set(-8.5, 1.11, 9.15);
    this.scene.add(regBase);

    const screenMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.22, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x00220a, emissive: 0x00e644, emissiveIntensity: 0.45 })
    );
    screenMesh.position.set(-8.5, 1.28, 9.07);
    screenMesh.rotation.x = 0.2;
    this.scene.add(screenMesh);

    const regHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    regHitbox.position.set(-8.5, 1.2, 9.15);
    this.scene.add(regHitbox);

    this.interactives.push({
      id: 'register',
      name: 'Cash Register & POS',
      prompt: 'Access Register / Checkout Station [E]',
      mesh: regHitbox,
      position: new THREE.Vector3(-8.5, 1.2, 9.15),
      type: 'register',
    });

    // ==========================================
    // WALL-MOUNTED TELEPHONE
    // Mounted directly to the interior perimeter wall on the right side of the cashier station (X = -12.78, Y = 1.6, Z = 9.2)
    // ==========================================
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-12.78, 1.65, 9.2);
    phoneGroup.rotation.y = Math.PI / 2; // Facing the cashier (+X)

    const phoneBaseMat = new THREE.MeshStandardMaterial({ color: 0xb52222, roughness: 0.35 });
    const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.12), phoneBaseMat);
    phoneGroup.add(phoneBase);

    const dialMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.8, roughness: 0.2 });
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), dialMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, -0.04, 0.07);
    phoneGroup.add(dial);

    const forkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.06, 0.06), forkMat);
    fork.position.set(0, 0.15, 0.06);
    phoneGroup.add(fork);

    const handset = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.34, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.3 })
    );
    handset.position.set(0, 0.15, 0.11);
    phoneGroup.add(handset);

    this.scene.add(phoneGroup);

    const phoneHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    phoneHitbox.position.set(-12.4, 1.65, 9.2);
    this.scene.add(phoneHitbox);

    this.interactives.push({
      id: 'telephone',
      name: 'Wall-Mounted Telephone',
      prompt: 'Pick up the phone [E]',
      mesh: phoneHitbox,
      position: new THREE.Vector3(-12.4, 1.65, 9.2),
      type: 'telephone',
    });
  }

  private buildStorageRoom() {
    // Clean, atmospheric storage room (Z: -12 to -19, X: -13 to 13)
    const backStoreWallMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.85 });

    // Rear Store Building Wall with Back Exit Doorway at Z = -19
    // Left segment (X: -13 to -1.2)
    const wallRearL = new THREE.Mesh(new THREE.BoxGeometry(11.8, 4.2, 0.4), backStoreWallMat);
    wallRearL.position.set(-7.1, 2.1, -19.0);
    this.scene.add(wallRearL);
    this.addCollision(wallRearL);

    // Right segment (X: 1.2 to 13)
    const wallRearR = new THREE.Mesh(new THREE.BoxGeometry(11.8, 4.2, 0.4), backStoreWallMat);
    wallRearR.position.set(7.1, 2.1, -19.0);
    this.scene.add(wallRearR);
    this.addCollision(wallRearR);

    // Doorway Header (X: -1.2 to 1.2)
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.4), backStoreWallMat);
    doorHeader.position.set(0, 3.5, -19.0);
    this.scene.add(doorHeader);

    // ==========================================
    // REAR EMERGENCY EXIT DOOR (Leads to dark rainy alleyway)
    // ==========================================
    this.backDoorMesh = new THREE.Group();
    this.backDoorMesh.position.set(-1.1, 0, -19.0); // Hinge on left side of doorway

    const metalDoorMat = new THREE.MeshStandardMaterial({
      color: 0x242a32,
      metalness: 0.85,
      roughness: 0.3,
    });

    // 1. Reinforced Steel Door Leaf
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.76, 0.08), metalDoorMat);
    doorLeaf.position.set(1.1, 1.38, 0);
    doorLeaf.castShadow = true;
    doorLeaf.receiveShadow = true;
    this.backDoorMesh.add(doorLeaf);

    // Embossed inner panel bevels
    const panelBevelMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, metalness: 0.9, roughness: 0.4 });
    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.0, 0.02), panelBevelMat);
    topPanel.position.set(1.1, 1.85, 0.045);
    this.backDoorMesh.add(topPanel);

    const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.85, 0.02), panelBevelMat);
    bottomPanel.position.set(1.1, 0.65, 0.045);
    this.backDoorMesh.add(bottomPanel);

    // 2. High-Contrast Emergency Exit Warning Sign
    const exitSignTex = createEmergencyDoorSignTexture();
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.55),
      new THREE.MeshBasicMaterial({ map: exitSignTex })
    );
    signMesh.position.set(1.1, 1.75, 0.06);
    this.backDoorMesh.add(signMesh);

    // 3. Heavy Red Panic Crash Bar (Push Bar)
    const pushBarMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8, roughness: 0.2 });
    const pushBar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.7, 12), pushBarMat);
    pushBar.rotation.z = Math.PI / 2;
    pushBar.position.set(1.1, 1.15, 0.09);
    this.backDoorMesh.add(pushBar);

    // Crash bar mounting brackets
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
    const bracketL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.1), bracketMat);
    bracketL.position.set(0.32, 1.15, 0.05);
    this.backDoorMesh.add(bracketL);

    const bracketR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.1), bracketMat);
    bracketR.position.set(1.88, 1.15, 0.05);
    this.backDoorMesh.add(bracketR);

    // 4. Brushed Steel Kickplate at bottom
    const kickplateMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.25 });
    const kickplate = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.28, 0.02), kickplateMat);
    kickplate.position.set(1.1, 0.16, 0.045);
    this.backDoorMesh.add(kickplate);

    // Exterior Steel Handle Lever
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.08), handleMat);
    handle.position.set(1.95, 1.25, -0.06);
    this.backDoorMesh.add(handle);

    this.scene.add(this.backDoorMesh);

    // Doorway Heavy Steel Trim Frame
    const frameTrimMat = new THREE.MeshStandardMaterial({ color: 0x181c22, metalness: 0.9, roughness: 0.3 });
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.45), frameTrimMat);
    frameL.position.set(-1.18, 1.4, -19.0);
    this.scene.add(frameL);

    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.45), frameTrimMat);
    frameR.position.set(1.18, 1.4, -19.0);
    this.scene.add(frameR);

    // Door interaction hitbox
    const backDoorHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.8, 0.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    backDoorHitbox.position.set(0, 1.4, -19.0);
    this.scene.add(backDoorHitbox);

    this.interactives.push({
      id: 'back_door',
      name: 'Rear Service Exit Door',
      prompt: 'Open / Close Rear Exit Door [E]',
      mesh: backDoorHitbox,
      position: new THREE.Vector3(0, 1.4, -19.0),
      type: 'back_door',
    });

    // Solid collision barrier blocking doorway when door is CLOSED (prevents nocliping!)
    this.doorCollisionBox = new THREE.Box3(
      new THREE.Vector3(-1.18, 0, -19.3),
      new THREE.Vector3(1.18, 2.8, -18.7)
    );
    this.collisionBoxes.push(this.doorCollisionBox);

    // ==========================================
    // CCTV SURVEILLANCE DESK & CRT MONITORS
    // ==========================================
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-5.0, 0, -18.2);

    // Warm wooden laminate tabletop
    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x634d3b, roughness: 0.65, metalness: 0.1 });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), deskTopMat);
    deskTop.position.set(0, 0.92, 0);
    deskGroup.add(deskTop);

    // Steel frame legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x33373d, metalness: 0.8, roughness: 0.25 });
    const legPositions = [
      [-1.1, 0.44, -0.45],
      [1.1, 0.44, -0.45],
      [-1.1, 0.44, 0.45],
      [1.1, 0.44, 0.45],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.88, 12), legMat);
      leg.position.set(lx, ly, lz);
      deskGroup.add(leg);
    });

    // Computer keyboard and mouse pad
    const keyboardMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.5 });
    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.22), keyboardMat);
    keyboard.position.set(-0.2, 0.97, 0.25);
    deskGroup.add(keyboard);

    this.scene.add(deskGroup);

    // Collision box for the desk
    const deskCollision = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.95, 1.1),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    deskCollision.position.set(-5.0, 0.48, -18.2);
    this.scene.add(deskCollision);
    this.addCollision(deskCollision);

    const crtCasingMat = new THREE.MeshStandardMaterial({ color: 0x282c32, roughness: 0.5 });
    const crtScreenMat = new THREE.MeshBasicMaterial({ color: 0x184428 });

    const crt1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.55), crtCasingMat);
    crt1.position.set(-5.5, 1.28, -18.2);
    this.scene.add(crt1);

    const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.48), crtScreenMat);
    screen1.position.set(-5.5, 1.28, -17.92);
    this.scene.add(screen1);

    const crt2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.55), crtCasingMat);
    crt2.position.set(-4.5, 1.28, -18.2);
    this.scene.add(crt2);

    const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.48), crtScreenMat);
    screen2.position.set(-4.5, 1.28, -17.92);
    this.scene.add(screen2);

    this.interactives.push({
      id: 'cctv_terminal',
      name: 'Store CCTV Surveillance Terminal',
      prompt: 'View Live 3D CCTV Feeds [E]',
      mesh: crt1,
      position: new THREE.Vector3(-5.0, 1.2, -17.8),
      type: 'cctv',
    });
  }

  public toggleBackDoor() {
    this.isBackDoorOpen = !this.isBackDoorOpen;
    if (this.backDoorMesh) {
      this.backDoorMesh.rotation.y = this.isBackDoorOpen ? -Math.PI / 1.8 : 0;
    }

    // Dynamic collision toggling: remove barrier when open so player can walk through!
    if (this.doorCollisionBox) {
      if (this.isBackDoorOpen) {
        this.collisionBoxes = this.collisionBoxes.filter((b) => b !== this.doorCollisionBox);
      } else {
        if (!this.collisionBoxes.includes(this.doorCollisionBox)) {
          this.collisionBoxes.push(this.doorCollisionBox);
        }
      }
    }

    sound.playDoorLock();
  }

  private buildCctvCameraMeshes() {
    const camBodyMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, metalness: 0.7, roughness: 0.3 });
    const lensRingMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.9, roughness: 0.1 });
    const recLedMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    this.cctvMeshes = [];

    this.cctvDefs.forEach((camDef) => {
      const camGroup = new THREE.Group();
      camGroup.position.copy(camDef.position);

      const mountPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), camBodyMat);
      mountPlate.position.set(0, 0.02, 0);
      camGroup.add(mountPlate);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 8), camBodyMat);
      arm.position.set(0, -0.09, 0);
      camGroup.add(arm);

      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 0.32, 16), camBodyMat);
      housing.rotation.x = Math.PI / 2;
      housing.position.set(0, -0.18, 0.06);
      camGroup.add(housing);

      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 16), lensRingMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, -0.18, 0.22);
      camGroup.add(lens);

      const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), recLedMat);
      led.position.set(0.06, -0.14, 0.21);
      camGroup.add(led);

      camGroup.lookAt(camDef.target);
      this.scene.add(camGroup);
      this.cctvMeshes.push(camGroup);
    });
  }

  /**
   * Hides the active CCTV 3D camera mesh so the camera view is NEVER inside its own 3D model!
   */
  public setCctvActiveCamera(index: number | null) {
    this.cctvMeshes.forEach((mesh, idx) => {
      mesh.visible = index === null || idx !== index;
    });
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xdce8ff, 0x1f242e, 1.2);
    this.scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0x404856, 0.95);
    this.scene.add(ambient);

    // Fluorescent Ceiling Light Fixtures
    const lightPositions = [
      new THREE.Vector3(-6, 4.0, 8),
      new THREE.Vector3(2, 4.0, 8),
      new THREE.Vector3(-6, 4.0, 0),
      new THREE.Vector3(2, 4.0, 0),
      new THREE.Vector3(-6, 4.0, -6),
      new THREE.Vector3(2, 4.0, -6),
    ];

    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xeeffff,
      emissiveIntensity: 1.2,
    });

    lightPositions.forEach((pos) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 2.6), fixtureMat);
      frame.position.set(pos.x, 4.14, pos.z);
      this.scene.add(frame);

      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 2.2), tubeMat);
      tube.position.set(pos.x, 4.08, pos.z);
      this.scene.add(tube);

      const light = new THREE.PointLight(0xf4f8ff, 25.0, 22, 1.6);
      light.position.set(pos.x, 3.85, pos.z);
      this.scene.add(light);
      this.lights.push(light);
    });

    // Cash Register Overhead Light
    const regFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), fixtureMat);
    regFrame.position.set(-10.2, 4.14, 10.4);
    this.scene.add(regFrame);

    const counterLight = new THREE.PointLight(0xfff0dd, 22.0, 18, 1.6);
    counterLight.position.set(-10.2, 3.9, 10.4);
    this.scene.add(counterLight);
    this.lights.push(counterLight);

    // Storage Room Ceiling Fixture (Industrial cage fixture)
    const storageLampGroup = new THREE.Group();
    storageLampGroup.position.set(0, 4.14, -15.5);

    const lampCanopy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
    );
    lampCanopy.position.y = -0.03;
    storageLampGroup.add(lampCanopy);

    const cageMat = new THREE.MeshStandardMaterial({ color: 0x222222, wireframe: true });
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.35, 12, 3, true), cageMat);
    cage.position.y = -0.28;
    storageLampGroup.add(cage);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 1.5 })
    );
    bulb.position.y = -0.25;
    storageLampGroup.add(bulb);

    this.scene.add(storageLampGroup);

    const storageLight = new THREE.PointLight(0xffcc66, 20.0, 18, 1.6);
    storageLight.position.set(0, 3.85, -15.5);
    this.scene.add(storageLight);
    this.lights.push(storageLight);

    // Storm Thunder Flash Light
    this.stormLight = new THREE.DirectionalLight(0xaaccff, 0.0);
    this.stormLight.position.set(5, 15, 20);
    this.scene.add(this.stormLight);
  }

  private buildExterior() {
    // 1. Front Parking Lot (Z: 15 to 39)
    const frontAsphaltTex = new THREE.CanvasTexture(this.createAsphaltCanvas());
    frontAsphaltTex.wrapS = THREE.RepeatWrapping;
    frontAsphaltTex.wrapT = THREE.RepeatWrapping;
    frontAsphaltTex.repeat.set(6, 6);

    const frontParkingMat = new THREE.MeshStandardMaterial({
      map: frontAsphaltTex,
      roughness: 0.25,
      metalness: 0.2,
    });

    const parkingGeo = new THREE.PlaneGeometry(36, 24);
    const parking = new THREE.Mesh(parkingGeo, frontParkingMat);
    parking.rotation.x = -Math.PI / 2;
    parking.position.set(0, -0.02, 27);
    this.scene.add(parking);

    // Front Parking Stall Yellow Markings (Stalls at X = -8, -3.5, 3.5, 8; Z = 24)
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xddaa11 });
    const stallDividersX = [-10.2, -5.8, -1.2, 5.8, 10.2];
    stallDividersX.forEach((x) => {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 5.5), yellowStripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, -0.012, 24.5);
      this.scene.add(stripe);
    });

    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const barrierL = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 0.4), barrierMat);
    barrierL.position.set(-11, 0.45, 38.8);
    this.scene.add(barrierL);
    this.addCollision(barrierL);

    const barrierR = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 0.4), barrierMat);
    barrierR.position.set(11, 0.45, 38.8);
    this.scene.add(barrierR);
    this.addCollision(barrierR);

    // Parking lot light pole
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, metalness: 0.7 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 12), poleMat);
    pole.position.set(8.0, 3.75, 26);
    this.scene.add(pole);
    this.addCollision(pole);

    const streetLight = new THREE.PointLight(0xff9933, 30.0, 28, 1.8);
    streetLight.position.set(8.0, 7.2, 26);
    this.scene.add(streetLight);

    // ==========================================
    // 2. SCARY, DARK REAR SERVICE ALLEYWAY (Z: -19 to -44, X: -19 to 19)
    // Dark cracked pavement, NO parking lines, eerie fog & deep shadows
    // ==========================================
    const darkAlleyTex = createDarkAlleyTexture();
    const alleyMat = new THREE.MeshStandardMaterial({
      map: darkAlleyTex,
      roughness: 0.45,
      metalness: 0.15,
    });

    const alleyGeo = new THREE.PlaneGeometry(38, 28);
    const alley = new THREE.Mesh(alleyGeo, alleyMat);
    alley.rotation.x = -Math.PI / 2;
    alley.position.set(0, -0.02, -33);
    this.scene.add(alley);

    // Exterior Brick Building Wall with Doorway Opening Cutout at Z = -19.25
    // (NO BRICK WALL BLOCKING DOOR! Left & Right segments have doorway opening between X: -1.2 and 1.2)
    const brickTex = createBrickTexture();
    const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 });

    // Left exterior brick segment (X: -13 to -1.2)
    const rearExtWallL = new THREE.Mesh(new THREE.BoxGeometry(11.8, 4.6, 0.4), brickMat);
    rearExtWallL.position.set(-7.1, 2.3, -19.25);
    this.scene.add(rearExtWallL);
    this.addCollision(rearExtWallL);

    // Right exterior brick segment (X: 1.2 to 13)
    const rearExtWallR = new THREE.Mesh(new THREE.BoxGeometry(11.8, 4.6, 0.4), brickMat);
    rearExtWallR.position.set(7.1, 2.3, -19.25);
    this.scene.add(rearExtWallR);
    this.addCollision(rearExtWallR);

    // Lintel header above doorway (Y: 2.8 to 4.6)
    const rearExtHeader = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.4), brickMat);
    rearExtHeader.position.set(0, 3.7, -19.25);
    this.scene.add(rearExtHeader);

    // Outside Back Fence Barrier (Z = -44)
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x181c20, metalness: 0.9, roughness: 0.5 });
    const rearFence = new THREE.Mesh(new THREE.BoxGeometry(38, 3.5, 0.2), fenceMat);
    rearFence.position.set(0, 1.75, -44.5);
    this.scene.add(rearFence);
    this.addCollision(rearFence);

    // Left Alley Barrier (X = -18.5)
    const alleyFenceL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 28), fenceMat);
    alleyFenceL.position.set(-18.5, 1.75, -33);
    this.scene.add(alleyFenceL);
    this.addCollision(alleyFenceL);

    // Right Alley Barrier (X = 18.5)
    const alleyFenceR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 28), fenceMat);
    alleyFenceR.position.set(18.5, 1.75, -33);
    this.scene.add(alleyFenceR);
    this.addCollision(alleyFenceR);

    // Heavy Commercial Metal Dumpster in Alley (X = -8.0, Z = -27)
    const dumpsterMat = new THREE.MeshStandardMaterial({ color: 0x163422, metalness: 0.6, roughness: 0.55 });
    const dumpster = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 2.0), dumpsterMat);
    dumpster.position.set(-8.0, 0.9, -27);
    this.scene.add(dumpster);
    this.addCollision(dumpster);

    // Alley Overhead Security Floodlight (Dim flickering orange sodium glow)
    const alleySecurityLight = new THREE.PointLight(0xdd8833, 12.0, 16, 2.0);
    alleySecurityLight.position.set(0, 3.5, -20.2);
    this.scene.add(alleySecurityLight);

    // ==========================================
    // OUTDOOR MAIN ELECTRICAL BREAKER BOX & SUBSTATION
    // Relocated FARTHER AWAY in the dark scary back alley at X = 11.5, Y = 1.8, Z = -28.5
    // ==========================================
    // Concrete Transformer Base
    const padMat = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.9 });
    const transPad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 1.6), padMat);
    transPad.position.set(11.5, 0.2, -28.5);
    this.scene.add(transPad);
    this.addCollision(transPad);

    // Vertical Steel Conduit Pipes
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.85, roughness: 0.2 });
    const conduit1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 12), conduitMat);
    conduit1.position.set(11.0, 2.25, -28.7);
    this.scene.add(conduit1);

    const conduit2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 12), conduitMat);
    conduit2.position.set(12.0, 2.25, -28.7);
    this.scene.add(conduit2);

    // Breaker Cabinet Body
    const breakerMat = new THREE.MeshStandardMaterial({ color: 0x272e35, metalness: 0.9, roughness: 0.25 });
    const breakerBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.35), breakerMat);
    breakerBox.position.set(11.5, 1.8, -28.5);
    this.scene.add(breakerBox);
    this.addCollision(breakerBox);

    // High Voltage Danger Warning Decal
    const breakerSignTex = createSignTexture('DANGER 480V', 'MAIN CIRCUIT BREAKER PANEL', '#991b1b', '#fef08a');
    const stickerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.38),
      new THREE.MeshBasicMaterial({ map: breakerSignTex })
    );
    stickerMesh.position.set(11.5, 2.2, -28.32);
    this.scene.add(stickerMesh);

    // Local Spark Flashing Light for Broken Power
    this.breakerSparkLight = new THREE.PointLight(0x60a5fa, 0, 10, 2);
    this.breakerSparkLight.position.set(11.5, 1.8, -28.2);
    this.scene.add(this.breakerSparkLight);

    // Spark Particles for broken power
    const sparkGeo = new THREE.BufferGeometry();
    const sparkCount = 60;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = 11.5 + (Math.random() - 0.5) * 0.7;
      sparkPositions[i * 3 + 1] = 1.8 + (Math.random() - 0.5) * 0.7;
      sparkPositions[i * 3 + 2] = -28.3 + (Math.random() - 0.5) * 0.3;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    this.sparkParticles = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.08, transparent: true, opacity: 0.0 })
    );
    this.scene.add(this.sparkParticles);

    // Interactive Breaker Object
    this.breakerInteractiveObj = {
      id: 'breaker_box',
      name: 'Main Electrical Breaker Box',
      prompt: 'Electrical Box — View Electrical Box [E]',
      mesh: breakerBox,
      position: new THREE.Vector3(11.5, 1.8, -28.5),
      type: 'breaker',
    };
    this.interactives.push(this.breakerInteractiveObj);

    // Rain Particle System covering exterior zones
    this.createRain();
  }

  private createAsphaltCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 4000; i++) {
      const shade = Math.floor(20 + Math.random() * 30);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    ctx.fillStyle = '#9e851a';
    ctx.fillRect(30, 0, 8, 256);
    ctx.fillRect(160, 0, 8, 256);

    return canvas;
  }

  private createRain() {
    const rainCount = 2400;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 38;
      positions[i * 3 + 1] = Math.random() * 14;
      // Front parking lot or rear alley
      if (Math.random() > 0.45) {
        positions[i * 3 + 2] = 15.2 + Math.random() * 24;
      } else {
        positions[i * 3 + 2] = -19.2 - Math.random() * 23;
      }
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x99bbdd,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  // ==========================================
  // LIGHTING CONTROL METHODS
  // ==========================================
  public triggerSpecificLightDampening(lightIndex?: number, duration = 3.5, dimFactor = 0.2) {
    const idx =
      lightIndex !== undefined && lightIndex >= 0 && lightIndex < this.lights.length
        ? lightIndex
        : Math.floor(Math.random() * this.lights.length);

    const existing = this.activeLightDampeners.find((d) => d.lightIndex === idx);
    if (existing) {
      existing.duration = duration;
      existing.remaining = duration;
      existing.targetFactor = dimFactor;
    } else {
      this.activeLightDampeners.push({
        lightIndex: idx,
        duration,
        remaining: duration,
        targetFactor: dimFactor,
        flickerSpeed: 0.8 + Math.random() * 0.8,
      });
    }
  }

  public triggerBlackout() {
    this.isBlackout = true;
    this.lights.forEach((l) => (l.intensity = 0));
    if (this.sparkParticles) {
      (this.sparkParticles.material as THREE.PointsMaterial).opacity = 0.95;
    }
    if (this.breakerSparkLight) {
      this.breakerSparkLight.intensity = 14.0;
    }
    if (this.breakerInteractiveObj) {
      this.breakerInteractiveObj.prompt = 'Electrical Box [Sparks!] — Fix Damaged Wiring [E]';
    }
  }

  public restorePower() {
    this.isBlackout = false;
    this.activeLightDampeners = [];
    this.lights.forEach((l) => (l.intensity = 25.0));
    if (this.sparkParticles) {
      (this.sparkParticles.material as THREE.PointsMaterial).opacity = 0.0;
    }
    if (this.breakerSparkLight) {
      this.breakerSparkLight.intensity = 0.0;
    }
    if (this.breakerInteractiveObj) {
      this.breakerInteractiveObj.prompt = 'Electrical Box — View Electrical Box [E]';
    }
  }

  public triggerLightFlicker(duration = 2.5) {
    this.flickerTimer = duration;
  }

  public triggerStormFlash() {
    this.stormFlashTimer = 0.35;
    if (this.stormLight) {
      this.stormLight.intensity = 4.5;
    }
  }

  public updateConveyor(delta: number, isMoving: boolean) {
    this.isConveyorMoving = isMoving;

    if (this.conveyorTexture && isMoving) {
      this.conveyorTexture.offset.y -= (0.75 / 2.5) * delta;
    }

    if (this.scannerLaserMesh && this.scannerLight) {
      const laserMat = this.scannerLaserMesh.material as THREE.MeshBasicMaterial;

      if (this.scannerPulseTimer > 0) {
        this.scannerPulseTimer -= delta;
        laserMat.color.setHex(0x00ff66);
        this.scannerLight.color.setHex(0x00ff66);
        this.scannerLight.intensity = 2.8;
      } else {
        laserMat.color.setHex(0xff0022);
        this.scannerLight.color.setHex(0xff0022);
        this.scannerLight.intensity = 1.0 + Math.sin(performance.now() * 0.008) * 0.25;
      }
    }
  }

  public pulseScanner() {
    this.scannerPulseTimer = 0.22;
  }

  public update(delta: number) {
    this.updateConveyor(delta, this.isConveyorMoving);

    // Rain animation
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= delta * 20;
        if (pos[i] < 0) pos[i] = 14;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Storm lightning flash
    if (this.stormFlashTimer > 0) {
      this.stormFlashTimer -= delta;
      if (this.stormFlashTimer <= 0 && this.stormLight) {
        this.stormLight.intensity = 0.0;
      }
    }

    // Spark flicker on broken breaker
    if (this.isBlackout) {
      if (this.sparkParticles) {
        (this.sparkParticles.material as THREE.PointsMaterial).opacity = Math.random() > 0.5 ? 0.95 : 0.15;
      }
      if (this.breakerSparkLight) {
        this.breakerSparkLight.intensity = Math.random() > 0.45 ? 16.0 : 1.5;
      }
    }

    // Individual light dampening / isolated flickering
    if (!this.isBlackout && this.activeLightDampeners.length > 0) {
      for (let i = this.activeLightDampeners.length - 1; i >= 0; i--) {
        const d = this.activeLightDampeners[i];
        d.remaining -= delta;

        const light = this.lights[d.lightIndex];
        if (light) {
          if (d.remaining <= 0) {
            light.intensity = 25.0;
            this.activeLightDampeners.splice(i, 1);
          } else {
            // Modulate light intensity
            const flickerNoise = Math.random() > 0.3 ? 1.0 : 0.2;
            light.intensity = 25.0 * d.targetFactor * flickerNoise;
          }
        } else {
          this.activeLightDampeners.splice(i, 1);
        }
      }
    }

    // Global light flicker
    if (this.flickerTimer > 0) {
      this.flickerTimer -= delta;
      const flicker = Math.random() > 0.45 ? 1.0 : 0.08;
      this.lights.forEach((l) => {
        if (!this.isBlackout) {
          l.intensity = 25.0 * flicker;
        }
      });
      if (this.flickerTimer <= 0 && !this.isBlackout) {
        this.lights.forEach((l) => (l.intensity = 25.0));
      }
    }
  }
}

import * as THREE from 'three';

// Helper to generate dynamic procedural canvas textures
export function createTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Grimy yellowish-gray convenience store linoleum tile
  ctx.fillStyle = '#b8b4a6';
  ctx.fillRect(0, 0, 512, 512);

  // Tile grid (64x64 squares)
  const tileSize = 64;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#c2beb0' : '#ada899';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      // Subtle grime/scuffs
      if (Math.random() > 0.4) {
        ctx.fillStyle = 'rgba(70, 60, 50, 0.08)';
        ctx.fillRect(x + 4 + Math.random() * 20, y + 4 + Math.random() * 20, 15, 8);
      }
    }
  }

  // Grout lines
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
  texture.repeat.set(8, 12);
  return texture;
}

export function createCeilingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dcdad1';
  ctx.fillRect(0, 0, 256, 256);

  // Perforated acoustic dots
  ctx.fillStyle = 'rgba(60, 60, 60, 0.25)';
  for (let y = 8; y < 256; y += 12) {
    for (let x = 8; x < 256; x += 12) {
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Metal grid frame
  ctx.strokeStyle = '#8a8880';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 12);
  return texture;
}

export function createBoxTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b58a55'; // Cardboard brown
  ctx.fillRect(0, 0, 256, 256);

  // Tape strip across
  ctx.fillStyle = '#a87944';
  ctx.fillRect(0, 110, 256, 36);

  // Text label
  ctx.fillStyle = '#222';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('K&M MART SUPPLY', 20, 50);
  ctx.font = '14px monospace';
  ctx.fillText(label, 20, 80);
  ctx.fillText('FRAGILE // RETAIL USE', 20, 190);

  // Barcode
  ctx.fillStyle = '#111';
  for (let i = 20; i < 180; i += 4 + Math.random() * 4) {
    ctx.fillRect(i, 210, 2 + (Math.random() > 0.5 ? 2 : 0), 30);
  }

  return new THREE.CanvasTexture(canvas);
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

export interface InteractiveObject {
  id: string;
  name: string;
  prompt: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  type: string;
}

export class StoreWorld {
  public scene: THREE.Scene;
  public collisionBoxes: THREE.Box3[] = [];
  public interactives: InteractiveObject[] = [];
  public lights: THREE.PointLight[] = [];
  public emergencyLight: THREE.PointLight | null = null;
  public emergencyMesh: THREE.Mesh | null = null;
  public rainParticles: THREE.Points | null = null;
  public coolerDoors: THREE.Mesh[] = [];

  // Store dimensions: width X (-12 to +12), depth Z (-18 to +14), height Y (0 to 4.2)
  public isBlackout = false;
  public flickerTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildStore();
  }

  private buildStore() {
    const tileTex = createTileTexture();
    const ceilTex = createCeilingTexture();

    // 1. Floor
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

    // 3. Walls (Back, Left, Right, Front glass)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x909497,
      roughness: 0.85,
    });

    // Back Wall (Storage & Restroom divider)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(26, 4.2, 0.4), wallMat);
    backWall.position.set(0, 2.1, -19);
    this.scene.add(backWall);
    this.addCollision(backWall);

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

    // Front Wall with Glass Windows and Doors
    this.buildFrontStorefront();

    // Backroom / Storage Room Wall with Doorway
    this.buildBackroomPartition();

    // Aisles (Shelves with items)
    this.buildAisles();

    // Drink Coolers on the Right Wall
    this.buildCoolerWall();

    // Checkout Counter & Cash Register
    this.buildCheckoutCounter();

    // Storage Room Interior (Boxes, Breaker Panel, Red Phone, Mop)
    this.buildStorageRoom();

    // Security Office Desk & CCTV CRT Monitor
    this.buildSecurityStation();

    // Lighting Fixtures
    this.setupLighting();

    // Exterior / Parking Lot / Rain
    this.buildExterior();
  }

  private addCollision(mesh: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(mesh);
    this.collisionBoxes.push(box);
  }

  private buildFrontStorefront() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88bbcc,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.5,
    });

    // Front wall segments
    const leftFront = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 0.4), frameMat);
    leftFront.position.set(-8.5, 2.1, 15);
    this.scene.add(leftFront);
    this.addCollision(leftFront);

    const rightFront = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 0.4), frameMat);
    rightFront.position.set(8.5, 2.1, 15);
    this.scene.add(rightFront);
    this.addCollision(rightFront);

    // Header above door
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 0.4), frameMat);
    doorHeader.position.set(0, 3.6, 15);
    this.scene.add(doorHeader);

    // Store Neon Sign above front entrance
    const signTex = createSignTexture('K&M MART', 'OPEN 24 HOURS • OVERNIGHT SHIFT', '#0a233b', '#62dbfb');
    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1.4, 0.2),
      new THREE.MeshStandardMaterial({ map: signTex, emissive: 0x0a2a4a, emissiveIntensity: 0.6 })
    );
    signMesh.position.set(0, 3.5, 15.3);
    this.scene.add(signMesh);

    // Front Sliding Glass Doors
    const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(6, 3.0, 0.15), glassMat);
    doorGlass.position.set(0, 1.5, 15);
    this.scene.add(doorGlass);

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
      prompt: 'Lock / Unlock Front Entrance',
      mesh: lockMesh,
      position: new THREE.Vector3(0, 1.4, 14.8),
      type: 'door',
    });
  }

  private buildBackroomPartition() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x82888c, roughness: 0.85 });

    // Partition wall dividing store from backroom at Z = -11
    // Leaves a 2.4m door opening at X = -7.5
    const partLeft = new THREE.Mesh(new THREE.BoxGeometry(4, 4.2, 0.3), wallMat);
    partLeft.position.set(-11, 2.1, -11);
    this.scene.add(partLeft);
    this.addCollision(partLeft);

    const partRight = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 0.3), wallMat);
    partRight.position.set(5, 2.1, -11);
    this.scene.add(partRight);
    this.addCollision(partRight);

    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 0.3), wallMat);
    doorHeader.position.set(-7.7, 3.5, -11);
    this.scene.add(doorHeader);

    // "EMPLOYEES ONLY" Warning Sign above door
    const empSignTex = createSignTexture('EMPLOYEES ONLY', 'AUTHORIZED SHIFT WORKERS ONLY', '#441111', '#ffcccc');
    const empSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.6, 0.05),
      new THREE.MeshStandardMaterial({ map: empSignTex })
    );
    empSign.position.set(-7.7, 3.2, -10.8);
    this.scene.add(empSign);
  }

  private buildAisles() {
    // 4 Main Shelf units running along Z from -9 to +8
    // X positions: Aisle 1 & 2 (-4.5), Aisle 3 & 4 (0), Aisle 5 & 6 (+5)
    // Aisle 6 is the furthest and darkest aisle!
    const shelfXPositions = [-4.5, 0.5, 5.5];
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.7, roughness: 0.4 });

    shelfXPositions.forEach((xPos, index) => {
      const aisleNum = index * 2 + 1;
      // Shelf upright frame
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 15), shelfMat);
      shelf.position.set(xPos, 1.2, -1);
      this.scene.add(shelf);
      this.addCollision(shelf);

      // Populate shelf with procedural items (cans, cereal boxes, chips)
      this.populateShelfItems(xPos, aisleNum);

      // Hanging Aisle Number Sign
      const aisleSignTex = createSignTexture(`AISLE ${aisleNum} & ${aisleNum + 1}`, index === 2 ? 'BEVERAGES • SPECIALS' : 'GROCERY • ESSENTIALS', '#202830', '#f0f0f0');
      const aisleSign = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.6, 0.05),
        new THREE.MeshStandardMaterial({ map: aisleSignTex })
      );
      aisleSign.position.set(xPos, 3.2, 6.5);
      this.scene.add(aisleSign);

      // Aisle Restock Target Hitbox
      const restockTarget = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.8, 1.5),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      restockTarget.position.set(xPos + (index % 2 === 0 ? 0.9 : -0.9), 1.0, 0);
      this.scene.add(restockTarget);

      this.interactives.push({
        id: `shelf_restock_${index + 1}`,
        name: `Aisle ${aisleNum} Empty Shelf`,
        prompt: `Restock Aisle ${aisleNum} Products`,
        mesh: restockTarget,
        position: restockTarget.position.clone(),
        type: 'restock',
      });
    });

    // Floor Spills (puddles requiring mop)
    const spillTex = new THREE.CanvasTexture(this.createSpillCanvas());
    const spillGeo = new THREE.PlaneGeometry(1.8, 1.4);
    const spillMat = new THREE.MeshStandardMaterial({
      map: spillTex,
      transparent: true,
      roughness: 0.1,
      metalness: 0.2,
    });
    const spill = new THREE.Mesh(spillGeo, spillMat);
    spill.rotation.x = -Math.PI / 2;
    spill.position.set(-2.2, 0.02, 3.0);
    this.scene.add(spill);

    this.interactives.push({
      id: 'spill_1',
      name: 'Mysterious Liquid Spill',
      prompt: 'Clean Spill with Mop',
      mesh: spill,
      position: spill.position.clone(),
      type: 'mop',
    });
  }

  private createSpillCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 58);
    grad.addColorStop(0, 'rgba(80, 20, 15, 0.85)'); // Blood-tinged soda or mystery liquid
    grad.addColorStop(0.7, 'rgba(120, 30, 20, 0.7)');
    grad.addColorStop(1, 'rgba(120, 30, 20, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  private populateShelfItems(x: number, _aisleNum: number) {
    const itemColors = [0xcc2222, 0x2255cc, 0x22aa33, 0xddaa11, 0xdd6611, 0x772299];
    const canMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });

    // 3 shelves of items along Z
    for (let z = -7; z <= 6; z += 1.8) {
      // Left side boxes
      const boxMat = new THREE.MeshStandardMaterial({
        color: itemColors[Math.floor(Math.random() * itemColors.length)],
        roughness: 0.5,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.35), boxMat);
      box.position.set(x - 0.65, 1.4, z);
      this.scene.add(box);

      // Right side cans
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12), canMat);
      can.position.set(x + 0.65, 0.8, z);
      this.scene.add(can);
    }
  }

  private buildCoolerWall() {
    // 5 Drink Coolers along Right Wall (X = 12.5, Z from -8 to +8)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x99ddff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.3 });

    for (let i = 0; i < 5; i++) {
      const zPos = -7 + i * 3.4;

      // Cooler Frame & Back
      const coolerBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 3.0), frameMat);
      coolerBox.position.set(12.2, 1.6, zPos);
      this.scene.add(coolerBox);
      this.addCollision(coolerBox);

      // Glass door
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.0, 2.8), glassMat);
      door.position.set(11.55, 1.6, zPos);
      this.scene.add(door);
      this.coolerDoors.push(door);

      // Cooler interior neon tube light
      const coolerLight = new THREE.PointLight(0x70d0ff, 0.8, 4);
      coolerLight.position.set(11.8, 2.8, zPos);
      this.scene.add(coolerLight);
      this.lights.push(coolerLight);

      // Drink cans/bottles on shelves
      const drinkMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x00cc88 : 0xee2222,
        roughness: 0.2,
        metalness: 0.7,
      });
      for (let d = -1; d <= 1; d += 0.5) {
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 10), drinkMat);
        bottle.position.set(11.9, 1.2, zPos + d);
        this.scene.add(bottle);
      }
    }
  }

  private buildCheckoutCounter() {
    // Checkout Counter is near front entrance at X = -8, Z = 9 to 13
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x2d3238, roughness: 0.4, metalness: 0.2 });

    // L-shaped counter
    const mainCounter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 4.2), counterMat);
    mainCounter.position.set(-8.2, 0.55, 10.5);
    this.scene.add(mainCounter);
    this.addCollision(mainCounter);

    // Cash Register unit
    const registerBaseMat = new THREE.MeshStandardMaterial({ color: 0x1a1d20, metalness: 0.6, roughness: 0.3 });
    const regBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.6), registerBaseMat);
    regBase.position.set(-8.2, 1.22, 10.2);
    this.scene.add(regBase);

    // Digital Monitor screen (facing cashier)
    const screenMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.35, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x003311, emissive: 0x00ff44, emissiveIntensity: 0.4 })
    );
    screenMesh.position.set(-8.2, 1.55, 10.1);
    this.scene.add(screenMesh);

    // Barcode hand scanner cradle
    const scannerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xd92222 })
    );
    scannerMesh.position.set(-7.7, 1.2, 10.7);
    this.scene.add(scannerMesh);

    // Counter service bell
    const bellMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 })
    );
    bellMesh.position.set(-7.5, 1.15, 9.4);
    this.scene.add(bellMesh);

    // Register Interactive Hitbox
    const regHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 2.0), new THREE.MeshBasicMaterial({ visible: false }));
    regHitbox.position.set(-8.2, 1.2, 10.2);
    this.scene.add(regHitbox);

    this.interactives.push({
      id: 'register',
      name: 'Cash Register & POS System',
      prompt: 'Check Out Customer / Operate Register',
      mesh: regHitbox,
      position: new THREE.Vector3(-8.2, 1.2, 10.2),
      type: 'register',
    });

    // Cigarette and lottery display behind counter
    const cigRack = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.2, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.5 })
    );
    cigRack.position.set(-11.5, 2.1, 10.5);
    this.scene.add(cigRack);
    this.addCollision(cigRack);
  }

  private buildStorageRoom() {
    // Backroom is behind partition at Z < -11
    // 1. Circuit Breaker Box on wall
    const breakerMat = new THREE.MeshStandardMaterial({ color: 0x505860, metalness: 0.8, roughness: 0.3 });
    const breakerBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.7), breakerMat);
    breakerBox.position.set(-12.8, 2.0, -14);
    this.scene.add(breakerBox);

    // Warning sticker on breaker
    const breakerStickerTex = createSignTexture('HIGH VOLTAGE', 'DANGER // 480V MAIN', '#881111', '#ffff00');
    const stickerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.2),
      new THREE.MeshBasicMaterial({ map: breakerStickerTex })
    );
    stickerMesh.rotation.y = Math.PI / 2;
    stickerMesh.position.set(-12.69, 2.2, -14);
    this.scene.add(stickerMesh);

    this.interactives.push({
      id: 'breaker_box',
      name: 'Main Electrical Breaker Box',
      prompt: 'Reset Tripped Breakers',
      mesh: breakerBox,
      position: new THREE.Vector3(-12.6, 2.0, -14),
      type: 'breaker',
    });

    // 2. Storage Supply Boxes (Restock Crate source)
    const boxTex = createBoxTexture('BEVERAGE / SOUP RESTOCK');
    const crateMat = new THREE.MeshStandardMaterial({ map: boxTex });

    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.2), crateMat);
    crate1.position.set(-10.5, 0.4, -16.5);
    this.scene.add(crate1);
    this.addCollision(crate1);

    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), crateMat);
    crate2.position.set(-10.5, 1.15, -16.5);
    this.scene.add(crate2);

    this.interactives.push({
      id: 'restock_supply_crate',
      name: 'Product Inventory Crate',
      prompt: 'Pick up Restocking Supplies',
      mesh: crate1,
      position: new THREE.Vector3(-10.5, 0.8, -16.5),
      type: 'pickup_box',
    });

    // 3. Mop Bucket
    const bucketMat = new THREE.MeshStandardMaterial({ color: 0xddaa11, roughness: 0.3 });
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 16), bucketMat);
    bucket.position.set(-6, 0.25, -14);
    this.scene.add(bucket);

    const mopHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x997744 })
    );
    mopHandle.rotation.z = 0.2;
    mopHandle.position.set(-5.9, 0.9, -14);
    this.scene.add(mopHandle);

    this.interactives.push({
      id: 'mop_bucket',
      name: 'Cleaning Mop & Bucket',
      prompt: 'Grab Mop',
      mesh: bucket,
      position: new THREE.Vector3(-6, 0.5, -14),
      type: 'mop_tool',
    });

    // 4. The Corporate Red Emergency Phone (on desk in backroom)
    const phoneDesk = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x3d352e })
    );
    phoneDesk.position.set(-1, 0.45, -17.5);
    this.scene.add(phoneDesk);
    this.addCollision(phoneDesk);

    const phoneMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.3 }) // Ominous Red Rotary Phone
    );
    phoneMesh.position.set(-1, 0.98, -17.5);
    this.scene.add(phoneMesh);

    this.interactives.push({
      id: 'corporate_phone',
      name: 'Corporate Supervisor Hotline',
      prompt: 'Call Supervisor / Inquire Rule Guidance',
      mesh: phoneMesh,
      position: new THREE.Vector3(-1, 1.0, -17.5),
      type: 'phone',
    });
  }

  private buildSecurityStation() {
    // Security CCTV Station is in the back right corner (X = 8, Z = -16)
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.95, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0.4, roughness: 0.5 })
    );
    desk.position.set(8.5, 0.48, -16.5);
    this.scene.add(desk);
    this.addCollision(desk);

    // Multi-screen CRT monitors
    const crtCasingMat = new THREE.MeshStandardMaterial({ color: 0x181c20, roughness: 0.6 });
    const crtScreenMat = new THREE.MeshBasicMaterial({ color: 0x225533 }); // Glowing phosphor green

    const crt1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.55), crtCasingMat);
    crt1.position.set(8.0, 1.3, -16.5);
    this.scene.add(crt1);

    const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), crtScreenMat);
    screen1.position.set(8.0, 1.3, -16.22);
    this.scene.add(screen1);

    const crt2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.55), crtCasingMat);
    crt2.position.set(9.0, 1.3, -16.5);
    this.scene.add(crt2);

    const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), crtScreenMat);
    screen2.position.set(9.0, 1.3, -16.22);
    this.scene.add(screen2);

    // Terminal Keyboard
    const kb = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    kb.position.set(8.5, 0.98, -16.1);
    this.scene.add(kb);

    this.interactives.push({
      id: 'cctv_terminal',
      name: 'Store CCTV Security Monitor',
      prompt: 'Access Security Camera Feeds',
      mesh: crt1,
      position: new THREE.Vector3(8.5, 1.2, -16.0),
      type: 'cctv',
    });
  }

  private setupLighting() {
    // 6 Fluorescent ceiling light fixtures
    const lightPositions = [
      new THREE.Vector3(-6, 3.9, 8),
      new THREE.Vector3(2, 3.9, 8),
      new THREE.Vector3(-6, 3.9, 0),
      new THREE.Vector3(2, 3.9, 0),
      new THREE.Vector3(-6, 3.9, -6),
      new THREE.Vector3(2, 3.9, -6),
    ];

    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xeeffff,
      emissiveIntensity: 0.9,
    });

    lightPositions.forEach((pos) => {
      // Fixture frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 2.6), fixtureMat);
      frame.position.copy(pos);
      this.scene.add(frame);

      // Fluorescent tube
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 2.2), tubeMat);
      tube.position.set(pos.x, pos.y - 0.06, pos.z);
      this.scene.add(tube);

      // Light source
      const light = new THREE.PointLight(0xf4f8ff, 0.9, 12);
      light.position.set(pos.x, pos.y - 0.3, pos.z);
      light.castShadow = true;
      light.shadow.bias = -0.002;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      this.scene.add(light);
      this.lights.push(light);
    });

    // Storage Room Dim Yellow Light
    const storageLight = new THREE.PointLight(0xffcc66, 0.6, 9);
    storageLight.position.set(-6, 3.6, -15);
    this.scene.add(storageLight);
    this.lights.push(storageLight);

    // Emergency Red Beacon on ceiling
    const emergGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 16);
    const emergMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x330000,
      roughness: 0.2,
    });
    this.emergencyMesh = new THREE.Mesh(emergGeo, emergMat);
    this.emergencyMesh.position.set(0, 4.0, 0);
    this.scene.add(this.emergencyMesh);

    this.emergencyLight = new THREE.PointLight(0xff1100, 0.0, 16);
    this.emergencyLight.position.set(0, 3.8, 0);
    this.scene.add(this.emergencyLight);

    // Ambient night darkness
    const ambient = new THREE.AmbientLight(0x081018, 0.35);
    this.scene.add(ambient);
  }

  private buildExterior() {
    // Wet Dark Parking Lot asphalt in front of store (Z > 15)
    const asphaltTex = new THREE.CanvasTexture(this.createAsphaltCanvas());
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(6, 6);

    const lotGeo = new THREE.PlaneGeometry(50, 40);
    const lotMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.2,
      metalness: 0.1,
    });
    const lot = new THREE.Mesh(lotGeo, lotMat);
    lot.rotation.x = -Math.PI / 2;
    lot.position.set(0, -0.05, 34);
    this.scene.add(lot);

    // Exterior Streetlight in parking lot
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 7, 12), poleMat);
    pole.position.set(8, 3.5, 28);
    this.scene.add(pole);

    const lampLight = new THREE.PointLight(0xffa844, 1.4, 25);
    lampLight.position.set(8, 6.8, 28);
    this.scene.add(lampLight);

    // Rain Particles
    const rainCount = 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 40;
      rainPos[i + 1] = Math.random() * 12;
      rainPos[i + 2] = 15 + Math.random() * 25; // In parking lot
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x7799aa,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  private createAsphaltCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#181a1d';
    ctx.fillRect(0, 0, 256, 256);

    // Noise specks
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
    return canvas;
  }

  public update(delta: number) {
    // 1. Rain animation
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= delta * 18;
        if (pos[i] < 0) {
          pos[i] = 12;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Lighting flickers & blackout handling
    this.flickerTimer += delta;

    if (this.isBlackout) {
      // All main lights off
      this.lights.forEach((l) => (l.intensity = 0));

      // Rotating emergency beacon
      if (this.emergencyLight && this.emergencyMesh) {
        const pulse = Math.sin(this.flickerTimer * 6);
        this.emergencyLight.intensity = Math.max(0, pulse * 1.5);
        (this.emergencyMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.max(0, pulse * 2);
      }
    } else {
      if (this.emergencyLight) this.emergencyLight.intensity = 0;

      // Occasional atmospheric subtle flicker on ceiling lights
      const noise = Math.sin(this.flickerTimer * 3.7) * Math.cos(this.flickerTimer * 7.1);
      const isFlickering = noise > 0.85;

      this.lights.forEach((l, idx) => {
        if (idx === 2 && isFlickering) {
          l.intensity = Math.random() > 0.3 ? 0.9 : 0.1;
        } else {
          l.intensity = 0.9;
        }
      });
    }
  }

  public setBlackout(active: boolean) {
    this.isBlackout = active;
  }

  public triggerBlackout() {
    this.isBlackout = true;
  }

  public restorePower() {
    this.isBlackout = false;
  }
}

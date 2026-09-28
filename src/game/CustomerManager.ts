import * as THREE from 'three';
import { CustomerData, CustomerProduct } from '../types';
import { sound } from '../audio/SoundManager';
import { StoreWorld, InteractiveObject } from './StoreWorld';
import { TrafficManager, CarInstance } from './TrafficManager';

export interface PlacedItem {
  id: string;
  mesh: THREE.Mesh;
  product: CustomerProduct;
  scanned: boolean;
  stage: 'dropoff' | 'moving_to_scanner' | 'at_scanner' | 'moving_to_bagging' | 'bagged';
}

export class CustomerCharacter {
  public data: CustomerData;
  public group: THREE.Group;
  public state:
    | 'spawning'
    | 'walking_in'
    | 'browsing_to_shelf'
    | 'inspecting_shelf'
    | 'walking_to_counter'
    | 'at_counter'
    | 'leaving'
    | 'despawned' = 'spawning';
  public currentTarget: THREE.Vector3;
  public walkSpeed = 2.2;
  public placedItems: PlacedItem[] = [];
  public carInstance: CarInstance | null = null;
  public trafficManager: TrafficManager | null = null;

  // Animation joints
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private head: THREE.Mesh;
  private animTimer = 0;
  private headTurnTimer = 0;
  private browseTimer = 0;
  private hasChimedEntrance = false;

  constructor(data: CustomerData, scene: THREE.Scene, initialPos?: THREE.Vector3) {
    this.data = data;
    this.group = new THREE.Group();

    // Spawn point: Outside in parking lot or at car door
    const startPos = initialPos || new THREE.Vector3(0, 0, 24);
    this.group.position.copy(startPos);
    this.currentTarget = new THREE.Vector3(0, 0, 13); // Front entrance

    // Construct 3D Humanoid Mesh
    const skinMat = new THREE.MeshStandardMaterial({
      color: data.appearance.skinTone,
      roughness: 0.6,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: data.appearance.shirtColor,
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: data.appearance.pantsColor,
      roughness: 0.8,
    });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });

    // Distortion types for supernatural / eerie customers
    const isElongated = data.appearance.distortionType === 'elongated';
    const heightScale = isElongated ? 1.35 : 1.0;

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75 * heightScale, 0.3);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.15 * heightScale;
    this.group.add(torso);

    // Nametag if applicable (The "David" rule!)
    if (data.isNamedDavid) {
      const nametagGeo = new THREE.PlaneGeometry(0.18, 0.08);
      const nametagMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const nametag = new THREE.Mesh(nametagGeo, nametagMat);
      nametag.position.set(0.14, 1.35 * heightScale, 0.16);
      this.group.add(nametag);
    }

    // Head
    const headGeo = new THREE.BoxGeometry(0.32, 0.36, 0.32);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 1.7 * heightScale;
    this.group.add(this.head);

    // Hair or Hat
    if (data.appearance.hasHat) {
      const hatGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 12);
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.y = 1.9 * heightScale;
      this.group.add(hat);
    } else {
      const hairGeo = new THREE.BoxGeometry(0.34, 0.15, 0.34);
      const hairMat = new THREE.MeshStandardMaterial({ color: data.appearance.hairColor });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 1.84 * heightScale;
      this.group.add(hair);
    }

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({
      color: data.appearance.isSupernatural ? 0xcc0000 : 0x111111,
    });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), eyeMat);
    leftEye.position.set(-0.08, 1.72 * heightScale, 0.17);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), eyeMat);
    rightEye.position.set(0.08, 1.72 * heightScale, 0.17);
    this.group.add(rightEye);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.75 * heightScale, 0.2);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.16, 0.45 * heightScale, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.16, 0.45 * heightScale, 0);
    this.group.add(this.rightLeg);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.18, 0.12, 0.28);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.16, 0.06, 0.04);
    this.group.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.16, 0.06, 0.04);
    this.group.add(rightShoe);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.7 * heightScale, 0.14);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.36, 1.15 * heightScale, 0);
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.36, 1.15 * heightScale, 0);
    this.group.add(this.rightArm);

    scene.add(this.group);
  }

  public update(delta: number, world: StoreWorld, onArrivedAtCounter: (customer: CustomerCharacter) => void) {
    // 1. Door chime when entering front doors
    if (!this.hasChimedEntrance && this.group.position.z <= 16.0) {
      this.hasChimedEntrance = true;
      sound.playDoorChime();
    }

    // 3. Customer AI Behavior States
    if (this.state === 'spawning') {
      this.state = 'walking_in';
      this.currentTarget = new THREE.Vector3(0, 0, 13);
    }

    if (this.state === 'walking_in') {
      this.navigateTowards(this.currentTarget, delta, () => {
        // Decide shopping route based on customer items!
        const hasBeverage = this.data.products.some(
          (p) => p.shape === 'bottle' || p.name.toLowerCase().includes('cola') || p.name.toLowerCase().includes('water')
        );

        if (hasBeverage) {
          // Walk to refrigerated cooler wall on the right
          this.currentTarget = new THREE.Vector3(10.2, 0, (Math.random() - 0.5) * 6);
        } else {
          // Walk to grocery aisle shelves
          this.currentTarget = new THREE.Vector3(-2.8, 0, (Math.random() - 0.5) * 4);
        }
        this.state = 'browsing_to_shelf';
      });
    } else if (this.state === 'browsing_to_shelf') {
      this.navigateTowards(this.currentTarget, delta, () => {
        // Arrived at shelf/cooler! Pause to inspect and grab item
        this.state = 'inspecting_shelf';
        this.browseTimer = 2.4;
        // Face the shelves
        if (this.currentTarget.x > 5) {
          this.group.rotation.y = Math.PI / 2; // Face cooler glass (+X)
        } else {
          this.group.rotation.y = -Math.PI / 2; // Face shelf (-X)
        }
        // Reach arm out towards products on shelf
        this.rightArm.rotation.x = -Math.PI / 2.3;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
      });
    } else if (this.state === 'inspecting_shelf') {
      this.browseTimer -= delta;
      if (this.browseTimer <= 0) {
        // Put arm down and proceed to checkout counter
        this.rightArm.rotation.x = 0;
        this.currentTarget = new THREE.Vector3(-6.8, 0, 10.4); // Customer waiting spot in front of counter
        this.state = 'walking_to_counter';
      }
    } else if (this.state === 'walking_to_counter') {
      this.navigateTowards(this.currentTarget, delta, () => {
        this.state = 'at_counter';
        // Face the cashier across the checkout counter (towards X = -10.2, Z = 9.8)
        const toCashier = new THREE.Vector3(-10.2, 0, 9.8).sub(this.group.position);
        this.group.rotation.y = Math.atan2(toCashier.x, toCashier.z);
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;

        // Customer places items on moving conveyor belt & rings service bell
        this.placeItemsOnCounter(world);
        sound.playServiceBell();
        onArrivedAtCounter(this);
      });
    } else if (this.state === 'leaving') {
      const exitPos = this.carInstance
        ? new THREE.Vector3(-1.4, 0, 0).applyMatrix4(this.carInstance.visuals.group.matrixWorld)
        : new THREE.Vector3(0, 0, 26);

      this.navigateTowards(exitPos, delta, () => {
        if (this.carInstance && this.trafficManager) {
          // Open door, customer enters, close door, drive off!
          const car = this.carInstance;
          sound.playCarDoor();
          car.visuals.driverDoor.rotation.y = -0.75;
          setTimeout(() => {
            car.visuals.driverDoor.rotation.y = 0;
            this.trafficManager?.dispatchCustomerDeparture(car, () => {});
          }, 600);
        }
        this.state = 'despawned';
      });
    }

    // Supernatural head twitch for eerie customers
    if (this.data.appearance.distortionType === 'twitching' && this.state === 'at_counter') {
      this.headTurnTimer += delta;
      if (Math.sin(this.headTurnTimer * 4) > 0.7) {
        this.head.rotation.z = Math.sin(this.headTurnTimer * 16) * 0.35;
      } else {
        this.head.rotation.z = 0;
      }
    }

    // -----------------------------------------------------------------
    // FUNCTIONAL CONVEYOR BELT ITEM ANIMATION (CONSTANT VELOCITY)
    // Animates items from drop-off point towards scanner zone and bagging
    // -----------------------------------------------------------------
    if (this.placedItems.length > 0) {
      const BELT_SPEED = 0.75; // meters per second constant velocity
      const SCANNER_ZONE_Z = 9.55; // aligned with optical barcode scanner glass
      const BAGGING_ZONE_Z = 8.85; // aligned with stainless steel bagging tray
      let isBeltMoving = false;

      // 1. Process unscanned items moving from drop-off point towards scanner zone
      const unscanned = this.placedItems.filter((item) => !item.scanned);
      unscanned.forEach((item, queueIdx) => {
        // First unscanned item stops directly over optical scanner; subsequent items queue behind with realistic spacing
        const targetZ = SCANNER_ZONE_Z + queueIdx * 0.38;

        if (item.mesh.position.z > targetZ) {
          // Constant velocity update towards scanner zone
          item.mesh.position.z -= BELT_SPEED * delta;
          if (item.mesh.position.z <= targetZ) {
            item.mesh.position.z = targetZ;
            item.stage = queueIdx === 0 ? 'at_scanner' : 'moving_to_scanner';
          } else {
            item.stage = 'moving_to_scanner';
          }
          isBeltMoving = true;
        } else {
          item.stage = queueIdx === 0 ? 'at_scanner' : 'moving_to_scanner';
        }

        // Keep interactive raycast hitbox position synchronized with moving 3D mesh
        const io = world.interactives.find((obj) => obj.id === item.id || obj.mesh === item.mesh);
        if (io) {
          io.position.copy(item.mesh.position);
          if (item.stage === 'at_scanner') {
            io.prompt = `Scan ${item.product.name} ($${item.product.price.toFixed(2)}) [Click or E]`;
          } else {
            io.prompt = `${item.product.name} (Moving on belt...)`;
          }
        }
      });

      // 2. Process scanned items moving past scanner into bagging zone
      const scanned = this.placedItems.filter((item) => item.scanned);
      scanned.forEach((item, bagIdx) => {
        const targetZ = BAGGING_ZONE_Z - Math.min(bagIdx, 3) * 0.22;

        if (item.mesh.position.z > targetZ) {
          // Constant velocity update into bagging zone
          item.mesh.position.z -= BELT_SPEED * delta;
          if (item.mesh.position.z <= targetZ) {
            item.mesh.position.z = targetZ;
            item.stage = 'bagged';
          } else {
            item.stage = 'moving_to_bagging';
          }
          isBeltMoving = true;
        } else {
          item.stage = 'bagged';
        }

        // Keep interactive object position updated
        const io = world.interactives.find((obj) => obj.id === item.id || obj.mesh === item.mesh);
        if (io) {
          io.position.copy(item.mesh.position);
        }
      });

      // 3. Update conveyor belt mesh texture and motor audio
      world.updateConveyor(delta, isBeltMoving);
      if (isBeltMoving) {
        sound.startConveyorBelt();
      } else {
        sound.stopConveyorBelt();
      }
    }
  }

  private navigateTowards(target: THREE.Vector3, delta: number, onArrival: () => void) {
    const diff = target.clone().sub(this.group.position);
    diff.y = 0;
    const dist = diff.length();

    if (dist > 0.35) {
      diff.normalize();
      this.group.position.addScaledVector(diff, this.walkSpeed * delta);
      const lookAngle = Math.atan2(diff.x, diff.z);
      this.group.rotation.y = lookAngle;

      // Leg & Arm swinging animation
      this.animTimer += delta * 9;
      this.leftLeg.rotation.x = Math.sin(this.animTimer) * 0.6;
      this.rightLeg.rotation.x = -Math.sin(this.animTimer) * 0.6;
      this.leftArm.rotation.x = -Math.sin(this.animTimer) * 0.5;
      this.rightArm.rotation.x = Math.sin(this.animTimer) * 0.5;
    } else {
      onArrival();
    }
  }

  public placeItemsOnCounter(world: StoreWorld) {
    this.cleanupItems(world);

    // Items are placed at the conveyor belt drop-off point (customer end of belt: Z = 11.8 to 12.6)
    const dropoffStartZ = 11.85;
    this.data.products.forEach((prod, i) => {
      const zOffset = dropoffStartZ + i * 0.42;
      let mesh: THREE.Mesh;

      if (prod.shape === 'can') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16),
          new THREE.MeshStandardMaterial({ color: prod.color, metalness: 0.7, roughness: 0.25 })
        );
      } else if (prod.shape === 'bottle') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.08, 0.30, 16),
          new THREE.MeshStandardMaterial({ color: prod.color, transparent: true, opacity: 0.88, roughness: 0.1 })
        );
      } else if (prod.shape === 'meat') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.10, 0.30),
          new THREE.MeshStandardMaterial({ color: 0x881111, roughness: 0.3 })
        );
      } else {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.20, 0.24, 0.14),
          new THREE.MeshStandardMaterial({ color: prod.color, roughness: 0.45 })
        );
      }

      // Position: On the moving conveyor belt surface
      mesh.position.set(-8.5, 1.15, zOffset);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { isCounterItem: true, product: prod, index: i };
      world.scene.add(mesh);

      const itemId = `item_${prod.id}_${i}`;

      // Register item as interactive object in world
      world.interactives.push({
        id: itemId,
        name: prod.name,
        prompt: `Scan ${prod.name} ($${prod.price.toFixed(2)}) [Click or E]`,
        mesh,
        position: mesh.position.clone(),
        type: 'counter_item',
      });

      this.placedItems.push({
        id: itemId,
        mesh,
        product: prod,
        scanned: false,
        stage: 'moving_to_scanner',
      });
    });
  }

  public markItemScanned(prodId: string, world?: StoreWorld) {
    const item = this.placedItems.find((p) => p.product.id === prodId && !p.scanned);
    if (item) {
      item.scanned = true;
      item.stage = 'moving_to_bagging';
      // Trigger optical scanner flash & audio
      sound.playBarcodeBeep();
      if (world) {
        world.pulseScanner();
      }
    }
  }

  public leave(world: StoreWorld) {
    this.cleanupItems(world);
    this.state = 'leaving';
    sound.playDoorChime();
  }

  public cleanupItems(world: StoreWorld) {
    sound.stopConveyorBelt();
    world.updateConveyor(0, false);
    this.placedItems.forEach((item) => {
      world.scene.remove(item.mesh);
      world.interactives = world.interactives.filter((io) => io.mesh !== item.mesh);
    });
    this.placedItems = [];
  }

  public destroy(world: StoreWorld) {
    this.cleanupItems(world);
    world.scene.remove(this.group);
  }
}

export class CustomerManager {
  private scene: THREE.Scene;
  private currentCustomer: CustomerCharacter | null = null;
  public onCustomerReady: ((customer: CustomerCharacter) => void) | null = null;
  public trafficManager: TrafficManager | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnCustomer(data: CustomerData) {
    if (this.currentCustomer) {
      // In case previous hasn't despawned, remove
      this.scene.remove(this.currentCustomer.group);
      this.currentCustomer = null;
    }

    if (this.trafficManager) {
      // Car drives in from highway, turns into parking lot, parks in stall, customer steps out!
      this.trafficManager.dispatchCustomerCar((spawnPos, car) => {
        const char = new CustomerCharacter(data, this.scene, spawnPos);
        char.carInstance = car;
        char.trafficManager = this.trafficManager;
        this.currentCustomer = char;
      });
    } else {
      this.currentCustomer = new CustomerCharacter(data, this.scene);
    }
  }

  public getCurrentCustomer(): CustomerCharacter | null {
    return this.currentCustomer;
  }

  public dismissCurrent(world: StoreWorld) {
    if (this.currentCustomer) {
      this.currentCustomer.leave(world);
    }
  }

  public update(delta: number, world: StoreWorld) {
    if (this.currentCustomer) {
      this.currentCustomer.update(delta, world, (c) => {
        if (this.onCustomerReady) {
          this.onCustomerReady(c);
        }
      });

      if (this.currentCustomer.state === 'despawned') {
        this.currentCustomer.destroy(world);
        this.currentCustomer = null;
      }
    } else {
      world.updateConveyor(delta, false);
      sound.stopConveyorBelt();
    }
  }
}

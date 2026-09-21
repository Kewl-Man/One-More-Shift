import * as THREE from 'three';
import { CustomerData, ShiftNumber } from '../types';
import { sound } from '../audio/SoundManager';
import { StoreWorld, InteractiveObject } from './StoreWorld';

export class CustomerCharacter {
  public data: CustomerData;
  public group: THREE.Group;
  public state: 'spawning' | 'walking_in' | 'browsing' | 'at_counter' | 'waiting_checkout' | 'leaving' | 'despawned' = 'spawning';
  public targetPos: THREE.Vector3;
  public walkSpeed = 2.2;
  public placedItems: THREE.Mesh[] = [];

  // Animation joints
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private head: THREE.Mesh;
  private animTimer = 0;
  private headTurnTimer = 0;

  constructor(data: CustomerData, scene: THREE.Scene) {
    this.data = data;
    this.group = new THREE.Group();

    // Spawn point: Outside in parking lot (Z = 22, X = 0)
    this.group.position.set(0, 0, 22);
    this.targetPos = new THREE.Vector3(-6.8, 0, 10.5); // Waiting spot at checkout counter

    // Construct 3D Humanoid Mesh
    const skinMat = new THREE.MeshStandardMaterial({ color: data.appearance.skinTone, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: data.appearance.shirtColor,
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: data.appearance.pantsColor, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });

    // Supernatural distortion adjustments
    const isDistorted = data.appearance.distortionType === 'elongated';
    const heightScale = isDistorted ? 1.35 : 1.0;

    // Pelvis & Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75 * heightScale, 0.3);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.15 * heightScale;
    this.group.add(torso);

    // Nametag if applicable
    if (data.isNamedDavid) {
      const nametagGeo = new THREE.PlaneGeometry(0.18, 0.08);
      const nametagMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const nametag = new THREE.Mesh(nametagGeo, nametagMat);
      nametag.position.set(0.14, 1.35, 0.16);
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
    if (this.state === 'spawning') {
      this.state = 'walking_in';
      sound.playDoorChime();
    }

    if (this.state === 'walking_in' || this.state === 'leaving') {
      const target = this.state === 'walking_in' ? this.targetPos : new THREE.Vector3(0, 0, 24);
      const diff = target.clone().sub(this.group.position);
      diff.y = 0;
      const dist = diff.length();

      if (dist > 0.3) {
        diff.normalize();
        this.group.position.addScaledVector(diff, this.walkSpeed * delta);
        const lookAngle = Math.atan2(diff.x, diff.z);
        this.group.rotation.y = lookAngle;

        // Walk cycle animation
        this.animTimer += delta * 9;
        this.leftLeg.rotation.x = Math.sin(this.animTimer) * 0.6;
        this.rightLeg.rotation.x = -Math.sin(this.animTimer) * 0.6;
        this.leftArm.rotation.x = -Math.sin(this.animTimer) * 0.5;
        this.rightArm.rotation.x = Math.sin(this.animTimer) * 0.5;
      } else {
        if (this.state === 'walking_in') {
          this.state = 'at_counter';
          this.group.rotation.y = -Math.PI / 2; // Face the counter
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
          this.leftArm.rotation.x = 0;
          this.rightArm.rotation.x = 0;

          // Customer places items on counter & rings bell
          this.placeItemsOnCounter(world);
          sound.playServiceBell();
          onArrivedAtCounter(this);
        } else if (this.state === 'leaving') {
          this.state = 'despawned';
        }
      }
    }

    // Supernatural head twitch for eerie customers
    if (this.data.appearance.isSupernatural && this.state === 'at_counter') {
      this.headTurnTimer += delta;
      if (Math.sin(this.headTurnTimer * 3) > 0.8) {
        this.head.rotation.z = Math.sin(this.headTurnTimer * 12) * 0.35;
      } else {
        this.head.rotation.z = 0;
      }
    }
  }

  private placeItemsOnCounter(world: StoreWorld) {
    // Clear previous
    this.cleanupItems(world.scene);

    const startZ = 9.8;
    this.data.products.forEach((prod, i) => {
      const zOffset = startZ + i * 0.45;
      let mesh: THREE.Mesh;

      if (prod.name.toLowerCase().includes('bean') || prod.name.toLowerCase().includes('can')) {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12),
          new THREE.MeshStandardMaterial({ color: prod.color || 0xbb5522, metalness: 0.6 })
        );
      } else if (prod.name.toLowerCase().includes('battery')) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.18, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 })
        );
      } else {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.26, 0.12),
          new THREE.MeshStandardMaterial({ color: prod.color || 0x2266bb })
        );
      }

      mesh.position.set(-7.5, 1.18, zOffset);
      world.scene.add(mesh);
      this.placedItems.push(mesh);
    });
  }

  public leave(world: StoreWorld) {
    this.cleanupItems(world.scene);
    this.state = 'leaving';
    sound.playDoorChime();
  }

  public cleanupItems(scene: THREE.Scene) {
    this.placedItems.forEach((item) => scene.remove(item));
    this.placedItems = [];
  }

  public destroy(scene: THREE.Scene) {
    this.cleanupItems(scene);
    scene.remove(this.group);
  }
}

export class CustomerManager {
  private scene: THREE.Scene;
  private currentCustomer: CustomerCharacter | null = null;
  public onCustomerReady: ((customer: CustomerCharacter) => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnCustomer(data: CustomerData) {
    if (this.currentCustomer) {
      this.currentCustomer.destroy(this.scene);
      this.currentCustomer = null;
    }

    this.currentCustomer = new CustomerCharacter(data, this.scene);
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
        this.currentCustomer.destroy(this.scene);
        this.currentCustomer = null;
      }
    }
  }
}

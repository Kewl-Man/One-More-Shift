import * as THREE from 'three';
import { sound } from '../audio/SoundManager';
import { PlayerController } from './PlayerController';
import { StoreWorld } from './StoreWorld';

export class EntityManager {
  private scene: THREE.Scene;

  // 1. The Lurker in Aisle 6
  public aisle6Man: THREE.Group | null = null;
  public aisle6Head: THREE.Mesh | null = null;
  public aisle6ManActive = false;
  private aisle6NeckTwisted = false;
  private aisle6SwayTimer = 0;
  public onAisle6Violated: (() => void) | null = null;

  // 2. The Rain Watcher / Rear Alley Creeper
  public watcherMesh: THREE.Group | null = null;
  public watcherLocation: 'none' | 'parking' | 'window' | 'back_alley' = 'none';
  private watcherStareTimer = 0;

  // 3. The False Shopper (Mimic Anomaly)
  public mimicMesh: THREE.Group | null = null;
  public mimicActive = false;

  // Horror tracking
  public anxietyLevel = 0; // 0 to 100
  public isSanityCritical = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // ==========================================
  // 1. THE LURKER IN AISLE 6
  // ==========================================
  public spawnAisle6Man() {
    if (this.aisle6Man) return;

    this.aisle6Man = new THREE.Group();
    // Positioned at end of Aisle 6 (X = 5.5, Z = -7.8), facing away towards back wall (-Z)
    this.aisle6Man.position.set(5.5, 0, -7.8);
    this.aisle6Man.rotation.y = Math.PI;

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.95,
      metalness: 0.1,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x7c858e,
      roughness: 0.4,
    });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x440808 });

    // Torso: Tall, unnaturally thin
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.35, 0.26), suitMat);
    torso.position.y = 1.4;
    this.aisle6Man.add(torso);

    // Dark necktie
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.04), tieMat);
    tie.position.set(0, 1.48, 0.14);
    this.aisle6Man.add(tie);

    // Head
    const headGeo = new THREE.BoxGeometry(0.28, 0.38, 0.3);
    this.aisle6Head = new THREE.Mesh(headGeo, skinMat);
    this.aisle6Head.position.y = 2.25;
    this.aisle6Man.add(this.aisle6Head);

    // Unsettling eyes on front
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), eyeMat);
    eyeL.position.set(-0.07, 2.28, 0.16);
    this.aisle6Man.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), eyeMat);
    eyeR.position.set(0.07, 2.28, 0.16);
    this.aisle6Man.add(eyeR);

    // Hair
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x050505 })
    );
    hair.position.set(0, 2.36, -0.02);
    this.aisle6Man.add(hair);

    // Arms: Long and slender
    const armGeo = new THREE.BoxGeometry(0.12, 1.2, 0.12);
    const armL = new THREE.Mesh(armGeo, suitMat);
    armL.position.set(-0.35, 1.25, 0);
    this.aisle6Man.add(armL);

    const armR = new THREE.Mesh(armGeo, suitMat);
    armR.position.set(0.35, 1.25, 0);
    this.aisle6Man.add(armR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.95, 0.2);
    const legL = new THREE.Mesh(legGeo, suitMat);
    legL.position.set(-0.15, 0.48, 0);
    this.aisle6Man.add(legL);

    const legR = new THREE.Mesh(legGeo, suitMat);
    legR.position.set(0.15, 0.48, 0);
    this.aisle6Man.add(legR);

    this.scene.add(this.aisle6Man);
    this.aisle6ManActive = true;
    this.aisle6NeckTwisted = false;
  }

  public removeAisle6Man() {
    if (this.aisle6Man) {
      this.scene.remove(this.aisle6Man);
      this.aisle6Man = null;
      this.aisle6Head = null;
      this.aisle6ManActive = false;
      this.aisle6NeckTwisted = false;
    }
  }

  // ==========================================
  // 2. THE RAIN WATCHER / REAR ALLEY CREEPER
  // ==========================================
  public spawnWatcher(location: 'parking' | 'window' | 'back_alley') {
    if (!this.watcherMesh) {
      this.watcherMesh = new THREE.Group();

      const coatMat = new THREE.MeshStandardMaterial({
        color: 0x07080a,
        roughness: 0.92,
      });

      // Long heavy overcoat
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.46, 1.8, 12), coatMat);
      coat.position.y = 1.2;
      this.watcherMesh.add(coat);

      // Slender neck and shadowed head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), coatMat);
      head.position.y = 2.22;
      this.watcherMesh.add(head);

      // Wide brim fedora hat
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 16), coatMat);
      hatBrim.position.y = 2.34;
      this.watcherMesh.add(hatBrim);

      const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.18, 16), coatMat);
      hatCrown.position.y = 2.44;
      this.watcherMesh.add(hatCrown);

      // Pinpoint glowing eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
      const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), eyeMat);
      eye1.position.set(-0.06, 2.22, 0.16);
      this.watcherMesh.add(eye1);

      const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), eyeMat);
      eye2.position.set(0.06, 2.22, 0.16);
      this.watcherMesh.add(eye2);

      this.scene.add(this.watcherMesh);
    }

    this.watcherLocation = location;
    if (location === 'parking') {
      this.watcherMesh.position.set(3, 0, 24);
      this.watcherMesh.rotation.y = Math.PI;
    } else if (location === 'window') {
      this.watcherMesh.position.set(-1.2, 0, 16.0);
      this.watcherMesh.rotation.y = Math.PI;
    } else if (location === 'back_alley') {
      // Lurking in the dark rain behind dumpster
      this.watcherMesh.position.set(7.2, 0, -26.5);
      this.watcherMesh.rotation.y = 0;
    }
  }

  public removeWatcher() {
    if (this.watcherMesh) {
      this.scene.remove(this.watcherMesh);
      this.watcherMesh = null;
      this.watcherLocation = 'none';
    }
  }

  // ==========================================
  // 3. THE FALSE SHOPPER (MIMIC)
  // ==========================================
  public spawnMimic() {
    if (this.mimicMesh) return;
    this.mimicMesh = new THREE.Group();
    this.mimicMesh.position.set(10.8, 0, 2.0); // Facing the cooler glass
    this.mimicMesh.rotation.y = Math.PI / 2;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, roughness: 0.8 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), bodyMat);
    torso.position.y = 1.2;
    this.mimicMesh.add(torso);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.35, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x8a9098, roughness: 0.5 })
    );
    head.position.y = 1.75;
    this.mimicMesh.add(head);

    this.scene.add(this.mimicMesh);
    this.mimicActive = true;
  }

  public removeMimic() {
    if (this.mimicMesh) {
      this.scene.remove(this.mimicMesh);
      this.mimicMesh = null;
      this.mimicActive = false;
    }
  }

  // ==========================================
  // UPDATE LOOP (Behavior & Rules Enforcement)
  // ==========================================
  public update(delta: number, player: PlayerController, world: StoreWorld) {
    // 1. Aisle 6 Man Behavior
    if (this.aisle6ManActive && this.aisle6Man && this.aisle6Head) {
      this.aisle6SwayTimer += delta * 1.5;
      this.aisle6Man.position.y = Math.sin(this.aisle6SwayTimer) * 0.02;

      const manPos = this.aisle6Man.position;
      const playerPos = player.position;

      // Check Rule Violation: Walking directly behind him!
      const isBehindHim =
        playerPos.z > manPos.z &&
        playerPos.z < manPos.z + 2.5 &&
        Math.abs(playerPos.x - manPos.x) < 1.1;

      if (isBehindHim && !this.aisle6NeckTwisted) {
        this.aisle6NeckTwisted = true;
        sound.playNeckSnap();
        sound.playHorrorStinger();

        // 180-degree neck twist!
        this.aisle6Head.rotation.y = Math.PI;
        this.aisle6Head.rotation.z = 0.42;
        this.anxietyLevel = 100;

        if (this.onAisle6Violated) {
          this.onAisle6Violated();
        }
      }
    }

    // 2. Watcher Outside Window / Back Alley Behavior
    if (this.watcherMesh && this.watcherLocation === 'window') {
      const dist = this.watcherMesh.position.distanceTo(player.position);
      if (player.isFlashlightOn && dist < 7) {
        this.watcherStareTimer += delta;
        if (this.watcherStareTimer > 3.8) {
          this.watcherStareTimer = 0;
          sound.playWindowKnock();
          this.anxietyLevel = Math.min(100, this.anxietyLevel + 35);
        }
      } else {
        this.watcherStareTimer = Math.max(0, this.watcherStareTimer - delta);
      }
    }

    // Anxiety decay
    if (this.anxietyLevel > 0) {
      this.anxietyLevel = Math.max(0, this.anxietyLevel - delta * 4.5);
    }
    this.isSanityCritical = this.anxietyLevel > 70;
  }
}

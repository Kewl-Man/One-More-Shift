import * as THREE from 'three';
import { sound } from '../audio/SoundManager';
import { PlayerController } from './PlayerController';
import { StoreWorld } from './StoreWorld';

export class EntityManager {
  private scene: THREE.Scene;

  // The Man in Aisle 6
  public aisle6Man: THREE.Group | null = null;
  public aisle6Head: THREE.Mesh | null = null;
  public aisle6ManActive = false;
  private aisle6NeckTwisted = false;
  public onAisle6Violated: (() => void) | null = null;

  // The Watcher
  public watcherMesh: THREE.Group | null = null;
  public watcherLocation: 'none' | 'parking' | 'aisle6' | 'backroom' | 'window' = 'none';
  public watcherVisibleOnCam = false;

  // Horror jump/incident triggers
  public anxietyLevel = 0; // 0 to 100
  public isSanityCritical = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnAisle6Man() {
    if (this.aisle6Man) return;

    this.aisle6Man = new THREE.Group();
    // Positioned at end of Aisle 6 (X = 5.5, Z = -8.2), facing away towards back wall (-Z)
    this.aisle6Man.position.set(5.5, 0, -8.2);
    this.aisle6Man.rotation.y = Math.PI; // Facing back wall

    const suitMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x99a3a4, roughness: 0.5 }); // Unnaturally pale

    // Body
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.3), suitMat);
    torso.position.y = 1.25;
    this.aisle6Man.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.3, 0.35, 0.3);
    this.aisle6Head = new THREE.Mesh(headGeo, skinMat);
    this.aisle6Head.position.y = 1.85;
    this.aisle6Man.add(this.aisle6Head);

    // Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), suitMat);
    legL.position.set(-0.16, 0.4, 0);
    this.aisle6Man.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), suitMat);
    legR.position.set(0.16, 0.4, 0);
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

  public spawnWatcher(location: 'parking' | 'aisle6' | 'backroom' | 'window') {
    if (!this.watcherMesh) {
      this.watcherMesh = new THREE.Group();

      // Slender tall shadowy silhouette
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x050508 }); // Pitch black
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.25), shadowMat);
      torso.position.y = 1.4;
      this.watcherMesh.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), shadowMat);
      head.position.y = 2.3;
      this.watcherMesh.add(head);

      // Faint glowing white pinprick eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), eyeMat);
      eye1.position.set(-0.07, 2.3, 0.18);
      this.watcherMesh.add(eye1);

      const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), eyeMat);
      eye2.position.set(0.07, 2.3, 0.18);
      this.watcherMesh.add(eye2);

      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.2), shadowMat);
      legs.position.y = 0.55;
      this.watcherMesh.add(legs);

      this.scene.add(this.watcherMesh);
    }

    this.watcherLocation = location;
    if (location === 'parking') {
      this.watcherMesh.position.set(0, 0, 24);
      this.watcherMesh.rotation.y = Math.PI;
    } else if (location === 'aisle6') {
      this.watcherMesh.position.set(5.5, 0, 2);
      this.watcherMesh.rotation.y = -Math.PI / 2;
    } else if (location === 'backroom') {
      this.watcherMesh.position.set(-7, 0, -16);
      this.watcherMesh.rotation.y = 0;
    } else if (location === 'window') {
      this.watcherMesh.position.set(4, 0, 16);
      this.watcherMesh.rotation.y = Math.PI;
    }
  }

  public removeWatcher() {
    if (this.watcherMesh) {
      this.scene.remove(this.watcherMesh);
      this.watcherMesh = null;
      this.watcherLocation = 'none';
    }
  }

  public update(delta: number, player: PlayerController, world: StoreWorld) {
    // Check Aisle 6 Man interaction & rule adherence
    if (this.aisle6ManActive && this.aisle6Man && this.aisle6Head) {
      const manPos = this.aisle6Man.position;
      const playerPos = player.position;

      const dist = manPos.distanceTo(playerPos);

      // Rule: Do not walk behind him!
      // He is facing towards -Z. Walking behind him means player is at Z > manPos.z (between man and front store)
      // and close enough to trigger.
      const isBehindHim = playerPos.z > manPos.z && playerPos.z < manPos.z + 2.8 && Math.abs(playerPos.x - manPos.x) < 1.2;

      if (isBehindHim && !this.aisle6NeckTwisted) {
        this.aisle6NeckTwisted = true;
        sound.playHorrorStinger();
        // Neck snaps around 180 degrees!
        this.aisle6Head.rotation.y = Math.PI;
        this.aisle6Head.rotation.z = 0.35; // Horrific tilt
        this.anxietyLevel = 100;

        if (this.onAisle6Violated) {
          this.onAisle6Violated();
        }
      }
    }

    // Anxiety decay / pulse
    if (this.anxietyLevel > 0) {
      this.anxietyLevel = Math.max(0, this.anxietyLevel - delta * 4);
    }
    this.isSanityCritical = this.anxietyLevel > 70;
  }
}

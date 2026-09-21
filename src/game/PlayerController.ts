import * as THREE from 'three';
import { sound } from '../audio/SoundManager';
import { StoreWorld, InteractiveObject } from './StoreWorld';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  public isLocked = false;
  public flashlight: THREE.SpotLight;
  public flashlightMesh: THREE.Mesh;
  public isFlashlightOn = false;

  // Movement parameters
  private moveSpeed = 4.2;
  private sprintSpeed = 6.8;
  private crouchSpeed = 2.4;
  private playerRadius = 0.45;
  private normalHeight = 1.75;
  private crouchHeight = 1.1;
  private currentHeight = 1.75;

  // Head bobbing
  private bobTimer = 0;
  private footstepTimer = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  public isCrouched = false;
  public isSprinting = false;
  public canMove = true;

  // Interactive targeting
  private raycaster = new THREE.Raycaster();
  public targetedObject: InteractiveObject | null = null;
  public mouseSensitivity = 0.0022;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    // Initial start position: Behind the front cash register counter!
    this.position = new THREE.Vector3(-9.2, this.normalHeight, 10.5);
    this.camera.position.copy(this.position);
    this.euler.y = -Math.PI / 2; // Facing the front doors and register

    // Flashlight
    this.flashlight = new THREE.SpotLight(0xfff0dd, 0, 18, Math.PI / 5, 0.4, 1.2);
    this.flashlight.position.copy(this.camera.position);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 512;
    this.flashlight.shadow.mapSize.height = 512;

    // Small physical flashlight model parented to camera
    const torchGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.25, 8);
    const torchMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    this.flashlightMesh = new THREE.Mesh(torchGeo, torchMat);
    this.flashlightMesh.rotation.x = Math.PI / 2;
    this.flashlightMesh.position.set(0.28, -0.22, -0.4);

    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
  }

  public lock() {
    this.domElement.requestPointerLock?.();
  }

  public unlock() {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  private onPointerLockChange = () => {
    this.isLocked = document.pointerLockElement === this.domElement;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isLocked || !this.canMove) return;

    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;

    // Limit vertical look angle
    this.euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyF') {
      this.toggleFlashlight();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  public toggleFlashlight() {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.intensity = this.isFlashlightOn ? 2.5 : 0;
    sound.playFlashlightClick();
  }

  public update(delta: number, world: StoreWorld) {
    if (!this.canMove) {
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

    // Sync Flashlight position and direction
    this.flashlight.position.copy(this.camera.position);
    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlight.target.position.copy(this.camera.position).add(forwardDir.multiplyScalar(5));
    this.flashlight.target.updateMatrixWorld();

    // Raycast for interactive objects
    this.updateRaycasting(world);
  }

  private resolveCollisions(proposed: THREE.Vector3, boxes: THREE.Box3[]) {
    // Store bounding perimeter: X (-12.2 to 12.2), Z (-18.2 to 14.2)
    proposed.x = Math.max(-12.2, Math.min(12.2, proposed.x));
    proposed.z = Math.max(-18.2, Math.min(14.2, proposed.z));

    const playerBox = new THREE.Box3();

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

import * as THREE from 'three';
import { sound } from '../audio/SoundManager';

export interface CarVisuals {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  headlightL: THREE.Mesh;
  headlightR: THREE.Mesh;
  headlightBeamPool: THREE.Mesh;
  taillightL: THREE.Mesh;
  taillightR: THREE.Mesh;
  reverseLightL: THREE.Mesh;
  reverseLightR: THREE.Mesh;
  blinkerFL: THREE.Mesh;
  blinkerFR: THREE.Mesh;
  blinkerRL: THREE.Mesh;
  blinkerRR: THREE.Mesh;
  driverDoor: THREE.Group;
}

export type CarState =
  | 'cruising'
  | 'approaching_driveway'
  | 'turning_into_lot'
  | 'parking_into_stall'
  | 'parked'
  | 'reversing_out_of_stall'
  | 'turning_onto_road'
  | 'accelerating_away';

export interface CarInstance {
  id: string;
  visuals: CarVisuals;
  lane: 'west' | 'east' | 'lot'; // west = going -X, east = going +X
  speed: number;
  targetSpeed: number;
  state: CarState;
  color: number;
  isHeadlightsOn: boolean;
  isReverseLightsOn: boolean;
  blinkerState: 'none' | 'left' | 'right';
  targetPos?: THREE.Vector3;
  targetRotY?: number;
  assignedStallIndex?: number;
  isCustomerCar?: boolean;
  onCustomerSteppedOut?: () => void;
  onDeparted?: () => void;
  stateTimer?: number;
}

export const CAR_COLORS = [
  0x1e3a8a, // Deep Navy Blue
  0x881337, // Burgundy Red
  0x064e3b, // Forest Green
  0x1f2937, // Charcoal Black
  0xe2e8f0, // Pearl White
  0x78350f, // Amber Copper
  0x94a3b8, // Silver Metallic
  0xca8a04, // Classic Mustard / Tan
  0x475569, // Slate Grey
];

export class TrafficManager {
  public scene: THREE.Scene;
  public cars: CarInstance[] = [];
  public roadGroup: THREE.Group;

  // Road coordinates
  // Highway spans X: -90 to +90
  // Lane 1 (Westbound / moving -X): Z = 43.5
  // Lane 2 (Eastbound / moving +X): Z = 47.5
  private readonly ROAD_Z_WEST = 43.5;
  private readonly ROAD_Z_EAST = 47.5;
  private readonly DRIVEWAY_X = 0.0;
  private readonly DRIVEWAY_Z = 38.0;

  // Parking stalls in the front convenience store lot (facing the store)
  public readonly parkingStalls = [
    { pos: new THREE.Vector3(-8.0, 0, 24.0), rotY: 0, occupied: false },
    { pos: new THREE.Vector3(-3.5, 0, 24.0), rotY: 0, occupied: false },
    { pos: new THREE.Vector3(3.5, 0, 24.0), rotY: 0, occupied: false },
    { pos: new THREE.Vector3(8.0, 0, 24.0), rotY: 0, occupied: true }, // Ambient parked car
  ];

  private blinkerTimer = 0;
  private blinkerActive = false;
  private spawnTimerWest = 0;
  private spawnTimerEast = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);

    this.buildRoadNetwork();
    this.spawnInitialTraffic();
  }

  /**
   * Builds the 2-lane asphalt highway, road markings, curbs, and streetlights
   */
  private buildRoadNetwork() {
    // 1. Two-Lane Highway Asphalt Surface (X: -95 to 95, Z: 39 to 52)
    const roadWidth = 13.0; // Z width
    const roadLength = 190.0; // X length
    const roadGeo = new THREE.PlaneGeometry(roadLength, roadWidth);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.82,
      metalness: 0.18,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, -0.015, 45.5);
    roadMesh.receiveShadow = true;
    this.roadGroup.add(roadMesh);

    // 2. Double Solid Yellow Center Line (separating Westbound & Eastbound lanes)
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xddaa11 });
    const line1 = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.14), yellowMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(0, -0.008, 45.38);
    this.roadGroup.add(line1);

    const line2 = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.14), yellowMat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(0, -0.008, 45.62);
    this.roadGroup.add(line2);

    // 3. White Outer Shoulder Lines
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const shoulderNorth = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.16), whiteMat);
    shoulderNorth.rotation.x = -Math.PI / 2;
    shoulderNorth.position.set(0, -0.008, 40.2);
    this.roadGroup.add(shoulderNorth);

    const shoulderSouth = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.16), whiteMat);
    shoulderSouth.rotation.x = -Math.PI / 2;
    shoulderSouth.position.set(0, -0.008, 50.8);
    this.roadGroup.add(shoulderSouth);

    // 4. Highway Streetlights along the far shoulder
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333940, metalness: 0.8 });
    const lampPositionsX = [-60, -30, 0, 30, 60];
    lampPositionsX.forEach((x) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 8.5, 12), poleMat);
      pole.position.set(x, 4.25, 51.5);
      this.roadGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.2), poleMat);
      arm.position.set(x, 8.4, 50.4);
      this.roadGroup.add(arm);

      // Sodium light fixture (emissive glow)
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.18, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xffcc77, emissive: 0xff9922, emissiveIntensity: 1.4 })
      );
      fixture.position.set(x, 8.3, 49.6);
      this.roadGroup.add(fixture);
    });

    // 2 high-performance highway area fill lights instead of 5 individual point lights
    [-30, 30].forEach((x) => {
      const light = new THREE.PointLight(0xffa044, 24.0, 48, 1.6);
      light.position.set(x, 8.0, 49.6);
      this.roadGroup.add(light);
    });
  }

  /**
   * Spawns initial moving traffic and an ambient parked employee car
   */
  private spawnInitialTraffic() {
    // 1. Ambient parked employee car in stall 3
    const ambientCar = this.createCarMesh(0x78350f);
    ambientCar.group.position.set(8.0, 0, 24.0);
    ambientCar.group.rotation.y = 0;
    this.scene.add(ambientCar.group);

    const ambientInstance: CarInstance = {
      id: 'ambient_parked_1',
      visuals: ambientCar,
      lane: 'lot',
      speed: 0,
      targetSpeed: 0,
      state: 'parked',
      color: 0x78350f,
      isHeadlightsOn: false,
      isReverseLightsOn: false,
      blinkerState: 'none',
      assignedStallIndex: 3,
    };
    this.setCarLighting(ambientInstance, false, false, 'none');
    this.cars.push(ambientInstance);

    // 2. Initial cruising road cars
    this.spawnRoadCar('west', 35, 12);
    this.spawnRoadCar('east', -35, 12);
  }

  /**
   * Spawns a cruising car on the specified road lane
   */
  public spawnRoadCar(lane: 'west' | 'east', startX: number, speed = 12.5): CarInstance {
    const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    const visuals = this.createCarMesh(color);

    const z = lane === 'west' ? this.ROAD_Z_WEST : this.ROAD_Z_EAST;
    visuals.group.position.set(startX, 0, z);
    // Heading: Westbound is along -X (rotY = Math.PI / 2); Eastbound is along +X (rotY = -Math.PI / 2)
    visuals.group.rotation.y = lane === 'west' ? Math.PI / 2 : -Math.PI / 2;
    this.scene.add(visuals.group);

    const car: CarInstance = {
      id: `car_${Math.random().toString(36).substring(2, 9)}`,
      visuals,
      lane,
      speed,
      targetSpeed: speed,
      state: 'cruising',
      color,
      isHeadlightsOn: true,
      isReverseLightsOn: false,
      blinkerState: 'none',
    };

    this.setCarLighting(car, true, false, 'none');
    this.cars.push(car);
    return car;
  }

  /**
   * Creates a detailed low-poly 3D passenger car with chassis, cabin, wheels,
   * functional headlights, taillights, blinkers, and hinged driver's door
   */
  public createCarMesh(color: number): CarVisuals {
    const group = new THREE.Group();

    // 1. Lower Chassis
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.65,
    });
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.75, 4.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.65;
    bodyMesh.castShadow = false;
    bodyMesh.receiveShadow = false;
    group.add(bodyMesh);

    // Front Bumper / Grill
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.32, 0.25), bumperMat);
    frontBumper.position.set(0, 0.45, -2.25);
    group.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.32, 0.25), bumperMat);
    rearBumper.position.set(0, 0.45, 2.25);
    group.add(rearBumper);

    // 2. Cabin (Windows & Roof)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x112233,
      roughness: 0.1,
      metalness: 0.9,
    });
    const cabinGeo = new THREE.BoxGeometry(1.85, 0.68, 2.4);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.25, 0.2);
    group.add(cabin);

    // Cabin Roof Plate
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.08, 2.3), bodyMat);
    roof.position.set(0, 1.62, 0.2);
    group.add(roof);

    // 3. Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.2 });
    const wheelPositions = [
      [-1.08, 0.38, -1.35],
      [1.08, 0.38, -1.35],
      [-1.08, 0.38, 1.35],
      [1.08, 0.38, 1.35],
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 16), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      wheel.castShadow = false;
      group.add(wheel);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 12), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, y, z);
      group.add(rim);
    });

    // 4. Headlights (Pointing forward along -Z)
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headlightL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), headlightMat);
    headlightL.position.set(-0.75, 0.72, -2.22);
    group.add(headlightL);

    const headlightR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), headlightMat);
    headlightR.position.set(0.75, 0.72, -2.22);
    group.add(headlightR);

    // Lightweight ground illumination projection (zero GPU shader light overhead)
    const poolMat = new THREE.MeshBasicMaterial({
      color: 0xfffae8,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const headlightBeamPool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 10.0), poolMat);
    headlightBeamPool.rotation.x = -Math.PI / 2;
    headlightBeamPool.position.set(0, 0.02, -7.5);
    group.add(headlightBeamPool);

    // 5. Taillights (Red rear lights at +Z)
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xcc1111 });
    const taillightL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.08), taillightMat);
    taillightL.position.set(-0.75, 0.75, 2.22);
    group.add(taillightL);

    const taillightR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.08), taillightMat);
    taillightR.position.set(0.75, 0.75, 2.22);
    group.add(taillightR);

    // 6. White Reverse Lights (activated when backing up)
    const reverseMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const reverseLightL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), reverseMat);
    reverseLightL.position.set(-0.42, 0.75, 2.22);
    group.add(reverseLightL);

    const reverseLightR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), reverseMat);
    reverseLightR.position.set(0.42, 0.75, 2.22);
    group.add(reverseLightR);

    // 7. Amber Turn Signal Indicators (Blinkers)
    const blinkerOffMat = new THREE.MeshBasicMaterial({ color: 0x442200 });
    const blinkerFL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), blinkerOffMat);
    blinkerFL.position.set(-1.02, 0.72, -2.2);
    group.add(blinkerFL);

    const blinkerFR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), blinkerOffMat);
    blinkerFR.position.set(1.02, 0.72, -2.2);
    group.add(blinkerFR);

    const blinkerRL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), blinkerOffMat);
    blinkerRL.position.set(-1.02, 0.75, 2.2);
    group.add(blinkerRL);

    const blinkerRR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), blinkerOffMat);
    blinkerRR.position.set(1.02, 0.75, 2.2);
    group.add(blinkerRR);

    // 8. Hinged Driver's Door (Left side at X = -1.06)
    const driverDoor = new THREE.Group();
    driverDoor.position.set(-1.06, 0.9, -0.6); // Door hinge location
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 1.2), bodyMat);
    doorLeaf.position.set(0, 0, 0.6);
    driverDoor.add(doorLeaf);
    group.add(driverDoor);

    return {
      group,
      bodyMesh,
      headlightL,
      headlightR,
      headlightBeamPool,
      taillightL,
      taillightR,
      reverseLightL,
      reverseLightR,
      blinkerFL,
      blinkerFR,
      blinkerRL,
      blinkerRR,
      driverDoor,
    };
  }

  /**
   * Sets headlights, taillights, reverse lights, and blinkers
   */
  public setCarLighting(
    car: CarInstance,
    headlights: boolean,
    reverse: boolean,
    blinker: 'none' | 'left' | 'right'
  ) {
    car.isHeadlightsOn = headlights;
    car.isReverseLightsOn = reverse;
    car.blinkerState = blinker;

    const v = car.visuals;
    const hlColor = headlights ? 0xffffff : 0x222222;
    (v.headlightL.material as THREE.MeshBasicMaterial).color.setHex(hlColor);
    (v.headlightR.material as THREE.MeshBasicMaterial).color.setHex(hlColor);
    v.headlightBeamPool.visible = headlights;

    const tlColor = headlights ? 0xee1111 : 0x330000;
    (v.taillightL.material as THREE.MeshBasicMaterial).color.setHex(tlColor);
    (v.taillightR.material as THREE.MeshBasicMaterial).color.setHex(tlColor);

    const revColor = reverse ? 0xffffff : 0x222222;
    (v.reverseLightL.material as THREE.MeshBasicMaterial).color.setHex(revColor);
    (v.reverseLightR.material as THREE.MeshBasicMaterial).color.setHex(revColor);
  }

  /**
   * Dispatches a customer car: an oncoming car slows down, blinks, turns into the parking lot,
   * parks, turns off lights, and the customer steps out!
   */
  public dispatchCustomerCar(onCustomerSteppedOut: (spawnPos: THREE.Vector3, car: CarInstance) => void) {
    // Find an empty parking stall
    const stallIdx = this.parkingStalls.findIndex((s) => !s.occupied);
    if (stallIdx === -1) {
      console.warn('[Traffic] No parking stall available');
      return;
    }

    this.parkingStalls[stallIdx].occupied = true;
    const stall = this.parkingStalls[stallIdx];

    // Spawn approaching customer car on Westbound lane heading towards driveway
    const car = this.spawnRoadCar('west', 48.0, 11.0);
    car.isCustomerCar = true;
    car.assignedStallIndex = stallIdx;
    car.state = 'approaching_driveway';
    car.blinkerState = 'right'; // Turning right into parking lot from Westbound lane
    car.onCustomerSteppedOut = () => {
      // Driver's side door world position:
      const worldDoorPos = new THREE.Vector3(-1.4, 0, 0).applyMatrix4(car.visuals.group.matrixWorld);
      onCustomerSteppedOut(worldDoorPos, car);
    };
  }

  /**
   * Orders a customer's parked car to turn on lights, reverse out, signal, and drive away!
   */
  public dispatchCustomerDeparture(car: CarInstance, onDeparted?: () => void) {
    if (car.state !== 'parked') return;

    car.onDeparted = onDeparted;
    car.state = 'reversing_out_of_stall';
    car.stateTimer = 0;
    // Turn on headlights and reverse lights
    this.setCarLighting(car, true, true, 'none');
    sound.playCarDoor(); // Thud of customer closing car door
  }

  /**
   * Main per-frame physics & traffic update loop
   */
  public update(delta: number) {
    // 1. Blinkers animation ticker (2.5 Hz flash)
    this.blinkerTimer += delta;
    if (this.blinkerTimer >= 0.22) {
      this.blinkerTimer = 0;
      this.blinkerActive = !this.blinkerActive;
    }

    // 2. Continuous highway traffic spawner (capped to max 3 cruising cars for high performance)
    this.spawnTimerWest += delta;
    this.spawnTimerEast += delta;

    const totalCruising = this.cars.filter((c) => c.state === 'cruising').length;

    if (this.spawnTimerWest > 4.5 && totalCruising < 3) {
      // Check if space is clear at spawn point X = 75
      const canSpawn = !this.cars.some(
        (c) => c.lane === 'west' && c.state === 'cruising' && c.visuals.group.position.x > 62
      );
      if (canSpawn) {
        this.spawnRoadCar('west', 82.0, 11.5 + Math.random() * 2.5);
        this.spawnTimerWest = 0;
      }
    }

    if (this.spawnTimerEast > 5.0 && totalCruising < 3) {
      const canSpawn = !this.cars.some(
        (c) => c.lane === 'east' && c.state === 'cruising' && c.visuals.group.position.x < -62
      );
      if (canSpawn) {
        this.spawnRoadCar('east', -82.0, 11.5 + Math.random() * 2.5);
        this.spawnTimerEast = 0;
      }
    }

    // 3. Process every car's motion, AI, and collision avoidance
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      this.updateCar(car, delta);

      // Despawn cruising cars that exit the visible highway boundary
      if (
        (car.lane === 'west' && car.visuals.group.position.x < -90) ||
        (car.lane === 'east' && car.visuals.group.position.x > 90)
      ) {
        if (!car.isCustomerCar) {
          this.scene.remove(car.visuals.group);
          this.cars.splice(i, 1);
        }
      }
    }
  }

  /**
   * Updates an individual car's behavior, steering, and anti-collision
   */
  private updateCar(car: CarInstance, delta: number) {
    const v = car.visuals;
    const pos = v.group.position;

    // A. Update blinker visual elements
    const blinkColor = this.blinkerActive ? 0xff9900 : 0x331800;
    if (car.blinkerState === 'left') {
      (v.blinkerFL.material as THREE.MeshBasicMaterial).color.setHex(blinkColor);
      (v.blinkerRL.material as THREE.MeshBasicMaterial).color.setHex(blinkColor);
      (v.blinkerFR.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
      (v.blinkerRR.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
    } else if (car.blinkerState === 'right') {
      (v.blinkerFR.material as THREE.MeshBasicMaterial).color.setHex(blinkColor);
      (v.blinkerRR.material as THREE.MeshBasicMaterial).color.setHex(blinkColor);
      (v.blinkerFL.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
      (v.blinkerRL.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
    } else {
      (v.blinkerFL.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
      (v.blinkerFR.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
      (v.blinkerRL.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
      (v.blinkerRR.material as THREE.MeshBasicMaterial).color.setHex(0x331800);
    }

    // B. State Machine
    if (car.state === 'cruising' || car.state === 'accelerating_away') {
      // 1. Anti-collision following distance (never crash or overlap!)
      let safeSpeed = car.targetSpeed;
      const minDistance = 14.0; // 14 meters safe buffer

      for (const other of this.cars) {
        if (other === car || other.lane !== car.lane) continue;

        if (car.lane === 'west') {
          // Both moving in -X direction
          const dist = pos.x - other.visuals.group.position.x;
          if (dist > 0 && dist < minDistance) {
            safeSpeed = Math.min(safeSpeed, Math.max(0, other.speed * 0.9));
          }
        } else if (car.lane === 'east') {
          // Both moving in +X direction
          const dist = other.visuals.group.position.x - pos.x;
          if (dist > 0 && dist < minDistance) {
            safeSpeed = Math.min(safeSpeed, Math.max(0, other.speed * 0.9));
          }
        }
      }

      // Smooth acceleration / deceleration
      car.speed = THREE.MathUtils.lerp(car.speed, safeSpeed, delta * 3.5);

      // Move along lane
      if (car.lane === 'west') {
        pos.x -= car.speed * delta;
        v.group.rotation.y = Math.PI / 2;
      } else {
        pos.x += car.speed * delta;
        v.group.rotation.y = -Math.PI / 2;
      }
    } else if (car.state === 'approaching_driveway') {
      // Approaching parking lot entrance driveway at X = 0
      car.speed = THREE.MathUtils.lerp(car.speed, 5.0, delta * 2.0);
      pos.x -= car.speed * delta;

      if (pos.x <= this.DRIVEWAY_X + 3.0) {
        car.state = 'turning_into_lot';
      }
    } else if (car.state === 'turning_into_lot') {
      // Smooth arc turn into convenience store parking lot (facing towards store -Z)
      const targetZ = 33.0;
      pos.z = THREE.MathUtils.lerp(pos.z, targetZ, delta * 3.0);
      pos.x = THREE.MathUtils.lerp(pos.x, this.DRIVEWAY_X, delta * 3.0);
      v.group.rotation.y = THREE.MathUtils.lerp(v.group.rotation.y, 0, delta * 4.0);

      if (pos.z <= targetZ + 0.6) {
        car.state = 'parking_into_stall';
      }
    } else if (car.state === 'parking_into_stall') {
      // Steer from driveway into assigned parking stall
      const stall = this.parkingStalls[car.assignedStallIndex ?? 0];
      pos.x = THREE.MathUtils.lerp(pos.x, stall.pos.x, delta * 2.5);
      pos.z = THREE.MathUtils.lerp(pos.z, stall.pos.z, delta * 2.5);
      v.group.rotation.y = THREE.MathUtils.lerp(v.group.rotation.y, stall.rotY, delta * 3.0);

      // Check arrival in parking stall
      if (pos.distanceTo(stall.pos) < 0.2) {
        pos.copy(stall.pos);
        v.group.rotation.y = stall.rotY;
        car.state = 'parked';
        car.speed = 0;

        // Turn off headlights, taillights, blinkers!
        this.setCarLighting(car, false, false, 'none');

        // Open driver's door smoothly and notify customer step-out!
        sound.playCarDoor();
        v.driverDoor.rotation.y = -0.75; // Door open ~45 deg

        setTimeout(() => {
          // Customer stepped out, close door
          if (car.onCustomerSteppedOut) {
            car.onCustomerSteppedOut();
          }
          setTimeout(() => {
            v.driverDoor.rotation.y = 0; // Door shut
            sound.playCarDoor();
          }, 800);
        }, 1200);
      }
    } else if (car.state === 'reversing_out_of_stall') {
      // Reversing backwards out of stall (+Z direction) into parking aisle
      car.stateTimer = (car.stateTimer || 0) + delta;
      pos.z += 2.2 * delta; // Backing up smoothly

      if (pos.z >= 33.5) {
        // Clear of parking stall: switch to driving forward and turning onto highway!
        car.state = 'turning_onto_road';
        // Randomly turn East or West onto Route 9
        const turnEast = Math.random() > 0.5;
        car.lane = turnEast ? 'east' : 'west';
        this.setCarLighting(car, true, false, turnEast ? 'left' : 'right');
      }
    } else if (car.state === 'turning_onto_road') {
      // Pull forward onto highway and align with lane
      const targetZ = car.lane === 'west' ? this.ROAD_Z_WEST : this.ROAD_Z_EAST;
      const targetRot = car.lane === 'west' ? Math.PI / 2 : -Math.PI / 2;

      pos.z = THREE.MathUtils.lerp(pos.z, targetZ, delta * 2.5);
      v.group.rotation.y = THREE.MathUtils.lerp(v.group.rotation.y, targetRot, delta * 2.8);

      if (car.lane === 'west') {
        pos.x -= 3.5 * delta;
      } else {
        pos.x += 3.5 * delta;
      }

      if (Math.abs(pos.z - targetZ) < 0.3) {
        // Fully merged onto highway! Turn off blinker and accelerate away!
        pos.z = targetZ;
        v.group.rotation.y = targetRot;
        this.setCarLighting(car, true, false, 'none');
        car.targetSpeed = 12.0 + Math.random() * 2.0;
        car.speed = 4.0;
        car.state = 'accelerating_away';

        // Free up parking stall
        if (car.assignedStallIndex !== undefined) {
          this.parkingStalls[car.assignedStallIndex].occupied = false;
        }

        if (car.onDeparted) {
          car.onDeparted();
        }
      }
    }
  }

  public destroy() {
    this.cars.forEach((c) => this.scene.remove(c.visuals.group));
    this.scene.remove(this.roadGroup);
    this.cars = [];
  }
}

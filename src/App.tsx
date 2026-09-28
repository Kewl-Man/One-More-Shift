import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { sound } from './audio/SoundManager';
import { StoreWorld, InteractiveObject } from './game/StoreWorld';
import { PlayerController } from './game/PlayerController';
import { CustomerManager, CustomerCharacter } from './game/CustomerManager';
import { EntityManager } from './game/EntityManager';
import { HorrorDirector } from './game/HorrorDirector';
import { SaveManager, GameSave } from './game/SaveManager';
import { TrafficManager } from './game/TrafficManager';
import { CustomerData, CustomerProduct, PhoneTutorialStep } from './types';

// UI Components
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { CheckoutPanel } from './components/CheckoutPanel';
import { PhoneHUD } from './components/PhoneHUD';
import { CCTVMonitor } from './components/CCTVMonitor';
import { GameOverModal } from './components/GameOverModal';
import { WirePuzzleModal } from './components/WirePuzzleModal';
import { PauseMenuModal } from './components/PauseMenuModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js Engine Instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldRef = useRef<StoreWorld | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const customerManagerRef = useRef<CustomerManager | null>(null);
  const trafficManagerRef = useRef<TrafficManager | null>(null);
  const entityManagerRef = useRef<EntityManager | null>(null);
  const directorRef = useRef<HorrorDirector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const handleInteractRef = useRef<(explicitTarget?: InteractiveObject | null) => void>(() => {});

  // Dedicated CCTV Camera instance for surveillance rendering
  const cctvCameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mirrors isCctvOpen state INSIDE the persistent render loop without forcing the whole
  // WebGL scene (world, player, customers, traffic, entities) to be destroyed and rebuilt
  // every time CCTV is opened/closed. See the sync effect right after the main setup effect.
  const isCctvOpenRef = useRef<boolean>(false);

  // Render loop throttling refs to eliminate 60fps React re-render thrashing
  const lastTargetedIdRef = useRef<string | null>(null);
  const lastFlashlightRef = useRef<boolean>(false);
  const lastLockedRef = useRef<boolean>(false);
  const lastAnxietySyncRef = useRef<number>(0);

  // Meta Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'game_over'>('menu');
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [nightNumber, setNightNumber] = useState<number>(1);
  const [gameMinutes, setGameMinutes] = useState<number>(0); // 0 = 12:00 AM, 360 = 6:00 AM

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [mouseSensitivity, setMouseSensitivity] = useState<number>(2.2);

  // World States
  const [isDoorLocked, setIsDoorLocked] = useState<boolean>(false);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [targetedObject, setTargetedObject] = useState<InteractiveObject | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(0);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  // In-World Telephone System
  const [isPhoneRinging, setIsPhoneRinging] = useState<boolean>(true);
  const [isOnPhoneCall, setIsOnPhoneCall] = useState<boolean>(false);
  const [phoneSpeaker, setPhoneSpeaker] = useState<string>('STEVE (OVERNIGHT DISPATCH)');
  const [phoneSpeechText, setPhoneSpeechText] = useState<string>('');
  const [phoneTutorialStep, setPhoneTutorialStep] = useState<PhoneTutorialStep>('intro');
  const [activeObjective, setActiveObjective] = useState<string>('Answer the ringing phone on the counter wall [E]');

  // Physical Checkout & Customer Interaction
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);
  const [scannedProducts, setScannedProducts] = useState<CustomerProduct[]>([]);
  const [activeDialogueChoice, setActiveDialogueChoice] = useState<{ playerText: string; customerReply: string } | null>(null);
  const [isCheckoutPanelOpen, setIsCheckoutPanelOpen] = useState<boolean>(false);

  // Live 3D CCTV Surveillance
  const [isCctvOpen, setIsCctvOpen] = useState<boolean>(false);
  const [activeCamIndex, setActiveCamIndex] = useState<number>(0);
  const [isCctvGlitching, setIsCctvGlitching] = useState<boolean>(false);

  // Fix Wiring Electrical Puzzle
  const [isWirePuzzleOpen, setIsWirePuzzleOpen] = useState<boolean>(false);

  // Pause / Exit Menu
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState<boolean>(false);

  // Game Over Details
  const [gameOverInfo, setGameOverInfo] = useState<{ cause: string; rule?: string }>({ cause: '' });

  // Format in-game clock from minutes (0 to 360) -> 12:00 AM to 6:00 AM
  const getClockString = (mins: number) => {
    const totalHours = Math.floor(mins / 60);
    const displayHour = totalHours === 0 ? 12 : totalHours;
    const displayMins = Math.floor(mins % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${pad(displayHour)}:${pad(displayMins)} AM`;
  };

  // Trigger Game Over
  const triggerGameOver = useCallback((cause: string, rule?: string) => {
    sound.playHorrorStinger();
    setGameOverInfo({ cause, rule });
    setGameState('game_over');
    if (playerRef.current) {
      playerRef.current.unlock();
      playerRef.current.canMove = false;
    }
  }, []);

  // Update CCTV Camera perspective to match selected camera definition
  const updateCctvPerspective = useCallback((camIndex: number) => {
    if (!worldRef.current || !cctvCameraRef.current) return;
    const def = worldRef.current.cctvDefs[camIndex];
    if (def) {
      worldRef.current.setCctvActiveCamera(camIndex);
      // Offset lens slightly forward from the camera mount so the viewpoint is never inside any 3D model
      const dir = new THREE.Vector3().subVectors(def.target, def.position).normalize();
      cctvCameraRef.current.position.copy(def.position).addScaledVector(dir, 0.28);
      cctvCameraRef.current.fov = def.fov;
      cctvCameraRef.current.lookAt(def.target);
      cctvCameraRef.current.updateProjectionMatrix();
    }
  }, []);

  // Initialize Three.js WebGL Scene, World, Player, Managers
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1018);
    scene.fog = new THREE.FogExp2(0x0a1018, 0.008);
    sceneRef.current = scene;

    // 2. Player Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. CCTV Camera
    const cctvCamera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    cctvCameraRef.current = cctvCamera;

    // 4. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    renderer.domElement.id = 'game-canvas';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.outline = 'none';

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 5. Store World
    const world = new StoreWorld(scene);
    worldRef.current = world;

    // 6. Player Controller (Initial spawn facing into store interior)
    const player = new PlayerController(camera, renderer.domElement);
    playerRef.current = player;
    player.activeWorld = world;
    player.onObjectClicked = (obj) => {
      handleInteractRef.current(obj);
    };
    scene.add(camera);

    // 7. Customer & Entity Managers
    const customerManager = new CustomerManager(scene);
    customerManagerRef.current = customerManager;
    customerManager.onCustomerReady = (character: CustomerCharacter) => {
      setCurrentCustomer(character.data);
      setScannedProducts([]);
      setActiveDialogueChoice(null);
      // Wait for player to walk to register and press E to take the customer's order
      setIsCheckoutPanelOpen(false);
      setActiveObjective(`Customer waiting at register: Approach counter and press [E] to take ${character.data.name}'s order.`);
    };

    // 7b. Highway Traffic & Parking Lot System (Two-lane road traffic with cars & customer arrival)
    const trafficManager = new TrafficManager(scene);
    trafficManagerRef.current = trafficManager;
    customerManager.trafficManager = trafficManager;

    const entityManager = new EntityManager(scene);
    entityManagerRef.current = entityManager;
    entityManager.onAisle6Violated = () => {
      triggerGameOver(
        'You walked directly behind the man standing at the end of Aisle 6. You heard a sickening snap as his neck twisted completely backwards.',
        'Never walk directly behind the man in Aisle 6.'
      );
    };

    // 8. Horror Director
    const director = new HorrorDirector(
      {
        onPhoneRing: (callId: string, message: string, speaker?: string) => {
          setIsPhoneRinging(true);
          setPhoneSpeaker(speaker || 'STEVE (OVERNIGHT DISPATCH)');
          setPhoneSpeechText(message);
          sound.playPhoneRing();
        },
        onEnvironmentalEvent: (type: string, message?: string) => {
          if (message) {
            console.log(`[Horror Event] ${message}`);
          }
        },
        onBlackout: () => {
          setIsBlackout(true);
          setActiveObjective('The main electrical circuit tripped. Head to the back storage room and reset the breaker.');
        },
        onWindowKnock: () => {
          // Handled in director
        },
        onCctvGlitch: (camId: number) => {
          setIsCctvGlitching(true);
          setTimeout(() => setIsCctvGlitching(false), 2400);
        },
      },
      1
    );
    directorRef.current = director;

    // 9. Main Animation / Render Loop
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      world.update(delta);
      player.update(delta, world);
      customerManager.update(delta, world);
      trafficManager.update(delta);
      entityManager.update(delta, player, world);
      director.update(delta, world, customerManager, entityManager);

      // Sync React state (Throttled to eliminate 60fps UI re-render thrashing)
      const currentTargetedId = player.targetedObject?.id || null;
      if (currentTargetedId !== lastTargetedIdRef.current) {
        lastTargetedIdRef.current = currentTargetedId;
        setTargetedObject(player.targetedObject);
      }

      if (player.isFlashlightOn !== lastFlashlightRef.current) {
        lastFlashlightRef.current = player.isFlashlightOn;
        setIsFlashlightOn(player.isFlashlightOn);
      }

      if (player.isLocked !== lastLockedRef.current) {
        lastLockedRef.current = player.isLocked;
        setIsPointerLocked(player.isLocked);
      }

      // Sync anxiety 5 times/sec instead of every single frame
      if (currentTime - lastAnxietySyncRef.current > 200) {
        lastAnxietySyncRef.current = currentTime;
        setAnxietyLevel(entityManager.anxietyLevel);
      }

      // Render: If CCTV surveillance is active, render from CCTV camera; else from player's eyes!
      // (Reads the ref, NOT the React state, so this always sees the current value even though
      // this whole effect intentionally runs only once — see isCctvOpenRef above.)
      if (isCctvOpenRef.current && cctvCameraRef.current) {
        renderer.render(scene, cctvCameraRef.current);
      } else {
        renderer.render(scene, camera);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera || !cctvCamera) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      cctvCamera.aspect = w / h;
      cctvCamera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      player.destroy();
      trafficManager.destroy();
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
    // NOTE: intentionally empty of isCctvOpen — this effect builds the persistent WebGL scene
    // exactly once per game session. Toggling CCTV must never re-run this (see isCctvOpenRef).
  }, [triggerGameOver]);

  // Keep the CCTV render-mode ref in sync with React state (cheap — does not touch the scene)
  useEffect(() => {
    isCctvOpenRef.current = isCctvOpen;
  }, [isCctvOpen]);

  // Dynamic Time Progression driven by game actions
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setGameMinutes((prev) => {
        const next = prev + 1;
        if (next === 120 && !isDoorLocked) {
          sound.playWindowKnock();
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [gameState, isDoorLocked]);

  // Keep phone ringing continuously until answered
  useEffect(() => {
    if (isPhoneRinging && gameState === 'playing') {
      sound.startPhoneRinging();
    } else {
      sound.stopPhoneRinging();
    }
    return () => {
      sound.stopPhoneRinging();
    };
  }, [isPhoneRinging, gameState]);

  // Handle Starting a New Game
  const handleStartNewGame = useCallback((customName?: string) => {
    const save = SaveManager.createNewSave(customName || 'Clerk Shift #1');
    setActiveSaveId(save.id);
    setNightNumber(1);
    setGameMinutes(0);
    setIsDoorLocked(false);
    setIsBlackout(false);
    setIsCheckoutPanelOpen(false);
    setCurrentCustomer(null);
    setScannedProducts([]);
    setIsCctvOpen(false);

    // Initialize in-world phone tutorial
    setIsPhoneRinging(true);
    setIsOnPhoneCall(false);
    setPhoneTutorialStep('intro');
    setPhoneSpeaker('STEVE (OVERNIGHT DISPATCH)');
    setPhoneSpeechText(
      "Hey, welcome to your shift at K&M Mart. I'll be guiding you through tonight. First things first: head over to the checkout counter and check the cash register."
    );
    setActiveObjective('Pick up the ringing phone on the right wall [Click or E]');

    if (worldRef.current) {
      worldRef.current.restorePower();
    }

    if (playerRef.current) {
      // Spawn behind counter in open space, facing +X towards register & store
      playerRef.current.resetPosition(-10.4, 1.75, 9.8, -Math.PI / 2);
      playerRef.current.canMove = true;
    }

    setGameState('playing');
    sound.init();
    sound.playAmbientHum();
    setTimeout(() => {
      playerRef.current?.lock();
    }, 150);
  }, []);

  // Handle Loading a Game
  const handleLoadGame = useCallback((save: GameSave) => {
    setActiveSaveId(save.id);
    setNightNumber(save.nightNumber ?? save.shift ?? 1);
    setGameMinutes(save.gameMinutes);
    setIsDoorLocked(!!save.isDoorLocked);
    setIsBlackout(!!save.isBlackout);
    setIsCheckoutPanelOpen(false);
    setCurrentCustomer(null);
    setScannedProducts([]);
    setIsCctvOpen(false);

    const step = (save.phoneTutorialStep as PhoneTutorialStep) || 'intro';
    if (step === 'completed') {
      setIsPhoneRinging(false);
      setIsOnPhoneCall(false);
      setPhoneTutorialStep('completed');
      setActiveObjective('Manage customer checkouts and observe CCTV feeds.');
    } else {
      setIsPhoneRinging(true);
      setIsOnPhoneCall(false);
      setPhoneTutorialStep(step);
      setActiveObjective('Pick up the ringing phone on the right wall [Click or E]');
    }

    if (worldRef.current) {
      if (save.isBlackout) worldRef.current.triggerBlackout();
      else worldRef.current.restorePower();
    }

    let pos = save.playerPosition || { x: -10.4, y: 1.75, z: 9.8 };
    // Sanitize any previous saves that had player overlapping the checkout counter/belt
    if (pos.x > -9.6 && pos.x < -7.5 && pos.z > 8.0 && pos.z < 13.0) {
      pos = { x: -10.4, y: 1.75, z: 9.8 };
    }
    if (playerRef.current) {
      playerRef.current.resetPosition(pos.x, pos.y, pos.z, -Math.PI / 2);
      playerRef.current.canMove = true;
    }

    setGameState('playing');
    sound.init();
    sound.playAmbientHum();
    setTimeout(() => {
      playerRef.current?.lock();
    }, 150);
  }, []);

  // Dedicated Pick Up Phone Action
  const handlePickUpPhone = useCallback(() => {
    sound.stopPhoneRinging();
    sound.playPhonePickup();
    setIsPhoneRinging(false);
    setIsOnPhoneCall(true);

    if (phoneTutorialStep === 'intro') {
      setPhoneSpeechText(
        "Hey, welcome to your shift at K&M Mart. I'll be guiding you through tonight. First things first: check the cash register on the counter in front of you."
      );
      setActiveObjective('Inspect the Cash Register POS terminal [Click or E]');
      setPhoneTutorialStep('look_at_register');
    }
  }, [phoneTutorialStep]);

  // In-World Interaction Handler (Called when player clicks or presses E on targeted object)
  const handleInteract = useCallback((explicitTarget?: InteractiveObject | null) => {
    if (!playerRef.current) return;
    const target = explicitTarget || playerRef.current.targetedObject;

    // If phone is ringing and user interacts (clicking banner or pressing E anywhere), answer immediately!
    if (isPhoneRinging && (!target || target.type === 'telephone')) {
      handlePickUpPhone();
      return;
    }

    if (!target) return;

    // 1. SCANNING PHYSICAL COUNTER ITEMS (via direct click or reticle E)
    if (target.type === 'counter_item') {
      const prod = target.mesh.userData.product as CustomerProduct;
      const index = target.mesh.userData.index as number;
      if (prod && currentCustomer && customerManagerRef.current) {
        const char = customerManagerRef.current.getCurrentCustomer();
        const placed = char?.placedItems.find((p, idx) => idx === index);
        if (placed && placed.scanned) {
          return; // Already scanned
        }

        if (worldRef.current) {
          char?.markItemScanned(prod.id, worldRef.current);
        } else {
          char?.markItemScanned(prod.id);
        }
        setScannedProducts((prev) => [...prev, prod]);
        setIsCheckoutPanelOpen(true);
      }
      return;
    }

    // 1b. OPTICAL FLATBED SCANNER INTERACTION (Clicking or targeting the scanner glass)
    if (target.type === 'optical_scanner') {
      if (currentCustomer && customerManagerRef.current) {
        const char = customerManagerRef.current.getCurrentCustomer();
        const nextItem = char?.placedItems.find((p) => !p.scanned);
        if (nextItem) {
          if (worldRef.current) {
            char?.markItemScanned(nextItem.product.id, worldRef.current);
          } else {
            char?.markItemScanned(nextItem.product.id);
          }
          setScannedProducts((prev) => [...prev, nextItem.product]);
          setIsCheckoutPanelOpen(true);
          return;
        }
      }
      sound.playBarcodeBeep();
      worldRef.current?.pulseScanner();
      return;
    }

    // 2. WALL-MOUNTED TELEPHONE
    if (target.type === 'telephone') {
      if (isPhoneRinging || !isOnPhoneCall) {
        handlePickUpPhone();
      } else {
        sound.playPhoneHangup();
        setIsOnPhoneCall(false);
      }
      return;
    }

    // 3. CASH REGISTER & POS
    if (target.type === 'register') {
      sound.playRegisterDrawer();
      setIsCheckoutPanelOpen(true);

      if (currentCustomer) {
        setActiveObjective(`Ring up customer: ${currentCustomer.name}`);
      }

      if (phoneTutorialStep === 'look_at_register') {
        sound.playPhoneVoiceChatter(4);
        setPhoneSpeechText(
          "Good. When customers arrive, their items appear on the belt to your right. Click on them to scan each item. Now go check the CCTV terminal at the back security desk."
        );
        setActiveObjective('Access the CCTV Surveillance Terminal in back office [Click or E]');
        setPhoneTutorialStep('check_cctv');
      }
      return;
    }

    // 4. CCTV TERMINAL
    if (target.type === 'cctv') {
      sound.playCctvSwitch();
      setIsCctvOpen(true);
      setActiveCamIndex(0);
      updateCctvPerspective(0);
      playerRef.current.unlock();
      playerRef.current.canMove = false;

      if (phoneTutorialStep === 'check_cctv') {
        sound.playPhoneVoiceChatter(5);
        setPhoneSpeechText(
          "All 6 cameras are streaming live. Keep an eye on Aisle 6 and the parking lot. Route 9 gets weird after 2 AM. You can press ESC anytime to exit CCTV. Good luck."
        );
        setActiveObjective('Survive the night: check out customers and monitor anomalies.');
        setPhoneTutorialStep('completed');

        if (activeSaveId) {
          SaveManager.updateSave(activeSaveId, { phoneTutorialStep: 'completed' });
        }
      }
      return;
    }

    // 5. BREAKER BOX (Fix Wiring puzzle or Inspect Panel)
    if (target.type === 'breaker') {
      if (isBlackout) {
        sound.playBreakerTrip();
      } else {
        sound.playRegisterDrawer();
      }
      playerRef.current?.unlock();
      if (playerRef.current) playerRef.current.canMove = false;
      setIsWirePuzzleOpen(true);
      return;
    }

    // 6. FRONT DOOR DEADBOLT
    if (target.type === 'door') {
      sound.playDoorLock();
      setIsDoorLocked((prev) => {
        const next = !prev;
        if (next && gameMinutes >= 110) {
          setActiveObjective('Front door locked for late night shift.');
        }
        return next;
      });
      return;
    }

    // 7. REAR SERVICE EXIT DOOR
    if (target.type === 'back_door') {
      worldRef.current?.toggleBackDoor();
      return;
    }
  }, [
    isPhoneRinging,
    isOnPhoneCall,
    phoneTutorialStep,
    currentCustomer,
    gameMinutes,
    activeSaveId,
    updateCctvPerspective,
    handlePickUpPhone,
  ]);

  // Keep ref synchronized
  useEffect(() => {
    handleInteractRef.current = handleInteract;
  }, [handleInteract]);

  // Checkout Actions: PAY
  const handlePay = () => {
    if (!currentCustomer || !customerManagerRef.current || !worldRef.current) return;

    if (currentCustomer.isWearingRed && nightNumber >= 2) {
      triggerGameOver(
        `You accepted payment from ${currentCustomer.name} who was wearing red. The store rules strictly state: NEVER SERVE ANYONE WEARING RED.`,
        'Never serve anyone wearing red.'
      );
      return;
    }

    if (currentCustomer.isNamedDavid && nightNumber >= 3) {
      triggerGameOver(
        `You accepted a transaction from an individual wearing a David nametag. There are no employees named David.`,
        'There are no employees named David.'
      );
      return;
    }

    directorRef.current?.onCustomerServed(currentCustomer);
    customerManagerRef.current.dismissCurrent(worldRef.current);
    setCurrentCustomer(null);
    setScannedProducts([]);
    setIsCheckoutPanelOpen(false);
    setActiveObjective('Observe store and await next customer.');

    setGameMinutes((m) => Math.min(360, m + 20));

    if (activeSaveId) {
      SaveManager.autoSave(activeSaveId, nightNumber, gameMinutes + 20, isDoorLocked, isBlackout);
    }
  };

  // Checkout Actions: REFUSE
  const handleRefuse = () => {
    if (!currentCustomer || !customerManagerRef.current || !worldRef.current) return;

    directorRef.current?.onCustomerRefused(currentCustomer);
    customerManagerRef.current.dismissCurrent(worldRef.current);
    setCurrentCustomer(null);
    setScannedProducts([]);
    setIsCheckoutPanelOpen(false);
    setActiveObjective('Customer dismissed.');

    setGameMinutes((m) => Math.min(360, m + 15));
  };

  // Pause / Resume Menu Handlers
  const handleOpenPauseMenu = useCallback(() => {
    setIsPauseMenuOpen(true);
    playerRef.current?.unlock();
    if (playerRef.current) playerRef.current.canMove = false;
  }, []);

  const handleResumeGame = useCallback(() => {
    setIsPauseMenuOpen(false);
    if (playerRef.current) {
      playerRef.current.canMove = true;
      playerRef.current.lock();
    }
  }, []);

  const handleSaveProgress = useCallback(() => {
    if (activeSaveId) {
      SaveManager.updateSave(activeSaveId, {
        nightNumber,
        gameMinutes,
        isDoorLocked,
        isBlackout,
        phoneTutorialStep,
        playerPosition: playerRef.current
          ? {
              x: playerRef.current.position.x,
              y: playerRef.current.position.y,
              z: playerRef.current.position.z,
            }
          : undefined,
      });
    }
  }, [activeSaveId, nightNumber, gameMinutes, isDoorLocked, isBlackout, phoneTutorialStep]);

  const handleExitToMainMenu = useCallback(() => {
    handleSaveProgress();
    setIsPauseMenuOpen(false);
    setIsCheckoutPanelOpen(false);
    setIsCctvOpen(false);
    setIsWirePuzzleOpen(false);
    playerRef.current?.unlock();
    if (playerRef.current) playerRef.current.canMove = false;
    sound.stopPhoneRinging();
    setGameState('menu');
  }, [handleSaveProgress]);

  // Global Key Bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.code === 'KeyE') {
        handleInteract();
      } else if (e.code === 'KeyH' && isOnPhoneCall) {
        sound.playPhoneHangup();
        setIsOnPhoneCall(false);
      } else if (e.code === 'Escape') {
        if (isWirePuzzleOpen) {
          setIsWirePuzzleOpen(false);
          if (playerRef.current) {
            playerRef.current.canMove = true;
            playerRef.current.lock();
          }
        } else if (isCctvOpen) {
          worldRef.current?.setCctvActiveCamera(null);
          setIsCctvOpen(false);
          playerRef.current?.lock();
          if (playerRef.current) playerRef.current.canMove = true;
        } else if (isCheckoutPanelOpen && !currentCustomer) {
          setIsCheckoutPanelOpen(false);
        } else {
          // Toggle Pause Menu
          setIsPauseMenuOpen((prev) => {
            if (!prev) {
              playerRef.current?.unlock();
              if (playerRef.current) playerRef.current.canMove = false;
              return true;
            } else {
              if (playerRef.current) {
                playerRef.current.canMove = true;
                playerRef.current.lock();
              }
              return false;
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState,
    handleInteract,
    isOnPhoneCall,
    isCctvOpen,
    isCheckoutPanelOpen,
    isWirePuzzleOpen,
    currentCustomer,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-mono">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 1. MAIN MENU */}
      {gameState === 'menu' && (
        <MainMenu
          onLoadGame={handleLoadGame}
          onStartNewGame={handleStartNewGame}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          masterVolume={masterVolume}
          onVolumeChange={setMasterVolume}
          sensitivity={mouseSensitivity}
          onSensitivityChange={(sens) => {
            setMouseSensitivity(sens);
            if (playerRef.current) {
              playerRef.current.mouseSensitivity = sens * 0.001;
            }
          }}
        />
      )}

      {/* 2. IN-GAME FIRST PERSON HUD */}
      {gameState === 'playing' && !isCctvOpen && (
        <HUD
          shiftNumber={nightNumber}
          currentTimeString={getClockString(gameMinutes)}
          targetedObject={targetedObject}
          isFlashlightOn={isFlashlightOn}
          anxietyLevel={anxietyLevel}
          isBlackout={isBlackout}
          isDoorLocked={isDoorLocked}
          isPointerLocked={isPointerLocked}
          onRequestPointerLock={() => {
            if (playerRef.current) {
              if (playerRef.current.isLocked) {
                playerRef.current.unlock();
              } else {
                playerRef.current.lock();
              }
            }
          }}
          onOpenMenu={handleOpenPauseMenu}
          activeObjective={activeObjective}
        />
      )}

      {/* 3. PHYSICAL IN-WORLD TELEPHONE HUD */}
      {gameState === 'playing' && (
        <PhoneHUD
          isRinging={isPhoneRinging}
          isOnCall={isOnPhoneCall}
          speakerName={phoneSpeaker}
          speechText={phoneSpeechText}
          tutorialStep={phoneTutorialStep}
          activeObjective={activeObjective}
          onPickUp={handlePickUpPhone}
          onHangup={() => {
            sound.playPhoneHangup();
            setIsOnPhoneCall(false);
          }}
        />
      )}

      {/* 4. IMMERSIVE SIDE CHECKOUT & DIALOGUE PANEL */}
      {gameState === 'playing' && isCheckoutPanelOpen && (
        <CheckoutPanel
          customer={currentCustomer}
          scannedProducts={scannedProducts}
          activeDialogueChoice={activeDialogueChoice}
          onSelectDialogue={(choice) => {
            sound.playPhoneVoiceChatter(3);
            setActiveDialogueChoice(choice);
          }}
          onPay={handlePay}
          onRefuse={handleRefuse}
          onClose={() => setIsCheckoutPanelOpen(false)}
        />
      )}

      {/* 5. LIVE 3D CCTV SURVEILLANCE FEED */}
      {gameState === 'playing' && isCctvOpen && worldRef.current && (
        <CCTVMonitor
          cctvDefs={worldRef.current.cctvDefs}
          activeCamIndex={activeCamIndex}
          onSelectCam={(idx) => {
            setActiveCamIndex(idx);
            updateCctvPerspective(idx);
          }}
          onClose={() => {
            worldRef.current?.setCctvActiveCamera(null);
            setIsCctvOpen(false);
            playerRef.current?.lock();
            if (playerRef.current) playerRef.current.canMove = true;
          }}
          isGlitching={isCctvGlitching}
          gameMinutes={gameMinutes}
        />
      )}

      {/* 6. FIX WIRING ELECTRICAL PUZZLE */}
      {gameState === 'playing' && isWirePuzzleOpen && (
        <WirePuzzleModal
          isOpen={isWirePuzzleOpen}
          isBlackout={isBlackout}
          onComplete={() => {
            sound.playBreakerTrip();
            worldRef.current?.restorePower();
            setIsBlackout(false);
            setIsWirePuzzleOpen(false);
            if (playerRef.current) {
              playerRef.current.canMove = true;
              playerRef.current.lock();
            }
            setActiveObjective('Wiring repaired! Power restored to the store. Return to the checkout counter.');
          }}
          onClose={() => {
            setIsWirePuzzleOpen(false);
            if (playerRef.current) {
              playerRef.current.canMove = true;
              playerRef.current.lock();
            }
          }}
        />
      )}

      {/* 7. PAUSE / SHIFT MENU MODAL */}
      {gameState === 'playing' && isPauseMenuOpen && (
        <PauseMenuModal
          nightNumber={nightNumber}
          timeString={getClockString(gameMinutes)}
          activeObjective={activeObjective}
          onResume={handleResumeGame}
          onSave={handleSaveProgress}
          onExitToMenu={handleExitToMainMenu}
        />
      )}

      {/* 8. GAME OVER SCREEN */}
      {gameState === 'game_over' && (
        <GameOverModal
          cause={gameOverInfo.cause}
          ruleBroken={gameOverInfo.rule}
          onRestart={() => handleStartNewGame()}
          onMainMenu={() => setGameState('menu')}
        />
      )}
    </div>
  );
}

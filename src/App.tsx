import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { sound } from './audio/SoundManager';
import { StoreWorld, InteractiveObject } from './game/StoreWorld';
import { PlayerController } from './game/PlayerController';
import { CustomerManager } from './game/CustomerManager';
import { EntityManager } from './game/EntityManager';
import { STORE_RULES, SHIFT_CUSTOMERS, SHIFT_TASKS } from './game/GameStory';
import { ShiftNumber, ActiveTask, CustomerData, DialogueNode, DialogueChoice } from './types';

// UI Components
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { CashRegisterModal } from './components/CashRegisterModal';
import { CCTVMonitor } from './components/CCTVMonitor';
import { EmployeeTerminal } from './components/EmployeeTerminal';
import { DialogueBox } from './components/DialogueBox';
import { ShiftSummaryModal } from './components/ShiftSummaryModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game Engine Instances (held in refs across renders)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldRef = useRef<StoreWorld | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const customerManagerRef = useRef<CustomerManager | null>(null);
  const entityManagerRef = useRef<EntityManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Game Meta State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'shift_summary' | 'game_over'>('menu');
  const [currentShift, setCurrentShift] = useState<ShiftNumber>(1);
  const [savedShift, setSavedShift] = useState<ShiftNumber>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active Gameplay State
  const [gameMinutes, setGameMinutes] = useState<number>(0); // 0 = 12:00 AM, 360 = 6:00 AM
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [heldItem, setHeldItem] = useState<'none' | 'crate' | 'mop' | 'keys'>('none');
  const [isDoorLocked, setIsDoorLocked] = useState<boolean>(false);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [targetedObject, setTargetedObject] = useState<InteractiveObject | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(0);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  // Modals & Overlays
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isCctvOpen, setIsCctvOpen] = useState<boolean>(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);
  const [activeDialogueNode, setActiveDialogueNode] = useState<DialogueNode | null>(null);

  // End Screens Info
  const [gameOverInfo, setGameOverInfo] = useState<{ cause: string; rule?: string }>({ cause: '' });
  const [shiftSummaryInfo, setShiftSummaryInfo] = useState<{ earnings: number; anomalies: number }>({
    earnings: 0,
    anomalies: 0,
  });

  // Load saved shift from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('onemoreshift_save_shift');
    if (saved) {
      const num = parseInt(saved, 10) as ShiftNumber;
      if (num >= 1 && num <= 6) setSavedShift(num);
    }
  }, []);

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

  // Trigger Shift Victory / Completion
  const triggerShiftComplete = useCallback(() => {
    sound.playMorningChime();
    setShiftSummaryInfo({
      earnings: 85.0 + tasks.filter((t) => t.completed).length * 10,
      anomalies: 2,
    });
    setGameState('shift_summary');
    if (playerRef.current) {
      playerRef.current.unlock();
      playerRef.current.canMove = false;
    }
    // Save progress
    const next = Math.min(6, currentShift + 1) as ShiftNumber;
    setSavedShift(next);
    localStorage.setItem('onemoreshift_save_shift', next.toString());
  }, [currentShift, tasks]);

  // Handle shift start initialization
  const startShift = useCallback(
    (shiftNum: ShiftNumber) => {
      setCurrentShift(shiftNum);
      setGameMinutes(0);
      setIsDoorLocked(false);
      setIsBlackout(false);
      setHeldItem('none');
      setAnxietyLevel(0);
      setIsRegisterOpen(false);
      setIsCctvOpen(false);
      setIsPhoneOpen(false);
      setActiveDialogueNode(null);

      // Initialize shift tasks
      const shiftTasks = JSON.parse(JSON.stringify(SHIFT_TASKS[shiftNum] || []));
      setTasks(shiftTasks);

      setGameState('playing');
      sound.init();
      sound.playAmbientHum();

      // Reset world lights
      if (worldRef.current) {
        worldRef.current.restorePower();
      }

      // Setup Entities for Shift
      if (entityManagerRef.current) {
        entityManagerRef.current.removeAisle6Man();
        entityManagerRef.current.removeWatcher();

        if (shiftNum >= 3) {
          entityManagerRef.current.spawnAisle6Man();
          entityManagerRef.current.onAisle6Violated = () => {
            triggerGameOver(
              'You walked directly behind the man in Aisle 6. His neck snapped around and your vision faded to black.',
              'Do not walk behind the man standing at the end of Aisle 6.'
            );
          };
        }

        if (shiftNum >= 2) {
          entityManagerRef.current.spawnWatcher('parking');
        }
      }

      // Schedule first customer spawn
      const customerPool = SHIFT_CUSTOMERS[shiftNum] || [];
      if (customerPool.length > 0 && customerManagerRef.current) {
        setTimeout(() => {
          if (customerManagerRef.current) {
            customerManagerRef.current.spawnCustomer(customerPool[0]);
          }
        }, 4000);
      }

      // Request mouse lock
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.canMove = true;
          playerRef.current.lock();
        }
      }, 300);
    },
    [triggerGameOver]
  );

  // Initialize Three.js Scene, World, Player, Managers
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.025);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. StoreWorld
    const world = new StoreWorld(scene);
    worldRef.current = world;

    // 5. Player Controller
    const player = new PlayerController(camera, renderer.domElement);
    playerRef.current = player;
    scene.add(player.flashlight);
    scene.add(player.flashlight.target);
    camera.add(player.flashlightMesh);
    scene.add(camera);

    // 6. Customer & Entity Managers
    const customerManager = new CustomerManager(scene);
    customerManagerRef.current = customerManager;
    customerManager.onCustomerReady = (character) => {
      setCurrentCustomer(character.data);
    };

    const entityManager = new EntityManager(scene);
    entityManagerRef.current = entityManager;

    // 7. Render Loop
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Update world animations (fluorescent flicker, rain)
      world.update(delta);

      // Update player
      player.update(delta, world);

      // Update customers
      customerManager.update(delta, world);

      // Update entities
      entityManager.update(delta, player, world);

      // Sync React state for HUD
      setTargetedObject(player.targetedObject);
      setIsFlashlightOn(player.isFlashlightOn);
      setIsPointerLocked(player.isLocked);
      setAnxietyLevel(entityManager.anxietyLevel);

      renderer.render(scene, camera);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      player.destroy();
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Time Progression & Shift Events Interval
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setGameMinutes((prev) => {
        const next = prev + 1; // 1 minute in-game per second
        // Check 02:00 AM (minute 120) Door Lock Rule
        if (next === 120 && !isDoorLocked && currentShift <= 2) {
          sound.playHorrorStinger();
          sound.playWindowKnock();
        }

        // Check Blackout trigger on Shift 3 around 02:45 AM (minute 165)
        if (currentShift === 3 && next === 165 && !isBlackout) {
          setIsBlackout(true);
          worldRef.current?.triggerBlackout();
          sound.playBreakerTrip();
        }

        // Shift Dawn Completion (minute 360 = 6:00 AM)
        if (next >= 360) {
          triggerShiftComplete();
          return 360;
        }

        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [gameState, isDoorLocked, currentShift, isBlackout, triggerShiftComplete]);

  // Complete a Task Helper
  const completeTask = (type: ActiveTask['type']) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.type === type && !task.completed) {
          const newCount = task.currentCount + 1;
          const isDone = newCount >= task.targetCount;
          if (isDone) {
            sound.playTaskComplete();
            setGameMinutes((m) => Math.min(360, m + 25)); // Completing tasks advances time
          }
          return { ...task, currentCount: newCount, completed: isDone };
        }
        return task;
      })
    );
  };

  // Handle Object Interaction (Pressed E or Clicked on interactive target)
  const handleInteract = useCallback(() => {
    if (!playerRef.current) return;
    const target = playerRef.current.targetedObject;
    if (!target) return;

    switch (target.type) {
      case 'register':
        setIsRegisterOpen(true);
        playerRef.current.unlock();
        playerRef.current.canMove = false;
        break;

      case 'shelf_restock':
        if (heldItem === 'crate') {
          sound.playRestock();
          setHeldItem('none');
          completeTask('restock');
        } else {
          // Tell player they need a crate
          sound.playServiceBell();
        }
        break;

      case 'crate_pickup':
        sound.playRestock();
        setHeldItem('crate');
        break;

      case 'mop_bucket':
        sound.playRestock();
        setHeldItem(heldItem === 'mop' ? 'none' : 'mop');
        break;

      case 'spill':
        if (heldItem === 'mop') {
          sound.playMop();
          completeTask('mop');
        } else {
          sound.playServiceBell();
        }
        break;

      case 'cctv':
        setIsCctvOpen(true);
        playerRef.current.unlock();
        playerRef.current.canMove = false;
        completeTask('check_cctv');
        break;

      case 'breaker':
        sound.playBreakerTrip();
        if (worldRef.current) {
          worldRef.current.restorePower();
          setIsBlackout(false);
          completeTask('breaker');
        }
        break;

      case 'door':
        sound.playDoorLock();
        setIsDoorLocked((prev) => {
          const next = !prev;
          if (next && gameMinutes >= 110 && gameMinutes <= 140) {
            completeTask('lock_door');
          }
          return next;
        });
        break;

      case 'phone':
        setIsPhoneOpen(true);
        playerRef.current.unlock();
        playerRef.current.canMove = false;
        completeTask('phone');
        break;
    }
  }, [heldItem, gameMinutes]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.code === 'KeyE') {
        handleInteract();
      } else if (e.code === 'KeyP') {
        setIsPhoneOpen((prev) => {
          if (!prev && playerRef.current) {
            playerRef.current.unlock();
            playerRef.current.canMove = false;
          }
          return !prev;
        });
      } else if (e.code === 'F1') {
        e.preventDefault();
        setIsPhoneOpen(true);
        if (playerRef.current) {
          playerRef.current.unlock();
          playerRef.current.canMove = false;
        }
      } else if (e.code === 'Escape') {
        // Close modals if open
        if (isRegisterOpen || isCctvOpen || isPhoneOpen || activeDialogueNode) {
          setIsRegisterOpen(false);
          setIsCctvOpen(false);
          setIsPhoneOpen(false);
          setActiveDialogueNode(null);
          if (playerRef.current) {
            playerRef.current.canMove = true;
            playerRef.current.lock();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleInteract, isRegisterOpen, isCctvOpen, isPhoneOpen, activeDialogueNode]);

  // Handle Customer Sale Complete
  const handleCompleteSale = (total: number) => {
    setIsRegisterOpen(false);
    if (playerRef.current) {
      playerRef.current.canMove = true;
      playerRef.current.lock();
    }

    if (currentCustomer) {
      // Check for rule breaches:
      if (currentCustomer.isWearingRed && currentShift === 2) {
        triggerGameOver(
          'You served the customer wearing crimson red. As the receipt printed, hands dragged you into the counter belt.',
          'DO NOT serve any customer wearing RED.'
        );
        return;
      }

      // Normal safe departure
      if (worldRef.current && customerManagerRef.current) {
        customerManagerRef.current.dismissCurrent(worldRef.current);
      }
      completeTask('register');
      setGameMinutes((m) => Math.min(360, m + 35)); // Each completed transaction advances time

      // Spawn next customer in shift pool
      const pool = SHIFT_CUSTOMERS[currentShift] || [];
      const currentIdx = pool.findIndex((c) => c.id === currentCustomer.id);
      if (currentIdx !== -1 && currentIdx + 1 < pool.length) {
        setTimeout(() => {
          if (customerManagerRef.current) {
            customerManagerRef.current.spawnCustomer(pool[currentIdx + 1]);
          }
        }, 6000);
      } else {
        setCurrentCustomer(null);
      }
    }
  };

  // Handle Refusing Service (e.g. Red Rule)
  const handleRefuseService = () => {
    setIsRegisterOpen(false);
    if (playerRef.current) {
      playerRef.current.canMove = true;
      playerRef.current.lock();
    }

    if (currentCustomer?.isWearingRed) {
      // CORRECT RULE ACTION!
      sound.playServiceBell();
      if (worldRef.current && customerManagerRef.current) {
        customerManagerRef.current.dismissCurrent(worldRef.current);
      }
      completeTask('register');
      setGameMinutes((m) => Math.min(360, m + 40));

      // Advance customer pool
      const pool = SHIFT_CUSTOMERS[currentShift] || [];
      const currentIdx = pool.findIndex((c) => c.id === currentCustomer.id);
      if (currentIdx !== -1 && currentIdx + 1 < pool.length) {
        setTimeout(() => {
          if (customerManagerRef.current) {
            customerManagerRef.current.spawnCustomer(pool[currentIdx + 1]);
          }
        }, 5000);
      }
    } else {
      // Refused a normal customer
      sound.playServiceBell();
      if (worldRef.current && customerManagerRef.current) {
        customerManagerRef.current.dismissCurrent(worldRef.current);
      }
    }
  };

  // Dialogue Tree Progression
  const handleStartDialogue = () => {
    if (currentCustomer && currentCustomer.dialogueTree) {
      setIsRegisterOpen(false);
      setActiveDialogueNode(currentCustomer.dialogueTree[currentCustomer.initialDialogueId || 'start']);
    }
  };

  const handleSelectDialogueChoice = (choice: DialogueChoice) => {
    if (!currentCustomer || !currentCustomer.dialogueTree) return;

    // Check specific deadly choices:
    if (currentCustomer.isNamedDavid && choice.text.includes('Thanks David')) {
      triggerGameOver(
        'You spoke with and trusted "David". You went to the freezer and the latch clicked from the outside forever.',
        'There are NO employees named David.'
      );
      return;
    }

    if (currentCustomer.asksIfAlone && choice.text.includes('Yeah, just me')) {
      triggerGameOver(
        'You answered "Yes" to being alone. The lights died and the front doors shattered inwards.',
        'If anyone asks whether you are alone tonight, NEVER answer "Yes".'
      );
      return;
    }

    // Advance to next dialogue node
    if (choice.nextDialogueId && currentCustomer.dialogueTree[choice.nextDialogueId]) {
      setActiveDialogueNode(currentCustomer.dialogueTree[choice.nextDialogueId]);
    } else {
      setActiveDialogueNode(null);
      if (playerRef.current) {
        playerRef.current.canMove = true;
        playerRef.current.lock();
      }
    }
  };

  const handleCloseDialogue = () => {
    setActiveDialogueNode(null);
    if (playerRef.current) {
      playerRef.current.canMove = true;
      playerRef.current.lock();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        onClick={() => {
          if (gameState === 'playing' && !isRegisterOpen && !isCctvOpen && !isPhoneOpen && !activeDialogueNode) {
            playerRef.current?.lock();
          }
        }}
        className="w-full h-full cursor-crosshair"
      />

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          onStartShift={startShift}
          savedShift={savedShift}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            sound.setMuted(!next);
          }}
        />
      )}

      {/* In-Game HUD Overlay */}
      {gameState === 'playing' && (
        <HUD
          shiftNumber={currentShift}
          currentTimeString={getClockString(gameMinutes)}
          tasks={tasks}
          targetedObject={targetedObject}
          isFlashlightOn={isFlashlightOn}
          heldItem={heldItem}
          anxietyLevel={anxietyLevel}
          isBlackout={isBlackout}
          isDoorLocked={isDoorLocked}
          isPointerLocked={isPointerLocked}
          onRequestPointerLock={() => playerRef.current?.lock()}
          onOpenRules={() => {
            setIsPhoneOpen(true);
            playerRef.current?.unlock();
          }}
          onOpenPhone={() => {
            setIsPhoneOpen(true);
            playerRef.current?.unlock();
          }}
        />
      )}

      {/* Cash Register POS Modal */}
      {isRegisterOpen && (
        <CashRegisterModal
          customer={currentCustomer}
          onCompleteSale={handleCompleteSale}
          onRefuseService={handleRefuseService}
          onStartDialogue={handleStartDialogue}
          onClose={() => {
            setIsRegisterOpen(false);
            playerRef.current?.lock();
            if (playerRef.current) playerRef.current.canMove = true;
          }}
        />
      )}

      {/* CCTV Security Camera Screen */}
      {isCctvOpen && (
        <CCTVMonitor
          onClose={() => {
            setIsCctvOpen(false);
            playerRef.current?.lock();
            if (playerRef.current) playerRef.current.canMove = true;
          }}
          watcherLocation={entityManagerRef.current?.watcherLocation || 'none'}
          aisle6Active={entityManagerRef.current?.aisle6ManActive || false}
        />
      )}

      {/* Corporate Supervisor Phone / Rules Terminal */}
      {isPhoneOpen && (
        <EmployeeTerminal
          currentShift={currentShift}
          currentRules={STORE_RULES[currentShift] || []}
          currentTime={getClockString(gameMinutes)}
          onClose={() => {
            setIsPhoneOpen(false);
            playerRef.current?.lock();
            if (playerRef.current) playerRef.current.canMove = true;
          }}
        />
      )}

      {/* Dialogue Box */}
      {activeDialogueNode && (
        <DialogueBox
          dialogueNode={activeDialogueNode}
          onSelectChoice={handleSelectDialogueChoice}
          onClose={handleCloseDialogue}
        />
      )}

      {/* Shift Summary / Paystub Modal */}
      {gameState === 'shift_summary' && (
        <ShiftSummaryModal
          shiftNumber={currentShift}
          totalEarnings={shiftSummaryInfo.earnings}
          anomaliesSurvived={shiftSummaryInfo.anomalies}
          tasksCompleted={tasks.filter((t) => t.completed).length}
          totalTasks={tasks.length}
          onNextShift={() => startShift(Math.min(6, currentShift + 1) as ShiftNumber)}
          onMainMenu={() => setGameState('menu')}
        />
      )}

      {/* Game Over / Casualty Report Modal */}
      {gameState === 'game_over' && (
        <GameOverModal
          shiftNumber={currentShift}
          causeOfDeath={gameOverInfo.cause}
          ruleViolated={gameOverInfo.rule}
          onRetry={() => startShift(currentShift)}
          onMainMenu={() => setGameState('menu')}
        />
      )}
    </div>
  );
}

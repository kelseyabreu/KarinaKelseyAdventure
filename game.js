// This is a patched version with critical fixes

// Game variables
let scene, camera, renderer, clock, loader; // Added loader
let karina, kelsey, activeCharacter;
let crystals = [];
let platforms = [];
let enemies = []; // Added enemies array
let score = 0;
let currentLevelIndex = 0; // Added level tracking
let isGameStarted = false;
let isLoadingComplete = false;
let isGameOver = false; // Added game over flag

// Movement and physics variables
const gravity = 0.005;
const jumpForce = 0.2;
const moveSpeed = 0.1;
const keys = {};
const characterRadius = 0.5; // For squish/stretch calculation
const baseScaleY = 1; // For squish/stretch

// Camera control variables
let cameraOffset = new THREE.Vector3(0, 5, 12); // Initial offset
let isPanning = false;
let previousMousePosition = { x: 0, y: 0 };
const panSensitivity = 0.01;

// Collision cooldowns
const enemyDamage = 15; // Damage per hit
const damageCooldown = 1000; // 1 second cooldown in ms
let lastDamageTime = 0;

// Character stats
const characters = {
    karina: {
        color: 0xff69b4,
        jumpMultiplier: 1.5,
        speedMultiplier: 0.9,
        health: 100
    },
    kelsey: {
        color: 0x1e90ff,
        jumpMultiplier: 0.8,
        speedMultiplier: 1.3,
        health: 100
    }
};

// Level Data
const levels = [
    // Level 1
    {
        skyColor: 0x87ceeb, // Light Sky Blue
        fogColor: 0xaaaaaa, // Light grey fog
        fogNear: 15,
        fogFar: 40,
        groundColor: 0x2e8b57, // Forest Green
        startPositionKarina: { x: -2, y: 1, z: 0 },
        startPositionKelsey: { x: 2, y: 1, z: 0 },
        platformPositions: [
            { x: -5, y: 2, z: -5, width: 3, height: 0.5, depth: 3 },
            { x: 0, y: 4, z: -8, width: 3, height: 0.5, depth: 3 },
            { x: 5, y: 6, z: -12, width: 3, height: 0.5, depth: 3 },
            { x: 10, y: 4, z: -8, width: 3, height: 0.5, depth: 3 },
            { x: 15, y: 2, z: -5, width: 3, height: 0.5, depth: 3 },
            { x: -10, y: 3, z: -7, width: 3, height: 0.5, depth: 3 },
            { x: -15, y: 5, z: -10, width: 3, height: 0.5, depth: 3 }
        ],
        crystalPositions: [
            { x: -5, y: 3, z: -5 }, { x: 0, y: 5, z: -8 }, { x: 5, y: 7, z: -12 },
            { x: 10, y: 5, z: -8 }, { x: 15, y: 3, z: -5 }, { x: -10, y: 4, z: -7 },
            { x: -15, y: 6, z: -10 }
        ],
        enemyPositions: []
    },
    // Level 2
    {
        skyColor: 0xb0c4de, // Light Steel Blue (Cloudy day)
        fogColor: 0xbebebe, // Slightly whiter fog
        fogNear: 20,
        fogFar: 50,
        groundColor: 0x6a737b, // Slate Gray
        startPositionKarina: { x: 0, y: 1, z: 2 },
        startPositionKelsey: { x: 0, y: 1, z: -2 },
        platformPositions: [
            { x: 0, y: 3, z: -5, width: 2, height: 0.5, depth: 2 },
            { x: 5, y: 5, z: -8, width: 2, height: 0.5, depth: 2 },
            { x: -5, y: 5, z: -8, width: 2, height: 0.5, depth: 2 },
            { x: 0, y: 7, z: -12, width: 4, height: 0.5, depth: 1 },
            { x: 8, y: 8, z: -15, width: 2, height: 0.5, depth: 2 },
            { x: -8, y: 8, z: -15, width: 2, height: 0.5, depth: 2 },
            { x: 0, y: 10, z: -18, width: 3, height: 0.5, depth: 3 }
        ],
        crystalPositions: [
            { x: 0, y: 4, z: -5 }, { x: 5, y: 6, z: -8 }, { x: -5, y: 6, z: -8 },
            { x: 0, y: 8, z: -12 }, { x: 8, y: 9, z: -15 }, { x: -8, y: 9, z: -15 },
            { x: 0, y: 11, z: -18 }
        ],
        enemyPositions: []
    },
     // Level 3
    {
        skyColor: 0x2c3e50, // Dark Slate Blue (Night)
        fogColor: 0x1a2531, // Darker Fog
        fogNear: 10,        // Fog starts closer at night
        fogFar: 35,
        groundColor: 0x3d3d5c, // Dark Indigo/Purple
        startPositionKarina: { x: -1, y: 1, z: 0 },
        startPositionKelsey: { x: 1, y: 1, z: 0 },
        platformPositions: [
            { x: 0, y: 2, z: -4, width: 8, height: 0.5, depth: 2 },
            { x: -6, y: 4, z: -8, width: 3, height: 0.5, depth: 3 },
            { x: 6, y: 4, z: -8, width: 3, height: 0.5, depth: 3 },
            { x: 0, y: 6, z: -12, width: 10, height: 0.5, depth: 2 },
            { x: -8, y: 8, z: -16, width: 3, height: 0.5, depth: 3 },
            { x: 8, y: 8, z: -16, width: 3, height: 0.5, depth: 3 },
            { x: 0, y: 10, z: -20, width: 4, height: 0.5, depth: 4 }
        ],
        crystalPositions: [
             { x: -3, y: 3, z: -4 }, { x: 3, y: 3, z: -4 },
             { x: -6, y: 5, z: -8 }, { x: 6, y: 5, z: -8 },
             { x: -4, y: 7, z: -12 }, { x: 0, y: 7, z: -12 }, { x: 4, y: 7, z: -12 },
             { x: -8, y: 9, z: -16 }, { x: 8, y: 9, z: -16 },
             { x: 0, y: 11, z: -20 }
        ],
        enemyPositions: [
            { x: 0, y: 2.5, z: -4, patrolAxis: 'x', patrolRange: 3.5, speed: 0.03 },
            { x: 0, y: 6.5, z: -12, patrolAxis: 'x', patrolRange: 4.5, speed: 0.04 }
        ]
    }
];

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen'); // Added
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button'); // Added
const uiOverlay = document.getElementById('ui-overlay');
const scoreValue = document.getElementById('score-value');
const levelValue = document.getElementById('level-value'); // Added
const karinaHealthBar = document.getElementById('karina-health');
const kelseyHealthBar = document.getElementById('kelsey-health');
const loadingProgress = document.getElementById('loading-progress');
const loadingText = document.getElementById('loading-text');
const finalScore = document.getElementById('final-score'); // Added
const gameCanvas = document.getElementById('game-canvas'); // Added canvas ref

// Initialize the game
function init() {
    // Set up Three.js scene
    console.log("Initializing game...");
    
    scene = new THREE.Scene();
    // Background and fog will be set per level in loadLevel
    scene.background = new THREE.Color(0x000000); // Default black background

    // Set up camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 12); // Set initial camera position

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    
    // Debug: Force a single render to check if renderer works
    renderer.render(scene, camera);
    console.log("Initial render completed");

    // Set up clock and loader
    clock = new THREE.Clock();
    loader = new THREE.TextureLoader(); // Change to TextureLoader for basic textures

    // Add lighting
    console.log("Adding lights...");
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(15, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Add helper objects for debugging
    console.log("Adding debug helpers...");
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Create a grid helper
    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    // Create characters
    console.log("Creating characters...");
    createCharacterMeshes();

    // Set active character to Karina by default
    activeCharacter = karina;

    // Add event listeners
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    window.addEventListener('resize', onWindowResize);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', resetGame);

    // Add camera panning listeners
    gameCanvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Simulate loading progress
    simulateLoading();
}

// Simulate loading progress
function simulateLoading() {
    console.log("Simulating loading...");
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            loadingProgress.style.width = '100%';
            loadingText.textContent = 'Ready!';

            // Load initial level after 'Ready!'
            loadLevel(currentLevelIndex).then(() => {
                console.log("Level loaded, scene children:", scene.children.length);
                // Force a render to check if everything is visible
                renderer.render(scene, camera);
            });

            // Short delay before showing start screen
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                startScreen.classList.remove('hidden');
                isLoadingComplete = true;
                console.log("Loading complete, start screen visible");
            }, 300);
        } else {
            loadingProgress.style.width = `${progress}%`;
        }
    }, 100);
}

// Start the game
function startGame() {
    console.log("startGame function called!");
    
    if (!isLoadingComplete || isGameStarted) {
         console.warn("startGame() blocked by conditions.");
         return;
    }
    
    // Force hide the start screen completely
    startScreen.style.display = 'none';
    
    // Show UI overlay
    uiOverlay.classList.add('visible');
    
    // Set game state
    isGameStarted = true;
    isGameOver = false;
    
    // Make sure game over is hidden
    gameOverScreen.classList.add('hidden');
    
    console.log("Game started, beginning animation loop...");
    animate();
}

// Load a specific level
// Load a specific level
function loadLevel(levelIndex) {
    return new Promise((resolve) => {
        console.log(`Loading Level ${levelIndex + 1}`);
        const levelData = levels[levelIndex];
        if (!levelData) {
            console.error("Invalid level index:", levelIndex);
            showWinScreen();
            resolve();
            return;
        }

        // Clear previous level's objects
        [...platforms].forEach(p => {
            if (p && p.parent) scene.remove(p);
        });
        [...crystals].forEach(c => {
            if (c && c.parent) scene.remove(c);
         });
        [...enemies].forEach(e => {
             if (e.mesh && e.mesh.parent) scene.remove(e.mesh);
        });
        
        // Clear the arrays
        platforms = [];
        crystals = [];
        enemies = [];

        // Set Background and Fog
        if (levelData.skyColor !== undefined) {
            scene.background = new THREE.Color(levelData.skyColor);
            console.log(`Set background color to: ${levelData.skyColor.toString(16)}`);
        } else {
            scene.background = new THREE.Color(0xcccccc);
            console.warn(`Level ${levelIndex + 1} missing skyColor, using default.`);
        }

        if (levelData.fogColor !== undefined && levelData.fogNear !== undefined && levelData.fogFar !== undefined) {
            scene.fog = new THREE.Fog(levelData.fogColor, levelData.fogNear, levelData.fogFar);
            console.log(`Level ${levelIndex + 1}: Applied Fog (Color: ${levelData.fogColor.toString(16)}, Near: ${levelData.fogNear}, Far: ${levelData.fogFar})`);
        } else {
            scene.fog = null;
            console.log(`Level ${levelIndex + 1}: No fog defined.`);
        }

        // Create Ground
        const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
             color: levelData.groundColor,
             roughness: 0.8,
             metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        ground.name = "ground";
        scene.add(ground);
        platforms.push(ground);
        console.log("Added ground to scene");

        // Create Platforms
        levelData.platformPositions.forEach((platformData, index) => {
            const platformGeometry = new THREE.BoxGeometry(platformData.width, platformData.height, platformData.depth);
            const platformMaterial = new THREE.MeshStandardMaterial({
                 color: 0x8b4513,
                 roughness: 0.7,
                 metalness: 0.1
            });
            const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
            platformMesh.position.set(platformData.x, platformData.y, platformData.z);
            platformMesh.receiveShadow = true;
            platformMesh.castShadow = true;
            platformMesh.name = `platform-${index}`;
            scene.add(platformMesh);
            platforms.push(platformMesh);
        });
        console.log(`Added ${levelData.platformPositions.length} platforms`);

        // Create Crystals
        levelData.crystalPositions.forEach((pos, index) => {
            const crystalGeometry = new THREE.OctahedronGeometry(0.5, 0);
            const crystalMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x40e0d0,
                emissiveIntensity: 0.6,
                roughness: 0.2,
                metalness: 0.3,
                transparent: true,
                opacity: 0.85
            });
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.set(pos.x, pos.y, pos.z);
            crystal.castShadow = true;
            crystal.name = `crystal-${index}`;
            scene.add(crystal);
            crystals.push(crystal);
        });
        console.log(`Added ${levelData.crystalPositions.length} crystals`);
        storeCrystalInitialPositions();

        // Create Enemies
        levelData.enemyPositions.forEach((enemyData, index) => {
            const enemyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const enemyMaterial = new THREE.MeshStandardMaterial({
                 color: 0xff0000,
                 roughness: 0.6,
                 metalness: 0.2
            });
            const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
            enemyMesh.position.set(enemyData.x, enemyData.y, enemyData.z);
            enemyMesh.castShadow = true;
            enemyMesh.name = `enemy-${index}`;
            scene.add(enemyMesh);
            enemies.push({
                mesh: enemyMesh,
                patrolAxis: enemyData.patrolAxis,
                patrolRange: enemyData.patrolRange,
                speed: enemyData.speed,
                direction: 1,
                initialPos: enemyMesh.position.clone()
            });
        });
        console.log(`Added ${levelData.enemyPositions.length} enemies`);

        // Position Characters
        if (karina && kelsey) {
             karina.position.set(levelData.startPositionKarina.x, levelData.startPositionKarina.y, levelData.startPositionKarina.z);
             karina.velocity = { x: 0, y: 0, z: 0 };
             karina.isJumping = false;
             karina.scale.set(baseScaleY, baseScaleY, baseScaleY);

             kelsey.position.set(levelData.startPositionKelsey.x, levelData.startPositionKelsey.y, levelData.startPositionKelsey.z);
             kelsey.velocity = { x: 0, y: 0, z: 0 };
             kelsey.isJumping = false;
             kelsey.scale.set(baseScaleY, baseScaleY, baseScaleY);
             
             console.log("Characters positioned:", 
                         `Karina at (${karina.position.x}, ${karina.position.y}, ${karina.position.z})`,
                         `Kelsey at (${kelsey.position.x}, ${kelsey.position.y}, ${kelsey.position.z})`);
        } else {
            console.error("Character meshes are not defined when trying to position them in loadLevel.");
        }

        // Ensure active character is set
        activeCharacter = activeCharacter || karina;

        // Update UI Elements
        levelValue.textContent = levelIndex + 1;
        updateHealthBars();

        // Reset camera to default position
        cameraOffset = new THREE.Vector3(0, 5, 12);
        updateCameraPosition();
        
        // Force a render to check if everything is visible
        renderer.render(scene, camera);
        console.log(`Level ${levelIndex + 1} loaded successfully. Scene now has ${scene.children.length} objects.`);
        
        resolve();
    });
}

// Create character meshes separately (called once in init)
function createCharacterMeshes() {
    const sphereGeometry = new THREE.SphereGeometry(characterRadius, 32, 32);

    // Create Karina
    const karinaMaterial = new THREE.MeshStandardMaterial({ 
        color: characters.karina.color, 
        roughness: 0.5, 
        metalness: 0.2 
    });
    karina = new THREE.Mesh(sphereGeometry, karinaMaterial);
    karina.castShadow = true;
    karina.name = 'karina';
    // Initialize velocity property
    karina.velocity = { x: 0, y: 0, z: 0 };
    karina.isJumping = false;
    scene.add(karina);
    console.log("Karina created and added to scene");

    // Create Kelsey
    const kelseyMaterial = new THREE.MeshStandardMaterial({ 
        color: characters.kelsey.color, 
        roughness: 0.5, 
        metalness: 0.2 
    });
    kelsey = new THREE.Mesh(sphereGeometry, kelseyMaterial);
    kelsey.castShadow = true;
    kelsey.name = 'kelsey';
    // Initialize velocity property
    kelsey.velocity = { x: 0, y: 0, z: 0 };
    kelsey.isJumping = false;
    scene.add(kelsey);
    console.log("Kelsey created and added to scene");
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Camera Panning Functions
function handleMouseDown(event) {
    if (!isGameStarted || isGameOver) return;
    isPanning = true;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
    gameCanvas.classList.add('panning');
}

function handleMouseMove(event) {
    if (!isPanning || !isGameStarted || isGameOver) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    const deltaPhi = -deltaX * panSensitivity;
    const deltaTheta = -deltaY * panSensitivity * 0.5;

    const currentOffset = camera.position.clone().sub(activeCharacter.position);

    currentOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaPhi);

    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.cross(camera.up);
    const currentTheta = Math.acos(currentOffset.clone().normalize().y);
    const maxTheta = Math.PI * 0.8;
    const minTheta = Math.PI * 0.1;

    if ((deltaTheta > 0 && currentTheta > minTheta) || (deltaTheta < 0 && currentTheta < maxTheta)) {
         currentOffset.applyAxisAngle(right, deltaTheta);
    }

    cameraOffset.copy(currentOffset);

    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;

    updateCameraPosition();
}

function handleMouseUp() {
    if (!isGameStarted) return;
    isPanning = false;
    gameCanvas.classList.remove('panning');
}

// Update camera position based on active character and offset
function updateCameraPosition() {
    if (!activeCharacter) {
        console.warn("updateCameraPosition: activeCharacter is not defined");
        return;
    }
    camera.position.copy(activeCharacter.position).add(cameraOffset);
    camera.lookAt(activeCharacter.position);
}

// Check if character is on a platform
function isOnPlatform(character) {
    const checkPoint = character.position.clone();
    checkPoint.y -= (characterRadius + 0.1);

    const raycaster = new THREE.Raycaster(character.position, new THREE.Vector3(0, -1, 0), 0, characterRadius + 0.2);

    for (const platform of platforms) {
        const intersects = raycaster.intersectObject(platform);
        if (intersects.length > 0) {
             const platformTopY = platform.position.y + (platform.geometry.parameters.height / 2);
             if (character.position.y >= platformTopY - 0.1 && character.velocity.y <= 0.01) {
                 return { platform: platform, intersectPoint: intersects[0].point };
             }
        }
    }
    return null;
}

// Check for crystal collision
// Check for crystal collision
function checkCrystalCollision() {
    if (!activeCharacter) return;
    const characterBox = new THREE.Box3().setFromObject(activeCharacter);

    for (let i = crystals.length - 1; i >= 0; i--) {
        const crystal = crystals[i];
        const crystalBox = new THREE.Box3().setFromObject(crystal);

        if (characterBox.intersectsBox(crystalBox)) {
            scene.remove(crystal);
            crystals.splice(i, 1);
            score += 10;
            scoreValue.textContent = score;

            // Increase health slightly
            const charName = activeCharacter.name;
            characters[charName].health = Math.min(100, characters[charName].health + 3);
            updateHealthBars();

            // Check for level completion
            if (crystals.length === 0) {
                currentLevelIndex++;
                if (currentLevelIndex < levels.length) {
                    transitionToNextLevel();
                } else {
                    showWinScreen();
                }
            }
        }
    }
}

function transitionToNextLevel() {
    console.log("Transitioning to next level...");
    
    // Stop the animation loop
    isGameStarted = false;
    
    // Fade out UI
    uiOverlay.classList.remove('visible');
    
    // After a short delay, load the next level
    setTimeout(() => {
        loadLevel(currentLevelIndex).then(() => {
            console.log("Next level loaded, resuming game...");
            
            // Force camera position update
            updateCameraPosition();
            
            // Render a frame
            renderer.render(scene, camera);
            
            // Show UI
            uiOverlay.classList.add('visible');
            
            // Important: Restart the game loop with a small delay
            setTimeout(() => {
                isGameStarted = true;
                console.log("Game loop resumed");
                
                // Restart animation loop
                animate();
            }, 100);
        });
    }, 700);
}

// Enemy Logic
function updateEnemies() {
    const delta = clock.getDelta();

     enemies.forEach(enemy => {
        const currentPos = enemy.mesh.position;
        const initialPos = enemy.initialPos;
        const range = enemy.patrolRange;
        const speed = enemy.speed;
        const direction = enemy.direction;
        const axis = enemy.patrolAxis;

        currentPos[axis] += speed * direction;

        // Check boundaries and reverse direction
        if (direction === 1 && currentPos[axis] >= initialPos[axis] + range) {
            currentPos[axis] = initialPos[axis] + range;
            enemy.direction = -1;
        } else if (direction === -1 && currentPos[axis] <= initialPos[axis] - range) {
            currentPos[axis] = initialPos[axis] - range;
            enemy.direction = 1;
        }
    });
}

function checkEnemyCollision() {
     if (!activeCharacter || isGameOver) return;

     const currentTime = Date.now();
     if (currentTime - lastDamageTime < damageCooldown) {
         return;
     }

    const characterBox = new THREE.Box3().setFromObject(activeCharacter);

     enemies.forEach(enemy => {
        const enemyBox = new THREE.Box3().setFromObject(enemy.mesh);

        if (characterBox.intersectsBox(enemyBox)) {
            const charName = activeCharacter.name;
            characters[charName].health = Math.max(0, characters[charName].health - enemyDamage);
            updateHealthBars();
            lastDamageTime = currentTime;

            // Apply knockback
            const knockbackDirection = activeCharacter.position.clone().sub(enemy.mesh.position).normalize();
            knockbackDirection.y = 0.5;
            activeCharacter.velocity.x += knockbackDirection.x * 0.1;
            activeCharacter.velocity.y = knockbackDirection.y * jumpForce * 0.5;
            activeCharacter.velocity.z += knockbackDirection.z * 0.1;
            activeCharacter.isJumping = true;

            // Check for game over
            if (characters[charName].health <= 0) {
                handleGameOver();
            }
        }
    });
}

function animate() {
    if (!isGameStarted || isGameOver) return;

    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Update Logic
    updateCharacterMovement(delta);
    updateEnemies();
    updateCrystalAnimation();

    // Collision Checks
    checkCrystalCollision();
    checkEnemyCollision();

    // Update Camera
    updateCameraPosition();

    // Render Scene
    console.log(`Rendering frame: Cam Pos ${camera.position.x.toFixed(1)},${camera.position.y.toFixed(1)},${camera.position.z.toFixed(1)}`);
    console.log("Scene children count:", scene.children.length);
    
    renderer.render(scene, camera);
}

// Helper function for crystal bobbing
let crystalBobTime = 0;
const crystalBobSpeed = 2;
const crystalBobAmount = 0.1;
let crystalInitialY = {}; // Store initial Y positions { crystal.uuid: y }

function storeCrystalInitialPositions() {
    crystalInitialY = {}; // Clear previous level data
    crystals.forEach(crystal => {
        crystalInitialY[crystal.uuid] = crystal.position.y;
    });
    console.log("Stored crystal initial Y positions");
}

function updateCrystalAnimation() {
    crystalBobTime += clock.getDelta() * crystalBobSpeed;
    crystals.forEach(crystal => {
        const initialY = crystalInitialY[crystal.uuid];
        if (initialY !== undefined) {
            crystal.position.y = initialY + Math.sin(crystalBobTime + crystal.position.x) * crystalBobAmount;
        }
        crystal.rotation.y += 0.01; // Gentle rotation
    });
}

// Character movement/physics logic
// Character movement/physics logic
function updateCharacterMovement(delta) {
     if (!activeCharacter) {
         console.warn("updateCharacterMovement: activeCharacter is not defined");
         return;
     }

     const moveAmount = moveSpeed * characters[activeCharacter.name].speedMultiplier;
     const jumpAmount = jumpForce * characters[activeCharacter.name].jumpMultiplier;
     let moveDirection = new THREE.Vector3(0, 0, 0);

     // Get camera direction (ignore Y component for horizontal movement)
     const cameraDirection = new THREE.Vector3();
     camera.getWorldDirection(cameraDirection);
     cameraDirection.y = 0;
     cameraDirection.normalize();
     const cameraRight = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize().multiplyScalar(-1);

     // Input Handling
     if (keys['w'] || keys['arrowup']) {
         moveDirection.add(cameraDirection);
     }
     if (keys['s'] || keys['arrowdown']) {
         moveDirection.sub(cameraDirection);
     }
     if (keys['a'] || keys['arrowleft']) {
         moveDirection.sub(cameraRight);
     }
     if (keys['d'] || keys['arrowright']) {
         moveDirection.add(cameraRight);
     }

     if (keys['q']) {
         activeCharacter = (activeCharacter === karina) ? kelsey : karina;
         keys['q'] = false; // Prevent rapid switching
         console.log(`Switched active character to ${activeCharacter.name}`);
         // Update camera immediately after switch
         updateCameraPosition();
     }

     // Normalize diagonal movement
     if (moveDirection.lengthSq() > 0) {
          moveDirection.normalize();
     }

     activeCharacter.velocity.x = moveDirection.x * moveAmount;
     activeCharacter.velocity.z = moveDirection.z * moveAmount;

     // Apply Gravity
     activeCharacter.velocity.y -= gravity;

     // Check for Ground/Platforms
     const groundInfo = isOnPlatform(activeCharacter);
     if (groundInfo) {
          // Snap to ground if falling onto it
          if (activeCharacter.velocity.y < 0) {
              activeCharacter.position.y = groundInfo.intersectPoint.y + characterRadius;
              activeCharacter.velocity.y = 0;
              activeCharacter.isJumping = false;
              // Reset Y scale after squish/stretch
              activeCharacter.scale.y = baseScaleY;
          }
     } else {
         activeCharacter.isJumping = true; // In the air if not on platform
     }

     // Jumping
     if (keys[' '] && !activeCharacter.isJumping) {
         console.log(`${activeCharacter.name} is jumping!`);
         activeCharacter.velocity.y = jumpAmount;
         activeCharacter.isJumping = true;
         // Squish effect on jump prep
          activeCharacter.scale.y = baseScaleY * 0.8;
     }

      // Apply velocity to position
      activeCharacter.position.x += activeCharacter.velocity.x;
      activeCharacter.position.y += activeCharacter.velocity.y;
      activeCharacter.position.z += activeCharacter.velocity.z;

      // Stretch effect while falling
     if (activeCharacter.isJumping && activeCharacter.velocity.y < -0.05) {
         activeCharacter.scale.y = baseScaleY * 1.2;
     } else if (!activeCharacter.isJumping && activeCharacter.scale.y !== baseScaleY) {
          activeCharacter.scale.y = baseScaleY; // Reset when grounded
     }

     // Fall death / Respawn
     if (activeCharacter.position.y < -15) {
         console.log(`${activeCharacter.name} fell off the world!`);
         characters[activeCharacter.name].health = 0;
         updateHealthBars();
         if (characters[activeCharacter.name].health <= 0) {
             handleGameOver();
         } else {
             // Respawn character at level start if health remains
             const levelData = levels[currentLevelIndex];
             const startPos = activeCharacter.name === 'karina' ? levelData.startPositionKarina : levelData.startPositionKelsey;
             activeCharacter.position.set(startPos.x, startPos.y, startPos.z);
             activeCharacter.velocity = { x: 0, y: 0, z: 0 };
             activeCharacter.isJumping = false;
             activeCharacter.scale.set(baseScaleY,baseScaleY,baseScaleY);
         }
     }

      // Update the other character
     const inactiveCharacter = (activeCharacter === karina) ? kelsey : karina;
     if (inactiveCharacter) {
         const inactiveGroundInfo = isOnPlatform(inactiveCharacter);
         if (!inactiveGroundInfo) {
             inactiveCharacter.velocity.y -= gravity;
             inactiveCharacter.position.y += inactiveCharacter.velocity.y;
         } else if (inactiveCharacter.velocity.y < 0) {
              inactiveCharacter.position.y = inactiveGroundInfo.intersectPoint.y + characterRadius;
              inactiveCharacter.velocity.y = 0;
         }
          
         // Fall check for inactive character
         if (inactiveCharacter.position.y < -15) {
             console.log(`Inactive character ${inactiveCharacter.name} fell off the world!`);
             characters[inactiveCharacter.name].health = 0;
             updateHealthBars();
             handleGameOver(); // Game over if either character falls and dies
         }
     }
 }
 
 let minZoomDistance = 1;
let maxZoomDistance = 2000;
let currentZoom = 12; // Starting zoom level (same as initial cameraOffset.z)

// Add this event listener after the other camera event listeners
window.addEventListener('wheel', handleMouseWheel);

// Add this function to handle zoom
function handleMouseWheel(event) {
    if (!isGameStarted || isGameOver) return;
    
    // Determine scroll direction
    const scrollDirection = Math.sign(event.deltaY);
    
    // Adjust zoom level
    currentZoom += scrollDirection * 0.8;
    
    // Clamp zoom to min/max values
    currentZoom = Math.max(minZoomDistance, Math.min(maxZoomDistance, currentZoom));
    
    // Update camera offset z component (distance from character)
    cameraOffset.z = currentZoom;
    
    // Update camera position immediately
    updateCameraPosition();
}

 
 function handleGameOver() {
    if (isGameOver) return; // Prevent multiple triggers
    console.log("Game Over!");
    isGameOver = true;
    isGameStarted = false; // Stop updates in animate loop
    finalScore.textContent = score; // Update final score display
    uiOverlay.classList.remove('visible'); // Hide game UI
    gameOverScreen.classList.remove('hidden'); // Show game over screen
    gameOverScreen.style.opacity = 1; // Ensure it's visible
    gameOverScreen.style.visibility = 'visible';

    // Reset button text in case it was changed by win screen
    document.getElementById('restart-button').textContent = "Restart Game";
    document.querySelector('#game-over-screen h1').textContent = "Game Over!";
}

function showWinScreen() {
    console.log("You Win!");
    isGameOver = true; // Use game over flag to stop loop
    isGameStarted = false;
    finalScore.textContent = score; // Show score on win too

    // Modify the game over screen for winning
    document.querySelector('#game-over-screen h1').textContent = "You Win!";
    document.querySelector('#game-over-screen p').textContent = `Congratulations! Final score: ${score}`;
    document.getElementById('restart-button').textContent = "Play Again?";

    uiOverlay.classList.remove('visible');
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.style.opacity = 1;
    gameOverScreen.style.visibility = 'visible';
}

function resetGame() {
    console.log("Resetting Game...");
    isGameOver = false;
    isGameStarted = false;
    score = 0;
    currentLevelIndex = 0;
    characters.karina.health = 100;
    characters.kelsey.health = 100;
    lastDamageTime = 0;

    scoreValue.textContent = score;
    updateHealthBars();

    // Hide screens
    gameOverScreen.classList.add('hidden');
    uiOverlay.classList.remove('visible');

    // Clear scene objects before loading level 0
    if (scene) {
        [...platforms].forEach(p => {
            if (p && p.parent) scene.remove(p);
            p.geometry?.dispose();
            p.material?.dispose();
        });
        [...crystals].forEach(c => {
            if (c && c.parent) scene.remove(c);
            c.geometry?.dispose();
            c.material?.dispose();
         });
        [...enemies].forEach(e => {
             if (e.mesh && e.mesh.parent) scene.remove(e.mesh);
             e.mesh.geometry?.dispose();
             e.mesh.material?.dispose();
        });
        // Also remove the ground if it wasn't the only platform left
        const ground = scene.getObjectByName("ground");
        if (ground) scene.remove(ground);

        // Clear the arrays themselves
        platforms = [];
        crystals = [];
        enemies = [];
     } else {
         console.error("Scene not found during reset");
         return;
     }

    // Reload level 0 data and reposition characters
    loadLevel(currentLevelIndex).then(() => {
        // After level is loaded, show the start screen again
        startScreen.classList.remove('hidden');
        startScreen.style.opacity = 1;
        startScreen.style.visibility = 'visible';
        isLoadingComplete = true; // Ready to start again
        console.log("Game reset completed, ready to start again");
    });
}

function forceStartScreenVisibility() {
  console.log("Forcing start screen visibility...");
  
  // Ensure loading screen is hidden
  loadingScreen.classList.add('hidden');
  loadingScreen.style.opacity = 0;
  loadingScreen.style.visibility = 'hidden';
  
  // Force start screen to be fully visible
  startScreen.classList.remove('hidden');
  startScreen.style.opacity = 1;
  startScreen.style.visibility = 'visible';
  
  // Make sure UI overlay is hidden until game starts
  uiOverlay.classList.remove('visible');
  
  // Ensure game over screen is hidden
  gameOverScreen.classList.add('hidden');
  gameOverScreen.style.opacity = 0;
  gameOverScreen.style.visibility = 'hidden';
  
  // Make start button clickable
  startButton.style.pointerEvents = 'auto';
  startButton.addEventListener('click', function() {
    console.log("Start button clicked!");
    startGame();
  });
  
  console.log("Start screen should now be visible and clickable");
}

// Call this function after a slight delay to ensure DOM is ready
setTimeout(forceStartScreenVisibility, 1000);

// Add a manual start method for debugging
window.startGameManually = function() {
  console.log("Manually starting game...");
  startGame();
};

// Update health bars
function updateHealthBars() {
    karinaHealthBar.style.width = `${Math.max(0, characters.karina.health)}%`;
    kelseyHealthBar.style.width = `${Math.max(0, characters.kelsey.health)}%`;
}

// Reset character positions
function resetCharacterPositions() {
    // Get the current level data
    const levelData = levels[currentLevelIndex];
    
    // Reset Karina
    karina.position.set(levelData.startPositionKarina.x, levelData.startPositionKarina.y, levelData.startPositionKarina.z);
    karina.velocity = { x: 0, y: 0, z: 0 };
    karina.isJumping = false;
    karina.scale.set(baseScaleY, baseScaleY, baseScaleY);
    
    // Reset Kelsey
    kelsey.position.set(levelData.startPositionKelsey.x, levelData.startPositionKelsey.y, levelData.startPositionKelsey.z);
    kelsey.velocity = { x: 0, y: 0, z: 0 };
    kelsey.isJumping = false;
    kelsey.scale.set(baseScaleY, baseScaleY, baseScaleY);
    
    // Set active character to Karina by default
    activeCharacter = karina;
    
    // Reset camera offset
    cameraOffset = new THREE.Vector3(0, 5, 12);
    
    // Update camera position
    updateCameraPosition();
    console.log("Character positions reset");
}

window.addEventListener('DOMContentLoaded', init);
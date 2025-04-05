// ===== POWER-UPS SYSTEM =====
// Power-up types and their effects
const powerUpTypes = {
    speedBoost: {
        color: 0xffff00, // Yellow
        duration: 5000, // 5 seconds
        effect: (character) => {
            const origSpeed = characters[character.name].speedMultiplier;
            characters[character.name].speedMultiplier *= 2;
            setTimeout(() => {
                characters[character.name].speedMultiplier = origSpeed;
            }, 5000);
        }
    },
    superJump: {
        color: 0x00ff00, // Green
        duration: 5000,
        effect: (character) => {
            const origJump = characters[character.name].jumpMultiplier;
            characters[character.name].jumpMultiplier *= 1.8;
            setTimeout(() => {
                characters[character.name].jumpMultiplier = origJump;
            }, 5000);
        }
    },
    shield: {
        color: 0x0000ff, // Blue
        duration: 8000, // 8 seconds
        effect: (character) => {
            character.isShielded = true;
            // Create shield visual effect
            const shieldGeometry = new THREE.SphereGeometry(characterRadius * 1.2, 32, 32);
            const shieldMaterial = new THREE.MeshStandardMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.4,
                emissive: 0x0088ff,
                emissiveIntensity: 0.5
            });
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.name = 'shield';
            character.add(shield);
            
            setTimeout(() => {
                character.isShielded = false;
                character.remove(shield);
            }, 8000);
        }
    }
};

// Power-ups array to store active power-ups
let powerUps = [];

// Function to create power-ups in the level
function createPowerUps(levelData) {
    // Clear existing power-ups
    [...powerUps].forEach(p => {
        if (p && p.parent) scene.remove(p);
    });
    powerUps = [];
    
    // Check if levelData has powerUpPositions
    if (!levelData.powerUpPositions || !levelData.powerUpPositions.length) {
        return;
    }
    
    levelData.powerUpPositions.forEach((pos, index) => {
        // Determine power-up type
        const types = Object.keys(powerUpTypes);
        const typeIndex = index % types.length;
        const type = types[typeIndex];
        
        const powerUpGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const powerUpMaterial = new THREE.MeshStandardMaterial({
            color: powerUpTypes[type].color,
            emissive: powerUpTypes[type].color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
        powerUp.position.set(pos.x, pos.y, pos.z);
        powerUp.castShadow = true;
        powerUp.userData.type = type;
        powerUp.name = `powerup-${type}-${index}`;
        
        scene.add(powerUp);
        powerUps.push(powerUp);
    });
    
    console.log(`Added ${powerUps.length} power-ups to the level`);
}

// Function to check power-up collision
function checkPowerUpCollision() {
    if (!activeCharacter) return;
    const characterBox = new THREE.Box3().setFromObject(activeCharacter);
    
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        const powerUpBox = new THREE.Box3().setFromObject(powerUp);
        
        if (characterBox.intersectsBox(powerUpBox)) {
            const type = powerUp.userData.type;
            scene.remove(powerUp);
            powerUps.splice(i, 1);
            
            // Apply power-up effect
            if (powerUpTypes[type] && powerUpTypes[type].effect) {
                powerUpTypes[type].effect(activeCharacter);
                // Show power-up message
                showMessage(`${activeCharacter.name} got ${type}!`, 2000);
            }
        }
    }
}

// Function to update power-ups (rotation, bobbing)
function updatePowerUps() {
    const time = clock.getElapsedTime();
    powerUps.forEach(powerUp => {
        powerUp.rotation.y += 0.02;
        powerUp.position.y += Math.sin(time * 3) * 0.005;
    });
}

// ===== INTERACTIVE ELEMENTS =====
// Teleporter system
let teleporters = [];

// Function to create teleporters
function createTeleporters(levelData) {
    // Clear existing teleporters
    [...teleporters].forEach(t => {
        if (t && t.parent) scene.remove(t);
    });
    teleporters = [];
    
    // Check if levelData has teleporterPairs
    if (!levelData.teleporterPairs || !levelData.teleporterPairs.length) {
        return;
    }
    
    levelData.teleporterPairs.forEach((pair, pairIndex) => {
        // Create teleporter pair with matching colors
        const pairColor = new THREE.Color().setHSL(pairIndex * 0.2, 0.8, 0.6);
        
        for (let i = 0; i < 2; i++) {
            const pos = pair[i];
            const teleporterGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
            const teleporterMaterial = new THREE.MeshStandardMaterial({
                color: pairColor,
                emissive: pairColor,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.7
            });
            
            const teleporter = new THREE.Mesh(teleporterGeometry, teleporterMaterial);
            teleporter.position.set(pos.x, pos.y, pos.z);
            teleporter.userData.pairIndex = pairIndex;
            teleporter.userData.teleportIndex = i;
            teleporter.name = `teleporter-${pairIndex}-${i}`;
            
            scene.add(teleporter);
            teleporters.push(teleporter);
        }
    });
    
    console.log(`Added ${teleporters.length} teleporters (${teleporters.length/2} pairs) to the level`);
}

// Teleporter cooldown
let lastTeleportTime = 0;
const teleportCooldown = 2000; // ms

// Function to check teleporter collision
function checkTeleporterCollision() {
    if (!activeCharacter) return;
    const characterBox = new THREE.Box3().setFromObject(activeCharacter);
    const currentTime = Date.now();
    
    // Don't check if on cooldown
    if (currentTime - lastTeleportTime < teleportCooldown) {
        return;
    }
    
    for (let i = 0; i < teleporters.length; i++) {
        const teleporter = teleporters[i];
        const teleporterBox = new THREE.Box3().setFromObject(teleporter);
        
        if (characterBox.intersectsBox(teleporterBox)) {
            // Find the paired teleporter
            const pairIndex = teleporter.userData.pairIndex;
            const teleportIndex = teleporter.userData.teleportIndex;
            const targetIndex = 1 - teleportIndex; // 0->1, 1->0
            
            const pairedTeleporter = teleporters.find(t => 
                t.userData.pairIndex === pairIndex && 
                t.userData.teleportIndex === targetIndex
            );
            
            if (pairedTeleporter) {
                // Teleport the character
                activeCharacter.position.set(
                    pairedTeleporter.position.x,
                    pairedTeleporter.position.y + characterRadius + 0.5, // Slight upward offset to prevent falling through
                    pairedTeleporter.position.z
                );
                
                // Set velocity to zero to prevent momentum carrying through teleport
                activeCharacter.velocity = { x: 0, y: 0.05, z: 0 }; // Slight upward velocity
                
                // Apply teleport effects
                createTeleportEffect(teleporter.position);
                createTeleportEffect(pairedTeleporter.position);
                
                // Set cooldown
                lastTeleportTime = currentTime;
                
                break;
            }
        }
    }
}

// ===== PARTICLE EFFECTS =====
// Function to create a teleport effect
function createTeleportEffect(position) {
    const particleCount = 30;
    const particles = new THREE.Group();
    particles.name = 'teleportEffect';
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.5;
        
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Set initial position in a circle around teleport point
        particle.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + 0.5,
            position.z + Math.sin(angle) * radius
        );
        
        // Set velocity for animation
        particle.userData.velocity = {
            x: (Math.random() - 0.5) * 0.2,
            y: Math.random() * 0.2 + 0.1,
            z: (Math.random() - 0.5) * 0.2
        };
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Animate and remove after 1 second
    let elapsed = 0;
    const particleAnimation = () => {
        particles.children.forEach(particle => {
            // Move particle according to velocity
            particle.position.x += particle.userData.velocity.x;
            particle.position.y += particle.userData.velocity.y;
            particle.position.z += particle.userData.velocity.z;
            
            // Fade out
            particle.material.opacity -= 0.02;
            if (particle.material.opacity <= 0) {
                particle.material.opacity = 0;
            }
        });
        
        elapsed += 1/60; // Assuming 60fps
        if (elapsed < 1) {
            requestAnimationFrame(particleAnimation);
        } else {
            scene.remove(particles);
            particles.children.forEach(p => {
                p.geometry.dispose();
                p.material.dispose();
            });
        }
    };
    
    particleAnimation();
}

// Crystal collection effect
function createCrystalCollectionEffect(position) {
    const particleCount = 15;
    const particles = new THREE.Group();
    particles.name = 'crystalEffect';
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        
        const particleGeometry = new THREE.OctahedronGeometry(0.2, 0);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Set initial position
        particle.position.copy(position);
        
        // Set velocity for animation (outward explosion)
        particle.userData.velocity = {
            x: Math.cos(angle) * (Math.random() * 0.2 + 0.1),
            y: Math.random() * 0.2 + 0.15,
            z: Math.sin(angle) * (Math.random() * 0.2 + 0.1)
        };
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Animate and remove after 1 second
    let elapsed = 0;
    const particleAnimation = () => {
        particles.children.forEach(particle => {
            // Move particle according to velocity
            particle.position.x += particle.userData.velocity.x;
            particle.position.y += particle.userData.velocity.y;
            particle.position.z += particle.userData.velocity.z;
            
            // Add gravity
            particle.userData.velocity.y -= 0.01;
            
            // Spin
            particle.rotation.x += 0.1;
            particle.rotation.y += 0.1;
            
            // Fade out
            particle.material.opacity -= 0.02;
            if (particle.material.opacity <= 0) {
                particle.material.opacity = 0;
            }
        });
        
        elapsed += 1/60; // Assuming 60fps
        if (elapsed < 1) {
            requestAnimationFrame(particleAnimation);
        } else {
            scene.remove(particles);
            particles.children.forEach(p => {
                p.geometry.dispose();
                p.material.dispose();
            });
        }
    };
    
    particleAnimation();
}

// ===== UI ENHANCEMENTS =====
// Message display system
let activeMessages = [];

function showMessage(text, duration = 3000) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('game-message');
    messageElement.textContent = text;
    
    // Add to message container
    const messageContainer = document.getElementById('message-container') || createMessageContainer();
    messageContainer.appendChild(messageElement);
    
    // Animate in
    setTimeout(() => {
        messageElement.classList.add('visible');
    }, 10);
    
    // Track message
    const messageData = { element: messageElement, removeTime: Date.now() + duration };
    activeMessages.push(messageData);
    
    // Remove after duration
    setTimeout(() => {
        messageElement.classList.remove('visible');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
            // Remove from tracking array
            const index = activeMessages.findIndex(m => m.element === messageElement);
            if (index !== -1) {
                activeMessages.splice(index, 1);
            }
        }, 500); // Transition duration
    }, duration);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'message-container';
    container.style.position = 'absolute';
    container.style.top = '100px';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '30';
    document.body.appendChild(container);
    
    // Add styles for messages
    const style = document.createElement('style');
    style.textContent = `
        .game-message {
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            margin-bottom: 10px;
            font-size: 18px;
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .game-message.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
    
    return container;
}

// ===== ENHANCEMENTS FOR CHECKCRYSTALCOLLISION FUNCTION =====
// Replace the existing checkCrystalCollision function with this enhanced version
// that includes particle effects
function enhancedCheckCrystalCollision() {
    if (!activeCharacter) return;
    const characterBox = new THREE.Box3().setFromObject(activeCharacter);

    for (let i = crystals.length - 1; i >= 0; i--) {
        const crystal = crystals[i];
        const crystalBox = new THREE.Box3().setFromObject(crystal);

        if (characterBox.intersectsBox(crystalBox)) {
            // Store position before removing (for effect)
            const crystalPosition = crystal.position.clone();
            
            // Remove crystal
            scene.remove(crystal);
            crystals.splice(i, 1);
            
            // Add score
            score += 10;
            scoreValue.textContent = score;

            // Create particle effect
            createCrystalCollectionEffect(crystalPosition);
            
            // Show message
            showMessage("+10 points!", 1500);

            // Increase health slightly
            const charName = activeCharacter.name;
            const healthBefore = characters[charName].health;
            characters[charName].health = Math.min(100, characters[charName].health + 3);
            
            // Show health message if health increased
            if (characters[charName].health > healthBefore) {
                showMessage(`+${characters[charName].health - healthBefore} Health`, 1500);
            }
            
            updateHealthBars();

            // Check for level completion
            if (crystals.length === 0) {
                showMessage("Level Complete!", 2000);
                
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

// ===== CHARACTER ABILITIES =====
// Enhanced special abilities for each character

// Karina's ability: Super Bounce (higher jump with shockwave)
function activateKarinaAbility() {
    if (activeCharacter !== karina || karina.isUsingAbility) return;
    
    // Set cooldown flag
    karina.isUsingAbility = true;
    
    // Super bounce effect
    karina.velocity.y = jumpForce * 2;
    karina.isJumping = true;
    
    // Create shockwave effect when landing
    const checkForLanding = () => {
        const groundInfo = isOnPlatform(karina);
        if (groundInfo && karina.velocity.y <= 0) {
            // Create shockwave
            createShockwaveEffect(karina.position);
            
            // Push enemies away
            enemies.forEach(enemy => {
                const distance = enemy.mesh.position.distanceTo(karina.position);
                if (distance < 5) {
                    const direction = enemy.mesh.position.clone().sub(karina.position).normalize();
                    const force = 5 * (1 - distance/5); // Stronger force when closer
                    enemy.mesh.position.add(direction.multiplyScalar(force));
                }
            });
            
            // Show message
            showMessage("Super Bounce!", 1500);
            
            // Clear the check interval
            clearInterval(landingCheckInterval);
            
            // Reset cooldown after 5 seconds
            setTimeout(() => {
                karina.isUsingAbility = false;
            }, 5000);
        }
    };
    
    // Check for landing every 100ms
    const landingCheckInterval = setInterval(checkForLanding, 100);
    
    // Clear interval after 5 seconds (safety)
    setTimeout(() => {
        clearInterval(landingCheckInterval);
    }, 5000);
}

// Kelsey's ability: Speed Dash
function activateKelseyAbility() {
    if (activeCharacter !== kelsey || kelsey.isUsingAbility) return;
    
    // Set cooldown flag
    kelsey.isUsingAbility = true;
    
    // Get camera direction for dash
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    
    // Apply dash velocity
    kelsey.velocity.x = direction.x * moveSpeed * 5;
    kelsey.velocity.z = direction.z * moveSpeed * 5;
    
    // Create dash effect
    createDashEffect(kelsey);
    
    // Show message
    showMessage("Speed Dash!", 1500);
    
    // Reset cooldown after 3 seconds
    setTimeout(() => {
        kelsey.isUsingAbility = false;
    }, 3000);
}

// Effect for Karina's shockwave
function createShockwaveEffect(position) {
    // Create a ring geometry
    const ringGeometry = new THREE.RingGeometry(0.5, 1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff69b4, // Karina's color
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.position.y += 0.1; // Slightly above ground
    ring.rotation.x = Math.PI / 2; // Flat on ground
    scene.add(ring);
    
    // Animate ring expansion
    let scale = 1;
    const expandRing = () => {
        scale += 0.2;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity -= 0.02;
        
        if (ring.material.opacity > 0) {
            requestAnimationFrame(expandRing);
        } else {
            scene.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    };
    
    expandRing();
}

// Effect for Kelsey's dash
function createDashEffect(character) {
    // Create trail effect
    const trailCount = 5;
    const trailGroup = new THREE.Group();
    trailGroup.name = 'dashTrail';
    
    for (let i = 0; i < trailCount; i++) {
        // Clone character geometry but with transparent material
        const trailGeometry = character.geometry.clone();
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: characters[character.name].color,
            transparent: true,
            opacity: 0.7 - (i * 0.1)
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.copy(character.position);
        trail.scale.copy(character.scale);
        trail.rotation.copy(character.rotation);
        
        trailGroup.add(trail);
        
        // Stagger the trails
        setTimeout(() => {
            trail.position.copy(character.position);
        }, i * 50);
    }
    
    scene.add(trailGroup);
    
    // Remove trail after a short time
    setTimeout(() => {
        scene.remove(trailGroup);
        trailGroup.children.forEach(t => {
            t.geometry.dispose();
            t.material.dispose();
        });
    }, 500);
}

// ===== UPDATED LEVEL DATA =====
// Add power-ups and teleporters to levels
// This function updates the existing levels array
function enhanceLevelData() {
    // Level 1 enhancements
    levels[0].powerUpPositions = [
        { x: 0, y: 5, z: -8 }, // On middle platform
        { x: -15, y: 6, z: -10 } // On far platform
    ];
    levels[0].teleporterPairs = [
        [
            { x: -5, y: 2.1, z: -5 }, // First platform
            { x: 15, y: 2.1, z: -5 }  // Last platform
        ]
    ];
    
    // Level 2 enhancements
    levels[1].powerUpPositions = [
        { x: -5, y: 6, z: -8 },
        { x: 5, y: 6, z: -8 },
        { x: 0, y: 11, z: -18 } // On highest platform
    ];
    levels[1].teleporterPairs = [
        [
            { x: -8, y: 8.1, z: -15 },
            { x: 8, y: 8.1, z: -15 }
        ]
    ];
    
    // Level 3 enhancements
    levels[2].powerUpPositions = [
        { x: -6, y: 5, z: -8 },
        { x: 6, y: 5, z: -8 },
        { x: -8, y: 9, z: -16 },
        { x: 8, y: 9, z: -16 }
    ];
    levels[2].teleporterPairs = [
        [
            { x: -3, y: 2.1, z: -4 },
            { x: 3, y: 2.1, z: -4 }
        ],
        [
            { x: -4, y: 6.1, z: -12 },
            { x: 4, y: 6.1, z: -12 }
        ]
    ];
    
    // Additional enemies for level 3 (more challenging)
    levels[2].enemyPositions.push(
        { x: 0, y: 10.5, z: -20, patrolAxis: 'x', patrolRange: 1.5, speed: 0.05 }
    );
    
    console.log("Level data enhanced with power-ups and teleporters");
}

// ===== INTEGRATE ENHANCEMENTS =====
// This function adds all our enhancements to the game

function integrateEnhancements() {
    // 1. Enhance level data
    enhanceLevelData();
    
    // 2. Update loadLevel function to include power-ups and teleporters
    const originalLoadLevel = loadLevel;
    loadLevel = function(levelIndex) {
        return originalLoadLevel(levelIndex).then(() => {
            createPowerUps(levels[levelIndex]);
            createTeleporters(levels[levelIndex]);
        });
    };
    
    // 3. Replace checkCrystalCollision with enhanced version
checkCrystalCollision = enhancedCheckCrystalCollision;

    
    // 4. Add event listeners for character abilities
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'e') {
            // E key activates current character's special ability
            if (activeCharacter === karina) {
                activateKarinaAbility();
            } else if (activeCharacter === kelsey) {
                activateKelseyAbility();
            }
        }
    });
    
    // 5. Modify animate function to include new updates
    const originalAnimate = animate;
    animate = function() {
        if (!isGameStarted || isGameOver) return;
        
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        // Original updates
        updateCharacterMovement(delta);
        updateEnemies();
        updateCrystalAnimation();

        // New updates
        updatePowerUps();
        checkPowerUpCollision();
        checkTeleporterCollision();

        // Original collision checks and rendering
        checkCrystalCollision();
        checkEnemyCollision();

        // Update camera
        updateCameraPosition();

        // Render Scene
        renderer.render(scene, camera);
    };
    
    // 6. Add message container for UI
    createMessageContainer();
    
    // 7. Update controls info to include special abilities
    const controlsInfo = document.getElementById('controls-info');
    if (controlsInfo) {
        const abilityInfo = document.createElement('p');
        abilityInfo.textContent = 'E: Special Ability (Karina: Super Bounce, Kelsey: Speed Dash)';
        controlsInfo.appendChild(abilityInfo);
    }
    
    // 8. Modify updateCharacterMovement to include ability cooldown indicators
    const originalUpdateCharacterMovement = updateCharacterMovement;
    updateCharacterMovement = function(delta) {
        originalUpdateCharacterMovement(delta);
        
        // Add visual indicator for ability cooldown
        if (karina.isUsingAbility) {
            // Pulsing effect for Karina when ability is on cooldown
            const pulseAmount = (Math.sin(clock.getElapsedTime() * 5) + 1) / 4 + 0.5;
            karina.material.emissive = new THREE.Color(0xff69b4);
            karina.material.emissiveIntensity = pulseAmount;
        } else {
            karina.material.emissiveIntensity = 0;
        }
        
        if (kelsey.isUsingAbility) {
            // Pulsing effect for Kelsey when ability is on cooldown
            const pulseAmount = (Math.sin(clock.getElapsedTime() * 5) + 1) / 4 + 0.5;
            kelsey.material.emissive = new THREE.Color(0x1e90ff);
            kelsey.material.emissiveIntensity = pulseAmount;
        } else {
            kelsey.material.emissiveIntensity = 0;
        }
    };
    
    // 9. Add flash screen effect function
    function flashScreen(color) {
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = color;
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '40';
        flash.style.opacity = '1';
        flash.style.transition = 'opacity 0.5s ease';
        document.body.appendChild(flash);
        
        // Fade out and remove
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 500);
        }, 100);
    }
    
    console.log("Game enhancements integrated successfully!");
}

// Call the integration function to apply all enhancements
integrateEnhancements();
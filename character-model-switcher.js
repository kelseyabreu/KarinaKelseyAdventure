// ===== HUMAN CHARACTER MODEL SYSTEM =====

// Track model state
let useHumanModel = false;
let humanModelLoaded = false;
let humanKarinaModel = null;
let originalKarinaGeometry = null;

// Add model switch button to the UI
function addModelSwitchButton() {
    // Create the button
    const switchButton = document.createElement('button');
    switchButton.id = 'model-switch-button';
    switchButton.textContent = 'Switch to Human Model';
    
    // Add click handler
    switchButton.addEventListener('click', toggleCharacterModel);
    
    // Add to the document
    document.body.appendChild(switchButton);
    console.log("Model switch button added to UI");
}

// Toggle between sphere and human model
function toggleCharacterModel() {
    console.log("Toggle button clicked!");
    const button = document.getElementById('model-switch-button');
    
    if (!humanModelLoaded) {
        // First time switching - load the model
        console.log("First load - beginning human model creation");
        button.textContent = 'Loading Human Model...';
        button.disabled = true;
        
        loadHumanModel().then(() => {
            console.log("Human model loaded successfully");
            humanModelLoaded = true;
            useHumanModel = true;
            button.textContent = 'Switch to Sphere Model';
            button.disabled = false;
            
            // Store the original geometry for switching back
            originalKarinaGeometry = karina.geometry.clone();
            
            // Apply the human model
            applyHumanModel();
        }).catch(err => {
            console.error("Error loading human model:", err);
            button.textContent = 'Failed to Load Model - Try Again';
            button.disabled = false;
        });
    } else {
        // Toggle between models
        useHumanModel = !useHumanModel;
        
        if (useHumanModel) {
            button.textContent = 'Switch to Sphere Model';
            applyHumanModel();
        } else {
            button.textContent = 'Switch to Human Model';
            restoreOriginalModel();
        }
    }
    
    // Show message about the switch
    showMessage(useHumanModel ? "Switched to human model!" : "Switched to sphere model!", 2000);
}

// Load human model using a procedural approach
function loadHumanModel() {
    return new Promise((resolve, reject) => {
        // Create a humanoid figure procedurally since we don't have an external model
        createProceduralHumanModel().then(model => {
            humanKarinaModel = model;
            resolve();
        }).catch(reject);
    });
}

// Create a procedural human model since we don't have an external model
function createProceduralHumanModel() {
    return new Promise((resolve) => {
        // Create a group to hold all the body parts
        const humanModel = new THREE.Group();
        
        // Create materials
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac, // Light skin tone
            roughness: 0.7,
            metalness: 0.1
        });
        
        const clothingMaterial = new THREE.MeshStandardMaterial({
            color: 0xff69b4, // Pink (Karina's color)
            roughness: 0.6,
            metalness: 0.1
        });
        
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // Brown hair
            roughness: 0.5,
            metalness: 0.2
        });
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 32, 32),
            skinMaterial
        );
        head.position.y = 0.6;
        humanModel.add(head);
        
        // Hair
        const hair = new THREE.Mesh(
            new THREE.SphereGeometry(0.26, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
            hairMaterial
        );
        hair.position.y = 0.6;
        hair.rotation.x = Math.PI;
        humanModel.add(hair);
        
        // Face features
        // Eyes
        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        leftEye.position.set(-0.08, 0.6, 0.2);
        humanModel.add(leftEye);
        
        const rightEye = leftEye.clone();
        rightEye.position.set(0.08, 0.6, 0.2);
        humanModel.add(rightEye);
        
        // Eye pupils
        const leftPupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        leftPupil.position.set(-0.08, 0.6, 0.23);
        humanModel.add(leftPupil);
        
        const rightPupil = leftPupil.clone();
        rightPupil.position.set(0.08, 0.6, 0.23);
        humanModel.add(rightPupil);
        
        // Mouth
        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.02, 0.01),
            new THREE.MeshStandardMaterial({ color: 0xff3366 })
        );
        mouth.position.set(0, 0.53, 0.24);
        humanModel.add(mouth);
        
        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.4, 0.25),
            clothingMaterial
        );
        torso.position.y = 0.3;
        humanModel.add(torso);
        
        // Arms
        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16),
            skinMaterial
        );
        leftArm.position.set(-0.22, 0.3, 0);
        leftArm.rotation.z = Math.PI / 16;
        humanModel.add(leftArm);
        
        const rightArm = leftArm.clone();
        rightArm.position.set(0.22, 0.3, 0);
        rightArm.rotation.z = -Math.PI / 16;
        humanModel.add(rightArm);
        
        // Hands
        const leftHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 16, 16),
            skinMaterial
        );
        leftHand.position.set(-0.25, 0.1, 0);
        humanModel.add(leftHand);
        
        const rightHand = leftHand.clone();
        rightHand.position.set(0.25, 0.1, 0);
        humanModel.add(rightHand);
        
        // Legs
        const leftLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.4, 16),
            new THREE.MeshStandardMaterial({ color: 0x444444 }) // Dark pants
        );
        leftLeg.position.set(-0.1, -0.1, 0);
        humanModel.add(leftLeg);
        
        const rightLeg = leftLeg.clone();
        rightLeg.position.set(0.1, -0.1, 0);
        humanModel.add(rightLeg);
        
        // Feet
        const leftFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.05, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x444444 }) // Dark shoes
        );
        leftFoot.position.set(-0.1, -0.32, 0.04);
        humanModel.add(leftFoot);
        
        const rightFoot = leftFoot.clone();
        rightFoot.position.set(0.1, -0.32, 0.04);
        humanModel.add(rightFoot);
        
        // Set the entire model to cast shadows
        humanModel.traverse(node => {
            if (node instanceof THREE.Mesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        
        // Scale the model to match the sphere size
        humanModel.scale.set(0.5, 0.5, 0.5);
        
        // Create animations
        createCharacterAnimations(humanModel);
        
        resolve(humanModel);
    });
}

// Create animations for the human model
function createCharacterAnimations(model) {
    // Store initial positions for animation
    model.userData.initialPositions = {};
    model.children.forEach(child => {
        model.userData.initialPositions[child.id] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
        };
    });
    
    // Add animation functions
    model.userData.animateWalk = (speed) => {
        const time = clock.getElapsedTime();
        
        // Animate legs
        const legs = model.children.filter(child => 
            child.position.y === -0.1);
        
        legs.forEach((leg, index) => {
            const offset = index === 0 ? 0 : Math.PI; // Opposite phase
            leg.position.y = -0.1 + Math.sin(time * 10 * speed) * 0.05;
            leg.rotation.x = Math.sin(time * 10 * speed + offset) * 0.3;
        });
        
        // Animate arms
        const arms = model.children.filter(child => 
            (child.position.y === 0.3 && (child.position.x === -0.22 || child.position.x === 0.22)));
        
        arms.forEach((arm, index) => {
            const offset = index === 0 ? 0 : Math.PI; // Opposite phase
            arm.rotation.x = Math.sin(time * 10 * speed + offset) * 0.3;
        });
        
        // Animate hands based on arm positions
        const hands = model.children.filter(child => 
            (child.position.y === 0.1 && (child.position.x === -0.25 || child.position.x === 0.25)));
            
        hands.forEach((hand, index) => {
            const armOffset = index === 0 ? -0.25 : 0.25;
            const offset = index === 0 ? 0 : Math.PI; // Opposite phase
            hand.position.z = Math.sin(time * 10 * speed + offset) * 0.1;
            hand.position.y = 0.1 + Math.sin(time * 10 * speed + offset) * 0.05;
        });
        
        // Subtle torso bobbing
        const torso = model.children.find(child => child.position.y === 0.3 && child.geometry.type === 'BoxGeometry');
        if (torso) {
            torso.position.y = 0.3 + Math.sin(time * 10 * speed) * 0.02;
        }
        
        // Head slight movement
        const head = model.children.find(child => child.position.y === 0.6 && child.geometry.type === 'SphereGeometry');
        if (head) {
            head.rotation.y = Math.sin(time * 5 * speed) * 0.1;
        }
    };
    
    model.userData.animateJump = (jumpProgress) => {
        // 0 = start of jump, 0.5 = apex, 1 = landed
        
        // Crouch at start and end of jump
        if (jumpProgress < 0.2 || jumpProgress > 0.8) {
            // Crouch position
            model.scale.y = 0.45; // Squish vertically
            model.scale.x = 0.55; // Stretch horizontally
            model.scale.z = 0.55;
        } else if (jumpProgress >= 0.2 && jumpProgress <= 0.8) {
            // Mid-jump - stretched position
            model.scale.y = 0.55; // Stretch vertically
            model.scale.x = 0.45; // Squish horizontally
            model.scale.z = 0.45;
            
            // Arms up during jump
            const arms = model.children.filter(child => 
                (child.position.y === 0.3 && (child.position.x === -0.22 || child.position.x === 0.22)));
            
            arms.forEach(arm => {
                arm.rotation.z = 0;
                arm.rotation.x = -Math.PI / 4;
            });
            
            // Legs tucked up during jump apex
            if (jumpProgress > 0.4 && jumpProgress < 0.6) {
                const legs = model.children.filter(child => 
                    child.position.y === -0.1);
                
                legs.forEach(leg => {
                    leg.rotation.x = -Math.PI / 6;
                });
            }
        }
    };
    
    model.userData.resetAnimation = () => {
        // Reset all body parts to initial positions
        model.children.forEach(child => {
            if (model.userData.initialPositions[child.id]) {
                const initial = model.userData.initialPositions[child.id];
                child.position.copy(initial.position);
                child.rotation.copy(initial.rotation);
            }
        });
        
        // Reset scale
        model.scale.set(0.5, 0.5, 0.5);
    };
}

// Apply human model to Karina
function applyHumanModel() {
    if (!humanKarinaModel || !karina) return;
    
    // Save original scale before switching
    const origScale = karina.scale.clone();
    
    // Remove old geometry
    scene.remove(karina);
    
    // Create new mesh for Karina using the human model
    const newKarina = humanKarinaModel.clone();
    newKarina.name = 'karina';
    
    // Copy properties from original Karina
    newKarina.position.copy(karina.position);
    newKarina.velocity = karina.velocity;
    newKarina.isJumping = karina.isJumping;
    newKarina.isShielded = karina.isShielded;
    newKarina.isUsingAbility = karina.isUsingAbility;
    
    // Add material property to the group itself for compatibility with the cooldown effect
    newKarina.material = {
        emissive: new THREE.Color(0xff69b4),
        emissiveIntensity: 0
    };
    
    // Update the global reference
    karina = newKarina;
    scene.add(karina);
    
    // Update activeCharacter reference if needed
    if (activeCharacter.name === 'karina') {
        activeCharacter = karina;
    }
    
    console.log("Applied human model to Karina");
}

// Restore original sphere model
function restoreOriginalModel() {
    if (!originalKarinaGeometry || !karina) return;
    
    // Save position and properties before switching
    const position = karina.position.clone();
    const velocity = karina.velocity;
    const isJumping = karina.isJumping;
    const isShielded = karina.isShielded;
    const isUsingAbility = karina.isUsingAbility;
    
    // Remove human model
    scene.remove(karina);
    
    // Create new sphere mesh with original material
    const material = new THREE.MeshStandardMaterial({ 
        color: characters.karina.color, 
        roughness: 0.5, 
        metalness: 0.2 
    });
    
    const newKarina = new THREE.Mesh(originalKarinaGeometry, material);
    newKarina.name = 'karina';
    newKarina.castShadow = true;
    
    // Restore properties
    newKarina.position.copy(position);
    newKarina.velocity = velocity;
    newKarina.isJumping = isJumping;
    newKarina.isShielded = isShielded;
    newKarina.isUsingAbility = isUsingAbility;
    
    // Update the global reference
    karina = newKarina;
    scene.add(karina);
    
    // Update activeCharacter reference if needed
    if (activeCharacter.name === 'karina') {
        activeCharacter = karina;
    }
    
    console.log("Restored original sphere model for Karina");
}

// Override the existing updateCharacterMovement function to animate the human model
function enhanceUpdateCharacterMovement() {
    // Store the original function
    const originalUpdateCharacterMovement = updateCharacterMovement;
    
    // Create enhanced version that adds model animation
    updateCharacterMovement = function(delta) {
        // Call the original function
        originalUpdateCharacterMovement(delta);
        
        // Add human model animations if active
        if (useHumanModel && karina.userData && typeof karina.userData.animateWalk === 'function') {
            if (karina === activeCharacter) {
                // Get movement speed
                const isMoving = 
                    activeCharacter.velocity.x !== 0 || 
                    activeCharacter.velocity.z !== 0;
                
                // Calculate speed for animation
                const speed = Math.sqrt(
                    activeCharacter.velocity.x * activeCharacter.velocity.x + 
                    activeCharacter.velocity.z * activeCharacter.velocity.z
                ) / moveSpeed;
                
                if (activeCharacter.isJumping) {
                    // Determine jump progress based on velocity.y
                    // From start (negative just after jump) to apex (0) to landing (positive falling)
                    let jumpProgress = 0.5; // Default to apex
                    
                    if (activeCharacter.velocity.y > 0) {
                        // Rising - early jump phase
                        jumpProgress = 0.5 - (activeCharacter.velocity.y / (jumpForce * 2));
                    } else if (activeCharacter.velocity.y < 0) {
                        // Falling - late jump phase
                        jumpProgress = 0.5 + (-activeCharacter.velocity.y / (jumpForce * 2));
                    }
                    
                    // Clamp between 0-1
                    jumpProgress = Math.max(0, Math.min(1, jumpProgress));
                    
                    // Animate jump
                    karina.userData.animateJump(jumpProgress);
                } else if (isMoving) {
                    // Walking/running animation
                    karina.userData.animateWalk(speed);
                } else {
                    // Reset to idle pose
                    karina.userData.resetAnimation();
                }
                
                // Always face the direction of movement
                if (isMoving) {
                    const angle = Math.atan2(
                        activeCharacter.velocity.x,
                        activeCharacter.velocity.z
                    );
                    karina.rotation.y = angle;
                }
            }
        }
    };
}

// FIX FOR ABILITY COOLDOWN VISUALS
// Override the part of game-enhancements.js that's causing the error
function fixAbilityCooldownEffects() {
    const originalUpdateCharacterMovementFromEnhancements = updateCharacterMovement;
    
    updateCharacterMovement = function(delta) {
        // Call the originals first
        originalUpdateCharacterMovementFromEnhancements(delta);
        
        // Safe way to add visual cooldown effects
        try {
            // Add visual indicator for ability cooldown
            if (karina && karina.isUsingAbility) {
                // Pulsing effect for Karina when ability is on cooldown
                const pulseAmount = (Math.sin(clock.getElapsedTime() * 5) + 1) / 4 + 0.5;
                
                // Handle both types of models
                if (useHumanModel) {
                    // For human model - apply to all body parts
                    if (karina.children && karina.children.length > 0) {
                        karina.children.forEach(child => {
                            if (child.material) {
                                child.material.emissive = new THREE.Color(0xff69b4);
                                child.material.emissiveIntensity = pulseAmount * 0.5;
                            }
                        });
                    }
                    // Also set group property for compatibility
                    if (karina.material) {
                        karina.material.emissiveIntensity = pulseAmount;
                    }
                } else {
                    // For sphere model
                    if (karina.material) {
                        karina.material.emissive = new THREE.Color(0xff69b4);
                        karina.material.emissiveIntensity = pulseAmount;
                    }
                }
            } else if (karina && karina.material) {
                // Reset when not using ability - handle sphere model
                if (!useHumanModel) {
                    karina.material.emissiveIntensity = 0;
                }
            }
            
            // Similar for Kelsey (no need to modify since we're not changing Kelsey's model)
            if (kelsey && kelsey.isUsingAbility && kelsey.material) {
                const pulseAmount = (Math.sin(clock.getElapsedTime() * 5) + 1) / 4 + 0.5;
                kelsey.material.emissive = new THREE.Color(0x1e90ff);
                kelsey.material.emissiveIntensity = pulseAmount;
            } else if (kelsey && kelsey.material) {
                kelsey.material.emissiveIntensity = 0;
            }
        } catch (e) {
            // Silently ignore errors in the visual effects - they're not critical
            console.warn("Error in cooldown effect:", e);
        }
    };
}

// ===== SHIELD EFFECT ENHANCEMENT FOR HUMAN MODEL =====
// Override the shield effect to work with human model
function enhanceShieldEffect() {
    // Get the original shield effect from the powerUpTypes
    const originalShieldEffect = powerUpTypes.shield.effect;
    
    // Replace with an enhanced version
    powerUpTypes.shield.effect = function(character) {
        character.isShielded = true;
        
        // Create shield visual effect - different based on model type
        let shield;
        
        if (useHumanModel && character === karina) {
            // For human model, create a larger shield that fits the human form
            const shieldGeometry = new THREE.SphereGeometry(0.6, 32, 32);
            const shieldMaterial = new THREE.MeshStandardMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.4,
                emissive: 0x0088ff,
                emissiveIntensity: 0.5
            });
            shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.name = 'shield';
            character.add(shield);
        } else {
            // For sphere model, use the original shield size
            const shieldGeometry = new THREE.SphereGeometry(characterRadius * 1.2, 32, 32);
            const shieldMaterial = new THREE.MeshStandardMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.4,
                emissive: 0x0088ff,
                emissiveIntensity: 0.5
            });
            shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.name = 'shield';
            character.add(shield);
        }
        
        setTimeout(() => {
            character.isShielded = false;
            character.remove(shield);
        }, 8000);
    };
}

// ===== ENHANCE MODEL SWITCHING DURING LEVEL TRANSITIONS =====
// Override the loadLevel function to handle model switching during level transitions
function enhanceLoadLevel() {
    const originalLoadLevel = loadLevel;
    
    loadLevel = function(levelIndex) {
        return originalLoadLevel(levelIndex).then(() => {
            // After level is loaded, if we're using the human model, re-apply it
            if (humanModelLoaded && useHumanModel) {
                // Store the original geometry in case it was recreated
                originalKarinaGeometry = karina.geometry.clone();
                
                // Apply the human model
                applyHumanModel();
            }
        });
    };
}

// ===== INTEGRATION =====
// Initialize the model switcher system
function initModelSwitcher() {
    addModelSwitchButton();
    enhanceUpdateCharacterMovement();
    enhanceShieldEffect();
    enhanceLoadLevel();
    fixAbilityCooldownEffects(); // Add this new function call
    console.log("Character model switcher initialized");
    
    // Force the button to be visible
    const btn = document.getElementById('model-switch-button');
    if (btn) {
        btn.style.visibility = 'visible';
        btn.style.display = 'block';
        console.log("Forced button visibility");
    }
}

// Call after the game has loaded
window.addEventListener('DOMContentLoaded', () => {
    // Set a timer to initialize after game is fully loaded
    let initializationAttempts = 0;
    
    const tryInitialize = () => {
        initializationAttempts++;
        
        if (scene && karina && kelsey && typeof powerUpTypes !== 'undefined') {
            console.log("Game objects found - Initializing model switcher");
            initModelSwitcher();
        } else if (initializationAttempts < 10) {
            console.warn(`Game not fully loaded (attempt ${initializationAttempts}), retrying in 1 second...`);
            setTimeout(tryInitialize, 1000);
        } else {
            console.error("Could not initialize model switcher after 10 attempts");
        }
    };
    
    // Start initialization attempts after a short delay
    setTimeout(tryInitialize, 2000);
});
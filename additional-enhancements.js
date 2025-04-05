// ===== ADVANCED GAME ENHANCEMENTS =====

// ===== BOSS BATTLE SYSTEM =====
let boss = null;
let isBossBattle = false;
let bossHealth = 100;
let bossAttackTimer = 0;
let bossPhase = 1;

// Boss creation function
function createBoss(position) {
    // Remove any existing boss
    if (boss && boss.parent) {
        scene.remove(boss);
    }
    
    // Create boss mesh - a larger, more complex enemy
    const bossGeometry = new THREE.Group();
    
    // Boss body
    const bodyGeometry = new THREE.BoxGeometry(2, 2, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B0000, // Dark red
        roughness: 0.7,
        metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bossGeometry.add(body);
    
    // Boss eyes
    const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFF00, // Yellow
        emissive: 0xFFFF00,
        emissiveIntensity: 0.5
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.5, 0.5, 0.9);
    bossGeometry.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.5, 0.5, 0.9);
    bossGeometry.add(rightEye);
    
    // Boss crown/spikes
    const spikeGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
    const spikeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFA500, // Orange
        roughness: 0.5,
        metalness: 0.5
    });
    
    for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.position.y = 1.2;
        spike.position.x = (i - 2) * 0.4;
        spike.rotation.x = Math.PI; // Point up
        bossGeometry.add(spike);
    }
    
    // Create complete boss mesh
    boss = bossGeometry;
    boss.position.copy(position);
    boss.castShadow = true;
    boss.name = 'boss';
    
    // Add boss properties
    boss.userData = {
        health: 100,
        phase: 1,
        attackCooldown: 0,
        isVulnerable: false,
        targetPosition: position.clone(),
        velocity: new THREE.Vector3(0, 0, 0)
    };
    
    scene.add(boss);
    console.log("Boss created at", position);
    
    // Set boss battle flag
    isBossBattle = true;
    bossHealth = 100;
    bossPhase = 1;
    
    // Show boss health bar
    showBossHealthBar();
    
    // Show boss intro message
    showMessage("BOSS BATTLE: The Crystal Guardian", 5000);
    
    return boss;
}

// Boss AI update function
function updateBoss(delta) {
    if (!boss || !isBossBattle) return;
    
    // Update boss position based on phase
    const bossData = boss.userData;
    
    // Decrease attack cooldown
    bossData.attackCooldown -= delta;
    
    // Handle different boss phases
    switch (bossData.phase) {
        case 1: // Phase 1: Circle around and occasionally dash at player
            // Move in a circle
            if (!bossData.isAttacking) {
                const time = clock.getElapsedTime();
                const radius = 8;
                const speed = 0.5;
                
                bossData.targetPosition.x = Math.sin(time * speed) * radius;
                bossData.targetPosition.z = Math.cos(time * speed) * radius - 10;
                bossData.targetPosition.y = 5 + Math.sin(time * 2) * 0.5;
                
                // Occasionally attack
                if (bossData.attackCooldown <= 0) {
                    bossData.isAttacking = true;
                    bossData.attackTarget = activeCharacter.position.clone();
                    showMessage("Boss is attacking!", 1500);
                    bossData.attackCooldown = 5 + Math.random() * 3;
                }
            } else {
                // Dash attack
                const attackDirection = bossData.attackTarget.clone().sub(boss.position).normalize();
                boss.position.add(attackDirection.multiplyScalar(0.4));
                
                // Check if reached attack target
                if (boss.position.distanceTo(bossData.attackTarget) < 1) {
                    bossData.isAttacking = false;
                    
                    // Create shockwave on impact
                    createShockwaveEffect(boss.position);
                    
                    // Make boss vulnerable briefly
                    makeBossVulnerable(3);
                }
                
                // Skip smooth movement during attack
                return;
            }
            break;
            
        case 2: // Phase 2: Faster, more aggressive
            // Similar to phase 1 but faster and more attacks
            if (!bossData.isAttacking) {
                const time = clock.getElapsedTime();
                const radius = 6;
                const speed = 0.8;
                
                bossData.targetPosition.x = Math.sin(time * speed) * radius;
                bossData.targetPosition.z = Math.cos(time * speed) * radius - 10;
                bossData.targetPosition.y = 4 + Math.sin(time * 3) * 1;
                
                // More frequent attacks
                if (bossData.attackCooldown <= 0) {
                    // Random attack type
                    const attackType = Math.random() > 0.5 ? 'dash' : 'projectile';
                    
                    if (attackType === 'dash') {
                        bossData.isAttacking = true;
                        bossData.attackTarget = activeCharacter.position.clone();
                        showMessage("Boss charging!", 1500);
                    } else {
                        // Fire projectiles
                        fireBossProjectiles(3);
                        showMessage("Boss firing projectiles!", 1500);
                    }
                    
                    bossData.attackCooldown = 3 + Math.random() * 2;
                }
            } else {
                // Faster dash attack
                const attackDirection = bossData.attackTarget.clone().sub(boss.position).normalize();
                boss.position.add(attackDirection.multiplyScalar(0.6));
                
                if (boss.position.distanceTo(bossData.attackTarget) < 1) {
                    bossData.isAttacking = false;
                    createShockwaveEffect(boss.position);
                    makeBossVulnerable(2);
                }
                
                return;
            }
            break;
            
        case 3: // Phase 3: Desperate final phase
            // Erratic movement and rapid attacks
            if (!bossData.isAttacking) {
                const time = clock.getElapsedTime();
                const radius = 5;
                const speed = 1.2;
                
                // More erratic movement
                bossData.targetPosition.x = Math.sin(time * speed) * radius + Math.sin(time * 3) * 2;
                bossData.targetPosition.z = Math.cos(time * speed) * radius - 10 + Math.cos(time * 2.5) * 2;
                bossData.targetPosition.y = 3 + Math.sin(time * 4) * 1.5;
                
                // Very frequent attacks
                if (bossData.attackCooldown <= 0) {
                    // Random attack with bias toward projectiles
                    const attackType = Math.random() > 0.3 ? 'projectile' : 'dash';
                    
                    if (attackType === 'dash') {
                        bossData.isAttacking = true;
                        bossData.attackTarget = activeCharacter.position.clone();
                        showMessage("Boss charging!", 1500);
                    } else {
                        // Fire more projectiles
                        fireBossProjectiles(5);
                        showMessage("Boss firing projectiles!", 1500);
                    }
                    
                    bossData.attackCooldown = 2 + Math.random();
                }
            } else {
                // Very fast dash attack
                const attackDirection = bossData.attackTarget.clone().sub(boss.position).normalize();
                boss.position.add(attackDirection.multiplyScalar(0.8));
                
                if (boss.position.distanceTo(bossData.attackTarget) < 1) {
                    bossData.isAttacking = false;
                    createShockwaveEffect(boss.position);
                    makeBossVulnerable(1.5);
                }
                
                return;
            }
            break;
    }
    
    // Smooth movement to target position
    const moveDirection = bossData.targetPosition.clone().sub(boss.position);
    const distance = moveDirection.length();
    
    if (distance > 0.1) {
        moveDirection.normalize();
        const moveSpeed = 0.1 * (bossData.phase === 3 ? 1.5 : bossData.phase === 2 ? 1.2 : 1);
        boss.position.add(moveDirection.multiplyScalar(moveSpeed));
    }
    
    // Rotate boss to face player
    const targetRotation = Math.atan2(
        activeCharacter.position.x - boss.position.x,
        activeCharacter.position.z - boss.position.z
    );
    boss.rotation.y = targetRotation;
    
    // Check for collision with characters
    checkBossCollision();
}

// Make boss vulnerable to attacks
function makeBossVulnerable(duration) {
    if (!boss) return;
    
    boss.userData.isVulnerable = true;
    
    // Visual effect for vulnerability
    boss.children.forEach(child => {
        if (child.material) {
            child.material.emissive = new THREE.Color(0x00ff00);
            child.material.emissiveIntensity = 0.5;
        }
    });
    
    // Show message
    showMessage("Boss is vulnerable!", 1500);
    
    // Reset after duration
    setTimeout(() => {
        if (boss) {
            boss.userData.isVulnerable = false;
            
            // Reset materials
            boss.children.forEach(child => {
                if (child.material) {
                    if (child.material.color.getHex() === 0xFFFF00) {
                        // Eyes maintain yellow emissive
                        child.material.emissive = new THREE.Color(0xFFFF00);
                    } else {
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                    child.material.emissiveIntensity = child.material.color.getHex() === 0xFFFF00 ? 0.5 : 0;
                }
            });
        }
    }, duration * 1000);
}

// Fire boss projectiles
function fireBossProjectiles(count) {
    if (!boss) return;
    
    for (let i = 0; i < count; i++) {
        // Create projectile
        const projectileGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            emissive: 0xFF4500,
            emissiveIntensity: 0.8
        });
        
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(boss.position);
        
        // Add slight offset based on index
        const angle = (i / count) * Math.PI * 2;
        projectile.position.x += Math.sin(angle) * 0.5;
        projectile.position.z += Math.cos(angle) * 0.5;
        
        // Calculate direction toward player with some spread
        const spread = 0.2;
        const targetPos = activeCharacter.position.clone();
        targetPos.x += (Math.random() - 0.5) * spread * 10;
        targetPos.z += (Math.random() - 0.5) * spread * 10;
        
        const direction = targetPos.clone().sub(projectile.position).normalize();
        
        // Set projectile data
        projectile.userData = {
            type: 'bossProjectile',
            direction: direction,
            speed: 0.25,
            damage: 10,
            lifeTime: 5 // Seconds
        };
        
        scene.add(projectile);
        console.log("Boss fired projectile", i);
        
        // Add to a global array for updating
        if (!window.bossProjectiles) {
            window.bossProjectiles = [];
        }
        window.bossProjectiles.push(projectile);
    }
}

// Update projectiles
function updateProjectiles() {
    if (!window.bossProjectiles) return;
    
    const delta = clock.getDelta();
    
    for (let i = window.bossProjectiles.length - 1; i >= 0; i--) {
        const projectile = window.bossProjectiles[i];
        
        // Move projectile
        projectile.position.add(
            projectile.userData.direction.clone().multiplyScalar(projectile.userData.speed)
        );
        
        // Add visual effect - rotation
        projectile.rotation.x += 0.1;
        projectile.rotation.y += 0.15;
        
        // Decrease lifetime
        projectile.userData.lifeTime -= delta;
        
        // Remove if expired
        if (projectile.userData.lifeTime <= 0) {
            scene.remove(projectile);
            window.bossProjectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with characters
        const projectileBox = new THREE.Box3().setFromObject(projectile);
        
        // Check both characters
        [karina, kelsey].forEach(character => {
            if (!character) return;
            
            const characterBox = new THREE.Box3().setFromObject(character);
            
            if (projectileBox.intersectsBox(characterBox)) {
                // Character hit by projectile
                if (!character.isShielded) {
                    const charName = character.name;
                    characters[charName].health = Math.max(0, characters[charName].health - projectile.userData.damage);
                    updateHealthBars();
                    
                    // Flash screen red when hit
                    if (character === activeCharacter) {
                        flashScreen('rgba(255, 0, 0, 0.3)');
                    }
                    
                    // Check for game over
                    if (characters[charName].health <= 0) {
                        handleGameOver();
                    }
                } else {
                    // Shield absorbs hit
                    showMessage("Shield absorbed hit!", 1000);
                }
                
                // Create impact effect
                createProjectileImpactEffect(projectile.position);
                
                // Remove projectile
                scene.remove(projectile);
                window.bossProjectiles.splice(i, 1);
                
                // Stop this loop iteration
                return;
            }
        });
    }
}

// Create projectile impact effect
function createProjectileImpactEffect(position) {
    const particleCount = 15;
    const particles = new THREE.Group();
    particles.name = 'impactEffect';
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.5;
        
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF4500,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Set initial position
        particle.position.copy(position);
        
        // Set velocity for animation (outward explosion)
        const velocity = new THREE.Vector3(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * radius,
            Math.sin(angle) * radius
        );
        particle.userData.velocity = velocity;
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Animate and remove after 0.5 seconds
    let elapsed = 0;
    const particleAnimation = () => {
        particles.children.forEach(particle => {
            // Move particle according to velocity
            particle.position.add(particle.userData.velocity);
            
            // Add gravity
            particle.userData.velocity.y -= 0.01;
            
            // Fade out
            particle.material.opacity -= 0.05;
            if (particle.material.opacity <= 0) {
                particle.material.opacity = 0;
            }
        });
        
        elapsed += 1/60; // Assuming 60fps
        if (elapsed < 0.5) {
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

// Check for boss collision with character
function checkBossCollision() {
    if (!boss || !activeCharacter) return;
    
    const bossBox = new THREE.Box3().setFromObject(boss);
    const characterBox = new THREE.Box3().setFromObject(activeCharacter);
    
    if (bossBox.intersectsBox(characterBox)) {
        // If boss is vulnerable, damage boss
        if (boss.userData.isVulnerable) {
            damageBoss(10); // Damage amount
            
            // Knockback boss
            const knockbackDirection = boss.position.clone().sub(activeCharacter.position).normalize();
            boss.position.add(knockbackDirection.multiplyScalar(1));
            
            // Make boss no longer vulnerable
            boss.userData.isVulnerable = false;
            
            // Reset boss materials
            boss.children.forEach(child => {
                if (child.material) {
                    if (child.material.color.getHex() === 0xFFFF00) {
                        // Eyes maintain yellow emissive
                        child.material.emissive = new THREE.Color(0xFFFF00);
                    } else {
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                    child.material.emissiveIntensity = child.material.color.getHex() === 0xFFFF00 ? 0.5 : 0;
                }
            });
        } else {
            // Boss damages character
            const currentTime = Date.now();
            if (currentTime - lastDamageTime < damageCooldown) {
                return;
            }
            
            // Apply damage if character not shielded
            if (!activeCharacter.isShielded) {
                const charName = activeCharacter.name;
                characters[charName].health = Math.max(0, characters[charName].health - enemyDamage);
                updateHealthBars();
                lastDamageTime = currentTime;
                
                // Apply knockback
                const knockbackDirection = activeCharacter.position.clone().sub(boss.position).normalize();
                knockbackDirection.y = 0.5;
                activeCharacter.velocity.x += knockbackDirection.x * 0.15;
                activeCharacter.velocity.y = knockbackDirection.y * jumpForce * 0.7;
                activeCharacter.velocity.z += knockbackDirection.z * 0.15;
                activeCharacter.isJumping = true;
                
                // Flash screen red
                flashScreen('rgba(255, 0, 0, 0.3)');
                
                // Check for game over
                if (characters[charName].health <= 0) {
                    handleGameOver();
                }
            } else {
                // Shield absorbs hit
                showMessage("Shield absorbed boss hit!", 1000);
            }
        }
    }
}

// Function to damage boss
function damageBoss(amount) {
    if (!boss) return;
    
    bossHealth -= amount;
    updateBossHealthBar();
    
    // Flash boss
    boss.children.forEach(child => {
        if (child.material) {
            child.material.emissive = new THREE.Color(0xff0000);
            child.material.emissiveIntensity = 0.8;
            
            // Reset after flash
            setTimeout(() => {
                if (child.material) {
                    if (child.material.color.getHex() === 0xFFFF00) {
                        // Eyes maintain yellow emissive
                        child.material.emissive = new THREE.Color(0xFFFF00);
                        child.material.emissiveIntensity = 0.5;
                    } else {
                        child.material.emissive = new THREE.Color(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                }
            }, 200);
        }
    });
    
    // Check boss phase transition
    if (bossHealth <= 65 && boss.userData.phase === 1) {
        transitionBossPhase(2);
    } else if (bossHealth <= 30 && boss.userData.phase === 2) {
        transitionBossPhase(3);
    } else if (bossHealth <= 0) {
        defeatBoss();
    }
    
    // Show damage number
    showDamageNumber(amount, boss.position);
}

// Show floating damage number
function showDamageNumber(amount, position) {
    // Create 3D text with damage amount
    const textGeometry = new THREE.TextGeometry(`${amount}`, {
        font: font, // This requires loading a font
        size: 0.5,
        height: 0.1
    });
    
    // Since font loading is complex, we'll use a workaround for this example
    // Create a sprite instead of 3D text
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(amount, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Position the sprite
    sprite.position.copy(position);
    sprite.position.y += 2;
    sprite.scale.set(2, 2, 1);
    
    scene.add(sprite);
    
    // Animate and remove
    let elapsed = 0;
    const totalTime = 1; // 1 second
    
    const animate = () => {
        // Move upward
        sprite.position.y += 0.05;
        
        // Fade out
        elapsed += 1/60;
        if (elapsed < totalTime) {
            sprite.material.opacity = 1 - (elapsed / totalTime);
            requestAnimationFrame(animate);
        } else {
            scene.remove(sprite);
            sprite.material.dispose();
            sprite.material.map.dispose();
        }
    };
    
    animate();
}

// Boss phase transition
function transitionBossPhase(newPhase) {
    if (!boss) return;
    
    boss.userData.phase = newPhase;
    bossPhase = newPhase;
    
    // Visual effect for phase transition
    createPhaseTransitionEffect(boss.position);
    
    // Show message
    showMessage(`Boss entering Phase ${newPhase}!`, 3000);
    
    // Make boss briefly invulnerable during transition
    boss.userData.isVulnerable = false;
    
    // Reset attack cooldown
    boss.userData.attackCooldown = 2;
    
    // Update boss appearance for new phase
    updateBossAppearance(newPhase);
}

// Update boss appearance based on phase
function updateBossAppearance(phase) {
    if (!boss) return;
    
    switch (phase) {
        case 2:
            // Make boss more aggressive looking
            boss.children.forEach(child => {
                if (child.material && child.material.color.getHex() === 0x8B0000) {
                    // Change body color to a darker red
                    child.material.color.set(0x660000);
                    // Add emissive glow
                    child.material.emissive.set(0x330000);
                    child.material.emissiveIntensity = 0.3;
                }
            });
            break;
        case 3:
            // Final phase - even more menacing
            boss.children.forEach(child => {
                if (child.material && child.material.color.getHex() === 0x660000) {
                    // Change body color to almost black with red glow
                    child.material.color.set(0x330000);
                    child.material.emissive.set(0x990000);
                    child.material.emissiveIntensity = 0.6;
                } else if (child.material && child.material.color.getHex() === 0xFFFF00) {
                    // Make eyes red
                    child.material.color.set(0xFF0000);
                    child.material.emissive.set(0xFF0000);
                    child.material.emissiveIntensity = 0.8;
                }
            });
            
            // Add particle effect to boss
            createBossPhase3Effect(boss);
            break;
    }
}

// Create visual effect for boss phase 3
function createBossPhase3Effect(boss) {
    // Create a continuous particle effect around the boss
    const particleSystem = new THREE.Group();
    particleSystem.name = 'bossEffect';
    
    // Add particle system to boss
    boss.add(particleSystem);
    
    // Animation function to continuously spawn particles
    const spawnParticles = () => {
        if (!boss || !boss.parent) return; // Stop if boss is removed
        
        // Create a new particle
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 2; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around boss
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.2;
            const height = Math.random() * 2 - 1;
            
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Set velocity - outward from center
            const velocity = new THREE.Vector3(
                particle.position.x * 0.05,
                (Math.random() - 0.5) * 0.05,
                particle.position.z * 0.05
            );
            particle.userData = { velocity, life: 1 };
            
            particleSystem.add(particle);
        }
        
        // Update existing particles
        for (let i = particleSystem.children.length - 1; i >= 0; i--) {
            const particle = particleSystem.children[i];
            
            // Move particle
            particle.position.add(particle.userData.velocity);
            
            // Update life
            particle.userData.life -= 0.02;
            particle.material.opacity = particle.userData.life;
            
            // Remove dead particles
            if (particle.userData.life <= 0) {
                particleSystem.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            }
        }
        
        // Continue animation if boss still exists
        if (boss && boss.parent) {
            requestAnimationFrame(spawnParticles);
        }
    };
    
    // Start the particle effect
    spawnParticles();
}

// Create phase transition effect
function createPhaseTransitionEffect(position) {
    // Create an expanding ring
    const ringGeometry = new THREE.RingGeometry(0.5, 1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    // Rotate to be parallel to ground
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    
    // Create explosion particles
    const particleCount = 30;
    const particles = new THREE.Group();
    particles.name = 'phaseTransitionEffect';
    
    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Random position in sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 1;
        
        particle.position.set(
            position.x + radius * Math.sin(phi) * Math.cos(theta),
            position.y + radius * Math.sin(phi) * Math.sin(theta),
            position.z + radius * Math.cos(phi)
        );
        
        // Velocity outward from center
        const direction = particle.position.clone().sub(position).normalize();
        particle.userData.velocity = direction.multiplyScalar(0.2);
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Animation
    let scale = 1;
    const animate = () => {
        // Expand ring
        scale += 0.3;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity -= 0.02;
        
        // Move particles
        particles.children.forEach(particle => {
            particle.position.add(particle.userData.velocity);
            particle.material.opacity -= 0.02;
        });
        
if (ring.material.opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            // Clean up
            scene.remove(ring);
            scene.remove(particles);
            
            ring.geometry.dispose();
            ring.material.dispose();
            
            particles.children.forEach(p => {
                p.geometry.dispose();
                p.material.dispose();
            });
        }
    };
    
    animate();
}

// Defeat boss
function defeatBoss() {
    if (!boss) return;
    
    // Show message
    showMessage("Boss Defeated!", 5000);
    
    // Create explosion effect
    createBossDefeatExplosion(boss.position);
    
    // Remove boss
    scene.remove(boss);
    boss = null;
    isBossBattle = false;
    
    // Hide boss health bar
    hideBossHealthBar();
    
    // Add bonus score
    score += 500;
    scoreValue.textContent = score;
    showMessage("+500 Points!", 3000);
    
    // Add bonus health
    characters.karina.health = Math.min(100, characters.karina.health + 50);
    characters.kelsey.health = Math.min(100, characters.kelsey.health + 50);
    updateHealthBars();
    showMessage("Health Restored!", 3000);
    
    // Return to normal level
    endBossBattle();
}

// Create boss defeat explosion
function createBossDefeatExplosion(position) {
    // Create multiple explosion rings
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const ringGeometry = new THREE.RingGeometry(0.5, 1, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF00,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            // Rotate to be parallel to ground
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);
            
            // Animation
            let scale = 1;
            const speed = 0.4;
            
            const animate = () => {
                // Expand ring
                scale += speed;
                ring.scale.set(scale, scale, scale);
                ring.material.opacity -= 0.01;
                
                if (ring.material.opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    // Clean up
                    scene.remove(ring);
                    ring.geometry.dispose();
                    ring.material.dispose();
                }
            };
            
            animate();
        }, i * 300); // Stagger the rings
    }
    
    // Create particles
    const particleCount = 100;
    const particles = new THREE.Group();
    particles.name = 'bossExplosion';
    
    for (let i = 0; i < particleCount; i++) {
        // Randomize color between yellow and orange
        const color = Math.random() > 0.5 ? 0xFFFF00 : 0xFFA500;
        
        const particleGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Random position in sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = Math.random() * 2;
        
        particle.position.set(
            position.x + radius * Math.sin(phi) * Math.cos(theta),
            position.y + radius * Math.sin(phi) * Math.sin(theta),
            position.z + radius * Math.cos(phi)
        );
        
        // Velocity outward from center
        const direction = particle.position.clone().sub(position).normalize();
        const speed = 0.1 + Math.random() * 0.2;
        particle.userData.velocity = direction.multiplyScalar(speed);
        
        // Add rotation
        particle.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2
        };
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Animation
    let elapsed = 0;
    const duration = 3; // seconds
    
    const animate = () => {
        // Move and rotate particles
        particles.children.forEach(particle => {
            particle.position.add(particle.userData.velocity);
            
            // Apply gravity
            particle.userData.velocity.y -= 0.002;
            
            // Rotate
            particle.rotation.x += particle.userData.rotationSpeed.x;
            particle.rotation.y += particle.userData.rotationSpeed.y;
            particle.rotation.z += particle.userData.rotationSpeed.z;
        });
        
        elapsed += 1/60;
        
        if (elapsed < duration) {
            if (elapsed > duration / 2) {
                // Start fading particles in second half
                particles.children.forEach(particle => {
                    particle.material.opacity = 0.8 * (1 - ((elapsed - duration/2) / (duration/2)));
                });
            }
            
            requestAnimationFrame(animate);
        } else {
            // Clean up
            scene.remove(particles);
            particles.children.forEach(p => {
                p.geometry.dispose();
                p.material.dispose();
            });
        }
    };
    
    animate();
}

// Boss health bar UI
function showBossHealthBar() {
    // Create boss health bar if it doesn't exist
    if (!document.getElementById('boss-health-bar')) {
        const bossHealthContainer = document.createElement('div');
        bossHealthContainer.id = 'boss-health-container';
        bossHealthContainer.style.position = 'absolute';
        bossHealthContainer.style.bottom = '20px';
        bossHealthContainer.style.left = '50%';
        bossHealthContainer.style.transform = 'translateX(-50%)';
        bossHealthContainer.style.width = '300px';
        bossHealthContainer.style.height = '30px';
        bossHealthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        bossHealthContainer.style.borderRadius = '5px';
        bossHealthContainer.style.padding = '5px';
        bossHealthContainer.style.display = 'flex';
        bossHealthContainer.style.flexDirection = 'column';
        bossHealthContainer.style.alignItems = 'center';
        bossHealthContainer.style.zIndex = '100';
        
        const bossName = document.createElement('div');
        bossName.textContent = 'CRYSTAL GUARDIAN';
        bossName.style.color = 'white';
        bossName.style.fontWeight = 'bold';
        bossName.style.marginBottom = '5px';
        
        const bossHealthBarOuter = document.createElement('div');
        bossHealthBarOuter.style.width = '100%';
        bossHealthBarOuter.style.height = '15px';
        bossHealthBarOuter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        bossHealthBarOuter.style.borderRadius = '3px';
        bossHealthBarOuter.style.overflow = 'hidden';
        
        const bossHealthBar = document.createElement('div');
        bossHealthBar.id = 'boss-health-bar';
        bossHealthBar.style.width = '100%';
        bossHealthBar.style.height = '100%';
        bossHealthBar.style.backgroundColor = '#ff0000';
        bossHealthBar.style.transition = 'width 0.3s ease';
        
        bossHealthBarOuter.appendChild(bossHealthBar);
        bossHealthContainer.appendChild(bossName);
        bossHealthContainer.appendChild(bossHealthBarOuter);
        
        document.body.appendChild(bossHealthContainer);
    }
    
    // Show the health bar
    document.getElementById('boss-health-container').style.display = 'flex';
    
    // Set initial health
    updateBossHealthBar();
}

// Update boss health bar
function updateBossHealthBar() {
    const healthBar = document.getElementById('boss-health-bar');
    if (healthBar) {
        healthBar.style.width = `${Math.max(0, bossHealth)}%`;
        
        // Color changes with health
        if (bossHealth > 65) {
            healthBar.style.backgroundColor = '#ff0000'; // Red
        } else if (bossHealth > 30) {
            healthBar.style.backgroundColor = '#ff7700'; // Orange
        } else {
            healthBar.style.backgroundColor = '#ffff00'; // Yellow
        }
    }
}

// Hide boss health bar
function hideBossHealthBar() {
    const healthContainer = document.getElementById('boss-health-container');
    if (healthContainer) {
        healthContainer.style.display = 'none';
    }
}

// End boss battle
function endBossBattle() {
    // Set flag
    isBossBattle = false;
    
    // Clear any projectiles
    if (window.bossProjectiles) {
        window.bossProjectiles.forEach(projectile => {
            scene.remove(projectile);
            projectile.geometry.dispose();
            projectile.material.dispose();
        });
        window.bossProjectiles = [];
    }
    
    // Transition to next level or show win screen
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
        setTimeout(() => {
            transitionToNextLevel();
        }, 2000);
    } else {
        setTimeout(() => {
            showWinScreen();
        }, 2000);
    }
}

// ===== LEVEL 4: BOSS LEVEL =====
// Add a new level with a boss battle
function addBossLevel() {
    // Create Level 4 (Boss Level)
    levels.push({
        skyColor: 0x000033, // Very dark blue
        fogColor: 0x000022,
        fogNear: 5,
        fogFar: 25,
        groundColor: 0x220033, // Dark purple
        startPositionKarina: { x: 0, y: 1, z: 10 },
        startPositionKelsey: { x: 0, y: 1, z: 8 },
        platformPositions: [
            // Arena-style circular platform
            { x: 0, y: 0, z: 0, width: 20, height: 1, depth: 20, isCircular: true }, // Main arena
            // Some floating platforms around
            { x: -8, y: 3, z: -8, width: 3, height: 0.5, depth: 3 },
            { x: 8, y: 3, z: -8, width: 3, height: 0.5, depth: 3 },
            { x: 0, y: 5, z: -12, width: 4, height: 0.5, depth: 2 }
        ],
        crystalPositions: [
            // Crystals are in hard-to-reach places
            { x: -8, y: 4, z: -8 },
            { x: 8, y: 4, z: -8 },
            { x: 0, y: 6, z: -12 }
        ],
        enemyPositions: [], // No regular enemies, just the boss
        powerUpPositions: [
            { x: -7, y: 3.5, z: -7 },
            { x: 7, y: 3.5, z: -7 }
        ],
        teleporterPairs: [],
        bossPosition: { x: 0, y: 4, z: -5 } // Boss spawns here
    });
    
    console.log("Added Boss Level (Level 4)");
}

// Modify loadLevel to handle circular platforms and boss
function enhanceLoadLevel() {
    const originalLoadLevel = loadLevel;
    loadLevel = function(levelIndex) {
        return originalLoadLevel(levelIndex).then(() => {
            const levelData = levels[levelIndex];
            
            // Create circular platforms if specified
            levelData.platformPositions.forEach((platformData, index) => {
                if (platformData.isCircular) {
                    // Find and remove the box platform that was created
                    const boxPlatform = scene.getObjectByName(`platform-${index}`);
                    if (boxPlatform) {
                        scene.remove(boxPlatform);
                        boxPlatform.geometry.dispose();
                        boxPlatform.material.dispose();
                        
                        // Remove from platforms array
                        const boxIndex = platforms.findIndex(p => p.name === boxPlatform.name);
                        if (boxIndex !== -1) {
                            platforms.splice(boxIndex, 1);
                        }
                        
                        // Create circular platform
                        const radius = platformData.width / 2;
                        const cylinderGeometry = new THREE.CylinderGeometry(
                            radius, radius, platformData.height, 32
                        );
                        const platformMaterial = new THREE.MeshStandardMaterial({
                            color: 0x6a0dad, // Purple for boss arena
                            roughness: 0.7,
                            metalness: 0.3
                        });
                        
                        const circularPlatform = new THREE.Mesh(cylinderGeometry, platformMaterial);
                        circularPlatform.position.set(
                            platformData.x, 
                            platformData.y, 
                            platformData.z
                        );
                        circularPlatform.receiveShadow = true;
                        circularPlatform.castShadow = true;
                        circularPlatform.name = `platform-${index}`;
                        
                        scene.add(circularPlatform);
                        platforms.push(circularPlatform);
                        
                        console.log("Created circular platform");
                    }
                }
            });
            
            // Spawn boss if this is a boss level and has bossPosition
            if (levelData.bossPosition) {
                console.log("This is a boss level. Spawning boss...");
                
                // Allow time for level to load, then spawn boss with fanfare
                setTimeout(() => {
                    // Show message
                    showMessage("Prepare for BOSS BATTLE!", 3000);
                    
                    // Create boss
                    createBoss(new THREE.Vector3(
                        levelData.bossPosition.x,
                        levelData.bossPosition.y,
                        levelData.bossPosition.z
                    ));
                }, 2000);
            }
        });
    };
}

// ===== INTEGRATE NEW FEATURES INTO GAME =====

function integrateNewFeatures() {
    // 1. Add boss level
    addBossLevel();
    
    // 2. Enhance loadLevel to handle circular platforms and boss
    enhanceLoadLevel();
    
    // 3. Update animate function to include boss and projectile updates
    const originalAnimate = animate;
    animate = function() {
        if (!isGameStarted || isGameOver) return;
        
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        // Original updates
        updateCharacterMovement(delta);
        updateEnemies();
        updateCrystalAnimation();
        updatePowerUps();
        
        // New updates
        if (isBossBattle && boss) {
            updateBoss(delta);
        }
        updateProjectiles();
        
        // Collision checks
        checkCrystalCollision();
        checkEnemyCollision();
        checkPowerUpCollision();
        checkTeleporterCollision();

        // Update camera
        updateCameraPosition();

        // Render Scene
        renderer.render(scene, camera);
    };
    
    console.log("New features integrated successfully!");
}

// Call the integration function
integrateNewFeatures();
let player;
let enemies = [];
let stars = [];
let powerUps = [];
let score = 0;
let lives = 3;
let wave = 1;
let waveEnemyCount = 10;
let enemiesDefeated = 0;
let gameState = "start";
let particleEffects = [];
let invincibleTimer = 0;
let difficultyMultiplier = 1;
let boss = null;
let isBossFight = false;
let bossDefeated = false;
let bossWarningTimer = 0;
let showHelp = false;
let helpIcon;

// Leaderboard variables
let supabase;
let showLeaderboard = false;
let leaderboardData = [];
let playerNameInput = '';
let playerEmailInput = '';
let showScoreSubmission = false;
let leaderboardLoading = false;
let scoreSubmitted = false;
let leaderboardError = '';
let inputActive = false;
let activeInput = null;

// Supabase initialization will use the external config file

function preload() {
  // Load help icon image (or create it in setup if not using an image)
}

function setup() {
  createCanvas(800, 600);
  resetGame();
  
  // Create help icon
  helpIcon = {
    x: width - 30,
    y: 30,
    radius: 15
  };
  
  // Initialize Supabase client using the external config
  try {
    // Check if the config is available
    if (window.SUPABASE_CONFIG) {
      supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url, 
        window.SUPABASE_CONFIG.key
      );
      console.log("Supabase initialized successfully");
    } else {
      console.error("Supabase config not found. Make sure supabase-config.js is loaded before game.js");
      supabase = null;
    }
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    supabase = null;
  }
}

function resetGame() {
  player = new Player();
  enemies = [];
  powerUps = [];
  score = 0;
  lives = 3;
  wave = 1;
  waveEnemyCount = 10;
  enemiesDefeated = 0;
  difficultyMultiplier = 1;
  boss = null;
  isBossFight = false;
  bossDefeated = false;
  scoreSubmitted = false;
  
  // Generate background stars
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3)
    });
  }
}

function debugScreenState() {
  console.log(`Screen State - Help: ${showHelp}, Leaderboard: ${showLeaderboard}, Score Submission: ${showScoreSubmission}`);
  console.log(`Hovered Button: ${this.hoveredButton ? 'exists' : 'null'}`);
  
  // Add mouse position for debugging
  console.log(`Mouse Position: (${mouseX}, ${mouseY})`);
  
  // Check if mouse is over leaderboard buttons
  if (showLeaderboard) {
    const closeButtonX = width/2;
    const refreshButtonX = width/2 + 200;
    const buttonY = height - 80;
    const buttonWidth = 150;
    const buttonHeight = 40;
    
    const isOverClose = mouseX > closeButtonX - buttonWidth/2 && mouseX < closeButtonX + buttonWidth/2 && 
                        mouseY > buttonY - buttonHeight/2 && mouseY < buttonY + buttonHeight/2;
                        
    const isOverRefresh = mouseX > refreshButtonX - buttonWidth/2 && mouseX < refreshButtonX + buttonWidth/2 && 
                          mouseY > buttonY - buttonHeight/2 && mouseY < buttonY + buttonHeight/2;
    
    console.log(`Over Close Button: ${isOverClose}, Over Refresh Button: ${isOverRefresh}`);
  }
}

function draw() {
  background(10, 20, 40); // Deep space blue
  
  // Draw stars with parallax effect
  for (let star of stars) {
    fill(255, 255, 200);
    noStroke();
    circle(star.x, star.y, star.size);
    star.y += player.speed * 0.5;
    if (star.y > height) star.y = -star.size;
  }
  
  // Particle effects
  for (let i = particleEffects.length - 1; i >= 0; i--) {
    particleEffects[i].update();
    particleEffects[i].show();
    if (particleEffects[i].isDone()) particleEffects.splice(i, 1);
  }
  
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "play") {
    playGame();
  } else if (gameState === "gameover") {
    drawGameOverScreen();
  }
  
  // Always draw help icon
  drawHelpIcon();
  
  // Only show one overlay at a time, prioritizing help screen
  if (showHelp) {
    drawHelpScreen();
  } else if (showLeaderboard) {
    drawLeaderboard();
  } else if (showScoreSubmission) {
    drawScoreSubmissionForm();
  }
  
  // Enable for debugging - comment out for production
  // debugScreenState();
}

function drawStartScreen() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text("Space Racer AI", width / 2, height / 2 - 80);
  textSize(24);
  text("Use WASD or Arrow Keys to move, Space to shoot", width / 2, height / 2 + 20);
  text("Press Enter to Start", width / 2, height / 2 + 60);
  
  // Add leaderboard button
  drawButton("View Leaderboard", width / 2, height / 2 + 120, 200, 40, () => {
    showLeaderboard = true;
    showHelp = false;
    showScoreSubmission = false;
    fetchLeaderboard();
  });
}

function drawGameOverScreen() {
  textAlign(CENTER, CENTER);
  fill(255, 0, 0);
  textSize(48);
  text("Game Over", width / 2, height / 2 - 100);
  fill(255);
  textSize(24);
  text(`Final Score: ${score}`, width / 2, height / 2 - 50);
  text(`Waves Completed: ${wave - 1}`, width / 2, height / 2 - 20);
  
  // Show submit score button if score not yet submitted
  if (!scoreSubmitted) {
    drawButton("Submit Score", width / 2, height / 2 + 20, 200, 40, () => {
      showScoreSubmission = true;
      playerNameInput = '';
      playerEmailInput = '';
    });
  } else {
    fill(0, 255, 0);
    text("Score Submitted!", width / 2, height / 2 + 20);
  }
  
  // View leaderboard button
  drawButton("View Leaderboard", width / 2, height / 2 + 70, 200, 40, () => {
    showLeaderboard = true;
    fetchLeaderboard();
  });
  
  // Play again button
  drawButton("Play Again", width / 2, height / 2 + 120, 200, 40, () => {
    gameState = "play";
    resetGame();
  });
}

function drawScoreSubmissionForm() {
  // Semi-transparent background
  push();
  fill(0, 0, 30, 220);
  rect(0, 0, width, height);
  
  // Form title
  fill(255);
  textAlign(CENTER, TOP);
  textSize(36);
  text("Submit Your Score", width/2, 100);
  
  // Score display
  textSize(24);
  text(`Score: ${score}`, width/2, 150);
  
  // Form fields
  textAlign(LEFT, CENTER);
  textSize(18);
  text("Name:", width/2 - 150, 200);
  text("Email:", width/2 - 150, 250);
  
  // Draw input fields
  drawInputField("name", width/2, 200, playerNameInput);
  drawInputField("email", width/2, 250, playerEmailInput);
  
  // Submit button
  drawButton("Submit", width/2, 320, 150, 40, submitScore);
  
  // Cancel button
  drawButton("Cancel", width/2, 370, 150, 40, () => {
    showScoreSubmission = false;
  });
  
  // Error message if any
  if (leaderboardError) {
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(leaderboardError, width/2, 420);
  }
  
  pop();
}

function drawLeaderboard() {
  // Semi-transparent background
  push();
  fill(0, 0, 30, 220);
  rect(0, 0, width, height);
  
  // Leaderboard title
  fill(255);
  textAlign(CENTER, TOP);
  textSize(36);
  text("Leaderboard", width/2, 50);
  
  if (leaderboardLoading) {
    // Loading indicator
    textSize(18);
    text("Loading...", width/2, height/2);
  } else if (leaderboardError) {
    // Error message
    fill(255, 0, 0);
    textSize(18);
    text(leaderboardError, width/2, height/2);
  } else if (leaderboardData.length === 0) {
    // No data message
    textSize(18);
    text("No scores yet. Be the first to submit!", width/2, height/2);
  } else {
    // Draw leaderboard table
    const tableTop = 120;
    const rowHeight = 40;
    const colWidths = [80, 300, 150];
    
    // Table headers
    textAlign(LEFT, CENTER);
    textSize(18);
    fill(100, 200, 255);
    text("Rank", width/2 - 200, tableTop);
    text("Player", width/2 - 100, tableTop);
    text("Score", width/2 + 100, tableTop);
    
    // Horizontal line
    stroke(100, 200, 255);
    line(width/2 - 250, tableTop + 20, width/2 + 250, tableTop + 20);
    
    // Table rows
    noStroke();
    textSize(16);
    fill(255);
    
    for (let i = 0; i < Math.min(leaderboardData.length, 10); i++) {
      const entry = leaderboardData[i];
      const y = tableTop + 40 + i * rowHeight;
      
      // Highlight current player's score
      if (entry.player_name === playerNameInput) {
        fill(100, 255, 100, 50);
        rect(width/2 - 250, y - rowHeight/2, 500, rowHeight);
        fill(255);
      }
      
      textAlign(LEFT, CENTER);
      text(`#${i + 1}`, width/2 - 200, y);
      text(entry.player_name, width/2 - 100, y);
      
      textAlign(RIGHT, CENTER);
      text(entry.score, width/2 + 200, y);
    }
  }
  
  // Refresh button - moved to the right side
  drawButton("Refresh", width/2 + 200, height - 80, 150, 40, () => {
    fetchLeaderboard();
  }, 'refresh');
  
  // Direct close button implementation
  // Define close button dimensions
  const closeButtonX = width/2;
  const closeButtonY = height - 80;
  const closeButtonWidth = 150;
  const closeButtonHeight = 40;
  
  // Check if mouse is over close button
  const isCloseHovered = mouseX > closeButtonX - closeButtonWidth/2 && 
                         mouseX < closeButtonX + closeButtonWidth/2 && 
                         mouseY > closeButtonY - closeButtonHeight/2 && 
                         mouseY < closeButtonY + closeButtonHeight/2;
  
  // Draw close button with hover effect
  if (isCloseHovered) {
    fill(255, 80, 80); // Brighter red when hovered
    stroke(255);
    strokeWeight(2);
  } else {
    fill(220, 60, 60); // Dark red
    noStroke();
  }
  
  // Draw the button
  rect(closeButtonX - closeButtonWidth/2, closeButtonY - closeButtonHeight/2, 
       closeButtonWidth, closeButtonHeight, 5);
  
  // Draw button text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("CLOSE", closeButtonX, closeButtonY);
  
  // Store the close button in a global variable for mousePressed
  window.leaderboardCloseButton = {
    x: closeButtonX,
    y: closeButtonY,
    width: closeButtonWidth,
    height: closeButtonHeight,
    isHovered: isCloseHovered
  };
  
  pop();
}

function drawInputField(id, x, y, value) {
  const fieldWidth = 300;
  const fieldHeight = 40;
  
  // Check if mouse is over this input
  const isHovered = mouseX > x - fieldWidth/2 && mouseX < x + fieldWidth/2 && 
                    mouseY > y - fieldHeight/2 && mouseY < y + fieldHeight/2;
  
  // Check if this input is active
  const isActive = activeInput === id;
  
  // Draw input field background
  if (isActive) {
    fill(30, 30, 60);
    stroke(100, 200, 255);
    strokeWeight(2);
  } else if (isHovered) {
    fill(20, 20, 40);
    stroke(70, 130, 180);
    strokeWeight(1);
  } else {
    fill(10, 10, 30);
    stroke(50, 50, 80);
    strokeWeight(1);
  }
  
  rect(x - fieldWidth/2, y - fieldHeight/2, fieldWidth, fieldHeight, 5);
  
  // Draw input text
  noStroke();
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(16);
  
  // Add cursor if active
  let displayText = value;
  if (isActive && frameCount % 60 < 30) {
    displayText += "|";
  }
  
  // Truncate text if too long
  const maxChars = 25;
  if (displayText.length > maxChars) {
    displayText = displayText.substring(displayText.length - maxChars);
  }
  
  text(displayText, x - fieldWidth/2 + 10, y);
}

function drawButton(label, x, y, width, height, onClick, buttonType = 'default') {
  // Check if mouse is over button
  const isHovered = mouseX > x - width/2 && mouseX < x + width/2 && 
                    mouseY > y - height/2 && mouseY < y + height/2;
  
  // Draw button with different styles based on type
  if (buttonType === 'close') {
    // Red close button
    if (isHovered) {
      fill(255, 80, 80); // Brighter red when hovered
      stroke(255);
      strokeWeight(2);
    } else {
      fill(220, 60, 60); // Dark red
      noStroke();
    }
  } else if (buttonType === 'refresh') {
    // Blue refresh button
    if (isHovered) {
      fill(80, 180, 255); // Brighter blue when hovered
      stroke(255);
      strokeWeight(2);
    } else {
      fill(60, 140, 220); // Dark blue
      noStroke();
    }
  } else {
    // Default button style
    if (isHovered) {
      fill(100, 150, 255);
    } else {
      fill(70, 130, 180);
    }
    noStroke();
  }
  
  rect(x - width/2, y - height/2, width, height, 5);
  
  // Draw label
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(label, x, y);
  
  // Store onClick handler for mousePressed, but only if no other button is already hovered
  if (isHovered && !this.hoveredButton) {
    this.hoveredButton = onClick;
  }
}

function mousePressed() {
  // Store the current hovered button before any other checks
  const currentHoveredButton = this.hoveredButton;
  
  // Clear the hoveredButton immediately to prevent double-clicks
  this.hoveredButton = null;
  
  // Check if help icon was clicked first
  if (dist(mouseX, mouseY, helpIcon.x, helpIcon.y) < helpIcon.radius) {
    // Toggle help screen
    showHelp = !showHelp;
    
    // If opening help, close other overlays
    if (showHelp) {
      showLeaderboard = false;
      showScoreSubmission = false;
    }
    
    return false;
  }
  
  // Check for leaderboard close button click
  if (showLeaderboard && window.leaderboardCloseButton) {
    const btn = window.leaderboardCloseButton;
    if (mouseX > btn.x - btn.width/2 && mouseX < btn.x + btn.width/2 && 
        mouseY > btn.y - btn.height/2 && mouseY < btn.y + btn.height/2) {
      console.log("Leaderboard close button clicked");
      showLeaderboard = false;
      return false;
    }
  }
  
  // Handle button clicks using the stored reference
  if (currentHoveredButton) {
    // Call the button function
    currentHoveredButton();
    return false;
  }
  
  // Check input fields
  if (showScoreSubmission) {
    // Name input field
    if (mouseX > width/2 - 150 && mouseX < width/2 + 150 && 
        mouseY > 180 && mouseY < 220) {
      activeInput = 'name';
      inputActive = true;
      return false;
    }
    
    // Email input field
    if (mouseX > width/2 - 150 && mouseX < width/2 + 150 && 
        mouseY > 230 && mouseY < 270) {
      activeInput = 'email';
      inputActive = true;
      return false;
    }
    
    // Click outside inputs deactivates them
    activeInput = null;
    inputActive = false;
  }
  
  return true;
}

function keyPressed() {
  // Handle input field typing
  if (inputActive && activeInput) {
    if (keyCode === BACKSPACE) {
      // Remove last character
      if (activeInput === 'name') {
        playerNameInput = playerNameInput.slice(0, -1);
      } else if (activeInput === 'email') {
        playerEmailInput = playerEmailInput.slice(0, -1);
      }
      return false;
    } else if (keyCode === TAB) {
      // Switch between inputs
      if (activeInput === 'name') {
        activeInput = 'email';
      } else {
        activeInput = 'name';
      }
      return false;
    } else if (keyCode === ENTER) {
      // Submit form if both fields have content
      if (playerNameInput && playerEmailInput) {
        submitScore();
      }
      return false;
    }
  }
  
  // Toggle help screen with H key
  if (key === 'h' || key === 'H') {
    showHelp = !showHelp;
    return false;
  }
  
  // Close help screen with Escape key
  if (keyCode === ESCAPE) {
    if (showHelp) {
      showHelp = false;
      return false;
    }
    if (showLeaderboard) {
      showLeaderboard = false;
      return false;
    }
    if (showScoreSubmission) {
      showScoreSubmission = false;
      return false;
    }
  }
  
  if (keyCode === ENTER) {
    if (gameState === "start" || gameState === "gameover") {
      gameState = "play";
      resetGame();
    }
  }
  
  if (key === ' ' && gameState === "play" && !showHelp && !showLeaderboard && !showScoreSubmission) {
    player.shoot();
  }
  
  return true;
}

function keyTyped() {
  // Handle character input for text fields
  if (inputActive && activeInput) {
    // Only add printable characters (including special characters like periods, @, etc.)
    if (key.length === 1) {
      if (activeInput === 'name') {
        playerNameInput += key;
      } else if (activeInput === 'email') {
        playerEmailInput += key;
      }
      return false;
    }
  }
  return true;
}

async function fetchLeaderboard() {
  leaderboardLoading = true;
  leaderboardError = '';
  
  // Check if Supabase is initialized
  if (!supabase) {
    leaderboardError = 'Leaderboard is not available. Supabase not configured.';
    leaderboardLoading = false;
    return;
  }
  
  try {
    // Fetch from the public view that doesn't include emails
    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    leaderboardData = data;
    leaderboardLoading = false;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    leaderboardError = 'Failed to load leaderboard. Please try again.';
    leaderboardLoading = false;
  }
}

async function submitScore() {
  if (!playerNameInput || !playerEmailInput) {
    leaderboardError = 'Please enter both name and email.';
    return;
  }
  
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(playerEmailInput)) {
    leaderboardError = 'Please enter a valid email address.';
    return;
  }
  
  // Check if Supabase is initialized
  if (!supabase) {
    leaderboardError = 'Score submission is not available. Supabase not configured.';
    return;
  }
  
  leaderboardLoading = true;
  leaderboardError = '';
  
  try {
    // Insert into the main leaderboard table (with email)
    const { error } = await supabase
      .from('leaderboard')
      .insert([
        { 
          player_name: playerNameInput, 
          email: playerEmailInput, 
          score: score,
          wave_reached: wave
        }
      ]);
    
    if (error) throw error;
    
    // Success
    showScoreSubmission = false;
    scoreSubmitted = true;
    
    // Refresh leaderboard
    fetchLeaderboard();
    showLeaderboard = true;
    
  } catch (error) {
    console.error('Error submitting score:', error);
    leaderboardError = 'Failed to submit score. Please try again.';
    leaderboardLoading = false;
  }
}

function playGame() {
  // Update and show player
  player.update();
  player.show();
  
  // Handle invincibility timer
  if (invincibleTimer > 0) {
    invincibleTimer--;
  }
  
  // Boss warning
  if (bossWarningTimer > 0) {
    bossWarningTimer--;
    fill(255, 0, 0, bossWarningTimer * 2);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("BOSS INCOMING!", width / 2, height / 2);
  }
  
  // Handle boss fight
  if (isBossFight) {
    if (!boss) {
      // Create boss
      boss = new Boss(wave);
      bossWarningTimer = 0;
    }
    
    // Update and show boss
    boss.update();
    boss.show();
    
    // Check collision with player bullets
    for (let j = player.bullets.length - 1; j >= 0; j--) {
      if (boss.hits(player.bullets[j])) {
        boss.health -= 1;
        particleEffects.push(new ParticleEffect(player.bullets[j].x, player.bullets[j].y));
        player.bullets.splice(j, 1);
        
        // Check if boss is defeated
        if (boss.health <= 0) {
          // Boss defeated
          let bossPoints = boss.points || 500 * wave;
          score += bossPoints;
          console.log("Boss defeated! Score: " + score);
          
          for (let i = 0; i < 10; i++) {
            particleEffects.push(new ParticleEffect(
              boss.x + random(-boss.size/2, boss.size/2), 
              boss.y + random(-boss.size/2, boss.size/2)
            ));
          }
          
          // Drop power-ups
          for (let i = 0; i < 3; i++) {
            powerUps.push(new PowerUp(
              boss.x + random(-50, 50),
              boss.y + random(-50, 50),
              floor(random(3))
            ));
          }
          
          boss = null;
          isBossFight = false;
          bossDefeated = true;
          
          // Advance to next wave
          wave++;
          waveEnemyCount = 10 + wave * 5;
          enemiesDefeated = 0;
          difficultyMultiplier += 0.2;
          
          // Display wave notification
          fill(255, 215, 0);
          textSize(32);
          textAlign(CENTER, CENTER);
          text(`WAVE ${wave}`, width / 2, height / 2);
        }
      }
    }
    
    // Check collision with player
    if (boss && boss.hitsPlayer(player) && invincibleTimer <= 0) {
      lives--;
      invincibleTimer = 120; // 2 seconds of invincibility
      particleEffects.push(new ParticleEffect(player.x, player.y));
      
      if (lives <= 0) {
        gameState = "gameover";
      }
    }
  } else {
    // Regular enemy spawning
    if (frameCount % Math.max(5, 30 - wave * 2) === 0 && enemies.length < 5 + wave && !bossDefeated) {
      enemies.push(new Enemy(floor(random(3)), difficultyMultiplier));
    }
  }
  
  // Update and process all enemies and bullets
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].show();
    
    // Check if enemy or bullet is off screen
    if (enemies[i].y > height + 50 || 
        (enemies[i] instanceof EnemyBullet && 
         (enemies[i].y < -50 || enemies[i].x > width + 50 || enemies[i].x < -50))) {
      enemies.splice(i, 1);
      continue;
    }
    
    // Handle collisions based on enemy type
    if (enemies[i] instanceof EnemyBullet) {
      // Enemy bullet collision with player
      if (enemies[i].hits(player) && invincibleTimer <= 0) {
        lives--;
        invincibleTimer = 120; // 2 seconds of invincibility
        particleEffects.push(new ParticleEffect(player.x, player.y));
        enemies.splice(i, 1);
        
        if (lives <= 0) {
          gameState = "gameover";
        }
      }
    } else {
      // Regular enemy collision with player bullets
      let hitByBullet = false;
      
      for (let j = player.bullets.length - 1; j >= 0; j--) {
        if (enemies[i] && enemies[i].hits(player.bullets[j])) {
          let enemyPoints = enemies[i].points || (enemies[i].type + 1) * 10;
          score += enemyPoints;
          console.log("Enemy hit! Score: " + score);
          
          enemiesDefeated++;
          particleEffects.push(new ParticleEffect(enemies[i].x, enemies[i].y));
          
          // Chance to drop power-up
          if (random(1) < 0.1) {
            powerUps.push(new PowerUp(enemies[i].x, enemies[i].y, floor(random(3))));
          }
          
          enemies.splice(i, 1);
          player.bullets.splice(j, 1);
          hitByBullet = true;
          break;
        }
      }
      
      // Skip player collision check if enemy was hit by bullet
      if (hitByBullet) continue;
      
      // Regular enemy collision with player
      if (enemies[i] && enemies[i].hits(player) && invincibleTimer <= 0) {
        lives--;
        invincibleTimer = 120; // 2 seconds of invincibility
        particleEffects.push(new ParticleEffect(player.x, player.y));
        
        if (lives <= 0) {
          gameState = "gameover";
        }
      }
    }
  }
  
  // Spawn power-ups occasionally
  if (frameCount % 300 === 0 && random(1) < 0.5) {
    powerUps.push(new PowerUp(random(width), -30, floor(random(3))));
  }
  
  // Update and show power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].update();
    powerUps[i].show();
    
    // Remove power-ups that go off screen
    if (powerUps[i].y > height + 20) {
      powerUps.splice(i, 1);
      continue;
    }
    
    // Check collision with player
    if (powerUps[i] && dist(powerUps[i].x, powerUps[i].y, player.x, player.y) < 30) {
      player.applyPowerUp(powerUps[i].type);
      powerUps.splice(i, 1);
    }
  }
  
  // Check if wave is complete
  if (enemiesDefeated >= waveEnemyCount && !isBossFight && !bossDefeated) {
    // Start boss fight
    isBossFight = true;
    bossWarningTimer = 180; // 3 seconds warning
  }
  
  // Reset bossDefeated flag for next wave
  if (bossDefeated && enemies.length === 0) {
    bossDefeated = false;
  }
  
  // Display score and lives
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, 10, 10);
  text(`Lives: ${lives}`, 10, 40);
  text(`Wave: ${wave}`, 10, 70);
  
  // Display power-up status
  if (player.powerUpType !== -1) {
    let powerUpName = "";
    if (player.powerUpType === 0) powerUpName = "Rapid Fire";
    else if (player.powerUpType === 1) powerUpName = "Triple Shot";
    else if (player.powerUpType === 2) powerUpName = "Shield";
    
    fill(100, 255, 100);
    text(`${powerUpName}: ${Math.ceil(player.powerUpTimer / 60)}s`, 10, 100);
  }
  
  // Display boss health if in boss fight
  if (isBossFight && boss) {
    fill(255, 0, 0);
    textSize(20);
    textAlign(CENTER, TOP);
    text(`BOSS HP: ${boss.health}/${boss.maxHealth}`, width / 2, 10);
    
    // Health bar
    noStroke();
    fill(100);
    rect(width / 2 - 100, 40, 200, 15);
    fill(255, 0, 0);
    rect(width / 2 - 100, 40, 200 * (boss.health / boss.maxHealth), 15);
  }
}

function drawHelpIcon() {
  // Check if mouse is hovering over help icon
  helpIcon.hover = dist(mouseX, mouseY, helpIcon.x, helpIcon.y) < helpIcon.radius;
  
  // Draw help icon
  push();
  if (helpIcon.hover) {
    fill(100, 200, 255);
  } else {
    fill(70, 130, 180);
  }
  stroke(255);
  strokeWeight(2);
  ellipse(helpIcon.x, helpIcon.y, helpIcon.radius * 2);
  
  // Draw question mark
  fill(255);
  noStroke();
  textSize(helpIcon.radius * 1.2);
  textAlign(CENTER, CENTER);
  text("?", helpIcon.x, helpIcon.y - 2);
  pop();
}

function drawHelpScreen() {
  // Semi-transparent background
  push();
  fill(0, 0, 30, 220);
  rect(0, 0, width, height);
  
  // Help content
  fill(255);
  textAlign(CENTER, TOP);
  textSize(36);
  text("HOW TO PLAY", width/2, 50);
  
  textAlign(LEFT, TOP);
  textSize(20);
  
  // Controls section
  text("CONTROLS:", 100, 120);
  textSize(16);
  text("• WASD or Arrow Keys: Move ship", 120, 150);
  text("• SPACE: Shoot", 120, 180);
  text("• ESC: Pause game", 120, 210);
  text("• H or ? icon: Toggle help", 120, 240);
  
  // Gameplay section
  textSize(20);
  text("GAMEPLAY:", 100, 290);
  textSize(16);
  text("• Destroy enemies to earn points", 120, 320);
  text("• Collect power-ups to enhance your ship", 120, 350);
  text("• Complete waves to face boss battles", 120, 380);
  text("• Each wave gets progressively harder", 120, 410);
  
  // Power-ups section
  textSize(20);
  text("POWER-UPS:", 450, 120);
  textSize(16);
  
  // Yellow power-up (Rapid Fire)
  fill(255, 255, 0);
  stroke(200, 200, 0);
  strokeWeight(2);
  star(470, 150, 10, 5, 5);
  fill(255);
  noStroke();
  text("Rapid Fire: Auto-shoots faster", 490, 145);
  
  // Green power-up (Triple Shot)
  fill(0, 255, 0);
  stroke(0, 200, 0);
  strokeWeight(2);
  star(470, 180, 10, 5, 5);
  fill(255);
  noStroke();
  text("Triple Shot: Fires three bullets at once", 490, 175);
  
  // Blue power-up (Shield)
  fill(0, 200, 255);
  stroke(0, 150, 200);
  strokeWeight(2);
  star(470, 210, 10, 5, 5);
  fill(255);
  noStroke();
  text("Shield: Provides temporary protection", 490, 205);
  
  // Boss battles section
  textSize(20);
  text("BOSS BATTLES:", 450, 290);
  textSize(16);
  text("• Appear at the end of each wave", 470, 320);
  text("• Have unique attack patterns", 470, 350);
  text("• Drop multiple power-ups when defeated", 470, 380);
  text("• Get stronger with each wave", 470, 410);
  
  // Close button using the drawButton function for consistency
  drawButton("CLOSE [ESC]", width/2, height - 60, 120, 40, () => {
    showHelp = false;
  }, 'close');
  
  pop();
}

// Helper function to draw stars for power-up descriptions
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle/2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a+halfAngle) * radius1;
    sy = y + sin(a+halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// Player class
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 80;
    this.size = 40;
    this.speed = 5;
    this.bullets = [];
    this.powerUpType = -1; // -1: none, 0: rapid fire, 1: triple shot, 2: shield
    this.powerUpTimer = 0;
    this.shootCooldown = 0;
  }
  
  update() {
    // WASD controls
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) this.x -= this.speed; // A or Left Arrow - Left
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) this.x += this.speed; // D or Right Arrow - Right
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) this.y -= this.speed; // W or Up Arrow - Up
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) this.y += this.speed; // S or Down Arrow - Down
    
    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    
    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update();
      if (this.bullets[i].y < 0) this.bullets.splice(i, 1);
      else this.bullets[i].show();
    }
    
    // Auto-shoot with rapid fire power-up
    if (this.powerUpType === 0 && frameCount % 10 === 0) {
      this.shoot();
    }
    
    // Update power-up timer
    if (this.powerUpTimer > 0) {
      this.powerUpTimer--;
      if (this.powerUpTimer <= 0) {
        this.powerUpType = -1;
      }
    }
    
    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
  }
  
  show() {
    // Draw player ship (AI-themed)
    push();
    translate(this.x, this.y);
    
    // Flash when invincible
    if (invincibleTimer > 0 && frameCount % 10 < 5) {
      stroke(255, 255, 255, 150);
      strokeWeight(1);
    } else {
      stroke(0, 255, 255);
      strokeWeight(2);
    }
    
    // Draw shield if active
    if (this.powerUpType === 2) {
      noFill();
      stroke(0, 255, 255, 150 + sin(frameCount * 0.1) * 100);
      ellipse(0, 0, this.size + 20, this.size + 20);
    }
    
    fill(50, 150, 255);
    triangle(0, -20, -15, 20, 15, 20); // Main body
    
    // Different cockpit color based on power-up
    if (this.powerUpType === 0) fill(255, 255, 0); // Rapid fire: yellow
    else if (this.powerUpType === 1) fill(0, 255, 0); // Triple shot: green
    else fill(255, 100, 100); // Normal: red
    
    triangle(0, -25, -5, -15, 5, -15); // Cockpit
    
    noStroke();
    fill(200);
    rect(-10, 10, 20, 5); // Thruster
    
    // Engine flame
    fill(255, 150, 0, 200);
    triangle(-8, 15, 0, 15 + random(10, 20), 8, 15);
    
    pop();
  }
  
  shoot() {
    if (this.shootCooldown > 0) return;
    
    // Set cooldown based on power-up
    this.shootCooldown = this.powerUpType === 0 ? 5 : 15;
    
    if (this.powerUpType === 1) {
      // Triple shot
      this.bullets.push(new Bullet(this.x - 15, this.y));
      this.bullets.push(new Bullet(this.x, this.y - 20));
      this.bullets.push(new Bullet(this.x + 15, this.y));
    } else {
      // Normal shot
      this.bullets.push(new Bullet(this.x, this.y - 20));
    }
  }
  
  applyPowerUp(type) {
    this.powerUpType = type;
    this.powerUpTimer = 600; // 10 seconds
    
    // Special case for shield - also gives invincibility
    if (type === 2) {
      invincibleTimer = 600;
    }
  }
}

// Bullet class
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 8;
    this.size = 10;
  }
  
  update() {
    this.y -= this.speed;
  }
  
  show() {
    fill(255, 255, 0);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size * 2);
  }
}

// Enemy class with varying designs
class Enemy {
  constructor(type, difficultyMultiplier) {
    this.x = random(width);
    this.y = -50;
    this.speed = random(2, 4) * (difficultyMultiplier || 1);
    this.type = floor(type || 0);
    this.size = 40 + this.type * 10;
    this.points = (this.type + 1) * 10;
    this.health = this.type + 1;
  }
  
  update() {
    this.y += this.speed;
  }
  
  show() {
    push();
    translate(this.x, this.y);
    stroke(255, 0, 0);
    strokeWeight(2);
    
    if (this.type === 0) { // Scout ship
      fill(150, 0, 0);
      ellipse(0, 0, this.size, this.size * 0.7);
      fill(255, 150, 150);
      ellipse(0, -10, 10, 10);
    } else if (this.type === 1) { // Fighter ship
      fill(200, 0, 0);
      triangle(0, -20, -20, 20, 20, 20);
      fill(255);
      rect(-5, -15, 10, 5);
    } else { // Destroyer ship
      fill(100, 0, 0);
      rect(-this.size / 2, -this.size / 2, this.size, this.size);
      fill(255, 0, 0);
      ellipse(0, 0, 20, 20);
    }
    
    // Show health if more than 1
    if (this.health > 1) {
      fill(255);
      textSize(12);
      textAlign(CENTER, CENTER);
      text(this.health, 0, 0);
    }
    
    pop();
  }
  
  hits(obj) {
    let d = dist(this.x, this.y, obj.x, obj.y);
    
    if (d < this.size / 2 + (obj.size || 10) / 2) {
      // If it's a bullet, reduce health
      if (obj.constructor.name === "Bullet") {
        this.health--;
        return this.health <= 0;
      }
      return true;
    }
    return false;
  }
}

// Particle effect for explosions
class ParticleEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: random(-2, 2),
        vy: random(-2, 2),
        life: random(20, 40)
      });
    }
  }
  
  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    for (let p of this.particles) {
      fill(255, 150, 0, p.life * 10);
      ellipse(p.x, p.y, 5);
    }
    pop();
  }
  
  isDone() {
    return this.particles.every(p => p.life <= 0);
  }
}

// Power-up class
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 0: rapid fire, 1: triple shot, 2: shield
    this.speed = 2;
    this.size = 20;
    this.rotation = 0;
  }
  
  update() {
    this.y += this.speed;
    this.rotation += 0.05;
  }
  
  show() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    
    // Different colors for different power-ups
    if (this.type === 0) {
      // Rapid fire: yellow
      fill(255, 255, 0);
      stroke(200, 200, 0);
    } else if (this.type === 1) {
      // Triple shot: green
      fill(0, 255, 0);
      stroke(0, 200, 0);
    } else {
      // Shield: blue
      fill(0, 200, 255);
      stroke(0, 150, 200);
    }
    
    strokeWeight(2);
    
    // Draw power-up icon
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI / 5 * i - HALF_PI;
      let x1 = cos(angle) * this.size;
      let y1 = sin(angle) * this.size;
      vertex(x1, y1);
      
      angle += TWO_PI / 10;
      let x2 = cos(angle) * (this.size / 2);
      let y2 = sin(angle) * (this.size / 2);
      vertex(x2, y2);
    }
    endShape(CLOSE);
    
    // Draw icon in the middle
    noStroke();
    fill(255);
    if (this.type === 0) {
      // Rapid fire: lightning bolt
      triangle(-5, -5, 0, 5, 5, -5);
    } else if (this.type === 1) {
      // Triple shot: three dots
      ellipse(-5, 0, 4, 4);
      ellipse(0, 0, 4, 4);
      ellipse(5, 0, 4, 4);
    } else {
      // Shield: circle
      ellipse(0, 0, 10, 10);
    }
    
    pop();
  }
}

// Boss class
class Boss {
  constructor(level) {
    this.level = Math.max(1, level || 1);
    this.x = width / 2;
    this.y = 100;
    this.vx = 2 + this.level * 0.5;
    this.size = 80 + this.level * 10;
    this.health = 20 + this.level * 10;
    this.maxHealth = this.health;
    this.points = 500 * this.level;
    this.attackTimer = 0;
    this.attackPattern = 0;
    this.direction = 1;
    this.bullets = [];
  }
  
  update() {
    // Move side to side
    this.x += this.vx * this.direction;
    if (this.x > width - this.size/2 || this.x < this.size/2) {
      this.direction *= -1;
    }
    
    // Attack patterns
    this.attackTimer++;
    
    // Different attack patterns based on level
    if (this.level <= 2) {
      // Basic attack pattern - shoot every 60 frames
      if (this.attackTimer >= 60) {
        this.attackTimer = 0;
        
        // Simple bullet pattern
        for (let i = -2; i <= 2; i++) {
          enemies.push(new EnemyBullet(this.x + i * 20, this.y + this.size/2, i * 0.5, 5));
        }
      }
    } else if (this.level <= 4) {
      // Intermediate attack pattern - alternate between spread and targeted
      if (this.attackTimer >= 45) {
        this.attackTimer = 0;
        this.attackPattern = (this.attackPattern + 1) % 2;
        
        if (this.attackPattern === 0) {
          // Spread pattern
          for (let i = -3; i <= 3; i++) {
            enemies.push(new EnemyBullet(this.x, this.y + this.size/2, i * 1, 4));
          }
        } else {
          // Targeted pattern - aim at player
          let dx = player.x - this.x;
          let dy = player.y - this.y;
          let angle = atan2(dy, dx);
          let speed = 6;
          
          enemies.push(new EnemyBullet(
            this.x, 
            this.y + this.size/2, 
            cos(angle) * speed, 
            sin(angle) * speed
          ));
          
          // Add two more bullets at slight angles
          enemies.push(new EnemyBullet(
            this.x, 
            this.y + this.size/2, 
            cos(angle + 0.2) * speed, 
            sin(angle + 0.2) * speed
          ));
          
          enemies.push(new EnemyBullet(
            this.x, 
            this.y + this.size/2, 
            cos(angle - 0.2) * speed, 
            sin(angle - 0.2) * speed
          ));
        }
      }
    } else {
      // Advanced attack pattern - multiple attacks and minions
      if (this.attackTimer >= 30) {
        this.attackTimer = 0;
        this.attackPattern = (this.attackPattern + 1) % 3;
        
        if (this.attackPattern === 0) {
          // Circle pattern
          for (let i = 0; i < 8; i++) {
            let angle = TWO_PI / 8 * i;
            enemies.push(new EnemyBullet(
              this.x, 
              this.y, 
              cos(angle) * 5, 
              sin(angle) * 5
            ));
          }
        } else if (this.attackPattern === 1) {
          // Targeted rapid fire
          let dx = player.x - this.x;
          let dy = player.y - this.y;
          let angle = atan2(dy, dx);
          let speed = 7;
          
          enemies.push(new EnemyBullet(
            this.x, 
            this.y + this.size/2, 
            cos(angle) * speed, 
            sin(angle) * speed
          ));
        } else {
          // Spawn minions
          if (frameCount % 300 === 0) {
            enemies.push(new Enemy(1, difficultyMultiplier));
            enemies.push(new Enemy(1, difficultyMultiplier));
          }
          
          // Laser warning
          fill(255, 0, 0, 150);
          rect(this.x - 5, this.y, 10, height - this.y);
          
          // After warning, fire laser
          if (frameCount % 60 === 0) {
            // Check if player is in laser path
            if (abs(player.x - this.x) < 30 && player.y > this.y && invincibleTimer <= 0) {
              lives--;
              invincibleTimer = 120;
              particleEffects.push(new ParticleEffect(player.x, player.y));
              
              if (lives <= 0) {
                gameState = "gameover";
              }
            }
            
            // Visual laser effect
            fill(255, 0, 0);
            rect(this.x - 5, this.y, 10, height - this.y);
          }
        }
      }
    }
    
    // Update enemy bullets
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i] instanceof EnemyBullet) {
        if (enemies[i].y > height || enemies[i].y < 0 || enemies[i].x > width || enemies[i].x < 0) {
          enemies.splice(i, 1);
        }
      }
    }
  }
  
  show() {
    push();
    translate(this.x, this.y);
    
    // Boss appearance changes based on level
    if (this.level <= 2) {
      // Basic boss
      fill(150, 0, 0);
      stroke(255, 0, 0);
      strokeWeight(3);
      ellipse(0, 0, this.size, this.size * 0.7);
      
      // Eyes
      fill(255, 255, 0);
      noStroke();
      ellipse(-this.size/5, -this.size/10, this.size/5, this.size/10);
      ellipse(this.size/5, -this.size/10, this.size/5, this.size/10);
      
      // Mouth
      stroke(0);
      strokeWeight(2);
      line(-this.size/4, this.size/5, this.size/4, this.size/5);
    } else if (this.level <= 4) {
      // Intermediate boss
      fill(100, 0, 100);
      stroke(200, 0, 200);
      strokeWeight(3);
      
      // Body
      beginShape();
      for (let i = 0; i < 8; i++) {
        let angle = TWO_PI / 8 * i;
        let r = this.size/2;
        if (i % 2 === 0) r *= 0.8;
        vertex(cos(angle) * r, sin(angle) * r);
      }
      endShape(CLOSE);
      
      // Core
      fill(255, 0, 255);
      noStroke();
      ellipse(0, 0, this.size/3, this.size/3);
      
      // Rotating elements
      stroke(255, 0, 255);
      strokeWeight(2);
      noFill();
      rotate(frameCount * 0.01);
      ellipse(0, 0, this.size * 0.8, this.size * 0.4);
      rotate(PI/2);
      ellipse(0, 0, this.size * 0.8, this.size * 0.4);
    } else {
      // Advanced boss
      fill(0, 0, 100);
      stroke(0, 100, 255);
      strokeWeight(3);
      
      // Main body
      rect(-this.size/2, -this.size/2, this.size, this.size);
      
      // Glowing core
      let pulseSize = sin(frameCount * 0.1) * 10;
      fill(0, 200, 255, 150);
      noStroke();
      ellipse(0, 0, this.size/2 + pulseSize, this.size/2 + pulseSize);
      
      fill(255);
      ellipse(0, 0, this.size/4, this.size/4);
      
      // Turrets
      fill(50, 50, 50);
      stroke(0);
      strokeWeight(1);
      rect(-this.size/2, -this.size/6, this.size/6, this.size/3);
      rect(this.size/2 - this.size/6, -this.size/6, this.size/6, this.size/3);
      
      // Cannon
      fill(100, 100, 100);
      rect(-this.size/12, this.size/2 - this.size/6, this.size/6, this.size/6);
    }
    
    // Show damage effect
    if (this.health < this.maxHealth / 2) {
      // Damage particles
      if (random(1) < 0.2) {
        particleEffects.push(new ParticleEffect(
          this.x + random(-this.size/3, this.size/3), 
          this.y + random(-this.size/3, this.size/3)
        ));
      }
      
      // Damage visual
      stroke(255, 0, 0);
      strokeWeight(1);
      for (let i = 0; i < 5; i++) {
        let x1 = random(-this.size/2, this.size/2);
        let y1 = random(-this.size/2, this.size/2);
        let x2 = x1 + random(-10, 10);
        let y2 = y1 + random(-10, 10);
        line(x1, y1, x2, y2);
      }
    }
    
    pop();
  }
  
  hits(obj) {
    let d = dist(this.x, this.y, obj.x, obj.y);
    return d < this.size/2;
  }
  
  hitsPlayer(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    return d < this.size/2 + player.size/2;
  }
}

// Enemy bullet class
class EnemyBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = 8;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }
  
  show() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }
  
  hits(obj) {
    let d = dist(this.x, this.y, obj.x, obj.y);
    return d < this.size/2 + obj.size/2;
  }
} 
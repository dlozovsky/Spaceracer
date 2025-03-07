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
  
  // Check if we have a submitted score in localStorage
  try {
    const savedScoreSubmitted = localStorage.getItem('scoreSubmitted');
    const savedGameState = localStorage.getItem('submittedGameState');
    
    if (savedScoreSubmitted === 'true') {
      console.log("Found saved score submission state in localStorage");
      scoreSubmitted = true;
      
      if (savedGameState === 'gameover') {
        gameState = "gameover";
      }
    }
  } catch (e) {
    console.error("Could not retrieve score submission state from localStorage:", e);
  }
  
  // Initialize Supabase client using the external config
  try {
    // Check if the config is available
    if (window.SUPABASE_CONFIG) {
      console.log("Supabase config found:", {
        url: window.SUPABASE_CONFIG.url ? "URL exists" : "URL missing",
        key: window.SUPABASE_CONFIG.key ? "Key exists" : "Key missing"
      });
      
      supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url, 
        window.SUPABASE_CONFIG.key
      );
      console.log("Supabase initialized successfully");
      
      // Test the connection
      supabase.from('leaderboard').select('count', { count: 'exact', head: true })
        .then(response => {
          console.log("Supabase connection test:", response.error ? "Failed" : "Successful");
          if (response.error) {
            console.error("Supabase connection test error:", response.error);
          }
        })
        .catch(error => {
          console.error("Supabase connection test error:", error);
        });
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
  
  // Initialize the flag to prevent game restart during score submission
  window.preventGameRestart = false;
  
  // Reset input fields
  playerNameInput = '';
  playerEmailInput = '';
  activeInput = null;
  inputActive = false;
  leaderboardError = '';
  
  // Clear localStorage
  try {
    localStorage.removeItem('scoreSubmitted');
    localStorage.removeItem('submittedGameState');
    localStorage.removeItem('currentScreen');
    localStorage.removeItem('gameState');
  } catch (e) {
    console.error("Could not clear localStorage:", e);
  }
  
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
  
  // If a score has been submitted, ensure we stay in game over state
  if (scoreSubmitted && gameState !== "gameover") {
    console.log("Score submitted but not in game over state, correcting");
    gameState = "gameover";
  }
  
  if (gameState === "start") {
    drawStartScreen();
    // Don't allow score submission in start screen
    showScoreSubmission = false;
  } else if (gameState === "play") {
    playGame();
    // Don't allow score submission during gameplay
    showScoreSubmission = false;
  } else if (gameState === "gameover") {
    drawGameOverScreen();
    // Score submission is allowed in game over state
  }
  
  // Always draw help icon
  drawHelpIcon();
  
  // Only show one overlay at a time, prioritizing help screen
  if (showHelp) {
    drawHelpScreen();
  } else if (showLeaderboard) {
    drawLeaderboard();
  } else if (showScoreSubmission && gameState === "gameover") {
    // Only show score submission form in game over state
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
    // Explicitly prevent score submission form from appearing
    showScoreSubmission = false;
    fetchLeaderboard();
  }, 'leaderboard');
  
  // Ensure we're in the start state
  gameState = "start";
  // Reset score submission flag
  scoreSubmitted = false;
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
  
  // Ensure we're in game over state
  gameState = "gameover";
  
  // Show submit score button if score not yet submitted
  if (!scoreSubmitted) {
    drawButton("Submit Score", width / 2, height / 2 + 20, 200, 40, () => {
      console.log("Submit Score button clicked from game over screen");
      showScoreSubmission = true;
      // Explicitly ensure we stay in game over state
      gameState = "gameover";
      // Don't clear player name if it's already set
      if (!playerNameInput) playerNameInput = '';
      if (!playerEmailInput) playerEmailInput = '';
      // Ensure help screen is closed
      showHelp = false;
    }, 'leaderboard');
  } else {
    fill(0, 255, 0);
    text("Score Submitted!", width / 2, height / 2 + 20);
  }
  
  // View leaderboard button
  drawButton("View Leaderboard", width / 2, height / 2 + 70, 200, 40, () => {
    console.log("View Leaderboard button clicked from game over screen");
    
    // Explicitly set flags to ensure correct behavior
    showLeaderboard = true;
    showScoreSubmission = false;
    showHelp = false;
    
    // Force game state to remain in game over
    gameState = "gameover";
    
    // Store state in localStorage to ensure persistence
    try {
      localStorage.setItem('currentScreen', 'leaderboard');
      localStorage.setItem('gameState', 'gameover');
      localStorage.setItem('fromGameOver', 'true');
    } catch (e) {
      console.error("Could not store screen state in localStorage:", e);
    }
    
    // Fetch leaderboard data
    fetchLeaderboard();
  }, 'leaderboard'); // Add a special button type for leaderboard
  
  // Play again button
  drawButton("Play Again", width / 2, height / 2 + 120, 200, 40, () => {
    console.log("Play Again button clicked, resetting game");
    gameState = "play";
    resetGame();
    // Reset all overlay flags
    showHelp = false;
    showLeaderboard = false;
    showScoreSubmission = false;
    scoreSubmitted = false;
  }, 'leaderboard');
}

function drawScoreSubmissionForm() {
  // Semi-transparent background
  push();
  fill(0, 0, 30, 220);
  rect(0, 0, width, height);
  
  // If not in game over state, show a message and play button instead
  if (gameState !== "gameover") {
    // Form title
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(36);
    text("Ready to Play?", width/2, height/2 - 60);
    
    // Play button
    const playButtonX = width/2;
    const playButtonY = height/2 + 20;
    const playButtonWidth = 200;
    const playButtonHeight = 50;
    
    // Check if mouse is over play button
    const isPlayHovered = mouseX > playButtonX - playButtonWidth/2 && 
                         mouseX < playButtonX + playButtonWidth/2 && 
                         mouseY > playButtonY - playButtonHeight/2 && 
                         mouseY < playButtonY + playButtonHeight/2;
    
    // Draw play button with hover effect
    if (isPlayHovered) {
      fill(80, 180, 80); // Brighter green when hovered
      stroke(255);
      strokeWeight(2);
    } else {
      fill(60, 160, 60); // Dark green
      noStroke();
    }
    
    // Draw the button
    rect(playButtonX - playButtonWidth/2, playButtonY - playButtonHeight/2, 
         playButtonWidth, playButtonHeight, 5);
    
    // Draw button text
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("START GAME", playButtonX, playButtonY);
    
    // Store the play button in a global variable for mousePressed
    window.playButton = {
      x: playButtonX,
      y: playButtonY,
      width: playButtonWidth,
      height: playButtonHeight,
      isHovered: isPlayHovered
    };
    
    pop();
    return;
  }
  
  // Normal score submission form (only shown in game over state)
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
  
  // SUBMIT BUTTON - COMPLETELY NEW IMPLEMENTATION
  const submitBtnX = width/2;
  const submitBtnY = 320;
  const submitBtnWidth = 150;
  const submitBtnHeight = 40;
  
  // Check if mouse is over button
  const isSubmitHovered = mouseX > submitBtnX - submitBtnWidth/2 && 
                         mouseX < submitBtnX + submitBtnWidth/2 && 
                         mouseY > submitBtnY - submitBtnHeight/2 && 
                         mouseY < submitBtnY + submitBtnHeight/2;
  
  // Draw button with hover effect
  if (isSubmitHovered) {
    fill(100, 255, 100); // Bright green when hovered
    stroke(255);
    strokeWeight(2);
  } else {
    fill(60, 180, 60); // Darker green
    noStroke();
  }
  
  // Draw the button
  rect(submitBtnX - submitBtnWidth/2, submitBtnY - submitBtnHeight/2, submitBtnWidth, submitBtnHeight, 5);
  
  // Draw label
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("SUBMIT", submitBtnX, submitBtnY);
  
  // Store the button in a global variable for mousePressed
  window.submitScoreButton = {
    x: submitBtnX,
    y: submitBtnY,
    width: submitBtnWidth,
    height: submitBtnHeight,
    isHovered: isSubmitHovered,
    action: "submit"
  };
  
  // CANCEL BUTTON - COMPLETELY NEW IMPLEMENTATION
  const cancelBtnX = width/2;
  const cancelBtnY = 370;
  const cancelBtnWidth = 150;
  const cancelBtnHeight = 40;
  
  // Check if mouse is over button
  const isCancelHovered = mouseX > cancelBtnX - cancelBtnWidth/2 && 
                         mouseX < cancelBtnX + cancelBtnWidth/2 && 
                         mouseY > cancelBtnY - cancelBtnHeight/2 && 
                         mouseY < cancelBtnY + cancelBtnHeight/2;
  
  // Draw button with hover effect
  if (isCancelHovered) {
    fill(255, 215, 0); // Bright gold when hovered
    stroke(255);
    strokeWeight(2);
  } else {
    fill(218, 165, 32); // Darker gold
    noStroke();
  }
  
  // Draw the button
  rect(cancelBtnX - cancelBtnWidth/2, cancelBtnY - cancelBtnHeight/2, cancelBtnWidth, cancelBtnHeight, 5);
  
  // Draw label
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Cancel", cancelBtnX, cancelBtnY);
  
  // Store the button in a global variable for mousePressed
  window.cancelScoreButton = {
    x: cancelBtnX,
    y: cancelBtnY,
    width: cancelBtnWidth,
    height: cancelBtnHeight,
    isHovered: isCancelHovered
  };
  
  // Display error message if any
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
  
  // Use standard button for close instead of direct implementation
  drawButton("Return to Game", width/2, height - 80, 150, 40, () => {
    console.log("Leaderboard close button clicked via standard button");
    showLeaderboard = false;
    
    // Check localStorage for saved game state
    try {
      const fromGameOver = localStorage.getItem('fromGameOver');
      if (fromGameOver === 'true') {
        console.log("Returning to game over screen from leaderboard");
        gameState = "gameover";
        localStorage.removeItem('fromGameOver');
      }
    } catch (e) {
      console.error("Could not retrieve game state from localStorage:", e);
    }
    
    // Always ensure we return to game over screen if score was submitted
    if (scoreSubmitted) {
      console.log("Score was submitted, forcing return to game over screen");
      gameState = "gameover";
      showScoreSubmission = false;
    } else if (gameState === "start") {
      console.log("Returning to start screen");
    } else {
      console.log("Returning to previous screen, setting to gameover");
      gameState = "gameover"; // Default to gameover if unsure
    }
    
    // Store state in localStorage
    try {
      localStorage.setItem('currentScreen', 'gameover');
    } catch (e) {
      console.error("Could not store screen state in localStorage:", e);
    }
  }, 'close');
  
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
  
  if (label === "SUBMIT" && isHovered) {
    console.log("Submit button hovered in drawButton");
  }
  
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
  } else if (buttonType === 'leaderboard') {
    // Gold leaderboard button
    if (isHovered) {
      fill(255, 215, 0); // Bright gold when hovered
      stroke(255);
      strokeWeight(2);
    } else {
      fill(218, 165, 32); // Darker gold
      noStroke();
    }
  } else if (buttonType === 'submit') {
    // Green submit button
    if (isHovered) {
      fill(100, 255, 100); // Bright green when hovered
      stroke(255);
      strokeWeight(2);
    } else {
      fill(60, 180, 60); // Darker green
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
    console.log(`Setting hoveredButton for: ${label}`);
    this.hoveredButton = onClick;
    
    // Store button type for debugging
    this.hoveredButtonType = buttonType;
  }
}

function mousePressed() {
  console.log("Mouse pressed at:", mouseX, mouseY);
  
  // Check for score submission buttons first
  if (showScoreSubmission) {
    // Check for submit button click
    if (window.submitScoreButton) {
      const btn = window.submitScoreButton;
      if (mouseX > btn.x - btn.width/2 && mouseX < btn.x + btn.width/2 && 
          mouseY > btn.y - btn.height/2 && mouseY < btn.y + btn.height/2) {
        console.log("Submit score button clicked");
        
        // Prevent the game from restarting
        window.preventGameRestart = true;
        
        // Force game state to remain in game over
        gameState = "gameover";
        
        // Call submitScore directly
        submitScore();
        
        return false;
      }
    }
    
    // Check for cancel button click
    if (window.cancelScoreButton) {
      const btn = window.cancelScoreButton;
      if (mouseX > btn.x - btn.width/2 && mouseX < btn.x + btn.width/2 && 
          mouseY > btn.y - btn.height/2 && mouseY < btn.y + btn.height/2) {
        console.log("Cancel button clicked");
        
        // Close the score submission form
        showScoreSubmission = false;
        
        // Ensure help screen is closed
        showHelp = false;
        
        return false;
      }
    }
    
    // Check input fields
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
    
    // If we're in the score submission screen, don't process any other clicks
    return false;
  }
  
  // Check if help icon was clicked
  if (dist(mouseX, mouseY, helpIcon.x, helpIcon.y) < helpIcon.radius) {
    console.log("Help icon clicked");
    // Toggle help screen
    showHelp = !showHelp;
    
    // If opening help, close other overlays
    if (showHelp) {
      showLeaderboard = false;
      showScoreSubmission = false;
    }
    
    return false;
  }
  
  // Check for play button click in game over screen
  if (gameState === "gameover" && !showScoreSubmission && !showLeaderboard) {
    // Check for "Submit Score" button
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 20 - 20 && mouseY < height/2 + 20 + 20) {
      console.log("Submit Score button clicked from game over screen");
      showScoreSubmission = true;
      // Explicitly ensure we stay in game over state
      gameState = "gameover";
      // Don't clear player name if it's already set
      if (!playerNameInput) playerNameInput = '';
      if (!playerEmailInput) playerEmailInput = '';
      // Ensure help screen is closed
      showHelp = false;
      return false;
    }
    
    // Check for "View Leaderboard" button in game over screen
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 70 - 20 && mouseY < height/2 + 70 + 20) {
      console.log("View Leaderboard button clicked from game over screen");
      
      // Explicitly set flags to ensure correct behavior
      showLeaderboard = true;
      showScoreSubmission = false;
      showHelp = false;
      
      // Force game state to remain in game over
      gameState = "gameover";
      
      // Fetch leaderboard data
      fetchLeaderboard();
      return false;
    }
    
    // Check for "Play Again" button
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 120 - 20 && mouseY < height/2 + 120 + 20) {
      console.log("Play Again button clicked, resetting game");
      gameState = "play";
      resetGame();
      // Reset all overlay flags
      showHelp = false;
      showLeaderboard = false;
      showScoreSubmission = false;
      scoreSubmitted = false;
      return false;
    }
  }
  
  // Check for buttons in start screen
  if (gameState === "start") {
    // Check for "Play" button
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 60 - 20 && mouseY < height/2 + 60 + 20) {
      console.log("Play button clicked from start screen");
      gameState = "play";
      resetGame();
      return false;
    }
    
    // Check for "View Leaderboard" button in start screen
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 120 - 20 && mouseY < height/2 + 120 + 20) {
      console.log("View Leaderboard button clicked from start screen");
      
      // Explicitly set flags to ensure correct behavior
      showLeaderboard = true;
      showHelp = false;
      
      // Fetch leaderboard data
      fetchLeaderboard();
      return false;
    }
  }
  
  // If we're in the leaderboard screen, check for close button
  if (showLeaderboard) {
    // Check for close button (top right)
    if (mouseX > width - 50 && mouseY < 50) {
      console.log("Leaderboard close button clicked");
      showLeaderboard = false;
      return false;
    }
    
    // Check for "Return to Game" button
    if (mouseX > width/2 - 75 && mouseX < width/2 + 75 && 
        mouseY > height - 80 - 20 && mouseY < height - 80 + 20) {
      console.log("Return to Game button clicked from leaderboard");
      showLeaderboard = false;
      return false;
    }
    
    // Check for "Refresh" button
    if (mouseX > width/2 + 200 - 75 && mouseX < width/2 + 200 + 75 && 
        mouseY > height - 80 - 20 && mouseY < height - 80 + 20) {
      console.log("Refresh button clicked from leaderboard");
      fetchLeaderboard();
      return false;
    }
  }
  
  // Handle button clicks using the stored reference
  if (this.hoveredButton) {
    console.log("Executing button click handler");
    // Call the button function
    this.hoveredButton();
    return false;
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
        // Ensure help screen is closed before submission
        showHelp = false;
        submitScore();
      }
      return false;
    }
  }
  
  // Toggle help screen with H key, but only if not in score submission
  if ((key === 'h' || key === 'H') && !showScoreSubmission) {
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
    if ((gameState === "start" || gameState === "gameover") && !showScoreSubmission && !showLeaderboard && !window.preventGameRestart) {
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
  console.log("submitScore function called");
  
  // Force game state to game over
  gameState = "gameover";
  
  // Set a flag to prevent the game from restarting
  window.preventGameRestart = true;
  
  // Prevent duplicate submissions
  if (leaderboardLoading) {
    console.log("Submission already in progress, ignoring duplicate click");
    return;
  }
  
  if (scoreSubmitted) {
    console.log("Score already submitted, closing submission window");
    showScoreSubmission = false;
    showLeaderboard = true;
    return;
  }
  
  // Trim input values to remove any whitespace
  playerNameInput = playerNameInput.trim();
  playerEmailInput = playerEmailInput.trim();
  
  console.log("Input values:", { name: playerNameInput, email: playerEmailInput });
  
  if (!playerNameInput || !playerEmailInput) {
    console.log("Missing input fields:", { name: playerNameInput, email: playerEmailInput });
    leaderboardError = 'Please enter both name and email.';
    return;
  }
  
  // More lenient email validation - just check for @ symbol
  if (!playerEmailInput.includes('@')) {
    console.log("Invalid email format (missing @):", playerEmailInput);
    leaderboardError = 'Please enter a valid email address with @ symbol.';
    return;
  }
  
  // Check if Supabase is initialized
  if (!supabase) {
    console.log("Supabase not initialized");
    leaderboardError = 'Score submission is not available. Supabase not configured.';
    return;
  }
  
  console.log("Preparing to submit score to Supabase");
  console.log("Supabase object:", supabase ? "exists" : "null");
  console.log("Supabase from method:", typeof supabase.from === 'function' ? "exists" : "missing");
  leaderboardLoading = true;
  leaderboardError = '';
  
  // Store player information before submission
  const submittedName = playerNameInput;
  const submittedEmail = playerEmailInput;
  const submittedScore = score;
  const submittedWave = wave;
  
  try {
    console.log("Submitting score to Supabase:", {
      player_name: submittedName,
      email: submittedEmail,
      score: submittedScore,
      wave_reached: submittedWave
    });
    
    // Insert into the main leaderboard table (with email)
    console.log("About to call supabase.from('leaderboard')");
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([
        { 
          player_name: submittedName, 
          email: submittedEmail, 
          score: submittedScore,
          wave_reached: submittedWave
        }
      ])
      .select();
    
    console.log("Supabase insert completed");
    
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    
    console.log("Score submitted successfully, response data:", data);
    
    // Success - immediately close the submission form
    showScoreSubmission = false;
    scoreSubmitted = true;
    
    // Make sure help screen doesn't appear
    showHelp = false;
    
    // Ensure we stay in game over state
    gameState = "gameover";
    
    // Store the fact that we've submitted a score in localStorage to make it persistent
    try {
      localStorage.setItem('scoreSubmitted', 'true');
      localStorage.setItem('submittedGameState', 'gameover');
    } catch (e) {
      console.error("Could not store score submission state in localStorage:", e);
    }
    
    // Refresh leaderboard and show it
    await fetchLeaderboard();
    showLeaderboard = true;
    
  } catch (error) {
    console.error('Error submitting score:', error);
    console.error('Error details:', error.message, error.stack);
    leaderboardError = 'Failed to submit score: ' + (error.message || 'Unknown error');
    leaderboardLoading = false;
    
    // Display the error in the console for debugging
    console.log("Leaderboard error set to:", leaderboardError);
  } finally {
    // Make sure leaderboardLoading is reset if there was an error
    if (leaderboardError) {
      leaderboardLoading = false;
    }
    
    // Reset the flag after a short delay to ensure the game doesn't restart
    setTimeout(() => {
      window.preventGameRestart = false;
    }, 2000);
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
    try {
      if (!boss) {
        // Create boss
        console.log(`Creating boss for wave ${wave}`);
        boss = new Boss(wave);
        bossWarningTimer = 0;
      }
      
      // Update and show boss if it exists
      if (boss) {
        try {
          boss.update();
          boss.show();
          
          // Check collision with player bullets
          for (let j = player.bullets.length - 1; j >= 0; j--) {
            if (boss && boss.hits && typeof boss.hits === 'function' && player.bullets[j] && 
                boss.hits(player.bullets[j])) {
              boss.health -= 1;
              particleEffects.push(new ParticleEffect(player.bullets[j].x, player.bullets[j].y));
              player.bullets.splice(j, 1);
              
              // Check if boss is defeated
              if (boss.health <= 0) {
                // Boss defeated
                let bossPoints = boss.points || 500 * wave;
                score += bossPoints;
                console.log(`Boss defeated! Wave ${wave} completed. Score: ${score}`);
                
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
          if (boss && boss.hitsPlayer && typeof boss.hitsPlayer === 'function' && 
              player && boss.hitsPlayer(player) && invincibleTimer <= 0) {
            lives--;
            invincibleTimer = 120; // 2 seconds of invincibility
            particleEffects.push(new ParticleEffect(player.x, player.y));
            
            if (lives <= 0) {
              gameState = "gameover";
            }
          }
        } catch (innerError) {
          console.error("Error in boss update/show:", innerError);
          // Handle the error but don't reset the boss fight yet
          // This allows for recovery from temporary errors
        }
      } else {
        console.error("Boss is null but isBossFight is true");
        // Reset boss fight state
        isBossFight = false;
        bossDefeated = true;
        wave++;
        waveEnemyCount = 10 + wave * 5;
        enemiesDefeated = 0;
      }
    } catch (e) {
      console.error("Critical error in boss fight:", e);
      // Recover from error by resetting boss fight
      boss = null;
      isBossFight = false;
      bossDefeated = true;
      
      // Advance to next wave to prevent getting stuck
      wave++;
      waveEnemyCount = 10 + wave * 5;
      enemiesDefeated = 0;
      
      // Display error notification
      fill(255, 0, 0);
      textSize(16);
      textAlign(CENTER, CENTER);
      text("Boss fight error - advancing to next wave", width / 2, height / 2 + 50);
    }
  } else {
    // Regular enemy spawning
    if (frameCount % Math.max(5, 30 - wave * 2) === 0 && enemies.length < 5 + wave && !bossDefeated) {
      enemies.push(new Enemy(floor(random(3)), difficultyMultiplier));
    }
  }
  
  // Update and process all enemies and bullets
  for (let i = enemies.length - 1; i >= 0; i--) {
    // Skip if enemy no longer exists (might have been removed in a previous iteration)
    if (!enemies[i]) {
      continue;
    }
    
    try {
      // Update and show enemy
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
        if (enemies[i].hits && typeof enemies[i].hits === 'function' && 
            enemies[i].hits(player) && invincibleTimer <= 0) {
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
          if (enemies[i] && enemies[i].hits && typeof enemies[i].hits === 'function' && 
              enemies[i].hits(player.bullets[j])) {
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
        if (enemies[i] && enemies[i].hits && typeof enemies[i].hits === 'function' && 
            enemies[i].hits(player) && invincibleTimer <= 0) {
          lives--;
          invincibleTimer = 120; // 2 seconds of invincibility
          particleEffects.push(new ParticleEffect(player.x, player.y));
          
          if (lives <= 0) {
            gameState = "gameover";
          }
        }
      }
    } catch (e) {
      console.error("Error processing enemy:", e);
      // Remove problematic enemy to prevent freezing
      enemies.splice(i, 1);
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
    console.log(`Wave ${wave} complete, starting boss fight`);
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
          // Create enemy bullet with safe values
          try {
            enemies.push(new EnemyBullet(this.x + i * 20, this.y + this.size/2, i * 0.5, 5));
          } catch (e) {
            console.error("Error creating enemy bullet:", e);
          }
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
            try {
              enemies.push(new EnemyBullet(this.x, this.y + this.size/2, i * 1, 4));
            } catch (e) {
              console.error("Error creating enemy bullet:", e);
            }
          }
        } else {
          // Targeted pattern - aim at player
          if (player && typeof player.x !== 'undefined' && typeof player.y !== 'undefined') {
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            let angle = atan2(dy, dx);
            let speed = 6;
            
            try {
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
            } catch (e) {
              console.error("Error creating enemy bullet:", e);
            }
          }
        }
      }
    } else {
      // Advanced attack pattern - multiple attacks and minions
      if (this.attackTimer >= 30) {
        this.attackTimer = 0;
        this.attackPattern = (this.attackPattern + 1) % 3;
        
        try {
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
          } else if (this.attackPattern === 1 && player) {
            // Targeted rapid fire
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            let angle = atan2(dy, dx);
            
            for (let i = -1; i <= 1; i += 0.5) {
              enemies.push(new EnemyBullet(
                this.x, 
                this.y + this.size/2, 
                cos(angle + i * 0.1) * 7, 
                sin(angle + i * 0.1) * 7
              ));
            }
          } else {
            // Spawn minions
            if (enemies.length < 10) {
              enemies.push(new Enemy(floor(random(3)), 1.5));
              enemies.push(new Enemy(floor(random(3)), 1.5));
            }
          }
        } catch (e) {
          console.error("Error in boss attack pattern:", e);
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
    // Add type property to ensure it's treated correctly in collision detection
    this.type = -1; // Special type for enemy bullets
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
    // Check if the object exists and has x, y properties
    if (!obj || typeof obj.x === 'undefined' || typeof obj.y === 'undefined') {
      return false;
    }
    
    // Calculate distance between this bullet and the object
    let d = dist(this.x, this.y, obj.x, obj.y);
    
    // Use object's size if available, otherwise default to 20
    let objSize = obj.size || 20;
    
    // Return true if they are colliding
    return d < (this.size/2 + objSize/2);
  }
} 
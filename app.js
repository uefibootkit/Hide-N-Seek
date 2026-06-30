// Double SHA256 hashing for passwords
function doubleHash(password) {
  const firstHash = CryptoJS.SHA256(password).toString();
  const secondHash = CryptoJS.SHA256(firstHash).toString();
  return secondHash;
}

function getDefaultProfile(username) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
}

function getRankClass(rank) {
  switch(rank) {
    case 'Owner': return 'rank-owner';
    case 'Beta Tester': return 'rank-beta';
    case 'Seeker': return 'rank-seeker';
    default: return 'rank-user';
  }
}

// Data storage functions using localStorage
let cachedUsers = null;

function initializeDefaultUsers() {
  // Check if users exist in localStorage, if not create some defaults
  let users = localStorage.getItem('saklambac_users');
  if (!users) {
    const defaultUsers = {};
    // No default users for security - first register becomes Owner
    localStorage.setItem('saklambac_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
}

async function getUsers() {
  if (cachedUsers) {
    return cachedUsers;
  }
  
  try {
    const usersObj = initializeDefaultUsers();
    cachedUsers = usersObj;
    return usersObj;
  } catch (e) {
    console.error('Kullanıcılar çekilirken hata:', e);
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem('saklambac_users', JSON.stringify(users));
  cachedUsers = users;
}

function getCurrentUser() {
  try {
    const user = sessionStorage.getItem('saklambac_current');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function saveCurrentUser(user) {
  sessionStorage.setItem('saklambac_current', JSON.stringify(user));
}

function getCountdown() {
  try {
    const countdown = localStorage.getItem('saklambac_countdown');
    return countdown ? JSON.parse(countdown) : null;
  } catch (e) {
    return null;
  }
}

function saveCountdown(countdown) {
  localStorage.setItem('saklambac_countdown', JSON.stringify(countdown));
}

function clearCountdown() {
  localStorage.removeItem('saklambac_countdown');
}

// Audio functions
let audioContext;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playWhistleSound() {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.1);
  oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
  
  gainNode.gain.setValueAtTime(1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function playAlertSound() {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  
  for (let i = 0; i < 3; i++) {
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.2);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.2 + 0.1);
  }
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.6);
}

// UI Update functions
async function updateUserUI(user) {
  if (!user) return;
  
  // Navigation bar
  const navAvatar = document.getElementById('nav-avatar');
  const navUsername = document.getElementById('nav-username');
  
  if (navAvatar) navAvatar.src = user.profile || getDefaultProfile(user.username);
  if (navUsername) navUsername.textContent = user.username;
  
  // Profile page
  const profileAvatar = document.getElementById('profile-avatar');
  const profileUsername = document.getElementById('profile-username');
  const profileRank = document.getElementById('profile-rank');
  
  if (profileAvatar) profileAvatar.src = user.profile || getDefaultProfile(user.username);
  if (profileUsername) profileUsername.textContent = user.username;
  if (profileRank) {
    profileRank.textContent = user.rank;
    profileRank.className = 'rank-badge ' + getRankClass(user.rank);
  }
  
  // Owner tools visibility
  const ownerToolsTab = document.getElementById('owner-tools-tab');
  const ownerCountdownHome = document.getElementById('owner-countdown-home');
  
  if (ownerToolsTab) {
    ownerToolsTab.style.display = user.rank === 'Owner' ? 'inline-block' : 'none';
  }
  if (ownerCountdownHome) {
    ownerCountdownHome.classList.toggle('hidden', user.rank !== 'Owner');
  }
  
  await renderUsersList();
  await updateTargetUserSelect();
  await updateRankUserSelect();
}

async function renderUsersList() {
  const users = await getUsers();
  const usersListHome = document.getElementById('users-list-home');
  if (!usersListHome) return;
  
  usersListHome.innerHTML = '';
  
  Object.values(users).forEach(user => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <img src="${user.profile || getDefaultProfile(user.username)}" alt="${user.username}" class="player-avatar">
      <span class="player-username">${user.username}</span>
      <span class="rank-badge ${getRankClass(user.rank)}">${user.rank}</span>
    `;
    usersListHome.appendChild(card);
  });
}

async function updateTargetUserSelect() {
  const users = await getUsers();
  const select = document.getElementById('target-user-select');
  if (!select) return;
  
  select.innerHTML = '';
  
  Object.values(users).forEach(user => {
    const option = document.createElement('option');
    option.value = user.username;
    option.textContent = user.username;
    select.appendChild(option);
  });
}

// Countdown functions
let countdownInterval = null;

function updateCountdownDisplay(seconds) {
  const display = document.getElementById('countdown-display');
  if (!display) return;
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startCountdown(minutes) {
  let totalSeconds = minutes * 60;
  const endTime = Date.now() + totalSeconds * 1000;
  
  saveCountdown({ endTime: endTime, startedBy: getCurrentUser()?.username || 'unknown' });
  
  updateCountdownDisplay(totalSeconds);
  const display = document.getElementById('countdown-display');
  if (display) display.classList.remove('hidden');
  
  // Update buttons for Owner
  const currentUser = getCurrentUser();
  if (currentUser?.rank === 'Owner') {
    const stopBtnHome = document.getElementById('stop-countdown-btn-home');
    const startBtnHome = document.getElementById('start-countdown-btn-home');
    if (stopBtnHome) stopBtnHome.style.display = 'inline-block';
    if (startBtnHome) startBtnHome.style.display = 'none';
  }
  
  // Clear any existing interval
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(function() {
    const countdown = getCountdown();
    if (!countdown || !countdown.endTime) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      if (display) display.classList.add('hidden');
      return;
    }
    
    const remaining = Math.max(0, Math.ceil((countdown.endTime - Date.now()) / 1000));
    updateCountdownDisplay(remaining);
    
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      clearCountdown();
      if (display) display.classList.add('hidden');
      
      const stopBtnHome = document.getElementById('stop-countdown-btn-home');
      const startBtnHome = document.getElementById('start-countdown-btn-home');
      if (stopBtnHome) stopBtnHome.style.display = 'none';
      if (startBtnHome) startBtnHome.style.display = 'inline-block';
      
      playAlertSound();
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  clearCountdown();
  
  const display = document.getElementById('countdown-display');
  const stopBtnHome = document.getElementById('stop-countdown-btn-home');
  const startBtnHome = document.getElementById('start-countdown-btn-home');
  
  if (display) display.classList.add('hidden');
  if (stopBtnHome) stopBtnHome.style.display = 'none';
  if (startBtnHome) startBtnHome.style.display = 'inline-block';
}

function checkExistingCountdown() {
  const countdown = getCountdown();
  const currentUser = getCurrentUser();
  
  if (countdown && countdown.endTime && countdown.endTime > Date.now()) {
    const remaining = Math.ceil((countdown.endTime - Date.now()) / 1000);
    const display = document.getElementById('countdown-display');
    const stopBtnHome = document.getElementById('stop-countdown-btn-home');
    const startBtnHome = document.getElementById('start-countdown-btn-home');
    
    updateCountdownDisplay(remaining);
    if (display) display.classList.remove('hidden');
    
    // Only show stop/start buttons to Owner
    if (currentUser && currentUser.rank === 'Owner') {
      if (stopBtnHome) stopBtnHome.style.display = 'inline-block';
      if (startBtnHome) startBtnHome.style.display = 'none';
    }
    
    // Clear any existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(function() {
      const currentCountdown = getCountdown();
      if (!currentCountdown || !currentCountdown.endTime) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        if (display) display.classList.add('hidden');
        return;
      }
      
      const rem = Math.max(0, Math.ceil((currentCountdown.endTime - Date.now()) / 1000));
      updateCountdownDisplay(rem);
      
      if (rem <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        clearCountdown();
        if (display) display.classList.add('hidden');
        if (stopBtnHome) stopBtnHome.style.display = 'none';
        if (startBtnHome) startBtnHome.style.display = 'inline-block';
        playAlertSound();
      }
    }, 1000);
  }
}

// UI Navigation
function showAuth() {
  const authContainer = document.getElementById('auth-container');
  const mainContainer = document.getElementById('main-container');
  if (authContainer) authContainer.classList.remove('hidden');
  if (mainContainer) mainContainer.classList.add('hidden');
}

function showMain() {
  const authContainer = document.getElementById('auth-container');
  const mainContainer = document.getElementById('main-container');
  if (authContainer) authContainer.classList.add('hidden');
  if (mainContainer) mainContainer.classList.remove('hidden');
}

// Event listeners
function initEventListeners() {
  // Show register
  const showRegister = document.getElementById('show-register');
  if (showRegister) {
    showRegister.addEventListener('click', function(e) {
      e.preventDefault();
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      if (loginForm) loginForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
    });
  }
  
  // Show login
  const showLogin = document.getElementById('show-login');
  if (showLogin) {
    showLogin.addEventListener('click', function(e) {
      e.preventDefault();
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      if (registerForm) registerForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
    });
  }
  
  // Register
  const registerBtn = document.getElementById('register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async function() {
      const usernameInput = document.getElementById('register-username');
      const passwordInput = document.getElementById('register-password');
      const confirmInput = document.getElementById('register-confirm');
      
      if (!usernameInput || !passwordInput || !confirmInput) return;
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;
      
      if (!username || !password || !confirm) {
        alert('Please fill all fields');
        return;
      }
      
      if (password !== confirm) {
        alert('Passwords do not match');
        return;
      }
      
      if (password.length < 4) {
        alert('Password must be at least 4 characters');
        return;
      }
      
      const users = await getUsers();
      
      if (users[username]) {
        alert('Username already exists');
        return;
      }
      
      // First user is Owner
      const isFirstUser = Object.keys(users).length === 0;
      const rank = isFirstUser ? 'Owner' : 'User';
      
      const newUser = {
        username: username,
        password: doubleHash(password),
        rank: rank,
        profile: getDefaultProfile(username)
      };
      
      users[username] = newUser;
      saveUsers(users);
      
      saveCurrentUser(newUser);
      await updateUserUI(newUser);
      showMain();
      checkExistingCountdown();
      
      usernameInput.value = '';
      passwordInput.value = '';
      confirmInput.value = '';
    });
  }
  
  // Login
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async function() {
      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      
      if (!usernameInput || !passwordInput) return;
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      if (!username || !password) {
        alert('Please fill all fields');
        return;
      }
      
      const users = await getUsers();
      const user = users[username];
      
      if (!user || user.password !== doubleHash(password)) {
        alert('Invalid username or password');
        return;
      }
      
      saveCurrentUser(user);
      await updateUserUI(user);
      showMain();
      checkExistingCountdown();
      
      usernameInput.value = '';
      passwordInput.value = '';
    });
  }
  
  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      sessionStorage.removeItem('saklambac_current');
      showAuth();
    });
  }
  
  // Tab buttons
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const tabId = btn.getAttribute('data-tab');
      if (!tabId) return;
      
      // Deactivate all tabs
      document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(function(c) {
        c.classList.remove('active');
      });
      
      // Activate this tab
      btn.classList.add('active');
      const tabContent = document.getElementById(tabId + '-tab');
      if (tabContent) tabContent.classList.add('active');
    });
  });
  
  // Main action button (only Seeker cannot use)
  const mainActionBtn = document.getElementById('main-action-btn');
  if (mainActionBtn) {
    mainActionBtn.addEventListener('click', function() {
      const currentUser = getCurrentUser();
      if (currentUser?.rank === 'Seeker') {
        alert('Seekers cannot play sounds!');
        return;
      }
      playWhistleSound();
    });
  }
  
  // Change avatar button - hide
  const changeAvatarBtn = document.getElementById('change-avatar-btn');
  const avatarInput = document.getElementById('avatar-input');
  if (changeAvatarBtn) changeAvatarBtn.style.display = 'none';
  if (avatarInput) avatarInput.style.display = 'none';
  
  // Start countdown (home)
  const startCountdownHomeBtn = document.getElementById('start-countdown-btn-home');
  if (startCountdownHomeBtn) {
    startCountdownHomeBtn.addEventListener('click', function() {
      const minutesInput = document.getElementById('countdown-minutes-home');
      if (!minutesInput) return;
      
      const minutes = parseInt(minutesInput.value);
      if (minutes && minutes > 0 && minutes <= 60) {
        startCountdown(minutes);
      }
    });
  }
  
  // Stop countdown (home)
  const stopCountdownHomeBtn = document.getElementById('stop-countdown-btn-home');
  if (stopCountdownHomeBtn) {
    stopCountdownHomeBtn.addEventListener('click', stopCountdown);
  }
  
  // Play sound to user (Owner only)
  const playSoundBtn = document.getElementById('play-sound-btn');
  if (playSoundBtn) {
    playSoundBtn.addEventListener('click', async function() {
      const targetUserSelect = document.getElementById('target-user-select');
      if (!targetUserSelect) return;
      
      const targetUser = targetUserSelect.value;
      if (targetUser) {
        playAlertSound();
        alert('Sound played for ' + targetUser + '!');
      }
    });
  }
  
  // Assign rank (Owner only)
  const assignRankBtn = document.getElementById('assign-rank-btn');
  if (assignRankBtn) {
    assignRankBtn.addEventListener('click', async function() {
      const rankUserSelect = document.getElementById('rank-user-select');
      const rankSelect = document.getElementById('rank-select');
      if (!rankUserSelect || !rankSelect) return;
      
      const targetUsername = rankUserSelect.value;
      const newRank = rankSelect.value;
      
      if (!targetUsername) {
        alert('Please select a user');
        return;
      }
      
      const users = await getUsers();
      if (!users[targetUsername]) {
        alert('User not found');
        return;
      }
      
      users[targetUsername].rank = newRank;
      saveUsers(users);
      
      // Update current user if they were the one changed
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.username === targetUsername) {
        currentUser.rank = newRank;
        saveCurrentUser(currentUser);
        await updateUserUI(currentUser);
      } else {
        await renderUsersList();
        await updateTargetUserSelect();
        await updateRankUserSelect();
      }
      
      alert('Rank updated to ' + newRank + ' for ' + targetUsername + '!');
    });
  }
}

// Update rank user select
async function updateRankUserSelect() {
  const users = await getUsers();
  const select = document.getElementById('rank-user-select');
  if (!select) return;
  
  select.innerHTML = '';
  
  Object.values(users).forEach(user => {
    const option = document.createElement('option');
    option.value = user.username;
    option.textContent = user.username + ' (' + user.rank + ')';
    select.appendChild(option);
  });
}

// Initialize App
async function initApp() {
  initEventListeners();
  const currentUser = getCurrentUser();
  
  if (currentUser) {
    await updateUserUI(currentUser);
    showMain();
    checkExistingCountdown();
  } else {
    showAuth();
  }
  
  // Kullanıcı listesini önceden yükle
  await getUsers();
}

// Start everything
initApp();

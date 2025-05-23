// Tournament data
const tournaments = [
    {
        id: 1,
        name: "Weekend Warrior",
        date: "2025-05-25",
        entryFee: 50,
        prize: 500,
        description: "Solo Battle Royale tournament with 100 players. Last man standing wins!",
        mode: "Solo",
        participants: 100,
        slots: ["10:00 AM", "2:00 PM", "6:00 PM"]
    },
    {
        id: 2,
        name: "Squad Showdown",
        date: "2025-05-26",
        entryFee: 200,
        prize: 2000,
        description: "4-player squad tournament. Teamwork and strategy required.",
        mode: "Squad",
        participants: 25,
        slots: ["11:00 AM", "3:00 PM", "7:00 PM"]
    },
    {
        id: 3,
        name: "Duo Destruction",
        date: "2025-05-27",
        entryFee: 100,
        prize: 1000,
        description: "Partner up and dominate the battlefield in this intense duo tournament.",
        mode: "Duo",
        participants: 50,
        slots: ["12:00 PM", "4:00 PM", "8:00 PM"]
    },
    {
        id: 4,
        name: "Friday Night Fights",
        date: "2025-05-30",
        entryFee: 75,
        prize: 750,
        description: "Weekly tournament every Friday. Build your reputation!",
        mode: "Solo",
        participants: 80,
        slots: ["6:00 PM", "8:00 PM", "10:00 PM"]
    },
    {
        id: 5,
        name: "Championship Arena",
        date: "2025-06-01",
        entryFee: 300,
        prize: 5000,
        description: "The ultimate Free Fire tournament. Only the best survive.",
        mode: "Squad",
        participants: 20,
        slots: ["1:00 PM", "5:00 PM"]
    },
    {
        id: 6,
        name: "Rookie Rush",
        date: "2025-06-02",
        entryFee: 25,
        prize: 250,
        description: "Perfect for beginners. Learn and earn in this friendly competition.",
        mode: "Solo",
        participants: 120,
        slots: ["9:00 AM", "1:00 PM", "5:00 PM", "9:00 PM"]
    }
];

let filteredTournaments = [...tournaments];
let currentTournament = null;
let playerProfile = null;

// DOM Elements
const tournamentList = document.getElementById('tournament-list');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const paymentModal = document.getElementById('payment-modal');
const profileModal = document.getElementById('profile-modal');
const closeModal = document.getElementById('close-modal');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const themeSwitch = document.getElementById('theme-switch');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPlayerProfile();
    loadTheme();
    loadAdminSettings(); // Load admin settings from localStorage
    checkFirstVisit();
    renderTournaments();
    startCountdowns();
    setupEventListeners();
    setupNavigation();
});

// LocalStorage Player Profile Management
function loadPlayerProfile() {
    const stored = localStorage.getItem('ffArenaPlayer');
    if (stored) {
        playerProfile = JSON.parse(stored);
        displayWelcomeMessage();
    }
}

function savePlayerProfile(name, uid) {
    playerProfile = {
        name: name,
        uid: uid,
        joinDate: new Date().toISOString()
    };
    localStorage.setItem('ffArenaPlayer', JSON.stringify(playerProfile));
    displayWelcomeMessage();
}

function displayWelcomeMessage() {
    const welcomeEl = document.getElementById('user-welcome');
    const messageEl = document.getElementById('welcome-message');
    if (welcomeEl && messageEl && playerProfile) {
        messageEl.textContent = `Welcome back, ${playerProfile.name}!`;
        welcomeEl.classList.remove('hidden');
    }
}

function checkFirstVisit() {
    if (!playerProfile && profileModal) {
        // Show profile setup modal for first-time users
        setTimeout(() => {
            profileModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }, 1000);
    }
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('ffArenaTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSwitch) {
        themeSwitch.checked = savedTheme === 'light';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ffArenaTheme', newTheme);
}

// Admin Panel Management
const ADMIN_PASSWORD = "Admin123!"; // Hard-coded admin password
let currentUpiId = "tournament@paytm"; // Default UPI ID
let selectedTournamentId = null; // Currently selected tournament for fee editing

/**
 * Load admin settings from localStorage on page load
 * Reads stored tournament fees and UPI ID, updates UI accordingly
 */
function loadAdminSettings() {
    // Load individual tournament fees from localStorage
    tournaments.forEach(tournament => {
        const storedFee = localStorage.getItem(`tournament_${tournament.id}_fee`);
        if (storedFee) {
            tournament.entryFee = parseInt(storedFee);
        }
    });
    
    // Load UPI ID from localStorage or use default
    const storedUpi = localStorage.getItem("upiID");
    if (storedUpi) {
        currentUpiId = storedUpi;
    }
    
    // Update UI elements with current settings
    updateAdminSettingsDisplay();
    updatePaymentUI();
}

/**
 * Update the admin panel display with current settings
 */
function updateAdminSettingsDisplay() {
    // Populate tournament dropdown
    populateTournamentDropdown();
    
    // Update UPI display
    const currentUpiEl = document.getElementById('current-upi');
    if (currentUpiEl) {
        currentUpiEl.textContent = currentUpiId;
    }
}

/**
 * Populate the tournament dropdown in admin panel
 */
function populateTournamentDropdown() {
    const tournamentSelect = document.getElementById('tournament-select');
    if (!tournamentSelect) return;
    
    // Clear existing options except the first one
    tournamentSelect.innerHTML = '<option value="">Select Tournament</option>';
    
    // Add tournament options
    tournaments.forEach(tournament => {
        const option = document.createElement('option');
        option.value = tournament.id;
        option.textContent = `${tournament.name} (Current: ₹${tournament.entryFee})`;
        tournamentSelect.appendChild(option);
    });
}

/**
 * Handle tournament selection change in admin panel
 */
function handleTournamentSelection() {
    const tournamentSelect = document.getElementById('tournament-select');
    const selectedTournamentFeeEl = document.getElementById('selected-tournament-fee');
    
    if (!tournamentSelect || !selectedTournamentFeeEl) return;
    
    selectedTournamentId = tournamentSelect.value ? parseInt(tournamentSelect.value) : null;
    
    if (selectedTournamentId) {
        const tournament = tournaments.find(t => t.id === selectedTournamentId);
        if (tournament) {
            selectedTournamentFeeEl.textContent = `₹${tournament.entryFee}`;
        }
    } else {
        selectedTournamentFeeEl.textContent = "Select a tournament";
    }
}

/**
 * Update payment UI throughout the application with new settings
 */
function updatePaymentUI() {
    // Update payment modal if open
    const modalFee = document.getElementById('modal-fee');
    if (modalFee && currentTournament) {
        modalFee.textContent = `Entry Fee: ₹${currentTournament.entryFee}`;
    }
    
    // Update UPI ID in payment form
    const upiIdInput = document.getElementById('upi-id');
    if (upiIdInput) {
        upiIdInput.value = currentUpiId;
    }
}

/**
 * Handle admin button click - prompt for password and show panel
 */
function handleAdminAccess() {
    const enteredPassword = prompt("Enter admin password:");
    
    if (enteredPassword === ADMIN_PASSWORD) {
        // Access granted - show admin panel
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('hidden');
            adminPanel.classList.add('visible');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
        
        // Update the panel with current settings
        updateAdminSettingsDisplay();
    } else if (enteredPassword !== null) {
        // Access denied (only if user didn't cancel)
        alert("Access denied. Incorrect password.");
    }
}

/**
 * Close the admin panel
 */
function closeAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.remove('visible');
        adminPanel.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

/**
 * Save admin settings to localStorage and update UI
 */
function saveAdminSettings() {
    const adminFeeInput = document.getElementById('admin-fee');
    const adminUpiInput = document.getElementById('admin-upi');
    
    let newFee = null;
    let newUpi = null;
    let hasChanges = false;
    
    // Validate and process tournament fee
    if (adminFeeInput && adminFeeInput.value.trim()) {
        if (!selectedTournamentId) {
            alert("Please select a tournament first");
            return;
        }
        
        const feeValue = parseInt(adminFeeInput.value);
        if (feeValue && feeValue > 0) {
            newFee = feeValue;
            hasChanges = true;
        } else {
            alert("Please enter a valid entry fee (must be greater than 0)");
            return;
        }
    }
    
    // Validate and process UPI ID
    if (adminUpiInput && adminUpiInput.value.trim()) {
        const upiValue = adminUpiInput.value.trim();
        if (upiValue.length > 0) {
            newUpi = upiValue;
            hasChanges = true;
        } else {
            alert("Please enter a valid UPI ID");
            return;
        }
    }
    
    if (!hasChanges) {
        alert("Please enter at least one setting to update");
        return;
    }
    
    // Save to localStorage and update current values
    if (newFee && selectedTournamentId) {
        // Save individual tournament fee
        localStorage.setItem(`tournament_${selectedTournamentId}_fee`, newFee.toString());
        
        // Update tournament data
        const tournament = tournaments.find(t => t.id === selectedTournamentId);
        if (tournament) {
            tournament.entryFee = newFee;
        }
        
        // Re-render tournaments with updated fees
        renderTournaments();
    }
    
    if (newUpi) {
        localStorage.setItem("upiID", newUpi);
        currentUpiId = newUpi;
    }
    
    // Update UI elements
    updateAdminSettingsDisplay();
    updatePaymentUI();
    
    // Clear input fields
    if (adminFeeInput) adminFeeInput.value = '';
    if (adminUpiInput) adminUpiInput.value = '';
    
    // Reset tournament selection
    const tournamentSelect = document.getElementById('tournament-select');
    if (tournamentSelect) tournamentSelect.value = '';
    selectedTournamentId = null;
    const selectedTournamentFeeEl = document.getElementById('selected-tournament-fee');
    if (selectedTournamentFeeEl) selectedTournamentFeeEl.textContent = "Select a tournament";
    
    // Show success toast
    const updatedItems = [];
    if (newFee) updatedItems.push("tournament fee");
    if (newUpi) updatedItems.push("UPI ID");
    showAdminToast(`Updated ${updatedItems.join(" and ")} successfully!`);
    
    // Auto-close panel after 2 seconds
    setTimeout(() => {
        closeAdminPanel();
    }, 2000);
}

/**
 * Show admin confirmation toast with morph-style animation
 */
function showAdminToast(message) {
    const adminToast = document.getElementById('admin-toast');
    const adminToastMessage = document.getElementById('admin-toast-message');
    
    if (adminToast && adminToastMessage) {
        adminToastMessage.textContent = message;
        adminToast.classList.add('show');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            hideAdminToast();
        }, 3000);
    }
}

/**
 * Hide admin toast
 */
function hideAdminToast() {
    const adminToast = document.getElementById('admin-toast');
    if (adminToast) {
        adminToast.classList.remove('show');
    }
}

// Enhanced Tournament Rendering
function renderTournaments() {
    if (filteredTournaments.length === 0) {
        if (tournamentList) {
            tournamentList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>No tournaments found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
        }
        return;
    }

    if (tournamentList) {
        tournamentList.innerHTML = '';
        filteredTournaments.forEach((tournament, index) => {
            const card = document.createElement('div');
            card.className = 'tournament-card';
            
            const timeRemaining = getTimeRemaining(tournament.date);
            const isExpired = timeRemaining <= 0;
            
            // Add staggered animation delay
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <h3>${tournament.name}</h3>
                <p>${tournament.description}</p>
                <p><strong>Mode:</strong> ${tournament.mode}</p>
                <p><strong>Date:</strong> ${formatDate(tournament.date)}</p>
                <p><strong>Participants:</strong> ${tournament.participants}</p>
                <p class="entry-fee"><strong>Entry Fee:</strong> ₹${tournament.entryFee}</p>
                <p class="prize"><strong>Prize Pool:</strong> ₹${tournament.prize}</p>
                <button class="join-btn ${isExpired ? 'disabled' : ''}" data-id="${tournament.id}" ${isExpired ? 'disabled' : ''}>
                    <i class="fas fa-trophy"></i>
                    ${isExpired ? 'Tournament Ended' : 'Join Tournament'}
                </button>
                <div class="countdown" data-date="${tournament.date}"></div>
            `;
            tournamentList.appendChild(card);
        });

        // Update countdowns after rendering
        updateCountdowns();
    }
}

// Enhanced payment modal with tournament type and time slots
function openPaymentModal(tournament) {
    currentTournament = tournament;
    
    if (!playerProfile) {
        showToast('Please set up your profile first!', 'error');
        if (profileModal) {
            profileModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        return;
    }
    
    document.getElementById('modal-title').textContent = `Join ${tournament.name}`;
    document.getElementById('modal-fee').textContent = `Entry Fee: ₹${tournament.entryFee}`;
    
    // Pre-fill player information
    document.getElementById('player-name').value = playerProfile.name;
    
    // Add tournament type and time slot selection
    addTournamentForm(tournament);
    
    // Reset form state
    document.getElementById('upi-id').value = 'tournament@paytm';
    document.getElementById('upi-radio').checked = true;
    
    togglePaymentMethod();
    paymentModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function addTournamentForm(tournament) {
    const modalBody = document.querySelector('#payment-modal .modal-body');
    
    // Remove existing tournament form if any
    const existingForm = document.getElementById('tournament-form');
    if (existingForm) {
        existingForm.remove();
    }
    
    // Create new tournament form
    const tournamentForm = document.createElement('div');
    tournamentForm.id = 'tournament-form';
    tournamentForm.innerHTML = `
        <div class="form-group">
            <input type="text" id="tournament-type" value="${tournament.mode}" readonly>
            <label for="tournament-type">Tournament Type</label>
        </div>
        
        <div class="form-group">
            <select id="time-slot" required>
                <option value="">Choose a time slot</option>
                ${tournament.slots.map(slot => `<option value="${slot}">${slot}</option>`).join('')}
            </select>
            <label for="time-slot">Select Time Slot</label>
        </div>
    `;
    
    // Insert after player name field
    const playerNameGroup = modalBody.querySelector('.form-group');
    playerNameGroup.after(tournamentForm);
}

// Enhanced payment processing
function processPayment() {
    const playerName = document.getElementById('player-name').value.trim();
    const tournamentType = document.getElementById('tournament-type').value;
    const timeSlot = document.getElementById('time-slot').value;
    
    if (!playerName) {
        showToast('Please enter your player name', 'error');
        return;
    }
    
    if (!timeSlot) {
        showToast('Please select a time slot', 'error');
        return;
    }

    const payBtn = document.getElementById('pay-btn');
    
    // Disable pay button and show loading
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
    
    // Simulate payment processing
    setTimeout(() => {
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-check"></i> Payment Successful!';
        payBtn.style.background = 'var(--success-color)';
        
        showToast(`Successfully registered for ${currentTournament.name}! Tournament details sent to your profile.`, 'success');
        
        // Close modal after successful payment
        setTimeout(() => {
            closePaymentModal();
        }, 2000);
        
        // Reset button after delay
        setTimeout(() => {
            payBtn.innerHTML = '<i class="fas fa-credit-card"></i> Process Payment';
            payBtn.style.background = '';
        }, 3000);
    }, 2500);
}

// Event Listeners Setup
function setupEventListeners() {
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (sortSelect) sortSelect.addEventListener('change', handleSort);
    
    // Theme toggle
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
    }
    
    // Admin panel event listeners
    const adminBtn = document.getElementById('admin-btn');
    const closeAdminBtn = document.getElementById('close-admin-panel');
    const saveSettingsBtn = document.getElementById('save-settings');
    const adminPanel = document.getElementById('admin-panel');
    
    // Admin button click - trigger password prompt and panel toggle
    if (adminBtn) {
        adminBtn.addEventListener('click', handleAdminAccess);
    }
    
    // Close admin panel button
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', closeAdminPanel);
    }
    
    // Save settings button
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveAdminSettings);
    }
    
    // Tournament selection dropdown
    const tournamentSelect = document.getElementById('tournament-select');
    if (tournamentSelect) {
        tournamentSelect.addEventListener('change', handleTournamentSelection);
    }
    
    // Close panel when clicking outside it
    if (adminPanel) {
        document.addEventListener('click', function(e) {
            if (e.target === adminPanel) {
                closeAdminPanel();
            }
        });
    }
    
    // Close panel on Escape key press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && adminPanel && adminPanel.classList.contains('visible')) {
            closeAdminPanel();
        }
    });
    
    // Profile modal events
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            const name = document.getElementById('profile-name').value.trim();
            const uid = document.getElementById('profile-uid').value.trim();
            
            if (!name || !uid) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            savePlayerProfile(name, uid);
            profileModal.classList.remove('open');
            document.body.style.overflow = 'auto';
            showToast(`Welcome to FF Arena, ${name}!`, 'success');
        });
    }
    
    // Tournament card click events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('join-btn') || e.target.closest('.join-btn')) {
            const btn = e.target.classList.contains('join-btn') ? e.target : e.target.closest('.join-btn');
            if (btn.disabled) return;
            
            const tournamentId = parseInt(btn.dataset.id);
            const tournament = tournaments.find(t => t.id === tournamentId);
            openPaymentModal(tournament);
        }
    });

    // Modal events
    if (closeModal) closeModal.addEventListener('click', closePaymentModal);
    document.addEventListener('click', function(e) {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    // Payment method toggle
    const upiRadio = document.getElementById('upi-radio');
    const qrRadio = document.getElementById('qr-radio');
    if (upiRadio) upiRadio.addEventListener('change', togglePaymentMethod);
    if (qrRadio) qrRadio.addEventListener('change', togglePaymentMethod);

    // Payment processing
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) payBtn.addEventListener('click', processPayment);

    // Toast close
    const toastClose = document.getElementById('toast-close');
    if (toastClose) toastClose.addEventListener('click', hideToast);
}

// Search functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredTournaments = [...tournaments];
    } else {
        filteredTournaments = tournaments.filter(tournament =>
            tournament.name.toLowerCase().includes(searchTerm) ||
            tournament.description.toLowerCase().includes(searchTerm) ||
            tournament.mode.toLowerCase().includes(searchTerm)
        );
    }
    
    renderTournaments();
}

// Sorting functionality
function handleSort() {
    const sortBy = sortSelect.value;
    
    filteredTournaments.sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(a.date) - new Date(b.date);
            case 'fee':
                return a.entryFee - b.entryFee;
            case 'prize':
                return b.prize - a.prize;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
    
    renderTournaments();
}

// Navigation setup
function setupNavigation() {
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'hsla(var(--background-darker), 0.98)';
            } else {
                navbar.style.background = 'hsla(var(--background-darker), 0.95)';
            }
        }
    });
}

// Utility functions
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

function closePaymentModal() {
    paymentModal.classList.remove('open');
    document.body.style.overflow = 'auto';
    currentTournament = null;
    
    // Remove tournament form
    const tournamentForm = document.getElementById('tournament-form');
    if (tournamentForm) {
        tournamentForm.remove();
    }
}

function togglePaymentMethod() {
    const upiSection = document.getElementById('upi-section');
    const qrSection = document.getElementById('qr-section');
    const upiRadio = document.getElementById('upi-radio');
    
    if (upiSection && qrSection && upiRadio) {
        if (upiRadio.checked) {
            upiSection.classList.remove('hidden');
            qrSection.classList.add('hidden');
        } else {
            upiSection.classList.add('hidden');
            qrSection.classList.remove('hidden');
        }
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Set toast color based on type
        if (type === 'error') {
            toast.style.background = 'var(--error-color)';
        } else if (type === 'warning') {
            toast.style.background = 'var(--warning-color)';
        } else {
            toast.style.background = 'var(--success-color)';
        }
        
        toast.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideToast();
        }, 5000);
    }
}

function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

// Enhanced countdown timer functionality
function startCountdowns() {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
}

function updateCountdowns() {
    const countdownElements = document.querySelectorAll('.countdown');
    
    countdownElements.forEach(element => {
        const targetDate = new Date(element.dataset.date);
        const now = new Date();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            element.innerHTML = `
                <i class="fas fa-clock"></i>
                ${days}d ${hours}h ${minutes}m ${seconds}s
            `;
            element.style.color = 'var(--accent-color)';
        } else {
            element.innerHTML = '<i class="fas fa-flag"></i> Tournament Started';
            element.style.color = 'var(--error-color)';
            
            // Disable join button for expired tournaments
            const card = element.closest('.tournament-card');
            if (card) {
                const joinBtn = card.querySelector('.join-btn');
                if (joinBtn) {
                    joinBtn.disabled = true;
                    joinBtn.classList.add('disabled');
                    joinBtn.innerHTML = '<i class="fas fa-lock"></i> Tournament Ended';
                }
            }
        }
    });
}

function getTimeRemaining(dateString) {
    const targetDate = new Date(dateString);
    const now = new Date();
    return targetDate - now;
}

// Handle escape key to close modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (paymentModal && paymentModal.classList.contains('open')) {
            closePaymentModal();
        }
        if (profileModal && profileModal.classList.contains('open') && playerProfile) {
            profileModal.classList.remove('open');
            document.body.style.overflow = 'auto';
        }
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Focus accessibility with morph theme styling
document.addEventListener('DOMContentLoaded', function() {
    // Add focus styles for accessibility
    const style = document.createElement('style');
    style.textContent = `
        *:focus {
            outline: 3px solid var(--primary-color);
            outline-offset: 2px;
            border-radius: var(--morph-radius);
        }
        
        button:focus,
        input:focus,
        select:focus {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
});

// Enhanced smooth page transitions
document.addEventListener('DOMContentLoaded', function() {
    // Stagger section animations on page load
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 300 + (index * 200));
    });
});
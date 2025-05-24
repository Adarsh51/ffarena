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
console.log('Initial tournamentList element:', tournamentList);

const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const paymentModal = document.getElementById('payment-modal');
const profileModal = document.getElementById('profile-modal');
const closeModal = document.getElementById('close-modal');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const themeSwitch = document.getElementById('theme-switch');

// Admin Panel Player Registration Management
const playerRegistrationsListEl = document.getElementById('player-registrations-list');
const adminPlayerSearchInput = document.getElementById('admin-player-search');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired, initializing app'); // Log init start
    loadPlayerProfile();
    loadTheme();
    loadAdminSettings(); // Load admin settings from localStorage
    checkFirstVisit();
    renderTournaments();
    startCountdowns();
    setupNavigation();
    setupEventListeners();
    setupAdminPanelListeners();
    console.log('App initialization complete'); // Log init end
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
let currentUpiId = "brokeuglykid@axl"; // Default UPI ID
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

// Format date to a user-friendly string
function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Enhanced Tournament Rendering
function renderTournaments() {
    console.log('renderTournaments called');
    console.log('filteredTournaments:', filteredTournaments);
    console.log('tournamentList element:', tournamentList);

    if (filteredTournaments.length === 0) {
        console.log('No tournaments to display');
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
        console.log('Rendering tournament cards');
        tournamentList.innerHTML = '';
        filteredTournaments.forEach((tournament, index) => {
            console.log('Rendering tournament:', tournament.name);
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
            console.log('Tournament card added:', tournament.name);
        });

        // Update countdowns after rendering
        updateCountdowns();
        console.log('Tournament rendering complete');
    } else {
        console.error('tournamentList element not found!');
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
    
    // Pre-fill player information if profile exists
    if(playerProfile) {
        const playerNameInput = document.getElementById('player-name');
        if(playerNameInput) {
            playerNameInput.value = playerProfile.name;
        }
         // Pre-fill UID and Email if they were saved in the profile (optional, you might not have added this yet)
         // const playerUIDInput = document.getElementById('player-uid');
         // if(playerUIDInput && playerProfile.uid) playerUIDInput.value = playerProfile.uid;
         // const playerEmailInput = document.getElementById('player-email');
         // if(playerEmailInput && playerProfile.email) playerEmailInput.value = playerProfile.email;
    }

    // The form fields (name, uid, phone, email, time slot) are now part of the static HTML.
    // We no longer need to dynamically add them.
    // remove the call to addTournamentForm(tournament);

    // Reset QR radio button and hide QR section
    const qrRadio = document.getElementById('qr-radio');
    const qrSection = document.getElementById('qr-section');
    if(qrRadio) qrRadio.checked = false;
    if(qrSection) qrSection.classList.add('hidden');

    paymentModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Populate time slot options dynamically based on the selected tournament
    const timeSlotSelect = document.getElementById('time-slot');
    if (timeSlotSelect && tournament && tournament.slots) {
        // Clear existing options except the first one (Choose a time slot)
        timeSlotSelect.innerHTML = '<option value="">Choose a time slot</option>';
        tournament.slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            timeSlotSelect.appendChild(option);
        });
    }
}

// Initialize EmailJS
(function() {
    emailjs.init("X7xFBqM3m8p74ixSl"); // Replaced with your EmailJS public key
})();

// Show instructions to the user to complete payment
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

function toggleQRCode() {
    const qrSection = document.getElementById('qr-section');
    const qrRadio = document.getElementById('qr-radio');
    
    if (qrSection && qrRadio) {
        if (qrRadio.checked) {
            qrSection.classList.remove('hidden');
        } else {
            qrSection.classList.add('hidden');
        }
    }
}

// Update the displayRegistrations function to revert to simple layout with always-enabled confirmation button
function displayRegistrations(registrationsToDisplay) {
    if (!playerRegistrationsListEl) return;

    playerRegistrationsListEl.innerHTML = ''; // Clear current list

    if (!registrationsToDisplay || registrationsToDisplay.length === 0) {
        playerRegistrationsListEl.innerHTML = '<p style="text-align: center; color: #666;">No registrations found.</p>';
        return;
    }

    registrationsToDisplay.forEach(registration => {
        // Removed console.log for paymentVerified status
        const registrationEntry = document.createElement('div');
        registrationEntry.classList.add('registration-entry');

        // Removed tick mark logic
        // const verifiedTickHTML = registration.paymentVerified ? '<span class="verified-tick"><i class="fas fa-check-circle"></i></span>' : '';

        registrationEntry.innerHTML = `
            <div class="registration-details">
                <p><strong>Name:</strong> ${registration.name}</p>
                <p><strong>UID:</strong> ${registration.uid}</p>
                <p><strong>Email:</strong> ${registration.email}</p>
                <p><strong>Tournament:</strong> ${registration.tournamentName}</p>
                <p><strong>Time Slot:</strong> ${registration.timeSlot}</p>
            </div>
            <div class="admin-actions">
                <button class="send-confirm-email" data-uid="${registration.uid}">
                    Send Confirmation Email
                </button>
            </div>
        `;
        playerRegistrationsListEl.appendChild(registrationEntry);
    });

    // Add event listeners for the confirmation email buttons
    document.querySelectorAll('.send-confirm-email').forEach(button => {
        button.addEventListener('click', function() {
            const uid = this.dataset.uid;
            sendPaymentConfirmationEmail(uid);
        });
    });
}

// Function to load registrations from localStorage and display them
function loadAndDisplayRegistrations() {
    const registrations = JSON.parse(localStorage.getItem('tournamentRegistrations')) || [];
    displayRegistrations(registrations);
}

// Handle player search input
function handlePlayerSearch() {
    const searchTerm = adminPlayerSearchInput.value.toLowerCase().trim();
    const allRegistrations = JSON.parse(localStorage.getItem('tournamentRegistrations')) || [];

    const filtered = allRegistrations.filter(reg =>
        reg.name.toLowerCase().includes(searchTerm) ||
        reg.uid.toLowerCase().includes(searchTerm)
    );

    displayRegistrations(filtered);
}

// Update the sendPaymentConfirmationEmail function to directly send email and update status
function sendPaymentConfirmationEmail(playerUID) {
    const allRegistrations = JSON.parse(localStorage.getItem('tournamentRegistrations')) || [];
    const registration = allRegistrations.find(reg => reg.uid === playerUID);

    if (!registration) {
        console.error('Registration data not found for UID:', playerUID);
        showToast('Error: Could not find registration data for this player.', 'error');
        return;
    }

    if (!registration.email) {
        console.error('Email address is missing for player UID:', playerUID);
        showToast('Error: Player email address is missing. Cannot send confirmation.', 'error');
        return;
    }

    // Removed console.log for paymentVerified status before send attempt

    const templateParams = {
        to_email: registration.email,
        from_name: 'FF Arena',
        player_name: registration.name,
        player_uid: registration.uid,
        player_phone: registration.phone,
        player_email: registration.email,
        time_slot: registration.timeSlot,
        tournament_name: registration.tournamentName,
        entry_fee: registration.entryFee,
        registration_date: registration.registrationDate,
        confirmation_date: new Date().toLocaleString(),
        tournament_type: registration.tournamentType
    };

    emailjs.send('service_j5u8d9n', 'template_98546qk', templateParams)
        .then(function(response) {
            console.log('PAYMENT CONFIRMATION EMAIL SUCCESS!', response.status, response.text);
            showToast(`Payment confirmation email sent to ${registration.name}.`, 'success');

            // Update registration status to confirmed and set paymentVerified internally
            registration.status = 'confirmed';
            registration.paymentVerified = true; // Keep this flag internally if needed

            // Removed console.log for paymentVerified status after update

            // Simply save and refresh display - button will not show 'Email Sent'
            localStorage.setItem('tournamentRegistrations', JSON.stringify(allRegistrations));
            loadAndDisplayRegistrations(); // Refresh the display

        }, function(error) {
            console.log('PAYMENT CONFIRMATION EMAIL FAILED...', error);
            showToast(`Failed to send payment confirmation email to ${registration.name}. Error: ${error.text || error}`, 'error');
        });
}

// Add event listeners for admin panel after it's shown
function setupAdminPanelListeners() {
     // Search input listener
    if (adminPlayerSearchInput) {
        adminPlayerSearchInput.addEventListener('input', handlePlayerSearch);
    }

    // Load registrations when the admin panel is opened
    const adminBtn = document.getElementById('admin-btn');
    if(adminBtn) {
        // The event listener to load registrations is added separately below,
        // triggered after handleAdminAccess potentially shows the panel.
        // We also added a listener for the click to potentially call loadAndDisplayRegistrations
        // after the panel is visible in handleAdminAccess.
        // Let's ensure the load is called when the panel becomes visible.
    }
}

// Call setupAdminPanelListeners on DOMContentLoaded or after the admin panel is ready
document.addEventListener('DOMContentLoaded', setupAdminPanelListeners);

// Ensure registrations are loaded when admin panel is accessed
// This listener checks if the panel is visible before loading registrations.
const adminBtnForLoad = document.getElementById('admin-btn');
if (adminBtnForLoad) {
    adminBtnForLoad.addEventListener('click', () => {
        // Check if the admin panel is actually visible after password check
        const adminPanel = document.getElementById('admin-panel');
        // Use a small delay to allow the class 'visible' to be added if it's an async operation
        setTimeout(() => {
            if (adminPanel && adminPanel.classList.contains('visible')) {
                 console.log('Admin panel visible, loading registrations');
                 loadAndDisplayRegistrations();
            } else {
                 console.log('Admin panel not visible after click, skipping registration load');
            }
        }, 50);
    });
}

// Update the submitRegistration function to only store data and notify admin
function submitRegistration() {
    console.log('submitRegistration function called');

    // Get form elements and their values
    const playerNameInput = document.getElementById('player-name');
    const timeSlotSelect = document.getElementById('time-slot');
    const playerEmailInput = document.getElementById('player-email');
    const playerUIDInput = document.getElementById('player-uid');
    const playerPhoneInput = document.getElementById('player-phone');

    // Perform checks and get values only if elements are found
    const playerName = playerNameInput ? playerNameInput.value.trim() : '';
    const timeSlot = timeSlotSelect ? timeSlotSelect.value : '';
    const playerEmail = playerEmailInput ? playerEmailInput.value.trim() : '';
    const playerUID = playerUIDInput ? playerUIDInput.value.trim() : '';
    const playerPhone = playerPhoneInput ? playerPhoneInput.value.trim() : '';

    // Get tournament type from currentTournament
    const tournamentType = currentTournament ? currentTournament.mode : 'N/A';

    // Validation checks
    if (!playerName || !timeSlot || !playerEmail || !playerUID || !playerPhone) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Add UID and Phone validation
    if (playerUID && !/^\d{8,10}$/.test(playerUID)) {
        showToast('Please enter a valid UID (8-10 digits)', 'error');
        return;
    }

    if (playerPhone && !/^\d{10}$/.test(playerPhone)) {
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
    }

    // Store player data with pending payment status
    const playerData = {
        name: playerName,
        uid: playerUID,
        phone: playerPhone,
        email: playerEmail,
        timeSlot: timeSlot,
        tournamentName: currentTournament.name,
        entryFee: currentTournament.entryFee,
        registrationDate: new Date().toISOString(),
        status: 'pending_payment', // Changed to pending_payment
        tournamentType: tournamentType,
        paymentVerified: false // Added payment verification flag
    };

    let registrations = JSON.parse(localStorage.getItem('tournamentRegistrations')) || [];
    registrations.push(playerData);
    localStorage.setItem('tournamentRegistrations', JSON.stringify(registrations));

    // Send email notification only to admin
    const adminNotificationParams = {
        to_email: 'adarshyt093@gmail.com', // Admin email
        from_name: 'FF Arena',
        player_name: playerName,
        player_uid: playerUID,
        player_phone: playerPhone,
        player_email: playerEmail,
        time_slot: timeSlot,
        tournament_name: currentTournament.name,
        entry_fee: currentTournament.entryFee,
        registration_date: new Date().toLocaleString(),
        tournament_type: tournamentType
    };

    // Send email to admin
    emailjs.send('service_j5u8d9n', 'template_98546qk', adminNotificationParams)
        .then(function(response) {
            console.log('ADMIN NOTIFICATION EMAIL SUCCESS!', response.status, response.text);
        }, function(error) {
            console.log('ADMIN NOTIFICATION EMAIL FAILED...', error);
        });

    // Show success message to user
    showToast(`Registration submitted! Please complete your payment and contact admin for confirmation.`, 'info');

    // Close modal after toast has been visible for a bit
    setTimeout(() => {
        closePaymentModal();

        // Show WhatsApp link confirmation after modal closes
        const whatsappGroupLink = 'https://chat.whatsapp.com/GST0oEiJmUR1CDktUnRz55';
        showWhatsAppLinkConfirmation(whatsappGroupLink, 7000);
    }, 3000);
}

// Function to display WhatsApp group link after registration
function showWhatsAppLinkConfirmation(whatsappLink, duration = 7000) {
    const confirmationDiv = document.createElement('div');
    confirmationDiv.classList.add('registration-success-message');
    confirmationDiv.style.position = 'fixed';
    confirmationDiv.style.top = '50%';
    confirmationDiv.style.left = '50%';
    confirmationDiv.style.transform = 'translate(-50%, -50%)';
    confirmationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; // Darker background
    confirmationDiv.style.color = '#ffffff'; // White text
    confirmationDiv.style.padding = '30px';
    confirmationDiv.style.borderRadius = '15px';
    confirmationDiv.style.boxShadow = '0 5px 25px rgba(0,0,0,0.5)';
    confirmationDiv.style.zIndex = '1000';
    confirmationDiv.style.textAlign = 'center';
    confirmationDiv.style.opacity = '0';
    confirmationDiv.style.transition = 'opacity 0.5s ease-in-out';
    confirmationDiv.style.maxWidth = '90%';
    confirmationDiv.style.width = '400px'; // Fixed width
    confirmationDiv.style.border = '2px solid var(--accent-color)'; // Add border

    confirmationDiv.innerHTML = `
        <h3 style="color: #25D366; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-check-circle"></i> Registration Submitted!
        </h3>
        <p style="margin-bottom: 25px; font-size: 16px; line-height: 1.5;">
            Please complete your payment and contact admin for confirmation. 
            Join our WhatsApp group for updates and tournament information:
        </p>
        <a href="${whatsappLink}" target="_blank" 
           style="display: inline-block; 
                  background-color: #25D366; 
                  color: white; 
                  padding: 12px 25px; 
                  border-radius: 8px; 
                  text-decoration: none; 
                  font-weight: bold;
                  font-size: 16px;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);">
            <i class="fab fa-whatsapp"></i> Join WhatsApp Group
        </a>
        <button class="close-confirmation-message" 
                style="position: absolute; 
                       top: 15px; 
                       right: 15px; 
                       background: none; 
                       border: none; 
                       font-size: 24px; 
                       cursor: pointer; 
                       color: #ffffff;
                       opacity: 0.7;
                       transition: opacity 0.3s ease;">×</button>
    `;

    document.body.appendChild(confirmationDiv);

    // Fade in
    setTimeout(() => { confirmationDiv.style.opacity = '1'; }, 50);

    // Add close button functionality
    confirmationDiv.querySelector('.close-confirmation-message').addEventListener('click', () => {
        confirmationDiv.style.opacity = '0';
        setTimeout(() => { confirmationDiv.remove(); }, 500);
    });

    // Automatically fade out and remove after duration
    if (duration > 0) {
        setTimeout(() => {
            confirmationDiv.style.opacity = '0';
            setTimeout(() => { confirmationDiv.remove(); }, 500);
        }, duration);
    }
}

// Handle search input
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    filteredTournaments = tournaments.filter(tournament => 
        tournament.name.toLowerCase().includes(searchTerm) ||
        tournament.description.toLowerCase().includes(searchTerm) ||
        tournament.mode.toLowerCase().includes(searchTerm)
    );
    renderTournaments();
}

// Handle sort selection
function handleSort() {
    const sortValue = sortSelect.value;
    switch(sortValue) {
        case 'date-asc':
            filteredTournaments.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            filteredTournaments.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'fee-asc':
            filteredTournaments.sort((a, b) => a.entryFee - b.entryFee);
            break;
        case 'fee-desc':
            filteredTournaments.sort((a, b) => b.entryFee - a.entryFee);
            break;
        case 'prize-asc':
            filteredTournaments.sort((a, b) => a.prize - b.prize);
            break;
        case 'prize-desc':
            filteredTournaments.sort((a, b) => b.prize - a.prize);
            break;
        default:
            // Reset to original order
            filteredTournaments = [...tournaments];
    }
    renderTournaments();
}

// Setup navigation functionality
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Close payment modal
function closePaymentModal() {
    console.log('Closing payment modal');
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        paymentModal.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
}

// Event Listeners Setup
function setupEventListeners() {
    console.log('setupEventListeners called'); // Log function start

    // Ensure essential elements are found
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const paymentModal = document.getElementById('payment-modal');
    const profileModal = document.getElementById('profile-modal');
    const closeModal = document.getElementById('close-modal');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const themeSwitch = document.getElementById('theme-switch');
    const adminBtn = document.getElementById('admin-btn');
    const closeAdminBtn = document.getElementById('close-admin-panel');
    const saveSettingsBtn = document.getElementById('save-settings');
    const adminPanel = document.getElementById('admin-panel');
    const qrRadio = document.getElementById('qr-radio');
    const payBtn = document.getElementById('pay-btn');
    const toastClose = document.getElementById('toast-close');
    const saveProfileBtn = document.getElementById('save-profile-btn');

    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (sortSelect) sortSelect.addEventListener('change', handleSort);

    // Theme toggle
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
    }

    // Admin panel basic button listeners
    if (adminBtn) adminBtn.addEventListener('click', handleAdminAccess);
    if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdminPanel);
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveAdminSettings);

    // Modal close listeners
    if (closeModal) closeModal.addEventListener('click', closePaymentModal);
    document.addEventListener('click', function(e) {
        if (e.target === paymentModal) {
            console.log('Clicked outside payment modal, closing');
            closePaymentModal();
        }
        if (profileModal && profileModal.classList.contains('open') && playerProfile && e.target === profileModal) {
            console.log('Clicked outside profile modal, closing');
            profileModal.classList.remove('open');
            document.body.style.overflow = 'auto';
        }
    });

    // Profile modal save button listener
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
    const tournamentList = document.getElementById('tournament-list');
    if (tournamentList) {
        tournamentList.addEventListener('click', function(e) {
            console.log('Tournament list click detected', e.target);
            const joinBtn = e.target.closest('.join-btn');
            if (joinBtn) {
                console.log('Join button clicked');
                if (joinBtn.disabled) {
                    console.log('Button is disabled, not opening modal');
                    return;
                }

                const tournamentId = parseInt(joinBtn.dataset.id);
                console.log('Tournament ID:', tournamentId);
                const tournament = tournaments.find(t => t.id === tournamentId);

                if (tournament) {
                    console.log('Opening payment modal for tournament:', tournament.name);
                    openPaymentModal(tournament);
                } else {
                    console.log('Error: Tournament not found for ID:', tournamentId);
                }
            }
        });
    }

    // QR code radio button event listener
    if (qrRadio) {
        qrRadio.addEventListener('change', toggleQRCode);
    }

    // Registration Submission Button listener
    if (payBtn) {
        console.log('pay-btn element found, attaching submitRegistration listener');
        payBtn.addEventListener('click', submitRegistration);
        console.log('submitRegistration listener attached to pay-btn');
    } else {
        console.error('pay-btn element not found!');
    }

    // Toast close
    if (toastClose) toastClose.addEventListener('click', hideToast);

    console.log('setupEventListeners complete'); // Log function end
}
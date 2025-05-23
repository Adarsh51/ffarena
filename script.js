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
    checkFirstVisit();
    renderTournaments();
    startCountdowns();
    setupEventListeners();
    setupNavigation();
    initializePage();
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

// Receipts Management
function saveReceipt(receiptData) {
    const receipts = getStoredReceipts();
    receipts.push(receiptData);
    localStorage.setItem('ffArenaReceipts', JSON.stringify(receipts));
}

function getStoredReceipts() {
    const stored = localStorage.getItem('ffArenaReceipts');
    return stored ? JSON.parse(stored) : [];
}

// Initialize page-specific functionality
function initializePage() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('receipts.html')) {
        initializeReceiptsPage();
    }
}

function initializeReceiptsPage() {
    loadPlayerProfile();
    displayPlayerInfo();
    loadReceipts();
}

function displayPlayerInfo() {
    const playerInfoEl = document.getElementById('player-info');
    const nameEl = document.getElementById('player-display-name');
    const uidEl = document.getElementById('player-display-uid');
    
    if (playerProfile && playerInfoEl && nameEl && uidEl) {
        nameEl.textContent = playerProfile.name;
        uidEl.textContent = `UID: ${playerProfile.uid}`;
        playerInfoEl.classList.remove('hidden');
    }
}

function loadReceipts() {
    const receipts = getStoredReceipts();
    const noReceiptsEl = document.getElementById('no-receipts');
    const receiptsListEl = document.getElementById('receipts-list');
    
    if (!receiptsListEl) return;
    
    if (receipts.length === 0) {
        if (noReceiptsEl) noReceiptsEl.classList.remove('hidden');
        receiptsListEl.classList.add('hidden');
    } else {
        if (noReceiptsEl) noReceiptsEl.classList.add('hidden');
        receiptsListEl.classList.remove('hidden');
        renderReceipts(receipts);
    }
}

function renderReceipts(receipts) {
    const receiptsListEl = document.getElementById('receipts-list');
    if (!receiptsListEl) return;
    
    receiptsListEl.innerHTML = '';
    
    receipts.forEach(receipt => {
        const receiptCard = document.createElement('div');
        receiptCard.className = 'receipt-card';
        receiptCard.innerHTML = `
            <div class="receipt-header">
                <h3 class="receipt-title">${receipt.tournamentName}</h3>
                <span class="receipt-date">${new Date(receipt.date).toLocaleDateString()}</span>
            </div>
            <div class="receipt-details">
                <div class="receipt-detail">
                    <div class="receipt-detail-label">Receipt ID</div>
                    <div class="receipt-detail-value receipt-id">${receipt.receiptId}</div>
                </div>
                <div class="receipt-detail">
                    <div class="receipt-detail-label">Amount</div>
                    <div class="receipt-detail-value receipt-amount">₹${receipt.amount}</div>
                </div>
                <div class="receipt-detail">
                    <div class="receipt-detail-label">Mode</div>
                    <div class="receipt-detail-value">${receipt.mode}</div>
                </div>
                <div class="receipt-detail">
                    <div class="receipt-detail-label">Time Slot</div>
                    <div class="receipt-detail-value">${receipt.timeSlot}</div>
                </div>
            </div>
            <div class="receipt-actions">
                <button class="download-receipt-btn" onclick="downloadStoredReceipt('${receipt.receiptId}')">
                    <i class="fas fa-download"></i>
                    Download Again
                </button>
            </div>
        `;
        receiptsListEl.appendChild(receiptCard);
    });
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
        filteredTournaments.forEach(tournament => {
            const card = document.createElement('div');
            card.className = 'tournament-card';
            
            const timeRemaining = getTimeRemaining(tournament.date);
            const isExpired = timeRemaining <= 0;
            
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
    document.getElementById('download-btn').disabled = true;
    
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
            <label for="tournament-type">Tournament Type:</label>
            <input type="text" id="tournament-type" value="${tournament.mode}" readonly>
        </div>
        
        <div class="form-group">
            <label for="time-slot">Select Time Slot:</label>
            <select id="time-slot" required>
                <option value="">Choose a time slot</option>
                ${tournament.slots.map(slot => `<option value="${slot}">${slot}</option>`).join('')}
            </select>
        </div>
    `;
    
    // Insert after player name field
    const playerNameGroup = modalBody.querySelector('.form-group');
    playerNameGroup.after(tournamentForm);
}

// Enhanced payment processing with receipt generation
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
    const downloadBtn = document.getElementById('download-btn');
    
    // Disable pay button and show loading
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
    
    // Simulate payment processing
    setTimeout(() => {
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-check"></i> Payment Successful!';
        payBtn.style.background = 'var(--success-color)';
        
        downloadBtn.disabled = false;
        showToast('Payment successful! You can now download your receipt.', 'success');
        
        // Reset button after delay
        setTimeout(() => {
            payBtn.innerHTML = '<i class="fas fa-credit-card"></i> Process Payment';
            payBtn.style.background = '';
        }, 3000);
    }, 2500);
}

// Enhanced receipt generation and storage
function downloadReceipt() {
    if (!currentTournament || !playerProfile) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const playerName = document.getElementById('player-name').value;
    const tournamentType = document.getElementById('tournament-type').value;
    const timeSlot = document.getElementById('time-slot').value;
    const receiptId = generateReceiptId();
    const currentDate = new Date().toLocaleString();
    const paymentMethod = document.getElementById('upi-radio').checked ? 'UPI Payment' : 'QR Code Payment';
    
    // Generate and save receipt data
    const receiptData = {
        receiptId: receiptId,
        tournamentName: currentTournament.name,
        playerName: playerName,
        playerUID: playerProfile.uid,
        amount: currentTournament.entryFee,
        mode: tournamentType,
        timeSlot: timeSlot,
        date: currentDate,
        paymentMethod: paymentMethod,
        tournamentDate: currentTournament.date
    };
    
    // Save to localStorage
    saveReceipt(receiptData);
    
    // Generate PDF
    generatePDF(doc, receiptData);
    
    showToast('Receipt downloaded and saved successfully!', 'success');
}

function generatePDF(doc, receiptData) {
    // Set font
    doc.setFont('helvetica');
    
    // Header with logo area
    doc.setFontSize(22);
    doc.setTextColor(255, 87, 34);
    doc.text('FREE FIRE TOURNAMENT ARENA', 20, 25);
    
    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Tournament Registration Receipt', 20, 35);
    
    // Receipt header
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Receipt', 20, 55);
    
    // Receipt details in organized sections
    doc.setFontSize(11);
    
    // Receipt Info Section
    doc.setTextColor(255, 87, 34);
    doc.text('Receipt Information', 20, 75);
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt ID: ${receiptData.receiptId}`, 20, 85);
    doc.text(`Date & Time: ${receiptData.date}`, 20, 95);
    doc.text(`Payment Method: ${receiptData.paymentMethod}`, 20, 105);
    doc.text('Payment Status: SUCCESSFUL', 20, 115);
    
    // Player Info Section
    doc.setTextColor(255, 87, 34);
    doc.text('Player Information', 20, 135);
    doc.setTextColor(0, 0, 0);
    doc.text(`Player Name: ${receiptData.playerName}`, 20, 145);
    doc.text(`Free Fire UID: ${receiptData.playerUID}`, 20, 155);
    
    // Tournament Info Section
    doc.setTextColor(255, 87, 34);
    doc.text('Tournament Details', 20, 175);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tournament: ${receiptData.tournamentName}`, 20, 185);
    doc.text(`Tournament Date: ${formatDate(receiptData.tournamentDate)}`, 20, 195);
    doc.text(`Game Mode: ${receiptData.mode}`, 20, 205);
    doc.text(`Time Slot: ${receiptData.timeSlot}`, 20, 215);
    
    // Payment Info Section
    doc.setTextColor(255, 87, 34);
    doc.text('Payment Details', 20, 235);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Entry Fee: ₹${receiptData.amount}`, 20, 245);
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer generated receipt. Please keep it for your records.', 20, 270);
    doc.text('For support contact: support@ffarena.com | +91 9876543210', 20, 280);
    doc.text('Free Fire Tournament Arena - Your Gateway to Victory!', 20, 290);
    
    // Save the PDF
    doc.save(`FreeFire_Tournament_Receipt_${receiptData.receiptId}.pdf`);
}

function downloadStoredReceipt(receiptId) {
    const receipts = getStoredReceipts();
    const receipt = receipts.find(r => r.receiptId === receiptId);
    
    if (!receipt) {
        showToast('Receipt not found!', 'error');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    generatePDF(doc, receipt);
    showToast('Receipt downloaded successfully!', 'success');
}

// Event Listeners Setup
function setupEventListeners() {
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (sortSelect) sortSelect.addEventListener('change', handleSort);
    
    // Theme toggle
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
    }
    
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
    const downloadBtn = document.getElementById('download-btn');
    if (payBtn) payBtn.addEventListener('click', processPayment);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadReceipt);

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

function generateReceiptId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `FF${timestamp}${random}`.substr(-10);
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

// Add loading animation for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.complete) {
            img.style.opacity = '0';
            img.addEventListener('load', function() {
                this.style.transition = 'opacity 0.3s ease';
                this.style.opacity = '1';
            });
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe tournament cards for animation
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        document.querySelectorAll('.tournament-card, .step, .receipt-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }, 100);
});

// Auto-save form data (for better UX)
function autoSaveFormData() {
    const playerNameInput = document.getElementById('player-name');
    if (playerNameInput && playerProfile) {
        playerNameInput.value = playerProfile.name;
    }
}

// Initialize auto-save when payment modal opens
document.addEventListener('DOMContentLoaded', function() {
    const paymentModalObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.classList.contains('open')) {
                autoSaveFormData();
            }
        });
    });
    
    if (paymentModal) {
        paymentModalObserver.observe(paymentModal, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
});
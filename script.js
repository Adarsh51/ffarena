// Tournament data
const tournaments = [
    {
        id: 1,
        name: "Weekend Warrior",
        date: "2025-02-15",
        entryFee: 50,
        prize: 500,
        description: "Solo Battle Royale tournament with 100 players. Last man standing wins!",
        mode: "Solo",
        participants: 100
    },
    {
        id: 2,
        name: "Squad Showdown",
        date: "2025-02-22",
        entryFee: 200,
        prize: 2000,
        description: "4-player squad tournament. Teamwork and strategy required.",
        mode: "Squad",
        participants: 25
    },
    {
        id: 3,
        name: "Duo Destruction",
        date: "2025-02-28",
        entryFee: 100,
        prize: 1000,
        description: "Partner up and dominate the battlefield in this intense duo tournament.",
        mode: "Duo",
        participants: 50
    },
    {
        id: 4,
        name: "Friday Night Fights",
        date: "2025-03-07",
        entryFee: 75,
        prize: 750,
        description: "Weekly tournament every Friday. Build your reputation!",
        mode: "Solo",
        participants: 80
    },
    {
        id: 5,
        name: "Championship Arena",
        date: "2025-03-15",
        entryFee: 300,
        prize: 5000,
        description: "The ultimate Free Fire tournament. Only the best survive.",
        mode: "Squad",
        participants: 20
    },
    {
        id: 6,
        name: "Rookie Rush",
        date: "2025-03-20",
        entryFee: 25,
        prize: 250,
        description: "Perfect for beginners. Learn and earn in this friendly competition.",
        mode: "Solo",
        participants: 120
    }
];

let filteredTournaments = [...tournaments];
let currentTournament = null;

// DOM Elements
const tournamentList = document.getElementById('tournament-list');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const paymentModal = document.getElementById('payment-modal');
const closeModal = document.getElementById('close-modal');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    renderTournaments();
    startCountdowns();
    setupEventListeners();
    setupNavigation();
});

// Render tournaments
function renderTournaments() {
    if (filteredTournaments.length === 0) {
        tournamentList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No tournaments found</h3>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
        return;
    }

    tournamentList.innerHTML = '';
    filteredTournaments.forEach(tournament => {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        card.innerHTML = `
            <h3>${tournament.name}</h3>
            <p>${tournament.description}</p>
            <p><strong>Mode:</strong> ${tournament.mode}</p>
            <p><strong>Date:</strong> ${formatDate(tournament.date)}</p>
            <p><strong>Participants:</strong> ${tournament.participants}</p>
            <p class="entry-fee"><strong>Entry Fee:</strong> ₹${tournament.entryFee}</p>
            <p class="prize"><strong>Prize Pool:</strong> ₹${tournament.prize}</p>
            <button class="join-btn" data-id="${tournament.id}">
                <i class="fas fa-trophy"></i>
                Join Tournament
            </button>
            <div class="countdown" data-date="${tournament.date}"></div>
        `;
        tournamentList.appendChild(card);
    });

    // Update countdowns after rendering
    updateCountdowns();
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Search functionality
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    
    // Tournament card click events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('join-btn') || e.target.closest('.join-btn')) {
            const btn = e.target.classList.contains('join-btn') ? e.target : e.target.closest('.join-btn');
            const tournamentId = parseInt(btn.dataset.id);
            const tournament = tournaments.find(t => t.id === tournamentId);
            openPaymentModal(tournament);
        }
    });

    // Modal events
    closeModal.addEventListener('click', closePaymentModal);
    document.addEventListener('click', function(e) {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    // Payment method toggle
    document.getElementById('upi-radio').addEventListener('change', togglePaymentMethod);
    document.getElementById('qr-radio').addEventListener('change', togglePaymentMethod);

    // Payment processing
    document.getElementById('pay-btn').addEventListener('click', processPayment);
    document.getElementById('download-btn').addEventListener('click', downloadReceipt);

    // Toast close
    document.getElementById('toast-close').addEventListener('click', hideToast);
}

// Handle search
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

// Handle sorting
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

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'hsla(var(--background-darker), 0.98)';
        } else {
            navbar.style.background = 'hsla(var(--background-darker), 0.95)';
        }
    });
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// Payment modal functions
function openPaymentModal(tournament) {
    currentTournament = tournament;
    
    document.getElementById('modal-title').textContent = `Join ${tournament.name}`;
    document.getElementById('modal-fee').textContent = `Entry Fee: ₹${tournament.entryFee}`;
    
    // Reset form
    document.getElementById('player-name').value = '';
    document.getElementById('upi-id').value = 'tournament@paytm';
    document.getElementById('upi-radio').checked = true;
    document.getElementById('download-btn').disabled = true;
    
    togglePaymentMethod();
    paymentModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    paymentModal.classList.remove('open');
    document.body.style.overflow = 'auto';
    currentTournament = null;
}

function togglePaymentMethod() {
    const upiSection = document.getElementById('upi-section');
    const qrSection = document.getElementById('qr-section');
    const upiRadio = document.getElementById('upi-radio');
    
    if (upiRadio.checked) {
        upiSection.classList.remove('hidden');
        qrSection.classList.add('hidden');
    } else {
        upiSection.classList.add('hidden');
        qrSection.classList.remove('hidden');
    }
}

// Process payment simulation
function processPayment() {
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!playerName) {
        showToast('Please enter your player name', 'error');
        return;
    }

    const payBtn = document.getElementById('pay-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // Disable pay button and show loading
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Simulate payment processing
    setTimeout(() => {
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-check"></i> Payment Successful';
        payBtn.style.background = 'var(--success-color)';
        
        downloadBtn.disabled = false;
        showToast('Payment successful! You can now download your receipt.', 'success');
        
        // Reset button after delay
        setTimeout(() => {
            payBtn.innerHTML = '<i class="fas fa-credit-card"></i> Process Payment';
            payBtn.style.background = '';
        }, 3000);
    }, 2000);
}

// Download receipt using jsPDF
function downloadReceipt() {
    if (!currentTournament) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const playerName = document.getElementById('player-name').value;
    const receiptId = generateReceiptId();
    const currentDate = new Date().toLocaleString();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 87, 34);
    doc.text('FREE FIRE TOURNAMENT ARENA', 20, 30);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Receipt', 20, 50);
    
    // Receipt details
    doc.setFontSize(12);
    doc.text(`Receipt ID: ${receiptId}`, 20, 70);
    doc.text(`Date: ${currentDate}`, 20, 85);
    doc.text(`Player Name: ${playerName}`, 20, 100);
    doc.text(`Tournament: ${currentTournament.name}`, 20, 115);
    doc.text(`Entry Fee: ₹${currentTournament.entryFee}`, 20, 130);
    doc.text(`Tournament Date: ${formatDate(currentTournament.date)}`, 20, 145);
    doc.text(`Mode: ${currentTournament.mode}`, 20, 160);
    doc.text(`Prize Pool: ₹${currentTournament.prize}`, 20, 175);
    
    // Payment details
    const paymentMethod = document.getElementById('upi-radio').checked ? 'UPI Payment' : 'QR Code Payment';
    doc.text(`Payment Method: ${paymentMethod}`, 20, 195);
    doc.text('Payment Status: SUCCESSFUL', 20, 210);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer generated receipt.', 20, 250);
    doc.text('For any queries, contact: support@ffarena.com', 20, 265);
    
    // Save the PDF
    doc.save(`FreeFire_Tournament_Receipt_${receiptId}.pdf`);
    
    showToast('Receipt downloaded successfully!', 'success');
}

// Generate unique receipt ID
function generateReceiptId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `FF${timestamp}${random}`.substr(-10);
}

// Toast notification system
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
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

function hideToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('show');
}

// Countdown timer functionality
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
        } else {
            element.innerHTML = '<i class="fas fa-flag"></i> Tournament Started';
            element.style.color = 'var(--error-color)';
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

// Handle escape key to close modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && paymentModal.classList.contains('open')) {
        closePaymentModal();
    }
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
        document.querySelectorAll('.tournament-card, .step').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }, 100);
});

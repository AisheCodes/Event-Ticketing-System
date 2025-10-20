// Full app script with booking persistence and comprehensive functionality
// Loads after DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeader();
    initForms();
    initAnimations();
    initFooter();
    initMobileMenu();
    initSettingsPanel();
    initLoginSystem();
    initHoverEffects();
    initStatsAnimation();
    initBookingSystem();
});

/* ----------------------------- Theme ----------------------------- */
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeToggle) themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    if (themeToggle) themeToggle.addEventListener('click', (e) => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
        createRippleEffect(themeToggle, e);
        showNotification(`Switched to ${next} mode`);
    });
}

/* -------------------------- Header / Menu ------------------------ */
function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 100);
    });
}

function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (!mobileMenuBtn || !navLinks) return;
    mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        mobileMenuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.textContent = '☰';
        }
    });
}

/* --------------------------- Bookings --------------------------- */
// Save booking for current user (persist in localStorage)
function saveBookingForUser(booking) {
    const userId = getCurrentUserId();
    const all = JSON.parse(localStorage.getItem('userBookings') || '{}');
    if (!all[userId]) all[userId] = [];
    all[userId].push(Object.assign({ id: Date.now() }, booking));
    localStorage.setItem('userBookings', JSON.stringify(all));
}

function getUserBookings(userId) {
    const all = JSON.parse(localStorage.getItem('userBookings') || '{}');
    return all[userId] || [];
}

function getCurrentUserId() {
    // Use profile email as user id if available, otherwise 'guest'
    const emailEl = document.getElementById('profileEmail');
    if (emailEl && emailEl.textContent && emailEl.textContent.includes('@')) return emailEl.textContent.trim().toLowerCase();
    return 'guest';
}

function renderUserBookings() {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;
    const userId = getCurrentUserId();
    const list = getUserBookings(userId);
    let container = panel.querySelector('.bookings-list');
    if (!container) {
        container = document.createElement('div');
        container.className = 'bookings-list';
        const header = document.createElement('h3');
        header.textContent = 'Your Bookings';
        panel.appendChild(header);
        panel.appendChild(container);
    }
    container.innerHTML = '';
    if (list.length === 0) {
        container.innerHTML = '<p style="opacity:.8">No bookings yet.</p>';
        return;
    }
    list.slice().reverse().forEach(b => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        item.style.padding = '0.75rem';
        item.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        item.innerHTML = `<strong>${escapeHtml(b.event || b.title || 'Event')}</strong><div style="opacity:.85; font-size:.95rem">${escapeHtml(b.name || b.email || '')} — ${escapeHtml(b.date || b.time || '')}</div>`;
        container.appendChild(item);
    });
}

/* --------------------------- Settings --------------------------- */
function initSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    const overlay = document.getElementById('settingsOverlay');
    const usernameForm = document.getElementById('usernameForm');
    if (!panel) return;
    // show / hide logic is expected to be wired from HTML (openSettings/closeSettings)
    renderUserBookings();
    if (usernameForm) {
        usernameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            if (username && currentUser) {
                // Update current user
                currentUser.name = username;
                currentUser.username = username;
                currentUser.avatar = username.charAt(0).toUpperCase();
                
                // Save updates
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('user_' + currentUser.email, JSON.stringify(currentUser));
                
                // Update UI
                updateUserDisplay(currentUser);
                this.reset();
                
                showNotification('Username updated successfully!');
            }
        });
    }
}

function openSettings() {
    document.getElementById('settingsPanel').classList.add('active');
    document.getElementById('settingsOverlay').classList.add('active');
    renderUserBookings();
}

function closeSettings() {
    document.getElementById('settingsPanel').classList.remove('active');
    document.getElementById('settingsOverlay').classList.remove('active');
}

function logout() {
    showNotification('Logged out');
}

/* --------------------------- Forms ------------------------------ */
function initForms() {
        // booking form: support both `eventBookingForm` and legacy `bookingForm`
        let bookingForm = document.getElementById('eventBookingForm');
        if (!bookingForm) bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(bookingForm));
                // Save booking for user
                saveBookingForUser(data);
                localStorage.setItem('lastBooking', JSON.stringify(data));
                showNotification('Booking saved to your profile');
                bookingForm.reset();
                // update settings panel if open
                renderUserBookings();
                // If you had a confirmation page, you could redirect here
            });
        }
    // contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(contactForm)) {
                showNotification('Message sent — we\'ll reply soon');
                contactForm.reset();
            }
        });
    }
}

/* ------------------------- Validation --------------------------- */
function validateForm(form) {
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
        if (!f.value || String(f.value).trim() === '') {
            ok = false; showFieldError(f, 'Required');
        }
    });
    return ok;
}

function showFieldError(field, message) {
    field.style.borderColor = 'var(--accent-color)';
    let el = field.parentNode.querySelector('.field-error');
    if (!el) { el = document.createElement('div'); el.className = 'field-error'; field.parentNode.appendChild(el); }
    el.textContent = message; el.style.color = 'var(--accent-color)';
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ------------------------- Animations --------------------------- */
function initAnimations() {
    // simple observer for fade-ins
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) en.target.style.opacity = 1; });
    }, { threshold: 0.1 });
    document.querySelectorAll('.event-card, .booking-form, .contact-form, .events-grid').forEach(el => { el.style.opacity = 0; obs.observe(el); });
}

/* --------------------------- Footer ----------------------------- */
function initFooter() {
    const y = document.getElementById('currentYear'); if (y) y.textContent = new Date().getFullYear();
}

/* ------------------------ Notifications ------------------------- */
function showNotification(msg, type='success'){
    const n = document.createElement('div'); n.className = `notification ${type}`; n.innerHTML = `<span>${msg}</span><button>×</button>`;
    n.querySelector('button').addEventListener('click', () => n.remove());
    document.body.appendChild(n); setTimeout(() => n.remove(), 4500);
}

/* ------------------------- Ripple -------------------------------- */
function createRippleEffect(el, evt) {
    if (!el) return; try {
        const r = document.createElement('span'); const rect = el.getBoundingClientRect(); const size = Math.max(rect.width, rect.height);
        const clientX = evt && evt.clientX ? evt.clientX : rect.left + rect.width/2; const clientY = evt && evt.clientY ? evt.clientY : rect.top + rect.height/2;
        const x = clientX - rect.left - size/2; const y = clientY - rect.top - size/2;
        r.style.cssText = `position:absolute; left:${x}px; top:${y}px; width:${size}px; height:${size}px; background:rgba(255,255,255,0.14); border-radius:50%; transform:scale(0); transition:transform .5s, opacity .5s; pointer-events:none;`;
        el.style.position = el.style.position || 'relative'; el.appendChild(r); requestAnimationFrame(()=>{ r.style.transform='scale(1)'; r.style.opacity='0'; }); setTimeout(()=>r.remove(), 600);
    } catch(e){}
}

/* ------------------------- Login System ------------------------- */
function initLoginSystem() {
    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showDashboard(JSON.parse(currentUser));
        loadUserBookings();
    }
    
    // Initialize with some sample bookings if none exist
    const currentUserData = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUserData) {
        const userBookings = JSON.parse(localStorage.getItem('my_bookings_' + currentUserData.email) || '[]');
        if (userBookings.length === 0) {
            // Add sample bookings for demo purposes
            const sampleBookings = [
                {
                    id: 'b1',
                    eventName: 'Hackathon 2025',
                    date: 'October 23, 2025',
                    time: '9:00 AM - 5:00 PM',
                    location: 'HTTPS Building',
                    status: 'pending'
                },
                {
                    id: 'b2',
                    eventName: 'Graduation Ceremony',
                    date: 'October 10, 2025',
                    time: '07:30 AM - 5:00 PM',
                    location: 'Mercure Hotel',
                    status: 'Completed'
                }
            ];
            
            localStorage.setItem('my_bookings_' + currentUserData.email, JSON.stringify(sampleBookings));
        }
    }

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (email && password) {
                const user = {
                    name: email.split('@')[0], // Default to email username
                    email: email,
                    avatar: email.charAt(0).toUpperCase(),
                    username: email.split('@')[0] // Initialize username
                };
                
                // Check if user has saved username
                const savedUser = localStorage.getItem('user_' + email);
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    user.name = userData.username || user.name;
                    user.avatar = userData.avatar || user.avatar;
                }
                
                localStorage.setItem('currentUser', JSON.stringify(user));
                showDashboard(user);
                loadUserBookings();
                this.reset();
            } else {
                alert('Please enter both email and password');
            }
        });
    }

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            if (name && email && password) {
                const user = {
                    name: name,
                    email: email,
                    avatar: name.charAt(0).toUpperCase(),
                    username: name // Set initial username to full name
                };
                
                // Save user data
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('user_' + email, JSON.stringify(user));
                
                showDashboard(user);
                loadUserBookings();
                this.reset();
            } else {
                alert('Please fill in all fields');
            }
        });
    }
}

function showDashboard(user) {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const userNavItem = document.getElementById('userNavItem');
    
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    if (userNavItem) userNavItem.style.display = 'block';
    
    updateUserDisplay(user);
}

function updateUserDisplay(user) {
    const displayName = user.username || user.name;
    
    // Update dashboard
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) welcomeName.textContent = displayName;
    
    // Update navigation
    const userIcon = document.getElementById('userIcon');
    if (userIcon) userIcon.textContent = user.avatar;
    
    // Update settings panel
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const username = document.getElementById('username');
    
    if (profileName) profileName.textContent = displayName;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileAvatar) profileAvatar.textContent = user.avatar;
    if (username) username.value = user.username || '';
}

function loadUserBookings() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userBookings = JSON.parse(localStorage.getItem('my_bookings_' + currentUser.email) || '[]');
    const bookingsList = document.getElementById('bookingsList');
    
    if (!bookingsList) return;
    
    // Clear existing bookings
    bookingsList.innerHTML = '';
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = '<div class="no-bookings">No bookings yet. <a href="booking.html" style="color: var(--yellow);">Book your first event!</a></div>';
        return;
    }
    
    // Show only the 3 most recent bookings in the settings panel
    const recentBookings = userBookings.slice(0, 3);
    
    recentBookings.forEach(booking => {
        const bookingItem = document.createElement('div');
        bookingItem.className = 'booking-item';
        
        bookingItem.innerHTML = `
            <div class="booking-header">
                <div class="booking-title">${booking.eventName}</div>
                <div class="booking-status ${booking.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}">${booking.status}</div>
            </div>
            <div class="booking-details">
                <div>Date: ${booking.date}</div>
                <div>Time: ${booking.time}</div>
                <div>Location: ${booking.location}</div>
            </div>
            <div class="booking-actions">
                <button class="booking-btn btn-primary" onclick="viewBookingDetails('${booking.id}')">Details</button>
                <button class="booking-btn btn-secondary" onclick="cancelBooking('${booking.id}')">Cancel</button>
            </div>
        `;
        
        bookingsList.appendChild(bookingItem);
    });
}

function viewAllBookings() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please log in to view your bookings.');
        return;
    }
    
    const userBookings = JSON.parse(localStorage.getItem('my_bookings_' + currentUser.email) || '[]');
    
    if (userBookings.length === 0) {
        alert('No bookings found. Book your first event!');
        return;
    }
    
    // Create a modal to display all bookings
    showAllBookingsModal(userBookings);
}

function showAllBookingsModal(bookings) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'bookings-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'bookings-modal-content';
    modalContent.style.cssText = `
        background: var(--navy-light, #112240);
        border-radius: 10px;
        padding: 2rem;
        max-width: 800px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid var(--navy-lighter, #233554);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--navy-lighter, #233554);
    `;
    
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'All Your Bookings';
    modalTitle.style.cssText = `
        color: var(--yellow, #ffd700);
        margin: 0;
        font-size: 1.8rem;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--white, #e6f1ff);
        font-size: 2rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background 0.3s ease;
    `;
    closeBtn.onclick = () => modalOverlay.remove();
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.1)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'none';
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);
    
    // Bookings list
    const bookingsList = document.createElement('div');
    bookingsList.className = 'all-bookings-list';
    
    bookings.forEach((booking, index) => {
        const bookingItem = document.createElement('div');
        bookingItem.style.cssText = `
            background: var(--navy, #0a192f);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            border-left: 4px solid var(--yellow, #ffd700);
            transition: transform 0.3s ease;
        `;
        
        bookingItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <h3 style="color: var(--yellow, #ffd700); margin: 0; font-size: 1.2rem;">${booking.eventName}</h3>
                <span style="background: ${booking.status === 'confirmed' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(241, 196, 15, 0.2)'}; 
                    color: ${booking.status === 'confirmed' ? '#2ecc71' : '#f1c40f'}; 
                    padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">
                    ${booking.status}
                </span>
            </div>
            <div style="margin-bottom: 1rem; opacity: 0.9;">
                <div><strong>Date:</strong> ${booking.date}</div>
                <div><strong>Time:</strong> ${booking.time}</div>
                <div><strong>Location:</strong> ${booking.location}</div>
                <div><strong>Booking ID:</strong> ${booking.id}</div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="viewBookingDetails('${booking.id}')" style="
                    background: var(--yellow, #ffd700);
                    color: var(--navy, #0a192f);
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='var(--yellow-dark, #ffb700)'" 
                   onmouseout="this.style.background='var(--yellow, #ffd700)'">
                    View Details
                </button>
                <button onclick="cancelBooking('${booking.id}'); modalOverlay.remove();" style="
                    background: transparent;
                    color: #ff6b6b;
                    border: 1px solid #ff6b6b;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#ff6b6b'; this.style.color='white'" 
                   onmouseout="this.style.background='transparent'; this.style.color='#ff6b6b'">
                    Cancel
                </button>
            </div>
        `;
        
        bookingItem.onmouseover = () => bookingItem.style.transform = 'translateY(-2px)';
        bookingItem.onmouseout = () => bookingItem.style.transform = 'translateY(0)';
        
        bookingsList.appendChild(bookingItem);
    });
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(bookingsList);
    modalOverlay.appendChild(modalContent);
    
    // Close modal when clicking overlay
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    };
    
    // Add modal to page
    document.body.appendChild(modalOverlay);
}

function viewBookingDetails(bookingId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userBookings = JSON.parse(localStorage.getItem('my_bookings_' + currentUser.email) || '[]');
    const booking = userBookings.find(b => b.id === bookingId);
    
    if (booking) {
        alert(`Booking Details:\n\nEvent: ${booking.eventName}\nDate: ${booking.date}\nTime: ${booking.time}\nLocation: ${booking.location}\nStatus: ${booking.status}\nBooking ID: ${booking.id}`);
    }
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        let userBookings = JSON.parse(localStorage.getItem('my_bookings_' + currentUser.email) || '[]');
        
        // Remove the booking
        userBookings = userBookings.filter(booking => booking.id !== bookingId);
        
        // Save updated bookings
        localStorage.setItem('my_bookings_' + currentUser.email, JSON.stringify(userBookings));
        
        // Reload bookings display
        loadUserBookings();
        
        alert('Booking cancelled successfully!');
    }
}

function showRegister() {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'flex';
}

function showLogin() {
    const registerSection = document.getElementById('registerSection');
    const loginSection = document.getElementById('loginSection');
    if (registerSection) registerSection.style.display = 'none';
    if (loginSection) loginSection.style.display = 'flex';
}

/* ------------------------- Hover Effects ------------------------ */
function initHoverEffects() {
    // About page hover effects
    document.querySelectorAll('.about-section').forEach(section => {
        section.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        section.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Contact page hover effects
    document.querySelectorAll('.contact-info, .contact-form').forEach(section => {
        section.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        section.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Events page hover effects
    document.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Home page hover effects for event cards
    document.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Dashboard action cards hover effects
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/* ------------------------- Stats Animation ---------------------- */
function initStatsAnimation() {
    const statItems = document.querySelectorAll('.stat-item h3');
    statItems.forEach(stat => {
        const finalNumber = parseInt(stat.textContent);
        if (isNaN(finalNumber)) return;
        
        let currentNumber = 0;
        const increment = finalNumber / 50;
        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= finalNumber) {
                stat.textContent = finalNumber + (stat.textContent.includes('%') ? '%' : '+');
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(currentNumber) + (stat.textContent.includes('%') ? '%' : '+');
            }
        }, 50);
    });
}

/* ------------------------- Enhanced Booking System ------------- */
function initBookingSystem() {
    // Enhanced booking form handling
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const bookingData = Object.fromEntries(formData);
            
            // Add booking ID and timestamp
            bookingData.id = Date.now().toString();
            bookingData.status = 'pending';
            bookingData.timestamp = new Date().toISOString();
            
            // Save to current user's bookings
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                let userBookings = JSON.parse(localStorage.getItem('my_bookings_' + currentUser.email) || '[]');
                
                // Map event selection to actual event details
                const eventMap = {
                    'tech-conference': { name: 'Hackathon 2025', location: 'HTTPS Building', date: 'October 23, 2025', time: '9:00 AM - 5:00 PM' },
                    'music-festival': { name: 'Graduation Ceremony', location: 'Mercure Hotel', date: 'October 10, 2025', time: '7:30 AM - 5:00 PM' },
                    'career-fair': { name: 'Career Fair 2025', location: 'Lower Campus', date: 'May 10, 2025', time: '10:00 AM - 4:00 PM' },
                    'workshop': { name: 'AI Workshop Series', location: 'Main Campus', date: 'TBD', time: 'TBD' }
                };
                
                const selectedEvent = eventMap[bookingData.eventSelect] || { name: 'Selected Event', location: 'Event Location', date: 'TBD', time: 'TBD' };
                
                // Map form data to booking structure
                const booking = {
                    id: bookingData.id,
                    eventName: selectedEvent.name,
                    date: selectedEvent.date,
                    time: selectedEvent.time,
                    location: selectedEvent.location,
                    status: 'pending',
                    // Add form data without overriding the mapped fields
                    firstName: bookingData.firstName,
                    lastName: bookingData.lastName,
                    email: bookingData.email,
                    phone: bookingData.phone,
                    studentId: bookingData.studentId,
                    eventSelect: bookingData.eventSelect,
                    ticketCount: bookingData.ticketCount,
                    specialRequests: bookingData.specialRequests
                };
                
                userBookings.unshift(booking); // Add to beginning
                localStorage.setItem('my_bookings_' + currentUser.email, JSON.stringify(userBookings));
                
                // Update display if on dashboard
                loadUserBookings();
                
                alert('Thank you for your booking! We will send a confirmation email shortly.');
                this.reset();
            } else {
                // Save booking for guest user
                saveBookingForUser(bookingData);
                alert('Thank you for your booking! Please sign in to view your bookings.');
                this.reset();
            }
        });
    }

    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(contactForm)) {
                showNotification('Thank you for your message! We will get back to you within 24 hours.');
                contactForm.reset();
            }
        });
    }
}

/* ------------------------- Utilities ---------------------------- */
// Add small helper to show bookings in settings when panel opens
window.openSettings = openSettings; 
window.closeSettings = closeSettings; 
window.logout = logout;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.viewAllBookings = viewAllBookings;
window.viewBookingDetails = viewBookingDetails;
window.cancelBooking = cancelBooking;

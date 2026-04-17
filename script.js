// Safe For Her SA - Complete Frontend JavaScript

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Hide loader after 1.5 seconds
    setTimeout(() => {
        const loader = document.getElementById('loaderScreen');
        if (loader) loader.classList.add('fade-out');
    }, 1500);

    // Set current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Initialize all features
    initMobileMenu();
    initSmoothScroll();
    initBackToTop();
    initCrimeTicker();
    initSafetyMap();
    initNewsSection();
    initSafetyTipsSlider();
    initReportForm();
    initSOSButton();
    initTrackingModal();
    initQuickExit();

    // Load saved contacts
    loadContacts();
});

// ==================== MOBILE MENU ====================
function initMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav');
    
    if (mobileBtn && nav) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileBtn.innerHTML = nav.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }
}

// ==================== SMOOTH SCROLL ====================
function initSmoothScroll() {
    document.querySelectorAll('nav a, .btn[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile menu if open
                document.querySelector('nav')?.classList.remove('active');
            }
        });
    });
}

// ==================== BACK TO TOP ====================
function initBackToTop() {
    const backBtn = document.getElementById('backToTop');
    if (backBtn) {
        window.addEventListener('scroll', () => {
            backBtn.classList.toggle('show', window.scrollY > 300);
        });
        backBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ==================== CRIME TICKER ====================
function initCrimeTicker() {
    const tickerText = document.getElementById('tickerText');
    if (tickerText) {
        // Simulate crime data (in production, fetch from API)
        const crimesThisWeek = Math.floor(Math.random() * 50) + 100;
        tickerText.innerHTML = `${crimesThisWeek} incidents reported in SA this week`;
    }
}

// ==================== SAFETY MAP (LEAFLET) ====================
let map;
let userMarker;
let incidentMarkers = [];
let hospitalMarkers = [];
let policeMarkers = [];

function initSafetyMap() {
    // Default to Johannesburg
    const defaultCenter = [-26.2041, 28.0473];
    
    map = L.map('safetyMap').setView(defaultCenter, 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Get user location
    getUserLocation();
    
    // Load incident markers
    loadIncidentMarkers();
    
    // Load hospitals and police stations
    loadSafeLocations();
    
    // Refresh location button
    document.getElementById('refreshLocation')?.addEventListener('click', getUserLocation);
}

function getUserLocation() {
    const locationStatus = document.getElementById('locationStatus');
    
    if (!navigator.geolocation) {
        locationStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Geolocation not supported';
        return;
    }
    
    locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const userCoords = [latitude, longitude];
            
            map.setView(userCoords, 14);
            
            if (userMarker) {
                userMarker.setLatLng(userCoords);
            } else {
                const customIcon = L.divIcon({
                    html: '<i class="fas fa-user" style="color: #e83e8c; font-size: 24px;"></i>',
                    iconSize: [24, 24],
                    className: 'custom-div-icon'
                });
                userMarker = L.marker(userCoords, { icon: customIcon })
                    .bindPopup('You are here')
                    .addTo(map);
            }
            
            locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            // Find nearby safe locations
            findNearbySafeLocations(userCoords);
        },
        (error) => {
            console.error('Geolocation error:', error);
            let errorMsg = 'Could not get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Please enable location permissions.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Location request timed out.';
                    break;
            }
            locationStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMsg}`;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function loadIncidentMarkers() {
    // Sample incident data (in production, fetch from backend API)
    const sampleIncidents = [
        { type: 'assault', lat: -26.1941, lng: 28.0373, date: '2024-01-15', desc: 'Assault reported near Park Station' },
        { type: 'harassment', lat: -26.2141, lng: 28.0573, date: '2024-01-14', desc: 'Verbal harassment at Sandton City' },
        { type: 'theft', lat: -26.1841, lng: 28.0273, date: '2024-01-13', desc: 'Phone snatched in Braamfontein' },
        { type: 'assault', lat: -26.2241, lng: 28.0673, date: '2024-01-12', desc: 'Physical assault in Rosebank' },
        { type: 'harassment', lat: -26.2041, lng: 28.0473, date: '2024-01-11', desc: 'Stalking incident in CBD' }
    ];
    
    const colors = {
        assault: '#ff0000',
        harassment: '#ff9800',
        theft: '#9c27b0',
        other: '#2196f3'
    };
    
    sampleIncidents.forEach(incident => {
        const icon = L.divIcon({
            html: `<i class="fas fa-exclamation-circle" style="color: ${colors[incident.type]}; font-size: 20px;"></i>`,
            iconSize: [20, 20],
            className: 'incident-marker'
        });
        
        const marker = L.marker([incident.lat, incident.lng], { icon })
            .bindPopup(`
                <strong>${incident.type.toUpperCase()}</strong><br>
                ${incident.desc}<br>
                <small>Reported: ${incident.date}</small>
            `)
            .addTo(map);
        
        incidentMarkers.push(marker);
    });
}

function loadSafeLocations() {
    // Hospitals
    const hospitals = [
        { name: 'Charlotte Maxeke Hospital', lat: -26.1915, lng: 28.0386 },
        { name: 'Milpark Hospital', lat: -26.2098, lng: 28.0443 },
        { name: 'Chris Hani Baragwanath', lat: -26.2541, lng: 27.9373 }
    ];
    
    hospitals.forEach(hospital => {
        const icon = L.divIcon({
            html: '<i class="fas fa-hospital" style="color: #4caf50; font-size: 20px;"></i>',
            iconSize: [20, 20],
            className: 'hospital-marker'
        });
        
        const marker = L.marker([hospital.lat, hospital.lng], { icon })
            .bindPopup(`<strong>🏥 ${hospital.name}</strong><br><a href="tel:10177">Call Ambulance: 10177</a>`)
            .addTo(map);
        
        hospitalMarkers.push(marker);
    });
    
    // Police Stations
    const policeStations = [
        { name: 'Johannesburg Central SAPS', lat: -26.2002, lng: 28.0408 },
        { name: 'Hillbrow SAPS', lat: -26.1931, lng: 28.0324 },
        { name: 'Sandton SAPS', lat: -26.1076, lng: 28.0557 }
    ];
    
    policeStations.forEach(station => {
        const icon = L.divIcon({
            html: '<i class="fas fa-shield-alt" style="color: #2196f3; font-size: 20px;"></i>',
            iconSize: [20, 20],
            className: 'police-marker'
        });
        
        const marker = L.marker([station.lat, station.lng], { icon })
            .bindPopup(`<strong>👮 ${station.name}</strong><br><a href="tel:10111">Call Police: 10111</a>`)
            .addTo(map);
        
        policeMarkers.push(marker);
    });
}

function findNearbySafeLocations(coords) {
    // This would calculate distances and show nearest locations
    console.log('Finding nearby safe locations for:', coords);
    showToast('Nearby hospitals and police stations highlighted on map', 'info');
}

// ==================== NEWS SECTION ====================
async function initNewsSection() {
    await loadNews('all');
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            await loadNews(this.dataset.filter);
        });
    });
}

async function loadNews(category) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading news...</div>';
    
    // Sample news data (in production, fetch from NewsAPI or similar)
    const newsData = {
        all: [
            { title: 'New GBV Prevention Program Launched in Gauteng', excerpt: 'Government announces R100M initiative to combat gender-based violence...', category: 'safety', date: '2024-01-15', image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=200&fit=crop' },
            { title: 'Sandton CBD Reports Increase in Street Harassment', excerpt: 'Women report rising incidents of catcalling and following in the Sandton area...', category: 'harassment', date: '2024-01-14', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop' },
            { title: 'Self-Defense Classes Now Free for Women in Cape Town', excerpt: 'Local organizations offer free Krav Maga classes to empower women...', category: 'safety', date: '2024-01-13', image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=200&fit=crop' },
            { title: 'Police Launch Task Force for Public Transport Safety', excerpt: 'New initiative aims to protect women using taxis and buses...', category: 'safety', date: '2024-01-12', image: 'https://images.unsplash.com/photo-1444927714506-8492d94b4e0d?w=400&h=200&fit=crop' }
        ],
        assault: [
            { title: 'Police Increase Patrols After Assault Spike in Soweto', excerpt: 'Community leaders call for action after multiple reported incidents...', category: 'assault', date: '2024-01-14', image: 'https://images.unsplash.com/photo-1504051771394-dd2c66b2e08f?w=400&h=200&fit=crop' }
        ],
        harassment: [
            { title: 'Sandton CBD Reports Increase in Street Harassment', excerpt: 'Women report rising incidents of catcalling and following...', category: 'harassment', date: '2024-01-14', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop' }
        ],
        safety: [
            { title: 'New GBV Prevention Program Launched in Gauteng', excerpt: 'Government announces R100M initiative...', category: 'safety', date: '2024-01-15', image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=200&fit=crop' },
            { title: 'Self-Defense Classes Now Free for Women', excerpt: 'Local organizations offer free Krav Maga classes...', category: 'safety', date: '2024-01-13', image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=200&fit=crop' }
        ]
    };
    
    const articles = newsData[category] || newsData.all;
    
    if (articles.length === 0) {
        newsGrid.innerHTML = '<div style="text-align: center; padding: 40px;">No articles found</div>';
        return;
    }
    
    newsGrid.innerHTML = articles.map(article => `
        <div class="news-card">
            <div class="news-image">
                <img src="${article.image}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/400x200?text=News+Image'">
            </div>
            <div class="news-content">
                <span class="news-category ${article.category}">${article.category}</span>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${article.excerpt.substring(0, 120)}...</p>
                <div class="news-meta">
                    <span><i class="far fa-calendar"></i> ${article.date}</span>
                    <a href="#" style="color: #e83e8c;">Read more →</a>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== SAFETY TIPS SLIDER ====================
function initSafetyTipsSlider() {
    const tips = document.querySelectorAll('.tip');
    const dots = document.querySelectorAll('.dot');
    let currentTip = 0;
    
    function showTip(index) {
        tips.forEach(tip => tip.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        tips[index].classList.add('active');
        dots[index].classList.add('active');
        currentTip = index;
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showTip(index));
    });
    
    setInterval(() => {
        let next = (currentTip + 1) % tips.length;
        showTip(next);
    }, 5000);
}

// ==================== REPORT FORM ====================
function initReportForm() {
    const form = document.getElementById('incidentForm');
    if (!form) return;
    
    // Set default date to now
    const dateInput = document.getElementById('incidentDate');
    if (dateInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateInput.value = now.toISOString().slice(0, 16);
    }
    
    // Use current location button
    document.getElementById('useCurrentLocation')?.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    document.getElementById('incidentLocation').value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    showToast('Location captured successfully', 'success');
                },
                () => showToast('Could not get location. Please enter manually.', 'error')
            );
        } else {
            showToast('Geolocation not supported', 'error');
        }
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const report = {
            type: document.getElementById('incidentType').value,
            location: document.getElementById('incidentLocation').value,
            date: document.getElementById('incidentDate').value,
            description: document.getElementById('incidentDesc').value,
            anonymous: document.getElementById('anonymousReport').checked,
            timestamp: new Date().toISOString()
        };
        
        if (!report.type || !report.location || !report.description) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // In production, send to backend API
        console.log('Report submitted:', report);
        
        // Store in localStorage for demo
        const reports = JSON.parse(localStorage.getItem('safetyReports') || '[]');
        reports.push(report);
        localStorage.setItem('safetyReports', JSON.stringify(reports));
        
        showToast('Thank you for your report. You are helping keep women safe!', 'success');
        form.reset();
        
        // Reset date
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateInput.value = now.toISOString().slice(0, 16);
    });
}

// ==================== SOS BUTTON ====================
function initSOSButton() {
    const sosBtn = document.getElementById('sosButton');
    const emergencyBtn = document.getElementById('emergencyCallBtn');
    
    const handleSOS = () => {
        if (confirm('⚠️ EMERGENCY SOS ⚠️\n\nThis will call the South African Police Service (10111).\n\nOnly press if you are in immediate danger!\n\nDo you want to proceed?')) {
            window.location.href = 'tel:10111';
            showToast('Calling SAPS Emergency...', 'warning');
        }
    };
    
    sosBtn?.addEventListener('click', handleSOS);
    emergencyBtn?.addEventListener('click', handleSOS);
}

// ==================== TRACKING MODAL ====================
let trackingInterval = null;
let contacts = [];

function initTrackingModal() {
    const trackBtn = document.getElementById('trackMeBtn');
    const modal = document.getElementById('trackModal');
    const closeModal = document.querySelector('.close-modal');
    const startBtn = document.getElementById('startTracking');
    const stopBtn = document.getElementById('stopTracking');
    const addContactBtn = document.getElementById('addContactBtn');
    
    // Load contacts from localStorage
    loadContacts();
    
    trackBtn?.addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    closeModal?.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
    
    startBtn?.addEventListener('click', startTracking);
    stopBtn?.addEventListener('click', stopTracking);
    addContactBtn?.addEventListener('click', addContact);
}

function loadContacts() {
    const saved = localStorage.getItem('safetyContacts');
    if (saved) {
        contacts = JSON.parse(saved);
    }
    renderContacts();
}

function saveContacts() {
    localStorage.setItem('safetyContacts', JSON.stringify(contacts));
    renderContacts();
}

function renderContacts() {
    const container = document.getElementById('contactsList');
    if (!container) return;
    
    if (contacts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No contacts added yet</p>';
        return;
    }
    
    container.innerHTML = contacts.map((contact, index) => `
        <div class="contact-item">
            <div>
                <strong>${escapeHtml(contact.name)}</strong><br>
                <small>${escapeHtml(contact.phone)}</small>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" class="share-contact" data-index="${index}" ${contact.shared ? 'checked' : ''}>
                    <span>Share</span>
                </label>
                <button class="delete-contact" data-index="${index}" style="background: none; border: none; color: #ff0000; cursor: pointer; margin-left: 8px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.share-contact').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            contacts[index].shared = e.target.checked;
            saveContacts();
        });
    });
    
    document.querySelectorAll('.delete-contact').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.delete-contact')?.dataset.index);
            if (!isNaN(index)) {
                contacts.splice(index, 1);
                saveContacts();
            }
        });
    });
}

function addContact() {
    const nameInput = document.getElementById('contactName');
    const phoneInput = document.getElementById('contactPhone');
    
    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    
    if (!name || !phone) {
        showToast('Please enter both name and phone number', 'error');
        return;
    }
    
    if (!/^[0-9+\-\s()]+$/.test(phone)) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }
    
    contacts.push({ name, phone, shared: false });
    saveContacts();
    
    nameInput.value = '';
    phoneInput.value = '';
    showToast('Contact added successfully', 'success');
}

function startTracking() {
    const sharedContacts = contacts.filter(c => c.shared);
    
    if (sharedContacts.length === 0) {
        showToast('Please select at least one contact to share with', 'error');
        return;
    }
    
    if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        return;
    }
    
    const trackStatus = document.getElementById('trackStatus');
    const duration = parseInt(document.getElementById('trackDuration')?.value || '0');
    
    trackStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tracking active... Sharing location';
    trackStatus.style.background = '#e8f5e9';
    
    // Start tracking interval
    trackingInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                
                // In production, send to backend to notify contacts via SMS/WhatsApp
                console.log(`Sharing location with ${sharedContacts.length} contacts: ${locationUrl}`);
                
                // Update status
                trackStatus.innerHTML = `<i class="fas fa-location-dot"></i> Sharing live location (${new Date().toLocaleTimeString()})`;
            },
            (error) => {
                console.error('Tracking error:', error);
            },
            { enableHighAccuracy: true }
        );
    }, 10000); // Update every 10 seconds
    
    // Auto-stop after duration
    if (duration > 0) {
        setTimeout(() => {
            stopTracking();
            showToast('Location sharing has ended', 'info');
        }, duration * 60 * 60 * 1000);
    }
    
    showToast(`Sharing your location with ${sharedContacts.length} contact(s)`, 'success');
}

function stopTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    
    const trackStatus = document.getElementById('trackStatus');
    if (trackStatus) {
        trackStatus.innerHTML = '<i class="fas fa-map-marker-alt"></i> Not tracking';
        trackStatus.style.background = '#f0f0f0';
    }
    
    showToast('Location sharing stopped', 'info');
}

// ==================== QUICK EXIT ====================
function initQuickExit() {
    const exitBtn = document.getElementById('quickExit');
    exitBtn?.addEventListener('click', () => {
        // Clear sensitive data
        localStorage.removeItem('safetyReports');
        localStorage.removeItem('safetyContacts');
        // The link will redirect to weather.com
    });
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const colors = {
        success: '#00c853',
        error: '#ff0000',
        warning: '#ff9800',
        info: '#2196f3'
    };
    
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.style.display = 'block';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// ==================== UTILITIES ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== SERVICE WORKER FOR PWA ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
}

document.addEventListener('DOMContentLoaded', function() {
    // Loader
    setTimeout(function() {
        document.querySelector('.loader').classList.add('fade-out');
    }, 1500);

    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    
    mobileMenuBtn.addEventListener('click', function() {
        nav.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
        this.querySelector('i').classList.toggle('fa-bars');
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            nav.classList.remove('active');
            mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        });
    });

    // Back to top button
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Crime alert update
    function updateCrimeAlert() {
        const alertText = document.querySelector('.alert-text');
        const alertDate = document.querySelector('.alert-date');
        
        // Simulate fetching crime data (in a real app, this would be an API call)
        const crimesThisWeek = Math.floor(Math.random() * 15) + 5;
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        
        alertText.textContent = `${crimesThisWeek} crimes against women reported this week`;
        alertDate.textContent = today.toLocaleDateString('en-US', options);
    }
    
    updateCrimeAlert();
    
    // Initialize safety map
    let map;
    let userMarker;
    let incidentMarkers = [];
    
    function initMap() {
        // Default to Johannesburg coordinates
        const defaultCoords = [-26.2041, 28.0473];
        
        map = L.map('safetyMap').setView(defaultCoords, 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Try to get user's location
        getUserLocation();
        
        // Add sample incident markers (in a real app, these would come from a database)
        addSampleIncidents();
    }
    
    function getUserLocation() {
        const locationStatus = document.getElementById('locationStatus');
        
        if (navigator.geolocation) {
            locationStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Detecting your location...';
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const userCoords = [position.coords.latitude, position.coords.longitude];
                    
                    // Update map view
                    map.setView(userCoords, 14);
                    
                    // Add or update user marker
                    if (userMarker) {
                        userMarker.setLatLng(userCoords);
                    } else {
                        userMarker = L.marker(userCoords, {
                            icon: L.divIcon({
                                className: 'user-marker',
                                html: '<i class="fas fa-user"></i>',
                                iconSize: [30, 30]
                            })
                        }).addTo(map);
                        
                        userMarker.bindPopup('Your location').openPopup();
                    }
                    
                    locationStatus.innerHTML = `<i class="fas fa-map-marker-alt"></i> Location detected: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                },
                function(error) {
                    console.error('Error getting location:', error);
                    locationStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Could not detect your location. Using default view.';
                }
            );
        } else {
            locationStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Geolocation is not supported by your browser. Using default view.';
        }
    }
    
    function addSampleIncidents() {
        // Sample incidents data (in a real app, this would come from an API)
        const incidents = [
            { type: 'assault', coords: [-26.1941, 28.0373], date: '2023-05-15', description: 'Reported assault near this location' },
            { type: 'harassment', coords: [-26.2141, 28.0573], date: '2023-05-14', description: 'Catcalling and verbal harassment reported' },
            { type: 'theft', coords: [-26.2041, 28.0273], date: '2023-05-13', description: 'Bag snatching incident' },
            { type: 'other', coords: [-26.2241, 28.0473], date: '2023-05-12', description: 'Suspicious behavior reported' },
            { type: 'assault', coords: [-26.1841, 28.0673], date: '2023-05-11', description: 'Physical assault reported' }
        ];
        
        // Clear existing incident markers
        incidentMarkers.forEach(marker => map.removeLayer(marker));
        incidentMarkers = [];
        
        // Add new markers
        incidents.forEach(incident => {
            let iconColor;
            let iconClass;
            
            switch(incident.type) {
                case 'assault':
                    iconColor = '#e53935';
                    iconClass = 'assault-marker';
                    break;
                case 'harassment':
                    iconColor = '#ffb300';
                    iconClass = 'harassment-marker';
                    break;
                case 'theft':
                    iconColor = '#6a1b9a';
                    iconClass = 'theft-marker';
                    break;
                default:
                    iconColor = '#1e88e5';
                    iconClass = 'other-marker';
            }
            
            const marker = L.marker(incident.coords, {
                icon: L.divIcon({
                    className: `incident-marker ${iconClass}`,
                    html: `<i class="fas fa-exclamation"></i>`,
                    iconSize: [25, 25],
                    popupAnchor: [0, -10]
                })
            }).addTo(map);
            
            marker.bindPopup(`
                <strong>${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}</strong><br>
                <small>${incident.date}</small><br>
                ${incident.description}
            `);
            
            incidentMarkers.push(marker);
        });
    }
    
    // Refresh location button
    document.getElementById('refreshLocation').addEventListener('click', getUserLocation);
    
    // Use current location in report form
    document.getElementById('useCurrentLocation').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    document.getElementById('incidentLocation').value = 
                        `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                },
                function(error) {
                    alert('Could not get your current location. Please enter it manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser. Please enter location manually.');
        }
    });
    
    // Report form submission
    document.getElementById('incidentReportForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const type = document.getElementById('incidentType').value;
        const location = document.getElementById('incidentLocation').value;
        const date = document.getElementById('incidentDate').value;
        const description = document.getElementById('incidentDescription').value;
        const anonymous = document.getElementById('anonymousReport').checked;
        
        // In a real app, this would send data to a server
        console.log('Report submitted:', { type, location, date, description, anonymous });
        
        // Show success message
        alert('Thank you for your report. This information will help keep other women safe.');
        
        // Reset form
        this.reset();
    });
    
    // Track Me modal
    const trackMeBtn = document.getElementById('trackMeBtn');
    const trackMeModal = document.getElementById('trackMeModal');
    const closeModal = document.querySelector('.close-modal');
    const startTrackingBtn = document.getElementById('startTracking');
    const stopTrackingBtn = document.getElementById('stopTracking');
    let trackingInterval;
    let isTracking = false;
    
    trackMeBtn.addEventListener('click', function() {
        trackMeModal.classList.add('active');
    });
    
    closeModal.addEventListener('click', function() {
        trackMeModal.classList.remove('active');
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === trackMeModal) {
            trackMeModal.classList.remove('active');
        }
    });
    
    // Start tracking
    startTrackingBtn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        
        const trackStatus = document.getElementById('trackStatus');
        trackStatus.innerHTML = `
            <div class="status-icon">
                <i class="fas fa-location-arrow"></i>
            </div>
            <p>Sharing your location with selected contacts</p>
        `;
        trackStatus.classList.add('active');
        
        isTracking = true;
        startTrackingBtn.disabled = true;
        stopTrackingBtn.disabled = false;
        
        // In a real app, this would send location to a server at intervals
        trackingInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(position => {
                console.log('Location shared:', position.coords);
                // Here you would send the location to your server
            });
        }, 5000);
        
        // Set timeout if a duration was selected
        const duration = parseInt(document.getElementById('trackingTime').value);
        if (duration > 0) {
            setTimeout(stopTracking, duration * 60 * 60 * 1000);
        }
    });
    
    // Stop tracking
    stopTrackingBtn.addEventListener('click', stopTracking);
    
    function stopTracking() {
        clearInterval(trackingInterval);
        
        const trackStatus = document.getElementById('trackStatus');
        trackStatus.innerHTML = `
            <div class="status-icon">
                <i class="fas fa-location-slash"></i>
            </div>
            <p>Location sharing is currently inactive</p>
        `;
        trackStatus.classList.remove('active');
        
        isTracking = false;
        startTrackingBtn.disabled = false;
        stopTrackingBtn.disabled = true;
    }
    
    // News filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const newsGrid = document.getElementById('newsGrid');
    
    // Sample news data (in a real app, this would come from an API)
    const newsData = [
        {
            id: 1,
            title: 'Increase in Gender-Based Violence Cases Reported',
            excerpt: 'Recent statistics show a worrying increase in GBV cases across major cities.',
            category: 'assault',
            date: 'May 15, 2023',
            image: 'https://source.unsplash.com/random/600x400/?violence'
        },
        {
            id: 2,
            title: 'New Safety App Launched for Women',
            excerpt: 'Local developers create app to help women alert contacts when in danger.',
            category: 'safety-tips',
            date: 'May 14, 2023',
            image: 'https://source.unsplash.com/random/600x400/?safety'
        },
        {
            id: 3,
            title: 'Street Harassment Campaign Gains Momentum',
            excerpt: 'Community initiative aims to reduce catcalling and street harassment.',
            category: 'harassment',
            date: 'May 13, 2023',
            image: 'https://source.unsplash.com/random/600x400/?protest'
        },
        {
            id: 4,
            title: 'Self-Defense Workshops for Women',
            excerpt: 'Free self-defense classes being offered at community centers.',
            category: 'safety-tips',
            date: 'May 12, 2023',
            image: 'https://source.unsplash.com/random/600x400/?self-defense'
        },
        {
            id: 5,
            title: 'Arrest Made in Recent Assault Case',
            excerpt: 'Police apprehend suspect in connection with downtown assault.',
            category: 'assault',
            date: 'May 11, 2023',
            image: 'https://source.unsplash.com/random/600x400/?police'
        },
        {
            id: 6,
            title: 'Safe Ride Program Expands to More Areas',
            excerpt: 'Initiative providing safe transportation for women expands coverage.',
            category: 'safety-tips',
            date: 'May 10, 2023',
            image: 'https://source.unsplash.com/random/600x400/?taxi'
        }
    ];
    
    // Display news articles
    function displayNews(filter = 'all') {
        newsGrid.innerHTML = '';
        
        const filteredNews = filter === 'all' 
            ? newsData 
            : newsData.filter(item => item.category === filter);
        
        if (filteredNews.length === 0) {
            newsGrid.innerHTML = '<p class="no-news">No news articles found for this category.</p>';
            return;
        }
        
        filteredNews.forEach(item => {
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card';
            newsCard.innerHTML = `
                <div class="news-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="news-content">
                    <span class="news-category ${item.category}">${item.category.replace('-', ' ')}</span>
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-excerpt">${item.excerpt}</p>
                    <div class="news-meta">
                        <span>${item.date}</span>
                        <a href="#">Read More</a>
                    </div>
                </div>
            `;
            newsGrid.appendChild(newsCard);
        });
    }
    
    // Initial news display
    displayNews();
    
    // Filter news
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayNews(this.dataset.filter);
        });
    });
    
    // Safety tips slider
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
    
    // Auto-rotate tips
    setInterval(() => {
        let nextTip = currentTip + 1;
        if (nextTip >= tips.length) nextTip = 0;
        showTip(nextTip);
    }, 5000);
    
    // Initialize the map after everything else is loaded
    initMap();
});
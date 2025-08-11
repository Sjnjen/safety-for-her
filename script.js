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
        
        // Use actual crime stats API (this is a placeholder)
        fetchCrimeStats().then(data => {
            alertText.textContent = `${data.total} crimes against women reported this week`;
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            alertDate.textContent = today.toLocaleDateString('en-US', options);
        }).catch(() => {
            // Fallback if API fails
            const crimesThisWeek = Math.floor(Math.random() * 15) + 5;
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            
            alertText.textContent = `${crimesThisWeek} crimes against women reported this week`;
            alertDate.textContent = today.toLocaleDateString('en-US', options);
        });
    }
    
    // Function to fetch crime stats (placeholder - you'll need a real API)
    async function fetchCrimeStats() {
        // In a real app, replace this with actual API call
        // Example: const response = await fetch('https://api.saps.gov.za/crime-stats');
        return {
            total: Math.floor(Math.random() * 15) + 5,
            date: new Date().toISOString()
        };
    }
    
    updateCrimeAlert();
    
    // Initialize safety map
    let map;
    let userMarker;
    let incidentMarkers = [];
    let hospitalMarkers = [];
    let policeMarkers = [];
    
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
        
        // Add hospitals and police stations
        addHospitalsAndPoliceStations();
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
                    
                    // Find nearby hospitals and police stations
                    findNearbyServices(userCoords);
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
        // Clear existing incident markers
        incidentMarkers.forEach(marker => map.removeLayer(marker));
        incidentMarkers = [];
        
        // In a real app, fetch incidents from your API
        fetchRecentIncidents().then(incidents => {
            incidents.forEach(incident => {
                addIncidentMarker(incident);
            });
        }).catch(error => {
            console.error('Error fetching incidents:', error);
            // Fallback to sample data
            const sampleIncidents = [
                { 
                    type: 'assault', 
                    coords: [-26.1941, 28.0373], 
                    date: new Date().toISOString(), 
                    description: 'Reported assault near this location' 
                },
                { 
                    type: 'harassment', 
                    coords: [-26.2141, 28.0573], 
                    date: new Date(Date.now() - 86400000).toISOString(), 
                    description: 'Catcalling and verbal harassment reported' 
                }
            ];
            
            sampleIncidents.forEach(incident => {
                addIncidentMarker(incident);
            });
        });
    }
    
    function addIncidentMarker(incident) {
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
        
        const marker = L.marker([incident.latitude || incident.coords[0], incident.longitude || incident.coords[1]], {
            icon: L.divIcon({
                className: `incident-marker ${iconClass}`,
                html: `<i class="fas fa-exclamation"></i>`,
                iconSize: [25, 25],
                popupAnchor: [0, -10]
            })
        }).addTo(map);
        
        const date = new Date(incident.date);
        marker.bindPopup(`
            <strong>${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}</strong><br>
            <small>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</small><br>
            ${incident.description}
        `);
        
        incidentMarkers.push(marker);
    }
    
    // Function to fetch recent incidents (placeholder - replace with real API)
    async function fetchRecentIncidents() {
        // In a real app, replace with your API endpoint
        // Example: const response = await fetch('https://your-api.com/incidents');
        // return await response.json();
        
        // Simulate API call with sample data
        return [
            { 
                id: 1,
                type: 'assault',
                latitude: -26.1941,
                longitude: 28.0373,
                date: new Date().toISOString(),
                description: 'Reported assault near this location'
            },
            { 
                id: 2,
                type: 'harassment',
                latitude: -26.2141,
                longitude: 28.0573,
                date: new Date(Date.now() - 3600000).toISOString(),
                description: 'Catcalling reported by multiple women'
            }
        ];
    }
    
    function addHospitalsAndPoliceStations() {
        // Clear existing markers
        hospitalMarkers.forEach(marker => map.removeLayer(marker));
        policeMarkers.forEach(marker => map.removeLayer(marker));
        hospitalMarkers = [];
        policeMarkers = [];
        
        // In a real app, fetch from Overpass API or another source
        findNearbyHospitals([-26.2041, 28.0473]).then(hospitals => {
            hospitals.forEach(hospital => {
                const marker = L.marker([hospital.lat, hospital.lon], {
                    icon: L.divIcon({
                        className: 'hospital-marker',
                        html: '<i class="fas fa-hospital"></i>',
                        iconSize: [25, 25],
                        popupAnchor: [0, -10]
                    })
                }).addTo(map);
                
                marker.bindPopup(`
                    <strong>${hospital.name || 'Hospital'}</strong><br>
                    ${hospital.address || ''}
                `);
                
                hospitalMarkers.push(marker);
            });
        });
        
        findNearbyPoliceStations([-26.2041, 28.0473]).then(policeStations => {
            policeStations.forEach(station => {
                const marker = L.marker([station.lat, station.lon], {
                    icon: L.divIcon({
                        className: 'police-marker',
                        html: '<i class="fas fa-shield-alt"></i>',
                        iconSize: [25, 25],
                        popupAnchor: [0, -10]
                    })
                }).addTo(map);
                
                marker.bindPopup(`
                    <strong>${station.name || 'Police Station'}</strong><br>
                    ${station.address || ''}
                `);
                
                policeMarkers.push(marker);
            });
        });
    }
    
    function findNearbyServices(userCoords) {
        // Find services near user's location
        findNearbyHospitals(userCoords).then(hospitals => {
            hospitals.forEach(hospital => {
                const marker = L.marker([hospital.lat, hospital.lon], {
                    icon: L.divIcon({
                        className: 'hospital-marker',
                        html: '<i class="fas fa-hospital"></i>',
                        iconSize: [25, 25],
                        popupAnchor: [0, -10]
                    })
                }).addTo(map);
                
                marker.bindPopup(`
                    <strong>${hospital.name || 'Hospital'}</strong><br>
                    ${hospital.address || ''}
                `);
                
                hospitalMarkers.push(marker);
            });
        });
        
        findNearbyPoliceStations(userCoords).then(policeStations => {
            policeStations.forEach(station => {
                const marker = L.marker([station.lat, station.lon], {
                    icon: L.divIcon({
                        className: 'police-marker',
                        html: '<i class="fas fa-shield-alt"></i>',
                        iconSize: [25, 25],
                        popupAnchor: [0, -10]
                    })
                }).addTo(map);
                
                marker.bindPopup(`
                    <strong>${station.name || 'Police Station'}</strong><br>
                    ${station.address || ''}<br>
                    <a href="tel:10111" class="call-link">Call Police (10111)</a>
                `);
                
                policeMarkers.push(marker);
            });
        });
    }
    
    // Function to find nearby hospitals using Overpass API
    async function findNearbyHospitals(coords, radius = 5000) {
        try {
            const [lat, lon] = coords;
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];(node[amenity=hospital](around:${radius},${lat},${lon});out;`);
            const data = await response.json();
            
            return data.elements.map(item => ({
                lat: item.lat,
                lon: item.lon,
                name: item.tags?.name || 'Hospital',
                address: item.tags?.['addr:street'] || ''
            }));
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            // Fallback sample data
            return [
                { lat: -26.1915, lon: 28.0386, name: 'Charlotte Maxeke Hospital', address: 'Parktown, Johannesburg' },
                { lat: -26.2098, lon: 28.0443, name: 'Milpark Hospital', address: 'Braamfontein, Johannesburg' }
            ];
        }
    }
    
    // Function to find nearby police stations using Overpass API
    async function findNearbyPoliceStations(coords, radius = 5000) {
        try {
            const [lat, lon] = coords;
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];(node[amenity=police](around:${radius},${lat},${lon}););out;`);
            const data = await response.json();
            
            return data.elements.map(item => ({
                lat: item.lat,
                lon: item.lon,
                name: item.tags?.name || 'Police Station',
                address: item.tags?.['addr:street'] || ''
            }));
        } catch (error) {
            console.error('Error fetching police stations:', error);
            // Fallback sample data
            return [
                { lat: -26.2002, lon: 28.0408, name: 'Johannesburg Central Police Station', address: '1 Commissioner St, Johannesburg' },
                { lat: -26.1931, lon: 28.0324, name: 'Hillbrow Police Station', address: '92 Kotze St, Hillbrow' }
            ];
        }
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
    
    // Emergency call button
    document.getElementById('emergencyCallBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to call the South African Police Emergency number (10111)?')) {
            window.location.href = 'tel:10111';
        }
    });
    
    // Track Me modal
    const trackMeBtn = document.getElementById('trackMeBtn');
    const trackMeModal = document.getElementById('trackMeModal');
    const closeModal = document.querySelector('.close-modal');
    const startTrackingBtn = document.getElementById('startTracking');
    const stopTrackingBtn = document.getElementById('stopTracking');
    const contactsList = document.getElementById('contactsList');
    const addContactBtn = document.getElementById('addContactBtn');
    let trackingInterval;
    let isTracking = false;
    
    // Load saved contacts from localStorage
    let contacts = JSON.parse(localStorage.getItem('safetyContacts') || [];
    
    // Render contacts
    function renderContacts() {
        contactsList.innerHTML = '';
        
        if (contacts.length === 0) {
            contactsList.innerHTML = '<p class="no-contacts">No contacts added yet.</p>';
            return;
        }
        
        contacts.forEach((contact, index) => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <div class="contact-info">
                    <span>${contact.name}</span>
                    <small>${contact.phone}</small>
                </div>
                <label class="switch">
                    <input type="checkbox" class="share-toggle" data-index="${index}" ${contact.shared ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
                <button class="delete-contact" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            contactsList.appendChild(contactItem);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-contact').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                contacts.splice(index, 1);
                localStorage.setItem('safetyContacts', JSON.stringify(contacts));
                renderContacts();
            });
        });
        
        // Add event listeners to toggle switches
        document.querySelectorAll('.share-toggle').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                contacts[index].shared = this.checked;
                localStorage.setItem('safetyContacts', JSON.stringify(contacts));
            });
        });
    }
    
    // Add new contact
    addContactBtn.addEventListener('click', function() {
        const name = document.getElementById('contactName').value.trim();
        const phone = document.getElementById('contactNumber').value.trim();
        
        if (!name || !phone) {
            alert('Please enter both name and phone number');
            return;
        }
        
        contacts.push({
            name,
            phone,
            shared: false
        });
        
        localStorage.setItem('safetyContacts', JSON.stringify(contacts));
        renderContacts();
        
        // Clear inputs
        document.getElementById('contactName').value = '';
        document.getElementById('contactNumber').value = '';
    });
    
    trackMeBtn.addEventListener('click', function() {
        renderContacts();
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
        
        // Get shared contacts
        const sharedContacts = contacts.filter(contact => contact.shared);
        
        if (sharedContacts.length === 0) {
            alert('You need to select at least one contact to share with');
            return;
        }
        
        // In a real app, this would send location to a server at intervals
        trackingInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(position => {
                console.log('Location shared:', position.coords);
                // Here you would send the location to your server
                // which would then notify the contacts
                
                // For demo purposes, we'll just log it
                const locationLink = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
                console.log(`Share this link with your contacts: ${locationLink}`);
                
                // In a real app, you would send SMS/email/notification to contacts
                sharedContacts.forEach(contact => {
                    console.log(`Notified ${contact.name} at ${contact.phone}`);
                });
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
    
    // News filtering and fetching
    const filterBtns = document.querySelectorAll('.filter-btn');
    const newsGrid = document.getElementById('newsGrid');
    
    // Function to fetch news from NewsAPI (you'll need an API key)
    async function fetchNews() {
        try {
            // Note: You'll need to sign up for a NewsAPI key at https://newsapi.org/
            const apiKey = 'YOUR_NEWSAPI_KEY'; // Replace with your actual key
            const response = await fetch(`https://newsapi.org/v2/everything?q=("women safety" OR "gender violence") AND "South Africa"&sortBy=publishedAt&pageSize=6&apiKey=${apiKey}`);
            const data = await response.json();
            
            return data.articles.map(article => ({
                title: article.title,
                excerpt: article.description,
                url: article.url,
                image: article.urlToImage || 'https://source.unsplash.com/random/600x400/?safety',
                date: new Date(article.publishedAt).toLocaleDateString(),
                source: article.source.name,
                // Categorize based on content
                category: article.title.toLowerCase().includes('assault') ? 'assault' : 
                         article.title.toLowerCase().includes('harass') ? 'harassment' : 'safety-tips'
            }));
        } catch (error) {
            console.error('Error fetching news:', error);
            // Fallback to sample data
            return getSampleNews();
        }
    }
    
    // Sample news data (fallback)
    function getSampleNews() {
        const currentDate = new Date();
        return [
            {
                id: 1,
                title: 'New Initiatives Combat Gender-Based Violence in South Africa',
                excerpt: 'Government and NGOs launch new programs to address rising GBV cases in urban areas.',
                category: 'assault',
                date: currentDate.toLocaleDateString(),
                image: 'https://source.unsplash.com/random/600x400/?protest',
                url: '#',
                source: 'News24'
            },
            {
                id: 2,
                title: 'Safety App Helps Women Report Incidents in Real-Time',
                excerpt: 'Local developers create app to help women alert authorities and contacts when in danger.',
                category: 'safety-tips',
                date: new Date(currentDate.getTime() - 86400000).toLocaleDateString(),
                image: 'https://source.unsplash.com/random/600x400/?app',
                url: '#',
                source: 'TechCentral'
            },
            {
                id: 3,
                title: 'Street Harassment Campaign Shows Positive Results',
                excerpt: 'Community initiative in Johannesburg reduces catcalling incidents by 30%.',
                category: 'harassment',
                date: new Date(currentDate.getTime() - 172800000).toLocaleDateString(),
                image: 'https://source.unsplash.com/random/600x400/?street',
                url: '#',
                source: 'Daily Maverick'
            }
        ];
    }
    
    // Display news articles
    async function displayNews(filter = 'all') {
        newsGrid.innerHTML = '<div class="news-loader"><i class="fas fa-spinner fa-spin"></i> Loading news...</div>';
        
        try {
            const newsData = await fetchNews();
            const filteredNews = filter === 'all' 
                ? newsData 
                : newsData.filter(item => item.category === filter);
            
            if (filteredNews.length === 0) {
                newsGrid.innerHTML = '<p class="no-news">No news articles found for this category.</p>';
                return;
            }
            
            newsGrid.innerHTML = '';
            
            filteredNews.forEach(item => {
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';
                newsCard.innerHTML = `
                    <div class="news-image">
                        <img src="${item.image}" alt="${item.title}" onerror="this.src='https://source.unsplash.com/random/600x400/?safety'">
                    </div>
                    <div class="news-content">
                        <span class="news-category ${item.category}">${item.category.replace('-', ' ')}</span>
                        <h3 class="news-title">${item.title}</h3>
                        <p class="news-excerpt">${item.excerpt}</p>
                        <div class="news-meta">
                            <span>${item.date} • ${item.source}</span>
                            <a href="${item.url}" target="_blank">Read More</a>
                        </div>
                    </div>
                `;
                newsGrid.appendChild(newsCard);
            });
        } catch (error) {
            console.error('Error displaying news:', error);
            newsGrid.innerHTML = '<p class="no-news">Could not load news. Please try again later.</p>';
        }
    }
    
    // Initial news display
    displayNews();
    
    // Auto-refresh news every 5 hours
    setInterval(() => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        displayNews(activeFilter);
    }, 5 * 60 * 60 * 1000);
    
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

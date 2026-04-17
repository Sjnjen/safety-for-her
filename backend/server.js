const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage
const incidents = [];

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Safe For Her API is running!',
        timestamp: new Date().toISOString()
    });
});

// ==================== ROOT ENDPOINT ====================
app.get('/', (req, res) => {
    res.json({ 
        name: 'Safe For Her SA API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            health: '/api/health',
            incidents: '/api/incidents',
            resources: '/api/resources',
            report: 'POST /api/incidents'
        }
    });
});

// ==================== GET ALL INCIDENTS ====================
app.get('/api/incidents', (req, res) => {
    res.json({ 
        success: true, 
        count: incidents.length,
        incidents: incidents.slice(-50).reverse()
    });
});

// ==================== REPORT NEW INCIDENT ====================
app.post('/api/incidents', (req, res) => {
    const { type, location, description, anonymous } = req.body;
    
    // Validation
    if (!type) {
        return res.status(400).json({ success: false, error: 'Incident type is required' });
    }
    if (!location) {
        return res.status(400).json({ success: false, error: 'Location is required' });
    }
    if (!description || description.length < 5) {
        return res.status(400).json({ success: false, error: 'Description must be at least 5 characters' });
    }
    
    const newIncident = {
        id: incidents.length + 1,
        type: type,
        location: location,
        description: description,
        anonymous: anonymous || false,
        timestamp: new Date().toISOString()
    };
    
    incidents.push(newIncident);
    
    console.log(`📝 New incident reported: ${type} at ${location}`);
    
    res.json({ 
        success: true, 
        message: 'Incident reported successfully',
        incident: newIncident
    });
});

// ==================== GET RESOURCES ====================
app.get('/api/resources', (req, res) => {
    res.json({
        success: true,
        emergency: [
            { name: 'Police Emergency', number: '10111', description: 'SAPS Emergency Line' },
            { name: 'Ambulance', number: '10177', description: 'Medical Emergency' },
            { name: 'GBV Command Centre', number: '0800 428 428', description: 'Gender-Based Violence Helpline' },
            { name: 'Childline', number: '0800 055 555', description: 'Child Protection' },
            { name: 'Lifeline', number: '0861 322 322', description: '24/7 Crisis Support' }
        ],
        shelters: [
            { name: 'POWA', phone: '011 642 4345', location: 'Johannesburg', services: 'Counseling, Legal Aid' },
            { name: 'TEARS Foundation', phone: '010 590 5920', location: 'Nationwide', services: '24/7 Support' },
            { name: 'Saartjie Baartman Centre', phone: '021 633 5287', location: 'Cape Town', services: 'Shelter, Counseling' }
        ],
        legal: [
            { name: 'Legal Aid SA', phone: '0800 110 110', service: 'Free Legal Advice' },
            { name: "Women's Legal Centre", phone: '021 424 5660', service: 'Legal Representation' }
        ]
    });
});

// ==================== GET STATISTICS ====================
app.get('/api/stats', (req, res) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentIncidents = incidents.filter(i => new Date(i.timestamp) > weekAgo);
    
    const typeCount = {
        assault: incidents.filter(i => i.type === 'assault').length,
        harassment: incidents.filter(i => i.type === 'harassment').length,
        theft: incidents.filter(i => i.type === 'theft').length,
        stalking: incidents.filter(i => i.type === 'stalking').length,
        other: incidents.filter(i => i.type === 'other').length
    };
    
    res.json({
        success: true,
        totalReports: incidents.length,
        reportsThisWeek: recentIncidents.length,
        byType: typeCount,
        lastUpdated: now.toISOString()
    });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found',
        availableEndpoints: ['/', '/api/health', '/api/incidents', '/api/resources', '/api/stats']
    });
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Safe For Her API is running!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Health check: http://localhost:${PORT}/api/health`);
});

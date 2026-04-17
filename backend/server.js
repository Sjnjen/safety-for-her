const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// In-memory storage (for demo)
const incidents = [];
const users = [];

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Report incident
app.post('/api/incidents', [
    body('type').isIn(['assault', 'harassment', 'theft', 'stalking', 'other']),
    body('location').notEmpty(),
    body('description').notEmpty().min(10)
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const incident = {
        id: incidents.length + 1,
        ...req.body,
        timestamp: new Date().toISOString(),
        verified: false
    };
    
    incidents.push(incident);
    res.status(201).json({ message: 'Report submitted', id: incident.id });
});

// Get incidents
app.get('/api/incidents', (req, res) => {
    res.json({ incidents: incidents.slice(-50) });
});

// Get resources
app.get('/api/resources', (req, res) => {
    res.json({
        emergency: [
            { name: 'Police', number: '10111' },
            { name: 'Ambulance', number: '10177' },
            { name: 'GBV Helpline', number: '0800428428' }
        ],
        shelters: [
            { name: 'POWA', phone: '0116424345' },
            { name: 'TEARS Foundation', phone: '0105905920' }
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

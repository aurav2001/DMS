const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy for correct protocol detection on Vercel

// Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'PROPFIND', 'LOCK', 'UNLOCK'],
    allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization', 'Depth', 'Destination', 'Overwrite', 'If', 'If-Match', 'Lock-Token', 'Timeout'],
    credentials: true,
    exposedHeaders: ['Lock-Token', 'ETag', 'Content-Disposition']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Route for status check
app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.json({ message: 'DocVault API is running', status: 'OK' });
});

// Routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const folderRoutes = require('./routes/folders');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// DB Connection
console.log('Attempting to connect to MongoDB...');
if (!process.env.MONGO_URI) {
    console.error('CRITICAL: MONGO_URI is not defined in environment variables');
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected Successfully');
        
        // Auto-Seed Admin if DB is empty
        try {
            const userCount = await User.countDocuments();
            if (userCount === 0) {
                console.log('No users found. Seeding default admin...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const admin = new User({
                    name: 'System Admin',
                    email: 'admin@docvault.com',
                    password: hashedPassword,
                    role: 'Admin'
                });
                await admin.save();
                console.log('Default Admin Created: admin@docvault.com / admin123');
            }
        } catch (seedErr) {
            console.error('Seeding Error:', seedErr);
        }
    })
    .catch(err => {
        console.error('CRITICAL: MongoDB connection error details:');
        console.error(err);
    });

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

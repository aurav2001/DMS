const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure MongoDB is connected before handling any /api request.
// In serverless (Vercel), this awaits the cached connection promise so
// queries don't run on a buffering connection.
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('DB connect middleware failed:', err.message);
        res.status(503).json({ message: 'Database unavailable, please retry' });
    }
});

// Root Route for status check
app.get('/', (req, res) => {
    res.json({ message: 'DocVault API is running', status: 'OK' });
});

// Routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    // Local dev: open the connection eagerly and start listening.
    connectDB().catch((err) => console.error('Initial DB connect failed:', err.message));
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

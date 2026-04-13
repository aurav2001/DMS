const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['https://dms-frontend-sandy.vercel.app', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Route for status check
app.get('/', (req, res) => {
    res.json({ message: 'DocVault API is running', status: 'OK' });
});

// Routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

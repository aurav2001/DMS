const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
    return res.status(403).json({ message: 'Self-registration is disabled. Please contact the administrator to create an account.' });
    try {
        const { name, email, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword });
        
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user: { id: user._id, name, email, role: user.role } });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getUsersList = async (req, res) => {
    try {
        const users = await User.find().select('name email');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { register, login, getMe, getUsersList };

const User = require('../models/User');
const Document = require('../models/Document');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/email');

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Send Email Notification
        await sendEmail({
            email: user.email,
            subject: 'DocVault - User Role Updated',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0284c7;">Role Updated</h2>
                    <p>Hello <b>${user.name}</b>,</p>
                    <p>Your account role has been updated to: <b style="color: #0284c7;">${role}</b>.</p>
                    <p>If you have any questions, please contact your administrator.</p>
                    <br/>
                    <p>Best regards,<br/>DocVault Team</p>
                </div>
            `
        });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        await Document.deleteMany({ uploadedBy: req.params.id });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User and their documents deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get admin stats
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDocs = await Document.countDocuments({ isDeleted: false });
        const totalStorage = await Document.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]);
        const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);
        const recentDocs = await Document.find({ isDeleted: false })
            .select('-fileData')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 }).limit(5);

        res.json({
            totalUsers,
            totalDocs,
            totalStorage: totalStorage[0]?.total || 0,
            recentUsers,
            recentDocs
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all documents (admin)
const getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .select('-fileData')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(documents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update document permissions
const updateDocPermissions = async (req, res) => {
    try {
        const { permissions, accessLevel } = req.body;
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        
        const doc = await Document.findByIdAndUpdate(
            id,
            { permissions, accessLevel },
            { new: true }
        ).select('-fileData');
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create new user (Admin only)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            role: role || 'Viewer' 
        });
        
        await newUser.save();
        
        // Send Welcome Email
        await sendEmail({
            email: newUser.email,
            subject: 'Welcome to DocVault - Account Created',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0284c7;">Welcome to DocVault!</h2>
                    <p>Hello <b>${name}</b>,</p>
                    <p>Admin has created an account for you with the following details:</p>
                    <ul style="background: #f0f9ff; padding: 15px; border-radius: 10px; list-style: none;">
                        <li><b>Email:</b> ${email}</li>
                        <li><b>Temporary Password:</b> ${password}</li>
                        <li><b>Role:</b> ${role || 'Viewer'}</li>
                    </ul>
                    <p>Please login and change your password for security.</p>
                    <p><a href="${process.env.VITE_APP_URL || '#'}/login" style="display: inline-block; padding: 10px 20px; background: #0284c7; color: white; text-decoration: none; border-radius: 5px;">Login to Your Account</a></p>
                    <br/>
                    <p>Best regards,<br/>DocVault Team</p>
                </div>
            `
        });

        const createdUser = newUser.toObject();
        delete createdUser.password;
        res.status(201).json(createdUser);
    } catch (err) {
        console.error('Admin Create User Error:', err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getStats, getAllDocuments, updateDocPermissions, createUser };

const express = require('express');
const { getAllUsers, updateUserRole, deleteUser, getStats, getAllDocuments, updateDocPermissions, createUser } = require('../controllers/admin');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/stats', auth, adminAuth, getStats);
router.get('/users', auth, adminAuth, getAllUsers);
router.post('/users', auth, adminAuth, createUser);
router.patch('/users/:id/role', auth, adminAuth, updateUserRole);
router.delete('/users/:id', auth, adminAuth, deleteUser);
router.get('/documents', auth, adminAuth, getAllDocuments);
router.patch('/documents/:id/permissions', auth, adminAuth, updateDocPermissions);

module.exports = router;

const express = require('express');
const { 
    uploadDocument, 
    getDocuments, 
    deleteDocument, 
    toggleStar,
    shareDocument
} = require('../controllers/documents');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');
const router = express.Router();

router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.delete('/:id', auth, deleteDocument);
router.patch('/:id/star', auth, toggleStar);
router.post('/:id/share', auth, shareDocument);

module.exports = router;

const express = require('express');
const { 
    uploadDocument, 
    getDocuments, 
    deleteDocument, 
    toggleStar,
    shareDocument,
    downloadDocument
} = require('../controllers/documents');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');
const router = express.Router();

router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.get('/download/:id', auth, downloadDocument);
router.delete('/:id', auth, deleteDocument);
router.patch('/:id/star', auth, toggleStar);
router.post('/:id/share', auth, shareDocument);

module.exports = router;

const express = require('express');
const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || 'https://documentserver.onlyoffice.com';
const router = express.Router();
const Document = require('../models/Document');
const { downloadFromSFTP, uploadToSFTP } = require('../utils/sftp');
const axios = require('axios');

/**
 * @route   GET api/onlyoffice/status
 * @desc    Check if ONLYOFFICE routes are active
 */
router.get('/status', (req, res) => {
    res.json({ 
        status: 'active', 
        configured_url: ONLYOFFICE_URL,
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   GET api/onlyoffice/download/:docId
 * @desc    Fetch file for ONLYOFFICE Document Server
 * @access  Public (Used by ONLYOFFICE Server)
 */
router.get('/download/:docId', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.docId);
        if (!doc) {
            console.error(`[OnlyOffice] Document not found: ${req.params.docId}`);
            return res.status(404).send('Document not found');
        }

        console.log(`[OnlyOffice] DS requesting download for: ${doc.title} (${doc._id}) [Storage: ${doc.storageType}]`);

        // Set appropriate content type
        const ext = doc.fileName.split('.').pop().toLowerCase();
        const mimeTypes = {
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'ppt': 'application/vnd.ms-powerpoint',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'odt': 'application/vnd.oasis.opendocument.text',
            'ods': 'application/vnd.oasis.opendocument.spreadsheet'
        };
        
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);

        if (doc.storageType === 'mongodb') {
            if (!doc.fileData) {
                console.error(`[OnlyOffice] No file data found in MongoDB for ${doc._id}`);
                return res.status(404).send('File data missing');
            }
            console.log(`[OnlyOffice] Sending file from MongoDB (${doc.fileData.length} bytes)`);
            return res.send(doc.fileData);
        } else if (doc.storageType === 'sftp') {
            const data = await downloadFromSFTP(doc.storagePath);
            console.log(`[OnlyOffice] Successfully fetched ${doc.title} from SFTP, sending to DS...`);
            return res.send(data);
        } else {
            console.warn(`[OnlyOffice] Unsupported storage type: ${doc.storageType}`);
            return res.status(400).send(`Unsupported storage type: ${doc.storageType}`);
        }
    } catch (err) {
        console.error('[OnlyOffice Download Error]', err);
        res.status(500).send('Server Error during file download');
    }
});

/**
 * @route   POST api/onlyoffice/callback/:docId
 * @desc    ONLYOFFICE Callback handler (Saving)
 * @access  Public
 */
router.post('/callback/:docId', async (req, res) => {
    try {
        const { status, url } = req.body;
        const docId = req.params.docId;

        console.log(`[OnlyOffice Callback] Doc: ${docId}, Status: ${status}`);

        // Status 2 - Document is ready for saving (after user closes)
        // Status 6 - Document is being edited but should be saved (forcesave)
        if (status === 2 || status === 6) {
            const doc = await Document.findById(docId);
            if (!doc) {
                console.error(`[OnlyOffice Callback] Document ${docId} not found for saving`);
                return res.json({ error: 1 });
            }

            console.log(`[OnlyOffice] Saving document ${doc.title} from URL: ${url}`);
            
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const fileBuffer = Buffer.from(response.data);

            if (doc.storageType === 'mongodb') {
                doc.fileData = fileBuffer;
                doc.fileSize = fileBuffer.length;
                doc.updatedAt = Date.now();
                await doc.save();
                console.log(`[OnlyOffice] Successfully saved ${doc.title} to MongoDB`);
            } else if (doc.storageType === 'sftp') {
                await uploadToSFTP(fileBuffer, doc.storagePath);
                doc.fileSize = fileBuffer.length;
                doc.updatedAt = Date.now();
                await doc.save();
                console.log(`[OnlyOffice] Successfully saved ${doc.title} to SFTP`);
            } else {
                console.warn(`[OnlyOffice Callback] Storage type ${doc.storageType} not supported for saving`);
            }
        }

        res.json({ error: 0 });
    } catch (err) {
        console.error('[OnlyOffice Callback Error]', err);
        res.json({ error: 1 });
    }
});

module.exports = router;

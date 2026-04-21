const Document = require('../models/Document');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { uploadToSFTP, downloadFromSFTP } = require('../utils/sftp');
const cloudinary = require('cloudinary').v2;

/**
 * Handle WebDAV requests from MS Office
 * Expected URL: /api/documents/dav/:id/:token/:filename
 */
const handleWebDAV = async (req, res) => {
    try {
        const { id, token } = req.params;
        const method = req.method.toUpperCase();

        // 1. Verify Authentication
        let user;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            user = await User.findById(decoded.id);
            if (!user) throw new Error('User not found');
        } catch (err) {
            console.error('[WEBDAV] Auth Failed:', err.message);
            return res.status(401).send('Unauthorized');
        }

        // 2. Find Document
        const document = await Document.findById(id);
        if (!document) return res.status(404).send('Not Found');

        console.log(`[WEBDAV] Request: ${method} for ${document.title} by ${user.name}`);

        // 3. Method Handlers
        switch (method) {
            case 'OPTIONS':
                res.set({
                    'DAV': '1, 2',
                    'Allow': 'OPTIONS, PROPFIND, GET, PUT, LOCK, UNLOCK',
                    'MS-Author-Via': 'DAV'
                });
                return res.status(200).send();

            case 'PROPFIND':
                // Office uses PROPFIND to check file existence and metadata
                const xml = `<?xml version="1.0" encoding="utf-8" ?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${req.originalUrl}</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>${document.fileName}</D:displayname>
        <D:getcontentlength>${document.fileSize}</D:getcontentlength>
        <D:getcontenttype>${document.fileType}</D:getcontenttype>
        <D:resourcetype/>
        <D:getlastmodified>${new Date(document.updatedAt).toUTCString()}</D:getlastmodified>
        <D:creationdate>${new Date(document.createdAt).toISOString()}</D:creationdate>
        <D:supportedlock>
          <D:lockentry>
            <D:lockscope><D:exclusive/></D:lockscope>
            <D:locktype><D:write/></D:locktype>
          </D:lockentry>
        </D:supportedlock>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;
                res.set('Content-Type', 'text/xml; charset="utf-8"');
                return res.status(207).send(xml);

            case 'LOCK':
                // Office locks file before editing
                const lockToken = `opaquelocktoken:${Date.now()}`;
                document.webdavLock = {
                    token: lockToken,
                    owner: user._id,
                    expiresAt: new Date(Date.now() + 3600000) // 1 hour
                };
                await document.save();
                
                const lockXml = `<?xml version="1.0" encoding="utf-8" ?>
<D:prop xmlns:D="DAV:">
  <D:lockdiscovery>
    <D:activelock>
      <D:locktype><D:write/></D:locktype>
      <D:lockscope><D:exclusive/></D:lockscope>
      <D:depth>0</D:depth>
      <D:owner>${user.name}</D:owner>
      <D:timeout>Second-3600</D:timeout>
      <D:locktoken><D:href>${lockToken}</D:href></D:locktoken>
    </D:activelock>
  </D:lockdiscovery>
</D:prop>`;
                res.set({
                    'Content-Type': 'text/xml; charset="utf-8"',
                    'Lock-Token': `<${lockToken}>`
                });
                return res.status(200).send(lockXml);

            case 'UNLOCK':
                document.webdavLock = undefined;
                await document.save();
                return res.status(204).send();

            case 'GET':
                // Satisfy GET request if Office decides to download via DAV route
                res.set({
                    'Content-Type': document.fileType,
                    'Content-Disposition': `attachment; filename="${document.fileName}"`
                });

                if (document.storageType === 'local' && document.storagePath) {
                    const filePath = path.join(process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads'), document.storagePath);
                    if (fs.existsSync(filePath)) return fs.createReadStream(filePath).pipe(res);
                } else if (document.storageType === 'sftp' && document.storagePath) {
                    const data = await downloadFromSFTP(document.storagePath);
                    return res.send(data);
                } else if (document.storageType === 'cloudinary') {
                    return res.redirect(document.fileUrl);
                }

                if (!document.fileData) return res.status(404).send('File content not found');
                return res.send(document.fileData);

            case 'PUT':
                // THIS IS THE AUTO-SAVE TRIGGER
                // Office sends the body as raw binary data
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', async () => {
                    const buffer = Buffer.concat(chunks);
                    console.log(`[WEBDAV] Saving ${buffer.length} bytes back to ${document.title}`);

                    // Save according to storage type
                    if (document.storageType === 'local') {
                        const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
                        const filePath = path.join(storageDir, document.storagePath);
                        fs.writeFileSync(filePath, buffer);
                    } else if (document.storageType === 'sftp') {
                        await uploadToSFTP(buffer, document.storagePath);
                    } else if (document.storageType === 'cloudinary') {
                        // Cloudinary overwrite
                        await new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream(
                                { resource_type: 'raw', public_id: document.storagePath, overwrite: true },
                                (err, res) => err ? reject(err) : resolve(res)
                            );
                            uploadStream.end(buffer);
                        });
                    } else {
                        document.fileData = buffer;
                    }

                    document.fileSize = buffer.length;
                    document.updatedAt = Date.now();
                    await document.save();
                    
                    res.status(204).send();
                });
                break;

            default:
                return res.status(405).send('Method Not Allowed');
        }
    } catch (err) {
        console.error('[WEBDAV] Error:', err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { handleWebDAV };

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
        const documentData = await Document.findById(id);
        if (!documentData) return res.status(404).send('Not Found');

        const etag = `"${documentData.updatedAt.getTime()}-${documentData.fileSize}"`;
        console.log(`[WEBDAV] Request: ${method} for ${documentData.title} by ${user.name}`);

        // 3. Method Handlers
        switch (method) {
            case 'OPTIONS':
                res.set({
                    'DAV': '1, 2',
                    'Allow': 'OPTIONS, PROPFIND, GET, PUT, LOCK, UNLOCK',
                    'MS-Author-Via': 'DAV',
                    'Accept-Ranges': 'bytes'
                });
                return res.status(200).send();

            case 'PROPFIND':
                const xml = `<?xml version="1.0" encoding="utf-8" ?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${req.originalUrl}</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>${documentData.fileName}</D:displayname>
        <D:getcontentlength>${documentData.fileSize}</D:getcontentlength>
        <D:getcontenttype>${documentData.fileType}</D:getcontenttype>
        <D:getetag>${etag}</D:getetag>
        <D:resourcetype/>
        <D:getlastmodified>${new Date(documentData.updatedAt).toUTCString()}</D:getlastmodified>
        <D:creationdate>${new Date(documentData.createdAt).toISOString()}</D:creationdate>
        <D:supportedlock>
          <D:lockentry>
            <D:lockscope><D:exclusive/></D:lockscope>
            <D:locktype><D:write/></D:locktype>
          </D:lockentry>
        </D:supportedlock>
        <D:lockdiscovery>
            ${documentData.webdavLock?.token ? `
            <D:activelock>
                <D:locktype><D:write/></D:locktype>
                <D:lockscope><D:exclusive/></D:lockscope>
                <D:depth>0</D:depth>
                <D:owner>${user.name}</D:owner>
                <D:timeout>Second-3600</D:timeout>
                <D:locktoken><D:href>${documentData.webdavLock.token}</D:href></D:locktoken>
            </D:activelock>` : ''}
        </D:lockdiscovery>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;
                res.set({
                    'Content-Type': 'text/xml; charset="utf-8"',
                    'ETag': etag
                });
                return res.status(207).send(xml);

            case 'LOCK':
                const lockToken = documentData.webdavLock?.token || `opaquelocktoken:${Date.now()}`;
                
                // Update or create lock
                documentData.webdavLock = {
                    token: lockToken,
                    owner: user._id,
                    expiresAt: new Date(Date.now() + 3600000)
                };
                await documentData.save();
                
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
                documentData.webdavLock = undefined;
                await documentData.save();
                return res.status(204).send();

            case 'GET':
                res.set({
                    'Content-Type': documentData.fileType,
                    'Content-Disposition': `attachment; filename="${documentData.fileName}"`,
                    'ETag': etag
                });

                if (documentData.storageType === 'local' && documentData.storagePath) {
                    const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
                    const filePath = path.join(storageDir, documentData.storagePath);
                    if (fs.existsSync(filePath)) return fs.createReadStream(filePath).pipe(res);
                } else if (documentData.storageType === 'sftp' && documentData.storagePath) {
                    const data = await downloadFromSFTP(documentData.storagePath);
                    return res.send(data);
                } else if (documentData.storageType === 'cloudinary') {
                    return res.redirect(documentData.fileUrl);
                }

                if (!documentData.fileData) return res.status(404).send('File content not found');
                return res.send(documentData.fileData);

            case 'PUT':
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', async () => {
                    const buffer = Buffer.concat(chunks);
                    
                    if (documentData.storageType === 'local') {
                        const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
                        const filePath = path.join(storageDir, documentData.storagePath);
                        fs.writeFileSync(filePath, buffer);
                    } else if (documentData.storageType === 'sftp') {
                        await uploadToSFTP(buffer, documentData.storagePath);
                    } else if (documentData.storageType === 'cloudinary') {
                        await new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream(
                                { resource_type: 'raw', public_id: documentData.storagePath, overwrite: true },
                                (err, res) => err ? reject(err) : resolve(res)
                            );
                            uploadStream.end(buffer);
                        });
                    } else {
                        documentData.fileData = buffer;
                    }

                    documentData.fileSize = buffer.length;
                    documentData.updatedAt = Date.now();
                    await documentData.save();
                    
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

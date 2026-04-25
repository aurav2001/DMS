const Client = require('ssh2-sftp-client');

const getSftpConfig = () => {
    const config = {
        host: (process.env.SFTP_HOST || '').trim(),
        port: parseInt((process.env.SFTP_PORT || '22').trim()) || 22,
        username: (process.env.SFTP_USERNAME || '').trim(),
        password: (process.env.SFTP_PASSWORD || '').trim(),
        basePath: (process.env.SFTP_BASE_PATH || '/uploads').trim()
    };
    console.log('[SFTP Config Debug] Host:', config.host, 'Port:', config.port, 'User:', config.username, 'BasePath:', config.basePath);
    return config;
};

const uploadToSFTP = async (fileBuffer, remotePath) => {
    const sftp = new Client();
    const config = getSftpConfig();
    
    // Ensure absolute path
    const finalPath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    
    console.log(`[SFTP] Attempting upload to: ${finalPath}`);
    console.log(`[SFTP] Target Host: ${config.host}`);

    try {
        await sftp.connect({
            ...config,
            readyTimeout: 30000, // Increase to 30 seconds for slow connections
            retries: 2,
            retry_factor: 2,
            retry_minTimeout: 2000
        });
        
        console.log(`[SFTP] Connected successfully. Checking paths...`);
        
        // Extract directory and ensure it exists
        const parts = finalPath.split('/');
        if (parts.length > 2) { // e.g. /docvault/General/pdf/file.txt -> /docvault/General/pdf
            const remoteDir = parts.slice(0, -1).join('/');
            console.log(`[SFTP] Ensuring directory exists: ${remoteDir}`);
            
            try {
                const exists = await sftp.exists(remoteDir);
                if (!exists) {
                    console.log(`[SFTP] Creating directory recursively: ${remoteDir}`);
                    await sftp.mkdir(remoteDir, true);
                }
            } catch (dirErr) {
                console.warn(`[SFTP] Directory check/create warning:`, dirErr.message);
                // Continue anyway, put() will fail if dir really doesn't exist
            }
        }

        console.log(`[SFTP] Uploading buffer (${fileBuffer.length} bytes)...`);
        await sftp.put(fileBuffer, finalPath);
        console.log(`[SFTP] SUCCESS: Upload complete for ${finalPath}`);
        return true;
    } catch (err) {
        console.error('[SFTP] CRITICAL ERROR:', {
            message: err.message,
            code: err.code,
            path: finalPath
        });
        throw err;
    } finally {
        await sftp.end();
    }
};

const downloadFromSFTP = async (remotePath) => {
    const sftp = new Client();
    const config = getSftpConfig();
    
    try {
        await sftp.connect(config);
        console.log(`[SFTP] Downloading: ${remotePath}`);
        const data = await sftp.get(remotePath);
        return data;
    } catch (err) {
        console.error('[SFTP] Download Error:', err.message);
        throw err;
    } finally {
        await sftp.end();
    }
};

module.exports = { uploadToSFTP, downloadFromSFTP };

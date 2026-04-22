const Client = require('ssh2-sftp-client');

const getSftpConfig = () => ({
    host: process.env.SFTP_HOST,
    port: parseInt(process.env.SFTP_PORT) || 22,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
});

const uploadToSFTP = async (fileBuffer, remotePath) => {
    const sftp = new Client();
    const config = getSftpConfig();
    
    console.log(`[SFTP] Attempting upload to: ${remotePath}`);
    console.log(`[SFTP] Host: ${config.host}, User: ${config.username}`);

    try {
        await sftp.connect(config);
        console.log(`[SFTP] Connected successfully`);
        
        // Extract directory and ensure it exists
        const parts = remotePath.split('/');
        if (parts.length > 1) {
            const remoteDir = parts.slice(0, -1).join('/');
            console.log(`[SFTP] Checking directory: ${remoteDir}`);
            const exists = await sftp.exists(remoteDir);
            if (!exists) {
                console.log(`[SFTP] Creating directory: ${remoteDir}`);
                await sftp.mkdir(remoteDir, true);
            }
        }

        console.log(`[SFTP] Putting file...`);
        await sftp.put(fileBuffer, remotePath);
        console.log(`[SFTP] Upload complete: ${remotePath}`);
        return true;
    } catch (err) {
        console.error('[SFTP] Upload Error details:', {
            message: err.message,
            code: err.code,
            remotePath
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

const { execSync } = require('child_process');

const envs = {
    STORAGE_TYPE: 'sftp',
    SFTP_HOST: 'server13.ftpgrid.com',
    SFTP_PORT: '22',
    SFTP_USERNAME: 'J3U.ep5jhnwt',
    SFTP_PASSWORD: 'tqE|%moRXO?/[-{unwF]aJy07>#pN7^~',
    SFTP_BASE_PATH: '/docvault',
    BACKEND_URL: 'https://dms-backend-zeta.vercel.app',
    NODE_ENV: 'production',
    ONLYOFFICE_URL: 'https://documentserver.onlyoffice.com'
};

const setEnv = (name, value) => {
    console.log(`Setting ${name}...`);
    try {
        // Use stdin to avoid shell interpretation issues
        execSync(`vercel env add ${name} production --force`, {
            input: value,
            encoding: 'utf8'
        });
        console.log(`SUCCESS: ${name} set.`);
    } catch (err) {
        console.error(`FAILED: ${name}: ${err.message}`);
    }
};

for (const [name, value] of Object.entries(envs)) {
    setEnv(name, value);
}

console.log('\n--- FINISHED ---');
console.log('Now run "vercel deploy --prod" to apply changes.');

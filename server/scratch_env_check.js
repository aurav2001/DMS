require('dotenv').config();

console.log('STORAGE_TYPE:', process.env.STORAGE_TYPE);
console.log('SFTP_HOST:', process.env.SFTP_HOST);
console.log('SFTP_USERNAME:', process.env.SFTP_USERNAME);
console.log('SFTP_PASSWORD_LENGTH:', process.env.SFTP_PASSWORD ? process.env.SFTP_PASSWORD.length : 0);
console.log('SFTP_PASSWORD_STARTS_WITH_QUOTE:', process.env.SFTP_PASSWORD ? process.env.SFTP_PASSWORD.startsWith('"') : false);
console.log('SFTP_BASE_PATH:', process.env.SFTP_BASE_PATH);

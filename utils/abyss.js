// utils/abyss.js

const fs = require('fs/promises');
const axios = require('axios');

/**
 * Uploads a local file to Abyss via Cloudflare Worker.
 * @param {string} localFilePath - Path to the file on VPS.
 * @param {string} fileName - The filename to send to Abyss.
 * @param {string} host - The host (abyss or rpm).
 * @param {string} workerBaseUrl - Base URL of your Cloudflare Worker.
 * @returns {Promise<object>} - Structured JSON result from the Worker.
 */
async function upload(localFilePath, fileName, host, workerBaseUrl) {
    const fileBuffer = await fs.readFile(localFilePath);
    const workerEndpoint = host === 'abyss' ? '/abyss-upload' : '/rpm-upload';
    
    // Replace with your actual Worker API Key
    const workerApiKey = 'YOUR_SECRET_WORKER_KEY'; 
    
    try {
        const response = await axios({
            method: 'POST',
            url: `${workerBaseUrl}${workerEndpoint}?key=${workerApiKey}&filename=${fileName}`,
            data: fileBuffer,
            headers: {
                'Content-Type': 'application/octet-stream', // Sending raw binary data
                'File-Name': fileName // Optional header for filename if URL param is too short
            }
        });

        // 7. Worker sends structured JSON to VPS
        return response.data; // This is the structured JSON from the Worker

    } catch (error) {
        console.error('Error communicating with Cloudflare Worker:', error.message);
        return {
            status: 'error',
            message: `Worker communication failed: ${error.message}`
        };
    }
}

module.exports = { upload };

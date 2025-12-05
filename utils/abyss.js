import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";
import config from "../config.js";

export async function uploadToAbyssLocal(filePath) {
    try {
        const apiKey = config.abyss_key;

        const file = fs.readFileSync(filePath);

        const response = await fetch(
            `${config.worker_url}/abyss-upload?key=${apiKey}`,
            {
                method: "POST",
                body: file
            }
        );

        return await response.json();
    } catch (err) {
        return { status: "error", message: err.message };
    }
}


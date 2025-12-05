import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";
import config from "../config.js";

export async function uploadToAbyssLocal(filePath) {
    try {
        const apiKey = config.abyss_key;

        if (!fs.existsSync(filePath)) {
            return { status: "error", message: "Temp file not found" };
        }

        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));

        const upload = await fetch(`https://up.abyss.to/${apiKey}`, {
            method: "POST",
            body: form
        });

        const data = await upload.json();

        if (!data.slug) {
            return { status: "error", message: "Abyss upload failed", full: data };
        }

        return {
            status: "success",
            link: `https://abysscdn.com/embed/${data.slug}`
        };

    } catch (err) {
        return { status: "error", message: err.message };
    }
}

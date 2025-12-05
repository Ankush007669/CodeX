import fetch from "node-fetch";
import config from "../config.js";

export async function uploadAbyss(fileId) {

    // LOGIN
    const login = await fetch("https://api.abyss.to/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "YOUR_EMAIL",
            password: "YOUR_PASSWORD"
        })
    });

    const loginData = await login.json();

    if (!loginData.token) {
        return { status: "error", message: "Abyss login failed", full: loginData };
    }

    const token = loginData.token;

    // REMOTE UPLOAD
    const remote = await fetch(`https://api.abyss.to/v1/remote/${fileId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    const remoteData = await remote.json();

    if (!remoteData.id) {
        return { status: "error", message: "Remote upload failed", full: remoteData };
    }

    // EMBED URL
    return {
        status: "success",
        link: `https://abysscdn.com/embed/${remoteData.id}`
    };
}

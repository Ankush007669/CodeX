import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import config from "../config.js";

export async function uploadRPM(filePath) {
    
    // Step 1: Fetch upload server
    const srv = await fetch(`https://rpmshare.com/api/upload/server?key=${config.rpm_key}`, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
        }
    });

    const srvData = await srv.json();
    const uploadUrl = srvData?.result;

    if (!uploadUrl) {
        return {
            status: "error",
            message: "RPM upload server fetch failed",
            full_response: srvData
        };
    }

    // Step 2: FormData with browser-like parameters
    const form = new FormData();
    form.append("key", config.rpm_key);
    form.append("files[]", fs.createReadStream(filePath), {
        filename: "mirror.mp4",
        contentType: "video/mp4"
    });

    // Step 3: Browser fingerprint headers (bypass)
    const headers = {
        ...form.getHeaders(),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://rpmshare.com",
        "Referer": "https://rpmshare.com/upload",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty"
    };

    // Step 4: Upload
    const up = await fetch(uploadUrl, {
        method: "POST",
        body: form,
        redirect: "follow",
        headers
    });

    const data = await up.json().catch(() => null);

    // Step 5: Check file accepted
    if (!data?.files || data.files.length === 0) {
        return {
            status: "error",
            message: "RPM upload failed (server blocked VPS)",
            full_response: data
        };
    }

    // Step 6: Success
    const filecode = data.files[0]?.filecode;

    return {
        status: "success",
        link: `https://rpmshare.com/embed-${filecode}.html`
    };
}

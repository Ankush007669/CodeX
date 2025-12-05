import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import config from "../config.js";

export async function uploadRPM(filePath) {

    // STEP 1 — Fetch Upload Server URL
    const srv = await fetch(`https://rpmshare.com/api/upload/server?key=${config.rpm_key}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
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

    // STEP 2 — FORM-DATA (REAL FIX HERE)
    const form = new FormData();

    // rpm legacy requires files[] instead of file
    form.append("files[]", fs.createReadStream(filePath), {
        filename: "upload.mp4",
        contentType: "video/mp4"
    });

    form.append("key", config.rpm_key);


    // STEP 3 — SEND REQUEST
    const up = await fetch(uploadUrl, {
        method: "POST",
        body: form,
        redirect: "follow",
        headers: {
            ...form.getHeaders(),
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*",
            "Origin": "https://rpmshare.com",
            "Referer": "https://rpmshare.com/"
        }
    });

    const data = await up.json().catch(() => null);

    // STEP 4 — VERIFY FILE RECEIVED
    if (!data?.files || data.files.length === 0) {
        return {
            status: "error",
            message: "RPM upload failed",
            full_response: data
        };
    }

    // STEP 5 — GET EMBED LINK
    const filecode = data.files[0]?.filecode;

    if (!filecode) {
        return {
            status: "error",
            message: "Filecode missing",
            full_response: data
        };
    }

    return {
        status: "success",
        link: `https://rpmshare.com/embed-${filecode}.html`
    };
}

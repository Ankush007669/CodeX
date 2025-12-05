import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import config from "../config.js";

export async function uploadRPM(filePath) {
    
    // 1) Fetch upload server URL
    const srv = await fetch(`https://rpmshare.com/api/upload/server?key=${config.rpm_key}`, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*"
        }
    });

    const srvData = await srv.json();
    const uploadUrl = srvData?.result;

    if (!uploadUrl || typeof uploadUrl !== "string") {
        return {
            status: "error",
            message: "RPM upload server fetch failed",
            full_response: srvData
        };
    }

    // 2) Prepare form-data
    const form = new FormData();
    form.append("key", config.rpm_key);
    form.append("file", fs.createReadStream(filePath), {
        filename: "video.mp4",
        contentType: "video/mp4"
    });

    // 3) Upload file
    const up = await fetch(uploadUrl, {
        method: "POST",
        body: form,
        redirect: "follow",
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*",
            "Origin": "https://rpmshare.com",
            "Referer": "https://rpmshare.com/"
        }
    });

    const data = await up.json().catch(() => null);

    if (!data?.result?.filecode) {
        return {
            status: "error",
            message: "RPM upload failed",
            full_response: data
        };
    }

    return {
        status: "success",
        link: `https://rpmshare.com/embed-${data.result.filecode}.html`
    };
}

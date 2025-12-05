import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import config from "../config.js";

export async function uploadRPM(filePath) {

    // 1. Fetch upload server URL
    const srv = await fetch(`https://rpmshare.com/api/upload/server?key=${config.rpm_key}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    const srvData = await srv.json();

    // RPM returns upload URL directly as STRING inside "result"
    const uploadUrl = srvData?.result;

    if (!uploadUrl || typeof uploadUrl !== "string") {
        return {
            status: "error",
            message: "RPM upload server fetch failed",
            full_response: srvData
        };
    }

    // 2. Upload file
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("key", config.rpm_key);

    const up = await fetch(uploadUrl, {
        method: "POST",
        body: form,
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await up.json();

    if (!data?.result?.filecode) {
        return {
            status: "error",
            message: "RPM upload failed",
            full_response: data
        };
    }

    // 3. Final embed link
    return {
        status: "success",
        link: `https://rpmshare.com/embed-${data.result.filecode}.html`
    };
}

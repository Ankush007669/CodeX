import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import config from "../config.js";

export async function uploadRPM(filePath) {
    // Fetch upload server
    const srv = await fetch(`https://rpmshare.com/api/upload/server?key=${config.rpm_key}`, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    const srvData = await srv.json();

    const uploadUrl = srvData?.result?.url;

    if (!uploadUrl) {
        return {
            status: "error",
            message: "RPM upload server fetch failed",
            full_response: srvData
        };
    }

    // Upload file
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("key", config.rpm_key);

    const up = await fetch(uploadUrl, {
        method: "POST",
        body: form,
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    const data = await up.json();

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

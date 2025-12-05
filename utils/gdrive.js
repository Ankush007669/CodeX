import fs from "fs";
import fetch from "node-fetch";

export function extractFileId(link) {
    const match = link.match(/\/d\/([^\/]+)/);
    return match ? match[1] : null;
}

export async function downloadGDrive(fileId, outputPath) {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const res = await fetch(url);

    // If Google blocks direct download → bypass with confirm token
    if (res.headers.get("content-type").includes("text/html")) {
        const html = await res.text();
        const token = html.match(/confirm=([^&]+)/)?.[1];

        if (!token) throw new Error("Google Drive confirmation token not found");

        const bypassUrl =
            `https://drive.google.com/uc?export=download&confirm=${token}&id=${fileId}`;

        return await downloadStream(bypassUrl, outputPath);
    }

    return await downloadStream(url, outputPath);
}

async function downloadStream(url, outputPath) {
    const res = await fetch(url);

    if (!res.ok) throw new Error("GDrive download failed");

    const fileStream = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}

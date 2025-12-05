import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import config from "../config.js";

export async function uploadAbyss(filePath) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const res = await fetch(`http://up.abyss.to/${config.abyss_key}`, {
        method: "POST",
        body: form
    });

    const data = await res.json();

    if (!data.slug) return { status: "error", message: "Abyss upload failed" };

    return {
        status: "success",
        link: `https://abysscdn.com/embed/${data.slug}`
    };
}

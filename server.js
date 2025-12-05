import express from "express";
import uploadRoute from "./routes/upload.js";

const app = express();
app.use(express.json());

app.use("/api/upload", uploadRoute);

app.listen(10000, () => console.log("🔥 VPS API Running"));

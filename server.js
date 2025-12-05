import express from "express";
import uploadRouter from "./routes/upload.js";

const app = express();
app.use(express.json());
app.use("/api/upload", uploadRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 Mirror Engine Running on PORT " + PORT));

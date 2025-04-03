import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db";
import router from "./src/routes/routes";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cors());
app.use("/", router);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
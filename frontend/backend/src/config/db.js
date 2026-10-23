import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

let isMongoConnected = false;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const initFileStore = (initialData = {}) => {
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
};

export const readFileStore = () => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading file store:", err);
  }
  return { colleges: [], courses: [], applications: [] };
};

export const writeFileStore = (data) => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing file store:", err);
  }
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kits_education";
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Successfully connected to database at ${mongoUri}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[MongoDB] Local daemon not reachable (${err.message}). Using persistent file-backed Mongoose layer at backend/data/store.json.`);
    initFileStore({ colleges: [], courses: [], applications: [] });
  }
};

export const getDBStatus = () => ({
  isMongoConnected,
  mode: isMongoConnected ? "MongoDB Server" : "Persistent File-Backed Store",
});

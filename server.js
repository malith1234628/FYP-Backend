const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");
require("dotenv").config();

// Import database connection (uses mysql2/promise with connection pool)
const db = require("./config/database");

// Import routes
const authRoutes = require("./routes/authRoutes");
const studentDocumentRoutes = require("./routes/studentDocumentRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOC, and DOCX files are allowed."));
    }
  },
});

// ----------------------
// Authentication Routes
// ----------------------
app.use("/auth", authRoutes);

// ----------------------
// Student Document Routes
// ----------------------
app.use("/api/students/documents", studentDocumentRoutes);

// Flask API base URL
const FLASK_URL = process.env.FLASK_URL || "http://127.0.0.1:5001";

// Axios instance with sensible defaults
const flask = axios.create({
  baseURL: FLASK_URL,
  timeout: 15000, // 15s timeout
  headers: { "Content-Type": "application/json" },
});

// ----------------------
// Node health check
// ----------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Node backend running" });
});

// ----------------------
// Database health check
// ----------------------
app.get("/api/db-health", async (req, res) => {
  try {
    const [results] = await db.execute("SELECT 1 + 1 AS result");
    res.json({
      status: "ok",
      message: "Database connection successful",
      database: process.env.DB_NAME,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: err.message,
    });
  }
});

// ----------------------
// Proxy: Flask health
// GET /api/health -> Flask GET /health
// ----------------------
app.get("/api/health", async (req, res) => {
  try {
    const r = await flask.get("/health");
    return res.status(200).json(r.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({ error: "Failed to reach Flask", details: err.message });
  }
});

// ----------------------
// Proxy: Rank band prediction
// POST /api/predict-rank -> Flask POST /predict_rank
// Body: { "Name": "University of Melbourne" }
// ----------------------
app.post("/api/predict-rank", async (req, res) => {
  try {
    const { Name } = req.body;
    if (!Name) {
      return res.status(400).json({ error: "Missing field: Name" });
    }

    const r = await flask.post("/predict_rank", { Name });
    return res.status(200).json(r.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ----------------------
// Proxy: University name prediction
// POST /api/predict-university -> Flask POST /predict_university
// Body must include ALL required fields:
// Country, City, Program, Level, Duration_Years, Tuition_USD, Living_Cost_Index,
// Rent_USD, Visa_Fee_USD, Insurance_USD
// ----------------------
app.post("/api/predict-university", async (req, res) => {
  try {
    const required = [
      "Country",
      "City",
      "Program",
      "Level",
      "Duration_Years",
      "Tuition_USD",
      "Living_Cost_Index",
      "Rent_USD",
      "Visa_Fee_USD",
      "Insurance_USD",
    ];

    const missing = required.filter((k) => req.body[k] === undefined || req.body[k] === null);
    if (missing.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missing_fields: missing,
        expected_fields: required,
      });
    }

    // Forward the full body exactly as-is
    const r = await flask.post("/predict_university", req.body);
    return res.status(200).json(r.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ----------------------
// Proxy: CV Data Extraction
// POST /api/extract-cv -> Flask POST /extract_cv
// Accepts multipart/form-data with 'file' field (PDF, DOC, DOCX)
// ----------------------
app.post("/api/extract-cv", upload.single("file"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please upload a PDF, DOC, or DOCX file." });
    }

    console.log("File received:", req.file.originalname, req.file.mimetype, req.file.size, "bytes");

    // Create FormData to forward file to Flask
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log("Forwarding to Flask:", `${FLASK_URL}/extract_cv`);

    // Forward to Flask with proper headers
    const r = await axios.post(`${FLASK_URL}/extract_cv`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30s timeout for CV processing
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log("Flask response received successfully");
    return res.status(200).json(r.data);
  } catch (err) {
    console.error("CV extraction error:", err.message);
    if (err.response) {
      console.error("Flask error response:", err.response.status, err.response.data);
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ 
      error: "CV extraction failed", 
      details: err.message 
    });
  }
});

// ----------------------
// Start Node server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Node backend running on http://localhost:${PORT}`);
  console.log(`Proxying Flask at: ${FLASK_URL}`);
});

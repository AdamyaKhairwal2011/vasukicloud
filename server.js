import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";


const app = express();
const PORT = 3000;

// Ensure db folder exists
const DB_FILE = path.join(process.cwd(), "files.json");
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

app.use(bodyParser.json({ limit: "50mb" }));
// Get __dirname in ES module style
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Default route → send index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});






// Upload
app.post("/upload", (req, res) => {
  const { userId, filename, mimeType, data } = req.body;
  if (!userId || !filename || !data) return res.status(400).json({ error: "Missing fields" });

  const files = JSON.parse(fs.readFileSync(DB_FILE));
  const id = Date.now().toString(); // simple unique ID
  files.push({ id, userId, filename, mimeType, data, uploadedAt: Date.now() });
  fs.writeFileSync(DB_FILE, JSON.stringify(files, null, 2));

  res.json({ success: true, id });
});

// List files for user
app.get("/list/:userId", (req, res) => {
  const userId = req.params.userId;
  const files = JSON.parse(fs.readFileSync(DB_FILE));
  res.json(files.filter(f => f.userId === userId));
});

// Download
app.get("/download/:id", (req, res) => {
  const id = req.params.id;
  const files = JSON.parse(fs.readFileSync(DB_FILE));
  const file = files.find(f => f.id === id);
  if (!file) return res.status(404).send("File not found");

  const buffer = Buffer.from(file.data, "base64");
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.setHeader("Content-Type", file.mimeType);
  res.send(buffer);
});

// Delete
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  let files = JSON.parse(fs.readFileSync(DB_FILE));
  const fileIndex = files.findIndex(f => f.id === id);
  if (fileIndex === -1) return res.status(404).json({ error: "File not found" });

  files.splice(fileIndex, 1);
  fs.writeFileSync(DB_FILE, JSON.stringify(files, null, 2));
  res.json({ success: true });
});

// Inside your existing server.js

// Add a "share" route
app.get("/share/:id", (req, res) => {
  const id = req.params.id;
  const files = JSON.parse(fs.readFileSync(DB_FILE));
  const file = files.find(f => f.id === id);
  if (!file) return res.status(404).send("File not found");

  const buffer = Buffer.from(file.data, "base64");
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.setHeader("Content-Type", file.mimeType);
  res.send(buffer);
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

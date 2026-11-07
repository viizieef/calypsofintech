// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json());
app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "calypso-bir",
    compliance: "BIR Philippines & Double-Entry General Ledger",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/config", (_req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
  });
});
var distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`[Calypso] BIR General Ledger server running on port ${PORT}`);
});

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Render Health Check endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'calypso-bir',
    compliance: 'BIR Philippines & Double-Entry General Ledger',
    timestamp: new Date().toISOString(),
  });
});

// Endpoint to provide public Supabase environment variables injected at deployment time
app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  });
});

// Serve Vite production build
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Calypso] BIR General Ledger server running on port ${PORT}`);
});

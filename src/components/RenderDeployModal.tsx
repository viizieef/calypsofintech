import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Copy, 
  Check, 
  FileCode,
} from 'lucide-react';

interface RenderDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RenderDeployModal: React.FC<RenderDeployModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedYAML, setCopiedYAML] = useState(false);

  if (!isOpen) return null;

  const yamlContent = `services:
  - type: web
    name: calypso-bir
    runtime: node
    plan: starter
    region: singapore # Closest low-latency region to Philippines
    buildCommand: npm install && npm run build
    startCommand: node server.js
    healthCheckPath: /healthz
    envVars:
      - key: NODE_VERSION
        value: 22.14.0
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: VITE_SUPABASE_URL
        sync: false # Add your Supabase Project URL in Render Dashboard
      - key: VITE_SUPABASE_ANON_KEY
        sync: false # Add your Supabase Anon Key in Render Dashboard`;

  const handleCopyYAML = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopiedYAML(true);
    setTimeout(() => setCopiedYAML(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="spatial-elevated rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xs">
              <Cloud className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>Deploy on Render Cloud</span>
              </h2>
              <p className="text-xs text-zinc-500">
                Production-ready deployment guide for full-stack Node.js & React SPA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Step Deployment Flow */}
        <div className="space-y-3.5 text-xs">
          <div className="flex items-start space-x-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80">
            <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              1
            </span>
            <div>
              <strong className="text-zinc-900 block text-sm">Push Code to GitHub or GitLab</strong>
              <p className="text-zinc-600 mt-0.5 leading-relaxed">
                Connect your repository to your Render.com account. Calypso is structured with an Express static server and bundle script already included.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80">
            <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              2
            </span>
            <div>
              <strong className="text-zinc-900 block text-sm">Create New "Web Service" on Render</strong>
              <p className="text-zinc-600 mt-0.5 leading-relaxed">
                Configure your Web Service with the following specifications:
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-zinc-200 font-mono text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Runtime:</span>
                  <span className="text-zinc-900 font-semibold">Node</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Build Command:</span>
                  <span className="text-zinc-900 font-semibold">npm install && npm run build</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Start Command:</span>
                  <span className="text-zinc-900 font-semibold">node server.js</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Health Check Path:</span>
                  <span className="text-zinc-900 font-semibold">/healthz</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80">
            <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              3
            </span>
            <div>
              <strong className="text-zinc-900 block text-sm">Set Environment Variables in Render</strong>
              <p className="text-zinc-600 mt-0.5 leading-relaxed">
                Add your Supabase credentials into the Render Dashboard &gt; Environment tab:
              </p>
              <div className="mt-2 space-y-1 font-mono text-[11px] bg-white p-3 rounded-xl border border-zinc-200">
                <div className="flex justify-between">
                  <span className="text-zinc-500">VITE_SUPABASE_URL</span>
                  <span className="text-zinc-900 font-semibold">https://xyz.supabase.co</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">VITE_SUPABASE_ANON_KEY</span>
                  <span className="text-zinc-900 font-semibold">eyJhbGciOi...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">NODE_VERSION</span>
                  <span className="text-zinc-900 font-semibold">22.14.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blueprint render.yaml Box in Obsidian styling */}
        <div className="spatial-card rounded-2xl p-4 space-y-2 border border-zinc-200/80 bg-zinc-50/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-zinc-700" />
              Infrastructure as Code: render.yaml
            </span>
            <button
              onClick={handleCopyYAML}
              className="spatial-button-secondary flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-zinc-800"
            >
              {copiedYAML ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedYAML ? 'Copied YAML!' : 'Copy render.yaml'}</span>
            </button>
          </div>
          <pre className="text-[10px] font-mono text-zinc-200 bg-zinc-950 p-3 rounded-xl overflow-x-auto max-h-32 border border-zinc-800 shadow-inner">
            {yamlContent}
          </pre>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-200/80">
          <button
            onClick={onClose}
            className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

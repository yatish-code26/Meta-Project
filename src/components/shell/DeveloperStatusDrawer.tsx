import React from 'react';
import { X, ShieldCheck, Terminal, Cpu, Key, Lock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ProviderTelemetry, RecoveryApiEvaluationResponse } from '../../services/recoveryApiClient';

interface DeveloperStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: ProviderTelemetry;
  requestedProvider: 'groq' | 'meta' | 'muse' | 'fixture';
  onSelectProvider: (p: 'groq' | 'meta' | 'muse' | 'fixture') => void;
  rawResponse: RecoveryApiEvaluationResponse | null;
  onReevaluate: () => void;
  isEvaluating: boolean;
}

export const DeveloperStatusDrawer: React.FC<DeveloperStatusDrawerProps> = ({
  isOpen,
  onClose,
  telemetry,
  requestedProvider,
  onSelectProvider,
  rawResponse,
  onReevaluate,
  isEvaluating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-foreground">Developer Telemetry</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Security & Isolation Notice */}
        <div className="mt-4 p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
            <Lock className="h-4 w-4" />
            <span>Zero-Exposure Key Architecture</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            API keys are strictly isolated on the local server in an ignored <code className="bg-blue-500/10 px-1 py-0.5 rounded text-foreground font-mono">.env</code>. No secrets are ever injected into Vite client bundles, browser storage, or Git commits.
          </p>
        </div>

        {/* Active Provider Selection */}
        <div className="mt-6 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Target AI Provider Adapter
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'groq', name: 'Groq Llama 3.3', configured: telemetry.groq.configured },
              { id: 'meta', name: 'Meta Official', configured: telemetry.meta.configured },
              { id: 'muse', name: 'Muse AI', configured: telemetry.muse.configured },
              { id: 'fixture', name: 'Deterministic Fixture', configured: true },
            ].map((p) => {
              const isSelected = requestedProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProvider(p.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all text-xs flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 text-foreground font-semibold ring-1 ring-blue-500'
                      : 'border-border bg-card/60 hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{p.name}</span>
                    {p.configured ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" title="Configured" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-amber-500" title="No Key (Fallback active)" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {p.id === 'fixture'
                      ? 'Offline calibrated'
                      : p.configured
                      ? 'API key active'
                      : 'Awaiting API key'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Execution Telemetry */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Server Execution Status
            </label>
            <button
              onClick={onReevaluate}
              disabled={isEvaluating}
              className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>Re-run</span>
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-background border border-border space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-mono font-medium text-foreground">
                {rawResponse?.executionMode || 'DETERMINISTIC_FIXTURE'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Active Model</span>
              <span className="font-mono text-foreground text-[11px] truncate max-w-[200px]">
                {rawResponse?.modelMetadata.modelName || 'calibrated-fixture'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-mono text-foreground">
                {rawResponse?.latencyMs ? `${rawResponse.latencyMs}ms` : '< 50ms'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Fallback Status</span>
              <span className={`font-medium ${rawResponse?.fallbackOccurred ? 'text-amber-500' : 'text-emerald-500'}`}>
                {rawResponse?.fallbackOccurred ? 'Active (Fixture)' : 'Direct Live Response'}
              </span>
            </div>
          </div>

          {rawResponse?.statusMessage && (
            <div className="p-2.5 rounded bg-muted/60 text-[11px] text-muted-foreground font-mono">
              {rawResponse.statusMessage}
            </div>
          )}
        </div>

        {/* Server Setup Instructions */}
        <div className="mt-auto pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
          <div className="font-medium text-foreground flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-blue-500" />
            <span>Configuring Server API Keys</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            To activate live Groq Llama 3.3 generation, add your key to <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">.env</code> in the project root:
          </p>
          <pre className="bg-background p-2 rounded border border-border text-[10px] font-mono text-foreground overflow-x-auto">
            GROQ_API_KEY=gsk_...
          </pre>
        </div>
      </div>
    </div>
  );
};


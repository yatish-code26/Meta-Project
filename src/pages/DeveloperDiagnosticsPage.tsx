import React from 'react';
import { Terminal, Lock, Key, ShieldCheck, RefreshCw, Cpu, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ProviderTelemetry, RecoveryApiEvaluationResponse } from '../services/recoveryApiClient';
import { AppView } from '../components/navigation/Navbar';

interface DeveloperDiagnosticsPageProps {
  telemetry: ProviderTelemetry;
  requestedProvider: 'groq' | 'meta' | 'muse' | 'fixture';
  onSelectProvider: (p: 'groq' | 'meta' | 'muse' | 'fixture') => void;
  rawResponse: RecoveryApiEvaluationResponse | null;
  onReevaluate: () => void;
  isEvaluating: boolean;
  onNavigate: (view: AppView) => void;
}

export const DeveloperDiagnosticsPage: React.FC<DeveloperDiagnosticsPageProps> = ({
  telemetry,
  requestedProvider,
  onSelectProvider,
  rawResponse,
  onReevaluate,
  isEvaluating,
  onNavigate,
}) => {
  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Developer Diagnostics & Telemetry
            </h1>
            <p className="text-xs text-muted-foreground">
              Local server execution benchmarks, AI provider adapters, and zero-exposure security audit.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product</span>
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
          <Lock className="w-4 h-4" />
          <span>Server-Side Credential Isolation Guarantee</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          RouteX uses a zero-exposure key architecture. API keys (<code className="bg-blue-500/10 px-1 py-0.5 rounded font-mono text-foreground">GROQ_API_KEY</code>, <code className="bg-blue-500/10 px-1 py-0.5 rounded font-mono text-foreground">META_API_KEY</code>) are stored only in an uncommitted local <code className="bg-blue-500/10 px-1 py-0.5 rounded font-mono text-foreground">.env</code> on the server side. No credentials, tokens, or PII are ever injected into client-side Vite bundles, local storage, or Git commits.
        </p>
      </div>

      {/* Target Provider Selection */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Target AI Provider Adapter
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'groq', name: 'Groq Llama 3.3', configured: telemetry.groq.configured, model: telemetry.groq.model },
            { id: 'meta', name: 'Meta Llama (Official)', configured: telemetry.meta.configured, model: telemetry.meta.model },
            { id: 'muse', name: 'Meta Muse AI', configured: telemetry.muse.configured, model: telemetry.muse.model },
            { id: 'fixture', name: 'Calibrated Fixture', configured: true, model: telemetry.fixture.model },
          ].map((p) => {
            const isSelected = requestedProvider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectProvider(p.id as any)}
                className={`p-4 rounded-xl border text-left transition-all text-xs flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500 shadow-sm'
                    : 'border-border bg-card hover:bg-secondary/60 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-foreground text-sm">{p.name}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      p.configured ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    title={p.configured ? 'Key configured' : 'Awaiting key (Fixture fallback active)'}
                  />
                </div>
                <div className="font-mono text-[11px] text-muted-foreground truncate">
                  Model: {p.model}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground">
                  Status: {p.id === 'fixture' ? 'Offline calibrated' : p.configured ? 'API key active' : 'Awaiting API key in .env'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Server Execution Status */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Current Server Execution Telemetry
          </h2>
          <button
            onClick={onReevaluate}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>Re-run Evaluation</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
            <span className="text-[10px] text-muted-foreground block font-mono">Execution Mode</span>
            <strong className="text-foreground text-xs font-mono font-bold block mt-0.5">
              {rawResponse?.executionMode || 'DETERMINISTIC_FIXTURE'}
            </strong>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
            <span className="text-[10px] text-muted-foreground block font-mono">Provider Adapter</span>
            <strong className="text-foreground text-xs font-mono font-bold block mt-0.5 capitalize">
              {rawResponse?.providerId || 'fixture'}
            </strong>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
            <span className="text-[10px] text-muted-foreground block font-mono">Latency</span>
            <strong className="text-foreground text-xs font-mono font-bold block mt-0.5">
              {rawResponse?.latencyMs ? `${rawResponse.latencyMs}ms` : '< 50ms'}
            </strong>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
            <span className="text-[10px] text-muted-foreground block font-mono">Fallback Status</span>
            <strong
              className={`text-xs font-mono font-bold block mt-0.5 ${
                rawResponse?.fallbackOccurred ? 'text-amber-500' : 'text-emerald-500'
              }`}
            >
              {rawResponse?.fallbackOccurred ? 'Active (Fixture)' : 'Live API Response'}
            </strong>
          </div>
        </div>

        {rawResponse?.statusMessage && (
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground font-mono">
            {rawResponse.statusMessage}
          </div>
        )}
      </div>

      {/* Local Setup Instructions */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm text-xs text-muted-foreground">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-500" />
          <span>Configuring Server-Side Keys Locally</span>
        </h3>
        <p className="leading-relaxed text-[11px]">
          To activate live Groq Llama 3.3 generation, add your API key to <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">.env</code> in the project root:
        </p>
        <pre className="bg-secondary p-3 rounded-xl border border-border text-[11px] font-mono text-foreground overflow-x-auto">
          GROQ_API_KEY=gsk_your_groq_api_key_here
        </pre>
      </div>
    </div>
  );
};


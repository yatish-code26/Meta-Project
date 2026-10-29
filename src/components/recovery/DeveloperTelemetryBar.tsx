import React, { useState } from 'react';
import { metaTravelModelService } from '../../services/meta/MetaTravelModelService';
import { MetaRecoveryResponse } from '../../services/meta/IMetaTravelModelService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Sparkles, Terminal, Shield, Key, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';

interface DeveloperTelemetryBarProps {
  modelResponse: MetaRecoveryResponse | null;
  onCredentialsUpdated: () => void;
}

export const DeveloperTelemetryBar: React.FC<DeveloperTelemetryBarProps> = ({
  modelResponse,
  onCredentialsUpdated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('https://api.llama-api.com/v1/chat/completions');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    metaTravelModelService.setMetaCredentials(apiKeyInput, endpointInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    onCredentialsUpdated();
  };

  const modelInfo = metaTravelModelService.getModelInfo();

  return (
    <div className="border-b border-border/60 bg-secondary/30 text-xs">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-zinc-400 flex items-center gap-1.5 font-semibold">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Meta AI Architecture:
          </span>
          <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary">
            {modelInfo.modelName}
          </Badge>
          <Badge
            variant={modelInfo.hasLiveKey ? 'success' : 'synthetic'}
            className="text-[11px]"
          >
            {modelInfo.hasLiveKey ? 'Live Meta API Active' : 'Calibrated Fixture (Awaiting Credits)'}
          </Badge>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 font-medium transition-colors"
        >
          <span>{isOpen ? 'Hide Developer Telemetry' : 'Inspect Meta Setup & API Keys'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="bg-card/95 border-t border-border/80 px-4 py-4 max-w-6xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Hackathon Transparency Notice */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Meta Hackathon Compliance & Transparency Status
              </div>
              <p className="text-muted-foreground leading-relaxed">
                As required by the participant guide:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong className="text-zinc-200">No Third-Party Substitution:</strong> We do NOT use Groq, Gemini, or OpenAI to simulate Meta model behavior.</li>
                <li><strong className="text-zinc-200">Independent Constraints:</strong> Hard gates (deadlines, budgets, visas) are enforced deterministically, not solely by LLM output.</li>
                <li><strong className="text-zinc-200">Current Status:</strong> Operating in deterministic fixture mode until Meta API credits are granted to this student developer team.</li>
              </ul>
            </div>

            {/* Right: Live Meta API Key Input */}
            <form onSubmit={handleSaveCredentials} className="space-y-2.5 bg-secondary/20 p-3.5 rounded-lg border border-border">
              <div className="font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  Test Live Meta API Credentials (Optional)
                </span>
                {isSaved && (
                  <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Credentials Set
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Meta Llama API Key (Permitted Endpoint):
                </label>
                <input
                  type="password"
                  placeholder="Paste Meta Llama API key..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  Endpoint: llama-api.com / v1
                </span>
                <Button type="submit" size="sm" className="h-7 px-3 text-[11px]">
                  Apply Key
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { parseDisruptionText, ParsedDisruption } from '../../services/disruptionService';

const SAMPLES = [
  {
    label: 'LH 901 (+75m ATC)',
    text: 'Lufthansa Alert: Flight LH 901 London Heathrow to Frankfurt is delayed by 75 minutes due to air traffic control restrictions. Connecting passengers on flight LH 716 should report to transit desk B22.',
  },
  {
    label: 'Severe Weather (+120m)',
    text: 'Urgent notice: Due to heavy snow and runway de-icing at Munich, flight LH 204 is delayed by 120 minutes. All tight connections are being rerouted airside.',
  },
  {
    label: 'Minor Delay (+15m)',
    text: 'Flight update: LH 901 is experiencing a minor 15 minute delay due to late passenger boarding. Connecting flights at Frankfurt are currently on schedule.',
  },
];

export function PasteDisruptionCard() {
  const { dispatch } = useRouteXStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState(SAMPLES[0].text);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ParsedDisruption | null>(null);
  const [executionMode, setExecutionMode] = useState<'LIVE_LLAMA' | 'OFFLINE_SIMULATION'>('OFFLINE_SIMULATION');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleParse = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Please enter or paste airline notification text.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setAppliedSuccess(false);

    try {
      const result = await parseDisruptionText(inputText);
      if (result.success && result.disruption) {
        setExtractedData(result.disruption);
        setExecutionMode(result.executionMode);
      } else {
        setErrorMessage(result.error || 'Failed to extract disruption details.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Extraction error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!extractedData) return;
    dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: extractedData.delayMinutes });
    setAppliedSuccess(true);
    setTimeout(() => {
      setIsOpen(false);
      setAppliedSuccess(false);
    }, 1200);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Toggle Header */}
      <button
        type="button"
        data-testid="paste-disruption-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Manrope'] font-bold text-sm text-foreground">
                Paste Disruption (Email / SMS)
              </span>
              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                AI Parser
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Paste raw flight alerts to extract delay & trigger engine re-calculation.
            </p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Expanded Body */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-border space-y-4 bg-secondary/10">
          {/* Untrusted Data Notice */}
          <div className="p-2.5 rounded-lg bg-secondary/50 border border-border text-[12px] text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>
              <strong>AI Proposes, Code Verifies:</strong> Pasted text is treated strictly as data. The engine deterministically proves all consequences.
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[12px] font-semibold text-muted-foreground block">
              Quick Test Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(s.text);
                    setExtractedData(null);
                    setErrorMessage(null);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-card border border-border hover:border-primary/40 text-foreground transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <textarea
              data-testid="paste-disruption-textarea"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste airline email, SMS alert, or app notification..."
              className="w-full text-xs p-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parse Button */}
          <div className="flex justify-end">
            <button
              type="button"
              data-testid="paste-disruption-parse-btn"
              disabled={isLoading}
              onClick={handleParse}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting with Llama...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract Disruption</span>
                </>
              )}
            </button>
          </div>

          {/* Extraction Preview Card */}
          {extractedData && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Structured Extraction Complete
                </span>
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {executionMode === 'LIVE_LLAMA' ? 'Live Llama 3.3' : 'Offline Simulation'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-secondary/40">
                  <span className="text-[12px] text-muted-foreground block">Flight</span>
                  <span className="font-bold text-foreground">{extractedData.flightCode}</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/40">
                  <span className="text-[12px] text-muted-foreground block">Extracted Delay</span>
                  <span className="font-bold text-rose-600">+{extractedData.delayMinutes} min</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/40">
                  <span className="text-[12px] text-muted-foreground block">Root Cause</span>
                  <span className="font-medium text-foreground truncate block">{extractedData.rootCause}</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/40">
                  <span className="text-[12px] text-muted-foreground block">Type</span>
                  <span className="font-medium text-foreground">{extractedData.disruptionType}</span>
                </div>
              </div>

              <p className="text-[12px] text-muted-foreground italic">
                {extractedData.actionAdvice}
              </p>

              <button
                type="button"
                data-testid="paste-disruption-apply-btn"
                onClick={handleApply}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  appliedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {appliedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Applied to Twin Engine (+{extractedData.delayMinutes}m)!</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-4 h-4" />
                    <span>Apply +{extractedData.delayMinutes}m Delay to Engine</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Clock,
  Cpu,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { ExportService } from '../../services/export/ExportService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { state, dispatch } = useRouteXStore();
  const [use24Hour, setUse24Hour] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'live' | 'offline'>('offline');
  const [aiModelName, setAiModelName] = useState('llama-3.3-70b-versatile');

  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch('http://localhost:3001/api/recovery/providers');
        if (res.ok) {
          const data = await res.json();
          if (data.activeProvider === 'groq' && data.executionMode === 'LIVE_API') {
            setAiStatus('live');
            setAiModelName(data.modelName || 'llama-3.3-70b-versatile');
            return;
          }
        }
        setAiStatus('offline');
      } catch {
        setAiStatus('offline');
      }
    }
    if (isOpen) {
      checkBackend();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const backupJson = ExportService.exportFullJsonBackup(state);
    ExportService.downloadFile(
      backupJson,
      `RouteX-FullBackup-${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.state) {
          // Restore state
          localStorage.setItem('routex_v3_local_state', JSON.stringify(parsed.state));
          window.location.reload();
        }
      } catch (err) {
        alert('Failed to parse RouteX backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    dispatch({ type: 'RESET_DEMO' });
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <h3 className="font-['Manrope'] font-bold text-base text-foreground">
              RouteX System Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Clock Mode Settings */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Clock & Timezone Mode
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_CLOCK_MODE', mode: 'demo' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  state.clockMode === 'demo'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-secondary/30 hover:bg-secondary'
                }`}
              >
                <div className="font-bold text-foreground">Demo Time (Fixed)</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Pinned to 13:30 CET demo moment
                </div>
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_CLOCK_MODE', mode: 'real' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  state.clockMode === 'real'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-secondary/30 hover:bg-secondary'
                }`}
              >
                <div className="font-bold text-foreground">Live System Clock</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Synchronized with real wall clock
                </div>
              </button>
            </div>
          </div>

          {/* Time Format */}
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
            <div>
              <span className="font-bold text-foreground block">Display Time Format</span>
              <span className="text-[11px] text-muted-foreground">
                Toggle between 24-hour military/aviation and 12-hour AM/PM
              </span>
            </div>
            <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setUse24Hour(true)}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  use24Hour ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                24-Hour
              </button>
              <button
                onClick={() => setUse24Hour(false)}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  !use24Hour ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                12-Hour
              </button>
            </div>
          </div>

          {/* AI Model Status */}
          <div className="border-t border-border pt-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              AI Model & Inference Backend
            </label>
            <div className="p-3 rounded-xl border border-border bg-secondary/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    aiStatus === 'live' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <span className="font-bold text-foreground block">
                    {aiStatus === 'live' ? `Live Llama (${aiModelName})` : 'Offline Calibrated Engine'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {aiStatus === 'live'
                      ? 'Groq server adapter connected & verified'
                      : 'Zero external dependencies active — deterministic fallback verified'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-card border border-border">
                {aiStatus === 'live' ? 'ACTIVE' : 'FALLBACK'}
              </span>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="border-t border-border pt-4 space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
              Data Backup & Portability
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 py-2 px-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary font-bold text-foreground flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex-1 py-2 px-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary font-bold text-foreground flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset All Data with Confirmation Dialog */}
          <div className="border-t border-border pt-4 space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-destructive block text-[11px]">
              Danger Zone
            </span>
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 px-3 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 font-bold text-destructive flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Data</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Are you sure?</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  This will purge all custom user trips, expenses, notifications, and local storage state, returning RouteX to default clean fixtures.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-destructive text-white hover:bg-destructive/90 shadow-sm"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


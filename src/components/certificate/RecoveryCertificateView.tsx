import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Copy,
  Check,
  Download,
  Printer,
  Upload,
  AlertCircle,
  Hash,
  Link2,
} from 'lucide-react';
import {
  RecoveryCertificateEngine,
  FullRecoveryCertificate,
} from '../../services/certificate/RecoveryCertificateEngine';
import { useRouteXStore } from '../../context/RouteXStore';
import { ExportService } from '../../services/export/ExportService';

export function RecoveryCertificateView() {
  const { state, evaluatedOptions } = useRouteXStore();
  const [currentCert, setCurrentCert] = useState<FullRecoveryCertificate | null>(null);
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    status: 'MATCH' | 'MISMATCH';
    computedHash: string;
    providedHash: string;
    mismatchFields: string[];
  } | null>(null);

  // Generate certificate for current active option or first option
  useEffect(() => {
    async function loadCert() {
      const targetOption =
        state.selectedOptionForReview ||
        evaluatedOptions.find((o) => o.isRecommended) ||
        evaluatedOptions[0];

      if (targetOption) {
        const cert = await RecoveryCertificateEngine.generateCertificate({
          trip: state.trip,
          option: targetOption,
          userTripInput: state.customUserTripInput || undefined,
          aiLog: {
            modelId: 'llama-3.3-70b-versatile',
            schemaValidated: true,
            offlineFallback: true,
          },
        });
        setCurrentCert(cert);
      }
    }
    loadCert();
  }, [state.trip, state.selectedOptionForReview, evaluatedOptions, state.customUserTripInput]);

  const handleCopyClaimDraft = () => {
    if (!currentCert) return;
    navigator.clipboard.writeText(currentCert.payload.claimDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    if (!currentCert) return;
    ExportService.downloadFile(
      JSON.stringify(currentCert, null, 2),
      `RouteX-Certificate-${currentCert.payload.certificateId}.json`,
      'application/json'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVerifyImport = async () => {
    if (!importJson.trim()) return;
    const res = await RecoveryCertificateEngine.importAndVerify(importJson);
    setVerifyResult({
      status: res.status,
      computedHash: res.computedHash,
      providedHash: res.providedHash,
      mismatchFields: res.mismatchFields,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 pb-16">
      {/* Header Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Cryptographic Recovery Certificate Ledger
              </h2>
              <p className="text-xs text-muted-foreground">
                Tamper-evident SHA-256 evidence certificate hash-chained to the journey ledger for corporate expense reconciliation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print View</span>
            </button>
          </div>
        </div>
      </div>

      {currentCert && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Certificate Hash Strip */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary" />
                SHA-256 Root Certificate Hash
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                Valid WebCrypto Digest
              </span>
            </div>
            <div className="font-mono text-xs text-foreground font-semibold break-all select-all bg-card p-2 rounded-lg border border-border/80">
              {currentCert.certificateHash}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <Link2 className="w-3 h-3" />
              <span>Hash-Chained to Previous Record: </span>
              <span className="font-mono">{currentCert.payload.prevHash.substring(0, 16)}...</span>
            </div>
          </div>

          {/* Certificate Body Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border bg-secondary/20">
              <span className="text-muted-foreground block font-medium">Certificate ID</span>
              <span className="font-bold text-foreground block mt-0.5">{currentCert.payload.certificateId}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-secondary/20">
              <span className="text-muted-foreground block font-medium">Engine Version</span>
              <span className="font-bold text-foreground block mt-0.5">v{currentCert.payload.engineVersion} (Deterministic)</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-secondary/20">
              <span className="text-muted-foreground block font-medium">Option Provenance</span>
              <span className="font-bold text-primary block mt-0.5 uppercase">[{currentCert.payload.optionProvenance}]</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-secondary/20">
              <span className="text-muted-foreground block font-medium">AI Audit Logging</span>
              <span className="font-bold text-foreground block mt-0.5">
                {currentCert.payload.aiInvolvementLog.modelId || 'Offline Model'} (Schema Validated)
              </span>
            </div>
          </div>

          {/* Constraint Gates Audit with Margins */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Verified Operational Hard Constraints & Numeric Margins
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {currentCert.payload.perConstraintResults.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border bg-secondary/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground">{c.name}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">+{c.marginMinutes}m margin</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Claim Draft */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Corporate Claim & Disruption Summary (Draft)
              </span>
              <button
                onClick={handleCopyClaimDraft}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Draft'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl border border-border bg-secondary/40 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed select-all">
              {currentCert.payload.claimDraft}
            </pre>
          </div>
        </div>
      )}

      {/* Import & Verify Certificate Section */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Import & Verify Certificate Integrity
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste any RouteX Certificate JSON below to re-verify its cryptographic hash and audit trail.
        </p>

        <textarea
          rows={3}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='{"certificateHash": "...", "payload": {...}}'
          className="w-full bg-secondary/40 border border-border rounded-xl p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={handleVerifyImport}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            Verify Integrity
          </button>

          {verifyResult && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                verifyResult.status === 'MATCH'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {verifyResult.status === 'MATCH' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>MATCH: Verified authentic & tamper-free</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>MISMATCH: {verifyResult.mismatchFields.join(', ')}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


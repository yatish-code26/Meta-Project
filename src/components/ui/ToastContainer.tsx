import React from 'react';
import { CheckCircle2, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'info';
  onUndo?: () => void;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-auto bg-card border border-border shadow-xl rounded-xl p-3 flex items-start gap-2.5 text-xs text-foreground"
          >
            {t.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <span className="font-bold text-foreground block">{t.title}</span>
              <span className="text-muted-foreground block text-[11px] leading-tight mt-0.5">
                {t.message}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {t.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    t.onUndo?.();
                    onDismiss(t.id);
                  }}
                  className="px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


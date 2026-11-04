import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  ShieldAlert,
  Tag,
  Info,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import {
  sendAssistantMessage,
  AssistantMessage,
  ProposedAction,
} from '../../services/assistantService';

const SUGGESTIONS = [
  'Which recovery option is recommended?',
  'Why did the other routes get rejected?',
  'Log $45 taxi ride from Frankfurt to hotel',
  'What is my remaining recovery budget?',
];

export function RecoveryAssistant() {
  const { state, dispatch, evaluatedOptions } = useRouteXStore();
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-initial',
      role: 'assistant',
      content: `Hello! I am your RouteX Recovery Assistant. I am strictly grounded on your active trip (${state.trip.destination}), evaluated recovery options, and operational constraints. Every answer cites verified engine data.`,
      citations: [`TRIP-${state.activeTripId}`],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [executionMode, setExecutionMode] = useState<'LIVE_LLAMA' | 'OFFLINE_SIMULATION'>('OFFLINE_SIMULATION');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const historyForApi = messages.slice(-5).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const contextForApi = {
      tripId: state.activeTripId,
      destination: state.trip.destination,
      activeOptionId: state.approvalRecord?.optionId || state.selectedOptionForReview?.id || null,
      delayMinutes: state.params.delayMinutes,
      budgetCeiling: state.params.budgetCeiling,
      arrivalDeadline: state.params.arrivalDeadlineHours,
      viableOptions: evaluatedOptions.map((o) => ({
        id: o.id,
        title: o.title,
        cost: o.outOfPocketCost,
        arrivalTime: o.finalArrivalTime,
        hardGatePassed: o.hardGatePassed,
      })),
      expenses: state.expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
      })),
      itineraryCount: state.trip.itinerary.length,
    };

    try {
      const result = await sendAssistantMessage(query, historyForApi, contextForApi);
      setExecutionMode(result.executionMode);

      const botMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: result.text,
        citations: result.citations,
        proposedAction: result.proposedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'I encountered an error retrieving data. Please try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAction = (msgId: string, action: ProposedAction) => {
    if (action.type === 'ADD_EXPENSE') {
      dispatch({
        type: 'ADD_EXPENSE',
        expense: {
          tripId: state.activeTripId,
          category: action.data.category || 'other',
          title: action.data.title,
          amount: action.data.amount,
          currency: 'USD',
          isRecoveryExpense: false,
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, actionConfirmed: true } : m
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <div>
            <span className="font-['Manrope'] font-bold text-xs text-foreground block">
              Grounded Recovery Assistant
            </span>
            <span className="text-[12px] text-muted-foreground">
              Cites verified engine data • Strictly refuses hallucinated answers
            </span>
          </div>
        </div>
        <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {executionMode === 'LIVE_LLAMA' ? 'Live Llama 3.3' : 'Offline Engine'}
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none shadow-sm'
                  : 'bg-card border border-border text-foreground rounded-bl-none shadow-sm'
              }`}
            >
              {/* Plain Text Message Content (no dangerouslySetInnerHTML) */}
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Citations Pill Tags */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                  <span className="text-[12px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    Citations:
                  </span>
                  {msg.citations.map((c, idx) => (
                    <span
                      key={idx}
                      className="text-[12px] px-1.5 py-0.5 rounded bg-secondary font-mono font-bold text-foreground/80 border border-border"
                    >
                      [{c}]
                    </span>
                  ))}
                </div>
              )}

              {/* Proposed Action Card */}
              {msg.proposedAction && (
                <div className="mt-2 p-2.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2 text-foreground">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Proposed Ledger Entry</span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-card p-2 rounded-lg border border-border">
                    <span className="font-semibold">{msg.proposedAction.data.title}</span>
                    <span className="font-bold text-primary">${msg.proposedAction.data.amount} USD</span>
                  </div>

                  {msg.actionConfirmed ? (
                    <div className="text-[12px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmed & logged to expenses ledger!</span>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(msg.id, msg.proposedAction!)}
                        className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        Confirm & Record
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === msg.id ? { ...m, proposedAction: null } : m
                            )
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              <span className="text-[12px] opacity-70 block text-right">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl w-32 shadow-sm text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {SUGGESTIONS.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(sug)}
            className="text-[12px] px-2.5 py-1 rounded-full bg-secondary/80 border border-border hover:border-primary/40 text-foreground transition-colors"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about recovery options, gates, or log an expense..."
          className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          disabled={!input.trim() || isTyping}
          onClick={() => handleSend()}
          className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


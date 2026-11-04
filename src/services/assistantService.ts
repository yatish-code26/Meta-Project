export interface ProposedAction {
  type: 'ADD_EXPENSE' | 'ADD_ITINERARY_ITEM';
  data: any;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  proposedAction?: ProposedAction | null;
  actionConfirmed?: boolean;
  timestamp: string;
}

export interface AssistantContext {
  tripId: string;
  destination: string;
  activeOptionId?: string | null;
  delayMinutes: number;
  budgetCeiling: number;
  arrivalDeadline: string | number;
  viableOptions: Array<{
    id: string;
    title: string;
    cost: number;
    arrivalTime: string;
    hardGatePassed: boolean;
  }>;
  expenses: Array<{
    id: string;
    title: string;
    amount: number;
  }>;
  itineraryCount: number;
}

export async function sendAssistantMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: AssistantContext
): Promise<{
  text: string;
  citations: string[];
  proposedAction?: ProposedAction | null;
  executionMode: 'LIVE_LLAMA' | 'OFFLINE_SIMULATION';
}> {
  try {
    const res = await fetch('http://localhost:3001/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        context,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          text: data.text,
          citations: data.citations || [],
          proposedAction: data.proposedAction || null,
          executionMode: data.executionMode || 'LIVE_LLAMA',
        };
      }
    }
  } catch {
    // Backend server offline or fetch blocked; fallback to client-side grounded response
  }

  // Client-side offline fallback
  const lower = message.toLowerCase();
  const expenseMatch = lower.match(/(?:log|add|spent|cost)\s+(?:a\s+)?(?:\$)?(\d+)(?:\s+dollars?)?\s+(?:for|on)?\s*([a-zA-Z\s]+)/i)
    || lower.match(/(?:taxi|hotel|meal|food|dinner)\s+(?:for|costing)?\s*(?:\$)?(\d+)/i);

  if (expenseMatch) {
    const amount = parseInt(expenseMatch[1] || expenseMatch[2], 10) || 45;
    const title = expenseMatch[2] ? expenseMatch[2].trim() : 'Ground Transport / Meal';
    return {
      text: `I've drafted a proposed expense for ${title} ($${amount} USD). Per RouteX safety policy, nothing is added to your account until you confirm the card below.`,
      citations: [`TRIP-${context.tripId}`, `BUDGET-$${context.budgetCeiling}`],
      proposedAction: {
        type: 'ADD_EXPENSE',
        data: {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          amount,
          category: lower.includes('taxi') ? 'ground_transport' : lower.includes('hotel') ? 'hotel' : 'meals',
        },
      },
      executionMode: 'OFFLINE_SIMULATION',
    };
  }

  if (lower.includes('which') || lower.includes('recommend') || lower.includes('option') || lower.includes('path')) {
    const qualified = context.viableOptions.filter((o) => o.hardGatePassed);
    if (qualified.length > 0) {
      const top = qualified[0];
      return {
        text: `Based on the deterministic engine's gate checks, Route ${top.id} (${top.title}) is the highest qualified option. It arrives at ${top.arrivalTime} with an out-of-pocket surcharge of $${top.cost} USD.`,
        citations: [top.id, `GATE-BUDGET-$${context.budgetCeiling}`],
        executionMode: 'OFFLINE_SIMULATION',
      };
    }
    return {
      text: `All ${context.viableOptions.length} candidate pathways are currently disqualified by hard operational gates (arrival deadline or budget cap). You can relax constraints in Twin Lab to clear a route.`,
      citations: [`PARAM-DELAY-+${context.delayMinutes}m`],
      executionMode: 'OFFLINE_SIMULATION',
    };
  }

  return {
    text: `I am grounded on your current itinerary and recovery constraints for ${context.destination}. Inbound delay is +${context.delayMinutes}m. How can I assist with your options or expenses?`,
    citations: [`TRIP-${context.tripId}`],
    executionMode: 'OFFLINE_SIMULATION',
  };
}


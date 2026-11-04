import { z } from 'zod';

const AssistantRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(6).default([]),
  context: z.object({
    tripId: z.string(),
    destination: z.string(),
    activeOptionId: z.string().nullable().optional(),
    delayMinutes: z.number(),
    budgetCeiling: z.number(),
    arrivalDeadline: z.string().or(z.number()),
    viableOptions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      cost: z.number(),
      arrivalTime: z.string(),
      hardGatePassed: z.boolean(),
    })).default([]),
    expenses: z.array(z.object({
      id: z.string(),
      title: z.string(),
      amount: z.number(),
    })).default([]),
    itineraryCount: z.number().default(0),
  }),
});

// Server-side response cache (identical prompt hashing)
const responseCache = new Map();
const CACHE_MAX_SIZE = 50;

function getCacheKey(req) {
  return `${req.context.tripId}:${req.context.delayMinutes}:${req.message.trim().toLowerCase()}`;
}

/**
 * Deterministic grounded offline assistant.
 */
function generateOfflineAssistantResponse(message, context) {
  const lower = message.toLowerCase();

  // 1. Propose logging an expense
  const expenseMatch = lower.match(/(?:log|add|spent|cost)\s+(?:a\s+)?(?:\$)?(\d+)(?:\s+dollars?)?\s+(?:for|on)?\s*([a-zA-Z\s]+)/i)
    || lower.match(/(?:taxi|hotel|meal|food|dinner|lunch|breakfast)\s+(?:for|costing|was)?\s*(?:\$)?(\d+)/i);

  if (expenseMatch) {
    const amount = parseInt(expenseMatch[1] || expenseMatch[2], 10) || 35;
    const itemTitle = expenseMatch[2] ? expenseMatch[2].trim() : 'Ground Transport / Meal';
    return {
      text: `I propose recording this expense in your trip ledger. Per RouteX policy, nothing will be added until you confirm the card below.`,
      citations: [`TRIP-${context.tripId}`, `BUDGET-CAP-$${context.budgetCeiling}`],
      proposedAction: {
        type: 'ADD_EXPENSE',
        data: {
          title: itemTitle.charAt(0).toUpperCase() + itemTitle.slice(1),
          amount,
          category: lower.includes('taxi') ? 'ground_transport' : lower.includes('hotel') ? 'hotel' : 'meals',
        },
      },
      executionMode: 'OFFLINE_SIMULATION',
    };
  }

  // 2. Querying viable routes
  if (lower.includes('which flight') || lower.includes('recommend') || lower.includes('option') || lower.includes('route')) {
    const viable = context.viableOptions.filter((o) => o.hardGatePassed);
    if (viable.length > 0) {
      const top = viable[0];
      return {
        text: `The deterministic engine recommends ${top.title} ($${top.cost} out-of-pocket, arriving ${top.arrivalTime}). It passes all 4 physical gates: Hub MCT feasibility, arrival deadline, budget ceiling, and immigration.`,
        citations: [top.id, 'GATE-MCT', 'GATE-BUDGET', 'GATE-DEADLINE'],
        proposedAction: null,
        executionMode: 'OFFLINE_SIMULATION',
      };
    }
    return {
      text: `No candidate pathways currently satisfy all 4 hard gates under the observed +${context.delayMinutes}m delay. Check the Digital Twin tab to adjust risk parameters or budget.`,
      citations: [`DELAY-+${context.delayMinutes}m`, 'GATE-ALL-FAIL'],
      proposedAction: null,
      executionMode: 'OFFLINE_SIMULATION',
    };
  }

  // 3. Asking about delay / connection
  if (lower.includes('delay') || lower.includes('connection') || lower.includes('miss')) {
    return {
      text: `Your current delay is +${context.delayMinutes}m. Under the unified connection rule, your transfer window at the hub is compressed below airport Minimum Connection Time. Connection status is flagged as breached.`,
      citations: [`DELAY-+${context.delayMinutes}m`, 'GATE-MCT-BREACH'],
      proposedAction: null,
      executionMode: 'OFFLINE_SIMULATION',
    };
  }

  // 4. Default grounded reply
  return {
    text: `I am grounded strictly on your active RouteX itinerary to ${context.destination}. I can assist with evaluating alternative flight paths, checking connection margins, or preparing expense reimbursements.`,
    citations: [`TRIP-${context.tripId}`],
    proposedAction: null,
    executionMode: 'OFFLINE_SIMULATION',
  };
}

/**
 * Handle POST /api/assistant/chat
 */
export async function handleAssistantChat(body) {
  const parsedReq = AssistantRequestSchema.safeParse(body);
  if (!parsedReq.success) {
    return {
      success: false,
      error: 'Invalid request payload: ' + parsedReq.error.message,
    };
  }

  const { message, history, context } = parsedReq.data;
  const cacheKey = getCacheKey({ message, context });

  if (responseCache.has(cacheKey)) {
    return {
      success: true,
      ...responseCache.get(cacheKey),
      cached: true,
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  const modelName = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

  if (apiKey && apiKey.trim().length > 0) {
    const systemPrompt = `You are RouteX Recovery Assistant.
STRICT GROUNDING PRINCIPLES:
1. You are grounded strictly on the travel data provided in the user context.
2. Every answer MUST cite the specific route ID (e.g. [OPT-RECOVER-A]), constraint ID (e.g. [GATE-BUDGET]), or expense ID (e.g. [EXP-1]) it used.
3. If asked about general trivia, sports, coding, or anything outside this trip, POLITELY REFUSE: "I am only authorized to assist with your RouteX travel itinerary, disruption recovery options, and expenses."
4. You NEVER decide feasibility yourself. Always cite the deterministic engine (e.g., "The engine marked Route OPT-RECOVER-A as feasible").
5. If the traveler wants to log an expense or add a schedule item, return a proposedAction object and state that you propose recording it. NOTHING is committed until confirmed.

Return strictly JSON matching this structure:
{
  "text": "plain text response mentioning what you propose or explain",
  "citations": ["OPT-RECOVER-A", "GATE-BUDGET-450"],
  "proposedAction": null | {
    "type": "ADD_EXPENSE" | "ADD_ITINERARY_ITEM",
    "data": { "title": "string", "amount": 40, "category": "meals" | "hotel" | "ground_transport" }
  }
}
Do NOT use markdown code backticks. Return raw JSON only.`;

    const formattedHistory = history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    }));

    const userPayload = JSON.stringify({
      userQuery: message,
      activeContext: context,
    });

    // Timeout controller (10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            ...formattedHistory,
            { role: 'user', content: userPayload },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content?.trim() || '';
        const parsed = JSON.parse(content);

        let rawCitations = Array.isArray(parsed.citations) ? parsed.citations : [];
        if (!rawCitations.some((c) => c.includes('GATE') || c.includes('BUDGET'))) {
          rawCitations.push(`GATE-BUDGET-${context.budgetCeiling}`);
        }

        let responseText = String(parsed.text || 'Information grounded on RouteX engine.');
        if (parsed.proposedAction && !responseText.toLowerCase().includes('propose')) {
          responseText = `I propose recording this expense in your trip ledger: ${responseText}`;
        }

        const result = {
          text: responseText,
          citations: rawCitations,
          proposedAction: parsed.proposedAction || null,
          executionMode: 'LIVE_LLAMA',
          modelName,
        };

        if (responseCache.size >= CACHE_MAX_SIZE) {
          const firstKey = responseCache.keys().next().value;
          responseCache.delete(firstKey);
        }
        responseCache.set(cacheKey, result);

        return { success: true, ...result };
      }
    } catch (err) {
      console.warn('[Assistant Proxy] Groq call failed or timed out:', err.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Grounded offline fallback
  const offline = generateOfflineAssistantResponse(message, context);
  return {
    success: true,
    ...offline,
    modelName: 'grounded-offline-assistant',
  };
}

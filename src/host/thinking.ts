import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";
import { isRecord } from "../common/contract.js";
import { GROK_PACKED_REASONING_TYPE } from "../common/constants.js";

/** Grok server-search call_id prefixes observed on cli-chat-proxy. */
export const GROK_SERVER_SEARCH_CALL_PREFIXES = [
  "xs_call-",
  "ws_call-",
  "web_search_call-"
];

/**
 * True when this tool-call id is a Grok server search echo, not a DSH
 * function. The id is `call_id|item_id`; only the call_id prefix matters.
 */
export function isGrokServerSearchToolCallId(id?: string): boolean {
  if (id === undefined || id.length === 0) return false;
  const callId = id.split("|")[0] ?? id;
  return GROK_SERVER_SEARCH_CALL_PREFIXES.some((prefix) => callId.startsWith(prefix));
}

function toolCallFromEvent(event: any): { id: string; name: string } | undefined {
  if (event.type === "toolcall_end") {
    return {
      id: event.toolCall.id,
      name: event.toolCall.name
    };
  }
  if (event.type !== "toolcall_start" && event.type !== "toolcall_delta") return undefined;
  const block = event.partial?.content?.[event.contentIndex];
  if (!isRecord(block) || block["type"] !== "toolCall") return undefined;
  const id = typeof block["id"] === "string" ? block["id"] : undefined;
  const name = typeof block["name"] === "string" ? block["name"] : undefined;
  if (id === undefined || name === undefined) return undefined;
  return { id, name };
}

/** Strip server-search echoes and relax `toolUse` when nothing else remains. */
export function stripGrokServerSearchToolCalls(message: any): any {
  if (!message || !Array.isArray(message.content)) return message;
  const content = message.content.filter(
    (block: any) => !(block.type === "toolCall" && isGrokServerSearchToolCallId(block.id))
  );
  if (content.length === message.content.length) return message;
  const stillCalling = content.some((block: any) => block.type === "toolCall");
  const stopReason = message.stopReason === "toolUse" && !stillCalling ? "stop" : message.stopReason;
  return {
    ...message,
    content,
    stopReason
  };
}

/** Hold server-search toolcall_* events off the DSH stream. */
export class GrokServerSearchCallFilter {
  hidden = new Set<number>();

  take(event: any): any[] {
    switch (event.type) {
      case "toolcall_start":
      case "toolcall_delta":
      case "toolcall_end": {
        if (this.hidden.has(event.contentIndex)) return [];
        const call = toolCallFromEvent(event);
        if (call !== undefined && isGrokServerSearchToolCallId(call.id)) {
          this.hidden.add(event.contentIndex);
          return [];
        }
        return [event];
      }
      case "done": {
        const message = stripGrokServerSearchToolCalls(event.message);
        const reason =
          message.stopReason === "stop" || message.stopReason === "length" || message.stopReason === "toolUse"
            ? message.stopReason
            : event.reason;
        return [
          {
            ...event,
            message,
            reason
          }
        ];
      }
      case "error":
        return [
          {
            ...event,
            error: stripGrokServerSearchToolCalls(event.error)
          }
        ];
      default:
        return [event];
    }
  }
}

/** Whether this text should become a Think row. Whitespace-only is not visible. */
export function isDisplayableThinking(text?: string): boolean {
  return (text ?? "").trim().length > 0;
}

/** Whether `value` is a pack this plugin wrote and must expand before send. */
export function isGrokPackedReasoning(value: unknown): value is { type: string; items: any[] } {
  if (!isRecord(value) || value["type"] !== GROK_PACKED_REASONING_TYPE) return false;
  return Array.isArray(value["items"]);
}

export function unpackSignature(raw?: string): any[] {
  if (raw === undefined || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    if (isGrokPackedReasoning(parsed)) return parsed.items;
    return [parsed];
  } catch {
    return [];
  }
}

export function withPackedSignature(block: any, items: any[]): any {
  if (items.length === 0) return block;
  if (items.length === 1 && !isGrokPackedReasoning(items[0])) {
    return {
      ...block,
      thinkingSignature: JSON.stringify(items[0])
    };
  }
  const packed = {
    type: GROK_PACKED_REASONING_TYPE,
    items
  };
  return {
    ...block,
    thinkingSignature: JSON.stringify(packed)
  };
}

/**
 * Drop empty thinking blocks from visible content and attach their signatures
 * to the first displayable thinking block (or one empty carrier if none).
 */
export function packGrokThinkingBlocks(content: any[]): any[] {
  const leading: any[] = [];
  const out: any[] = [];
  let carrierIndex = -1;
  for (const block of content) {
    if (block.type !== "thinking") {
      out.push(block);
      continue;
    }
    const items = unpackSignature(block.thinkingSignature);
    if (isDisplayableThinking(block.thinking)) {
      const packed = withPackedSignature(block, [...leading, ...items]);
      leading.length = 0;
      carrierIndex = out.length;
      out.push(packed);
      continue;
    }
    leading.push(
      ...(items.length > 0
        ? items
        : [
            {
              type: "reasoning",
              summary: []
            }
          ])
    );
  }
  if (leading.length === 0) return out;
  if (carrierIndex >= 0) {
    const carrier = out[carrierIndex];
    if (carrier !== undefined) {
      out[carrierIndex] = withPackedSignature(carrier, [...unpackSignature(carrier.thinkingSignature), ...leading]);
    }
    return out;
  }
  const first = content.find((block) => block.type === "thinking");
  if (first === undefined) return out;
  out.unshift(withPackedSignature(first, leading));
  return out;
}

/**
 * Replace packed reasoning items in a Responses `input` with the original
 * Grok items, in the order they were packed.
 */
export function expandPackedGrokReasoningInput(payload: unknown): unknown {
  if (!isRecord(payload) || !Array.isArray(payload["input"])) return payload;
  const input: any[] = [];
  for (const item of payload["input"]) {
    if (isGrokPackedReasoning(item)) input.push(...item.items);
    else input.push(item);
  }
  return {
    ...payload,
    input
  };
}

export class GrokThinkingFilter {
  heldStarts = new Map<number, any>();
  opened = new Set<number>();

  take(event: any): any[] {
    switch (event.type) {
      case "thinking_start":
        this.heldStarts.set(event.contentIndex, event);
        return [];
      case "thinking_delta":
        if (!isDisplayableThinking(event.delta) && !this.opened.has(event.contentIndex)) return [];
        return this.openAnd(event);
      case "thinking_end":
        if (!isDisplayableThinking(event.content) && !this.opened.has(event.contentIndex)) {
          this.heldStarts.delete(event.contentIndex);
          return [];
        }
        return this.openAnd(event);
      case "done":
        return [
          {
            ...event,
            message: packAssistant(event.message)
          }
        ];
      case "error":
        return [
          {
            ...event,
            error: packAssistant(event.error)
          }
        ];
      default:
        return [event];
    }
  }

  private openAnd(event: any): any[] {
    const forwarded: any[] = [];
    const held = this.heldStarts.get(event.contentIndex);
    if (held !== undefined && !this.opened.has(event.contentIndex)) forwarded.push(held);
    this.heldStarts.delete(event.contentIndex);
    this.opened.add(event.contentIndex);
    forwarded.push(event);
    return forwarded;
  }
}

export function packAssistant(message: any): any {
  if (!message || !Array.isArray(message.content)) return message;
  return {
    ...message,
    content: packGrokThinkingBlocks(message.content)
  };
}

export function filterGrokThinkingStream(inner: any): any {
  const out = createAssistantMessageEventStream();
  pumpGrokThinkingStream(inner, out);
  return out;
}

async function pumpGrokThinkingStream(inner: any, out: any): Promise<void> {
  const search = new GrokServerSearchCallFilter();
  const thinking = new GrokThinkingFilter();
  try {
    for await (const event of inner) {
      for (const afterSearch of search.take(event)) {
        for (const next of thinking.take(afterSearch)) {
          out.push(next);
        }
      }
    }
  } finally {
    out.end();
  }
}

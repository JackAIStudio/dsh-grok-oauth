import { isRecord, type GrokCatalogModel, type GrokReasoningEffort } from "./contract.js";

/**
 * Official Grok reasoning wire: Responses `reasoning.effort` is the
 * models-v2 `reasoning_efforts[].value`. xAI documents
 * `low` / `medium` / `high` (default) / `xhigh`, and reasoning cannot be
 * disabled. `none`, `off`, and `summary` are not part of that request.
 */
export const GROK_REASONING_WIRES = [
  "low",
  "medium",
  "high",
  "xhigh"
] as const;

export type GrokReasoningWire = (typeof GROK_REASONING_WIRES)[number];

export const GROK_DEFAULT_REASONING_WIRE = "high";
export const UNSUPPORTED = null;

export const GROK_4_6_REASONING_EFFORTS = Object.freeze([
  Object.freeze({
    id: "xhigh",
    value: "xhigh",
    label: "Extra High Effort",
    description: "Highest effort and reasoning level"
  }),
  Object.freeze({
    id: "high",
    value: "high",
    label: "High Effort",
    description: "Higher implementation quality with extensive reasoning"
  }),
  Object.freeze({
    id: "medium",
    value: "medium",
    label: "Medium Effort",
    description: "Balanced effort with standard implementation and testing"
  }),
  Object.freeze({
    id: "low",
    value: "low",
    label: "Low Effort",
    description: "Quick, fast implementations"
  })
]);

export const GROK_4_5_REASONING_EFFORTS = Object.freeze(
  GROK_4_6_REASONING_EFFORTS.filter((effort) => effort.value !== "xhigh")
);

export function isGrokReasoningWire(value: unknown): value is GrokReasoningWire {
  return typeof value === "string" && (GROK_REASONING_WIRES as readonly string[]).includes(value);
}

export function officialEffortsFor(model: GrokCatalogModel): readonly GrokReasoningEffort[] {
  if (model.reasoningEfforts !== undefined && model.reasoningEfforts.length > 0) {
    return model.reasoningEfforts;
  }
  return model.id === "grok-4.5" ? GROK_4_5_REASONING_EFFORTS : GROK_4_6_REASONING_EFFORTS;
}

export function officialDefaultEffort(model: GrokCatalogModel): string {
  const values = new Set(officialEffortsFor(model).map((effort) => effort.value));
  const configured = model.defaultReasoningEffort;
  if (configured !== undefined && values.has(configured) && isGrokReasoningWire(configured)) {
    return configured;
  }
  if (values.has("high")) return GROK_DEFAULT_REASONING_WIRE;
  for (const effort of officialEffortsFor(model)) {
    if (isGrokReasoningWire(effort.value)) return effort.value;
  }
  return GROK_DEFAULT_REASONING_WIRE;
}

export function grokThinkingLevelMap(model: GrokCatalogModel): Record<string, string | null> {
  const values = new Set(officialEffortsFor(model).map((effort) => effort.value));
  return {
    off: UNSUPPORTED,
    minimal: UNSUPPORTED,
    low: values.has("low") ? "low" : UNSUPPORTED,
    medium: values.has("medium") ? "medium" : UNSUPPORTED,
    high: values.has("high") ? "high" : UNSUPPORTED,
    xhigh: values.has("xhigh") ? "xhigh" : UNSUPPORTED,
    max: UNSUPPORTED
  };
}

export function resolveGrokReasoningWire(requested: unknown, model: GrokCatalogModel): string {
  const efforts = officialEffortsFor(model);
  const fallback = officialDefaultEffort(model);
  if (typeof requested !== "string" || requested.length === 0) return fallback;
  for (const effort of efforts) {
    if (effort.value === requested || effort.id === requested) {
      return isGrokReasoningWire(effort.value) ? effort.value : fallback;
    }
  }
  return fallback;
}

export function applyGrokReasoningWire(payload: unknown, model: GrokCatalogModel): unknown {
  if (!isRecord(payload) || model.thinking !== true) return payload;
  const reasoningObj = isRecord(payload["reasoning"]) ? payload["reasoning"] : undefined;
  const effort = resolveGrokReasoningWire(reasoningObj?.["effort"], model);
  return {
    ...payload,
    reasoning: { effort }
  };
}

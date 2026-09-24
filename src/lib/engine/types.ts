export type ResolutionStatus = "RESOLVED" | "UNKNOWN" | "NOT_APPLICABLE" | "INVALID";

export type ResolutionResult<T> =
  | { status: "RESOLVED"; value: T; dependencies: string[]; provenance: string[] }
  | { status: "UNKNOWN"; dependencies: string[]; provenance: string[]; reason: string }
  | { status: "NOT_APPLICABLE"; dependencies: string[]; provenance: string[]; reason: string }
  | { status: "INVALID"; dependencies: string[]; provenance: string[]; reason: string };

export type RuleEffect = {
  id: string;
  kind: "SET" | "ADD" | "MULTIPLY" | "CAP" | "FLOOR" | "AVAILABLE" | "UNAVAILABLE" | "RESTRICTION";
  target: string;
  value?: number;
  source: string;
  scope?: "battle" | "player" | "unit" | "model" | "weapon" | "objective" | "attack" | "target";
};
export type MeetingPhase =
  | "idle"
  | "ready"
  | "streaming"
  | "failed"
  | "cancelled"
  | "completed";

export type SeatStatus =
  | "queued"
  | "speaking"
  | "heard"
  | "failed"
  | "cancelled";

export type LogEntry = {
  agentId: string;
  agentName: string;
  content: string;
};

export type MeetingError = {
  kind: "missing-key" | "invalid-key" | "network" | "upstream";
  message: string;
};

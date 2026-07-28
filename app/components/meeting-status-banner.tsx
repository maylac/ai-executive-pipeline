import { Agent } from "@/lib/agents";
import { LogEntry, MeetingError, MeetingPhase } from "./meeting-types";

type MeetingStatusBannerProps = {
  phase: MeetingPhase;
  error: MeetingError | null;
  activeAgent: Agent | null;
  logs: LogEntry[];
  onRetry: () => void;
  onNewMeeting: () => void;
};

export function MeetingStatusBanner({
  phase,
  error,
  activeAgent,
  logs,
  onRetry,
  onNewMeeting,
}: MeetingStatusBannerProps) {
  if (phase !== "failed" && phase !== "cancelled") return null;

  const isFailed = phase === "failed";
  const partialContent = activeAgent
    ? logs.find((entry) => entry.agentId === activeAgent.id)?.content.trim()
    : "";
  const heading = isFailed ? "Meeting paused" : "Meeting cancelled";
  const message = isFailed
    ? error?.message ?? "This seat could not complete its response."
    : "The current stream was stopped. Any partial record remains available below.";

  return (
    <section className={`meeting-status meeting-status--${phase}`} role={isFailed ? "alert" : "status"}>
      <p className="eyebrow">{isFailed ? "Action required" : "Record preserved"}</p>
      <h2>{heading}{activeAgent ? ` at ${activeAgent.name}` : ""}</h2>
      <p>{message}</p>
      {partialContent && <p className="status-detail">Partial transcript preserved; this seat is not marked heard.</p>}
      <div className="status-actions">
        <button className="button button--primary" type="button" onClick={onRetry}>
          {isFailed ? "Retry seat" : "Resume seat"}
        </button>
        <button className="button button--quiet" type="button" onClick={onNewMeeting}>Start new meeting</button>
      </div>
    </section>
  );
}

import { AGENTS } from "@/lib/agents";
import { LogEntry, SeatStatus } from "./meeting-types";

type DecisionDocketProps = {
  logs: LogEntry[];
  seatStatuses: SeatStatus[];
  activeSeatIndex: number | null;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
};

const statusCopy: Record<SeatStatus, { symbol: string; label: string }> = {
  queued: { symbol: "○", label: "Queued" },
  speaking: { symbol: "●", label: "Speaking" },
  heard: { symbol: "✓", label: "Heard" },
  failed: { symbol: "!", label: "Failed" },
  cancelled: { symbol: "×", label: "Cancelled" },
};

function recordSummary(content: string) {
  return content.replace(/[#*_`]/g, "").replace(/\s+/g, " ").trim().slice(0, 92);
}

export function DecisionDocket({
  logs,
  seatStatuses,
  activeSeatIndex,
  isMobileOpen,
  onMobileToggle,
}: DecisionDocketProps) {
  const heardCount = seatStatuses.filter((status) => status === "heard").length;

  return (
    <nav className="decision-docket" aria-label="Board docket">
      <button
        className="docket-mobile-toggle"
        type="button"
        aria-expanded={isMobileOpen}
        aria-controls="docket-list"
        onClick={onMobileToggle}
      >
        <span>Board docket</span>
        <span className="utility-text">{heardCount} of {AGENTS.length} heard · {isMobileOpen ? "Hide" : "View"}</span>
      </button>
      <div className={`docket-record ${isMobileOpen ? "is-open" : ""}`} id="docket-list">
        <div className="docket-heading">
          <span>Decision docket</span>
          <span>{heardCount}/{AGENTS.length} heard</span>
        </div>
        <ol>
          {AGENTS.map((agent, index) => {
            const status = seatStatuses[index];
            const log = logs.find((entry) => entry.agentId === agent.id);
            const canJumpToTranscript = Boolean(log?.content);
            const summary = log?.content ? recordSummary(log.content) : "";
            const recordType = /\bobjection\b/i.test(log?.content ?? "") ? "Objection" : "Motion";
            const copy = statusCopy[status];

            return (
              <li key={agent.id} className={`docket-seat docket-seat--${status}`}>
                <div className="docket-seat-title">
                  <span className="seat-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <span className="seat-name">{agent.name}</span>
                    <span className="seat-role">{agent.role}</span>
                  </div>
                </div>
                <p className="docket-status">
                  <span aria-hidden="true">{copy.symbol}</span> {copy.label}
                  {activeSeatIndex === index && <span className="sr-only">, current seat</span>}
                </p>
                {summary && (
                  <p className="docket-summary">
                    <span>{recordType}</span>
                    {canJumpToTranscript ? (
                      <a href={`#transcript-${agent.id}`}>{summary}</a>
                    ) : (
                      summary
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

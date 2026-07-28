import { LogEntry } from "./meeting-types";
import { extractVerdict } from "@/lib/verdict";

type DecisionSummaryProps = {
  finalLog: LogEntry;
};

export function DecisionSummary({ finalLog }: DecisionSummaryProps) {
  const verdict = extractVerdict(finalLog.content);

  return (
    <aside className="decision-summary" aria-labelledby="decision-heading">
      <p className="eyebrow">Decision recorded</p>
      <h2 id="decision-heading">Final decision</h2>
      <p className="decision-verdict">{verdict ?? "Review the record"}</p>
      <p>Final judgment entered by {finalLog.agentName}. The full rationale remains in the board record.</p>
    </aside>
  );
}

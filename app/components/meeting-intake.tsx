import { Play } from "lucide-react";
import { MeetingError, MeetingPhase } from "./meeting-types";

type MeetingIntakeProps = {
  idea: string;
  phase: MeetingPhase;
  error: MeetingError | null;
  hasApiKey: boolean;
  onIdeaChange: (idea: string) => void;
  onStart: () => void;
  onOpenSettings: () => void;
};

export function MeetingIntake({
  idea,
  phase,
  error,
  hasApiKey,
  onIdeaChange,
  onStart,
  onOpenSettings,
}: MeetingIntakeProps) {
  return (
    <section className="intake" aria-labelledby="intake-heading">
      <p className="eyebrow">{phase === "idle" ? "No case open" : "Case ready"}</p>
      <h1 id="intake-heading">What should the board examine?</h1>
      <p className="section-intro">Open a five-seat review with one clear business idea.</p>
      <label className="field-label" htmlFor="seed-idea">Business idea</label>
      <textarea
        id="seed-idea"
        value={idea}
        onChange={(event) => onIdeaChange(event.target.value)}
        placeholder="Describe the business idea in one paragraph."
        rows={7}
      />
      <div className="intake-actions">
        <button className="button button--primary" type="button" onClick={onStart} disabled={!idea.trim()}>
          <Play aria-hidden="true" size={16} />
          Start board meeting
        </button>
        <p className="key-status">API key: {hasApiKey ? "ready" : "not set"} · held in this page only.</p>
      </div>
      {error?.kind === "missing-key" && (
        <div className="inline-notice" role="alert">
          <p>{error.message}</p>
          <button className="button button--quiet" type="button" onClick={onOpenSettings}>Open Settings</button>
        </div>
      )}
    </section>
  );
}

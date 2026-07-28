"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { AGENTS } from "@/lib/agents";
import { LogEntry, MeetingPhase } from "./meeting-types";

type HearingTranscriptProps = {
  idea: string;
  logs: LogEntry[];
  phase: MeetingPhase;
  activeSeatIndex: number | null;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HearingTranscript({ idea, logs, phase, activeSeatIndex }: HearingTranscriptProps) {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript || !shouldAutoScrollRef.current) return;
    transcript.scrollTo({
      top: transcript.scrollHeight,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [logs, activeSeatIndex]);

  const updateManualScroll = () => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    shouldAutoScrollRef.current = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 32;
  };

  return (
    <section className="hearing" aria-labelledby="hearing-heading">
      <div className="idea-record">
        <span className="eyebrow">Case submission</span>
        <p>{idea}</p>
      </div>
      <div className="hearing-heading">
        <div>
          <p className="eyebrow">{phase === "streaming" ? "Current hearing" : "Board record"}</p>
          <h1 id="hearing-heading">
            {phase === "streaming" && activeSeatIndex !== null
              ? AGENTS[activeSeatIndex].name
              : "Decision record"}
          </h1>
          {phase === "streaming" && activeSeatIndex !== null && <p>{AGENTS[activeSeatIndex].role}</p>}
        </div>
        {phase === "streaming" && <span className="live-marker"><span aria-hidden="true">●</span> Speaking</span>}
      </div>
      <div className="transcript" ref={transcriptRef} onScroll={updateManualScroll} aria-label="Board transcript">
        {logs.map((log, index) => {
          const agent = AGENTS.find((candidate) => candidate.id === log.agentId);
          const isActive = activeSeatIndex !== null && AGENTS[activeSeatIndex]?.id === log.agentId;
          return (
            <article className="transcript-entry" id={`transcript-${log.agentId}`} key={log.agentId} tabIndex={-1}>
              <header>
                <span className="seat-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{log.agentName}</h2>
                  <p>{agent?.role}</p>
                </div>
                {isActive && <span className="entry-status">Speaking</span>}
              </header>
              {log.content ? (
                <div className="prose"><ReactMarkdown>{log.content}</ReactMarkdown></div>
              ) : isActive ? (
                <p className="transcript-pending">Receiving the board record…</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

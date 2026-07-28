"use client";

import { useCallback, useRef, useState } from "react";
import { Settings, X } from "lucide-react";
import { AGENTS, Agent } from "@/lib/agents";
import { DecisionDocket } from "./components/decision-docket";
import { DecisionSummary } from "./components/decision-summary";
import { HearingTranscript } from "./components/hearing-transcript";
import { MeetingIntake } from "./components/meeting-intake";
import { MeetingStatusBanner } from "./components/meeting-status-banner";
import { LogEntry, MeetingError, MeetingPhase, SeatStatus } from "./components/meeting-types";
import { SettingsDialog } from "./components/settings-dialog";

const initialSeatStatuses = (): SeatStatus[] => AGENTS.map(() => "queued");

function promptFor(agent: Agent, seedIdea: string, currentContext: string) {
  if (agent.id === "son") {
    return `Here is the seed idea: "${seedIdea}". Transform this.`;
  }
  return `Here is the proposal so far:\n\n${currentContext}\n\nYour turn.`;
}

function contextFor(seedIdea: string, logs: LogEntry[]) {
  return logs.reduce(
    (context, log) => `${context}\n\n--- Proposal by ${log.agentName} ---\n${log.content}`,
    `Initial Idea: ${seedIdea}`
  );
}

function errorDetails(error: unknown): MeetingError {
  const message = error instanceof Error ? error.message : "The response could not be completed.";
  if (/api key|required|incorrect|invalid|401/i.test(message)) {
    return { kind: "invalid-key", message: "The API key was rejected. Check it in Settings and retry this seat." };
  }
  if (error instanceof TypeError || /network|failed to fetch/i.test(message)) {
    return { kind: "network", message: "The network connection was interrupted. Check your connection and retry this seat." };
  }
  return { kind: "upstream", message: `This seat could not complete: ${message}` };
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [seedIdea, setSeedIdea] = useState("");
  const [phase, setPhase] = useState<MeetingPhase>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>(initialSeatStatuses);
  const [activeSeatIndex, setActiveSeatIndex] = useState<number | null>(null);
  const [meetingError, setMeetingError] = useState<MeetingError | null>(null);
  const [docketOpen, setDocketOpen] = useState(false);
  const [caseNumber, setCaseNumber] = useState(1);

  const logsRef = useRef<LogEntry[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const replaceLogs = useCallback((nextLogs: LogEntry[]) => {
    logsRef.current = nextLogs;
    setLogs(nextLogs);
  }, []);

  const setSeatStatus = useCallback((seatIndex: number, status: SeatStatus) => {
    setSeatStatuses((previous) => previous.map((value, index) => index === seatIndex ? status : value));
  }, []);

  const closeSettings = useCallback(() => setShowSettings(false), []);

  const streamAgentResponse = useCallback(async (
    agent: Agent,
    userContent: string,
    signal: AbortSignal,
    onChunk: (chunk: string) => void
  ) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, systemPrompt: agent.systemPrompt, userContent }),
      signal,
    });
    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) message = errorBody.error;
      } catch {
        // The route's error body may not be JSON; retain the status fallback.
      }
      throw new Error(message);
    }
    if (!response.body) throw new Error("The response did not include a stream.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
    const remaining = decoder.decode();
    if (remaining) onChunk(remaining);
  }, [apiKey]);

  const runMeeting = useCallback(async (startSeatIndex: number, completedLogs: LogEntry[]) => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let currentContext = contextFor(seedIdea, completedLogs);
    let seatIndex = startSeatIndex;

    setPhase("streaming");
    setMeetingError(null);
    try {
      for (seatIndex = startSeatIndex; seatIndex < AGENTS.length; seatIndex += 1) {
        const agent = AGENTS[seatIndex];
        setActiveSeatIndex(seatIndex);
        setSeatStatus(seatIndex, "speaking");
        const nextLog = { agentId: agent.id, agentName: agent.name, content: "" };
        replaceLogs([...logsRef.current, nextLog]);

        let agentResponse = "";
        await streamAgentResponse(agent, promptFor(agent, seedIdea, currentContext), controller.signal, (chunk) => {
          if (runIdRef.current !== runId) return;
          agentResponse += chunk;
          replaceLogs(logsRef.current.map((log) => log.agentId === agent.id ? { ...log, content: agentResponse } : log));
        });
        if (runIdRef.current !== runId) return;
        if (controller.signal.aborted) throw new DOMException("Meeting cancelled", "AbortError");
        if (!agentResponse.trim()) throw new Error("The response ended without any content.");

        currentContext += `\n\n--- Proposal by ${agent.name} ---\n${agentResponse}`;
        setSeatStatus(seatIndex, "heard");
      }
      if (runIdRef.current !== runId) return;
      setPhase("completed");
      setActiveSeatIndex(null);
    } catch (error) {
      if (runIdRef.current !== runId) return;
      if (error instanceof Error && error.name === "AbortError") {
        setSeatStatus(seatIndex, "cancelled");
        setPhase("cancelled");
      } else {
        setSeatStatus(seatIndex, "failed");
        setMeetingError(errorDetails(error));
        setPhase("failed");
      }
    } finally {
      if (runIdRef.current === runId) abortControllerRef.current = null;
    }
  }, [replaceLogs, seedIdea, setSeatStatus, streamAgentResponse]);

  const startMeeting = () => {
    if (!seedIdea.trim()) return;
    if (!apiKey.trim()) {
      setMeetingError({ kind: "missing-key", message: "Add an OpenAI API key in Settings before starting the board meeting." });
      setPhase("ready");
      return;
    }
    abortControllerRef.current?.abort();
    replaceLogs([]);
    setSeatStatuses(initialSeatStatuses());
    setActiveSeatIndex(null);
    setMeetingError(null);
    void runMeeting(0, []);
  };

  const retrySeat = () => {
    if (activeSeatIndex === null) return;
    const retainedLogs = logsRef.current.filter((log) => AGENTS.findIndex((agent) => agent.id === log.agentId) < activeSeatIndex);
    replaceLogs(retainedLogs);
    setSeatStatuses(AGENTS.map((_, index) => index < activeSeatIndex ? "heard" : "queued"));
    setMeetingError(null);
    void runMeeting(activeSeatIndex, retainedLogs);
  };

  const cancelMeeting = () => abortControllerRef.current?.abort();

  const newMeeting = () => {
    runIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    replaceLogs([]);
    setSeatStatuses(initialSeatStatuses());
    setActiveSeatIndex(null);
    setMeetingError(null);
    setSeedIdea("");
    setPhase("idle");
    setDocketOpen(false);
    setCaseNumber((number) => number + 1);
  };

  const changeIdea = (idea: string) => {
    setSeedIdea(idea);
    if (phase === "idle" || phase === "ready") {
      setPhase(idea.trim() ? "ready" : "idle");
      if (meetingError?.kind === "missing-key") setMeetingError(null);
    }
  };

  const activeAgent = activeSeatIndex === null ? null : AGENTS[activeSeatIndex];
  const heardCount = seatStatuses.filter((status) => status === "heard").length;
  const progress = phase === "streaming" && activeSeatIndex !== null ? activeSeatIndex + 1 : heardCount;
  const finalLog = phase === "completed" ? logs[logs.length - 1] : null;
  const statusText: Record<MeetingPhase, string> = {
    idle: "Idea intake",
    ready: "Ready to convene",
    streaming: "Board in session",
    failed: "Meeting paused",
    cancelled: "Meeting cancelled",
    completed: "Decision recorded",
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="product-name">Executive Pipeline</p>
          <p className="utility-text">Case {String(caseNumber).padStart(3, "0")} · {statusText[phase]}</p>
        </div>
        <p className="header-progress" aria-live="polite">
          {phase === "streaming" && activeAgent ? `${progress}/${AGENTS.length} · ${activeAgent.name} speaking` : `${progress}/${AGENTS.length} seats heard`}
        </p>
      </header>

      <div className={`board-workspace board-workspace--${phase}`}>
        <main className="main-record">
          {phase === "idle" || phase === "ready" ? (
            <MeetingIntake
              idea={seedIdea}
              phase={phase}
              error={meetingError}
              hasApiKey={Boolean(apiKey.trim())}
              onIdeaChange={changeIdea}
              onStart={startMeeting}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <>
              <div className="meeting-toolbar">
                <p className="utility-text">{progress}/{AGENTS.length} seats reached</p>
                {phase === "streaming" && (
                  <button className="button button--danger" type="button" onClick={cancelMeeting}>
                    <X aria-hidden="true" size={16} /> Cancel meeting
                  </button>
                )}
              </div>
              <MeetingStatusBanner
                phase={phase}
                error={meetingError}
                activeAgent={activeAgent}
                logs={logs}
                onRetry={retrySeat}
                onNewMeeting={newMeeting}
              />
              <HearingTranscript idea={seedIdea} logs={logs} phase={phase} activeSeatIndex={activeSeatIndex} />
              {finalLog && <DecisionSummary finalLog={finalLog} />}
              {phase === "completed" && (
                <button className="button button--primary new-meeting-button" type="button" onClick={newMeeting}>Start new meeting</button>
              )}
            </>
          )}
        </main>
        <DecisionDocket
          logs={logs}
          seatStatuses={seatStatuses}
          activeSeatIndex={activeSeatIndex}
          isMobileOpen={docketOpen}
          onMobileToggle={() => setDocketOpen((open) => !open)}
        />
      </div>

      <button className="settings-launcher" type="button" onClick={() => setShowSettings(true)}>
        <Settings aria-hidden="true" size={16} /> Settings
      </button>
      <SettingsDialog
        open={showSettings}
        apiKey={apiKey}
        onApiKeyChange={(value) => {
          setApiKey(value);
          if (value.trim() && meetingError?.kind === "missing-key") setMeetingError(null);
        }}
        onClose={closeSettings}
      />
    </div>
  );
}

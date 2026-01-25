"use client";

import { useState, useRef, useEffect } from "react";
import { AGENTS, Agent } from "@/lib/agents";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2,
  Swords,
  Smartphone,
  Package,
  PiggyBank,
  Play,
  Settings,
  X,
  Terminal,
} from "lucide-react";


// Icon mapping
import { LucideIcon } from "lucide-react";
const IconMap: Record<string, LucideIcon> = {
  Globe2,
  Swords,
  Smartphone,
  Package,
  PiggyBank,
};

type LogEntry = {
  agentId: string;
  agentName: string;
  content: string;
};

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [seedIdea, setSeedIdea] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  // Ref for auto-scrolling
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, currentAgentId]);

  const runPipeline = async () => {
    if (!apiKey) {
      alert("Please enter your OpenAI API Key in Settings.");
      setShowSettings(true);
      return;
    }
    if (!seedIdea) return;

    setIsProcessing(true);
    setLogs([]);
    let currentContext = `Initial Idea: ${seedIdea}`;

    try {
      for (const agent of AGENTS) {
        setCurrentAgentId(agent.id);

        // Prepare the "User" message for this agent
        // For the first agent, it's the seed idea.
        // For subsequent agents, it includes the history.
        let promptContent = "";
        if (agent.id === "son") {
          promptContent = `Here is the seed idea: "${seedIdea}". Transform this.`;
        } else {
          promptContent = `Here is the proposal so far:\n\n${currentContext}\n\nYour turn.`;
        }

        // Add an empty log entry for this agent to stream into
        setLogs((prev) => [
          ...prev,
          { agentId: agent.id, agentName: agent.name, content: "" },
        ]);

        let agentResponse = "";
        await streamAgentResponse(agent, promptContent, (chunk) => {
          agentResponse += chunk;
          setLogs((prev) => {
            const newLogs = [...prev];
            const lastLog = newLogs[newLogs.length - 1];
            if (lastLog.agentId === agent.id) {
              lastLog.content = agentResponse;
            }
            return newLogs;
          });
        });

        // Append to context for the next agent
        currentContext += `\n\n--- Proposal by ${agent.name} ---\n${agentResponse}`;

        // Small pause for effect
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during the pipeline.");
    } finally {
      setIsProcessing(false);
      setCurrentAgentId(null);
    }
  };

  const streamAgentResponse = async (
    agent: Agent,
    userContent: string,
    onChunk: (chunk: string) => void
  ) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        systemPrompt: agent.systemPrompt,
        userContent,
      }),
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      onChunk(text);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-accent selection:text-white">
      {/* Sidebar - Agent Status */}
      <aside className="w-80 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Executive Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            AI Board of Directors
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {AGENTS.map((agent, idx) => {
            const Icon = IconMap[agent.iconName];
            const isActive = currentAgentId === agent.id;
            const isDone = logs.some((l) => l.agentId === agent.id) && !isActive;

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "relative p-4 rounded-xl border transition-all duration-300",
                  isActive
                    ? `bg-accent/10 border-${agent.color.split("-")[1]}-500/50 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                    : "bg-card border-border/50 opacity-60",
                  isDone ? "opacity-100 border-green-500/30" : ""
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-glow"
                    className={cn("absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent")}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                <div className="flex items-center gap-4 relative z-10">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isActive ? "bg-background shadow-sm" : "bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isActive ? agent.color : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <h3 className={cn("font-medium text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {agent.name}
                    </h3>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {isActive ? (
                        <span className="text-yellow-400 animate-pulse">Speaking...</span>
                      ) : isDone ? (
                        <span className="text-green-400">Completed</span>
                      ) : (
                        "Waiting"
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-between w-full p-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
          >
            <span>Settings</span>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header/Input Zone */}
        {!logs.length && !isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 w-full"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                  What is your business idea?
                </h2>
                <p className="text-muted-foreground">The board is ready to review your proposal.</p>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
                <textarea
                  value={seedIdea}
                  onChange={(e) => setSeedIdea(e.target.value)}
                  placeholder="e.g. A subscription service for fresh air..."
                  className="w-full h-32 bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-white/20 resize-none placeholder:text-muted-foreground/30 relative z-10"
                />
              </div>

              <button
                onClick={runPipeline}
                className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2 mx-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Board Meeting
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Initial Idea Header */}
              <div className="mb-12 p-6 rounded-2xl bg-muted/20 border border-white/5">
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Original Proposal</h4>
                <p className="text-xl font-light text-white/90 leading-relaxed">
                  {seedIdea}
                </p>
              </div>

              <AnimatePresence mode="popLayout">
                {logs.map((log) => {
                  const agent = AGENTS.find(a => a.id === log.agentId);
                  return (
                    <motion.div
                      key={log.agentId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative pl-8 border-l border-white/10 pb-12 last:border-0"
                    >
                      <div className={`absolute -left-[21px] top-0 w-10 h-10 rounded-full bg-background border border-white/10 flex items-center justify-center`}>
                        {agent && IconMap[agent.iconName] && (
                          <div className={`w-5 h-5 ${agent.color}`}>
                            {(() => {
                              const Icon = IconMap[agent.iconName];
                              return <Icon />;
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="mb-2 flex items-baseline gap-3">
                        <h3 className={`text-lg font-bold ${agent?.color}`}>{log.agentName}</h3>
                        <span className="text-xs text-muted-foreground">{agent?.role}</span>
                      </div>

                      <div className="prose prose-invert prose-p:leading-relaxed prose-headings:font-semibold prose-headings:text-white/80 max-w-none">
                        <ReactMarkdown>{log.content}</ReactMarkdown>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Invisible element for scrolling */}
              <div ref={logsEndRef} className="h-20" />
            </div>
          </div>
        )}

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-card w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">OpenAI API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <p className="text-xs text-muted-foreground">Your key is only stored in your browser&apos;s local state.</p>
                  </div>

                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset Button (only when finished) */}
        {!isProcessing && logs.length > 0 && (
          <div className="absolute bottom-8 right-8">
            <button
              onClick={() => { setLogs([]); setSeedIdea(""); }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full transition-all flex items-center gap-2"
            >
              New Meeting
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

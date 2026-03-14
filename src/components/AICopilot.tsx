import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solar-copilot`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (resp.status === 429) {
    toast.error("Rate limit exceeded. Please try again in a moment.");
    onDone();
    return;
  }
  if (resp.status === 402) {
    toast.error("AI credits exhausted. Please add funds.");
    onDone();
    return;
  }
  if (!resp.ok || !resp.body) {
    toast.error("Failed to connect to AI assistant.");
    onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const suggestions = [
  "How many panels do I need?",
  "What's the ROI on solar?",
  "Best panel type for my area?",
  "Explain net metering",
];

export default function AICopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages([...updated, { role: "assistant", content: "" }]);
    setStreaming(true);

    let assistantContent = "";
    await streamChat({
      messages: updated,
      onDelta: (delta) => {
        assistantContent += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantContent };
          return copy;
        });
      },
      onDone: () => setStreaming(false),
    });
  };

  return (
    <>
      {/* Desktop: Sidebar panel */}
      <div className="hidden lg:block">
        <div className="sticky top-8">
          <CopilotPanel
            messages={messages}
            input={input}
            streaming={streaming}
            scrollRef={scrollRef}
            onInput={setInput}
            onSend={send}
            onClear={() => setMessages([])}
          />
        </div>
      </div>

      {/* Mobile: FAB + overlay */}
      <div className="lg:hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-4 z-50 flex flex-col rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-display font-semibold text-foreground">Solar AI Copilot</span>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-secondary">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <CopilotBody
                messages={messages}
                input={input}
                streaming={streaming}
                scrollRef={scrollRef}
                onInput={setInput}
                onSend={send}
                onClear={() => setMessages([])}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!open && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-pulse-glow"
          >
            <Bot className="h-6 w-6" />
          </motion.button>
        )}
      </div>
    </>
  );
}

function CopilotPanel({ messages, input, streaming, scrollRef, onInput, onSend, onClear }: any) {
  return (
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">Solar AI Copilot</p>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        )}
      </div>
      <CopilotBody
        messages={messages}
        input={input}
        streaming={streaming}
        scrollRef={scrollRef}
        onInput={onInput}
        onSend={onSend}
        onClear={onClear}
      />
    </div>
  );
}

function CopilotBody({ messages, input, streaming, scrollRef, onInput, onSend }: any) {
  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Hi! I'm your Solar AI Copilot</p>
              <p className="text-xs text-muted-foreground mt-1">Ask me anything about solar energy</p>
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m: Message, i: number) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {m.content || (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); onSend(); }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => onInput(e.target.value)}
            placeholder="Ask about solar…"
            disabled={streaming}
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}

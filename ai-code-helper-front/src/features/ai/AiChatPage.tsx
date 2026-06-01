import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteChatHistoryByMemoryId,
  getAllChatHistory,
  getChatHistoryByMemoryId,
  getChatSseUrl,
  type ChatHistoryDto,
  streamChatSSE,
} from "../../api";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  error?: boolean;
}

function createRoomId(): number {
  return Math.floor(Math.random() * 2_147_000_000);
}

function createUniqueRoomId(existing: Set<number>): number {
  for (let i = 0; i < 8; i++) {
    const id = createRoomId();
    if (!existing.has(id)) return id;
  }
  return createRoomId();
}

function safeTimeMs(t: string | null | undefined): number {
  if (!t) return 0;
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? ms : 0;
}

function buildMessagesFromHistory(itemsDesc: ChatHistoryDto[]): ChatMessage[] {
  const itemsAsc = [...itemsDesc].sort((a, b) => safeTimeMs(a.createTime) - safeTimeMs(b.createTime));
  const out: ChatMessage[] = [];
  for (const it of itemsAsc) {
    out.push({
      id: `h-u-${it.id}`,
      role: "user",
      content: it.userMessage ?? "",
    });
    out.push({
      id: `h-a-${it.id}`,
      role: "assistant",
      content: it.aiResponse ?? "",
    });
  }
  return out;
}

type SessionItem = {
  memoryId: number;
  lastTimeMs: number;
  title: string;
  preview: string;
};

function formatSessionTitle(memoryId: number, lastTimeMs: number): string {
  if (!lastTimeMs) return `会话 #${memoryId}`;
  const d = new Date(lastTimeMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `会话 #${memoryId} · ${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function buildSessionList(all: ChatHistoryDto[]): SessionItem[] {
  const byMem = new Map<number, ChatHistoryDto[]>();
  for (const it of all) {
    const mem = Number(it.memoryId);
    if (!Number.isFinite(mem)) continue;
    const arr = byMem.get(mem) ?? [];
    arr.push(it);
    byMem.set(mem, arr);
  }
  const sessions: SessionItem[] = [];
  for (const [memoryId, arr] of byMem.entries()) {
    const latest = arr.reduce((best, cur) => (safeTimeMs(cur.createTime) > safeTimeMs(best.createTime) ? cur : best));
    const lastTimeMs = safeTimeMs(latest.createTime);
    const title = formatSessionTitle(memoryId, lastTimeMs);
    const previewSrc = (latest.userMessage || latest.aiResponse || "").trim();
    const preview = previewSrc.length > 60 ? `${previewSrc.slice(0, 60)}…` : previewSrc || "（无内容）";
    sessions.push({ memoryId, lastTimeMs, title, preview });
  }
  sessions.sort((a, b) => b.lastTimeMs - a.lastTimeMs || b.memoryId - a.memoryId);
  return sessions;
}

export function AiChatPage() {
  const [roomId, setRoomId] = useState<number>(() => createRoomId());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const roomLabel = useMemo(() => `会话 #${roomId}`, [roomId]);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const sessionIdSet = useMemo(() => new Set(sessions.map((s) => s.memoryId)), [sessions]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const all = await getAllChatHistory();
      setSessions(buildSessionList(all));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `请求异常：${String(e)}`;
      setSessionsError(msg);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const appendAssistantChunk = useCallback((assistantId: string, chunk: string) => {
    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk, error: false } : m)));
  }, []);

  const setAssistantError = useCallback((assistantId: string, message: string) => {
    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: message, error: true } : m)));
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now()}`;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    streamAbortRef.current?.abort();
    const ac = new AbortController();
    streamAbortRef.current = ac;
    const url = getChatSseUrl(roomId, text);

    try {
      await streamChatSSE(url, ac.signal, (chunk) => {
        appendAssistantChunk(assistantId, chunk);
      });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      const msg = e instanceof Error ? e.message : `请求异常：${String(e)}`;
      setAssistantError(assistantId, msg);
    } finally {
      setStreaming(false);
      if (streamAbortRef.current === ac) streamAbortRef.current = null;
      refreshSessions();
    }
  }, [appendAssistantChunk, input, refreshSessions, roomId, setAssistantError, streaming]);

  const openSession = useCallback(
    async (memoryId: number) => {
      if (streaming) return;
      streamAbortRef.current?.abort();
      setSessionsError(null);
      try {
        const historyDesc = await getChatHistoryByMemoryId(memoryId);
        setRoomId(memoryId);
        setMessages(buildMessagesFromHistory(historyDesc));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : `请求异常：${String(e)}`;
        setSessionsError(msg);
      }
    },
    [streaming]
  );

  const deleteSession = useCallback(
    async (memoryId: number) => {
      if (streaming) return;
      streamAbortRef.current?.abort();
      setSessionsError(null);
      try {
        await deleteChatHistoryByMemoryId(memoryId);
        await refreshSessions();
        if (roomId === memoryId) {
          setMessages([]);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : `请求异常：${String(e)}`;
        setSessionsError(msg);
      }
    },
    [refreshSessions, roomId, streaming]
  );

  const startNewSession = useCallback(() => {
    if (streaming) return;
    streamAbortRef.current?.abort();
    setSessionsError(null);
    setInput("");
    setMessages([]);
    setRoomId(createUniqueRoomId(sessionIdSet));
  }, [sessionIdSet, streaming]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="ai-page">
      <header className="header">
        <div className="header-inner">
          <h1 className="title">AI 编程助手</h1>
          <p className="subtitle">编程学习 · 面试准备 · 建议与解答</p>
          <div className="room-pill" title="进入页面时自动生成，用于区分会话">
            {roomLabel}
          </div>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar">
          <button
            type="button"
            className="sidebar-primary"
            onClick={startNewSession}
            disabled={streaming}
            title="新建对话（退出历史会话）"
          >
            新对话
          </button>
          <div className="sidebar-head">
            <div className="sidebar-title">历史会话</div>
            <button
              type="button"
              className="sidebar-refresh"
              onClick={refreshSessions}
              disabled={sessionsLoading || streaming}
              title="刷新历史会话"
            >
              刷新
            </button>
          </div>

          {sessionsError && <div className="sidebar-error">{sessionsError}</div>}

          <div className="session-list" aria-busy={sessionsLoading}>
            {sessions.length === 0 && !sessionsLoading ? (
              <div className="session-empty">暂无历史会话</div>
            ) : (
              sessions.map((s) => (
                <div key={s.memoryId} className={`session-item ${roomId === s.memoryId ? "session-item-active" : ""}`}>
                  <button
                    type="button"
                    className="session-open"
                    onClick={() => openSession(s.memoryId)}
                    disabled={streaming}
                    title={s.title}
                  >
                    <div className="session-title">{s.title}</div>
                    <div className="session-preview">{s.preview}</div>
                  </button>
                  <button
                    type="button"
                    className="session-del"
                    onClick={() => deleteSession(s.memoryId)}
                    disabled={streaming}
                    title="删除该会话"
                    aria-label={`删除会话 ${s.memoryId}`}
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="chat-panel">
          <div className="chat-scroll" ref={listRef}>
            {messages.length === 0 && <div className="empty-hint">在下方输入问题，通过流式回复实时查看 AI 回答。</div>}
            {messages.map((m) => (
              <div key={m.id} className={`row ${m.role === "user" ? "row-user" : "row-ai"}`}>
                <div className={`bubble ${m.role === "user" ? "bubble-user" : "bubble-ai"} ${m.error ? "bubble-error" : ""}`}>
                  {m.role === "assistant" && m.content === "" && streaming ? (
                    <span className="typing">正在生成…</span>
                  ) : (
                    <span className="bubble-text">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <footer className="composer">
            <textarea
              className="input"
              rows={3}
              placeholder="输入编程或面试相关问题，Enter 发送，Shift+Enter 换行"
              value={input}
              disabled={streaming}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button type="button" className="send-btn" disabled={streaming || !input.trim()} onClick={send}>
              {streaming ? "回复中…" : "发送"}
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}


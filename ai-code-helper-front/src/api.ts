import axios from "axios";

/** 开发环境走 Vite 代理；生产可通过 VITE_API_BASE 覆盖完整前缀，例如 http://localhost:8081/api */
function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV) return "/api";
  return "http://localhost:8081/api";
}

export const apiClient = axios.create({
  baseURL: getApiBase(),
  timeout: 30000,
});

export interface ChatHistoryDto {
  id: number;
  memoryId: number;
  userMessage: string;
  aiResponse: string;
  createTime: string; // LocalDateTime 序列化为 ISO-like 字符串
  status: string;
}

/** 生成带查询参数的 chat SSE URL */
export function getChatSseUrl(memoryId: number, userMsg: string): string {
  return apiClient.getUri({
    url: "/ai/chat",
    params: { memoryId, userMsg },
  });
}

function parseErrorBody(text: string, status: number): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return `请求失败（HTTP ${status}）`;
  }
  try {
    const j = JSON.parse(trimmed) as {
      message?: string;
      error?: string;
      path?: string;
    };
    if (j.message) return `请求失败（HTTP ${status}）：${j.message}`;
    if (j.error) return `请求失败（HTTP ${status}）：${j.error}`;
  } catch {
    /* 非 JSON，走下方原文 */
  }
  const short = trimmed.length > 800 ? `${trimmed.slice(0, 800)}…` : trimmed;
  return `请求失败（HTTP ${status}）：${short}`;
}

function extractNextEvent(buffer: string): { event: string; rest: string } | null {
  const rn = buffer.indexOf("\r\n\r\n");
  if (rn !== -1) {
    return { event: buffer.slice(0, rn), rest: buffer.slice(rn + 4) };
  }
  const ln = buffer.indexOf("\n\n");
  if (ln !== -1) {
    return { event: buffer.slice(0, ln), rest: buffer.slice(ln + 2) };
  }
  return null;
}

function parseSSEDataBlock(block: string, onData: (chunk: string) => void): void {
  const lines = block.split(/\r?\n/);
  const parts: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) {
      parts.push(line.slice(5).trimStart());
    }
  }
  if (parts.length) {
    onData(parts.join("\n"));
  }
}

/**
 * 使用 fetch 消费 SSE，便于在 HTTP 错误时读取响应体并展示。
 * Spring WebFlux 默认以 `data: …` + 空行分隔事件。
 */
export async function streamChatSSE(
  url: string,
  signal: AbortSignal,
  onData: (chunk: string) => void
): Promise<void> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "text/event-stream" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(parseErrorBody(body, res.status));
  }
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      for (;;) {
        const extracted = extractNextEvent(buffer);
        if (!extracted) break;
        buffer = extracted.rest;
        parseSSEDataBlock(extracted.event, onData);
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (buffer.trim()) {
    parseSSEDataBlock(buffer, onData);
  }
}

export async function getAllChatHistory(): Promise<ChatHistoryDto[]> {
  const res = await apiClient.get<ChatHistoryDto[]>("/ai/history");
  return res.data ?? [];
}

export async function getChatHistoryByMemoryId(memoryId: number): Promise<ChatHistoryDto[]> {
  const res = await apiClient.get<ChatHistoryDto[]>(`/ai/history/${memoryId}`);
  return res.data ?? [];
}

export async function deleteChatHistoryByMemoryId(memoryId: number): Promise<string> {
  const res = await apiClient.get<string>(`/ai/history/delete/${memoryId}`);
  return (res.data ?? "").toString();
}

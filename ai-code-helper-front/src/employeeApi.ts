import axios from "axios";
import type { Employee } from "./features/employee/employeeStore";

/**
 * 员工服务（见 doc/api.md）：默认 `http://localhost:8080/api`。
 * 开发环境走 Vite 代理前缀 `/employee-api`，避免与 AI 服务 `/api`（8081）冲突。
 * 生产可通过 `VITE_EMPLOYEE_API_BASE` 覆盖，例如 `http://localhost:8080/api`。
 */
function getEmployeeApiBase(): string {
  const fromEnv = import.meta.env.VITE_EMPLOYEE_API_BASE as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV) return "/employee-api";
  return "http://localhost:8080/api";
}

export const employeeApiClient = axios.create({
  baseURL: getEmployeeApiBase(),
  timeout: 30000,
});

/** 与后端 OEmployee 对齐（字段以接口文档为准，其余做宽松兼容） */
export interface OEmployee {
  employeeId?: number;
  employeeCode?: string;
  phoneNumber?: string;
  chineseName?: string;
  email?: string;
  totalDiscount?: number;
  monthlyQuota?: number;
  creationDate?: string;
  lastUpdateDate?: string;
  [key: string]: unknown;
}

export function oEmployeeToEmployee(o: OEmployee): Employee {
  const rawId = o.employeeId ?? (typeof o.id === "number" ? (o.id as number) : undefined);
  const idStr = rawId != null && Number.isFinite(Number(rawId)) ? String(rawId) : "";
  const code = o.employeeCode != null ? String(o.employeeCode) : "";
  return {
    id: idStr || (code ? `code:${code}` : `row-${Math.random().toString(36).slice(2)}`),
    employeeCode: code,
    phone: o.phoneNumber != null ? String(o.phoneNumber) : undefined,
    chineseName: o.chineseName != null ? String(o.chineseName) : undefined,
    email: o.email != null ? String(o.email) : undefined,
    totalDiscountRate: typeof o.totalDiscount === "number" ? o.totalDiscount : undefined,
    monthlyTotalLimit: typeof o.monthlyQuota === "number" ? o.monthlyQuota : undefined,
    createTime:
      (typeof o.creationDate === "string" && o.creationDate) ||
      (typeof o.lastUpdateDate === "string" && o.lastUpdateDate) ||
      "",
  };
}

function mapEmployeeList(data: unknown): Employee[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => oEmployeeToEmployee(item as OEmployee));
}

/** 分页结果：total 为 null 表示后端未返回总条数（仅返回当前页数组且本页满页） */
export type PagedEmployees = {
  list: Employee[];
  total: number | null;
};

function parsePagedResponse(data: unknown, pageNum: number, pageSize: number): PagedEmployees {
  if (data == null) return { list: [], total: 0 };

  if (typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    // Spring Data Page: content + totalElements
    if (Array.isArray(o.content)) {
      const te = o.totalElements;
      const total = typeof te === "number" && Number.isFinite(te) ? te : null;
      return { list: mapEmployeeList(o.content), total };
    }
    // 常见包装：records / data + total
    if (Array.isArray(o.records)) {
      const tr = o.total;
      const total = typeof tr === "number" && Number.isFinite(tr) ? tr : null;
      return { list: mapEmployeeList(o.records), total };
    }
    if (Array.isArray(o.data)) {
      const tr = o.total ?? o.totalCount;
      const total = typeof tr === "number" && Number.isFinite(tr) ? tr : null;
      return { list: mapEmployeeList(o.data), total };
    }
  }

  if (Array.isArray(data)) {
    const list = mapEmployeeList(data);
    if (list.length < pageSize) {
      return { list, total: (pageNum - 1) * pageSize + list.length };
    }
    return { list, total: null };
  }

  return { list: [], total: 0 };
}

export function employeeApiErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status ?? "?";
    const raw = e.response?.data;
    if (typeof raw === "string" && raw.trim()) {
      const short = raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
      return `请求失败（HTTP ${status}）：${short}`;
    }
    if (raw && typeof raw === "object") {
      const j = raw as { message?: string; error?: string };
      if (j.message) return `请求失败（HTTP ${status}）：${j.message}`;
      if (j.error) return `请求失败（HTTP ${status}）：${j.error}`;
    }
    return `请求失败（HTTP ${status}）`;
  }
  if (e instanceof Error) return e.message;
  return `请求异常：${String(e)}`;
}

/** GET /api/employees?pageNum=&pageSize= — 分页查询员工列表 */
export async function fetchAllEmployeesPaged(pageNum: number, pageSize: number): Promise<PagedEmployees> {
  const res = await employeeApiClient.get<unknown>("/employees", {
    params: { pageNum, pageSize },
  });
  return parsePagedResponse(res.data, pageNum, pageSize);
}

/** GET /api/employees/code/{code}?pageNum=&pageSize= — 按编号分页查询（若后端未实现分页参数，通常仍返回整页数据） */
export async function fetchEmployeesByCodePaged(
  code: string,
  pageNum: number,
  pageSize: number
): Promise<PagedEmployees> {
  const res = await employeeApiClient.get<unknown>(`/employees/code/${encodeURIComponent(code)}`, {
    params: { pageNum, pageSize },
  });
  return parsePagedResponse(res.data, pageNum, pageSize);
}

type EmployeeDraft = Omit<Employee, "id" | "createTime">;

function draftToBody(draft: EmployeeDraft, employeeId?: number): Record<string, unknown> {
  const body: Record<string, unknown> = {
    employeeCode: draft.employeeCode,
    phoneNumber: draft.phone ?? "",
    chineseName: draft.chineseName ?? "",
    email: draft.email ?? "",
    totalDiscount: draft.totalDiscountRate ?? null,
    monthlyQuota: draft.monthlyTotalLimit ?? null,
  };
  if (employeeId != null && Number.isFinite(employeeId)) {
    body.employeeId = employeeId;
  }
  return body;
}

export async function createEmployeeRemote(draft: EmployeeDraft): Promise<void> {
  await employeeApiClient.post("/employees", draftToBody(draft));
}

export async function updateEmployeeRemote(employeeId: number, draft: EmployeeDraft): Promise<void> {
  await employeeApiClient.put("/employees", draftToBody(draft, employeeId));
}

export async function deleteEmployeeRemote(employeeId: number): Promise<void> {
  await employeeApiClient.delete(`/employees/${employeeId}`);
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEmployeeRemote,
  deleteEmployeeRemote,
  employeeApiErrorMessage,
  fetchAllEmployeesPaged,
  fetchEmployeesByCodePaged,
  updateEmployeeRemote,
} from "../../employeeApi";
import { EmployeeModal, type EmployeeModalMode } from "./EmployeeModal";
import type { Employee } from "./employeeStore";

type EmployeeDraft = Omit<Employee, "id" | "createTime">;

function formatDateTime(dt: string): string {
  if (!dt) return "—";
  const ms = Date.parse(dt);
  if (!Number.isFinite(ms)) return dt;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseServerEmployeeId(emp: Employee): number | null {
  const n = Number(emp.id);
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  return null;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeCodeInput, setEmployeeCodeInput] = useState("");
  /** 已生效的查询条件（点击「查询」后写入，分页请求随其变化） */
  const [appliedCode, setAppliedCode] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  /** 服务端总条数；null 表示未返回（仅数组且本页满页时） */
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<EmployeeModalMode>("create");
  const [editing, setEditing] = useState<Employee | null>(null);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const code = appliedCode.trim();
      const result = code
        ? await fetchEmployeesByCodePaged(code, page, pageSize)
        : await fetchAllEmployeesPaged(page, pageSize);

      if (result.list.length === 0 && page > 1) {
        setPage((p) => p - 1);
        return;
      }
      setEmployees(result.list);
      setTotalCount(result.total);
    } catch (e: unknown) {
      setListError(employeeApiErrorMessage(e));
      setEmployees([]);
      setTotalCount(0);
    } finally {
      setListLoading(false);
    }
  }, [appliedCode, page, pageSize]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (totalCount != null && totalCount >= 0) {
      const tp = Math.max(1, Math.ceil(totalCount / pageSize));
      setPage((p) => Math.min(Math.max(1, p), tp));
    }
  }, [totalCount, pageSize]);

  const totalPages = useMemo(() => {
    if (totalCount != null && totalCount >= 0) {
      return Math.max(1, Math.ceil(totalCount / pageSize));
    }
    if (employees.length < pageSize) return Math.max(1, page);
    return page + 1;
  }, [totalCount, employees.length, pageSize, page]);

  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const totalLabel = useMemo(() => {
    if (totalCount != null) return String(totalCount);
    if (employees.length < pageSize) return String((pageSafe - 1) * pageSize + employees.length);
    return "—";
  }, [totalCount, employees.length, pageSize, pageSafe]);

  const onSearch = () => {
    setAppliedCode(employeeCodeInput.trim());
    setPage(1);
  };

  const resetQuery = () => {
    setEmployeeCodeInput("");
    setAppliedCode("");
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (draft: EmployeeDraft): Promise<void> => {
    if (modalMode === "create") {
      await createEmployeeRemote(draft);
    } else {
      const sid = editing ? parseServerEmployeeId(editing) : null;
      if (sid == null) {
        throw new Error("当前行缺少服务端员工 ID，无法更新");
      }
      await updateEmployeeRemote(sid, draft);
    }
    setModalOpen(false);
    setEditing(null);
    await fetchList();
  };

  const handleDelete = async (emp: Employee) => {
    const sid = parseServerEmployeeId(emp);
    if (sid == null) {
      setListError("当前行缺少服务端员工 ID，无法删除");
      return;
    }
    const ok = window.confirm(`确认删除员工【${emp.employeeCode}】吗？`);
    if (!ok) return;
    setListError(null);
    try {
      await deleteEmployeeRemote(sid);
      await fetchList();
    } catch (e: unknown) {
      setListError(employeeApiErrorMessage(e));
    }
  };

  return (
    <div className="employee-page">
      <div className="page-header">
        <div className="page-title">员工查询</div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            新增
          </button>
        </div>
      </div>

      {listError && <div className="page-error">{listError}</div>}

      <div className="card">
        <div className="filters">
          <label className="filter-item">
            <div className="filter-label">员工编码：</div>
            <input
              className="filter-input"
              value={employeeCodeInput}
              onChange={(e) => setEmployeeCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
              placeholder="输入员工编码"
            />
          </label>
          <div className="filter-actions">
            <button type="button" className="btn btn-primary" onClick={onSearch} disabled={listLoading}>
              查询
            </button>
            <button type="button" className="btn" onClick={resetQuery} disabled={listLoading}>
              重置
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>序号</th>
                <th>员工编码</th>
                <th>手机号</th>
                <th>中文名</th>
                <th>邮箱</th>
                <th style={{ width: 120 }}>总额度折扣</th>
                <th style={{ width: 120 }}>当月总额度</th>
                <th style={{ width: 120 }}>创建时间</th>
                <th style={{ width: 140 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    加载中…
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    暂无数据
                  </td>
                </tr>
              ) : (
                employees.map((emp, idx) => (
                  <tr key={emp.id}>
                    <td>{(pageSafe - 1) * pageSize + idx + 1}</td>
                    <td>{emp.employeeCode}</td>
                    <td>{emp.phone ? emp.phone.replace(/^(\d{3})\d+(\d{2,4})$/, "$1****$2") : ""}</td>
                    <td>{emp.chineseName ? emp.chineseName.replace(/^(.).+$/, "$1******") : ""}</td>
                    <td>{emp.email ? emp.email : ""}</td>
                    <td>{emp.totalDiscountRate ?? ""}</td>
                    <td>{emp.monthlyTotalLimit ?? ""}</td>
                    <td>{formatDateTime(emp.createTime)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="link" onClick={() => openEdit(emp)}>
                          编辑
                        </button>
                        <button type="button" className="link link-danger" onClick={() => void handleDelete(emp)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!listLoading && (
          <div className="table-pagination">
            <span className="pagination-total">共 {totalLabel} 条</span>
            <div className="pagination-right">
              <label className="pagination-page-size">
                <span className="pagination-page-size-label">每页</span>
                <select
                  className="pagination-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="每页条数"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="pagination-page-size-suffix">条</span>
              </label>
              <span className="pagination-page-info">
                第 {employees.length === 0 && !listLoading ? 0 : pageSafe} / {employees.length === 0 && !listLoading ? 0 : totalPages} 页
              </span>
              <button
                type="button"
                className="btn pagination-btn"
                disabled={employees.length === 0 || pageSafe <= 1}
                onClick={() => setPage(1)}
              >
                首页
              </button>
              <button
                type="button"
                className="btn pagination-btn"
                disabled={employees.length === 0 || pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </button>
              <button
                type="button"
                className="btn pagination-btn"
                disabled={employees.length === 0 || pageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                下一页
              </button>
              <button
                type="button"
                className="btn pagination-btn"
                disabled={employees.length === 0 || totalCount == null || pageSafe >= totalPages}
                onClick={() => setPage(totalPages)}
                title={totalCount == null ? "总条数未知时无法跳转末页" : undefined}
              >
                末页
              </button>
            </div>
          </div>
        )}
      </div>

      <EmployeeModal open={modalOpen} mode={modalMode} initial={editing} onClose={closeModal} onSubmit={handleSubmit} />
    </div>
  );
}

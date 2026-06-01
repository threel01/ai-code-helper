import { useEffect, useMemo, useState } from "react";
import type { Employee } from "./employeeStore";

type EmployeeDraft = Omit<Employee, "id" | "createTime">;

export type EmployeeModalMode = "create" | "edit";

export type EmployeeModalProps = {
  open: boolean;
  mode: EmployeeModalMode;
  initial?: Employee | null;
  onClose: () => void;
  onSubmit: (draft: EmployeeDraft) => void | Promise<void>;
};

function toNumberOrUndefined(v: string): number | undefined {
  const s = v.trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function onlyDigits(v: string): string {
  return v.replace(/[^\d]/g, "");
}

export function EmployeeModal({ open, mode, initial, onClose, onSubmit }: EmployeeModalProps) {
  const title = mode === "create" ? "新建" : "编辑";
  const initialDraft: EmployeeDraft = useMemo(
    () => ({
      employeeCode: initial?.employeeCode ?? "",
      phone: initial?.phone ?? "",
      chineseName: initial?.chineseName ?? "",
      email: initial?.email ?? "",
      totalDiscountRate: initial?.totalDiscountRate,
      monthlyTotalLimit: initial?.monthlyTotalLimit,
      extraDiscountRate: initial?.extraDiscountRate,
      extraStart: initial?.extraStart ?? "",
      extraEnd: initial?.extraEnd ?? "",
    }),
    [initial]
  );

  const [employeeCode, setEmployeeCode] = useState(initialDraft.employeeCode);
  const [phone, setPhone] = useState(initialDraft.phone ?? "");
  const [chineseName, setChineseName] = useState(initialDraft.chineseName ?? "");
  const [email, setEmail] = useState(initialDraft.email ?? "");
  const [totalDiscountRate, setTotalDiscountRate] = useState(
    initialDraft.totalDiscountRate === undefined ? "" : String(initialDraft.totalDiscountRate)
  );
  const [monthlyTotalLimit, setMonthlyTotalLimit] = useState(
    initialDraft.monthlyTotalLimit === undefined ? "" : String(initialDraft.monthlyTotalLimit)
  );
  const [extraDiscountRate, setExtraDiscountRate] = useState(
    initialDraft.extraDiscountRate === undefined ? "" : String(initialDraft.extraDiscountRate)
  );
  const [extraStart, setExtraStart] = useState(initialDraft.extraStart ?? "");
  const [extraEnd, setExtraEnd] = useState(initialDraft.extraEnd ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmployeeCode(initialDraft.employeeCode);
    setPhone(initialDraft.phone ?? "");
    setChineseName(initialDraft.chineseName ?? "");
    setEmail(initialDraft.email ?? "");
    setTotalDiscountRate(initialDraft.totalDiscountRate === undefined ? "" : String(initialDraft.totalDiscountRate));
    setMonthlyTotalLimit(initialDraft.monthlyTotalLimit === undefined ? "" : String(initialDraft.monthlyTotalLimit));
    setExtraDiscountRate(initialDraft.extraDiscountRate === undefined ? "" : String(initialDraft.extraDiscountRate));
    setExtraStart(initialDraft.extraStart ?? "");
    setExtraEnd(initialDraft.extraEnd ?? "");
    setError(null);
    setSubmitting(false);
  }, [initialDraft, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const submit = async () => {
    const code = employeeCode.trim();
    if (!code) {
      setError("员工编码为必填项");
      return;
    }
    const total = toNumberOrUndefined(totalDiscountRate);
    if (total === undefined) {
      setError("请填写总额度折扣");
      return;
    }
    if (total < 0 || total > 1) {
      setError("总额度折扣请填写 0～1 之间的小数");
      return;
    }
    const monthly = toNumberOrUndefined(monthlyTotalLimit);
    if (monthly === undefined) {
      setError("请填写当月总额度");
      return;
    }
    const extra = toNumberOrUndefined(extraDiscountRate);
    if (extra !== undefined && (extra < 0 || extra > 1)) {
      setError("额外额度折扣请填写 0～1 之间的小数");
      return;
    }
    if (extraStart && extraEnd && extraStart > extraEnd) {
      setError("额外额度有效期：开始日期不能大于结束日期");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        employeeCode: code,
        phone: phone.trim() ? onlyDigits(phone) : undefined,
        chineseName: chineseName.trim() || undefined,
        email: email.trim() || undefined,
        totalDiscountRate: total,
        monthlyTotalLimit: monthly,
        extraDiscountRate: extra,
        extraStart: extraStart || undefined,
        extraEnd: extraEnd || undefined,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `提交失败：${String(e)}`;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`${title}员工`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <label className="form-item">
            <div className="form-label">
              <span className="required">*</span> 员工编码：
            </div>
            <input className="form-input" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
          </label>

          <label className="form-item">
            <div className="form-label">手机号：</div>
            <input
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              placeholder="仅数字"
            />
          </label>

          <label className="form-item">
            <div className="form-label">姓名：</div>
            <input className="form-input" value={chineseName} onChange={(e) => setChineseName(e.target.value)} />
          </label>

          <label className="form-item">
            <div className="form-label">邮箱：</div>
            <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className="form-item">
            <div className="form-label">
              <span className="required">*</span> 总额度折扣：
            </div>
            <input
              className="form-input"
              value={totalDiscountRate}
              onChange={(e) => setTotalDiscountRate(e.target.value)}
              inputMode="decimal"
              placeholder="例如 0.5"
            />
          </label>

          <label className="form-item">
            <div className="form-label">
              <span className="required">*</span> 当月总额度：
            </div>
            <input
              className="form-input"
              value={monthlyTotalLimit}
              onChange={(e) => setMonthlyTotalLimit(e.target.value)}
              inputMode="decimal"
              placeholder="例如 6000"
            />
          </label>

          <label className="form-item">
            <div className="form-label">额外额度折扣：</div>
            <input
              className="form-input"
              value={extraDiscountRate}
              onChange={(e) => setExtraDiscountRate(e.target.value)}
              inputMode="decimal"
              placeholder="例如 0.8"
            />
          </label>

          <label className="form-item">
            <div className="form-label">额外额度有效期从：</div>
            <input className="form-input" type="date" value={extraStart} onChange={(e) => setExtraStart(e.target.value)} />
          </label>

          <label className="form-item">
            <div className="form-label">额外额度有效期至：</div>
            <input className="form-input" type="date" value={extraEnd} onChange={(e) => setExtraEnd(e.target.value)} />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "提交中…" : "确定"}
          </button>
        </div>
      </div>
    </div>
  );
}


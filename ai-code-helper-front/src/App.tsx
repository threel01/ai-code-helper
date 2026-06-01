import "./App.css";
import { useMemo, useState } from "react";
import { AiChatPage } from "./features/ai/AiChatPage";
import { EmployeePage } from "./features/employee/EmployeePage";

export default function App() {
  const [active, setActive] = useState<"ai" | "employee">("ai");
  const navItems = useMemo(
    () =>
      [
        { id: "ai" as const, label: "AI 助手" },
        { id: "employee" as const, label: "员工查询" },
      ] as const,
    []
  );

  return (
    <div className="shell">
      <aside className="nav">
        <div className="nav-brand">AI Code Helper</div>
        <div className="nav-items">
          {navItems.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`nav-item ${active === it.id ? "nav-item-active" : ""}`}
              onClick={() => setActive(it.id)}
            >
              {it.label}
            </button>
          ))}
        </div>
      </aside>
      <div className="shell-main">{active === "ai" ? <AiChatPage /> : <EmployeePage />}</div>
    </div>
  );
}

import { useState, useCallback } from "react";

// ─── DATA MODEL ──────────────────────────────────────────────────────────────

const participants = [
  { id: "EMP-001", name: "Sarah Chen", department: "Engineering", hireDate: "2021-03-15", email: "s.chen@acme.com", status: "Active" },
  { id: "EMP-002", name: "Marcus Johnson", department: "Product", hireDate: "2020-08-01", email: "m.johnson@acme.com", status: "Active" },
  { id: "EMP-003", name: "Priya Patel", department: "Sales", hireDate: "2022-01-10", email: "p.patel@acme.com", status: "Active" },
  { id: "EMP-004", name: "James Wilson", department: "Finance", hireDate: "2019-11-20", email: "j.wilson@acme.com", status: "Active" },
  { id: "EMP-005", name: "Olivia Martinez", department: "Engineering", hireDate: "2023-04-01", email: "o.martinez@acme.com", status: "Terminated" },
];

const initialGrants = [
  { id: "GRT-2024-001", participantId: "EMP-001", type: "RSU", grantDate: "2024-03-01", totalShares: 4000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 142.50, planId: "PLAN-2023-EQ" },
  { id: "GRT-2023-005", participantId: "EMP-002", type: "RSU", grantDate: "2023-06-15", totalShares: 2400, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 118.75, planId: "PLAN-2023-EQ" },
  { id: "GRT-2022-012", participantId: "EMP-004", type: "RSU", grantDate: "2022-02-01", totalShares: 3200, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 95.20, planId: "PLAN-2021-EQ" },
  { id: "GRT-2023-008", participantId: "EMP-001", type: "ISO", grantDate: "2023-09-01", totalShares: 8000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 125.00, strikePrice: 125.00, planId: "PLAN-2023-EQ" },
  { id: "GRT-2024-003", participantId: "EMP-003", type: "NQSO", grantDate: "2024-01-15", totalShares: 6000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 138.00, strikePrice: 138.00, planId: "PLAN-2023-EQ" },
  { id: "GRT-2021-002", participantId: "EMP-004", type: "ISO", grantDate: "2021-05-01", totalShares: 10000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 78.50, strikePrice: 78.50, planId: "PLAN-2021-EQ" },
  { id: "ESPP-2025-Q1", participantId: "EMP-001", type: "ESPP", grantDate: "2025-01-01", totalShares: 320, vestingSchedule: "6mo offering", status: "Complete", priceAtGrant: 155.00, purchasePrice: 131.75, planId: "ESPP-2024" },
  { id: "GRT-2023-015", participantId: "EMP-002", type: "RSA", grantDate: "2023-01-01", totalShares: 1500, vestingSchedule: "3yr monthly", status: "Active", priceAtGrant: 110.00, planId: "PLAN-2023-EQ" },
  { id: "GRT-2024-010", participantId: "EMP-003", type: "SAR", grantDate: "2024-06-01", totalShares: 5000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 145.00, strikePrice: 145.00, planId: "PLAN-2023-EQ" },
  { id: "GRT-2023-020", participantId: "EMP-005", type: "ISO", grantDate: "2023-03-01", totalShares: 4000, vestingSchedule: "4yr/1yr cliff", status: "Terminated", priceAtGrant: 112.00, strikePrice: 112.00, planId: "PLAN-2023-EQ" },
];

const ledgerEntries = [
  { grantId: "GRT-2024-001", date: "2024-03-01", type: "Granted", shares: 4000, balance: 4000, price: 142.50, notes: "Initial RSU grant", status: "Confirmed" },
  { grantId: "GRT-2024-001", date: "2025-03-01", type: "Vested", shares: 1000, balance: 3000, price: 158.25, notes: "1yr cliff vest (25%)", status: "Confirmed" },
  { grantId: "GRT-2024-001", date: "2025-03-03", type: "Released", shares: 750, balance: 2250, price: 159.10, notes: "Shares released to brokerage", status: "Confirmed" },
  { grantId: "GRT-2024-001", date: "2025-03-03", type: "Withheld", shares: 250, balance: 2250, price: 159.10, notes: "Tax withholding (sell-to-cover)", status: "Confirmed" },
  { grantId: "GRT-2023-005", date: "2023-06-15", type: "Granted", shares: 2400, balance: 2400, price: 118.75, notes: "Initial RSU grant", status: "Confirmed" },
  { grantId: "GRT-2023-005", date: "2024-06-15", type: "Vested", shares: 600, balance: 1800, price: 140.00, notes: "1yr cliff vest (25%)", status: "Confirmed" },
  { grantId: "GRT-2023-005", date: "2024-09-15", type: "Vested", shares: 150, balance: 1650, price: 148.30, notes: "Quarterly vest", status: "Confirmed" },
  { grantId: "GRT-2023-005", date: "2024-12-15", type: "Vested", shares: 150, balance: 1500, price: 152.80, notes: "Quarterly vest", status: "Confirmed" },
  { grantId: "GRT-2023-005", date: "2025-03-15", type: "Vested", shares: 150, balance: 1350, price: 160.00, notes: "Quarterly vest", status: "Confirmed" },
  { grantId: "GRT-2023-008", date: "2023-09-01", type: "Granted", shares: 8000, balance: 8000, price: 125.00, notes: "ISO grant, strike $125.00", status: "Confirmed" },
  { grantId: "GRT-2023-008", date: "2024-09-01", type: "Vested", shares: 2000, balance: 6000, price: 147.25, notes: "1yr cliff vest (25%)", status: "Confirmed" },
  { grantId: "GRT-2023-008", date: "2025-01-15", type: "Exercised", shares: 500, balance: 5500, price: 157.80, notes: "Exercise 500 @ $125.00", status: "Confirmed" },
  { grantId: "GRT-2023-008", date: "2025-03-01", type: "Vested", shares: 500, balance: 5000, price: 161.40, notes: "Quarterly vest", status: "Confirmed" },
  { grantId: "GRT-2021-002", date: "2021-05-01", type: "Granted", shares: 10000, balance: 10000, price: 78.50, notes: "ISO grant, strike $78.50", status: "Confirmed" },
  { grantId: "GRT-2021-002", date: "2022-05-01", type: "Vested", shares: 2500, balance: 7500, price: 92.00, notes: "1yr cliff vest", status: "Confirmed" },
  { grantId: "GRT-2021-002", date: "2023-05-01", type: "Vested", shares: 2500, balance: 5000, price: 112.00, notes: "Year 2 vest", status: "Confirmed" },
  { grantId: "GRT-2021-002", date: "2023-08-10", type: "Exercised", shares: 2000, balance: 3000, price: 120.50, notes: "Exercise 2000 @ $78.50", status: "Confirmed" },
  { grantId: "GRT-2021-002", date: "2024-05-01", type: "Vested", shares: 2500, balance: 500, price: 141.00, notes: "Year 3 vest", status: "Confirmed" },
  { grantId: "GRT-2021-002", date: "2025-05-01", type: "Vested", shares: 2500, balance: 0, price: 162.00, notes: "Final vest", status: "Confirmed" },
  { grantId: "GRT-2023-020", date: "2023-03-01", type: "Granted", shares: 4000, balance: 4000, price: 112.00, notes: "ISO grant", status: "Confirmed" },
  { grantId: "GRT-2023-020", date: "2024-03-01", type: "Vested", shares: 1000, balance: 3000, price: 136.00, notes: "1yr cliff vest", status: "Confirmed" },
  { grantId: "GRT-2023-020", date: "2025-01-31", type: "Terminated", shares: 0, balance: 3000, price: null, notes: "Employment terminated — Good leaver", status: "Confirmed" },
  { grantId: "GRT-2023-020", date: "2025-01-31", type: "Forfeited", shares: 3000, balance: 0, price: null, notes: "Unvested shares returned to pool", status: "Confirmed" },
];

// Approval queue / pending actions
const initialPendingActions = [
  { id: "ACT-001", type: "Exercise Request", grantId: "GRT-2024-003", participantId: "EMP-003", shares: 500, requestDate: "2026-03-18", status: "Pending Approval", priority: "Normal", requestedBy: "Priya Patel", notes: "Employee-initiated exercise request for 500 vested NQSO shares", approver: "Admin", documents: ["Notice of Exercise.pdf"] },
  { id: "ACT-002", type: "Grant Amendment", grantId: "GRT-2023-005", participantId: "EMP-002", shares: null, requestDate: "2026-03-17", status: "Pending Approval", priority: "High", requestedBy: "HR — Role Change", notes: "Promotion to VP Product — request to accelerate 200 shares and modify schedule", approver: "Comp Committee", documents: ["Amendment Letter.pdf", "Board Resolution.pdf"] },
  { id: "ACT-003", type: "Release Request", grantId: "GRT-2024-001", participantId: "EMP-001", shares: 250, requestDate: "2026-03-19", status: "Pending Signature", priority: "Normal", requestedBy: "Sarah Chen", notes: "Release 250 vested RSU shares to Fidelity brokerage", approver: "Admin", documents: ["Release Form.pdf"] },
  { id: "ACT-004", type: "Termination", grantId: null, participantId: "EMP-005", shares: null, requestDate: "2025-01-15", status: "Completed", priority: "High", requestedBy: "HR System", notes: "Voluntary resignation — Good leaver classification. 1000 vested shares retained, 3000 unvested forfeited.", approver: "HR + Legal", documents: ["Termination Letter.pdf", "Leaver Agreement.pdf"] },
  { id: "ACT-005", type: "New Grant", grantId: null, participantId: "EMP-003", shares: 3000, requestDate: "2026-03-20", status: "Draft", priority: "Normal", requestedBy: "Comp Committee", notes: "Annual refresh — 3,000 RSUs, 4yr/1yr cliff vesting", approver: "Board", documents: [] },
  { id: "ACT-006", type: "Exercise Request", grantId: "GRT-2021-002", participantId: "EMP-004", shares: 2500, requestDate: "2026-03-15", status: "Awaiting Payment", priority: "Normal", requestedBy: "James Wilson", notes: "Exercise 2500 vested ISO shares @ $78.50 strike. Documents signed.", approver: "Admin", documents: ["Notice of Exercise.pdf", "Tax Withholding Form.pdf"] },
];

const longShareTransactions = [
  { id: "LST-001", participantId: "EMP-001", date: "2025-03-03", type: "Issuance", shares: 750, source: "GRT-2024-001", costBasis: 142.50, marketPrice: 159.10, status: "Settled", account: "Fidelity" },
  { id: "LST-002", participantId: "EMP-001", date: "2025-03-15", type: "Sale", shares: 200, source: "GRT-2024-001", costBasis: 142.50, marketPrice: 161.25, status: "Settled", account: "Fidelity" },
  { id: "LST-003", participantId: "EMP-001", date: "2025-01-15", type: "Issuance", shares: 500, source: "GRT-2023-008", costBasis: 125.00, marketPrice: 157.80, status: "Settled", account: "Fidelity" },
  { id: "LST-004", participantId: "EMP-004", date: "2023-08-10", type: "Issuance", shares: 2000, source: "GRT-2021-002", costBasis: 78.50, marketPrice: 120.50, status: "Settled", account: "Fidelity" },
  { id: "LST-005", participantId: "EMP-004", date: "2023-12-01", type: "Sale", shares: 1000, source: "GRT-2021-002", costBasis: 78.50, marketPrice: 128.90, status: "Settled", account: "Fidelity" },
  { id: "LST-006", participantId: "EMP-004", date: "2025-02-15", type: "Transfer", shares: 500, source: "GRT-2021-002", costBasis: 78.50, marketPrice: 158.20, status: "Settled", account: "Personal" },
  { id: "LST-007", participantId: "EMP-003", date: "2026-03-20", type: "Issuance", shares: 500, source: "GRT-2024-003", costBasis: 138.00, marketPrice: 163.50, status: "Pending", account: "E*Trade" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const typeColors = {
  Granted: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  Vested: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  Released: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  Exercised: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  Forfeited: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  Expired: { bg: "#F5F5F4", text: "#57534E", border: "#D6D3D1" },
  Withheld: { bg: "#FDF4FF", text: "#86198F", border: "#F5D0FE" },
  Enrolled: { bg: "#F0F9FF", text: "#0C4A6E", border: "#BAE6FD" },
  Purchased: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  Terminated: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  Issuance: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  Sale: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  Transfer: { bg: "#F0F9FF", text: "#0C4A6E", border: "#BAE6FD" },
};

const grantTypeLabels = { RSU: "#6366F1", ISO: "#059669", NQSO: "#D97706", ESPP: "#0891B2", RSA: "#7C3AED", SAR: "#DC2626" };

const statusStyles = {
  "Pending Approval": { bg: "#FEF3C7", text: "#92400E", icon: "⏳" },
  "Pending Signature": { bg: "#DBEAFE", text: "#1E40AF", icon: "✍️" },
  "Awaiting Payment": { bg: "#FDE68A", text: "#78350F", icon: "💳" },
  Draft: { bg: "#F3F4F6", text: "#374151", icon: "📝" },
  Approved: { bg: "#D1FAE5", text: "#065F46", icon: "✅" },
  Rejected: { bg: "#FEE2E2", text: "#991B1B", icon: "❌" },
  Completed: { bg: "#D1FAE5", text: "#065F46", icon: "✅" },
  Cancelled: { bg: "#F5F5F4", text: "#57534E", icon: "🚫" },
};

const fmt = (n) => (n != null ? n.toLocaleString() : "—");
const fmtUSD = (n) => (n != null ? `$${n.toFixed(2)}` : "—");

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────

const Badge = ({ label, color }) => (
  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: color + "18", color, border: `1px solid ${color}44` }}>{label}</span>
);

const TxBadge = ({ type }) => {
  const c = typeColors[type] || { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{type}</span>;
};

const StatusPill = ({ status }) => {
  const s = statusStyles[status] || { bg: "#F3F4F6", text: "#374151", icon: "" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text }}>{s.icon} {status}</span>;
};

const StatusDot = ({ status }) => {
  const colors = { Active: "#22C55E", Complete: "#6366F1", Expired: "#9CA3AF", Terminated: "#EF4444", Cancelled: "#9CA3AF" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] || "#9CA3AF" }} />{status}</span>;
};

const ActionButton = ({ label, variant = "default", onClick, icon, disabled }) => {
  const styles = {
    primary: { bg: "#4F46E5", color: "#FFF", border: "#4F46E5", hoverBg: "#4338CA" },
    success: { bg: "#059669", color: "#FFF", border: "#059669", hoverBg: "#047857" },
    danger: { bg: "#FFF", color: "#DC2626", border: "#FECACA", hoverBg: "#FEF2F2" },
    warning: { bg: "#FFF", color: "#D97706", border: "#FDE68A", hoverBg: "#FFFBEB" },
    default: { bg: "#FFF", color: "#374151", border: "#D1D5DB", hoverBg: "#F9FAFB" },
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${s.border}`, background: s.bg, color: s.color, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = s.hoverBg; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = s.bg; }}
    >
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}{label}
    </button>
  );
};

const SummaryCard = ({ title, value, subtitle, accent }) => (
  <div style={{ background: "#FFF", borderRadius: 12, padding: "18px 22px", border: "1px solid #E5E7EB", flex: 1, minWidth: 170 }}>
    <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: accent || "#111827", marginTop: 4 }}>{value}</div>
    {subtitle && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{subtitle}</div>}
  </div>
);

// ─── MODAL / OVERLAY ─────────────────────────────────────────────────────────

function Modal({ title, onClose, width, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#FFF", borderRadius: 16, width: width || 640, maxHeight: "85vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#FFF", borderRadius: "16px 16px 0 0", zIndex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF", padding: 4 }}>&times;</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

const FormField = ({ label, children, required }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}{required && <span style={{ color: "#EF4444" }}> *</span>}</label>
    {children}
  </div>
);

const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, outline: "none", boxSizing: "border-box" };
const selectStyle = { ...inputStyle, background: "#FFF" };

// ─── ADD GRANT MODAL ─────────────────────────────────────────────────────────

function AddGrantModal({ onClose }) {
  const [step, setStep] = useState(1);
  return (
    <Modal title="New Grant" onClose={onClose} width={680}>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["Grant Details", "Vesting Schedule", "Documents & Review"].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 4 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: step > i + 1 ? "#059669" : step === i + 1 ? "#4F46E5" : "#E5E7EB", color: step >= i + 1 ? "#FFF" : "#9CA3AF" }}>
                {step > i + 1 ? "✓" : i + 1}
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? "#4F46E5" : "#9CA3AF" }}>{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormField label="Participant" required>
              <select style={selectStyle}>
                <option value="">Select participant...</option>
                {participants.filter(p => p.status === "Active").map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
            </FormField>
            <FormField label="Grant Type" required>
              <select style={selectStyle}>
                <option value="">Select type...</option>
                {Object.keys(grantTypeLabels).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Grant Date" required><input type="date" style={inputStyle} defaultValue="2026-03-21" /></FormField>
            <FormField label="Equity Plan" required>
              <select style={selectStyle}><option>PLAN-2023-EQ</option><option>PLAN-2021-EQ</option><option>ESPP-2024</option></select>
            </FormField>
            <FormField label="Number of Shares" required><input type="number" style={inputStyle} placeholder="e.g. 4000" /></FormField>
            <FormField label="Price at Grant (FMV)" required><input type="text" style={inputStyle} placeholder="$0.00" /></FormField>
            <FormField label="Strike / Exercise Price"><input type="text" style={inputStyle} placeholder="$0.00 (Options/SARs only)" /></FormField>
            <FormField label="Purchase Price"><input type="text" style={inputStyle} placeholder="$0.00 (ESPP only)" /></FormField>
          </div>
          <FormField label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Internal notes for this grant..." /></FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <ActionButton label="Cancel" onClick={onClose} />
            <ActionButton label="Next: Vesting Schedule" variant="primary" onClick={() => setStep(2)} icon="→" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <FormField label="Vesting Type" required>
            <select style={selectStyle}>
              <option>Time-based (Simple)</option>
              <option>Time-based (Custom)</option>
              <option>Performance-based</option>
              <option>Milestone-based</option>
              <option>Hybrid (Time + Performance)</option>
            </select>
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <FormField label="Total Duration"><select style={selectStyle}><option>4 years</option><option>3 years</option><option>2 years</option><option>1 year</option></select></FormField>
            <FormField label="Cliff Period"><select style={selectStyle}><option>1 year</option><option>6 months</option><option>None</option></select></FormField>
            <FormField label="Vesting Frequency"><select style={selectStyle}><option>Quarterly</option><option>Monthly</option><option>Annually</option><option>At cliff only</option></select></FormField>
          </div>
          <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 16, marginTop: 8, border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Preview: Vesting Schedule</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontSize: 12 }}>
              {["Year 1 (Cliff)", "Year 2", "Year 3", "Year 4"].map((yr, i) => (
                <div key={yr} style={{ textAlign: "center", padding: 8, background: "#FFF", borderRadius: 6, border: "1px solid #E5E7EB" }}>
                  <div style={{ color: "#6B7280" }}>{yr}</div>
                  <div style={{ fontWeight: 700, color: "#4338CA", fontSize: 16 }}>25%</div>
                  <div style={{ color: "#9CA3AF", fontSize: 11 }}>{i === 0 ? "Cliff" : "Quarterly"}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <ActionButton label="← Back" onClick={() => setStep(1)} />
            <ActionButton label="Next: Documents" variant="primary" onClick={() => setStep(3)} icon="→" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ border: "2px dashed #D1D5DB", borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 16, background: "#FAFAFA" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>Drag & drop grant agreement, or click to upload</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>PDF, DOCX — or use a document template</div>
          </div>
          <FormField label="Document Template">
            <select style={selectStyle}><option>Select template...</option><option>RSU Award Agreement</option><option>ISO Grant Letter</option><option>NQSO Grant Letter</option><option>SAR Agreement</option></select>
          </FormField>
          <FormField label="Signature Workflow">
            <select style={selectStyle}><option>None — manual signature</option><option>E-Signature: Employee only</option><option>E-Signature: Employee + Admin</option><option>E-Signature: Employee + Admin + Board</option></select>
          </FormField>

          <div style={{ background: "#F0F9FF", borderRadius: 8, padding: 16, marginTop: 16, border: "1px solid #BAE6FD" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0C4A6E", marginBottom: 8 }}>Review Summary</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
              <strong>Action:</strong> Create new grant<br />
              <strong>Status:</strong> Will be saved as <StatusPill status="Draft" /><br />
              <strong>Next steps:</strong> Route for approval → Generate documents → Send for signature → Confirm grant
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <ActionButton label="← Back" onClick={() => setStep(2)} />
            <div style={{ display: "flex", gap: 8 }}>
              <ActionButton label="Save as Draft" onClick={onClose} icon="📝" />
              <ActionButton label="Submit for Approval" variant="primary" onClick={onClose} icon="✓" />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── EXERCISE MODAL ──────────────────────────────────────────────────────────

function ExerciseModal({ onClose, grant }) {
  const [step, setStep] = useState(1);
  const exercisableShares = 2000;
  const currentPrice = 163.50;
  const strike = grant?.strikePrice || 125.0;

  return (
    <Modal title="Exercise Options" onClose={onClose} width={640}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["Select Shares", "Tax & Payment", "Review & Submit"].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: step > i + 1 ? "#059669" : step === i + 1 ? "#4F46E5" : "#E5E7EB", color: step >= i + 1 ? "#FFF" : "#9CA3AF" }}>
              {step > i + 1 ? "✓" : i + 1}
            </span>
            <div style={{ fontSize: 11, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? "#4F46E5" : "#9CA3AF", marginTop: 4 }}>{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span><strong>{grant?.id}</strong> &middot; <Badge label={grant?.type} color={grantTypeLabels[grant?.type]} /></span>
              <span>Strike: <strong>{fmtUSD(strike)}</strong> &middot; Current: <strong style={{ color: "#059669" }}>{fmtUSD(currentPrice)}</strong></span>
            </div>
          </div>
          <FormField label="Shares to Exercise" required>
            <input type="number" style={inputStyle} placeholder={`Max ${exercisableShares} exercisable shares`} defaultValue={500} />
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{fmt(exercisableShares)} shares currently exercisable</div>
          </FormField>
          <div style={{ background: "#ECFDF5", borderRadius: 8, padding: 16, border: "1px solid #A7F3D0", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#065F46", marginBottom: 8 }}>Estimated Value (500 shares)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
              <div><div style={{ color: "#6B7280" }}>Exercise Cost</div><div style={{ fontWeight: 700, fontFamily: "monospace" }}>{fmtUSD(500 * strike)}</div></div>
              <div><div style={{ color: "#6B7280" }}>Market Value</div><div style={{ fontWeight: 700, fontFamily: "monospace" }}>{fmtUSD(500 * currentPrice)}</div></div>
              <div><div style={{ color: "#6B7280" }}>Spread (Pre-tax)</div><div style={{ fontWeight: 700, fontFamily: "monospace", color: "#059669" }}>{fmtUSD(500 * (currentPrice - strike))}</div></div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <ActionButton label="Cancel" onClick={onClose} />
            <ActionButton label="Next: Tax & Payment" variant="primary" onClick={() => setStep(2)} icon="→" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <FormField label="Exercise Method" required>
            <select style={selectStyle}>
              <option>Cash exercise — pay full exercise cost</option>
              <option>Cashless (sell-to-cover) — sell shares to cover cost + taxes</option>
              <option>Cashless (sell all) — sell all exercised shares</option>
              <option>Stock swap — use existing shares to cover</option>
            </select>
          </FormField>
          <FormField label="Tax Withholding Method" required>
            <select style={selectStyle}>
              <option>Sell-to-cover (withhold shares)</option>
              <option>Cash payment</option>
              <option>Net settlement</option>
            </select>
          </FormField>
          <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 12, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", marginBottom: 16 }}>
            <strong>Tax Note (ISO):</strong> Early disposition within 1 year of exercise or 2 years of grant will convert ISO to NQSO treatment. Consult tax advisor.
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <ActionButton label="← Back" onClick={() => setStep(1)} />
            <ActionButton label="Next: Review" variant="primary" onClick={() => setStep(3)} icon="→" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ background: "#F0F9FF", borderRadius: 8, padding: 16, border: "1px solid #BAE6FD", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0C4A6E", marginBottom: 12 }}>Exercise Summary</div>
            <table style={{ width: "100%", fontSize: 12 }}>
              <tbody>
                {[["Grant", grant?.id], ["Type", grant?.type], ["Shares", "500"], ["Strike Price", fmtUSD(strike)], ["Exercise Cost", fmtUSD(500 * strike)], ["Est. Market Value", fmtUSD(500 * currentPrice)], ["Est. Spread", fmtUSD(500 * (currentPrice - strike))], ["Method", "Cash exercise"], ["Tax Withholding", "Sell-to-cover"]].map(([k, v]) => (
                  <tr key={k}><td style={{ padding: "4px 0", color: "#6B7280" }}>{k}</td><td style={{ padding: "4px 0", fontWeight: 600, textAlign: "right" }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: "#FEF2F2", borderRadius: 8, padding: 12, border: "1px solid #FECACA", fontSize: 12, color: "#991B1B", marginBottom: 16 }}>
            By submitting, you confirm this exercise request. Admin approval and document signing will be required before execution.
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <ActionButton label="← Back" onClick={() => setStep(2)} />
            <ActionButton label="Submit Exercise Request" variant="success" onClick={onClose} icon="✓" />
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── EDIT GRANT MODAL ────────────────────────────────────────────────────────

function EditGrantModal({ onClose, grant }) {
  return (
    <Modal title={`Edit Grant — ${grant?.id}`} onClose={onClose} width={640}>
      <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 12, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", marginBottom: 16 }}>
        Editing a confirmed grant will create an amendment record. Changes require approval before taking effect.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FormField label="Grant Date"><input type="date" style={inputStyle} defaultValue={grant?.grantDate} /></FormField>
        <FormField label="Total Shares"><input type="number" style={inputStyle} defaultValue={grant?.totalShares} /></FormField>
        <FormField label="Vesting Schedule">
          <select style={selectStyle}>
            <option>{grant?.vestingSchedule}</option>
            <option>3yr/1yr cliff</option><option>4yr/6mo cliff</option><option>Custom</option>
          </select>
        </FormField>
        <FormField label="Status">
          <select style={selectStyle}>
            <option>{grant?.status}</option><option>Active</option><option>Suspended</option><option>Cancelled</option>
          </select>
        </FormField>
      </div>
      <FormField label="Reason for Amendment" required>
        <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Describe why this grant is being amended..." />
      </FormField>
      <FormField label="Attach Supporting Documents">
        <div style={{ border: "1px dashed #D1D5DB", borderRadius: 8, padding: 16, textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
          📎 Drop files here or click to upload
        </div>
      </FormField>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <ActionButton label="Cancel" onClick={onClose} />
        <ActionButton label="Submit Amendment" variant="primary" onClick={onClose} icon="✓" />
      </div>
    </Modal>
  );
}

// ─── TERMINATION MODAL ───────────────────────────────────────────────────────

function TerminationModal({ onClose }) {
  return (
    <Modal title="Process Termination" onClose={onClose} width={640}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FormField label="Participant" required>
          <select style={selectStyle}>
            <option value="">Select participant...</option>
            {participants.filter(p => p.status === "Active").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Termination Date" required><input type="date" style={inputStyle} /></FormField>
        <FormField label="Leaver Classification" required>
          <select style={selectStyle}><option>Good Leaver</option><option>Bad Leaver</option><option>Retirement</option><option>Death/Disability</option><option>Involuntary (RIF)</option></select>
        </FormField>
        <FormField label="Reason">
          <select style={selectStyle}><option>Voluntary Resignation</option><option>Termination for Cause</option><option>Layoff/Reduction</option><option>Retirement</option><option>Mutual Agreement</option></select>
        </FormField>
      </div>

      <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 16, marginTop: 8, border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Impact Preview</div>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
              {["Grant", "Type", "Vested", "Unvested", "Action"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 11 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody style={{ fontSize: 12 }}>
            <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
              <td style={{ padding: "8px" }}>GRT-2024-001</td><td>RSU</td><td>1,000</td><td style={{ color: "#DC2626" }}>3,000</td>
              <td><select style={{ ...selectStyle, padding: "4px 8px", fontSize: 11 }}><option>Forfeit unvested</option><option>Accelerate all</option><option>Accelerate partial</option><option>Extend post-term exercise</option></select></td>
            </tr>
            <tr>
              <td style={{ padding: "8px" }}>GRT-2023-008</td><td>ISO</td><td>3,000</td><td style={{ color: "#DC2626" }}>5,000</td>
              <td><select style={{ ...selectStyle, padding: "4px 8px", fontSize: 11 }}><option>Forfeit unvested</option><option>90-day exercise window</option><option>Accelerate all</option></select></td>
            </tr>
          </tbody>
        </table>
      </div>

      <FormField label="Post-Termination Exercise Window">
        <select style={selectStyle}><option>90 days (default)</option><option>30 days</option><option>6 months</option><option>1 year</option><option>Custom</option></select>
      </FormField>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <ActionButton label="Cancel" onClick={onClose} />
        <ActionButton label="Process Termination" variant="danger" onClick={onClose} icon="⚠" />
      </div>
    </Modal>
  );
}

// ─── APPROVAL ACTION DETAIL ──────────────────────────────────────────────────

function ActionDetailModal({ action, onClose }) {
  if (!action) return null;
  const p = participants.find(pp => pp.id === action.participantId);
  const isPending = action.status === "Pending Approval";
  const isSignature = action.status === "Pending Signature";
  const isPayment = action.status === "Awaiting Payment";

  return (
    <Modal title={`${action.type} — ${action.id}`} onClose={onClose} width={640}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: 16 }}>
        <div><span style={{ color: "#6B7280" }}>Participant:</span> <strong>{p?.name}</strong></div>
        <div><span style={{ color: "#6B7280" }}>Status:</span> <StatusPill status={action.status} /></div>
        <div><span style={{ color: "#6B7280" }}>Grant:</span> <strong style={{ color: "#4338CA", fontFamily: "monospace" }}>{action.grantId || "N/A"}</strong></div>
        <div><span style={{ color: "#6B7280" }}>Priority:</span> <strong>{action.priority}</strong></div>
        <div><span style={{ color: "#6B7280" }}>Requested:</span> {action.requestDate}</div>
        <div><span style={{ color: "#6B7280" }}>Approver:</span> {action.approver}</div>
        {action.shares && <div><span style={{ color: "#6B7280" }}>Shares:</span> <strong>{fmt(action.shares)}</strong></div>}
      </div>

      <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 14, border: "1px solid #E5E7EB", marginBottom: 16, fontSize: 13, color: "#374151" }}>
        <strong>Notes:</strong> {action.notes}
      </div>

      {action.documents.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Attached Documents</div>
          {action.documents.map(d => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB", marginBottom: 4, fontSize: 12 }}>
              <span>📄</span><span style={{ flex: 1, color: "#4338CA" }}>{d}</span>
              <span style={{ color: "#6B7280", cursor: "pointer" }}>View</span>
              <span style={{ color: "#6B7280", cursor: "pointer" }}>Download</span>
            </div>
          ))}
        </div>
      )}

      {/* Workflow timeline */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Workflow Progress</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {["Requested", "Approved", "Documents Signed", "Payment Confirmed", "Executed"].map((s, i) => {
            const stageIdx = action.status === "Completed" ? 5 : action.status === "Awaiting Payment" ? 3 : action.status === "Pending Signature" ? 2 : action.status === "Pending Approval" ? 1 : 0;
            const done = i < stageIdx;
            const current = i === stageIdx;
            return (
              <div key={s} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, background: done ? "#059669" : current ? "#6366F1" : "#E5E7EB", marginBottom: 4 }} />
                <div style={{ fontSize: 10, color: done ? "#059669" : current ? "#4F46E5" : "#9CA3AF", fontWeight: current ? 700 : 400 }}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons based on status */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #E5E7EB", paddingTop: 16 }}>
        {isPending && (
          <>
            <ActionButton label="Reject" variant="danger" onClick={onClose} icon="✕" />
            <ActionButton label="Request Changes" variant="warning" onClick={onClose} icon="↩" />
            <ActionButton label="Approve" variant="success" onClick={onClose} icon="✓" />
          </>
        )}
        {isSignature && (
          <>
            <ActionButton label="Resend Signature Request" onClick={onClose} icon="📧" />
            <ActionButton label="Mark as Signed" variant="success" onClick={onClose} icon="✓" />
          </>
        )}
        {isPayment && (
          <>
            <ActionButton label="Cancel Exercise" variant="danger" onClick={onClose} icon="✕" />
            <ActionButton label="Confirm Payment Received" variant="success" onClick={onClose} icon="💳" />
          </>
        )}
        {!isPending && !isSignature && !isPayment && (
          <ActionButton label="Close" onClick={onClose} />
        )}
      </div>
    </Modal>
  );
}

// ─── GRANTS TABLE ────────────────────────────────────────────────────────────

function GrantsTable({ grants: grantList, onSelectGrant, selectedGrantId, onExercise, onEdit }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Grant ID", "Participant", "Type", "Grant Date", "Shares", "Schedule", "Price", "Status", "Actions"].map(h => (
              <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #E5E7EB", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grantList.map((g) => {
            const p = participants.find(pp => pp.id === g.participantId);
            const isSel = g.id === selectedGrantId;
            const isOption = ["ISO", "NQSO", "SAR"].includes(g.type);
            return (
              <tr key={g.id + g.participantId} style={{ background: isSel ? "#EEF2FF" : "#FFF", borderLeft: isSel ? "3px solid #6366F1" : "3px solid transparent" }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? "#EEF2FF" : "#FFF"; }}>
                <td onClick={() => onSelectGrant(g.id)} style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6", fontFamily: "monospace", fontWeight: 600, color: "#4338CA", cursor: "pointer" }}>{g.id}</td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{p?.name}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p?.department}</div>
                </td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6" }}><Badge label={g.type} color={grantTypeLabels[g.type] || "#6B7280"} /></td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6", color: "#374151" }}>{g.grantDate}</td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6", fontWeight: 600, fontFamily: "monospace" }}>{fmt(g.totalShares)}</td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6", color: "#6B7280", fontSize: 12 }}>{g.vestingSchedule}</td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6", fontFamily: "monospace" }}>{fmtUSD(g.priceAtGrant)}</td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6" }}><StatusDot status={g.status} /></td>
                <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => onEdit(g)} title="Edit" style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #E5E7EB", background: "#FFF", cursor: "pointer", fontSize: 12 }}>✏️</button>
                    {isOption && g.status === "Active" && <button onClick={() => onExercise(g)} title="Exercise" style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #D1FAE5", background: "#F0FDF4", cursor: "pointer", fontSize: 12 }}>🏃</button>}
                    <button title="More" style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #E5E7EB", background: "#FFF", cursor: "pointer", fontSize: 12 }}>⋯</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── LEDGER DETAIL ───────────────────────────────────────────────────────────

function LedgerDetail({ grantId, onClose }) {
  const grant = initialGrants.find(g => g.id === grantId);
  const entries = ledgerEntries.filter(e => e.grantId === grantId);
  const participant = participants.find(p => p.id === grant?.participantId);
  if (!grant) return null;

  const totalGranted = entries.filter(e => e.type === "Granted").reduce((s, e) => s + e.shares, 0);
  const totalVested = entries.filter(e => e.type === "Vested").reduce((s, e) => s + e.shares, 0);
  const totalReleased = entries.filter(e => ["Released", "Exercised", "Purchased"].includes(e.type)).reduce((s, e) => s + e.shares, 0);
  const totalForfeited = entries.filter(e => e.type === "Forfeited").reduce((s, e) => s + e.shares, 0);
  const unvested = totalGranted - totalVested - totalForfeited;

  return (
    <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{grantId}</span>
              <Badge label={grant.type} color={grantTypeLabels[grant.type]} />
              <StatusDot status={grant.status} />
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{participant?.name} &middot; {participant?.department} &middot; Granted {grant.grantDate}</div>
          </div>
          <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#FFF", cursor: "pointer", fontSize: 12, color: "#6B7280" }}>Close</button>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
          {[{ l: "Granted", v: totalGranted, c: "#4338CA" }, { l: "Vested", v: totalVested, c: "#166534" }, { l: "Released/Exercised", v: totalReleased, c: "#065F46" }, { l: "Unvested", v: unvested, c: "#D97706" }, { l: "Forfeited", v: totalForfeited, c: "#991B1B" }].map(s => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#9CA3AF" }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.c, fontFamily: "monospace" }}>{fmt(s.v)}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "#F3F4F6" }}>
            <div style={{ width: `${(totalReleased / totalGranted) * 100}%`, background: "#059669" }} />
            <div style={{ width: `${((totalVested - totalReleased) / totalGranted) * 100}%`, background: "#6366F1" }} />
            <div style={{ width: `${(totalForfeited / totalGranted) * 100}%`, background: "#EF4444" }} />
          </div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Date", "Transaction", "Shares", "Balance", "Price", "Value", "Status", "Notes"].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #E5E7EB", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const isCredit = ["Granted", "Vested", "Enrolled", "Purchased"].includes(e.type);
            return (
              <tr key={i} onMouseEnter={ev => ev.currentTarget.style.background = "#FAFAFA"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: 12, borderBottom: "1px solid #F3F4F6" }}>{e.date}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid #F3F4F6" }}><TxBadge type={e.type} /></td>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", fontWeight: 600, color: isCredit ? "#166534" : "#991B1B", borderBottom: "1px solid #F3F4F6" }}>{isCredit ? "+" : "−"}{fmt(e.shares)}</td>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>{fmt(e.balance)}</td>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{fmtUSD(e.price)}</td>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.price ? fmtUSD(e.shares * e.price) : "—"}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid #F3F4F6" }}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#D1FAE5", color: "#065F46", fontWeight: 600 }}>{e.status}</span></td>
                <td style={{ padding: "9px 14px", color: "#9CA3AF", fontSize: 12, borderBottom: "1px solid #F3F4F6" }}>{e.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── APPROVAL QUEUE ──────────────────────────────────────────────────────────

function ApprovalQueue({ actions, onSelectAction }) {
  const pending = actions.filter(a => !["Completed", "Cancelled", "Rejected"].includes(a.status));
  const historic = actions.filter(a => ["Completed", "Cancelled", "Rejected"].includes(a.status));

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <SummaryCard title="Pending Actions" value={pending.length} subtitle="Requires attention" accent="#D97706" />
        <SummaryCard title="Awaiting Signature" value={actions.filter(a => a.status === "Pending Signature").length} subtitle="Documents sent" accent="#4338CA" />
        <SummaryCard title="Awaiting Payment" value={actions.filter(a => a.status === "Awaiting Payment").length} subtitle="Exercise payments" accent="#059669" />
        <SummaryCard title="Completed (30d)" value={historic.length} subtitle="Recently processed" accent="#6B7280" />
      </div>

      {/* Active queue */}
      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Action Queue</span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{pending.length} items requiring action</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["ID", "Type", "Participant", "Grant", "Shares", "Date", "Status", "Approver", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #E5E7EB", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending.map(a => {
              const p = participants.find(pp => pp.id === a.participantId);
              return (
                <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => onSelectAction(a)}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, color: "#4338CA", borderBottom: "1px solid #F3F4F6" }}>{a.id}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", fontWeight: 600 }}>{a.type}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}>{p?.name}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{a.grantId || "—"}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>{a.shares ? fmt(a.shares) : "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}>{a.requestDate}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}><StatusPill status={a.status} /></td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", fontSize: 12, color: "#6B7280" }}>{a.approver}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ color: "#6366F1", fontWeight: 600, fontSize: 12 }}>View →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Historic */}
      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Recent History</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            {historic.map(a => {
              const p = participants.find(pp => pp.id === a.participantId);
              return (
                <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => onSelectAction(a)}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{a.id}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>{a.type}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}>{p?.name}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}><StatusPill status={a.status} /></td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", fontSize: 12, color: "#9CA3AF" }}>{a.notes?.slice(0, 60)}...</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── LONG SHARES VIEW ────────────────────────────────────────────────────────

function LongSharesView() {
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <SummaryCard title="Total Issued" value="5,750" subtitle="Across 3 participants" accent="#4338CA" />
        <SummaryCard title="Shares Sold" value="1,200" subtitle="Settled" accent="#059669" />
        <SummaryCard title="Shares Held" value="4,050" subtitle="In brokerage accounts" accent="#D97706" />
        <SummaryCard title="Unrealized Gain" value="$148,200" subtitle="At $163.50 FMV" accent="#166534" />
      </div>
      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Share Transactions (Post-Issuance)</span>
          <ActionButton label="Record Transaction" variant="primary" icon="+" />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Date", "Participant", "Type", "Shares", "Source", "Cost Basis", "Market", "Gain/Loss", "Account", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #E5E7EB", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {longShareTransactions.map(t => {
              const p = participants.find(pp => pp.id === t.participantId);
              const gain = (t.marketPrice - t.costBasis) * t.shares;
              return (
                <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, borderBottom: "1px solid #F3F4F6" }}>{t.date}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>{p?.name}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #F3F4F6" }}><TxBadge type={t.type} /></td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>{fmt(t.shares)}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "#4338CA", borderBottom: "1px solid #F3F4F6" }}>{t.source}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", borderBottom: "1px solid #F3F4F6" }}>{fmtUSD(t.costBasis)}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", borderBottom: "1px solid #F3F4F6" }}>{fmtUSD(t.marketPrice)}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 600, color: gain >= 0 ? "#166534" : "#991B1B", borderBottom: "1px solid #F3F4F6" }}>{fmtUSD(gain)}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{t.account}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: t.status === "Settled" ? "#D1FAE5" : "#FEF3C7", color: t.status === "Settled" ? "#065F46" : "#92400E" }}>{t.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function EquityAdminApp() {
  const [activeTab, setActiveTab] = useState("grants");
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAddGrant, setShowAddGrant] = useState(false);
  const [showExercise, setShowExercise] = useState(null);
  const [showEdit, setShowEdit] = useState(null);
  const [showTermination, setShowTermination] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const pendingCount = initialPendingActions.filter(a => !["Completed", "Cancelled", "Rejected"].includes(a.status)).length;

  const filteredGrants = initialGrants.filter(g => {
    if (typeFilter !== "All" && g.type !== typeFilter) return false;
    if (statusFilter !== "All" && g.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const p = participants.find(pp => pp.id === g.participantId);
      return g.id.toLowerCase().includes(q) || p?.name.toLowerCase().includes(q) || g.type.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#F3F4F6", minHeight: "100vh" }}>
      {/* Top Nav */}
      <div style={{ background: "#1E1B4B", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ color: "#FFF", fontSize: 15, fontWeight: 700, letterSpacing: -0.5 }}><span style={{ color: "#A5B4FC" }}>Equity</span>Admin</span>
          <div style={{ display: "flex", gap: 2 }}>
            {[
              { key: "grants", label: "Grant Transactions" },
              { key: "approvals", label: "Approvals & Actions", badge: pendingCount },
              { key: "longshares", label: "Long Share Transactions" },
            ].map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedGrant(null); }}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
                  background: activeTab === tab.key ? "rgba(165,180,252,0.2)" : "transparent",
                  color: activeTab === tab.key ? "#C7D2FE" : "#9CA3AF" }}>
                {tab.label}
                {tab.badge > 0 && <span style={{ background: "#EF4444", color: "#FFF", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{tab.badge}</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 10, color: "#A5B4FC", background: "rgba(165,180,252,0.15)", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>WIREFRAME v2</span>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 11, fontWeight: 600 }}>KM</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 28px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ── GRANT TRANSACTIONS TAB ── */}
        {activeTab === "grants" && (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <SummaryCard title="Total Grants" value={initialGrants.length} subtitle="All types" accent="#4338CA" />
              <SummaryCard title="Active" value={initialGrants.filter(g => g.status === "Active").length} accent="#059669" />
              <SummaryCard title="Total Shares" value={fmt(initialGrants.reduce((s, g) => s + g.totalShares, 0))} accent="#111827" />
              <SummaryCard title="Pending Actions" value={pendingCount} subtitle="Requires attention" accent="#D97706" />
            </div>

            {/* Action bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input type="text" placeholder="Search grants, participants..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, width: 240, outline: "none" }} />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#FFF" }}>
                  <option value="All">All Types</option>
                  {Object.keys(grantTypeLabels).map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#FFF" }}>
                  <option value="All">All Statuses</option>
                  <option>Active</option><option>Complete</option><option>Terminated</option>
                </select>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{filteredGrants.length} grants</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <ActionButton label="Process Termination" variant="danger" onClick={() => setShowTermination(true)} icon="⚠" />
                <ActionButton label="Add Grant" variant="primary" onClick={() => setShowAddGrant(true)} icon="+" />
              </div>
            </div>

            <GrantsTable grants={filteredGrants} onSelectGrant={setSelectedGrant} selectedGrantId={selectedGrant} onExercise={setShowExercise} onEdit={setShowEdit} />

            {selectedGrant ? (
              <div style={{ marginTop: 20 }}><LedgerDetail grantId={selectedGrant} onClose={() => setSelectedGrant(null)} /></div>
            ) : (
              <div style={{ marginTop: 20, padding: 32, textAlign: "center", color: "#9CA3AF", background: "#FFF", borderRadius: 12, border: "1px dashed #D1D5DB" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>&#8593;</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Click a grant ID to open its transaction ledger</div>
              </div>
            )}
          </>
        )}

        {/* ── APPROVALS TAB ── */}
        {activeTab === "approvals" && (
          <ApprovalQueue actions={initialPendingActions} onSelectAction={setSelectedAction} />
        )}

        {/* ── LONG SHARES TAB ── */}
        {activeTab === "longshares" && <LongSharesView />}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 28px", textAlign: "center", color: "#9CA3AF", fontSize: 10, borderTop: "1px solid #E5E7EB", background: "#FFF", marginTop: 32 }}>
        Equity Admin — Wireframe v2 &middot; Workflow-enabled &middot; All data is fictional &middot; Inspired by Ledgy, Carta, Shareworks patterns
      </div>

      {/* ── MODALS ── */}
      {showAddGrant && <AddGrantModal onClose={() => setShowAddGrant(false)} />}
      {showExercise && <ExerciseModal onClose={() => setShowExercise(null)} grant={showExercise} />}
      {showEdit && <EditGrantModal onClose={() => setShowEdit(null)} grant={showEdit} />}
      {showTermination && <TerminationModal onClose={() => setShowTermination(false)} />}
      {selectedAction && <ActionDetailModal action={selectedAction} onClose={() => setSelectedAction(null)} />}
    </div>
  );
}
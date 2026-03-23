import { useState } from "react";

// ─── Sample Data ─────────────────────────────────────────────────────────────

const participants = [
  { id: "EMP-001", name: "Sarah Chen", department: "Engineering", hireDate: "2021-03-15" },
  { id: "EMP-002", name: "Marcus Johnson", department: "Product", hireDate: "2020-08-01" },
  { id: "EMP-003", name: "Priya Patel", department: "Sales", hireDate: "2022-01-10" },
  { id: "EMP-004", name: "James Wilson", department: "Finance", hireDate: "2019-11-20" },
];

const grants = [
  // RSUs
  { id: "GRT-2024-001", participantId: "EMP-001", type: "RSU", grantDate: "2024-03-01", totalShares: 4000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 142.50 },
  { id: "GRT-2023-005", participantId: "EMP-002", type: "RSU", grantDate: "2023-06-15", totalShares: 2400, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 118.75 },
  { id: "GRT-2022-012", participantId: "EMP-004", type: "RSU", grantDate: "2022-02-01", totalShares: 3200, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 95.20 },
  // Stock Options
  { id: "GRT-2023-008", participantId: "EMP-001", type: "ISO", grantDate: "2023-09-01", totalShares: 8000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 125.00, strikePrice: 125.00 },
  { id: "GRT-2024-003", participantId: "EMP-003", type: "NQSO", grantDate: "2024-01-15", totalShares: 6000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 138.00, strikePrice: 138.00 },
  { id: "GRT-2021-002", participantId: "EMP-004", type: "ISO", grantDate: "2021-05-01", totalShares: 10000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 78.50, strikePrice: 78.50 },
  // ESPP
  { id: "ESPP-2025-Q1", participantId: "EMP-001", type: "ESPP", grantDate: "2025-01-01", totalShares: 320, vestingSchedule: "6mo offering", status: "Complete", priceAtGrant: 155.00, purchasePrice: 131.75 },
  { id: "ESPP-2025-Q1", participantId: "EMP-002", type: "ESPP", grantDate: "2025-01-01", totalShares: 180, vestingSchedule: "6mo offering", status: "Complete", priceAtGrant: 155.00, purchasePrice: 131.75 },
  // RSA
  { id: "GRT-2023-015", participantId: "EMP-002", type: "RSA", grantDate: "2023-01-01", totalShares: 1500, vestingSchedule: "3yr monthly", status: "Active", priceAtGrant: 110.00 },
  // SAR
  { id: "GRT-2024-010", participantId: "EMP-003", type: "SAR", grantDate: "2024-06-01", totalShares: 5000, vestingSchedule: "4yr/1yr cliff", status: "Active", priceAtGrant: 145.00, strikePrice: 145.00 },
];

const ledgerEntries = [
  // GRT-2024-001 (RSU - Sarah Chen)
  { grantId: "GRT-2024-001", date: "2024-03-01", type: "Granted", shares: 4000, balance: 4000, price: 142.50, notes: "Initial RSU grant" },
  { grantId: "GRT-2024-001", date: "2025-03-01", type: "Vested", shares: 1000, balance: 3000, price: 158.25, notes: "1yr cliff vest (25%)" },
  { grantId: "GRT-2024-001", date: "2025-03-03", type: "Released", shares: 750, balance: 2250, price: 159.10, notes: "Shares released to brokerage" },
  { grantId: "GRT-2024-001", date: "2025-03-03", type: "Withheld", shares: 250, balance: 2250, price: 159.10, notes: "Tax withholding (sell-to-cover)" },

  // GRT-2023-005 (RSU - Marcus Johnson)
  { grantId: "GRT-2023-005", date: "2023-06-15", type: "Granted", shares: 2400, balance: 2400, price: 118.75, notes: "Initial RSU grant" },
  { grantId: "GRT-2023-005", date: "2024-06-15", type: "Vested", shares: 600, balance: 1800, price: 140.00, notes: "1yr cliff vest (25%)" },
  { grantId: "GRT-2023-005", date: "2024-06-17", type: "Released", shares: 440, balance: 1360, price: 140.50, notes: "Shares released to brokerage" },
  { grantId: "GRT-2023-005", date: "2024-06-17", type: "Withheld", shares: 160, balance: 1360, price: 140.50, notes: "Tax withholding" },
  { grantId: "GRT-2023-005", date: "2024-09-15", type: "Vested", shares: 150, balance: 1210, price: 148.30, notes: "Quarterly vest" },
  { grantId: "GRT-2023-005", date: "2024-12-15", type: "Vested", shares: 150, balance: 1060, price: 152.80, notes: "Quarterly vest" },
  { grantId: "GRT-2023-005", date: "2025-03-15", type: "Vested", shares: 150, balance: 910, price: 160.00, notes: "Quarterly vest" },

  // GRT-2022-012 (RSU - James Wilson)
  { grantId: "GRT-2022-012", date: "2022-02-01", type: "Granted", shares: 3200, balance: 3200, price: 95.20, notes: "Initial RSU grant" },
  { grantId: "GRT-2022-012", date: "2023-02-01", type: "Vested", shares: 800, balance: 2400, price: 108.40, notes: "1yr cliff vest (25%)" },
  { grantId: "GRT-2022-012", date: "2023-02-03", type: "Released", shares: 580, balance: 1820, price: 109.00, notes: "Shares released" },
  { grantId: "GRT-2022-012", date: "2023-02-03", type: "Withheld", shares: 220, balance: 1820, price: 109.00, notes: "Tax withholding" },
  { grantId: "GRT-2022-012", date: "2024-02-01", type: "Vested", shares: 800, balance: 1020, price: 135.60, notes: "Year 2 vest" },
  { grantId: "GRT-2022-012", date: "2025-02-01", type: "Vested", shares: 800, balance: 220, price: 156.90, notes: "Year 3 vest" },
  { grantId: "GRT-2022-012", date: "2025-02-01", type: "Forfeited", shares: 200, balance: 20, price: null, notes: "Partial forfeit — performance condition" },

  // GRT-2023-008 (ISO - Sarah Chen)
  { grantId: "GRT-2023-008", date: "2023-09-01", type: "Granted", shares: 8000, balance: 8000, price: 125.00, notes: "ISO grant, strike $125.00" },
  { grantId: "GRT-2023-008", date: "2024-09-01", type: "Vested", shares: 2000, balance: 6000, price: 147.25, notes: "1yr cliff vest (25%)" },
  { grantId: "GRT-2023-008", date: "2025-01-15", type: "Exercised", shares: 500, balance: 5500, price: 157.80, notes: "Early exercise — 500 shares @ $125.00" },
  { grantId: "GRT-2023-008", date: "2025-03-01", type: "Vested", shares: 500, balance: 5000, price: 161.40, notes: "Quarterly vest" },

  // GRT-2024-003 (NQSO - Priya Patel)
  { grantId: "GRT-2024-003", date: "2024-01-15", type: "Granted", shares: 6000, balance: 6000, price: 138.00, notes: "NQSO grant, strike $138.00" },
  { grantId: "GRT-2024-003", date: "2025-01-15", type: "Vested", shares: 1500, balance: 4500, price: 156.20, notes: "1yr cliff vest (25%)" },

  // GRT-2021-002 (ISO - James Wilson)
  { grantId: "GRT-2021-002", date: "2021-05-01", type: "Granted", shares: 10000, balance: 10000, price: 78.50, notes: "ISO grant, strike $78.50" },
  { grantId: "GRT-2021-002", date: "2022-05-01", type: "Vested", shares: 2500, balance: 7500, price: 92.00, notes: "1yr cliff vest" },
  { grantId: "GRT-2021-002", date: "2023-05-01", type: "Vested", shares: 2500, balance: 5000, price: 112.00, notes: "Year 2 vest" },
  { grantId: "GRT-2021-002", date: "2023-08-10", type: "Exercised", shares: 2000, balance: 3000, price: 120.50, notes: "Exercise 2000 @ $78.50" },
  { grantId: "GRT-2021-002", date: "2024-05-01", type: "Vested", shares: 2500, balance: 500, price: 141.00, notes: "Year 3 vest" },
  { grantId: "GRT-2021-002", date: "2025-01-20", type: "Exercised", shares: 3000, balance: -2500, price: 155.60, notes: "Exercise 3000 @ $78.50" },
  { grantId: "GRT-2021-002", date: "2025-05-01", type: "Vested", shares: 2500, balance: 0, price: 162.00, notes: "Final vest" },

  // ESPP entries
  { grantId: "ESPP-2025-Q1", date: "2025-01-01", type: "Enrolled", shares: 0, balance: 0, price: 155.00, notes: "Offering period start, lookback $155.00" },
  { grantId: "ESPP-2025-Q1", date: "2025-06-30", type: "Purchased", shares: 320, balance: 320, price: 162.50, notes: "Purchase @ $131.75 (15% discount)" },

  // GRT-2023-015 (RSA - Marcus Johnson)
  { grantId: "GRT-2023-015", date: "2023-01-01", type: "Granted", shares: 1500, balance: 1500, price: 110.00, notes: "RSA grant — subject to vesting" },
  { grantId: "GRT-2023-015", date: "2023-02-01", type: "Vested", shares: 42, balance: 1458, price: 112.00, notes: "Monthly vest" },
  { grantId: "GRT-2023-015", date: "2024-01-01", type: "Vested", shares: 500, balance: 958, price: 132.00, notes: "Year 1 cumulative" },
  { grantId: "GRT-2023-015", date: "2025-01-01", type: "Vested", shares: 500, balance: 458, price: 154.00, notes: "Year 2 cumulative" },

  // GRT-2024-010 (SAR - Priya Patel)
  { grantId: "GRT-2024-010", date: "2024-06-01", type: "Granted", shares: 5000, balance: 5000, price: 145.00, notes: "SAR grant, base $145.00" },
  { grantId: "GRT-2024-010", date: "2025-06-01", type: "Vested", shares: 1250, balance: 3750, price: 163.00, notes: "1yr cliff vest (25%)" },
];

// Long Share Transactions (post-issuance)
const longShareTransactions = [
  { id: "LST-001", participantId: "EMP-001", date: "2025-03-03", type: "Issuance", shares: 750, source: "GRT-2024-001", costBasis: 142.50, marketPrice: 159.10, status: "Settled", account: "Brokerage-Fidelity" },
  { id: "LST-002", participantId: "EMP-001", date: "2025-03-15", type: "Sale", shares: 200, source: "GRT-2024-001", costBasis: 142.50, marketPrice: 161.25, status: "Settled", account: "Brokerage-Fidelity" },
  { id: "LST-003", participantId: "EMP-001", date: "2025-01-15", type: "Issuance", shares: 500, source: "GRT-2023-008", costBasis: 125.00, marketPrice: 157.80, status: "Settled", account: "Brokerage-Fidelity" },
  { id: "LST-004", participantId: "EMP-002", date: "2024-06-17", type: "Issuance", shares: 440, source: "GRT-2023-005", costBasis: 118.75, marketPrice: 140.50, status: "Settled", account: "Brokerage-Schwab" },
  { id: "LST-005", participantId: "EMP-002", date: "2024-08-01", type: "Transfer", shares: 100, source: "GRT-2023-005", costBasis: 118.75, marketPrice: 144.20, status: "Settled", account: "Personal-Schwab" },
  { id: "LST-006", participantId: "EMP-004", date: "2023-08-10", type: "Issuance", shares: 2000, source: "GRT-2021-002", costBasis: 78.50, marketPrice: 120.50, status: "Settled", account: "Brokerage-Fidelity" },
  { id: "LST-007", participantId: "EMP-004", date: "2023-12-01", type: "Sale", shares: 1000, source: "GRT-2021-002", costBasis: 78.50, marketPrice: 128.90, status: "Settled", account: "Brokerage-Fidelity" },
  { id: "LST-008", participantId: "EMP-004", date: "2025-01-20", type: "Issuance", shares: 3000, source: "GRT-2021-002", costBasis: 78.50, marketPrice: 155.60, status: "Settled", account: "Brokerage-Fidelity" },
  { id: "LST-009", participantId: "EMP-004", date: "2025-02-15", type: "Sale", shares: 1500, source: "GRT-2021-002", costBasis: 78.50, marketPrice: 158.20, status: "Settled", account: "Brokerage-Fidelity" },
  { id: "LST-010", participantId: "EMP-003", date: "2025-06-30", type: "Issuance", shares: 320, source: "ESPP-2025-Q1", costBasis: 131.75, marketPrice: 162.50, status: "Pending", account: "Brokerage-ETrade" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  Issuance: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  Sale: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  Transfer: { bg: "#F0F9FF", text: "#0C4A6E", border: "#BAE6FD" },
};

const grantTypeLabels = {
  RSU: { label: "RSU", color: "#6366F1" },
  ISO: { label: "ISO", color: "#059669" },
  NQSO: { label: "NQSO", color: "#D97706" },
  ESPP: { label: "ESPP", color: "#0891B2" },
  RSA: { label: "RSA", color: "#7C3AED" },
  SAR: { label: "SAR", color: "#DC2626" },
};

const fmt = (n) => n != null ? n.toLocaleString() : "—";
const fmtUSD = (n) => n != null ? `$${n.toFixed(2)}` : "—";

// ─── Components ──────────────────────────────────────────────────────────────

function Badge({ label, color }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, background: color + "18", color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

function TxBadge({ type }) {
  const c = typeColors[type] || { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {type}
    </span>
  );
}

function StatusDot({ status }) {
  const colors = { Active: "#22C55E", Complete: "#6366F1", Expired: "#9CA3AF", Cancelled: "#EF4444" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] || "#9CA3AF" }} />
      {status}
    </span>
  );
}

function SummaryCard({ title, value, subtitle, accent }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, padding: "20px 24px", border: "1px solid #E5E7EB", flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || "#111827", marginTop: 4 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function GrantsTable({ grants: grantList, onSelectGrant, selectedGrantId }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Grant ID", "Participant", "Type", "Grant Date", "Total Shares", "Schedule", "Price at Grant", "Status"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #E5E7EB", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grantList.map((g) => {
            const p = participants.find(pp => pp.id === g.participantId);
            const isSelected = g.id === selectedGrantId;
            return (
              <tr
                key={g.id + g.participantId}
                onClick={() => onSelectGrant(g.id)}
                style={{ cursor: "pointer", background: isSelected ? "#EEF2FF" : "#FFF", borderLeft: isSelected ? "3px solid #6366F1" : "3px solid transparent", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "#FFF"; }}
              >
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", fontFamily: "monospace", fontWeight: 600, color: "#4338CA" }}>{g.id}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{p?.name}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p?.department}</div>
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
                  <Badge label={g.type} color={grantTypeLabels[g.type]?.color || "#6B7280"} />
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", color: "#374151" }}>{g.grantDate}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", fontWeight: 600, fontFamily: "monospace" }}>{fmt(g.totalShares)}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", color: "#6B7280", fontSize: 12 }}>{g.vestingSchedule}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", fontFamily: "monospace" }}>{fmtUSD(g.priceAtGrant)}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}><StatusDot status={g.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LedgerDetail({ grantId }) {
  const grant = grants.find(g => g.id === grantId);
  const entries = ledgerEntries.filter(e => e.grantId === grantId);
  const participant = participants.find(p => p.id === grant?.participantId);

  if (!grant) return <div style={{ padding: 40, color: "#9CA3AF", textAlign: "center" }}>Select a grant to view its ledger</div>;

  const totalGranted = entries.filter(e => e.type === "Granted").reduce((s, e) => s + e.shares, 0);
  const totalVested = entries.filter(e => e.type === "Vested").reduce((s, e) => s + e.shares, 0);
  const totalReleased = entries.filter(e => ["Released", "Exercised", "Purchased"].includes(e.type)).reduce((s, e) => s + e.shares, 0);
  const totalForfeited = entries.filter(e => e.type === "Forfeited").reduce((s, e) => s + e.shares, 0);
  const unvested = totalGranted - totalVested - totalForfeited;

  return (
    <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      {/* Grant Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{grantId}</span>
              <Badge label={grant.type} color={grantTypeLabels[grant.type]?.color} />
              <StatusDot status={grant.status} />
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              {participant?.name} &middot; {participant?.department} &middot; Granted {grant.grantDate}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {grant.strikePrice && <div style={{ fontSize: 12, color: "#6B7280" }}>Strike: <strong>{fmtUSD(grant.strikePrice)}</strong></div>}
            <div style={{ fontSize: 12, color: "#6B7280" }}>Schedule: <strong>{grant.vestingSchedule}</strong></div>
          </div>
        </div>

        {/* Mini summary bar */}
        <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
          {[
            { label: "Granted", val: totalGranted, color: "#4338CA" },
            { label: "Vested", val: totalVested, color: "#166534" },
            { label: "Released/Exercised", val: totalReleased, color: "#065F46" },
            { label: "Unvested", val: unvested, color: "#D97706" },
            { label: "Forfeited", val: totalForfeited, color: "#991B1B" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{fmt(s.val)}</div>
            </div>
          ))}
        </div>

        {/* Vesting progress bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "#F3F4F6" }}>
            <div style={{ width: `${(totalReleased / totalGranted) * 100}%`, background: "#059669" }} />
            <div style={{ width: `${((totalVested - totalReleased) / totalGranted) * 100}%`, background: "#6366F1" }} />
            <div style={{ width: `${(totalForfeited / totalGranted) * 100}%`, background: "#EF4444" }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 10, color: "#9CA3AF" }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#059669", marginRight: 4 }} />Released/Exercised</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#6366F1", marginRight: 4 }} />Vested (held)</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#F3F4F6", border: "1px solid #D1D5DB", marginRight: 4 }} />Unvested</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#EF4444", marginRight: 4 }} />Forfeited</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Date", "Transaction", "Shares", "Running Balance", "Price", "Value", "Notes"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #E5E7EB", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const isDebit = ["Granted", "Vested", "Enrolled", "Purchased"].includes(e.type);
            return (
              <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}
                onMouseEnter={ev => ev.currentTarget.style.background = "#FAFAFA"}
                onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "10px 16px", color: "#374151", fontFamily: "monospace", fontSize: 12 }}>{e.date}</td>
                <td style={{ padding: "10px 16px" }}><TxBadge type={e.type} /></td>
                <td style={{ padding: "10px 16px", fontFamily: "monospace", fontWeight: 600, color: isDebit ? "#166534" : "#991B1B" }}>
                  {isDebit ? "+" : "−"}{fmt(e.shares)}
                </td>
                <td style={{ padding: "10px 16px", fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>{fmt(e.balance)}</td>
                <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#6B7280" }}>{fmtUSD(e.price)}</td>
                <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#6B7280" }}>{e.price ? fmtUSD(e.shares * e.price) : "—"}</td>
                <td style={{ padding: "10px 16px", color: "#9CA3AF", fontSize: 12 }}>{e.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LongSharesView() {
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <SummaryCard title="Total Shares Issued" value="7,010" subtitle="Across 4 participants" accent="#4338CA" />
        <SummaryCard title="Total Shares Sold" value="2,700" subtitle="Settled transactions" accent="#059669" />
        <SummaryCard title="Shares Held" value="4,210" subtitle="In brokerage accounts" accent="#D97706" />
        <SummaryCard title="Unrealized Gain" value="$182,450" subtitle="At current price $162.50" accent="#166534" />
      </div>

      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Long Share Transactions</span>
          <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 12 }}>Post-issuance activity — sales, transfers, and holdings</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Date", "Participant", "Type", "Shares", "Source Grant", "Cost Basis", "Market Price", "Gain/Loss", "Account", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #E5E7EB", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {longShareTransactions.map((t) => {
              const p = participants.find(pp => pp.id === t.participantId);
              const gain = (t.marketPrice - t.costBasis) * t.shares;
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={ev => ev.currentTarget.style.background = "#FAFAFA"}
                  onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12 }}>{t.date}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{p?.name}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}><TxBadge type={t.type} /></td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600 }}>{fmt(t.shares)}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#4338CA" }}>{t.source}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace" }}>{fmtUSD(t.costBasis)}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace" }}>{fmtUSD(t.marketPrice)}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, color: gain >= 0 ? "#166534" : "#991B1B" }}>{fmtUSD(gain)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B7280" }}>{t.account}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: t.status === "Settled" ? "#F0FDF4" : "#FEF3C7", color: t.status === "Settled" ? "#166534" : "#92400E" }}>
                      {t.status}
                    </span>
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

// ─── Main App ────────────────────────────────────────────────────────────────

export default function EquityAdminApp() {
  const [activeTab, setActiveTab] = useState("grants");
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGrants = grants.filter(g => {
    if (typeFilter !== "All" && g.type !== typeFilter) return false;
    if (statusFilter !== "All" && g.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const p = participants.find(pp => pp.id === g.participantId);
      return g.id.toLowerCase().includes(q) || p?.name.toLowerCase().includes(q) || g.type.toLowerCase().includes(q);
    }
    return true;
  });

  const totalGrantedShares = grants.reduce((s, g) => s + g.totalShares, 0);
  const activeGrants = grants.filter(g => g.status === "Active").length;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#F3F4F6", minHeight: "100vh" }}>
      {/* Top Nav */}
      <div style={{ background: "#1E1B4B", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ color: "#FFF", fontSize: 16, fontWeight: 700, letterSpacing: -0.5 }}>
            <span style={{ color: "#A5B4FC" }}>Equity</span>Admin
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "grants", label: "Grant Transactions" },
              { key: "longshares", label: "Long Share Transactions" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedGrant(null); }}
                style={{
                  padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                  background: activeTab === tab.key ? "rgba(165,180,252,0.2)" : "transparent",
                  color: activeTab === tab.key ? "#C7D2FE" : "#9CA3AF",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, color: "#A5B4FC", background: "rgba(165,180,252,0.15)", padding: "4px 10px", borderRadius: 4, fontWeight: 600 }}>WIREFRAME</span>
          <span style={{ color: "#9CA3AF", fontSize: 13 }}>Kunal Mittal</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 13, fontWeight: 600 }}>KM</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {activeTab === "grants" && (
          <>
            {/* Summary Cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <SummaryCard title="Total Grants" value={grants.length} subtitle="All instrument types" accent="#4338CA" />
              <SummaryCard title="Active Grants" value={activeGrants} subtitle={`${grants.length - activeGrants} completed/expired`} accent="#059669" />
              <SummaryCard title="Total Shares Granted" value={fmt(totalGrantedShares)} subtitle="Across all participants" accent="#111827" />
              <SummaryCard title="Grant Types" value={Object.keys(grantTypeLabels).length} subtitle="RSU, ISO, NQSO, ESPP, RSA, SAR" accent="#7C3AED" />
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search grants, participants..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, width: 260, outline: "none" }}
              />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#FFF" }}>
                <option value="All">All Types</option>
                {Object.keys(grantTypeLabels).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#FFF" }}>
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Complete">Complete</option>
              </select>
              <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 8 }}>{filteredGrants.length} grants shown</span>
            </div>

            {/* Grants Table */}
            <GrantsTable grants={filteredGrants} onSelectGrant={setSelectedGrant} selectedGrantId={selectedGrant} />

            {/* Ledger Detail */}
            {selectedGrant && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Grant Ledger</h3>
                  <button onClick={() => setSelectedGrant(null)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#FFF", cursor: "pointer", fontSize: 12, color: "#6B7280" }}>
                    Close Ledger
                  </button>
                </div>
                <LedgerDetail grantId={selectedGrant} />
              </div>
            )}

            {!selectedGrant && (
              <div style={{ marginTop: 24, padding: "40px 0", textAlign: "center", color: "#9CA3AF", background: "#FFF", borderRadius: 12, border: "1px dashed #D1D5DB" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>&#8593;</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Click a grant row above to open its ledger</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Each grant maintains a double-entry ledger of all share movements</div>
              </div>
            )}
          </>
        )}

        {activeTab === "longshares" && <LongSharesView />}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 32px", textAlign: "center", color: "#9CA3AF", fontSize: 11, borderTop: "1px solid #E5E7EB", background: "#FFF", marginTop: 40 }}>
        Equity Admin Application — Wireframe Mockup &middot; Grant Transactions Ledger &middot; All data is fictional
      </div>
    </div>
  );
}
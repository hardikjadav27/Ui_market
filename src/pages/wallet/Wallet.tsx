import { useEffect, useState } from "react";
import {
  confirmShareCash,
  getMySharingDues,
  getSharingDueHistory,
  getStatement,
  getWallets,
  tradingTopUp,
  type SharingDueAccount,
  type SharingDueHistoryItem,
  type StatementRow,
  type WalletDto,
} from "../../services/financeApi";
import { formatMoney, getLoggedInRoleId } from "../../utils/roles";
import "./Wallet.scss";

function Wallet() {
  const userId = Number(localStorage.getItem("userId") || 0);
  const roleId = getLoggedInRoleId();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [walletType, setWalletType] = useState<"TRADING" | "COMMISSION">("TRADING");
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [asChild, setAsChild] = useState<SharingDueAccount | null>(null);
  const [asParent, setAsParent] = useState<SharingDueAccount[]>([]);
  const [history, setHistory] = useState<SharingDueHistoryItem[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [topUpUserId, setTopUpUserId] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNote, setTopUpNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError("");
      const [walletRes, statementRes, duesRes] = await Promise.all([
        getWallets(userId),
        getStatement(userId, {
          from: from || undefined,
          to: to || undefined,
          type: type || undefined,
          walletType,
        }),
        getMySharingDues().catch(() => ({ data: { asChild: null, asParent: [] } })),
      ]);
      const data = walletRes.data;
      setWallets(Array.isArray(data) ? data : data ? [data] : []);
      setRows(statementRes.data || []);
      setAsChild(duesRes.data?.asChild ?? null);
      setAsParent(duesRes.data?.asParent ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, walletType]);

  const trading = wallets.find((w) => w.walletType === "TRADING");
  const commission = wallets.find((w) => w.walletType === "COMMISSION");

  const openHistory = async (childId: number) => {
    try {
      setSelectedChildId(childId);
      const res = await getSharingDueHistory(childId);
      setHistory(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    }
  };

  const onConfirmCash = async () => {
    if (!selectedChildId || !cashAmount) return;
    try {
      setMessage("");
      await confirmShareCash(selectedChildId, Number(cashAmount), cashNote || undefined);
      setMessage("Cash share confirmed");
      setCashAmount("");
      setCashNote("");
      await load();
      await openHistory(selectedChildId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirm failed");
    }
  };

  const onTopUp = async () => {
    if (!topUpUserId || !topUpAmount) return;
    try {
      setMessage("");
      await tradingTopUp(Number(topUpUserId), Number(topUpAmount), topUpNote || undefined);
      setMessage("Trading top-up posted");
      setTopUpAmount("");
      setTopUpNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed");
    }
  };

  return (
    <div className="wallet-page">
      <div className="wallet-top">
        <div className="wallet-left">
          <div className="wallet-tabs">
            <button className={walletType === "TRADING" ? "active" : ""} onClick={() => setWalletType("TRADING")}>
              TRADING
            </button>
            <button
              className={walletType === "COMMISSION" ? "active" : ""}
              onClick={() => setWalletType("COMMISSION")}
            >
              COMMISSION
            </button>
          </div>
          <div className="wallet-info">
            <div className="records">RECORDS : {rows.length}</div>
            <div className="total">TRADING : ₹ {formatMoney(trading?.availableBalance)}</div>
            <div className="total">COMMISSION : ₹ {formatMoney(commission?.availableBalance)}</div>
            {asChild && <div className="total">DUE TO PARENT : ₹ {formatMoney(asChild.accruedDue)}</div>}
          </div>
        </div>

        <div className="wallet-filters">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="filter-btn" onClick={load} disabled={loading}>
            Filter
          </button>
        </div>
      </div>

      {error && <p className="wallet-error">{error}</p>}
      {message && <p className="wallet-error" style={{ color: "green" }}>{message}</p>}

      {roleId !== 5 && (
        <div className="wallet-filters" style={{ marginBottom: 12, gap: 8, display: "flex", flexWrap: "wrap" }}>
          <input placeholder="Child user id" value={topUpUserId} onChange={(e) => setTopUpUserId(e.target.value)} />
          <input placeholder="Top-up amount" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
          <input placeholder="Note / why" value={topUpNote} onChange={(e) => setTopUpNote(e.target.value)} />
          <button className="filter-btn" onClick={onTopUp}>
            Grant trading
          </button>
        </div>
      )}

      {asParent.length > 0 && (
        <div className="wallet-table" style={{ marginBottom: 16 }}>
          <h3>Share dues from downline</h3>
          <table>
            <thead>
              <tr>
                <th>CHILD</th>
                <th>DUE</th>
                <th>ACCRUED</th>
                <th>PAID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {asParent.map((row) => (
                <tr key={row.childUserId}>
                  <td>
                    {row.childName || row.childUserId} #{row.childUserId}
                  </td>
                  <td>{formatMoney(row.accruedDue)}</td>
                  <td>{formatMoney(row.totalAccrued)}</td>
                  <td>{formatMoney(row.totalPaid)}</td>
                  <td>
                    <button className="filter-btn" onClick={() => openHistory(row.childUserId)}>
                      Audit / confirm
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedChildId && (
        <div style={{ marginBottom: 16 }}>
          <div className="wallet-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span>Confirm cash for child #{selectedChildId}</span>
            <input placeholder="Amount" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
            <input placeholder="Note" value={cashNote} onChange={(e) => setCashNote(e.target.value)} />
            <button className="filter-btn" onClick={onConfirmCash}>
              Confirm cash
            </button>
          </div>
          <div className="wallet-table">
            <table>
              <thead>
                <tr>
                  <th>WHEN</th>
                  <th>KIND</th>
                  <th>AMOUNT</th>
                  <th>DUE</th>
                  <th>WHY</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                    <td>{row.kind}</td>
                    <td>{formatMoney(row.amount)}</td>
                    <td>
                      {formatMoney(row.dueBefore)} → {formatMoney(row.dueAfter)}
                    </td>
                    <td>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="wallet-table">
        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>TYPE</th>
              <th>DESCRIPTION</th>
              <th>REFERENCE</th>
              <th>DEBIT</th>
              <th>CREDIT</th>
              <th>BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <h2>{loading ? "Loading..." : "Nothing here"}</h2>
                    <p>No wallet statement entries found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.transactionDate).toLocaleString()}</td>
                  <td>{row.transactionType}</td>
                  <td>{row.description}</td>
                  <td>{row.referenceId || "-"}</td>
                  <td>{formatMoney(row.debit)}</td>
                  <td>{formatMoney(row.credit)}</td>
                  <td>{formatMoney(row.balance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Wallet;

import { useEffect, useState } from "react";
import { getRevenues, type RevenueRow } from "../../services/financeApi";
import { formatMoney, formatSharingRate } from "../../utils/roles";
import "./Revenue.scss";

function Revenue() {
  const userId = Number(localStorage.getItem("userId") || 0);
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [selected, setSelected] = useState<RevenueRow | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const res = await getRevenues(userId);
        setRows(res.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load revenue");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  return (
    <div className="revenue-page">
      <div className="revenue-header">
        <h2>Revenue</h2>
        <div>RECORDS : {rows.length}</div>
      </div>
      {error && <p className="revenue-error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>DATE</th>
            <th>TYPE</th>
            <th>SOURCE</th>
            <th>RATE</th>
            <th>AMOUNT</th>
            <th>STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7}>{loading ? "Loading..." : "No revenue records"}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>{row.revenueType}</td>
                <td>{row.sourceUserName || row.sourceUserId}</td>
                <td>{formatSharingRate(row.appliedRate)}</td>
                <td>₹{formatMoney(row.revenueAmount)}</td>
                <td>{row.status}</td>
                <td>
                  <button type="button" onClick={() => setSelected(row)}>
                    Why?
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selected && (
        <div className="revenue-drawer">
          <h3>Why did I receive this amount?</h3>
          <p>
            <strong>Amount:</strong> ₹{formatMoney(selected.revenueAmount)}
          </p>
          <p>
            <strong>Type:</strong> {selected.revenueType}
          </p>
          <p>
            <strong>Status:</strong> {selected.status}
          </p>
          <p>
            <strong>Execution:</strong> {selected.sourceExecutionId}
          </p>
          <p>
            <strong>Source:</strong> {selected.sourceUserName || selected.sourceUserId}
          </p>
          <p>
            <strong>Rate:</strong> {formatSharingRate(selected.appliedRate)}
          </p>
          <p>
            <strong>Calculation:</strong> {selected.formula}
          </p>
          {selected.hierarchyPath && (
            <p>
              <strong>Hierarchy:</strong> {selected.hierarchyPath}
            </p>
          )}
          <button type="button" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default Revenue;

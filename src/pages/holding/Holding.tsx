import { useMemo, useState } from "react";
import { useMarket } from "../../context/MarketContext";
import { formatPrice, tickKey } from "../../types/trading";
import "./Holding.scss";

function Holding() {
  const { positions, ticks } = useMarket();
  const [search, setSearch] = useState("");

  const openPositions = useMemo(
    () => positions.filter((position) => position.status === "Open"),
    [positions],
  );

  const filtered = useMemo(
    () =>
      openPositions.filter((position) =>
        position.symbol.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [openPositions, search],
  );

  const totalPl = useMemo(() => {
    return filtered.reduce((sum, position) => {
      const tick = ticks[tickKey(position.symbol, position.exchange)];
      const ltp = tick?.ltp ?? position.currentLtp ?? position.entryPrice;
      const diff =
        position.transactionType === "BUY"
          ? (ltp - position.entryPrice) * position.entryQty
          : (position.entryPrice - ltp) * position.entryQty;
      return sum + diff;
    }, 0);
  }, [filtered, ticks]);

  return (
    <div className="holding-page">
      <div className="holding-header-row">
        <div className="records">RECORDS : {filtered.length}</div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search Symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="holding-summary">
        <div className="pl-card">
          <div className="title">P&L</div>
          <div className="value">{formatPrice(totalPl)}</div>
        </div>
      </div>

      <div className="holding-table-wrapper">
        <table className="holding-table">
          <thead>
            <tr>
              <th>SYMBOL</th>
              <th>EXCH</th>
              <th>SIDE</th>
              <th>NET-QTY</th>
              <th>AVG</th>
              <th>LIVE RATE</th>
              <th>SELF M2M</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((position) => {
                const tick = ticks[tickKey(position.symbol, position.exchange)];
                const ltp = tick?.ltp ?? position.currentLtp ?? 0;
                const m2m =
                  position.transactionType === "BUY"
                    ? (ltp - position.entryPrice) * position.entryQty
                    : (position.entryPrice - ltp) * position.entryQty;

                return (
                  <tr key={position.id}>
                    <td>{position.symbol}</td>
                    <td>{position.exchange}</td>
                    <td>{position.transactionType}</td>
                    <td>{position.entryQty}</td>
                    <td>{formatPrice(position.entryPrice)}</td>
                    <td>{formatPrice(ltp)}</td>
                    <td className={m2m >= 0 ? "profit" : "loss"}>{formatPrice(m2m)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="empty-row">
                  <div className="empty-state">
                    <h2>Nothing here</h2>
                    <p>No Holding Found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Holding;

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useMarket } from "../../context/MarketContext";
import { closePosition, updatePositionLevels } from "../../services/tradingApi";
import { formatPrice, tickKey } from "../../types/trading";
import "./Standing.scss";

function Standing() {
  const { positions, ticks, reloadTradingData } = useMarket();
  const [search, setSearch] = useState("");

  const openPositions = useMemo(
    () => positions.filter((position) => position.status === "Open"),
    [positions],
  );

  const filtered = useMemo(() => {
    return openPositions.filter((position) =>
      position.symbol.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [openPositions, search]);

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

  async function handleClose(id: number) {
    try {
      await closePosition(id);
      toast.success("Position closed");
      await reloadTradingData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Close failed");
    }
  }

  async function handleSaveLevels(
    id: number,
    stopLoss: number,
    target: number,
    trailStopLoss: number,
  ) {
    try {
      await updatePositionLevels(id, { stopLoss, target, trailStopLoss });
      toast.success("SL / Target updated");
      await reloadTradingData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <>
      <div className="standing-header">
        <div className="top-row">
          <div className="left-side">
            <div className="records-box">Records: {filtered.length}</div>
            <input
              className="search-box"
              placeholder="Search Symbol"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="right-side">
            <button className="reload-btn" onClick={() => void reloadTradingData()}>
              RELOAD
            </button>
          </div>
        </div>

        <div className="bottom-row">
          <div className="pl-section">
            <div className="info-card">
              <span>P/L</span>
              <strong className={totalPl >= 0 ? "profit" : "loss"}>
                {formatPrice(totalPl)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="standing-table-wrapper">
        <table className="standing-table">
          <thead>
            <tr>
              <th>EXCH</th>
              <th>SYMBOL</th>
              <th>BUY/SELL</th>
              <th>QTY</th>
              <th>RATE</th>
              <th>LIVE RATE</th>
              <th>P/L</th>
              <th>SL</th>
              <th>TARGET</th>
              <th>SQ-OFF</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((position) => {
                const tick = ticks[tickKey(position.symbol, position.exchange)];
                const ltp = tick?.ltp ?? position.currentLtp ?? 0;
                const pl =
                  position.transactionType === "BUY"
                    ? (ltp - position.entryPrice) * position.entryQty
                    : (position.entryPrice - ltp) * position.entryQty;

                return (
                  <StandingRow
                    key={position.id}
                    position={position}
                    ltp={ltp}
                    pl={pl}
                    onClose={handleClose}
                    onSave={handleSaveLevels}
                  />
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="empty-table">
                  <div className="empty-content">
                    <h2>Nothing here</h2>
                    <p>No Standing Found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StandingRow({
  position,
  ltp,
  pl,
  onClose,
  onSave,
}: {
  position: {
    id: number;
    exchange: string;
    symbol: string;
    transactionType: string;
    entryQty: number;
    entryPrice: number;
    stopLoss: number;
    target: number;
    trailStopLoss: number;
  };
  ltp: number;
  pl: number;
  onClose: (id: number) => Promise<void>;
  onSave: (id: number, sl: number, target: number, trail: number) => Promise<void>;
}) {
  const [stopLoss, setStopLoss] = useState(position.stopLoss);
  const [target, setTarget] = useState(position.target);

  return (
    <tr>
      <td>{position.exchange}</td>
      <td>{position.symbol}</td>
      <td>{position.transactionType}</td>
      <td>{position.entryQty}</td>
      <td>{formatPrice(position.entryPrice)}</td>
      <td className={pl >= 0 ? "profit" : "loss"}>{formatPrice(ltp)}</td>
      <td className={pl >= 0 ? "profit" : "loss"}>{formatPrice(pl)}</td>
      <td>
        <input
          className="inline-input"
          type="number"
          step="0.05"
          value={stopLoss}
          onChange={(e) => setStopLoss(Number(e.target.value))}
        />
      </td>
      <td>
        <input
          className="inline-input"
          type="number"
          step="0.05"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
        />
      </td>
      <td className="actions-cell">
        <button
          type="button"
          className="reload-btn"
          onClick={() => void onSave(position.id, stopLoss, target, position.trailStopLoss)}
        >
          SAVE
        </button>
        <button type="button" className="clear-btn" onClick={() => void onClose(position.id)}>
          SQ-OFF
        </button>
      </td>
    </tr>
  );
}

export default Standing;

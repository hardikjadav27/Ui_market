import { useMemo, useState } from "react";
import { useMarket } from "../../context/MarketContext";
import { formatPrice } from "../../types/trading";
import "./Trade.scss";

function Trade() {
  const { orders, reloadTradingData } = useMarket();
  const [search, setSearch] = useState("");

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "Complete"),
    [orders],
  );

  const filtered = useMemo(() => {
    return completedOrders.filter((order) =>
      order.symbol.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [completedOrders, search]);

  return (
    <>
      <div className="trade-header">
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
      </div>

      <div className="trade-table-wrapper">
        <table className="trade-table">
          <thead>
            <tr>
              <th>EXCH</th>
              <th>SYMBOL</th>
              <th>NET QTY</th>
              <th>RATE</th>
              <th>BUY/SELL</th>
              <th>TYPE</th>
              <th>PLACE TYPE</th>
              <th>STATUS</th>
              <th>DATE</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((order) => (
                <tr key={order.id}>
                  <td>{order.exchange}</td>
                  <td>{order.symbol}</td>
                  <td>{order.filledQty || order.quantity}</td>
                  <td>{formatPrice(order.averagePrice || order.price)}</td>
                  <td>{order.transactionType}</td>
                  <td>{order.orderType}</td>
                  <td>{order.orderPlaceType}</td>
                  <td>{order.status}</td>
                  <td>
                    {order.filledAt
                      ? new Date(order.filledAt).toLocaleString()
                      : new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="empty-table">
                  <div className="empty-content">
                    <h2>Nothing here</h2>
                    <p>No Trade Found.</p>
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

export default Trade;

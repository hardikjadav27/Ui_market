import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useMarket } from "../../context/MarketContext";
import { cancelOrder } from "../../services/tradingApi";
import { formatPrice, OrderDto } from "../../types/trading";
import ModifyOrderModal from "../../components/ModifyOrderModal";
import "./Pending.scss";

function Pending() {
  const { orders, reloadTradingData } = useMarket();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingOrder, setEditingOrder] = useState<OrderDto | null>(null);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "Pending"), [orders]);
  const executedOrders = useMemo(() => orders.filter((o) => o.status === "Complete"), [orders]);
  const rejectedOrders = useMemo(() => orders.filter((o) => o.status === "Cancelled"), [orders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = order.symbol.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  async function handleCancel(id: number) {
    try {
      await cancelOrder(id);
      toast.success("Order cancelled");
      await reloadTradingData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  return (
    <>
      <div className="pending-header">
        <div className="top-row">
          <div className="left-side">
            <div className="records-box">Records: {filtered.length}</div>
            <input
              className="search-box"
              placeholder="Search Symbol"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select 
              className="search-box" 
              style={{ marginLeft: '10px' }}
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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
              <span>PENDING</span>
              <strong>{pendingOrders.length}</strong>
            </div>
            <div className="info-card">
              <span>EXECUTED</span>
              <strong>{executedOrders.length}</strong>
            </div>
            <div className="info-card">
              <span>REJECTED</span>
              <strong>{rejectedOrders.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="pending-table-wrapper">
        <table className="pending-table">
          <thead>
            <tr>
              <th>EXCH</th>
              <th>SYMBOL</th>
              <th>NET QTY</th>
              <th>AVERAGE PRICE</th>
              <th>TRIGGER PRICE</th>
              <th>LIMIT PRICE</th>
              <th>SL PRICE</th>
              <th>BUY/SELL</th>
              <th>TYPE</th>
              <th>STATUS</th>
              <th>DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((order) => (
                <tr key={order.id}>
                  <td>{order.exchange}</td>
                  <td>{order.symbol}</td>
                  <td>{order.filledQty || order.quantity}</td>
                  <td>{order.averagePrice ? formatPrice(order.averagePrice) : "-"}</td>
                  <td>{order.triggerPrice ? formatPrice(order.triggerPrice) : "-"}</td>
                  <td>{order.price ? formatPrice(order.price) : "-"}</td>
                  <td>{order.stopLoss ? formatPrice(order.stopLoss) : "-"}</td>
                  <td>{order.transactionType}</td>
                  <td>{order.orderType}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    {order.status === "Pending" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => void handleCancel(order.id)}
                        >
                          CANCEL
                        </button>
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => setEditingOrder(order)}
                        >
                          MODIFY
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="empty-table">
                  <div className="empty-content">
                    <h2>Nothing here</h2>
                    <p>No Orders Found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModifyOrderModal 
        open={editingOrder !== null} 
        order={editingOrder} 
        onClose={() => setEditingOrder(null)} 
      />
    </>
  );
}

export default Pending;

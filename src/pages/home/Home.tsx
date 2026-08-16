import { useEffect } from "react";
import { homeIndexSymbols } from "../../config/watchlistSymbols";
import { useMarket } from "../../context/MarketContext";
import { formatPrice } from "../../types/trading";
import { setMarketFeedMode } from "../../services/tradingApi";
import { toast } from "react-toastify";
import "./Home.scss";

function Home() {
  const {
    orders,
    positions,
    subscribeMany,
    unsubscribeMany,
    getTick,
    marketStatus,
    brokerStatus,
    hubConnected,
    refreshBroker,
    reloadTradingData,
  } = useMarket();

  useEffect(() => {
    const items = homeIndexSymbols.map((item) => ({
      symbol: item.symbol,
      exchange: item.exchange,
      instrumentType: item.instrumentType,
    }));

    void subscribeMany(items);

    return () => {
      void unsubscribeMany(items);
    };
  }, [subscribeMany, unsubscribeMany]);

  const openPositions = positions.filter((p) => p.status === "Open").length;
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const completedOrders = orders.filter((o) => o.status === "Complete").length;

  return (
    <div className="home-container">
      <div className="summary-cards">
        <div className="card">
          <h3>OPEN POSITIONS</h3>
          <h1>{openPositions}</h1>
        </div>
        <div className="card">
          <h3>PENDING ORDERS</h3>
          <h1>{pendingOrders}</h1>
        </div>
        <div className="card">
          <h3>EXECUTED</h3>
          <h1>{completedOrders}</h1>
        </div>
        <div className="card broker-card">
          <h3>MARKET FEED</h3>
          <p>
            {hubConnected ? "SignalR Connected" : "SignalR Offline"}
            {marketStatus?.isMockDataEnabled ? " · Mock Feed" : ""}
          </p>
          <p>{marketStatus?.webSocketConnected ? "Kite WS Connected" : "Kite WS Offline"}</p>
          <button type="button" className="refresh-btn" onClick={() => void refreshBroker()}>
            Refresh Kite Token
          </button>
          <button
            type="button"
            className="refresh-btn"
            onClick={async () => {
              try {
                const nextMode = !marketStatus?.isMockDataEnabled;
                await setMarketFeedMode(nextMode);
                await refreshBroker();
                await reloadTradingData();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to switch feed mode.");
              }
            }}
            disabled={marketStatus === null}
          >
            {marketStatus?.isMockDataEnabled ? "Switch to Live" : "Switch to Mock"}
          </button>
          {brokerStatus?.message && <small>{brokerStatus.message}</small>}
        </div>
      </div>

      <div className="market-grid">
        {homeIndexSymbols.map((item) => {
          const tick = getTick(item.symbol, item.exchange);
          return (
            <div className="market-box" key={item.label ?? item.symbol}>
              <h4>{item.label ?? item.symbol}</h4>
              <p>{formatPrice(tick?.ltp)}</p>
            </div>
          );
        })}
      </div>

      <table className="trade-table">
        <thead>
          <tr>
            <th>EXCH</th>
            <th>SYMBOL</th>
            <th>QTY</th>
            <th>SIDE</th>
            <th>TYPE</th>
            <th>STATUS</th>
            <th>RATE</th>
          </tr>
        </thead>

        <tbody>
          {orders.slice(0, 10).length > 0 ? (
            orders.slice(0, 10).map((order) => (
              <tr key={order.id}>
                <td>{order.exchange}</td>
                <td>{order.symbol}</td>
                <td>{order.quantity}</td>
                <td>{order.transactionType}</td>
                <td>{order.orderType}</td>
                <td>{order.status}</td>
                <td>{formatPrice(order.averagePrice || order.price)}</td>
              </tr>
            ))
          ) : (
            <tr className="empty-row">
              <td colSpan={7}>No Trade Found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Home;

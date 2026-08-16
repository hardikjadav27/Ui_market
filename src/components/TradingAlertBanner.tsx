import { useMarket } from "../context/MarketContext";
import "./TradingAlertBanner.scss";

function TradingAlertBanner() {
  const { loadError, hubError } = useMarket();

  if (!loadError && !hubError) {
    return null;
  }

  return (
    <div className="trading-alert-banner">
      {loadError && <p>{loadError}</p>}
      {hubError && !loadError && <p>Market stream: {hubError}</p>}
    </div>
  );
}

export default TradingAlertBanner;

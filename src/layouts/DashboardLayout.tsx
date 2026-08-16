import { Outlet } from "react-router-dom";
import TradingAlertBanner from "../components/TradingAlertBanner";
import { MarketProvider } from "../context/MarketContext";
import Footer from "./Footer";
import Header from "./Header";
import "./dashboard.scss";

function DashboardLayout() {
  return (
    <MarketProvider>
      <div className="dashboard-layout">
        <Header />

        <main className="dashboard-body">
          <TradingAlertBanner />
          <Outlet />
        </main>

        <Footer />
      </div>
    </MarketProvider>
  );
}

export default DashboardLayout;

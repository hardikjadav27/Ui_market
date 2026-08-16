import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Holding from "./pages/holding/Holding";
import Home from "./pages/home/Home";
import Login from "./pages/login/login";
import UsersPage from "./pages/users/UsersPage";
import Pending from "./pages/pending/Pending";
import Rules from "./pages/rules/rules";
import Standing from "./pages/standing/Standing";
import Trade from "./pages/trade/Trade";
import Wallet from "./pages/wallet/Wallet";
import Watchlist from "./pages/watchlist/Watchlist";
import Revenue from "./pages/revenue/Revenue";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/rules"
          element={
            <ProtectedRoute>
              <Rules />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRules>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<Home />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="super" element={<UsersPage />} />
          <Route path="admin" element={<UsersPage />} />
          <Route path="sub-admin" element={<UsersPage />} />
          <Route path="master" element={<UsersPage />} />
          <Route path="client" element={<UsersPage />} />
          <Route path="user" element={<UsersPage />} />
          <Route path="standing" element={<Standing />} />
          <Route path="trade" element={<Trade />} />
          <Route path="pending" element={<Pending />} />
          <Route path="holding" element={<Holding />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="revenue" element={<Revenue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

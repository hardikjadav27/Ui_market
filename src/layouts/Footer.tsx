import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store";
import { logout } from "../store/login/login.reducer";
import { useMarket } from "../context/MarketContext";
import { formatPrice, tickKey } from "../types/trading";

function Footer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { positions, ticks } = useMarket();

  const openPositions = positions.filter((p) => p.status === "Open");
  const totalPl = openPositions.reduce((sum, position) => {
    const tick = ticks[tickKey(position.symbol, position.exchange)];
    const ltp = tick?.ltp ?? position.currentLtp ?? position.entryPrice;
    const diff =
      position.transactionType === "BUY"
        ? (ltp - position.entryPrice) * position.entryQty
        : (position.entryPrice - ltp) * position.entryQty;
    return sum + diff;
  }, 0);

  function handleLogout() {
    dispatch(logout());
    navigate("/");
  }

  return (
    <footer className="footer-bar">
      <div>BOOKED : {openPositions.length}</div>
      <div>P/L : {formatPrice(totalPl)}</div>
      <div>NET PROFIT : {formatPrice(totalPl)}</div>
      <button type="button" onClick={handleLogout}>
        LOGOUT
      </button>
    </footer>
  );
}

export default Footer;

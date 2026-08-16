import { useEffect, useRef, useState } from "react";
import OrderEntryModal from "../../components/OrderEntryModal";
import {
  getWatchlistEmptyMessage,
  unsupportedWatchlistTabs,
  watchlistInstruments,
  watchlistTabs,
  type WatchlistTab,
} from "../../config/watchlistSymbols";
import { useMarket } from "../../context/MarketContext";
import {
  getAllowedScripts,
  resolveAllowedSymbols,
  resolveInstruments,
  searchInstruments,
} from "../../services/tradingApi";
import { formatChange, formatPrice, tickKey } from "../../types/trading";
import type { InstrumentLookupDto } from "../../types/trading";
import { getLoggedInRoleId } from "../../utils/roles";
import "./Watchlist.scss";

function Watchlist() {
  const { getTick, subscribeMany, unsubscribeMany, marketStatus, hubConnected } = useMarket();
  const userId = Number(localStorage.getItem("userId") || 0);
  const isSuperAdmin = getLoggedInRoleId() === 1;

  const [activeTab, setActiveTab] = useState<WatchlistTab>("WATCHLIST");
  const [search, setSearch] = useState("");
  const [allowedScripts, setAllowedScripts] = useState<string[]>([]);
  const [allowedLoaded, setAllowedLoaded] = useState(false);
  const [rows, setRows] = useState<InstrumentLookupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderModal, setOrderModal] = useState<{
    symbol: string;
    exchange: string;
    instrumentType: string;
    side: "BUY" | "SELL";
  } | null>(null);
  const visibleSubscriptionsRef = useRef<Array<{ symbol: string; exchange: string; instrumentType: string }>>([]);

  const normalizedSearch = search.trim();
  const effectiveTab =
    unsupportedWatchlistTabs.includes(activeTab) && normalizedSearch.length > 0 ? undefined : activeTab;

  // Super Admin with no assigned scripts keeps global catalog; all other roles are limited.
  const unrestricted = isSuperAdmin && allowedScripts.length === 0;

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setAllowedScripts([]);
      setAllowedLoaded(true);
      return;
    }

    void getAllowedScripts(userId)
      .then((scripts) => {
        if (!cancelled) setAllowedScripts(scripts);
      })
      .catch(() => {
        if (!cancelled) setAllowedScripts([]);
      })
      .finally(() => {
        if (!cancelled) setAllowedLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!allowedLoaded) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        if (!unrestricted && allowedScripts.length === 0) {
          if (!cancelled) setRows([]);
          return;
        }

        if (unrestricted) {
          if (normalizedSearch.length === 0) {
            const defaults = watchlistInstruments[activeTab] || [];
            if (defaults.length === 0) {
              if (!cancelled) setRows([]);
              return;
            }
            const result = await resolveInstruments(
              defaults.map((inst) => ({
                symbol: inst.symbol,
                exchange: inst.exchange,
                instrumentType: inst.instrumentType,
                label: inst.label,
              })),
            );
            if (!cancelled) setRows(result);
            return;
          }

          const result = await searchInstruments(effectiveTab, normalizedSearch, 100);
          if (!cancelled) setRows(result);
          return;
        }

        const query = normalizedSearch.toUpperCase();
        const symbols = allowedScripts
          .filter((s) => (query ? s.toUpperCase().includes(query) : true))
          .slice(0, 100);

        const result = await resolveAllowedSymbols(symbols, activeTab);
        if (!cancelled) setRows(result);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void run();
    }, normalizedSearch.length > 0 ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, effectiveTab, normalizedSearch, allowedScripts, allowedLoaded, unrestricted]);

  useEffect(() => {
    const nextItems = rows.map((row) => ({
      symbol: row.symbol,
      exchange: row.exchange,
      instrumentType: row.instrumentType,
    }));

    const previousItems = visibleSubscriptionsRef.current;
    const previousKeys = new Set(
      previousItems.map((item) => `${item.exchange}:${item.symbol}:${item.instrumentType}`),
    );
    const nextKeys = new Set(nextItems.map((item) => `${item.exchange}:${item.symbol}:${item.instrumentType}`));

    const toSubscribe = nextItems.filter(
      (item) => !previousKeys.has(`${item.exchange}:${item.symbol}:${item.instrumentType}`),
    );
    const toUnsubscribe = previousItems.filter(
      (item) => !nextKeys.has(`${item.exchange}:${item.symbol}:${item.instrumentType}`),
    );

    visibleSubscriptionsRef.current = nextItems;

    void subscribeMany(toSubscribe);
    void unsubscribeMany(toUnsubscribe);
  }, [rows, subscribeMany, unsubscribeMany]);

  useEffect(() => {
    return () => {
      void unsubscribeMany(visibleSubscriptionsRef.current);
      visibleSubscriptionsRef.current = [];
    };
  }, [unsubscribeMany]);

  const emptyMessage = (() => {
    if (loading || !allowedLoaded) return "Loading allowed scripts...";
    if (!unrestricted && allowedScripts.length === 0) {
      return "No scripts assigned by your parent. Ask them to allow scripts for your account.";
    }
    if (normalizedSearch.length > 0) {
      return "No allowed scripts match your search.";
    }
    return getWatchlistEmptyMessage(activeTab);
  })();

  return (
    <div className="watchlist-page">
      <div className="watchlist-top">
        <div className="market-tabs">
          {watchlistTabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="search-area">
          <div className={`feed-status ${hubConnected ? "online" : "offline"}`}>
            {hubConnected ? "LIVE" : "OFFLINE"}
            {marketStatus?.isMockDataEnabled
              ? " · MOCK FEED"
              : marketStatus?.webSocketConnected
                ? " · KITE OK"
                : " · KITE DOWN"}
            {!unrestricted && ` · ${allowedScripts.length} ALLOWED`}
          </div>
          <input
            type="text"
            placeholder={unrestricted ? "Search Zerodha instruments..." : "Search your allowed scripts..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <table className="watchlist-table">
        <thead>
          <tr>
            <th>EXCH</th>
            <th>SYMBOL</th>
            <th>EXPIRY</th>
            <th>BUY</th>
            <th>SELL</th>
            <th>LTP</th>
            <th>NET CHANGE</th>
            <th>OPEN</th>
            <th>HIGH</th>
            <th>LOW</th>
            <th>CLOSE</th>
            <th>LTT/LUT</th>
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => {
              const tick = getTick(row.symbol, row.exchange);
              const ltp = tick?.ltp ?? 0;
              const bid = tick?.bid ?? ltp;
              const ask = tick?.ask ?? ltp;
              const close = tick?.preClose ?? 0;
              const changeClass = ltp >= close ? "up" : "down";
              const displaySymbol = row.displayName ?? row.name ?? row.symbol;

              return (
                <tr key={`${tickKey(row.symbol, row.exchange)}:${row.instrumentType}`}>
                  <td>{row.exchange}</td>
                  <td>{displaySymbol}</td>
                  <td>{row.expiry ? new Date(row.expiry).toLocaleDateString() : "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="price-box buy"
                      onClick={() =>
                        setOrderModal({
                          symbol: row.symbol,
                          exchange: row.exchange,
                          instrumentType: row.instrumentType,
                          side: "BUY",
                        })
                      }
                    >
                      {formatPrice(bid)}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="price-box sell"
                      onClick={() =>
                        setOrderModal({
                          symbol: row.symbol,
                          exchange: row.exchange,
                          instrumentType: row.instrumentType,
                          side: "SELL",
                        })
                      }
                    >
                      {formatPrice(ask)}
                    </button>
                  </td>
                  <td>
                    <div className={`price-box ltp ${changeClass}`}>{formatPrice(ltp)}</div>
                  </td>
                  <td>
                    <div className={`price-box ${changeClass}`}>{formatChange(ltp, close)}</div>
                  </td>
                  <td>{formatPrice(close)}</td>
                  <td>{formatPrice(ltp)}</td>
                  <td>{formatPrice(ltp)}</td>
                  <td>{formatPrice(close)}</td>
                  <td>{tick?.updatedAt ? new Date(tick.updatedAt).toLocaleTimeString() : "—"}</td>
                </tr>
              );
            })
          ) : (
            <tr className="empty-row">
              <td colSpan={12}>
                <h2>Nothing here</h2>
                <p>{emptyMessage}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {orderModal && (
        <OrderEntryModal
          open
          symbol={orderModal.symbol}
          exchange={orderModal.exchange}
          instrumentType={orderModal.instrumentType}
          side={orderModal.side}
          onClose={() => setOrderModal(null)}
        />
      )}
    </div>
  );
}

export default Watchlist;

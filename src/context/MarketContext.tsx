import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import { protectedResources } from "../authConfig";
import {
  getBrokerStatus,
  getMarketStatus,
  listOrders,
  listPositions,
  refreshBrokerToken,
} from "../services/tradingApi";
import type {
  BrokerStatusDto,
  MarketStatusDto,
  OrderDto,
  PositionDto,
  TickSnapshot,
} from "../types/trading";
import { tickKey } from "../types/trading";

interface SubscriptionItem {
  symbol: string;
  exchange: string;
  instrumentType?: string;
}

interface MarketContextValue {
  ticks: Record<string, TickSnapshot>;
  orders: OrderDto[];
  positions: PositionDto[];
  marketStatus: MarketStatusDto | null;
  brokerStatus: BrokerStatusDto | null;
  hubConnected: boolean;
  hubError: string | null;
  loadError: string | null;
  subscribe: (symbol: string, exchange: string, instrumentType?: string) => Promise<void>;
  unsubscribe: (symbol: string, exchange: string, instrumentType?: string) => Promise<void>;
  subscribeMany: (items: SubscriptionItem[]) => Promise<void>;
  unsubscribeMany: (items: SubscriptionItem[]) => Promise<void>;
  reloadTradingData: () => Promise<void>;
  refreshBroker: () => Promise<void>;
  upsertOrder: (order: OrderDto) => void;
  upsertPosition: (position: PositionDto) => void;
  getTick: (symbol: string, exchange: string) => TickSnapshot | undefined;
}

const MarketContext = createContext<MarketContextValue | null>(null);

function formatLoadError(label: string, reason: unknown): string {
  const message = reason instanceof Error ? reason.message : String(reason);
  return `${label}: ${message}`;
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [ticks, setTicks] = useState<Record<string, TickSnapshot>>({});
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketStatusDto | null>(null);
  const [brokerStatus, setBrokerStatus] = useState<BrokerStatusDto | null>(null);
  const [hubConnected, setHubConnected] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const connectionRef = useRef<HubConnection | null>(null);
  const subscribedRef = useRef<Map<string, SubscriptionItem>>(new Map());
  const subscriptionCountsRef = useRef<Map<string, number>>(new Map());
  const subscribedOnHubRef = useRef<Set<string>>(new Set());
  const portfolioSubscriptionsRef = useRef<Map<string, SubscriptionItem>>(new Map());

  const token = localStorage.getItem("token");

  const upsertOrder = useCallback((order: OrderDto) => {
    setOrders((prev) => {
      const index = prev.findIndex((item) => item.id === order.id);
      if (index === -1) return [order, ...prev];
      const next = [...prev];
      next[index] = order;
      return next;
    });
  }, []);

  const upsertPosition = useCallback((position: PositionDto) => {
    setPositions((prev) => {
      const index = prev.findIndex((item) => item.id === position.id);
      if (index === -1) return [position, ...prev];
      const next = [...prev];
      next[index] = position;
      return next;
    });
  }, []);

  const reloadTradingData = useCallback(async () => {
    const results = await Promise.allSettled([
      listOrders(),
      listPositions(),
      getMarketStatus(),
      getBrokerStatus(),
    ]);

    const errors: string[] = [];

    if (results[0].status === "fulfilled") {
      setOrders(results[0].value);
    } else {
      errors.push(formatLoadError("Orders", results[0].reason));
    }

    if (results[1].status === "fulfilled") {
      setPositions(results[1].value);
    } else {
      errors.push(formatLoadError("Positions", results[1].reason));
    }

    if (results[2].status === "fulfilled") {
      setMarketStatus(results[2].value);
    } else {
      errors.push(formatLoadError("Market status", results[2].reason));
    }

    if (results[3].status === "fulfilled") {
      setBrokerStatus(results[3].value);
    } else {
      errors.push(formatLoadError("Broker status", results[3].reason));
    }

    const nextError = errors.length > 0 ? errors.join(" · ") : null;
    setLoadError(nextError);

    if (nextError) {
      toast.error("Some trading data failed to load.");
    }
  }, []);

  const refreshBroker = useCallback(async () => {
    try {
      const status = await refreshBrokerToken();
      setBrokerStatus(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Broker refresh failed.";
      toast.error(message);
      throw error;
    }
  }, []);

  const subscribe = useCallback(async (symbol: string, exchange: string, instrumentType = "") => {
    const key = tickKey(symbol, exchange);
    const item: SubscriptionItem = { symbol, exchange, instrumentType };
    subscribedRef.current.set(key, item);
    const nextCount = (subscriptionCountsRef.current.get(key) ?? 0) + 1;
    subscriptionCountsRef.current.set(key, nextCount);

    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      return;
    }

    if (nextCount > 1 || subscribedOnHubRef.current.has(key)) {
      return;
    }

    try {
      await connection.invoke("Subscribe", symbol, exchange, instrumentType);
      subscribedOnHubRef.current.add(key);
      console.log("[SignalR] Subscribed", exchange, symbol, instrumentType || "(default)");
    } catch (err) {
      console.error("[SignalR] Subscription failed", exchange, symbol, err);
    }
  }, []);

  const unsubscribe = useCallback(async (symbol: string, exchange: string, instrumentType = "") => {
    const key = tickKey(symbol, exchange);
    const currentCount = subscriptionCountsRef.current.get(key) ?? 0;
    if (currentCount <= 1) {
      subscriptionCountsRef.current.delete(key);
      subscribedRef.current.delete(key);
    } else {
      subscriptionCountsRef.current.set(key, currentCount - 1);
    }

    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      if (currentCount <= 1) {
        subscribedOnHubRef.current.delete(key);
      }
      return;
    }

    if (currentCount > 1 || !subscribedOnHubRef.current.has(key)) {
      return;
    }

    try {
      await connection.invoke("Unsubscribe", symbol, exchange, instrumentType);
      subscribedOnHubRef.current.delete(key);
      console.log("[SignalR] Unsubscribed", exchange, symbol, instrumentType || "(default)");
    } catch (err) {
      console.error("[SignalR] Unsubscribe failed", exchange, symbol, err);
    }
  }, []);

  const subscribeMany = useCallback(
    async (items: SubscriptionItem[]) => {
      const toSubscribe: SubscriptionItem[] = [];

      for (const item of items) {
        const key = tickKey(item.symbol, item.exchange);
        const savedItem: SubscriptionItem = { symbol: item.symbol, exchange: item.exchange, instrumentType: item.instrumentType ?? "" };
        subscribedRef.current.set(key, savedItem);
        const nextCount = (subscriptionCountsRef.current.get(key) ?? 0) + 1;
        subscriptionCountsRef.current.set(key, nextCount);

        if (nextCount === 1 && !subscribedOnHubRef.current.has(key)) {
          toSubscribe.push(savedItem);
          subscribedOnHubRef.current.add(key);
        }
      }

      if (toSubscribe.length === 0) return;

      const connection = connectionRef.current;
      if (!connection || connection.state !== "Connected") {
        return;
      }

      try {
        await connection.invoke("SubscribeMany", toSubscribe);
        console.log(`[SignalR] Subscribed to ${toSubscribe.length} items (batch)`);
      } catch (err) {
        console.error("[SignalR] SubscribeMany failed", err);
      }
    },
    [],
  );

  const unsubscribeMany = useCallback(
    async (items: SubscriptionItem[]) => {
      const toUnsubscribe: SubscriptionItem[] = [];

      for (const item of items) {
        const key = tickKey(item.symbol, item.exchange);
        const currentCount = subscriptionCountsRef.current.get(key) ?? 0;

        if (currentCount <= 1) {
          subscriptionCountsRef.current.delete(key);
          subscribedRef.current.delete(key);
          toUnsubscribe.push({ symbol: item.symbol, exchange: item.exchange, instrumentType: item.instrumentType ?? "" });
        } else {
          subscriptionCountsRef.current.set(key, currentCount - 1);
        }
      }

      const connection = connectionRef.current;
      if (!connection || connection.state !== "Connected") {
        for (const item of toUnsubscribe) {
           subscribedOnHubRef.current.delete(tickKey(item.symbol, item.exchange));
        }
        return;
      }

      const actuallyToUnsubscribe = toUnsubscribe.filter(item => subscribedOnHubRef.current.has(tickKey(item.symbol, item.exchange)));

      for (const item of actuallyToUnsubscribe) {
        subscribedOnHubRef.current.delete(tickKey(item.symbol, item.exchange));
      }

      if (actuallyToUnsubscribe.length === 0) return;

      try {
        await connection.invoke("UnsubscribeMany", actuallyToUnsubscribe);
        console.log(`[SignalR] Unsubscribed from ${actuallyToUnsubscribe.length} items (batch)`);
      } catch (err) {
        console.error("[SignalR] UnsubscribeMany failed", err);
      }
    },
    [],
  );

  const getTick = useCallback(
    (symbol: string, exchange: string) => ticks[tickKey(symbol, exchange)],
    [ticks],
  );

  useEffect(() => {
    if (!token) return;
    void reloadTradingData();
  }, [token, reloadTradingData]);

  useEffect(() => {
    if (!token) return;
    if (hubConnected) return;

    const interval = window.setInterval(() => {
      void reloadTradingData();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [token, hubConnected, reloadTradingData]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(protectedResources.marketHub.endpoint, {
        accessTokenFactory: () => localStorage.getItem("token") ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.onreconnecting((error) => {
      console.warn("SignalR reconnecting...", error);
      setHubConnected(false);
      setHubError(error?.message ?? "Connection lost. Reconnecting...");
    });

    connection.on("TickUpdate", (tick: TickSnapshot) => {
      console.debug("[SignalR] TickUpdate", tick.exchange, tick.symbol, tick.ltp, tick.updatedAt);
      const key = tickKey(tick.symbol, tick.exchange);
      setTicks((prev) => {
        const old = prev[key];

        if (
          old &&
          old.ltp === tick.ltp &&
          old.volume === tick.volume &&
          old.bid === tick.bid &&
          old.ask === tick.ask &&
          old.oi === tick.oi &&
          old.updatedAt === tick.updatedAt
        ) {
          return prev;
        }

        return {
          ...prev,
          [key]: tick,
        };
      });
    });

    connection.on("OrderStatusChanged", (order: OrderDto) => upsertOrder(order));
    connection.on("PositionUpdated", (position: PositionDto) => upsertPosition(position));

    connectionRef.current = connection;

    connection
      .start()
      .then(async () => {
        if (cancelled) {
          await connection.stop();
          return;
        }

        setHubConnected(true);
        console.log("SignalR Connected", connection.connectionId);
        setHubError(null);
        subscribedOnHubRef.current.clear();

        const itemsToSubscribe = Array.from(subscribedRef.current.values()).map(item => ({
          symbol: item.symbol,
          exchange: item.exchange,
          instrumentType: item.instrumentType ?? ""
        }));

        if (itemsToSubscribe.length > 0) {
          try {
            await connection.invoke("SubscribeMany", itemsToSubscribe);
            for (const item of itemsToSubscribe) {
              subscribedOnHubRef.current.add(tickKey(item.symbol, item.exchange));
            }
          } catch (err) {
            console.error("Initial SubscribeMany failed", err);
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setHubConnected(false);
          setHubError(err.message);
        }
      });

    connection.onreconnected(async () => {
      setHubConnected(true);
      setHubError(null);
      subscribedOnHubRef.current.clear();

      const itemsToSubscribe = Array.from(subscribedRef.current.values()).map(item => ({
        symbol: item.symbol,
        exchange: item.exchange,
        instrumentType: item.instrumentType ?? ""
      }));

      if (itemsToSubscribe.length > 0) {
        try {
          await connection.invoke("SubscribeMany", itemsToSubscribe);
          for (const item of itemsToSubscribe) {
            subscribedOnHubRef.current.add(tickKey(item.symbol, item.exchange));
          }
        } catch (err) {
          console.error("Resubscribe SubscribeMany failed", err);
        }
      }
    });

    connection.onclose(() => {
      if (!cancelled) {
        setHubConnected(false);
      }
    });

    return () => {
      cancelled = true;
      subscribedOnHubRef.current.clear();
      void connection.stop();
      connectionRef.current = null;
      setHubConnected(false);
    };
  }, [token, upsertOrder, upsertPosition]);

  useEffect(() => {
    if (!token) return;

    const nextItems = new Map<string, SubscriptionItem>();
    for (const order of orders) {
      nextItems.set(tickKey(order.symbol, order.exchange), {
        symbol: order.symbol,
        exchange: order.exchange,
        instrumentType: order.instrumentType,
      });
    }
    for (const position of positions) {
      nextItems.set(tickKey(position.symbol, position.exchange), {
        symbol: position.symbol,
        exchange: position.exchange,
        instrumentType: position.instrumentType,
      });
    }

    const previousItems = portfolioSubscriptionsRef.current;
    const previousKeys = new Set(previousItems.keys());
    const nextKeys = new Set(nextItems.keys());

    const toSubscribe: SubscriptionItem[] = [];
    for (const [key, item] of nextItems.entries()) {
      if (!previousKeys.has(key)) {
        toSubscribe.push(item);
      }
    }

    const toUnsubscribe: SubscriptionItem[] = [];
    for (const [key, item] of previousItems.entries()) {
      if (!nextKeys.has(key)) {
        toUnsubscribe.push(item);
      }
    }

    portfolioSubscriptionsRef.current = nextItems;

    void subscribeMany(toSubscribe);
    void unsubscribeMany(toUnsubscribe);
  }, [orders, positions, token, subscribeMany]);

  useEffect(() => {
    return () => {
      void unsubscribeMany([...portfolioSubscriptionsRef.current.values()]);
      portfolioSubscriptionsRef.current.clear();
    };
  }, [unsubscribeMany]);

  const value = useMemo<MarketContextValue>(
    () => ({
      ticks,
      orders,
      positions,
      marketStatus,
      brokerStatus,
      hubConnected,
      hubError,
      loadError,
      subscribe,
      unsubscribe,
      subscribeMany,
      unsubscribeMany,
      reloadTradingData,
      refreshBroker,
      upsertOrder,
      upsertPosition,
      getTick,
    }),
    [
      ticks,
      orders,
      positions,
      marketStatus,
      brokerStatus,
      hubConnected,
      hubError,
      loadError,
      subscribe,
      unsubscribe,
      subscribeMany,
      unsubscribeMany,
      reloadTradingData,
      refreshBroker,
      upsertOrder,
      upsertPosition,
      getTick,
    ],
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return context;
}

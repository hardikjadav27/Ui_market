import { protectedResources } from "../authConfig";
import { apiRequest } from "./apiClient";
import type {
  BrokerStatusDto,
  CreateOrderRequest,
  InstrumentLookupDto,
  MarketStatusDto,
  OrderDto,
  PositionDto,
  TickSnapshot,
  UpdatePositionRequest,
} from "../types/trading";

export function getMarketStatus() {
  return apiRequest<MarketStatusDto>(`${protectedResources.marketAPI.endpoint}/status`);
}

export function getBrokerStatus() {
  return apiRequest<BrokerStatusDto>(`${protectedResources.brokerAPI.endpoint}/status`);
}

export function refreshBrokerToken() {
  return apiRequest<BrokerStatusDto>(`${protectedResources.brokerAPI.endpoint}/refresh-token`, {
    method: "POST",
  });
}

export interface MarketFeedModeDto {
  useMockMarketData: boolean;
}

export function getMarketFeedMode() {
  return apiRequest<MarketFeedModeDto>(`${protectedResources.brokerAPI.endpoint}/market-feed-mode`);
}

export function setMarketFeedMode(useMockMarketData: boolean) {
  return apiRequest<MarketFeedModeDto>(`${protectedResources.brokerAPI.endpoint}/market-feed-mode`, {
    method: "PUT",
    body: JSON.stringify({ useMockMarketData }),
  });
}

export function searchInstruments(tab?: string, query?: string, limit = 200) {
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);
  if (query) params.set("query", query);
  params.set("limit", String(limit));

  return apiRequest<InstrumentLookupDto[]>(
    `${protectedResources.instrumentsAPI.endpoint}/search?${params.toString()}`,
  );
}

export async function getAllowedScripts(userId: number): Promise<string[]> {
  const res = await apiRequest<{ success: boolean; data: string[] }>(
    `${protectedResources.userAPI.endpoint}/${userId}/scripts`,
  );
  return (res.data ?? []).map((s) => String(s).trim()).filter(Boolean);
}

/** Resolve allowed symbol names for a watchlist tab (exchange/type hints). */
export async function resolveAllowedSymbols(
  symbols: string[],
  tab?: string,
): Promise<InstrumentLookupDto[]> {
  if (symbols.length === 0) return [];

  const hints = tabResolveHints(tab);
  const requests: ResolveInstrumentRequestDto[] = symbols.flatMap((symbol) =>
    hints.map((h) => ({
      symbol,
      exchange: h.exchange,
      instrumentType: h.instrumentType,
      label: symbol,
    })),
  );

  const resolved = await resolveInstruments(requests);
  const bySymbol = new Map<string, InstrumentLookupDto>();
  for (const row of resolved) {
    const key = row.symbol.toUpperCase();
    if (!bySymbol.has(key)) {
      bySymbol.set(key, row);
    }
  }

  const missing = symbols.filter((s) => !bySymbol.has(s.toUpperCase()));
  for (const symbol of missing.slice(0, 40)) {
    try {
      const hits = await searchInstruments(undefined, symbol, 20);
      const exact =
        hits.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase()) ?? hits[0];
      if (exact) {
        bySymbol.set(symbol.toUpperCase(), exact);
      }
    } catch {
      // ignore per-symbol lookup failures
    }
  }

  return symbols
    .map((s) => bySymbol.get(s.toUpperCase()))
    .filter((row): row is InstrumentLookupDto => row != null);
}

function tabResolveHints(tab?: string): Array<{ exchange: string; instrumentType: string }> {
  switch (tab) {
    case "NSE-FUTURE":
      return [{ exchange: "NFO", instrumentType: "FUT" }];
    case "MCX-FUTURE":
      return [{ exchange: "MCX", instrumentType: "FUT" }];
    case "NSE-OPTIONS":
      return [{ exchange: "NFO", instrumentType: "CE" }, { exchange: "NFO", instrumentType: "PE" }];
    case "MCX-OPTIONS":
      return [{ exchange: "MCX", instrumentType: "CE" }, { exchange: "MCX", instrumentType: "PE" }];
    case "WATCHLIST":
    default:
      return [
        { exchange: "NSE", instrumentType: "EQ" },
        { exchange: "NFO", instrumentType: "FUT" },
        { exchange: "MCX", instrumentType: "FUT" },
      ];
  }
}

export interface ResolveInstrumentRequestDto {
  symbol: string;
  exchange: string;
  instrumentType: string;
  label?: string;
}

export function resolveInstruments(requests: ResolveInstrumentRequestDto[]) {
  return apiRequest<InstrumentLookupDto[]>(
    `${protectedResources.instrumentsAPI.endpoint}/resolve`,
    {
      method: "POST",
      body: JSON.stringify(requests),
    },
  );
}

export function getLtp(symbol: string, exchange: string) {
  const params = new URLSearchParams({ symbol, exchange });
  return apiRequest<TickSnapshot>(`${protectedResources.marketAPI.endpoint}/ltp?${params}`);
}

export function listOrders() {
  return apiRequest<OrderDto[]>(protectedResources.ordersAPI.endpoint);
}

export function createOrder(payload: CreateOrderRequest) {
  return apiRequest<OrderDto>(protectedResources.ordersAPI.endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelOrder(id: number) {
  return apiRequest<void>(`${protectedResources.ordersAPI.endpoint}/${id}/cancel`, {
    method: "POST",
  });
}

export function listPositions(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<PositionDto[]>(`${protectedResources.positionsAPI.endpoint}${query}`);
}

export function updatePositionLevels(id: number, payload: UpdatePositionRequest) {
  return apiRequest<PositionDto>(`${protectedResources.positionsAPI.endpoint}/${id}/levels`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function closePosition(id: number) {
  return apiRequest<PositionDto>(`${protectedResources.positionsAPI.endpoint}/${id}/close`, {
    method: "POST",
  });
}

export function modifyOrder(id: number, payload: any) {
  return apiRequest<OrderDto>(`${protectedResources.ordersAPI.endpoint}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

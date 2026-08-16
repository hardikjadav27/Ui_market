export interface TickSnapshot {
  symbol: string;
  exchange: string;
  instrumentToken: number;
  ltp: number;
  bid: number;
  ask: number;
  volume: number;
  oi: number;
  preClose: number;
  ltt?: string;
  updatedAt: string;
}

export interface OrderDto {
  id: number;
  userId: number;
  symbol: string;
  exchange: string;
  zerodhaInstrumentToken: number;
  orderPlaceType: string;
  transactionType: string;
  orderType: string;
  instrumentType: string;
  quantity: number;
  filledQty: number;
  price: number;
  triggerPrice: number;
  averagePrice: number;
  stopLoss: number;
  target: number;
  trailStopLoss: number;
  status: string;
  positionId?: number;
  createdAt: string;
  filledAt?: string;
}

export interface PositionDto {
  id: number;
  userId: number;
  symbol: string;
  exchange: string;
  zerodhaInstrumentToken: number;
  transactionType: string;
  instrumentType: string;
  entryQty: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  trailStopLoss: number;
  status: string;
  exitPrice?: number;
  exitReason?: string;
  openedAt: string;
  closedAt?: string;
  currentLtp?: number;
}

export interface CreateOrderRequest {
  symbol: string;
  exchange: string;
  orderPlaceType: string;
  transactionType: string;
  orderType: string;
  instrumentType: string;
  quantity: number;
  price: number;

  triggerPrice: number;
  stopLoss: number;
  target: number;
  trailStopLoss: number;
}

export interface UpdatePositionRequest {
  stopLoss: number;
  target: number;
  trailStopLoss: number;
}

export interface ModifyOrderRequest {
  orderType: string;
  quantity: number;
  price: number;
  triggerPrice: number;
  stopLoss: number;
  target: number;
  trailStopLoss: number;
}

export interface MarketStatusDto {
  webSocketConnected: boolean;
  isMockDataEnabled: boolean;
  instrumentsLoaded: boolean;
  hasAccessToken: boolean;
  subscribedSymbolCount: number;
}

export interface InstrumentLookupDto {
  instrumentToken: number;
  symbol: string;
  name: string;
  exchange: string;
  instrumentType: string;
  segment: string;
  expiry?: string | null;
  displayName: string;
}

export interface BrokerStatusDto {
  success: boolean;
  message: string;
  hasAccessToken: boolean;
  webSocketConnected: boolean;
}

export function tickKey(symbol: string, exchange: string): string {
  return `${exchange}:${symbol}`.toUpperCase();
}

export function formatPrice(value?: number, digits = 2): string {
  if (value === undefined || value === null || Number.isNaN(value) || value === 0) {
    return "0";
  }
  return value.toFixed(digits);
}

export function formatChange(ltp: number, close: number): string {
  if (!ltp || !close) return "0.00 (0.00%)";
  const diff = ltp - close;
  const pct = close !== 0 ? (diff / close) * 100 : 0;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

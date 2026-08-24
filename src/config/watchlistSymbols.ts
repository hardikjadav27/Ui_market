export type WatchlistTab =
  | "WATCHLIST"
  | "NSE-FUTURE"
  | "NSE-OPTIONS"
  | "MCX-FUTURE"
  | "MCX-OPTIONS"
  | "COMEX"
  | "CRYPTO"
  | "FOREX"
  | "US-STOCK"
  | "SGX"
  | "OTHERS"
  | "DGCX";

export interface WatchlistInstrument {
  symbol: string;
  exchange: string;
  instrumentType: string;
  label?: string;
}

export const watchlistTabs: WatchlistTab[] = [
  "WATCHLIST",
  "NSE-FUTURE",
  "NSE-OPTIONS",
  "MCX-FUTURE",
  "MCX-OPTIONS",
  "COMEX",
  "CRYPTO",
  "FOREX",
  "US-STOCK",
  "SGX",
  "OTHERS",
  "DGCX",
];

/** Tabs without Zerodha-mapped symbols in this build */
export const unsupportedWatchlistTabs: WatchlistTab[] = [
  "NSE-OPTIONS",
  "MCX-OPTIONS",
  "COMEX",
  "CRYPTO",
  "FOREX",
  "US-STOCK",
  "SGX",
  "DGCX",
  "OTHERS",
];

export const watchlistInstruments: Record<WatchlistTab, WatchlistInstrument[]> =
  {
    WATCHLIST: [
      { symbol: "RELIANCE", exchange: "NSE", instrumentType: "EQ" },
      { symbol: "TCS", exchange: "NSE", instrumentType: "EQ" },
      { symbol: "INFY", exchange: "NSE", instrumentType: "EQ" },
      { symbol: "HDFCBANK", exchange: "NSE", instrumentType: "EQ" },
      { symbol: "ICICIBANK", exchange: "NSE", instrumentType: "EQ" },
      { symbol: "SBIN", exchange: "NSE", instrumentType: "EQ" },
      { symbol: "ITC", exchange: "NSE", instrumentType: "EQ" },
      { symbol: "BHARTIARTL", exchange: "NSE", instrumentType: "EQ" },
    ],
    "NSE-FUTURE": [
      {
        symbol: "NIFTY",
        exchange: "NFO",
        instrumentType: "FUT",
        label: "NIFTY FUT",
      },
      {
        symbol: "BANKNIFTY",
        exchange: "NFO",
        instrumentType: "FUT",
        label: "BANKNIFTY FUT",
      },
      { symbol: "RELIANCE", exchange: "NFO", instrumentType: "FUT" },
      { symbol: "TCS", exchange: "NFO", instrumentType: "FUT" },
      { symbol: "INFY", exchange: "NFO", instrumentType: "FUT" },
      { symbol: "HDFCBANK", exchange: "NFO", instrumentType: "FUT" },
    ],
    "NSE-OPTIONS": [],
    "MCX-FUTURE": [
      { symbol: "GOLD", exchange: "MCX", instrumentType: "FUT" },
      { symbol: "SILVER", exchange: "MCX", instrumentType: "FUT" },
      { symbol: "CRUDEOIL", exchange: "MCX", instrumentType: "FUT" },
      { symbol: "NATURALGAS", exchange: "MCX", instrumentType: "FUT" },
    ],
    "MCX-OPTIONS": [],
    COMEX: [],
    CRYPTO: [],
    FOREX: [],
    "US-STOCK": [],
    SGX: [],
    OTHERS: [],
    DGCX: [],
  };

export function getWatchlistEmptyMessage(tab: WatchlistTab): string {
  if (unsupportedWatchlistTabs.includes(tab)) {
    return "This segment is not available on the Zerodha paper-trading feed.";
  }
  return "Use the search bar to filter instruments.";
}

export const homeIndexSymbols: WatchlistInstrument[] = [
  {
    symbol: "NIFTY 50",
    exchange: "NSE",
    instrumentType: "INDEX",
    label: "NIFTY",
  },
  {
    symbol: "BANKNIFTY",
    exchange: "NSE",
    instrumentType: "INDEX",
    label: "BANKNIFTY",
  },
  {
    symbol: "RELIANCE",
    exchange: "NSE",
    instrumentType: "EQ",
    label: "RELIANCE",
  },
  { symbol: "TCS", exchange: "NSE", instrumentType: "EQ", label: "TCS" },
];

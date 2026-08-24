const runtimeConfig =
  typeof window !== "undefined" && (window as any).RUNTIME_CONFIG;
const apiBaseUrl: string =
  runtimeConfig?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "/api";
const hubBaseUrl: string =
  runtimeConfig?.HUB_BASE_URL || import.meta.env.VITE_HUB_BASE_URL || "";

export const protectedResources = {
  authAPI: {
    endpoint: `${apiBaseUrl}/Auth`,
  },

  adminAPI: {
    endpoint: `${apiBaseUrl}/Admin`,
  },

  subAdminAPI: {
    endpoint: `${apiBaseUrl}/subadmin`,
  },

  masterAPI: {
    endpoint: `${apiBaseUrl}/master`,
  },

  clientAPI: {
    endpoint: `${apiBaseUrl}/client`,
  },

  tradeAPI: {
    endpoint: `${apiBaseUrl}/trade`,
  },

  ordersAPI: {
    endpoint: `${apiBaseUrl}/orders`,
  },

  positionsAPI: {
    endpoint: `${apiBaseUrl}/positions`,
  },

  marketAPI: {
    endpoint: `${apiBaseUrl}/market`,
  },

  instrumentsAPI: {
    endpoint: `${apiBaseUrl}/instruments`,
  },

  brokerAPI: {
    endpoint: `${apiBaseUrl}/broker/zerodha`,
  },

  marketHub: {
    endpoint: `${hubBaseUrl}/hubs/market`,
  },

  roleAPI: {
    endpoint: `${apiBaseUrl}/roles`,
  },

  userAPI: {
    endpoint: `${apiBaseUrl}/users`,
  },

  walletsAPI: {
    endpoint: `${apiBaseUrl}/wallets`,
  },

  sharingDuesAPI: {
    endpoint: `${apiBaseUrl}/sharing-dues`,
  },

  revenuesAPI: {
    endpoint: `${apiBaseUrl}/revenues`,
  },
};

export default apiBaseUrl;

import { protectedResources } from "../authConfig";
import { apiRequest } from "./apiClient";

export interface WalletDto {
  id: number;
  userId: number;
  currency: string;
  walletType: string;
  availableBalance: number;
  pendingBalance: number;
  lockedBalance: number;
  updatedAt: string;
}

export interface StatementRow {
  transactionDate: string;
  transactionType: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
  status: string;
  ledgerSequence: number;
  id: number;
}

export interface RevenueRow {
  id: number;
  commissionCalculationId: number;
  sourceExecutionId?: number | null;
  sourceUserId: number;
  sourceUserName?: string;
  beneficiaryUserId: number;
  beneficiaryName?: string;
  revenueType: string;
  appliedRate: number;
  baseAmount: number;
  revenueAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  settledAt?: string;
  formula: string;
  hierarchyPath?: string;
}

export interface SharingDueAccount {
  id: number;
  childUserId: number;
  childName?: string;
  parentUserId: number;
  parentName?: string;
  accruedDue: number;
  totalAccrued: number;
  totalPaid: number;
  updatedAt: string;
}

export interface SharingDueHistoryItem {
  kind: string;
  id: number;
  amount: number;
  commissionAmount?: number;
  appliedRate?: number;
  dueBefore: number;
  dueAfter: number;
  description: string;
  note?: string;
  confirmedByUserId?: number;
  confirmedByName?: string;
  sourceExecutionId?: number;
  revenueTransactionId?: number;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export function getWallets(userId: number) {
  return apiRequest<ApiEnvelope<WalletDto[] | WalletDto>>(`${protectedResources.walletsAPI.endpoint}/${userId}`);
}

export function getWallet(userId: number, type?: string) {
  const q = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiRequest<ApiEnvelope<WalletDto | WalletDto[]>>(`${protectedResources.walletsAPI.endpoint}/${userId}${q}`);
}

export function getStatement(
  userId: number,
  params: { from?: string; to?: string; type?: string; transactionType?: string; walletType?: string } = {},
) {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.type) query.set("type", params.type);
  if (params.transactionType) query.set("transactionType", params.transactionType);
  if (params.walletType) query.set("walletType", params.walletType);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<ApiEnvelope<StatementRow[]>>(
    `${protectedResources.walletsAPI.endpoint}/${userId}/statement${suffix}`,
  );
}

export function tradingTopUp(userId: number, amount: number, note?: string) {
  return apiRequest<ApiEnvelope<unknown>>(`${protectedResources.walletsAPI.endpoint}/${userId}/trading/topup`, {
    method: "POST",
    body: JSON.stringify({ amount, note }),
  });
}

export function getRevenues(userId: number) {
  return apiRequest<ApiEnvelope<RevenueRow[]>>(
    `${protectedResources.userAPI.endpoint}/${userId}/revenues`,
  );
}

export function getMySharingDues() {
  return apiRequest<ApiEnvelope<{ asChild: SharingDueAccount | null; asParent: SharingDueAccount[] }>>(
    `${protectedResources.sharingDuesAPI.endpoint}/mine`,
  );
}

export function getSharingDueHistory(childUserId: number) {
  return apiRequest<ApiEnvelope<SharingDueHistoryItem[]>>(
    `${protectedResources.sharingDuesAPI.endpoint}/${childUserId}/history`,
  );
}

export function confirmShareCash(childUserId: number, amount: number, note?: string) {
  return apiRequest<ApiEnvelope<unknown>>(`${protectedResources.sharingDuesAPI.endpoint}/${childUserId}/confirm-cash`, {
    method: "POST",
    body: JSON.stringify({ amount, note }),
  });
}

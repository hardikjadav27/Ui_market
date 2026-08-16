export function getLoggedInRoleId(): number {
  return Number(localStorage.getItem("roleId") || 0);
}

export function getLoggedInRoleKey(): string {
  const roleId = getLoggedInRoleId();
  if (roleId === 1) return "SuperAdmin";
  if (roleId === 2) return "Admin";
  if (roleId === 3) return "SubAdmin";
  if (roleId === 4) return "Master";
  if (roleId === 5) return "Client";

  const role = (localStorage.getItem("role") || "").replace(/\s+/g, "");
  return role;
}

export function formatSharingRate(rate: number | null | undefined): string {
  if (rate == null) return "-";
  return `${(Number(rate) * 100).toFixed(4).replace(/\.?0+$/, "")}%`;
}

export function formatMoney(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

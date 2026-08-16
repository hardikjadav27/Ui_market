export function getStoredToken(): string | null {
  return localStorage.getItem("token");
}

export function hasAcceptedRules(): boolean {
  return localStorage.getItem("rulesAccepted") === "true";
}

export function clearAuthStorage(): void {
  localStorage.clear();
}

export function readStoredAuth() {
  return {
    token: localStorage.getItem("token") ?? "",
    userName: localStorage.getItem("userName") ?? "",
    fullName: localStorage.getItem("fullName") ?? "",
    role: localStorage.getItem("role") ?? "",
  };
}

import { protectedResources } from "../authConfig";

export interface RegisterUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface RegisterUserResponse {
  success: boolean;
  message: string;
  data?: {
    username?: string;
    Username?: string;
    email?: string;
    Email?: string;
  };
}

export async function registerUser(payload: RegisterUserRequest): Promise<RegisterUserResponse> {
  const response = await fetch(protectedResources.userAPI.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as RegisterUserResponse;

  if (!response.ok && response.status !== 409) {
    throw new Error(data.message || "Registration failed.");
  }

  return data;
}

export function getRegisteredUsername(response: RegisterUserResponse, email: string): string {
  return (
    response.data?.username ??
    response.data?.Username ??
    email.split("@")[0]?.toLowerCase() ??
    email
  );
}

export const DEMO_USER = {
  fullName: "Demo User",
  email: "demo@dpasa.local",
  password: "Demo@123",
  username: "demo",
  role: "User",
} as const;

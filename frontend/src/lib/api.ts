const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FieldErrors {
  [field: string]: string;
}

export class ApiError extends Error {
  fields: FieldErrors;
  constructor(message: string, fields: FieldErrors = {}) {
    super(message);
    this.fields = fields;
  }
}

// Parses go-playground/validator error strings into per-field messages.
// e.g. "Key: 'RegisterRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag"
function parseValidatorErrors(raw: string): FieldErrors {
  const fields: FieldErrors = {};
  const lines = raw.split("\n");
  for (const line of lines) {
    const match = line.match(/Field validation for '(\w+)' failed on the '(\w+)' tag/);
    if (!match) continue;
    const [, field, rule] = match;
    const key = field.toLowerCase();
    const messages: Record<string, string> = {
      required: `${field} is required`,
      email: "Enter a valid email address",
      min: `${field} is too short`,
      max: `${field} is too long`,
      oneof: `${field} has an invalid value`,
    };
    fields[key] = messages[rule] ?? `${field} is invalid`;
  }
  return fields;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    const message = body.error ?? "Request failed";
    const fields = res.status === 422 ? parseValidatorErrors(message) : {};
    throw new ApiError(message, fields);
  }

  return (body.data ?? body.message) as T;
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

function saveTokens(tokens: { access_token: string; refresh_token: string }) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  agency_name: string;
  logo_url: string;
  brand_color: string;
  pdf_footer_text: string;
  license_number: string;
  state: string;
  email_verified: boolean;
  plan: string;
  plan_status: string;
  created_at: string;
}

export const user = {
  getProfile: () =>
    request<Profile>("/api/v1/me"),

  updateProfile: (body: { name?: string; agency_name?: string; license_number?: string; state?: string }) =>
    request<Profile>("/api/v1/me", { method: "PUT", body: JSON.stringify(body) }),

  updateBranding: (body: { brand_color?: string; pdf_footer_text?: string }) =>
    request<Profile>("/api/v1/me/branding", { method: "PUT", body: JSON.stringify(body) }),

  updateDefaults: (body: {
    default_contingencies?: string[];
    default_closing_days?: number;
    cover_letter_tone?: string;
    default_earnest_money_pct?: number;
  }) =>
    request<Profile>("/api/v1/me/defaults", { method: "PUT", body: JSON.stringify(body) }),

  changePassword: (body: { current_password: string; new_password: string }) =>
    request<string>("/api/v1/me/password", { method: "PUT", body: JSON.stringify(body) }),
};

export const auth = {
  register: async (name: string, email: string, password: string, plan?: string) => {
    const tokens = await request<{ access_token: string; refresh_token: string }>(
      "/api/v1/auth/register",
      { method: "POST", body: JSON.stringify({ name, email, password, plan }) },
    );
    saveTokens(tokens);
    return tokens;
  },

  login: async (email: string, password: string) => {
    const tokens = await request<{ access_token: string; refresh_token: string }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    saveTokens(tokens);
    return tokens;
  },

  verifyEmail: (token: string) =>
    request<string>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`),

  me: () =>
    request<{ user_id: string }>("/api/v1/me"),
};

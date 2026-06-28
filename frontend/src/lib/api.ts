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

export interface Package {
  id: string;
  user_id: string;
  status: string;
  property_address: string;
  listing_price: number | null;
  property_type: string;
  mls_number: string;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  notable_features: string;
  offer_amount: number;
  earnest_money: number | null;
  down_payment_pct: number | null;
  loan_type: string;
  closing_date: string;
  contingencies: string[];
  escalation_active: boolean;
  escalation_max_price: number | null;
  escalation_increment: number | null;
  additional_terms: string;
  buyer_name: string;
  buyer_story: string;
  cover_letter_text: string;
  offer_summary_text: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackageList {
  packages: Package[];
  total: number;
  page: number;
  limit: number;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  loan_type: string;
  closing_days: number;
  contingencies: string[];
  cover_letter_tone: string;
  default_terms: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

type CreatePackageBody = {
  property_address: string;
  offer_amount: number;
  listing_price?: number;
  property_type?: string;
  mls_number?: string;
  bedrooms?: number;
  bathrooms?: number;
  year_built?: number;
  notable_features?: string;
  earnest_money?: number;
  down_payment_pct?: number;
  loan_type?: string;
  closing_date?: string;
  contingencies?: string[];
  additional_terms?: string;
  buyer_name?: string;
  buyer_story?: string;
};

export const packages = {
  list: (params?: { status?: string; sort?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.sort) q.set("sort", params.sort);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<PackageList>(`/api/v1/packages${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    request<Package>(`/api/v1/packages/${id}`),

  create: (body: CreatePackageBody) =>
    request<Package>("/api/v1/packages", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: Partial<CreatePackageBody>) =>
    request<Package>(`/api/v1/packages/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  updateCoverLetter: (id: string, text: string) =>
    request<Package>(`/api/v1/packages/${id}/cover-letter`, { method: "PATCH", body: JSON.stringify({ text }) }),

  markComplete: (id: string) =>
    request<Package>(`/api/v1/packages/${id}/complete`, { method: "PATCH" }),

  delete: (id: string) =>
    request<string>(`/api/v1/packages/${id}`, { method: "DELETE" }),

  duplicate: (id: string) =>
    request<Package>(`/api/v1/packages/${id}/duplicate`, { method: "POST" }),

  generate: (id: string) =>
    request<Package>(`/api/v1/packages/${id}/generate`, { method: "POST" }),
};

export const templates = {
  list: () =>
    request<Template[]>("/api/v1/templates"),

  getById: (id: string) =>
    request<Template>(`/api/v1/templates/${id}`),

  create: (body: { name: string; loan_type?: string; closing_days?: number; contingencies?: string[]; cover_letter_tone?: string; default_terms?: string }) =>
    request<Template>("/api/v1/templates", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: { name?: string; loan_type?: string; closing_days?: number; contingencies?: string[]; cover_letter_tone?: string; default_terms?: string }) =>
    request<Template>(`/api/v1/templates/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: string) =>
    request<string>(`/api/v1/templates/${id}`, { method: "DELETE" }),
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

  forgotPassword: (email: string) =>
    request<string>("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (token: string, new_password: string) =>
    request<string>("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password }) }),

  me: () =>
    request<{ user_id: string }>("/api/v1/me"),
};

import { toast } from "sonner";

const TOKEN_KEY = "sanctuary_jwt";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

function getBaseUrl(): string {
  const u = import.meta.env.VITE_API_URL as string | undefined;
  if (!u) throw new Error("VITE_API_URL is not set");
  return u.replace(/\/$/, "");
}

async function request<T>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { skipAuth, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!headers.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const t = getStoredToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }

  const res = await fetch(`${getBaseUrl()}${path}`, { ...rest, headers });

  if (res.status === 401) {
    setStoredToken(null);
    const skipRedirect =
      path.startsWith("/api/auth/login") ||
      path.startsWith("/api/auth/verify-2fa") ||
      path.startsWith("/api/auth/google-login") ||
      path.startsWith("/api/auth/register-donor") ||
      path === "/api/auth/me";
    if (!skipRedirect) {
      window.location.href = "/login";
    }
  }

  if (res.status === 429) {
    toast.warning("Too many requests, please wait");
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json) {
    throw new Error(res.statusText || "Request failed");
  }
  if (!res.ok && !json.message) {
    throw new Error(res.statusText || "Request failed");
  }
  return json;
}

/** --- Auth --- */
export const authApi = {
  async login(email: string, password: string) {
    return request<{ token?: string; requiresTwoFactor?: boolean; email?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },
  async verifyTwoFactor(email: string, totpCode: string) {
    return request<{ token: string }>("/api/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ email, totpCode }),
      skipAuth: true,
    });
  },
  async googleLogin(idToken: string) {
    return request<{ token: string }>("/api/auth/google-login", {
      method: "POST",
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    });
  },
  async me() {
    return request<{
      id: string;
      email: string;
      displayName: string;
      role: string;
      linkedSupporterId: number | null;
    }>("/api/auth/me");
  },
  async logout() {
    return request<null>("/api/auth/logout", { method: "POST" });
  },
  async register(body: {
    email: string;
    password: string;
    displayName: string;
    role: string;
    linkedSupporterId?: number | null;
  }) {
    return request<{ userId: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
  },
  async registerDonor(body: { email: string; password: string; displayName: string }) {
    return request<{ userId: string }>("/api/auth/register-donor", {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth: true,
    });
  },
};

/** --- Residents & case --- */
export const residentsApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.set(k, String(v));
      });
    }
    const s = q.toString();
    return request<unknown[]>(`/api/residents${s ? `?${s}` : ""}`);
  },
  get: (id: number) => request<unknown>(`/api/residents/${id}`),
  create: (body: unknown) =>
    request<{ id: number }>("/api/residents", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: unknown) =>
    request<null>(`/api/residents/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => request<null>(`/api/residents/${id}?confirm=true`, { method: "DELETE" }),

  processRecordings: (residentId: number) => request<unknown[]>(`/api/residents/${residentId}/process-recordings`),
  addProcessRecording: (residentId: number, body: unknown) =>
    request<{ id: number }>(`/api/residents/${residentId}/process-recordings`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  homeVisitations: (residentId: number) => request<unknown[]>(`/api/residents/${residentId}/home-visitations`),
  addHomeVisitation: (residentId: number, body: unknown) =>
    request<{ id: number }>(`/api/residents/${residentId}/home-visitations`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  educationRecords: (residentId: number) => request<unknown[]>(`/api/residents/${residentId}/education-records`),
  addEducationRecord: (residentId: number, body: unknown) =>
    request<{ id: number }>(`/api/residents/${residentId}/education-records`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  healthRecords: (residentId: number) => request<unknown[]>(`/api/residents/${residentId}/health-records`),
  addHealthRecord: (residentId: number, body: unknown) =>
    request<{ id: number }>(`/api/residents/${residentId}/health-records`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  interventionPlans: (residentId: number) => request<unknown[]>(`/api/residents/${residentId}/intervention-plans`),
  addInterventionPlan: (residentId: number, body: unknown) =>
    request<{ id: number }>(`/api/residents/${residentId}/intervention-plans`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  incidents: (residentId: number) => request<unknown[]>(`/api/residents/${residentId}/incidents`),
  addIncident: (residentId: number, body: unknown) =>
    request<{ id: number }>(`/api/residents/${residentId}/incidents`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const interventionPlansApi = {
  update: (id: number, body: unknown) =>
    request<null>(`/api/intervention-plans/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

/** --- Safehouses --- */
export const safehousesApi = {
  list: () => request<unknown[]>("/api/safehouses"),
  get: (id: number) => request<unknown>(`/api/safehouses/${id}`),
  create: (body: unknown) =>
    request<{ id: number }>("/api/safehouses", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: unknown) =>
    request<null>(`/api/safehouses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => request<null>(`/api/safehouses/${id}?confirm=true`, { method: "DELETE" }),
};

/** --- Donors (supporters + donations) --- */
export type SupporterListRow = {
  supporterId: number;
  displayName: string;
  supporterType: string;
  status: string;
  country: string;
  firstDonationDate: string | null;
  acquisitionChannel: string;
  donationCount: number;
  totalLifetimeValue: number;
  lastDonationDate: string | null;
  latestAmount: number | null;
};

export type SupportersListPayload = {
  supporters: SupporterListRow[];
  summary: {
    last12MonthsDonationTotal: number;
    avgMonthlyLast12: number;
    /** @deprecated API legacy */
    ytdDonationTotal?: number;
    avgMonthlyYtd?: number;
  };
};

export const donorsApi = {
  supportersList: (params?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return request<SupportersListPayload>(`/api/supporters${s ? `?${s}` : ""}`);
  },
  priorityTargets: (params?: { limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    const s = q.toString();
    return request<unknown[]>(`/api/supporters/priority-targets${s ? `?${s}` : ""}`);
  },
  supporterGet: (id: number) => request<unknown>(`/api/supporters/${id}`),
  supporterCreate: (body: unknown) =>
    request<{ id: number }>("/api/supporters", { method: "POST", body: JSON.stringify(body) }),
  supporterUpdate: (id: number, body: unknown) =>
    request<null>(`/api/supporters/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  donationsList: (params?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return request<unknown[]>(`/api/donations${s ? `?${s}` : ""}`);
  },
  donationGet: (id: number) => request<unknown>(`/api/donations/${id}`),
  donationCreate: (body: unknown) =>
    request<{ id: number }>("/api/donations", { method: "POST", body: JSON.stringify(body) }),
  donationUpdate: (id: number, body: unknown) =>
    request<null>(`/api/donations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

/** --- Social --- */
export const socialMediaApi = {
  list: (params?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return request<unknown[]>(`/api/social-media-posts${s ? `?${s}` : ""}`);
  },
  analytics: (params?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return request<unknown>(`/api/social-media-posts/analytics${s ? `?${s}` : ""}`);
  },
  get: (id: number) => request<unknown>(`/api/social-media-posts/${id}`),
  create: (body: unknown) =>
    request<{ id: number }>("/api/social-media-posts", { method: "POST", body: JSON.stringify(body) }),
};

/** --- Dashboard --- */
export const dashboardApi = {
  admin: () => request<unknown>("/api/dashboard/admin"),
  impact: () => request<unknown>("/api/dashboard/impact"),
};

/** --- ML --- */
export const mlApi = {
  list: (params?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return request<unknown[]>(`/api/ml/predictions${s ? `?${s}` : ""}`);
  },
  upsert: (body: unknown) =>
    request<{ id: number }>("/api/ml/predictions", { method: "POST", body: JSON.stringify(body) }),
  latestForEntity: (entityType: string, entityId: number) =>
    request<unknown[]>(`/api/ml/predictions/${encodeURIComponent(entityType)}/${entityId}`),
  refreshSupporters: () =>
    request<{ queued: boolean }>("/api/supporters/ml-refresh-predictions", { method: "POST" }),
};

/** --- Impact snapshots (public) --- */
export const impactApi = {
  list: () => request<unknown[]>("/api/impact-snapshots"),
  get: (id: number) => request<unknown>(`/api/impact-snapshots/${id}`),
  create: (body: unknown) =>
    request<{ id: number }>("/api/impact-snapshots", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: unknown) =>
    request<null>(`/api/impact-snapshots/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

export async function healthCheck() {
  const r = await fetch(`${getBaseUrl()}/health`);
  return r.json() as Promise<{ status: string }>;
}

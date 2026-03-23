const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PREFIX = "/api/v1/demo";

type FetchOptions = RequestInit & {
  token?: string;
};

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${PREFIX}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => response.statusText);
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  // Listings
  generateListing: (data: unknown, token: string) =>
    apiFetch("/listings/generate", { method: "POST", body: JSON.stringify(data), token }),
  getListings: (token: string, page = 1) =>
    apiFetch(`/listings?page=${page}`, { token }),
  getListing: (id: string, token: string) =>
    apiFetch(`/listings/${id}`, { token }),
  updateListing: (id: string, data: unknown, token: string) =>
    apiFetch(`/listings/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  deleteListing: (id: string, token: string) =>
    apiFetch(`/listings/${id}`, { method: "DELETE", token }),
  regenerateListing: (id: string, token: string) =>
    apiFetch(`/listings/${id}/regenerate`, { method: "POST", token }),

  // Images
  generateImage: (data: unknown, token: string) =>
    apiFetch("/images/generate", { method: "POST", body: JSON.stringify(data), token }),
  getImages: (token: string, page = 1) =>
    apiFetch(`/images?page=${page}`, { token }),
  deleteImage: (id: string, token: string) =>
    apiFetch(`/images/${id}`, { method: "DELETE", token }),

  // Social
  generateSocial: (data: unknown, token: string) =>
    apiFetch("/social/generate", { method: "POST", body: JSON.stringify(data), token }),
  getSocialPosts: (token: string, page = 1) =>
    apiFetch(`/social?page=${page}`, { token }),
  deleteSocial: (id: string, token: string) =>
    apiFetch(`/social/${id}`, { method: "DELETE", token }),

  // Ads
  generateAds: (data: unknown, token: string) =>
    apiFetch("/ads/generate", { method: "POST", body: JSON.stringify(data), token }),
  getAds: (token: string, page = 1) =>
    apiFetch(`/ads?page=${page}`, { token }),
  deleteAd: (id: string, token: string) =>
    apiFetch(`/ads/${id}`, { method: "DELETE", token }),

  // Research
  searchResearch: (data: unknown, token: string) =>
    apiFetch("/research/search", { method: "POST", body: JSON.stringify(data), token }),
  getResearchHistory: (token: string) =>
    apiFetch("/research", { token }),

  // Usage
  getCurrentUsage: (token: string) =>
    apiFetch("/usage/current", { token }),
  getUsageHistory: (token: string) =>
    apiFetch("/usage/history", { token }),

  // Billing
  getPlans: () => apiFetch("/billing/plans", {}),
  createCheckout: (data: unknown, token: string) =>
    apiFetch("/billing/checkout", { method: "POST", body: JSON.stringify(data), token }),
  createPortal: (token: string) =>
    apiFetch("/billing/portal", { method: "POST", token }),
  getSubscription: (token: string) =>
    apiFetch("/billing/subscription", { token }),
};

export { ApiError };

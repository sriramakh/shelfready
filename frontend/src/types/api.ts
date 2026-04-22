export interface ListingGenerateRequest {
  platform: "amazon" | "etsy" | "shopify" | "ebay";
  product_name: string;
  product_details: string;
  target_audience?: string;
  price_range?: string;
  category?: string;
}

export interface ListingResponse {
  id: string;
  platform: string;
  product_name: string;
  generated_title: string;
  generated_bullets: string[];
  generated_description: string;
  generated_keywords: string[];
  created_at: string;
}

export interface ImageGenerateRequest {
  description: string;
  listing_id?: string;
  aspect_ratio?: string;
  image_type?: "lifestyle" | "flat_lay" | "in_use" | "studio";
  style?: "photorealistic" | "minimalist" | "vibrant";
}

export interface ImageResponse {
  id: string;
  public_url: string;
  prompt: string;
  aspect_ratio: string;
  image_type: string;
  created_at: string;
}

export interface SocialGenerateRequest {
  platform: "instagram" | "facebook" | "pinterest";
  product_name: string;
  product_details: string;
  listing_id?: string;
  generate_image?: boolean;
  tone?: string;
}

export interface SocialResponse {
  id: string;
  platform: string;
  caption: string;
  hashtags: string[];
  cta_text: string | null;
  image_url: string | null;
  created_at: string;
}

export interface AdGenerateRequest {
  ad_platform: "facebook" | "google";
  product_name: string;
  product_details: string;
  target_audience?: string;
  listing_id?: string;
  num_variants?: number;
}

export interface AdVariant {
  headline: string;
  primary_text: string;
  description: string;
  cta: string;
  variant_label: string;
}

export interface AdResponse {
  variants: AdVariant[];
  ad_platform: string;
  created_at: string;
}

export interface UsageCurrent {
  used: number;
  limit: number;
  remaining: number;
  window_resets_at: string;
  plan: string;
}

export interface PlanInfo {
  tier: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  requests_per_5h: number;
  max_listings_per_month: number;
  max_images_per_month: number;
  max_photoshoots_per_month: number;
  research_enabled: boolean;
}

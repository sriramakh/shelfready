export const PLANS = {
  free: {
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    requestsPer5h: 100,
    maxListings: 3,
    maxImages: 5,
    maxPhotoshoots: 0,
    research: false,
    features: [
      "3 product listings/month",
      "5 AI images (text-to-image)",
      "Basic ad copy generation",
      "Social media posts",
    ],
  },
  starter: {
    name: "Starter",
    priceMonthly: 15,
    priceYearly: 144,
    requestsPer5h: 2000,
    maxListings: 50,
    maxImages: 50,
    maxPhotoshoots: 10,
    research: true,
    features: [
      "50 product listings/month",
      "50 AI images/month",
      "10 AI photoshoots/month (50 images)",
      "Ad copy generation",
      "Social media posts",
      "Competitor research",
      "Priority support",
    ],
  },
  pro: {
    name: "Pro",
    priceMonthly: 39,
    priceYearly: 374,
    requestsPer5h: 5000,
    maxListings: 300,
    maxImages: 300,
    maxPhotoshoots: 30,
    research: true,
    features: [
      "300 product listings/month",
      "300 AI images/month",
      "30 AI photoshoots/month (150 images)",
      "Ad copy generation",
      "Social media posts",
      "Competitor research",
      "Export to CSV/JSON",
      "Priority support",
    ],
    popular: true,
  },
  business: {
    name: "Business",
    priceMonthly: 99,
    priceYearly: 950,
    requestsPer5h: 15000,
    maxListings: -1,
    maxImages: 1000,
    maxPhotoshoots: 100,
    research: true,
    features: [
      "Unlimited product listings",
      "1,000 AI images/month",
      "100 AI photoshoots/month (500 images)",
      "Ad copy generation",
      "Social media posts",
      "Competitor research",
      "Export to CSV/JSON",
      "API access",
      "Dedicated support",
    ],
  },
} as const;

export const PLATFORMS = {
  amazon: { name: "Amazon", color: "#FF9900" },
  etsy: { name: "Etsy", color: "#F1641E" },
  shopify: { name: "Shopify", color: "#96BF48" },
} as const;

export const SOCIAL_PLATFORMS = {
  instagram: { name: "Instagram", color: "#E1306C" },
  facebook: { name: "Facebook", color: "#1877F2" },
  pinterest: { name: "Pinterest", color: "#E60023" },
} as const;

export const AD_PLATFORMS = {
  facebook: { name: "Facebook/Instagram Ads", color: "#1877F2" },
  google: { name: "Google Ads", color: "#4285F4" },
} as const;

export const PRODUCTS_OR_SERVICES = ["Products", "Services", "Both"] as const;

export const INDUSTRY_SECTOR = [
  "Manufacturing",
  "Energy & Utilities",
  "Automotive",
  "Aerospace & Defence",
  "Pharmaceuticals & Life Sciences",
  "Chemicals",
  "Food & Beverage",
  "Industrial Equipment",
  "Technology & Electronics",
  "Other",
] as const;

export const SITE_STRUCTURE = ["Single-site", "Multi-site"] as const;

export const GEOGRAPHIC_REACH = ["Domestic only", "International", "Both"] as const;

export const PORTFOLIO_RANGE = [
  "Single product/service",
  "Multiple variations of a product/service",
  "Diverse range of products/services",
] as const;

export const REGULATORY_ENVIRONMENT = [
  "Safety-critical",
  "Export-controlled",
  "Data protection (e.g. GDPR)",
  "Sector-specific compliance",
  "None of these apply",
  "Other",
] as const;

export const OT_ESTATE_AGE_DIVERSITY = [
  "Mostly modern (post-2015)",
  "Mixed, moderate diversity",
  "Predominantly legacy (pre-2010)",
  "Highly heterogeneous (wide age/vendor spread)",
] as const;

export const SIZE_HEADCOUNT_BAND = [
  "1–49",
  "50–249",
  "250–999",
  "1,000–4,999",
  "5,000+",
] as const;

export const WORDING_VARIANT_OPTIONS = [
  { value: "plainEnglish", label: "Non-technical leaders/managers" },
  { value: "technical", label: "IT/data professionals" },
] as const;

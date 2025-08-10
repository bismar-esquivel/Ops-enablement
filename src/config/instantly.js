require("dotenv").config();

const INSTANTLY_CONFIG = {
  API_KEY:
    "MWU3YTg3NDMtNDQyNi00ODNmLWFkMjQtMjM0NDRkOTU0YzFkOk90VmlRRWxvV2Nmdw==",
  BASE_URL:
    process.env.INSTANTLY_API_BASE_URL || "https://api.instantly.ai/api/v2",
  ENDPOINTS: {
    CAMPAIGNS: "/campaigns",
    CAMPAIGN_DETAILS: "/campaigns/{id}",
    CAMPAIGN_METRICS: "/campaigns/{id}/metrics",
    CAMPAIGN_SUBSCRIBERS: "/campaigns/{id}/subscribers",
  },
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 60,
    DELAY_BETWEEN_REQUESTS: parseInt(process.env.RATE_LIMIT_DELAY_MS) || 1000,
  },
  RETRY_CONFIG: {
    MAX_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    DELAY_BETWEEN_RETRIES: 2000,
  },
};

// Validate required configuration
const validateConfig = () => {
  console.log("INSTANTLY_CONFIG >>>", INSTANTLY_CONFIG);
  if (!INSTANTLY_CONFIG.API_KEY) {
    throw new Error("INSTANTLY_API_KEY is required in environment variables");
  }

  if (!INSTANTLY_CONFIG.BASE_URL) {
    throw new Error(
      "INSTANTLY_API_BASE_URL is required in environment variables"
    );
  }

  return true;
};

// Get API headers
const getHeaders = () => {
  return {
    Authorization: `Bearer ${INSTANTLY_CONFIG.API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Instantly-API-Integration/1.0.0",
  };
};

module.exports = {
  INSTANTLY_CONFIG,
  validateConfig,
  getHeaders,
};

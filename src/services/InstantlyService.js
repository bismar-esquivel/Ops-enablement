const axios = require("axios");
const {
  INSTANTLY_CONFIG,
  validateConfig,
  getHeaders,
} = require("../config/instantly");
const Campaign = require("../models/Campaign");

class InstantlyService {
  constructor() {
    validateConfig();
    this.api = axios.create({
      baseURL: INSTANTLY_CONFIG.BASE_URL,
      headers: getHeaders(),
      timeout: 30000,
    });

    // Add request interceptor for rate limiting
    this.api.interceptors.request.use(async (config) => {
      await this.delay(INSTANTLY_CONFIG.RATE_LIMITS.DELAY_BETWEEN_REQUESTS);
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          console.log("Rate limit exceeded, waiting before retry...");
          await this.delay(5000);
          return this.api.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  // Utility method for delays
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Retry mechanism for failed requests
  async retryRequest(
    requestFn,
    maxAttempts = INSTANTLY_CONFIG.RETRY_CONFIG.MAX_ATTEMPTS
  ) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed:`, error.message);

        if (attempt < maxAttempts) {
          const delay =
            INSTANTLY_CONFIG.RETRY_CONFIG.DELAY_BETWEEN_RETRIES * attempt;
          console.log(`Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  // Get all campaigns with pagination support
  async getAllCampaigns(page = 1, limit = 100) {
    try {
      console.log(`Fetching campaigns page ${page} with limit ${limit}`);

      const response = await this.retryRequest(() =>
        this.api.get(INSTANTLY_CONFIG.ENDPOINTS.CAMPAIGNS, {
          params: {
            page,
            limit,
            sort: "created_at",
            order: "desc",
          },
        })
      );

      // Handle different possible response structures
      let campaigns = [];
      let pagination = {};

      if (response.data) {
        // Check if campaigns are nested in data.data
        if (Array.isArray(response.data.data)) {
          campaigns = response.data.data;
          pagination = response.data.pagination || {};
        }
        // Check if campaigns are directly in data
        else if (Array.isArray(response.data)) {
          campaigns = response.data;
        }
        // Check if campaigns are in a different property
        else if (
          response.data.campaigns &&
          Array.isArray(response.data.campaigns)
        ) {
          campaigns = response.data.campaigns;
          pagination = response.data.pagination || {};
        }
        // Check if campaigns are in results property
        else if (
          response.data.results &&
          Array.isArray(response.data.results)
        ) {
          campaigns = response.data.results;
          pagination = response.data.pagination || {};
        }
        // If none of the above, log the structure for debugging
        else {
          console.warn("Unexpected API response structure:", {
            hasData: !!response.data,
            dataType: typeof response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            isArray: Array.isArray(response.data),
            sampleData: response.data
              ? JSON.stringify(response.data).substring(0, 200) + "..."
              : "null",
          });

          // Try to extract campaigns from any array property
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              campaigns = response.data[key];
              console.log(`Found campaigns in property: ${key}`);
              break;
            }
          }
        }
      }

      // Ensure campaigns is always an array
      if (!Array.isArray(campaigns)) {
        campaigns = [];
        console.warn("No campaigns array found in response, using empty array");
      }

      console.log(`Retrieved ${campaigns.length} campaigns from API response`);

      return {
        campaigns,
        pagination,
        hasMore: pagination.next_page ? true : false,
      };
    } catch (error) {
      console.error("Error fetching campaigns:", error.message);
      throw error;
    }
  }

  // Get campaign details by ID
  async getCampaignDetails(campaignId) {
    try {
      console.log(`Fetching details for campaign ${campaignId}`);

      const endpoint = INSTANTLY_CONFIG.ENDPOINTS.CAMPAIGN_DETAILS.replace(
        "{id}",
        campaignId
      );
      const response = await this.retryRequest(() => this.api.get(endpoint));

      console.log(`Retrieved details for campaign ${campaignId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching campaign ${campaignId} details:`,
        error.message
      );
      throw error;
    }
  }

  // Get campaign metrics by ID
  async getCampaignMetrics(campaignId) {
    try {
      console.log(`Fetching metrics for campaign ${campaignId}`);

      const endpoint = INSTANTLY_CONFIG.ENDPOINTS.CAMPAIGN_METRICS.replace(
        "{id}",
        campaignId
      );
      const response = await this.retryRequest(() => this.api.get(endpoint));

      console.log(`Retrieved metrics for campaign ${campaignId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching campaign ${campaignId} metrics:`,
        error.message
      );
      throw error;
    }
  }

  // Get campaign subscribers by ID
  async getCampaignSubscribers(campaignId, page = 1, limit = 100) {
    try {
      console.log(`Fetching subscribers for campaign ${campaignId}`);

      const endpoint = INSTANTLY_CONFIG.ENDPOINTS.CAMPAIGN_SUBSCRIBERS.replace(
        "{id}",
        campaignId
      );
      const response = await this.retryRequest(() =>
        this.api.get(endpoint, {
          params: { page, limit },
        })
      );

      console.log(`Retrieved subscribers for campaign ${campaignId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching campaign ${campaignId} subscribers:`,
        error.message
      );
      throw error;
    }
  }

  // Sync all campaigns to Firestore
  async syncAllCampaigns() {
    try {
      console.log("Starting full campaign synchronization...");
      let page = 1;
      let totalSynced = 0;
      let hasMore = true;

      while (hasMore) {
        console.log(`Processing page ${page}...`);

        let result;
        try {
          result = await this.getAllCampaigns(page, 100);
          console.log(
            "result >>>",
            result.campaigns[0],
            result.campaigns.length
          );
          console.log(`Page ${page} result:`, {
            hasCampaigns: !!result.campaigns,
            campaignsType: typeof result.campaigns,
            isArray: Array.isArray(result.campaigns),
            campaignsLength: result.campaigns
              ? result.campaigns.length
              : "undefined",
            hasMore: result.hasMore,
            pagination: result.pagination,
          });
        } catch (pageError) {
          console.error(`Error fetching page ${page}:`, pageError.message);
          throw new Error(`Failed to fetch page ${page}: ${pageError.message}`);
        }

        const campaigns = result.campaigns;

        // Validate that we have campaigns to process
        if (!campaigns || !Array.isArray(campaigns)) {
          console.error("Invalid campaigns data received:", {
            campaigns: campaigns,
            result: result,
            page: page,
          });
          throw new Error(
            `Invalid campaigns data received from API on page ${page}`
          );
        }

        if (campaigns.length === 0) {
          console.log("No more campaigns to process");
          break;
        }

        // Process each campaign
        for (const campaignData of campaigns) {
          try {
            // Get additional details if available
            let fullCampaignData = campaignData;

            try {
              // const details = await this.getCampaignDetails(campaignData.id);
              // const metrics = await this.getCampaignMetrics(campaignData.id);
              // fullCampaignData = {
              //   ...campaignData,
              //   ...details,
              //   metrics: metrics.metrics || campaignData.metrics,
              // };
            } catch (detailError) {
              console.warn(
                `Could not fetch full details for campaign ${campaignData.id}:`,
                detailError.message
              );
            }

            // Create and save campaign
            const campaign = new Campaign(fullCampaignData);
            // await campaign.save();
            totalSynced++;

            console.log(`Synced campaign: ${campaign.name} (${campaign.id})`);
          } catch (campaignError) {
            console.error(
              `Error syncing campaign ${campaignData.id}:`,
              campaignError.message
            );
          }
        }

        hasMore = result.hasMore;
        page++;

        // Add delay between pages to respect rate limits
        if (hasMore) {
          await this.delay(2000);
        }
      }

      console.log(
        `Campaign synchronization completed. Total synced: ${totalSynced}`
      );
      return { totalSynced, success: true };
    } catch (error) {
      console.error("Error during campaign synchronization:", error.message);
      throw error;
    }
  }

  // Sync specific campaign by ID
  async syncCampaignById(campaignId) {
    try {
      console.log(`Syncing campaign ${campaignId}...`);

      const campaignData = await this.getCampaignDetails(campaignId);
      const metrics = await this.getCampaignMetrics(campaignId);

      const fullCampaignData = {
        ...campaignData,
        metrics: metrics.metrics || campaignData.metrics,
      };

      const campaign = new Campaign(fullCampaignData);
      await campaign.save();

      console.log(`Campaign ${campaignId} synced successfully`);
      return campaign;
    } catch (error) {
      console.error(`Error syncing campaign ${campaignId}:`, error.message);
      throw error;
    }
  }

  // Test API connection
  async testConnection() {
    try {
      console.log("Testing Instantly API connection...");

      // Test basic connection first
      const response = await this.api.get("/");
      console.log("Basic API connection successful");

      // Test campaigns endpoint to see response structure
      try {
        const campaignsResponse = await this.api.get(
          INSTANTLY_CONFIG.ENDPOINTS.CAMPAIGNS,
          {
            params: { page: 1, limit: 1 },
          }
        );

        console.log("Campaigns endpoint test successful");

        // Log the response structure for debugging
        const structure = {
          hasData: !!campaignsResponse.data,
          dataType: typeof campaignsResponse.data,
          dataKeys: campaignsResponse.data
            ? Object.keys(campaignsResponse.data)
            : [],
          isArray: Array.isArray(campaignsResponse.data),
          sampleData: campaignsResponse.data
            ? JSON.stringify(campaignsResponse.data).substring(0, 500) + "..."
            : "null",
        };

        console.log("Campaigns API Response Structure:", structure);

        return {
          success: true,
          status: response.status,
          message: "Connection successful",
          campaignsEndpoint: {
            success: true,
            structure: structure,
            sampleData: campaignsResponse.data,
          },
        };
      } catch (campaignsError) {
        console.warn("Campaigns endpoint test failed:", campaignsError.message);
        return {
          success: true,
          status: response.status,
          message: "Basic connection successful, but campaigns endpoint failed",
          campaignsEndpoint: {
            success: false,
            error: campaignsError.message,
          },
        };
      }
    } catch (error) {
      console.error("API connection test failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Debug method to inspect API response structure
  async debugApiResponse(endpoint, params = {}) {
    try {
      console.log(`Debugging API response for endpoint: ${endpoint}`);
      console.log(`Parameters:`, params);

      const response = await this.api.get(endpoint, { params });

      const debugInfo = {
        endpoint,
        params,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        isArray: Array.isArray(response.data),
        dataSize: response.data ? JSON.stringify(response.data).length : 0,
        sampleData: response.data
          ? JSON.stringify(response.data).substring(0, 1000) + "..."
          : "null",
      };

      console.log("API Response Debug Info:", debugInfo);

      return {
        success: true,
        debugInfo,
        data: response.data,
      };
    } catch (error) {
      console.error(`Debug API call failed for ${endpoint}:`, error.message);
      return {
        success: false,
        error: error.message,
        endpoint,
        params,
      };
    }
  }

  // Test campaigns endpoint specifically
  async testCampaignsEndpoint() {
    try {
      console.log("Testing campaigns endpoint specifically...");

      const response = await this.api.get(
        INSTANTLY_CONFIG.ENDPOINTS.CAMPAIGNS,
        {
          params: { page: 1, limit: 1 },
        }
      );

      console.log("Campaigns endpoint response received");

      const analysis = {
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        isArray: Array.isArray(response.data),
        nestedData: {
          hasDataData: response.data && !!response.data.data,
          dataDataType:
            response.data && response.data.data
              ? typeof response.data.data
              : "undefined",
          dataDataIsArray:
            response.data && response.data.data
              ? Array.isArray(response.data.data)
              : false,
          dataDataLength:
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data)
              ? response.data.data.length
              : "N/A",
        },
        campaignsProperty: {
          exists: response.data && !!response.data.campaigns,
          type:
            response.data && response.data.data
              ? typeof response.data.campaigns
              : "undefined",
          isArray:
            response.data && response.data.campaigns
              ? Array.isArray(response.data.campaigns)
              : false,
          length:
            response.data &&
            response.data.campaigns &&
            Array.isArray(response.data.campaigns)
              ? response.data.campaigns.length
              : "N/A",
        },
        resultsProperty: {
          exists: response.data && !!response.data.results,
          type:
            response.data && response.data.results
              ? typeof response.data.results
              : "undefined",
          isArray:
            response.data && response.data.results
              ? Array.isArray(response.data.results)
              : false,
          length:
            response.data &&
            response.data.results &&
            Array.isArray(response.data.results)
              ? response.data.results.length
              : "N/A",
        },
      };

      console.log("Campaigns endpoint analysis:", analysis);

      return {
        success: true,
        analysis,
        sampleData: response.data
          ? JSON.stringify(response.data).substring(0, 800) + "..."
          : "null",
      };
    } catch (error) {
      console.error("Error testing campaigns endpoint:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = InstantlyService;

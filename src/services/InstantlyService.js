const axios = require("axios");
const {
  INSTANTLY_CONFIG,
  validateConfig,
  getHeaders,
} = require("../config/instantly");
const Campaign = require("../models/Campaign");
const admin = require("../config/firebase");

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

      console.log(
        `Retrieved details for campaign ${campaignId} ---- ${response.data}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching campaign ${campaignId} details:`,
        error.message
      );
      throw error;
    }
  }

  // Get campaign contacts by ID (alternative endpoint)
  async getCampaignContacts(campaignId, page = 1, limit = 100) {
    try {
      console.log(`Fetching contacts for campaign ${campaignId}`);

      const endpoint = INSTANTLY_CONFIG.ENDPOINTS.CAMPAIGN_CONTACTS.replace(
        "{id}",
        campaignId
      );
      const response = await this.retryRequest(() =>
        this.api.get(endpoint, {
          params: { page, limit },
        })
      );

      console.log(`Retrieved contacts for campaign ${campaignId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching campaign ${campaignId} contacts:`,
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

        console.log("campaigns >>>", campaigns.length);
        console.log("campaigns >>>", campaigns[0]);

        // Process each campaign
        const campaignsBatch = admin.firestore().batch();
        for (const campaignData of campaigns) {
          try {
            // Get additional details if available
            let fullCampaignData = campaignData;

            const CAMPAIGN_STATUS = {
              1: "Active",
              2: "Paused",
              3: "Completed",
              4: "Running Subsequences",
              "-99": "Account Suspended",
              "-1": "Accounts Unhealthy",
              "-2": "Bounce Protect",
            };

            try {
              // const details = await this.getCampaignDetails(campaignData.id);
              // fullCampaignData = {
              //   ...campaignData,
              //   ...details,
              // };
            } catch (detailError) {
              console.warn(
                `Could not fetch full details for campaign ${campaignData.id}:`,
                detailError.message
              );
            }

            // Create and save campaign
            const campaign = new Campaign(fullCampaignData);
            campaigns_batch.set(
              admin.firestore().collection("campaigns").doc(campaign.id),
              {
                ...campaign,
                status: CAMPAIGN_STATUS[campaignData.status],
              }
            );
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
        await campaignsBatch.commit();

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
}

module.exports = InstantlyService;

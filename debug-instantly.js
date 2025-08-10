const axios = require("axios");
require("dotenv").config();

// Debug script for Instantly API integration
async function debugInstantlyAPI() {
  try {
    console.log("🔍 Debugging Instantly API Integration...");

    const apiKey = process.env.INSTANTLY_API_KEY;
    const baseUrl =
      process.env.INSTANTLY_API_BASE_URL || "https://api.instantly.ai/api/v2";

    if (!apiKey) {
      console.error("❌ INSTANTLY_API_KEY not found in environment variables");
      console.log("💡 Make sure you have a .env file with your API key");
      return;
    }

    console.log(`📍 Base URL: ${baseUrl}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

    // Test 1: Basic connection
    console.log("\n📡 Test 1: Basic connection test");
    try {
      const basicResponse = await axios.get(baseUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      console.log("✅ Basic connection successful");
      console.log(`Status: ${basicResponse.status}`);
    } catch (error) {
      console.log("❌ Basic connection failed:", error.message);
    }

    // Test 2: Campaigns endpoint
    console.log("\n📡 Test 2: Campaigns endpoint test");
    try {
      const campaignsUrl = `${baseUrl}/campaigns`;
      console.log(`Testing: ${campaignsUrl}`);

      const campaignsResponse = await axios.get(campaignsUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          page: 1,
          limit: 5,
        },
      });

      console.log("✅ Campaigns endpoint successful");
      console.log(`Status: ${campaignsResponse.status}`);

      // Analyze response structure
      console.log("\n📊 Response Structure Analysis:");
      const data = campaignsResponse.data;

      console.log(`Has data: ${!!data}`);
      console.log(`Data type: ${typeof data}`);
      console.log(`Data keys: ${data ? Object.keys(data).join(", ") : "none"}`);
      console.log(`Is array: ${Array.isArray(data)}`);

      if (data) {
        // Check for nested data
        if (data.data) {
          console.log(`\n🔍 data.data property:`);
          console.log(`  - Exists: ${!!data.data}`);
          console.log(`  - Type: ${typeof data.data}`);
          console.log(`  - Is array: ${Array.isArray(data.data)}`);
          if (Array.isArray(data.data)) {
            console.log(`  - Length: ${data.data.length}`);
            if (data.data.length > 0) {
              console.log(
                `  - First item keys: ${Object.keys(data.data[0]).join(", ")}`
              );
            }
          }
        }

        // Check for campaigns property
        if (data.campaigns) {
          console.log(`\n🔍 data.campaigns property:`);
          console.log(`  - Exists: ${!!data.campaigns}`);
          console.log(`  - Type: ${typeof data.campaigns}`);
          console.log(`  - Is array: ${Array.isArray(data.campaigns)}`);
          if (Array.isArray(data.campaigns)) {
            console.log(`  - Length: ${data.campaigns.length}`);
            if (data.campaigns.length > 0) {
              console.log(
                `  - First item keys: ${Object.keys(data.campaigns[0]).join(
                  ", "
                )}`
              );
            }
          }
        }

        // Check for results property
        if (data.results) {
          console.log(`\n🔍 data.results property:`);
          console.log(`  - Exists: ${!!data.results}`);
          console.log(`  - Type: ${typeof data.results}`);
          console.log(`  - Is array: ${Array.isArray(data.results)}`);
          if (Array.isArray(data.results)) {
            console.log(`  - Length: ${data.results.length}`);
            if (data.results.length > 0) {
              console.log(
                `  - First item keys: ${Object.keys(data.results[0]).join(
                  ", "
                )}`
              );
            }
          }
        }

        // Check for pagination
        if (data.pagination) {
          console.log(`\n🔍 data.pagination property:`);
          console.log(`  - Exists: ${!!data.pagination}`);
          console.log(`  - Keys: ${Object.keys(data.pagination).join(", ")}`);
        }

        console.log("\n📄 Sample response data (first 800 chars):");
        console.log(JSON.stringify(data, null, 2).substring(0, 800) + "...");
      }
    } catch (error) {
      console.log("❌ Campaigns endpoint failed:", error.message);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Response:`, error.response.data);
      }
    }

    // Test 3: Try different endpoints
    console.log("\n📡 Test 3: Alternative endpoints test");
    const alternativeEndpoints = [
      "/campaigns",
      "/campaign",
      "/email-campaigns",
      "/email-campaign",
    ];

    for (const endpoint of alternativeEndpoints) {
      try {
        const url = `${baseUrl}${endpoint}`;
        console.log(`Testing: ${url}`);

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          params: { page: 1, limit: 1 },
        });

        console.log(`✅ ${endpoint} successful (${response.status})`);
        const data = response.data;
        console.log(`  - Has data: ${!!data}`);
        console.log(
          `  - Data keys: ${data ? Object.keys(data).join(", ") : "none"}`
        );
      } catch (error) {
        console.log(`❌ ${endpoint} failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("\n💥 Unexpected error:", error.message);
  }
}

// Run the debug
debugInstantlyAPI();

const axios = require('axios');
require('dotenv').config();

// Simple test script to debug Instantly API response structure
async function testInstantlyAPI() {
  try {
    console.log('🔍 Testing Instantly API response structure...');
    
    const apiKey = process.env.INSTANTLY_API_KEY;
    const baseUrl = process.env.INSTANTLY_API_BASE_URL || 'https://api.instantly.ai/api/v2';
    
    if (!apiKey) {
      console.error('❌ INSTANTLY_API_KEY not found in environment variables');
      return;
    }
    
    console.log(`📍 Base URL: ${baseUrl}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
    
    // Test campaigns endpoint
    const campaignsUrl = `${baseUrl}/campaigns`;
    console.log(`\n📡 Testing endpoint: ${campaignsUrl}`);
    
    const response = await axios.get(campaignsUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: 1,
        limit: 5
      }
    });
    
    console.log('\n✅ API Response received:');
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    console.log('\n📊 Response Structure Analysis:');
    console.log(`Has data: ${!!response.data}`);
    console.log(`Data type: ${typeof response.data}`);
    console.log(`Data keys: ${response.data ? Object.keys(response.data).join(', ') : 'none'}`);
    console.log(`Is array: ${Array.isArray(response.data)}`);
    
    if (response.data) {
      console.log('\n🔍 Detailed structure:');
      
      // Check for nested data
      if (response.data.data) {
        console.log(`- data.data exists: ${!!response.data.data}`);
        console.log(`- data.data type: ${typeof response.data.data}`);
        console.log(`- data.data is array: ${Array.isArray(response.data.data)}`);
        if (Array.isArray(response.data.data)) {
          console.log(`- data.data length: ${response.data.data.length}`);
        }
      }
      
      // Check for campaigns property
      if (response.data.campaigns) {
        console.log(`- data.campaigns exists: ${!!response.data.campaigns}`);
        console.log(`- data.campaigns type: ${typeof response.data.campaigns}`);
        console.log(`- data.campaigns is array: ${Array.isArray(response.data.campaigns)}`);
        if (Array.isArray(response.data.campaigns)) {
          console.log(`- data.campaigns length: ${response.data.campaigns.length}`);
        }
      }
      
      // Check for results property
      if (response.data.results) {
        console.log(`- data.results exists: ${!!response.data.results}`);
        console.log(`- data.results type: ${typeof response.data.results}`);
        console.log(`- data.results is array: ${Array.isArray(response.data.results)}`);
        if (Array.isArray(response.data.results)) {
          console.log(`- data.results length: ${response.data.results.length}`);
        }
      }
      
      // Check for pagination
      if (response.data.pagination) {
        console.log(`- data.pagination exists: ${!!response.data.pagination}`);
        console.log(`- pagination keys: ${Object.keys(response.data.pagination).join(', ')}`);
      }
      
      console.log('\n📄 Sample data (first 500 chars):');
      console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('\n❌ Error testing API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`Response Data:`, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testInstantlyAPI();

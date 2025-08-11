const { INSTANTLY_CONFIG } = require("../config/instantly");
const admin = require("../config/firebase");
const {
  CAMPAIGN_STATUS,
  LEAD_STATUS,
  LEAD_INTEREST_STATUS,
  LEAD_VERIFICATION_STATUS,
  LEAD_ENRICHMENT_STATUS,
  LEAD_ESP_CODE,
  dbCollection,
} = require("../functions/constants");

async function loadCampaigns({ campaigns = [], starting_after = "" }) {
  console.log("LOAD CAMPAIGNS >>>", starting_after);
  const query = new URLSearchParams({
    limit: "100",
    starting_after: starting_after,
  }).toString();

  const resp = await fetch(
    `https://api.instantly.ai/api/v2/campaigns?${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${INSTANTLY_CONFIG.API_KEY}`,
      },
    }
  );

  const data = await resp.json();
  const { items, next_starting_after } = data;
  console.log("items >>>", items.length, " ----- ", next_starting_after);
  const item = items[0];
  console.log("item >>>", item);
  const newCampaigns = [...campaigns, ...items];
  console.log("newCampaigns >>>", newCampaigns.length);
  if (next_starting_after) {
    loadCampaigns({
      campaigns: newCampaigns,
      starting_after: next_starting_after,
    });
  }
  return newCampaigns;
}
module.exports.loadCampaigns = loadCampaigns;

async function saveCampaigns({ campaigns = [] }) {
  const campaignsToSave = campaigns.map((campaign) => {
    return {
      ...campaign,
      status: CAMPAIGN_STATUS[campaign.status],
    };
  });
  const db = admin.firestore();
  const batch = db.batch();
  campaignsToSave.forEach((campaign) => {
    const campaignRef = db.collection(dbCollection.campaigns).doc(campaign.id);
    batch.set(campaignRef, campaign);
  });
  await batch.commit();
}
module.exports.saveCampaigns = saveCampaigns;

async function loadLeads({ leads = [], starting_after = "" }) {
  const resp = await fetch(`https://api.instantly.ai/api/v2/leads/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INSTANTLY_CONFIG.API_KEY}`,
    },
    body: JSON.stringify({
      limit: 100,
      starting_after: starting_after,
    }),
  });

  const data = await resp.json();
  const { items, next_starting_after } = data;
  console.log("items >>>", items.length, " ----- ", next_starting_after);
  const newLeads = [...leads, ...items];
  console.log("newLeads >>>", newLeads.length);
  if (next_starting_after) {
    return loadLeads({
      leads: newLeads,
      starting_after: next_starting_after,
    });
  }
  return newLeads;
}
module.exports.loadLeads = loadLeads;

async function saveLeads({ leads = [] }) {
  const leadsToSave = leads.map((lead) => {
    return {
      ...lead,
      status: LEAD_STATUS[lead.status] || "",
      lt_interest_status: LEAD_INTEREST_STATUS[lead.lt_interest_status] || "",
      verification_status:
        LEAD_VERIFICATION_STATUS[lead.verification_status] || "",
      enrichment_status: LEAD_ENRICHMENT_STATUS[lead.enrichment_status] || "",
      esp_code: LEAD_ESP_CODE[lead.esp_code] || "",
    };
  });
  console.log("total leads >>>", leadsToSave.length);
  console.log("leads >>>", leadsToSave[0]);
  // create an array of 500 leads
  const leadsBatchesOf500 = leadsToSave.reduce((acc, lead, index) => {
    const batchIndex = Math.floor(index / 500);
    if (!acc[batchIndex]) {
      acc[batchIndex] = [];
    }
    acc[batchIndex].push(lead);
    return acc;
  }, []);
  console.log("leadsBatchesOf500 >>>", leadsBatchesOf500.length);
  for (const batch of leadsBatchesOf500) {
    const leadsBatch = admin.firestore().batch();
    batch.forEach((lead) => {
      const leadRef = admin
        .firestore()
        .collection(dbCollection.leads)
        .doc(lead.id);
      leadsBatch.set(leadRef, lead);
    });
    await leadsBatch.commit();
  }
  console.log("leads saved to firestore");
}
module.exports.saveLeads = saveLeads;

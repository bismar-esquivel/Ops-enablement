const dbCollection = {
  leads: "leads",
  campaigns: "campaigns",
};
module.exports.dbCollection = dbCollection;

const CAMPAIGN_STATUS = {
  1: "Active",
  2: "Paused",
  3: "Completed",
  4: "Running Subsequences",
  "-99": "Account Suspended",
  "-1": "Accounts Unhealthy",
  "-2": "Bounce Protect",
};
module.exports.CAMPAIGN_STATUS = CAMPAIGN_STATUS;

const LEAD_STATUS = {
  1: "Active",
  2: "Paused",
  3: "Completed",
  "-1": "Bounced",
  "-2": "Unsubscribed",
  "-3": "Skipped",
};
module.exports.LEAD_STATUS = LEAD_STATUS;

const LEAD_INTEREST_STATUS = {
  0: "Out of Office",
  1: "Interested",
  2: "Meeting Booked",
  3: "Meeting Completed",
  4: "Closed",
  "-1": "Not Interested",
  "-2": "Wrong Person",
  "-3": "Lost",
};
module.exports.LEAD_INTEREST_STATUS = LEAD_INTEREST_STATUS;

const LEAD_VERIFICATION_STATUS = {
  1: "Verified",
  11: "Pending",
  12: "Pending Verification Job",
  "-1": "Invalid",
  "-2": "Risky",
  "-3": "Catch All",
  "-4": "Job Change",
};
module.exports.LEAD_VERIFICATION_STATUS = LEAD_VERIFICATION_STATUS;

const LEAD_ENRICHMENT_STATUS = {
  1: "Enriched",
  11: "Pending",
  "-1": "Enrichment data not available",
  "-2": "Error",
};
module.exports.LEAD_ENRICHMENT_STATUS = LEAD_ENRICHMENT_STATUS;

const LEAD_UPLOAD_METHOD = {
  1: "Manual",
  2: "API",
  3: "Webhook",
};
module.exports.LEAD_UPLOAD_METHOD = LEAD_UPLOAD_METHOD;

const LEAD_ESP_CODE = {
  0: "In Queue",
  1: "Google",
  2: "Microsoft",
  3: "Zoho",
  9: "Yahoo",
  10: "Yandex",
  12: "Web.de",
  13: "Libero.it",
  999: "Other",
  1000: "Not Found",
};
module.exports.LEAD_ESP_CODE = LEAD_ESP_CODE;

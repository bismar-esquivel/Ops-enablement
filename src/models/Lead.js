const { getFirestore } = require("../config/firebase");

class Lead {
  constructor(data) {
    this.id = data.id || data.email || `lead_${Date.now()}`;
    this.campaignId = data.campaignId || data.campaign_id;
    this.email = data.email;
    this.firstName = data.firstName || data.first_name || data.firstName || "";
    this.lastName = data.lastName || data.last_name || data.lastName || "";
    this.fullName = data.fullName || data.full_name || data.name || "";
    this.phone = data.phone || data.phoneNumber || "";
    this.company = data.company || data.companyName || "";
    this.jobTitle = data.jobTitle || data.job_title || data.title || "";
    this.website = data.website || data.websiteUrl || "";
    this.location = data.location || data.city || data.country || "";

    // Campaign-specific data
    this.status = data.status || data.lead_status || "new";
    this.source = data.source || data.lead_source || "campaign";
    this.score = data.score || data.lead_score || 0;

    // Engagement data
    this.isSubscribed = data.isSubscribed || data.subscribed || true;
    this.subscribedAt = data.subscribedAt || data.subscribed_at || new Date();
    this.unsubscribedAt = data.unsubscribedAt || data.unsubscribed_at || null;

    // Email engagement
    this.emailSent = data.emailSent || data.emails_sent || 0;
    this.emailOpened = data.emailOpened || data.emails_opened || 0;
    this.emailClicked = data.emailClicked || data.emails_clicked || 0;
    this.lastEmailSent = data.lastEmailSent || data.last_email_sent || null;
    this.lastEmailOpened =
      data.lastEmailOpened || data.last_email_opened || null;
    this.lastEmailClicked =
      data.lastEmailClicked || data.last_email_clicked || null;

    // Custom fields
    this.customFields = data.customFields || data.custom_fields || {};
    this.tags = data.tags || [];

    // Timestamps
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
    this.lastSyncedAt = new Date();
  }

  // Save lead to Firestore
  async save() {
    try {
      const db = getFirestore();

      // Create a unique document ID using campaignId and email
      const docId = `${this.campaignId}_${this.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`;

      await db
        .collection("leads")
        .doc(docId)
        .set({
          ...this,
          updatedAt: new Date(),
          lastSyncedAt: new Date(),
        });

      console.log(`Lead saved: ${this.email} for campaign ${this.campaignId}`);
      return this;
    } catch (error) {
      console.error("Error saving lead:", error.message);
      throw error;
    }
  }

  // Find lead by ID
  static async findById(leadId) {
    try {
      const db = getFirestore();
      const doc = await db.collection("leads").doc(leadId).get();

      if (doc.exists) {
        return new Lead(doc.data());
      }
      return null;
    } catch (error) {
      console.error("Error finding lead:", error.message);
      throw error;
    }
  }

  // Find leads by campaign ID
  static async findByCampaignId(campaignId, limit = 100, page = 1) {
    try {
      const db = getFirestore();
      const offset = (page - 1) * limit;

      let query = db
        .collection("leads")
        .where("campaignId", "==", campaignId)
        .orderBy("createdAt", "desc");

      if (page > 1) {
        query = query.offset(offset);
      }

      const snapshot = await query.limit(limit).get();
      const leads = [];

      snapshot.forEach((doc) => {
        leads.push(new Lead(doc.data()));
      });

      return leads;
    } catch (error) {
      console.error("Error finding leads by campaign:", error.message);
      throw error;
    }
  }

  // Find all leads with pagination
  static async findAll(limit = 100, page = 1, filters = {}) {
    try {
      const db = getFirestore();
      const offset = (page - 1) * limit;

      let query = db.collection("leads").orderBy("createdAt", "desc");

      // Apply filters
      if (filters.status) {
        query = query.where("status", "==", filters.status);
      }
      if (filters.campaignId) {
        query = query.where("campaignId", "==", filters.campaignId);
      }
      if (filters.source) {
        query = query.where("source", "==", filters.source);
      }

      if (page > 1) {
        query = query.offset(offset);
      }

      const snapshot = await query.limit(limit).get();
      const leads = [];

      snapshot.forEach((doc) => {
        leads.push(new Lead(doc.data()));
      });

      return leads;
    } catch (error) {
      console.error("Error finding all leads:", error.message);
      throw error;
    }
  }

  // Update lead
  async update(updateData) {
    try {
      const db = getFirestore();
      const docId = `${this.campaignId}_${this.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`;

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      };

      await db.collection("leads").doc(docId).update(updateFields);

      // Update local instance
      Object.assign(this, updateFields);

      console.log(`Lead updated: ${this.email}`);
      return this;
    } catch (error) {
      console.error("Error updating lead:", error.message);
      throw error;
    }
  }

  // Delete lead
  async delete() {
    try {
      const db = getFirestore();
      const docId = `${this.campaignId}_${this.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`;

      await db.collection("leads").doc(docId).delete();

      console.log(`Lead deleted: ${this.email}`);
      return true;
    } catch (error) {
      console.error("Error deleting lead:", error.message);
      throw error;
    }
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      campaignId: this.campaignId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      phone: this.phone,
      company: this.company,
      jobTitle: this.jobTitle,
      website: this.website,
      location: this.location,
      status: this.status,
      source: this.source,
      score: this.score,
      isSubscribed: this.isSubscribed,
      subscribedAt: this.subscribedAt,
      unsubscribedAt: this.unsubscribedAt,
      emailSent: this.emailSent,
      emailOpened: this.emailOpened,
      emailClicked: this.emailClicked,
      lastEmailSent: this.lastEmailSent,
      lastEmailOpened: this.lastEmailOpened,
      lastEmailClicked: this.lastEmailClicked,
      customFields: this.customFields,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  // Get lead statistics
  static async getStats(campaignId = null) {
    try {
      const db = getFirestore();

      let query = db.collection("leads");
      if (campaignId) {
        query = query.where("campaignId", "==", campaignId);
      }

      const snapshot = await query.get();
      const stats = {
        total: 0,
        byStatus: {},
        bySource: {},
        byLocation: {},
        engagement: {
          subscribed: 0,
          unsubscribed: 0,
          opened: 0,
          clicked: 0,
        },
      };

      snapshot.forEach((doc) => {
        const lead = doc.data();
        stats.total++;

        // Count by status
        const status = lead.status || "unknown";
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Count by source
        const source = lead.source || "unknown";
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;

        // Count by location
        const location = lead.location || "unknown";
        stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;

        // Engagement stats
        if (lead.isSubscribed) {
          stats.engagement.subscribed++;
        } else {
          stats.engagement.unsubscribed++;
        }

        if (lead.emailOpened > 0) {
          stats.engagement.opened++;
        }

        if (lead.emailClicked > 0) {
          stats.engagement.clicked++;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error getting lead stats:", error.message);
      throw error;
    }
  }
}

module.exports = Lead;

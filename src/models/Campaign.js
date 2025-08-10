const { getFirestore } = require("../config/firebase");

class Campaign {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || "";
    this.status = data.status || "unknown";
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
    this.scheduledAt = data.scheduled_at || null;
    this.completedAt = data.completed_at || null;
    this.subject = data.subject || "";
    this.fromEmail = data.from_email || "";
    this.fromName = data.from_name || "";
    this.replyTo = data.reply_to || "";
    this.templateId = data.template_id || null;
    this.listId = data.list_id || null;
    this.metrics = data.metrics || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    };
    this.settings = data.settings || {};
    this.tags = data.tags || [];
    this.lastSyncedAt = new Date();
  }

  // Save campaign to Firestore
  async save() {
    try {
      const db = getFirestore();
      const campaignData = this.toFirestore();

      if (this.id) {
        // Update existing campaign
        await db.collection("campaigns").doc(this.id).update(campaignData);
        console.log(`Campaign ${this.id} updated successfully`);
      } else {
        // Create new campaign
        const docRef = await db.collection("campaigns").add(campaignData);
        this.id = docRef.id;
        console.log(`Campaign created with ID: ${this.id}`);
      }

      return this;
    } catch (error) {
      console.error("Error saving campaign:", error);
      throw error;
    }
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      name: this.name,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      scheduledAt: this.scheduledAt,
      completedAt: this.completedAt,
      subject: this.subject,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      replyTo: this.replyTo,
      templateId: this.templateId,
      listId: this.listId,
      metrics: this.metrics,
      settings: this.settings,
      tags: this.tags,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  // Convert from Firestore format
  static fromFirestore(doc) {
    const data = doc.data();
    return new Campaign({
      id: doc.id,
      ...data,
    });
  }

  // Find campaign by ID
  static async findById(id) {
    try {
      const db = getFirestore();
      const doc = await db.collection("campaigns").doc(id).get();

      if (doc.exists) {
        return Campaign.fromFirestore(doc);
      }

      return null;
    } catch (error) {
      console.error("Error finding campaign:", error);
      throw error;
    }
  }

  // Find all campaigns
  static async findAll(limit = 100) {
    try {
      // const db = getFirestore();
      // const snapshot = await db
      //   .collection("campaigns")
      //   .orderBy("createdAt", "desc")
      //   .limit(limit)
      //   .get();

      // return snapshot.docs.map((doc) => Campaign.fromFirestore(doc));
      return [];
    } catch (error) {
      console.error("Error finding campaigns:", error);
      throw error;
    }
  }

  // Find campaigns by status
  static async findByStatus(status, limit = 100) {
    try {
      // const db = getFirestore();
      // const snapshot = await db
      //   .collection("campaigns")
      //   .where("status", "==", status)
      //   .orderBy("createdAt", "desc")
      //   .limit(limit)
      //   .get();

      // return snapshot.docs.map((doc) => Campaign.fromFirestore(doc));
      return [];
    } catch (error) {
      console.error("Error finding campaigns by status:", error);
      throw error;
    }
  }

  // Delete campaign
  //   async delete() {
  //     try {
  //       if (!this.id) {
  //         throw new Error("Cannot delete campaign without ID");
  //       }

  //       const db = getFirestore();
  //       await db.collection("campaigns").doc(this.id).delete();
  //       console.log(`Campaign ${this.id} deleted successfully`);

  //       return true;
  //     } catch (error) {
  //       console.error("Error deleting campaign:", error);
  //       throw error;
  //     }
  //   }
}

module.exports = Campaign;

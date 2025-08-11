const admin = require("firebase-admin");

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
}

module.exports = Campaign;

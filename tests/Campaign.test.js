const Campaign = require("../src/models/Campaign");

// Mock Firebase Admin SDK
jest.mock("../src/config/firebase", () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: false })),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve({ id: "test-id" })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ docs: [] })),
        })),
      })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    })),
  })),
}));

describe("Campaign Model", () => {
  let campaign;

  beforeEach(() => {
    campaign = new Campaign({
      name: "Test Campaign",
      status: "active",
      subject: "Test Subject",
    });
  });

  describe("Constructor", () => {
    test("should create a campaign with default values", () => {
      expect(campaign.name).toBe("Test Campaign");
      expect(campaign.status).toBe("active");
      expect(campaign.subject).toBe("Test Subject");
      expect(campaign.metrics).toEqual({
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
      });
      expect(campaign.lastSyncedAt).toBeInstanceOf(Date);
    });

    test("should handle empty data", () => {
      const emptyCampaign = new Campaign();
      expect(emptyCampaign.name).toBe("");
      expect(emptyCampaign.status).toBe("unknown");
      expect(emptyCampaign.id).toBeNull();
    });
  });

  describe("toFirestore", () => {
    test("should convert campaign to Firestore format", () => {
      const firestoreData = campaign.toFirestore();

      expect(firestoreData).toHaveProperty("name", "Test Campaign");
      expect(firestoreData).toHaveProperty("status", "active");
      expect(firestoreData).toHaveProperty("subject", "Test Subject");
      expect(firestoreData).toHaveProperty("metrics");
      expect(firestoreData).toHaveProperty("lastSyncedAt");
      expect(firestoreData).not.toHaveProperty("id");
    });
  });

  describe("fromFirestore", () => {
    test("should create campaign from Firestore document", () => {
      const mockDoc = {
        id: "test-id",
        data: () => ({
          name: "Test Campaign",
          status: "active",
        }),
      };

      const campaignFromFirestore = Campaign.fromFirestore(mockDoc);

      expect(campaignFromFirestore.id).toBe("test-id");
      expect(campaignFromFirestore.name).toBe("Test Campaign");
      expect(campaignFromFirestore.status).toBe("active");
    });
  });

  describe("Static Methods", () => {
    test("findById should return null for non-existent campaign", async () => {
      const result = await Campaign.findById("non-existent");
      expect(result).toBeNull();
    });

    test("findAll should return empty array", async () => {
      const result = await Campaign.findAll();
      expect(result).toEqual([]);
    });

    test("findByStatus should return empty array", async () => {
      const result = await Campaign.findByStatus("active");
      expect(result).toEqual([]);
    });
  });
});

/**
 * Firebase Cloud Functions para integración con Instantly API v2
 * Funcionalidades:
 * - Sincronización de campañas
 * - Extracción de métricas y detalles
 * - Gestión de rate limiting y autenticación
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const fetch = require("node-fetch");
const admin = require("../config/firebase");

// Importar servicios y modelos
const InstantlyService = require("../services/InstantlyService");
const Campaign = require("../models/Campaign");
const Lead = require("../models/Lead");
const { INSTANTLY_CONFIG } = require("../config/instantly");
const {
  LEAD_STATUS,
  LEAD_INTEREST_STATUS,
  LEAD_VERIFICATION_STATUS,
  LEAD_ENRICHMENT_STATUS,
  LEAD_ESP_CODE,
  dbCollection,
} = require("./constants");

// Configuración global para control de costos
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 540, // 9 minutos máximo
  memory: "512MiB",
});

// ============================================================================
// FUNCIONES HTTP PARA SINCRONIZACIÓN MANUAL
// ============================================================================

/**
 * Sincronizar todas las campañas de Instantly
 * Endpoint: POST /sync-campaigns
 */
exports.syncAllCampaigns = onRequest(
  {
    cors: true,
    maxInstances: 5,
  },

  async (request, response) => {
    console.log("INSTANTLY_CONFIG >>>", INSTANTLY_CONFIG);
    try {
      logger.info("Iniciando sincronización completa de campañas", {
        structuredData: true,
        userId: request.body?.userId || "anonymous",
      });

      const instantlyService = new InstantlyService();
      // const campaigns = await instantlyService.syncAllCampaigns();

      // logger.info("Sincronización completada exitosamente", {
      //   totalSynced: campaigns.totalSynced,
      //   success: campaigns.success,
      // });

      // const leads = await instantlyService.syncAllLeads();

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

      const campaigns = await loadCampaigns({});
      console.log("total campaigns >>>", campaigns.length);

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

      let leads = await loadLeads({});
      leads = leads.map((lead) => {
        return {
          ...lead,
          status: LEAD_STATUS[lead.status] || "",
          lt_interest_status:
            LEAD_INTEREST_STATUS[lead.lt_interest_status] || "",
          verification_status:
            LEAD_VERIFICATION_STATUS[lead.verification_status] || "",
          enrichment_status:
            LEAD_ENRICHMENT_STATUS[lead.enrichment_status] || "",
          esp_code: LEAD_ESP_CODE[lead.esp_code] || "",
        };
      });
      console.log("total leads >>>", leads.length);
      console.log("leads >>>", leads[0]);
      // create an array of 500 leads
      const leadsBatchesOf500 = leads.reduce((acc, lead, index) => {
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

      response.status(200).json({
        success: true,
        message: "Sincronización completada exitosamente",
        // data: campaigns,
      });
    } catch (error) {
      logger.error("Error en sincronización de campañas", {
        error: error.message,
        stack: error.stack,
      });

      response.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }
);

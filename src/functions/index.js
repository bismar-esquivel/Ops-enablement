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
      logger.info("Iniciando sincronización completa de campañas");

      const campaigns = await InstantlyService.loadCampaigns({});
      await InstantlyService.saveCampaigns({ campaigns });

      let leads = await InstantlyService.loadLeads({});
      await InstantlyService.saveLeads({ leads });

      response.status(200).json({
        success: true,
        message: "Sincronización completada exitosamente",
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

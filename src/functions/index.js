const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");

// Importar servicios y modelos
const InstantlyService = require("../services/InstantlyService");
const { INSTANTLY_CONFIG } = require("../config/instantly");
const { logger } = require("../utils/logger");

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

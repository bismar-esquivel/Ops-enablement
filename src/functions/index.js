/**
 * Firebase Cloud Functions para integración con Instantly API v2
 * Funcionalidades:
 * - Sincronización de campañas
 * - Extracción de métricas y detalles
 * - Gestión de rate limiting y autenticación
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

// Importar servicios y modelos
const InstantlyService = require("../services/InstantlyService");
const Campaign = require("../models/Campaign");
const { INSTANTLY_CONFIG } = require("../config/instantly");

// Configuración global para control de costos
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 540, // 9 minutos máximo
  memory: "256MiB",
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
      const result = await instantlyService.syncAllCampaigns();

      logger.info("Sincronización completada exitosamente", {
        totalSynced: result.totalSynced,
        success: result.success,
      });

      response.status(200).json({
        success: true,
        message: "Sincronización completada exitosamente",
        data: result,
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

/**
 * Sincronizar campaña específica por ID
 * Endpoint: POST /sync-campaign/{id}
 */
exports.syncCampaignById = onRequest(
  {
    cors: true,
    maxInstances: 5,
  },
  async (request, response) => {
    try {
      const campaignId = request.params.id || request.body.campaignId;

      if (!campaignId) {
        return response.status(400).json({
          success: false,
          error: "ID de campaña requerido",
        });
      }

      logger.info(`Sincronizando campaña específica: ${campaignId}`, {
        structuredData: true,
        campaignId,
      });

      const instantlyService = new InstantlyService();
      const campaign = await instantlyService.syncCampaignById(campaignId);

      logger.info(`Campaña ${campaignId} sincronizada exitosamente`);

      response.status(200).json({
        success: true,
        message: "Campaña sincronizada exitosamente",
        data: campaign,
      });
    } catch (error) {
      logger.error(`Error sincronizando campaña ${request.params.id}`, {
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

// ============================================================================
// FUNCIONES PARA OBTENER DATOS DE CAMPAÑAS
// ============================================================================

/**
 * Obtener todas las campañas sincronizadas
 * Endpoint: GET /campaigns
 */
exports.getCampaigns = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  console.log("getCampaigns >>>"),
  async (request, response) => {
    try {
      const { limit = 100, status, page = 1 } = request.query;
      console.log("getCampaigns >>>", request.query);
      logger.info("Obteniendo campañas", {
        limit: parseInt(limit),
        status,
        page: parseInt(page),
      });

      let campaigns;

      if (status) {
        campaigns = await Campaign.findByStatus(status, parseInt(limit));
      } else {
        campaigns = await Campaign.findAll(parseInt(limit));
      }
      console.log("campaigns >>>", campaigns);
      // Aplicar paginación básica
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedCampaigns = campaigns.slice(startIndex, endIndex);

      response.status(200).json({
        success: true,
        data: {
          campaigns: paginatedCampaigns,
          pagination: {
            currentPage: parseInt(page),
            totalItems: campaigns.length,
            totalPages: Math.ceil(campaigns.length / parseInt(limit)),
            hasNextPage: endIndex < campaigns.length,
            hasPrevPage: parseInt(page) > 1,
          },
        },
      });
    } catch (error) {
      logger.error("Error obteniendo campañas", {
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

/**
 * Obtener campaña específica por ID
 * Endpoint: GET /campaigns/{id}
 */
exports.getCampaignById = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request, response) => {
    try {
      const campaignId = request.params.id;

      if (!campaignId) {
        return response.status(400).json({
          success: false,
          error: "ID de campaña requerido",
        });
      }

      logger.info(`Obteniendo campaña: ${campaignId}`);

      const campaign = await Campaign.findById(campaignId);

      if (!campaign) {
        return response.status(404).json({
          success: false,
          error: "Campaña no encontrada",
        });
      }

      response.status(200).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      logger.error(`Error obteniendo campaña ${request.params.id}`, {
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

/**
 * Obtener métricas de campaña desde Instantly API
 * Endpoint: GET /campaigns/{id}/metrics
 */
exports.getCampaignMetrics = onRequest(
  {
    cors: true,
    maxInstances: 5,
  },
  async (request, response) => {
    try {
      const campaignId = request.params.id;

      if (!campaignId) {
        return response.status(400).json({
          success: false,
          error: "ID de campaña requerido",
        });
      }

      logger.info(`Obteniendo métricas de campaña: ${campaignId}`);

      const instantlyService = new InstantlyService();
      const metrics = await instantlyService.getCampaignMetrics(campaignId);

      response.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error(
        `Error obteniendo métricas de campaña ${request.params.id}`,
        {
          error: error.message,
          stack: error.stack,
        }
      );

      response.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }
);

// ============================================================================
// FUNCIONES DE MANTENIMIENTO Y MONITOREO
// ============================================================================

/**
 * Probar conexión con Instantly API
 * Endpoint: GET /test-connection
 */
exports.testConnection = onRequest(
  {
    cors: true,
    maxInstances: 3,
  },
  async (request, response) => {
    try {
      logger.info("Probando conexión con Instantly API");

      const instantlyService = new InstantlyService();
      const result = await instantlyService.testConnection();

      if (result.success) {
        response.status(200).json({
          success: true,
          message: "Conexión exitosa con Instantly API",
          data: result,
        });
      } else {
        response.status(503).json({
          success: false,
          error: "Error de conexión con Instantly API",
          data: result,
        });
      }
    } catch (error) {
      logger.error("Error probando conexión con Instantly API", {
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

/**
 * Debug API response structure
 * Endpoint: POST /debug-api-response
 */
exports.debugApiResponse = onRequest(
  {
    cors: true,
    maxInstances: 2,
  },
  async (request, response) => {
    try {
      const { endpoint, params } = request.body || {};

      if (!endpoint) {
        return response.status(400).json({
          success: false,
          error: "Endpoint parameter is required",
        });
      }

      logger.info("Debugging API response structure", {
        structuredData: true,
        endpoint,
        params,
        userId: request.body?.userId || "anonymous",
      });

      const instantlyService = new InstantlyService();
      const result = await instantlyService.debugApiResponse(endpoint, params);

      logger.info("API debug completed", {
        success: result.success,
        endpoint,
      });

      response.status(200).json(result);
    } catch (error) {
      logger.error("Error debugging API response", {
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

/**
 * Test campaigns endpoint specifically
 * Endpoint: GET /test-campaigns-endpoint
 */
exports.testCampaignsEndpoint = onRequest(
  {
    cors: true,
    maxInstances: 2,
  },
  async (request, response) => {
    try {
      logger.info("Testing campaigns endpoint specifically", {
        structuredData: true,
        userId: request.body?.userId || "anonymous",
      });

      const instantlyService = new InstantlyService();
      const result = await instantlyService.testCampaignsEndpoint();

      logger.info("Campaigns endpoint test completed", {
        success: result.success,
      });

      response.status(200).json(result);
    } catch (error) {
      logger.error("Error testing campaigns endpoint", {
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

/**
 * Obtener estadísticas de sincronización
 * Endpoint: GET /sync-stats
 */
exports.getSyncStats = onRequest(
  {
    cors: true,
    maxInstances: 5,
  },
  async (request, response) => {
    try {
      logger.info("Obteniendo estadísticas de sincronización");

      // Obtener estadísticas básicas de Firestore
      const totalCampaigns = await Campaign.findAll(10000); // Obtener todas para contar

      const stats = {
        totalCampaigns: totalCampaigns.length,
        campaignsByStatus: {},
        lastSyncInfo: {},
        syncHealth: "healthy",
      };

      // Agrupar por estado
      totalCampaigns.forEach((campaign) => {
        const status = campaign.status || "unknown";
        stats.campaignsByStatus[status] =
          (stats.campaignsByStatus[status] || 0) + 1;
      });

      // Obtener información de última sincronización
      if (totalCampaigns.length > 0) {
        const lastSynced = totalCampaigns.reduce((latest, current) => {
          return current.lastSyncedAt > latest.lastSyncedAt ? current : latest;
        });

        stats.lastSyncInfo = {
          lastCampaignId: lastSynced.id,
          lastCampaignName: lastSynced.name,
          lastSyncTime: lastSynced.lastSyncedAt,
        };
      }

      response.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error obteniendo estadísticas de sincronización", {
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

// ============================================================================
// FUNCIONES PROGRAMADAS (SCHEDULED)
// ============================================================================

/**
 * Sincronización automática diaria de campañas
 * Se ejecuta todos los días a las 2:00 AM
 */
exports.scheduledCampaignSync = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "America/Mexico_City",
    maxInstances: 1,
  },
  async (event) => {
    try {
      logger.info("Iniciando sincronización programada de campañas", {
        structuredData: true,
        scheduledTime: new Date().toISOString(),
      });

      const instantlyService = new InstantlyService();
      const result = await instantlyService.syncAllCampaigns();

      logger.info("Sincronización programada completada", {
        totalSynced: result.totalSynced,
        success: result.success,
        completedAt: new Date().toISOString(),
      });

      return { success: true, totalSynced: result.totalSynced };
    } catch (error) {
      logger.error("Error en sincronización programada", {
        error: error.message,
        stack: error.stack,
        scheduledTime: new Date().toISOString(),
      });

      throw error;
    }
  }
);

/**
 * Limpieza de datos antiguos (opcional)
 * Se ejecuta semanalmente los domingos a las 3:00 AM
 */
// exports.cleanupOldData = onSchedule(
//   {
//     schedule: "0 3 * * 0",
//     timeZone: "America/Mexico_City",
//     maxInstances: 1,
//   },
//   async (event) => {
//     try {
//       logger.info("Iniciando limpieza de datos antiguos", {
//         structuredData: true,
//         scheduledTime: new Date().toISOString(),
//       });

//       // Aquí puedes implementar lógica para limpiar datos antiguos
//       // Por ejemplo, eliminar campañas con más de X meses de antigüedad

//       logger.info("Limpieza de datos completada");

//       return { success: true, message: "Limpieza completada" };
//     } catch (error) {
//       logger.error("Error en limpieza de datos", {
//         error: error.message,
//         stack: error.stack,
//         scheduledTime: new Date().toISOString(),
//       });

//       throw error;
//     }
//   }
// );

// ============================================================================
// FUNCIONES CALLABLE (PARA CLIENTES AUTENTICADOS)
// ============================================================================

/**
 * Función callable para sincronización con autenticación
 * Solo usuarios autenticados pueden llamar esta función
 */
exports.syncCampaignsCallable = onCall(
  {
    maxInstances: 5,
  },
  async (request) => {
    try {
      // Verificar autenticación
      if (!request.auth) {
        throw new Error("Usuario no autenticado");
      }

      const { userId } = request.auth;
      logger.info(`Usuario ${userId} solicitando sincronización de campañas`);

      const instantlyService = new InstantlyService();
      const result = await instantlyService.syncAllCampaigns();

      logger.info(`Sincronización completada para usuario ${userId}`, {
        totalSynced: result.totalSynced,
      });

      return {
        success: true,
        message: "Sincronización completada exitosamente",
        data: result,
      };
    } catch (error) {
      logger.error("Error en función callable de sincronización", {
        error: error.message,
        userId: request.auth?.uid,
      });

      throw new Error(`Error de sincronización: ${error.message}`);
    }
  }
);

// ============================================================================
// FUNCIÓN DE PRUEBA (MANTENER PARA DESARROLLO)
// ============================================================================

/**
 * Función de prueba para verificar que las funciones están funcionando
 * Endpoint: GET /hello
 */
exports.helloWorld = onRequest(
  {
    cors: true,
  },
  (request, response) => {
    logger.info("Función de prueba ejecutada", { structuredData: true });

    response.json({
      message: "¡Hola desde Firebase Cloud Functions!",
      timestamp: new Date().toISOString(),
      functions: [
        "syncAllCampaigns",
        "syncCampaignById",
        "getCampaigns",
        "getCampaignById",
        "getCampaignMetrics",
        "testConnection",
        "debugApiResponse",
        "testCampaignsEndpoint",
        "getSyncStats",
      ],
    });
  }
);

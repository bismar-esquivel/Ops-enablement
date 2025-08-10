/**
 * Configuración para funciones programadas (scheduled functions)
 * Permite configurar fácilmente los horarios de ejecución
 */

const SCHEDULER_CONFIG = {
  // Sincronización diaria de campañas
  DAILY_CAMPAIGN_SYNC: {
    schedule: process.env.DAILY_SYNC_SCHEDULE || "0 2 * * *", // 2:00 AM diario
    timeZone: process.env.TIMEZONE || "America/Mexico_City",
    description: "Sincronización automática diaria de todas las campañas",
    maxInstances: 1,
    retryCount: 3,
  },

  // Limpieza semanal de datos
  WEEKLY_CLEANUP: {
    schedule: process.env.WEEKLY_CLEANUP_SCHEDULE || "0 3 * * 0", // 3:00 AM domingos
    timeZone: process.env.TIMEZONE || "America/Mexico_City",
    description: "Limpieza semanal de datos antiguos",
    maxInstances: 1,
    retryCount: 2,
  },

  // Sincronización de métricas (cada 6 horas)
  METRICS_SYNC: {
    schedule: process.env.METRICS_SYNC_SCHEDULE || "0 */6 * * *", // Cada 6 horas
    timeZone: process.env.TIMEZONE || "America/Mexico_City",
    description: "Sincronización de métricas de campañas activas",
    maxInstances: 2,
    retryCount: 3,
  },

  // Backup de datos (semanal)
  WEEKLY_BACKUP: {
    schedule: process.env.WEEKLY_BACKUP_SCHEDULE || "0 4 * * 0", // 4:00 AM domingos
    timeZone: process.env.TIMEZONE || "America/Mexico_City",
    description: "Backup semanal de datos de campañas",
    maxInstances: 1,
    retryCount: 2,
  },
};

// Validar configuración de cron
const validateCronSchedule = (schedule) => {
  const cronRegex =
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([00-9]|1[0-9]|2[0-9]|3[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-9])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-9])) (\*|([0-6])|\*\/([0-6]))$/;

  if (!cronRegex.test(schedule)) {
    throw new Error(`Formato de cron inválido: ${schedule}`);
  }

  return true;
};

// Validar toda la configuración
const validateConfig = () => {
  Object.entries(SCHEDULER_CONFIG).forEach(([key, config]) => {
    try {
      validateCronSchedule(config.schedule);
      console.log(`✅ Configuración válida para ${key}: ${config.schedule}`);
    } catch (error) {
      console.error(`❌ Configuración inválida para ${key}: ${error.message}`);
      throw error;
    }
  });

  return true;
};

// Obtener configuración para una función específica
const getConfig = (functionName) => {
  const config = SCHEDULER_CONFIG[functionName];
  if (!config) {
    throw new Error(
      `Configuración no encontrada para función: ${functionName}`
    );
  }
  return config;
};

// Obtener todas las configuraciones
const getAllConfigs = () => {
  return SCHEDULER_CONFIG;
};

module.exports = {
  SCHEDULER_CONFIG,
  validateConfig,
  getConfig,
  getAllConfigs,
  validateCronSchedule,
};

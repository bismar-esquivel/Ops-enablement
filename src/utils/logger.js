const { functions } = require("firebase-functions");

class Logger {
  constructor(context = "") {
    this.context = context;
  }

  info(message, data = {}) {
    const logData = {
      level: "INFO",
      timestamp: new Date().toISOString(),
      context: this.context,
      message,
      data,
    };

    console.log(JSON.stringify(logData));

    // If running in Firebase Functions, also log to Firebase
    if (typeof functions !== "undefined") {
      functions.logger.info(message, { ...data, context: this.context });
    }
  }

  warn(message, data = {}) {
    const logData = {
      level: "WARN",
      timestamp: new Date().toISOString(),
      context: this.context,
      message,
      data,
    };

    console.warn(JSON.stringify(logData));

    if (typeof functions !== "undefined") {
      functions.logger.warn(message, { ...data, context: this.context });
    }
  }

  error(message, error = null, data = {}) {
    const logData = {
      level: "ERROR",
      timestamp: new Date().toISOString(),
      context: this.context,
      message,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : null,
      data,
    };

    console.error(JSON.stringify(logData));

    if (typeof functions !== "undefined") {
      functions.logger.error(message, {
        error: error?.message,
        stack: error?.stack,
        ...data,
        context: this.context,
      });
    }
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV === "development") {
      const logData = {
        level: "DEBUG",
        timestamp: new Date().toISOString(),
        context: this.context,
        message,
        data,
      };

      console.log(JSON.stringify(logData));
    }
  }

  // Create a new logger instance with a specific context
  withContext(context) {
    return new Logger(context);
  }
}

// Create default logger instance
const logger = new Logger("default");

module.exports = {
  Logger,
  logger,
};

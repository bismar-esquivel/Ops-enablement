/**
 * Sistema de Rate Limiting para Instantly API
 * Maneja límites de requests y implementa backoff exponencial
 */

class RateLimiter {
  constructor(options = {}) {
    this.maxRequestsPerMinute = options.maxRequestsPerMinute || 60;
    this.delayBetweenRequests = options.delayBetweenRequests || 1000;
    this.maxRetryAttempts = options.maxRetryAttempts || 3;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.maxBackoffDelay = options.maxBackoffDelay || 30000; // 30 segundos máximo

    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * Verificar si se puede hacer un request
   */
  canMakeRequest() {
    const now = Date.now();

    // Reset contador cada minuto
    if (now - this.lastResetTime >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    return this.requestCount < this.maxRequestsPerMinute;
  }

  /**
   * Incrementar contador de requests
   */
  incrementRequestCount() {
    this.requestCount++;
  }

  /**
   * Calcular delay para el siguiente request
   */
  calculateDelay() {
    if (this.canMakeRequest()) {
      return this.delayBetweenRequests;
    }

    // Si hemos alcanzado el límite, esperar hasta el siguiente minuto
    const timeUntilReset = 60000 - (Date.now() - this.lastResetTime);
    return Math.max(timeUntilReset, this.delayBetweenRequests);
  }

  /**
   * Calcular delay de backoff exponencial para reintentos
   */
  calculateBackoffDelay(attempt) {
    const baseDelay =
      this.delayBetweenRequests * Math.pow(this.backoffMultiplier, attempt - 1);
    return Math.min(baseDelay, this.maxBackoffDelay);
  }

  /**
   * Esperar el tiempo necesario antes de hacer un request
   */
  async waitForNextRequest() {
    const delay = this.calculateDelay();

    if (delay > 0) {
      console.log(`⏳ Esperando ${delay}ms antes del siguiente request...`);
      await this.delay(delay);
    }
  }

  /**
   * Hacer un request con rate limiting
   */
  async makeRequest(requestFn, retryCount = 0) {
    try {
      // Verificar rate limiting
      if (!this.canMakeRequest()) {
        await this.waitForNextRequest();
      }

      // Incrementar contador
      this.incrementRequestCount();

      // Ejecutar request
      const result = await requestFn();

      // Log exitoso
      console.log(
        `✅ Request exitoso (${this.requestCount}/${this.maxRequestsPerMinute})`
      );

      return result;
    } catch (error) {
      // Manejar errores de rate limiting
      if (error.response?.status === 429) {
        console.log(
          `🚫 Rate limit alcanzado (${this.requestCount}/${this.maxRequestsPerMinute})`
        );

        if (retryCount < this.maxRetryAttempts) {
          const backoffDelay = this.calculateBackoffDelay(retryCount + 1);
          console.log(
            `🔄 Reintentando en ${backoffDelay}ms (intento ${retryCount + 1}/${
              this.maxRetryAttempts
            })`
          );

          await this.delay(backoffDelay);
          return this.makeRequest(requestFn, retryCount + 1);
        } else {
          throw new Error(
            `Rate limit alcanzado después de ${this.maxRetryAttempts} intentos`
          );
        }
      }

      // Otros errores
      throw error;
    }
  }

  /**
   * Hacer múltiples requests con rate limiting
   */
  async makeMultipleRequests(requestFns, concurrency = 1) {
    const results = [];
    const chunks = this.chunkArray(requestFns, concurrency);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(
        `📦 Procesando lote ${i + 1}/${chunks.length} (${
          chunk.length
        } requests)`
      );

      const chunkPromises = chunk.map((requestFn) =>
        this.makeRequest(requestFn)
      );
      const chunkResults = await Promise.allSettled(chunkPromises);

      // Agregar resultados
      chunkResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.error(
            `❌ Error en request ${i * concurrency + index}:`,
            result.reason
          );
          results.push(null);
        }
      });

      // Esperar entre lotes para respetar rate limits
      if (i < chunks.length - 1) {
        const delay = this.calculateDelay();
        console.log(`⏳ Esperando ${delay}ms entre lotes...`);
        await this.delay(delay);
      }
    }

    return results;
  }

  /**
   * Dividir array en chunks para procesamiento concurrente
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Obtener estadísticas del rate limiter
   */
  getStats() {
    const now = Date.now();
    const timeUntilReset = Math.max(0, 60000 - (now - this.lastResetTime));

    return {
      currentRequests: this.requestCount,
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      remainingRequests: Math.max(
        0,
        this.maxRequestsPerMinute - this.requestCount
      ),
      timeUntilReset: timeUntilReset,
      canMakeRequest: this.canMakeRequest(),
      lastResetTime: new Date(this.lastResetTime).toISOString(),
    };
  }

  /**
   * Reset del rate limiter
   */
  reset() {
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    console.log("🔄 Rate limiter reseteado");
  }

  /**
   * Utility para delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory para crear rate limiters específicos
 */
class RateLimiterFactory {
  static createInstantlyLimiter() {
    return new RateLimiter({
      maxRequestsPerMinute: 60,
      delayBetweenRequests: 1000,
      maxRetryAttempts: 3,
      backoffMultiplier: 2,
      maxBackoffDelay: 30000,
    });
  }

  static createBulkSyncLimiter() {
    return new RateLimiter({
      maxRequestsPerMinute: 30, // Más conservador para sincronizaciones masivas
      delayBetweenRequests: 2000,
      maxRetryAttempts: 5,
      backoffMultiplier: 1.5,
      maxBackoffDelay: 60000,
    });
  }

  static createMetricsLimiter() {
    return new RateLimiter({
      maxRequestsPerMinute: 100, // Más permisivo para métricas
      delayBetweenRequests: 600,
      maxRetryAttempts: 3,
      backoffMultiplier: 2,
      maxBackoffDelay: 15000,
    });
  }
}

module.exports = {
  RateLimiter,
  RateLimiterFactory,
};

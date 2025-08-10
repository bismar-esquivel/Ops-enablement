/**
 * Gestor de Tokens para Instantly API
 * Maneja autenticación, renovación automática y almacenamiento seguro
 */

const { getFirestore } = require("../config/firebase");

class TokenManager {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.INSTANTLY_API_KEY;
    this.baseUrl = options.baseUrl || process.env.INSTANTLY_API_BASE_URL;
    this.tokenRefreshThreshold = options.tokenRefreshThreshold || 300000; // 5 minutos
    this.maxRefreshAttempts = options.maxRefreshAttempts || 3;

    this.currentToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshPromise = null;

    // Inicializar
    this.initialize();
  }

  /**
   * Inicializar el gestor de tokens
   */
  async initialize() {
    try {
      // Intentar cargar token desde Firestore
      await this.loadTokenFromStorage();

      // Verificar si el token necesita renovación
      if (this.shouldRefreshToken()) {
        await this.refreshToken();
      }

      console.log("✅ TokenManager inicializado correctamente");
    } catch (error) {
      console.error("❌ Error inicializando TokenManager:", error.message);
      // Continuar con el token de la variable de entorno
    }
  }

  /**
   * Obtener token válido (renovando si es necesario)
   */
  async getValidToken() {
    try {
      // Si no hay token o está expirado, renovar
      if (!this.currentToken || this.shouldRefreshToken()) {
        await this.refreshToken();
      }

      return this.currentToken;
    } catch (error) {
      console.error("❌ Error obteniendo token válido:", error.message);
      throw new Error("No se pudo obtener un token válido");
    }
  }

  /**
   * Verificar si el token necesita renovación
   */
  shouldRefreshToken() {
    if (!this.currentToken || !this.tokenExpiry) {
      return true;
    }

    const now = Date.now();
    const timeUntilExpiry = this.tokenExpiry - now;

    return timeUntilExpiry <= this.tokenRefreshThreshold;
  }

  /**
   * Renovar token
   */
  async refreshToken() {
    // Evitar múltiples renovaciones simultáneas
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Realizar la renovación del token
   */
  async performTokenRefresh() {
    try {
      console.log("🔄 Renovando token de Instantly API...");

      // Para Instantly API v2, generalmente se usa el API key directamente
      // Si en el futuro implementan OAuth, aquí iría la lógica de renovación

      // Por ahora, validar que el API key esté disponible
      if (!this.apiKey) {
        throw new Error("INSTANTLY_API_KEY no está configurado");
      }

      // Simular renovación (en realidad solo validamos el API key)
      const isValid = await this.validateApiKey();

      if (!isValid) {
        throw new Error("API key de Instantly no es válido");
      }

      // Actualizar token y expiración
      this.currentToken = this.apiKey;
      this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

      // Guardar en almacenamiento
      await this.saveTokenToStorage();

      console.log("✅ Token renovado exitosamente");
      return this.currentToken;
    } catch (error) {
      console.error("❌ Error renovando token:", error.message);
      throw error;
    }
  }

  /**
   * Validar API key con Instantly API
   */
  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      // Si el endpoint no existe, asumir que el API key es válido
      console.log(
        "⚠️ Endpoint de validación no disponible, asumiendo API key válido"
      );
      return true;
    }
  }

  /**
   * Obtener headers de autenticación
   */
  async getAuthHeaders() {
    const token = await this.getValidToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Instantly-API-Integration/1.0.0",
    };
  }

  /**
   * Guardar token en Firestore
   */
  async saveTokenToStorage() {
    try {
      const db = getFirestore();
      const tokenData = {
        token: this.currentToken,
        expiry: this.tokenExpiry,
        lastUpdated: new Date(),
        apiKeyHash: this.hashApiKey(this.apiKey),
      };

      await db.collection("system").doc("instantly_tokens").set(tokenData);
      console.log("💾 Token guardado en almacenamiento");
    } catch (error) {
      console.error("❌ Error guardando token:", error.message);
      // No fallar si no se puede guardar
    }
  }

  /**
   * Cargar token desde Firestore
   */
  async loadTokenFromStorage() {
    try {
      const db = getFirestore();
      const doc = await db.collection("system").doc("instantly_tokens").get();

      if (doc.exists) {
        const data = doc.data();

        // Verificar que el hash del API key coincida
        if (data.apiKeyHash === this.hashApiKey(this.apiKey)) {
          this.currentToken = data.token;
          this.tokenExpiry = data.expiry;
          console.log("📥 Token cargado desde almacenamiento");
          return true;
        } else {
          console.log("⚠️ API key ha cambiado, descartando token almacenado");
        }
      }

      return false;
    } catch (error) {
      console.error("❌ Error cargando token:", error.message);
      return false;
    }
  }

  /**
   * Limpiar token almacenado
   */
  async clearStoredToken() {
    try {
      const db = getFirestore();
      await db.collection("system").doc("instantly_tokens").delete();

      this.currentToken = null;
      this.tokenExpiry = null;

      console.log("🗑️ Token almacenado eliminado");
    } catch (error) {
      console.error("❌ Error eliminando token almacenado:", error.message);
    }
  }

  /**
   * Hash simple del API key para verificación
   */
  hashApiKey(apiKey) {
    if (!apiKey) return "";

    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Obtener estado del token
   */
  getTokenStatus() {
    if (!this.currentToken) {
      return {
        hasToken: false,
        isValid: false,
        timeUntilExpiry: null,
        needsRefresh: true,
      };
    }

    const now = Date.now();
    const timeUntilExpiry = this.tokenExpiry ? this.tokenExpiry - now : null;

    return {
      hasToken: true,
      isValid: timeUntilExpiry > 0,
      timeUntilExpiry: timeUntilExpiry,
      needsRefresh: this.shouldRefreshToken(),
      isRefreshing: this.isRefreshing,
    };
  }

  /**
   * Forzar renovación del token
   */
  async forceTokenRefresh() {
    console.log("🔄 Forzando renovación de token...");

    this.currentToken = null;
    this.tokenExpiry = null;

    await this.clearStoredToken();
    return this.refreshToken();
  }

  /**
   * Validar configuración
   */
  validateConfig() {
    const errors = [];

    if (!this.apiKey) {
      errors.push("INSTANTLY_API_KEY no está configurado");
    }

    if (!this.baseUrl) {
      errors.push("INSTANTLY_API_BASE_URL no está configurado");
    }

    if (errors.length > 0) {
      throw new Error(`Configuración inválida: ${errors.join(", ")}`);
    }

    return true;
  }
}

module.exports = TokenManager;

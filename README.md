# Instantly API v2 Integration

Una aplicación backend completa desarrollada en Node.js que se integra con Firebase Cloud Functions para conectarse con la API v2 de Instantly y extraer información de campañas de email marketing.

## 🚀 Características Principales

- **Integración completa con Instantly API v2**
- **Sincronización automática de campañas**
- **Almacenamiento optimizado en Firestore**
- **Cloud Functions HTTP, Callable y Programadas**
- **Manejo avanzado de rate limiting y reintentos**
- **Gestión automática de tokens y autenticación**
- **Sistema de logging estructurado**
- **Tests automatizados**
- **Monitoreo y estadísticas en tiempo real**

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 18+
- **Lenguaje**: JavaScript (ES6+)
- **Base de Datos**: Google Firestore
- **Servicios**: Google Cloud Functions v2
- **API Externa**: Instantly API v2
- **Dependencias**: Firebase Admin SDK, Axios, Express, CORS

## 📁 Estructura del Proyecto

```
├── src/
│   ├── config/
│   │   ├── firebase.js          # Configuración de Firebase Admin
│   │   └── instantly.js         # Configuración de Instantly API
│   ├── functions/
│   │   ├── index.js             # Cloud Functions principales
│   │   └── scheduler-config.js  # Configuración de funciones programadas
│   ├── models/
│   │   └── Campaign.js          # Modelo de datos para campañas
│   ├── services/
│   │   └── InstantlyService.js  # Servicio principal de la API
│   └── utils/
│       ├── logger.js             # Utilidad de logging
│       ├── rateLimiter.js       # Sistema de rate limiting
│       └── tokenManager.js      # Gestión de tokens
├── tests/
│   └── Campaign.test.js         # Tests del modelo Campaign
├── firebase.json                 # Configuración de Firebase
├── firestore.rules              # Reglas de seguridad de Firestore
├── firestore.indexes.json       # Índices de Firestore
├── package.json                 # Dependencias y scripts
├── env.example                  # Variables de entorno de ejemplo
├── API_DOCUMENTATION.md         # Documentación completa de la API
└── README.md                    # Este archivo
```

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd instantly-api-integration
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp env.example .env
```

Editar el archivo `.env` con tus credenciales:

```env
# ============================================================================
# INSTANTLY API CONFIGURATION
# ============================================================================
INSTANTLY_API_KEY=tu_api_key_de_instantly
INSTANTLY_API_BASE_URL=https://api.instantly.ai/api/v2

# ============================================================================
# FIREBASE CONFIGURATION
# ============================================================================
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_PRIVATE_KEY_ID=tu_private_key_id
FIREBASE_PRIVATE_KEY=tu_private_key
FIREBASE_CLIENT_EMAIL=tu_client_email
FIREBASE_CLIENT_ID=tu_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=tu_cert_url

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT=5001

# ============================================================================
# SYNC & RATE LIMITING CONFIGURATION
# ============================================================================
SYNC_INTERVAL_MINUTES=30
MAX_RETRY_ATTEMPTS=3
RATE_LIMIT_DELAY_MS=1000

# ============================================================================
# SCHEDULED FUNCTIONS CONFIGURATION
# ============================================================================
DAILY_SYNC_SCHEDULE="0 2 * * *"
WEEKLY_CLEANUP_SCHEDULE="0 3 * * 0"
TIMEZONE=America/Mexico_City

# ============================================================================
# FUNCTION PERFORMANCE CONFIGURATION
# ============================================================================
MAX_INSTANCES=10
TIMEOUT_SECONDS=540
MEMORY_MB=256
```

### 4. Configurar Firebase

```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Iniciar sesión en Firebase
firebase login

# Inicializar el proyecto
firebase init

# Seleccionar:
# - Functions
# - Firestore
# - Use existing project
```

### 5. Desplegar

```bash
# Construir el proyecto
npm run build

# Desplegar a Firebase
npm run deploy

# Ejecutar localmente
npm start
```

## 🔧 Uso

### Endpoints Disponibles

#### 🔄 Sincronización de Campañas

- **`POST /syncAllCampaigns`** - Sincronizar todas las campañas
- **`POST /syncCampaignById`** - Sincronizar campaña específica
- **`POST /syncCampaignsCallable`** - Sincronización con autenticación (Callable)

#### 📊 Consulta de Datos

- **`GET /getCampaigns`** - Obtener todas las campañas con paginación
- **`GET /getCampaigns?status=active&limit=50&page=1`** - Filtrar y paginar
- **`GET /getCampaignById/{campaignId}`** - Obtener campaña específica
- **`GET /getCampaignMetrics/{campaignId}`** - Obtener métricas en tiempo real

#### 🛠️ Mantenimiento y Monitoreo

- **`GET /testConnection`** - Probar conexión con Instantly API
- **`GET /getSyncStats`** - Estadísticas de sincronización
- **`GET /hello`** - Función de prueba y lista de endpoints

### Funciones Programadas (Automáticas)

#### 📅 Sincronización Diaria

- **Horario**: Todos los días a las 2:00 AM (Mexico City)
- **Función**: `scheduledCampaignSync`
- **Descripción**: Sincroniza automáticamente todas las campañas

#### 🧹 Limpieza Semanal

- **Horario**: Todos los domingos a las 3:00 AM (Mexico City)
- **Función**: `cleanupOldData`
- **Descripción**: Limpia datos antiguos y optimiza la base de datos

### Ejemplos de Uso

#### Sincronización Manual

```bash
# Sincronizar todas las campañas
curl -X POST https://your-project.cloudfunctions.net/syncAllCampaigns

# Sincronizar campaña específica
curl -X POST https://your-project.cloudfunctions.net/syncCampaignById \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "campaign_123"}'
```

#### Consulta de Datos

```bash
# Obtener campañas activas
curl "https://your-project.cloudfunctions.net/getCampaigns?status=active&limit=20"

# Obtener campaña específica
curl https://your-project.cloudfunctions.net/getCampaignById/campaign_123

# Obtener métricas en tiempo real
curl https://your-project.cloudfunctions.net/getCampaignMetrics/campaign_123
```

#### Monitoreo

```bash
# Probar conexión
curl https://your-project.cloudfunctions.net/testConnection

# Probar endpoint de campañas específicamente
curl https://your-project.cloudfunctions.net/testCampaignsEndpoint

# Debug de respuesta de API
curl -X POST https://your-project.cloudfunctions.net/debugApiResponse \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "/campaigns", "params": {"page": 1, "limit": 5}}'

# Obtener estadísticas
curl https://your-project.cloudfunctions.net/getSyncStats
```

## 📊 Estructura de Datos

### Colección: campaigns

```javascript
{
  id: "string",                    // ID único de la campaña
  name: "string",                  // Nombre de la campaña
  status: "string",                // Estado (active, paused, completed, draft)
  createdAt: "timestamp",          // Fecha de creación
  updatedAt: "timestamp",          // Última modificación
  scheduledAt: "timestamp",        // Fecha programada
  completedAt: "timestamp",        // Fecha de finalización
  subject: "string",               // Asunto del email
  fromEmail: "string",             // Email remitente
  fromName: "string",              // Nombre remitente
  replyTo: "string",               // Email de respuesta
  templateId: "string",            // ID de la plantilla
  listId: "string",                // ID de la lista
  metrics: {                       // Métricas de rendimiento
    sent: "number",
    delivered: "number",
    opened: "number",
    clicked: "number",
    bounced: "number",
    unsubscribed: "number"
  },
  settings: "object",              // Configuración adicional
  tags: ["array"],                 // Etiquetas
  lastSyncedAt: "timestamp"        // Última sincronización
}
```

### Colección: system (para tokens y configuración)

```javascript
{
  id: "instantly_tokens",
  token: "string",                 // Token actual
  expiry: "timestamp",            // Fecha de expiración
  lastUpdated: "timestamp",        // Última actualización
  apiKeyHash: "string"            // Hash del API key para verificación
}
```

## 🚀 Características Avanzadas

### Rate Limiting Inteligente

- **Control automático**: Respeta límites de 60 requests/minuto
- **Backoff exponencial**: Reintentos inteligentes con delays crecientes
- **Procesamiento por lotes**: Manejo eficiente de múltiples requests
- **Configuración flexible**: Diferentes límites por tipo de operación

### Gestión de Tokens

- **Renovación automática**: Tokens se renuevan antes de expirar
- **Almacenamiento seguro**: Tokens se guardan en Firestore
- **Validación continua**: Verificación automática de validez
- **Fallback robusto**: Múltiples estrategias de autenticación

### Logging Estructurado

- **Contexto completo**: Cada log incluye información de la operación
- **Niveles de log**: Info, Warning, Error con filtrado
- **Métricas integradas**: Conteo de operaciones y rendimiento
- **Debugging avanzado**: Stack traces y contexto de errores

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar tests específicos
npm test -- Campaign.test.js
```

## 🔧 Troubleshooting

### Error: "campaigns is not iterable"

Este error indica que la respuesta de la API de Instantly no tiene la estructura esperada. Para debuggear:

```bash
# 1. Probar conexión básica
curl https://your-project.cloudfunctions.net/testConnection

# 2. Probar endpoint de campañas específicamente
curl https://your-project.cloudfunctions.net/testCampaignsEndpoint

# 3. Debug de respuesta de API
curl -X POST https://your-project.cloudfunctions.net/debugApiResponse \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "/campaigns", "params": {"page": 1, "limit": 5}}'

# 4. Usar script de debug local
node debug-instantly.js
```

### Scripts de Debug

- **`debug-instantly.js`**: Script local para probar la API de Instantly
- **`test-api.js`**: Script simple para validar respuestas de la API

### Verificar Configuración

1. **Variables de entorno**: Asegúrate de que `.env` tenga `INSTANTLY_API_KEY`
2. **URL de la API**: Verifica `INSTANTLY_API_BASE_URL` en `.env`
3. **Permisos**: Confirma que tu API key tenga acceso a campañas

## 📝 Logs y Monitoreo

### Sistema de Logging

- **Logs estructurados**: Formato JSON para análisis
- **Niveles de log**: Info, Warning, Error
- **Contexto de operaciones**: ID de usuario, campaña, etc.
- **Métricas de rendimiento**: Tiempo de ejecución, uso de memoria

### Monitoreo en Tiempo Real

- **Health checks**: Endpoints de estado de salud
- **Métricas de sincronización**: Conteo y estado de campañas
- **Estado de servicios**: Firebase y Instantly API
- **Alertas automáticas**: Notificaciones de errores críticos

## 🔒 Seguridad

### Autenticación y Autorización

- **API Key de Instantly**: Autenticación segura con la API externa
- **Firebase Auth**: Para funciones callable (requieren usuario autenticado)
- **Firestore Rules**: Solo lectura pública, escritura solo a través de Cloud Functions

### Protección de Datos

- **Variables de Entorno**: Credenciales sensibles protegidas
- **Rate Limiting**: Prevención de abuso y ataques
- **Validación de Entrada**: Sanitización de todos los parámetros
- **CORS Configurable**: Control de orígenes permitidos

## 🚨 Manejo de Errores

### Estrategias de Recuperación

- **Reintentos automáticos**: Hasta 3-5 intentos con backoff exponencial
- **Rate limiting inteligente**: Respeta límites de la API externa
- **Fallbacks robustos**: Múltiples estrategias para operaciones críticas
- **Logging detallado**: Información completa para debugging

### Tipos de Errores Manejados

- **Errores de red**: Timeouts, conexiones perdidas
- **Errores de API**: Rate limits, autenticación fallida
- **Errores de base de datos**: Firestore no disponible
- **Errores de validación**: Parámetros inválidos

## 📈 Monitoreo y Métricas

### Métricas Disponibles

- **Campañas sincronizadas**: Conteo total y por estado
- **Tiempo de sincronización**: Duración de operaciones
- **Tasa de éxito**: Porcentaje de operaciones exitosas
- **Uso de recursos**: Memoria, CPU, tiempo de ejecución

### Herramientas de Monitoreo

- **Firebase Console**: Monitoreo de funciones y logs
- **Cloud Logging**: Logs estructurados y métricas
- **Cloud Monitoring**: Métricas de rendimiento y errores
- **Alertas automáticas**: Notificaciones de problemas críticos

## 🔧 Configuración Avanzada

### Funciones Programadas

```javascript
// Configuración de cron schedules
DAILY_SYNC_SCHEDULE = "0 2 * * *"; // 2:00 AM diario
WEEKLY_CLEANUP_SCHEDULE = "0 3 * * 0"; // 3:00 AM domingos
METRICS_SYNC_SCHEDULE = "0 */6 * * *"; // Cada 6 horas
WEEKLY_BACKUP_SCHEDULE = "0 4 * * 0"; // 4:00 AM domingos
```

### Rate Limiting

```javascript
// Configuración por tipo de operación
INSTANTLY_LIMITER: 60 requests/minuto
BULK_SYNC_LIMITER: 30 requests/minuto
METRICS_LIMITER: 100 requests/minuto
```

### Performance

```javascript
// Configuración de funciones
MAX_INSTANCES: 10
TIMEOUT_SECONDS: 540 (9 minutos)
MEMORY_MB: 256
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- **Código**: Seguir estándares de ESLint
- **Tests**: Mantener cobertura >80%
- **Documentación**: Actualizar README y API docs
- **Commits**: Usar convenciones de Conventional Commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

### Recursos Disponibles

- **Documentación de API**: `API_DOCUMENTATION.md`
- **Issues de GitHub**: Para reportar bugs y solicitar features
- **Documentación de Instantly**: API v2 reference
- **Firebase Docs**: Cloud Functions y Firestore

### Canales de Soporte

- **GitHub Issues**: Para problemas técnicos
- **Discussions**: Para preguntas generales
- **Wiki**: Guías y tutoriales
- **Email**: Para consultas privadas

## 🔄 Changelog

### v2.0.0 (Actual)

- ✨ **Nuevas Cloud Functions**: HTTP, Callable y Programadas
- 🚀 **Rate Limiting Avanzado**: Sistema inteligente con backoff exponencial
- 🔐 **Gestión de Tokens**: Renovación automática y almacenamiento seguro
- 📊 **Métricas en Tiempo Real**: Endpoints para estadísticas y monitoreo
- 🕐 **Funciones Programadas**: Sincronización automática diaria y limpieza semanal
- 📝 **Logging Estructurado**: Sistema robusto de logs y métricas
- 🔧 **Configuración Flexible**: Variables de entorno para personalización
- 📚 **Documentación Completa**: API docs y guías de uso

### v1.0.0

- Integración inicial con Instantly API v2
- Sincronización básica de campañas
- Almacenamiento en Firestore
- Cloud Functions HTTP básicas
- Sistema de logging básico
- Tests automatizados

## 🎯 Roadmap

### Próximas Versiones

- **v2.1.0**: Webhooks para actualizaciones en tiempo real
- **v2.2.0**: Dashboard de monitoreo web
- **v2.3.0**: Integración con otras plataformas de email
- **v3.0.0**: Migración a TypeScript y mejoras de performance

---

**Desarrollado con ❤️ para la integración de Instantly API v2**

_Para más información, consulta la [Documentación de la API](API_DOCUMENTATION.md)_

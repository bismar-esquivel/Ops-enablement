# API Documentation - Instantly Integration

## Overview

Esta API proporciona endpoints para integrar con Instantly API v2 y gestionar campañas de email marketing. Incluye funciones de sincronización, consulta de datos y mantenimiento automático.

## Base URL

```
https://your-project-id.cloudfunctions.net/
```

## Authentication

La mayoría de endpoints son públicos, pero algunos requieren autenticación de Firebase:

- `syncCampaignsCallable`: Requiere usuario autenticado
- Otros endpoints: Públicos (con rate limiting)

## Endpoints

### 1. Sincronización de Campañas

#### Sincronizar Todas las Campañas

```http
POST /syncAllCampaigns
```

**Descripción:** Sincroniza todas las campañas disponibles en Instantly API y las almacena en Firestore.

**Response:**

```json
{
  "success": true,
  "message": "Sincronización completada exitosamente",
  "data": {
    "totalSynced": 25,
    "success": true
  }
}
```

#### Sincronizar Campaña Específica

```http
POST /syncCampaignById
```

**Body:**

```json
{
  "campaignId": "campaign_123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Campaña sincronizada exitosamente",
  "data": {
    "id": "campaign_123",
    "name": "Campaña de Bienvenida",
    "status": "active"
  }
}
```

### 2. Consulta de Campañas

#### Obtener Todas las Campañas

```http
GET /getCampaigns?limit=50&page=1&status=active
```

**Query Parameters:**

- `limit` (opcional): Número de campañas por página (default: 100)
- `page` (opcional): Número de página (default: 1)
- `status` (opcional): Filtrar por estado (active, paused, completed, draft)

**Response:**

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign_123",
        "name": "Campaña de Bienvenida",
        "status": "active",
        "createdAt": "2024-01-15T10:00:00Z",
        "metrics": {
          "sent": 1500,
          "delivered": 1480,
          "opened": 890,
          "clicked": 120
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalItems": 25,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

#### Obtener Campaña por ID

```http
GET /getCampaignById/{campaignId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Campaña de Bienvenida",
    "status": "active",
    "subject": "¡Bienvenido a nuestra plataforma!",
    "fromEmail": "noreply@company.com",
    "fromName": "Company Name",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-20T15:30:00Z",
    "metrics": {
      "sent": 1500,
      "delivered": 1480,
      "opened": 890,
      "clicked": 120,
      "bounced": 20,
      "unsubscribed": 5
    }
  }
}
```

#### Obtener Métricas de Campaña

```http
GET /getCampaignMetrics/{campaignId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "campaign_id": "campaign_123",
    "metrics": {
      "sent": 1500,
      "delivered": 1480,
      "opened": 890,
      "clicked": 120,
      "bounced": 20,
      "unsubscribed": 5,
      "open_rate": 59.33,
      "click_rate": 8.0,
      "bounce_rate": 1.33
    },
    "period": "last_30_days"
  }
}
```

### 3. Mantenimiento y Monitoreo

#### Probar Conexión con Instantly API

```http
GET /testConnection
```

**Response:**

```json
{
  "success": true,
  "message": "Conexión exitosa con Instantly API",
  "data": {
    "success": true,
    "status": 200,
    "message": "Connection successful"
  }
}
```

#### Obtener Estadísticas de Sincronización

```http
GET /getSyncStats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCampaigns": 25,
    "campaignsByStatus": {
      "active": 15,
      "paused": 5,
      "completed": 3,
      "draft": 2
    },
    "lastSyncInfo": {
      "lastCampaignId": "campaign_123",
      "lastCampaignName": "Campaña de Bienvenida",
      "lastSyncTime": "2024-01-20T15:30:00Z"
    },
    "syncHealth": "healthy"
  }
}
```

### 4. Función Callable (Autenticada)

#### Sincronización con Autenticación

```javascript
// Cliente Firebase
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const syncCampaigns = httpsCallable(functions, "syncCampaignsCallable");

try {
  const result = await syncCampaigns();
  console.log("Sincronización completada:", result.data);
} catch (error) {
  console.error("Error:", error.message);
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sincronización completada exitosamente",
  "data": {
    "totalSynced": 25,
    "success": true
  }
}
```

### 5. Función de Prueba

#### Verificar Funcionamiento

```http
GET /hello
```

**Response:**

```json
{
  "message": "¡Hola desde Firebase Cloud Functions!",
  "timestamp": "2024-01-20T15:30:00.000Z",
  "functions": [
    "syncAllCampaigns",
    "syncCampaignById",
    "getCampaigns",
    "getCampaignById",
    "getCampaignMetrics",
    "testConnection",
    "getSyncStats"
  ]
}
```

## Funciones Programadas

### Sincronización Automática Diaria

- **Schedule:** Todos los días a las 2:00 AM (Mexico City)
- **Función:** `scheduledCampaignSync`
- **Descripción:** Sincroniza automáticamente todas las campañas

### Limpieza de Datos Semanal

- **Schedule:** Todos los domingos a las 3:00 AM (Mexico City)
- **Función:** `cleanupOldData`
- **Descripción:** Limpia datos antiguos (configurable)

## Rate Limiting

- **Requests por minuto:** 60
- **Delay entre requests:** 1000ms (configurable)
- **Máximo de reintentos:** 3
- **Delay entre reintentos:** 2000ms

## Manejo de Errores

Todos los endpoints devuelven respuestas consistentes:

**Error 400 - Bad Request:**

```json
{
  "success": false,
  "error": "ID de campaña requerido"
}
```

**Error 404 - Not Found:**

```json
{
  "success": false,
  "error": "Campaña no encontrada"
}
```

**Error 500 - Internal Server Error:**

```json
{
  "success": false,
  "error": "Error interno del servidor",
  "message": "Detalles del error"
}
```

## Logging

Todas las funciones incluyen logging estructurado con:

- Timestamp
- Nivel de log (info, error, warn)
- Contexto de la operación
- Datos estructurados para análisis

## Configuración de Entorno

Ver archivo `env.example` para todas las variables de entorno disponibles.

## Despliegue

```bash
# Instalar dependencias
npm install

# Ejecutar tests
npm test

# Desplegar funciones
npm run deploy

# Ejecutar localmente
npm start
```

## Monitoreo

- **Firebase Console:** Monitoreo de funciones y logs
- **Cloud Logging:** Logs estructurados y métricas
- **Cloud Monitoring:** Métricas de rendimiento y errores

## Seguridad

- **CORS:** Habilitado para todos los orígenes (configurable)
- **Autenticación:** Requerida para funciones callable
- **Rate Limiting:** Implementado a nivel de función
- **Validación:** Validación de entrada en todos los endpoints

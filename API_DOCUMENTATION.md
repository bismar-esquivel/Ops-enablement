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

### 🎯 Gestión de Leads

#### Sincronizar Leads de Campaña Específica

```http
POST /sync-campaign-leads/{campaignId}
```

**Response:**

```json
{
  "success": true,
  "message": "Leads sincronizados exitosamente",
  "data": {
    "campaignId": "campaign_123",
    "totalLeads": 150,
    "syncedLeads": 150,
    "errorCount": 0,
    "success": true,
    "message": "Lead synchronization completed. 150 leads synced."
  }
}
```

#### Sincronizar Leads de Todas las Campañas

```http
POST /sync-all-campaign-leads
```

**Response:**

```json
{
  "success": true,
  "message": "Sincronización de leads completada exitosamente",
  "data": {
    "totalCampaigns": 5,
    "totalLeads": 750,
    "totalSynced": 745,
    "totalErrors": 5,
    "campaignResults": [...],
    "success": true,
    "message": "Lead synchronization completed for 5 campaigns. 745 leads synced."
  }
}
```

#### Obtener Leads de Campaña

```http
GET /campaign-leads/{campaignId}?limit=50&page=1
```

**Query Parameters:**

- `limit` (opcional): Número de leads por página (default: 100)
- `page` (opcional): Número de página (default: 1)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "lead_123",
      "campaignId": "campaign_123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "company": "Example Corp",
      "status": "new",
      "source": "campaign",
      "isSubscribed": true,
      "emailOpened": 2,
      "emailClicked": 1,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

#### Obtener Todos los Leads

```http
GET /leads?limit=50&page=1&status=new&campaignId=campaign_123&source=campaign
```

**Query Parameters:**

- `limit` (opcional): Número de leads por página (default: 100)
- `page` (opcional): Número de página (default: 1)
- `status` (opcional): Filtrar por estado del lead
- `campaignId` (opcional): Filtrar por campaña específica
- `source` (opcional): Filtrar por fuente del lead

#### Obtener Lead por ID

```http
GET /leads/{leadId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "lead_123",
    "campaignId": "campaign_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "company": "Example Corp",
    "jobTitle": "Marketing Manager",
    "website": "example.com",
    "location": "New York",
    "status": "new",
    "source": "campaign",
    "score": 85,
    "isSubscribed": true,
    "emailSent": 5,
    "emailOpened": 2,
    "emailClicked": 1,
    "customFields": {},
    "tags": ["high-value", "engaged"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Obtener Estadísticas de Leads

```http
GET /lead-stats?campaignId=campaign_123
```

**Query Parameters:**

- `campaignId` (opcional): Filtrar estadísticas por campaña específica

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "new": 50,
      "qualified": 75,
      "converted": 25
    },
    "bySource": {
      "campaign": 100,
      "website": 30,
      "referral": 20
    },
    "byLocation": {
      "New York": 45,
      "Los Angeles": 35,
      "Chicago": 30
    },
    "engagement": {
      "subscribed": 140,
      "unsubscribed": 10,
      "opened": 120,
      "clicked": 80
    }
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
    "testConnection",
    "getSyncStats",
    "syncCampaignLeads",
    "syncAllCampaignLeads",
    "getCampaignLeads",
    "getAllLeads",
    "getLeadById",
    "getLeadStats"
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

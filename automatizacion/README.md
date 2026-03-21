# Automatizacion de formulario (n8n)

Implementacion real del flujo solicitado:

1. Recibe formulario por webhook (`POST /webhook/contact-form`).
2. Guarda datos en Google Sheets.
3. Envia email de confirmacion al cliente (Resend).
4. Crea tarea en Notion.

## Estado del entregable

- Flujo actualizado con manejo HTTP real de errores (`400`, `500`, `207`, `200`).
- Estrategia de recuperacion cuando falla email: reintentos + continuidad + alerta en Notion.

## Archivos

- `n8n-contact-form-automation.json`: workflow importable en n8n.
- `.env.example`: variables de entorno requeridas.
- `google-apps-script.gs`: endpoint para escribir en Google Sheets.

## Flujo tecnico

### 1) Entrada

- Nodo `Webhook Contact Form`
- Metodo: `POST`
- Path: `contact-form`
- Modo de respuesta: `Using 'Respond to Webhook' Node`

### 2) Proceso

- Nodo `Process Automation` (Code node):
  - valida `name`, `email`, `message` y opcional `phone`.
  - carga variables de entorno.
  - ejecuta integraciones en orden: Sheets -> Email -> Notion.
  - construye respuesta estandar (`success`, `status`, `message`, `integrations`, `warnings`).

### 3) Respuesta HTTP

- Nodo `Respond to Webhook`
- `responseCode` dinamico desde `{{$json.status}}`
- body = primer item JSON del nodo anterior.

## Manejo de errores

### Validacion de payload

- Si payload invalido: responde `400`.
- Ejemplo de reglas: nombre minimo 2, email valido, mensaje minimo 5.

### Falla Google Sheets

- Reintentos: 2 intentos totales (1 retry).
- Si sigue fallando: responde `500` y no continua.

### Falla email (Resend)

- Reintentos: 3 intentos totales.
- Si sigue fallando:
  - no corta el flujo,
  - continua con Notion,
  - marca `retryScheduled: true`,
  - agrega warning en respuesta,
  - agrega bloque de alerta en la tarea de Notion,
  - responde `207` (procesado con incidencia).

### Falla Notion

- Reintentos: 2 intentos totales (1 retry).
- Si sigue fallando: responde `500`.

## Configuracion

### Variables de entorno

Crea `automatizacion/.env` desde `automatizacion/.env.example`:

- `GSHEET_WEBHOOK_URL`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NOTION_TOKEN`
- `NOTION_PARENT_PAGE_ID`

`docker-compose.yml` ya monta este `.env` en el servicio `n8n`.

### Google Sheets (Apps Script)

1. Crea un Google Sheet.
2. Ve a `Extensions > Apps Script`.
3. Pega `google-apps-script.gs`.
4. Deploy como Web App:
   - Execute as: tu usuario.
   - Who has access: Anyone with the link.
5. Copia URL en `GSHEET_WEBHOOK_URL`.

### Importar workflow en n8n

1. Abre `http://localhost:5678`.
2. `Workflows > Import from file`.
3. Importa `n8n-contact-form-automation.json`.
4. Activa el workflow.

## Pruebas manuales

### Caso valido

```bash
curl -X POST http://localhost:5678/webhook/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Perez",
    "email": "ana@example.com",
    "phone": "+573001112233",
    "message": "Quiero informacion sobre sus servicios",
    "source": "landing-page"
  }'
```

Respuesta esperada:

- `200` si todo sale bien.
- `207` si falla email pero Sheets y Notion quedan OK.

### Caso invalido

```bash
curl -X POST http://localhost:5678/webhook/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "bad",
    "message": "x"
  }'
```

Respuesta esperada: `400`.

## Evidencia

Las capturas del flujo estan en `automatizacion/evidencia/`:

- Workflow en n8n:
  - [01-nodos.png](./evidencia/01-nodos.png)
  - [02-process.png](./evidencia/02-process.png)
- Pruebas del webhook:
  - [03-request-ok.png](./evidencia/03-request-ok.png)
  - [04-request-failed.png](./evidencia/04-request-failed.png)
- Evidencia de email:
  - [05-emails-resend.png](./evidencia/05-emails-resend.png)
  - [06-email-received.png](./evidencia/06-email-received.png)
- Evidencia de Notion:
  - [07-notion.png](./evidencia/07-notion.png)
  - [08-notion-detail.png](./evidencia/08-notion-detail.png)
- Evidencia de Google Sheets:
  - [09-google-sheet.png](./evidencia/09-google-sheet.png)

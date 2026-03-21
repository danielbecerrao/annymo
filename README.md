# Challenge Tecnico - API + Automatizacion

Este repositorio contiene los dos entregables del reto:

- API REST para contactos (`fullstack/`)
- Flujo de automatizacion en n8n (`automatizacion/`)

## Estructura del repositorio

- `fullstack/`: API REST con NestJS + PostgreSQL.
- `automatizacion/`: workflow n8n (Google Sheets + Resend + Notion).
- `docker-compose.yml`: levanta `fullstack`, `postgres` y `n8n`.
- `annymo/`: coleccion de requests de apoyo.

## Documentacion por modulo

- API: [fullstack/README.md](./fullstack/README.md)
- Automatizacion: [automatizacion/README.md](./automatizacion/README.md)

## Levantar todo localmente (Docker)

### 1) Preparar variables de entorno

```powershell
Copy-Item .\fullstack\.env.example .\fullstack\.env
Copy-Item .\automatizacion\.env.example .\automatizacion\.env
```

Luego completa en `automatizacion/.env`:

- `GSHEET_WEBHOOK_URL`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NOTION_TOKEN`
- `NOTION_PARENT_PAGE_ID`

### 2) Levantar servicios

```powershell
docker compose up --build -d
```

Servicios:

- API: `http://localhost:3000`
- n8n: `http://localhost:5678`
- PostgreSQL: `localhost:5432`

## Verificacion rapida

### API REST

Webhook de contacto:

```bash
curl -X POST http://localhost:3000/contacts/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "source": "landing-page",
    "eventType": "contact-submitted",
    "payload": {
      "fullName": "Ana Becerra",
      "email": "ana@example.com",
      "phone": "3001234567",
      "message": "Hola, quiero informacion sobre sus servicios."
    }
  }'
```

Consultar registros:

```bash
curl http://localhost:3000/contacts
```

### Automatizacion

1. Entra a `http://localhost:5678`.
2. Importa `automatizacion/n8n-contact-form-automation.json`.
3. Activa el workflow.
4. Dispara:

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

## Evidencias de automatizacion

Las capturas estan en `automatizacion/evidencia/`:

- [01-nodos.png](./automatizacion/evidencia/01-nodos.png)
- [02-process.png](./automatizacion/evidencia/02-process.png)
- [03-request-ok.png](./automatizacion/evidencia/03-request-ok.png)
- [04-request-failed.png](./automatizacion/evidencia/04-request-failed.png)
- [05-emails-resend.png](./automatizacion/evidencia/05-emails-resend.png)
- [06-email-received.png](./automatizacion/evidencia/06-email-received.png)
- [07-notion.png](./automatizacion/evidencia/07-notion.png)
- [08-notion-detail.png](./automatizacion/evidencia/08-notion-detail.png)
- [09-google-sheet.png](./automatizacion/evidencia/09-google-sheet.png)

## Tests API

```powershell
cd .\fullstack
npm test
npm run test:e2e
```

# Contacts API (NestJS + PostgreSQL)

API REST con modulo `contacts` que:

- recibe webhook JSON de contacto/evento externo
- valida payload con `class-validator` y `class-transformer`
- guarda datos en PostgreSQL
- expone CRUD completo de contactos

## Requisitos

- Node.js 22+
- npm 10+
- PostgreSQL 16+ (o Docker)

## Instalacion

```bash
npm install
```

## Variables de entorno

Usa un archivo `.env` en la raiz de `fullstack`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fullstack_db
```

Si usas Docker Compose del proyecto, puedes dejar `DB_HOST=postgres`.

## Correr la app

```bash
npm run start:dev
```

Base URL: `http://localhost:3000`

## Validacion global

En `main.ts` se usa `ValidationPipe` global con:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

## Endpoints

- `POST /contacts/webhook` -> recibe webhook JSON y crea contacto
- `POST /contacts` -> crea contacto manual
- `GET /contacts` -> lista contactos
- `GET /contacts/:id` -> busca por id
- `PATCH /contacts/:id` -> actualiza contacto
- `DELETE /contacts/:id` -> elimina contacto

## Manejo de errores (NestJS nativo)

- `400` datos invalidos (DTO + ValidationPipe)
- `404` contacto no encontrado (`NotFoundException`)
- `500` errores inesperados (`InternalServerErrorException`)

## Como probar endpoints

### 1) Webhook de contacto

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

### 2) Listar contactos

```bash
curl http://localhost:3000/contacts
```

### 3) Obtener contacto por id

```bash
curl http://localhost:3000/contacts/<uuid>
```

### 4) Actualizar contacto

```bash
curl -X PATCH http://localhost:3000/contacts/<uuid> \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mensaje actualizado desde PATCH."
  }'
```

### 5) Eliminar contacto

```bash
curl -X DELETE http://localhost:3000/contacts/<uuid> -i
```

## Ejemplos Postman

### Crear webhook

- Method: `POST`
- URL: `http://localhost:3000/contacts/webhook`
- Body (raw JSON):

```json
{
  "source": "landing-page",
  "eventType": "contact-submitted",
  "payload": {
    "fullName": "Ana Becerra",
    "email": "ana@example.com",
    "phone": "3001234567",
    "message": "Hola, quiero informacion sobre sus servicios."
  }
}
```

### Payload invalido (400)

- Method: `POST`
- URL: `http://localhost:3000/contacts/webhook`
- Body (raw JSON):

```json
{
  "source": "landing-page",
  "eventType": "contact-submitted",
  "payload": {
    "fullName": "A"
  },
  "extraField": true
}
```

### Obtener por id

- Method: `GET`
- URL: `http://localhost:3000/contacts/{{id}}`

## Tests (Jest)

```bash
npm test
npm run test:e2e
```

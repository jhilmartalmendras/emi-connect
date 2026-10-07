# Instalación de EMI Connect

## Requisitos
- **Node.js** >= 18.0.0 (recomendado 24.15.0)
- **npm** >= 11.12.1 (o equivalente)
- **MongoDB** 8.3+ corriendo como servicio en `mongodb://127.0.0.1:27017/emi_connect`
- **mongosh** disponible en el `PATH` (opcional, útil para administración)

## Clonar y preparar

```bash
git clone <repositorio>
cd emi-connect
```

## Backend

```bash
cd backend

# 1) Instalar dependencias
npm install

# 2) (Opcional) Crear un .env personalizado a partir del ejemplo
cp .env.example .env
# Editar .env: corrige MONGODB_URI, CORREO_EMISOR, CORREO_CONTRASENA, JWT_SECRETO, etc.

# 3) Levantar la base de datos MongoDB
#    (MongoDB debe estar ejecutandose como servicio)

# 4) Crear el administrador inicial (facultativo, para acceder a /administracion)
npm run crear-admin

# 5) Opciones de arranque
npm run iniciar           # modo producción (sin autorecarga)
npm run desarrollo        # modo desarrollo con nodemon

# 6) Ejecutar pruebas
npm run pruebas           # 41 pruebas (node --test "src/pruebas/*.test.js")
```

## Frontend

```bash
cd frontend

# 1) Instalar dependencias
npm install

# 2) (Opcional) Crear un .env para apuntar el frontend (no es obligatorio en dev,
#    porque el FRONTEND_URL del backend ya define el origen permitido)
cp .env.example .env

# 3) Arrancar el servidor de desarrollo
npm run desarrollo          # Vite -> http://localhost:5173

# 4) Compilar para produccion
npm run construir           # salida en dist/
npm run previsualizar       # preview local de la compilacion
```

## Correo electrónico
- El envío de correos (verificación y recuperación) usa Nodemailer.
- En **modo desarrollo** se activa `CORREO_MODO_DESARROLLO=true` (o se deja sin contraseña): los códigos se imprimen en la consola (`backend/servidor.log`), nunca se envían por SMTP.
- Para producción, definir `CORREO_EMISOR` y `CORREO_CONTRASENA` (Gmail SMTP: `smtp.gmail.com:587` con STARTTLS).

## Verificar que funciona

```bash
# Backend
curl http://localhost:4000/api/salud
# { "exito": true, "mensaje": "El servicio de EMI Connect esta activo.", "datos": { ... } }

# Frontend
curl -I http://localhost:5173/
# HTTP/1.1 200 OK
```

## Variables de entorno clave (backend)

| Variable | Por defecto | Descripción |
|---|---|---|
| `PUERTO` | `4000` | Puerto del API |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/emi_connect` | Cadena de conexión |
| `JWT_SECRETO` | `secreto_de_desarrollo_no_usar_en_produccion` | Secreto de JWT |
| `JWT_EXPIRACION` | `7d` | Expiración del token |
| `DOMINIO_INSTITUCIONAL` | `@est.emi.edu.bo` | Dominio exigido para el registro |
| `CORREO_EMISOR` | `dtorricof@est.emi.edu.bo` | Cuenta emisora de correo |
| `CORREO_CONTRASENA` | (vacía) | Contraseña de la cuenta |
| `CORREO_MODO_DESARROLLO` | `false` | Si está activo, los códigos se imprimen en consola |
| `FRONTEND_URL` | `http://localhost:5173` | URL del frontend (CORS y Socket.IO) |
| `ENTORNO` | `desarrollo` | `produccion` para producción |

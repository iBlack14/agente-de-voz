# Usa una imagen de Node.js ligera como base
FROM node:20-slim

# Instala dependencias necesarias para algunas librerías de Node
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Instala dependencias (incluyendo las de producción)
RUN npm install --omit=dev

# Copia el resto del código
COPY . .

# Expone el puerto esperado por el dashboard/health checks
# (si cambias PORT en runtime, ajusta también el mapeo de puertos del host/panel)
EXPOSE 3121

# Healthcheck interno para evitar reinicios por configuración de puerto incorrecta
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3121) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Script de inicio
CMD ["node", "server.js"]

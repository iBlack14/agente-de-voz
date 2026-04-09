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

# Expone el puerto que usa tu aplicación
EXPOSE 3211

# Script de inicio
CMD ["node", "server.js"]

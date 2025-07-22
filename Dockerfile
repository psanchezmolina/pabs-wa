# Usa nodo LTS slim
FROM node:20-alpine

# Directorio de la app
WORKDIR /usr/src/app

# Copiar package y lock
COPY package.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Puerto
EXPOSE 3000

# Comando de arranque
CMD ["npm", "start"]

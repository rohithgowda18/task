# Backend service for todo app
FROM node:20-bullseye
WORKDIR /app

# Install dependencies first to leverage Docker layer cache
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

ENV PORT=5000
EXPOSE 5000
CMD ["node", "index.js"]

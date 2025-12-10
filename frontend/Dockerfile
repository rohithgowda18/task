# Build stage
FROM node:20-bullseye AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Set API URL at build time (default to backend service inside compose)
ARG REACT_APP_API_URL=http://backend:5000
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copy source and build
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:1.25-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

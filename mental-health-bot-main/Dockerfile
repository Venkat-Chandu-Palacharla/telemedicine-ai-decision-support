# TeleMedicine AI Frontend (React + Vite)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve static build with Nginx
FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
# SPA fallback to index.html for client-side routing
RUN sed -i 's/index  index.html;/try_files $uri $uri\/ \/index.html;/' /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

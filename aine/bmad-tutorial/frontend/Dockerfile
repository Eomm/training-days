# Stage 1: Build Vite app
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root tsconfig (frontend/tsconfig*.json extend ../tsconfig.base.json)
COPY tsconfig.base.json ./

# Copy package files and install dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy all frontend source files
COPY frontend ./frontend

# VITE_API_URL must be a build ARG — Vite bakes it into the JS bundle at build time
# docker-compose passes this via build.args; it is NOT a runtime env var
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

# Build: runs tsc -b && vite build → outputs to frontend/dist/
RUN cd frontend && npm run build

# Stage 2: Production — serve with nginx
FROM nginx:alpine AS production

# Copy built static files to nginx web root
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy SPA-aware nginx config (replaces default.conf)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

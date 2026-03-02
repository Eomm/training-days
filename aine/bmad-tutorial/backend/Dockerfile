# Stage 1: Build TypeScript source
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root tsconfig (backend/tsconfig.json extends ../tsconfig.base.json)
COPY tsconfig.base.json ./

# Copy backend package files and install ALL dependencies (including devDependencies for tsc)
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy TypeScript config and source
COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src

# Compile TypeScript → dist/
# rewriteRelativeImportExtensions rewrites .ts imports to .js in output (prod)
RUN cd backend && npm run build

# Stage 2: Production image
FROM node:22-alpine AS production
WORKDIR /app

# Install ONLY production dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/backend/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]

# ================================================================
#  Dockerfile — FlowApp Backend
#  Multi-stage build: deps → builder → production
# ================================================================

# ── Stage 1: Install dependencies ────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first — layer-cache npm install
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force


# ── Stage 2: Production image ────────────────────────────────────
FROM node:20-alpine AS production

# Security: don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY src/      ./src/
COPY migrations/ ./migrations/

# Copy package.json for version info (no devDependencies)
COPY package.json ./

# Create logs directory with correct ownership
RUN mkdir -p logs && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# App runs on this port (must match PORT env var)
EXPOSE 4000

# Health check — hits /health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Default: start the API server
# Override CMD in docker-compose to run the worker instead
CMD ["node", "src/server.js"]
# =============================================================================
# NyayaSetu API — Multi-stage Docker Build
# =============================================================================
# Stage 1: Build the TypeScript application with all workspace dependencies.
# Stage 2: Produce a minimal production image for GCP Cloud Run.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

LABEL maintainer="NyayaSetu Team"
LABEL description="Build stage for the NyayaSetu API backend"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy all package and app manifests for dependency resolution
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/safety-layer/package.json packages/safety-layer/package.json
COPY packages/jurisdiction/package.json packages/jurisdiction/package.json
COPY packages/legal-rag/package.json packages/legal-rag/package.json
COPY packages/prompts/package.json packages/prompts/package.json
COPY apps/api/package.json apps/api/package.json

# Install all dependencies (including workspace packages)
RUN pnpm install --frozen-lockfile

# Copy source code for all workspace packages the API depends on
COPY packages/shared-types/ packages/shared-types/
COPY packages/safety-layer/ packages/safety-layer/
COPY packages/jurisdiction/ packages/jurisdiction/
COPY packages/legal-rag/ packages/legal-rag/
COPY packages/prompts/ packages/prompts/

# Copy API source code
COPY apps/api/ apps/api/

# Build all workspace packages and the API
RUN pnpm --filter @nyayasetu/shared-types build && \
    pnpm --filter @nyayasetu/safety-layer build && \
    pnpm --filter @nyayasetu/jurisdiction build && \
    pnpm --filter @nyayasetu/legal-rag build && \
    pnpm --filter @nyayasetu/prompts build && \
    pnpm --filter @nyayasetu/api build

# ---------------------------------------------------------------------------
# Stage 2 — Production
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

LABEL maintainer="NyayaSetu Team"
LABEL description="NyayaSetu API — legal information platform backend"
LABEL org.opencontainers.image.source="https://github.com/nyayasetu/nyayasetu"

# Install pnpm for workspace resolution in production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root configuration
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Copy built workspace packages (dist + package.json for each)
COPY --from=builder /app/packages/shared-types/dist packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json packages/shared-types/package.json

COPY --from=builder /app/packages/safety-layer/dist packages/safety-layer/dist
COPY --from=builder /app/packages/safety-layer/package.json packages/safety-layer/package.json

COPY --from=builder /app/packages/jurisdiction/dist packages/jurisdiction/dist
COPY --from=builder /app/packages/jurisdiction/package.json packages/jurisdiction/package.json

COPY --from=builder /app/packages/legal-rag/dist packages/legal-rag/dist
COPY --from=builder /app/packages/legal-rag/package.json packages/legal-rag/package.json

COPY --from=builder /app/packages/prompts/dist packages/prompts/dist
COPY --from=builder /app/packages/prompts/package.json packages/prompts/package.json

# Copy built API application
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Cloud Run expects the application to listen on the port defined by PORT env var
ENV NODE_ENV=production
ENV API_PORT=3001
ENV API_HOST=0.0.0.0

EXPOSE 3001

# Run the API server
CMD ["node", "apps/api/dist/index.js"]

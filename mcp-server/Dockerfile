# Civil Rights History Project — Remote MCP Server
#
# Multi-stage build: node 20-alpine for both build and runtime, with the
# dependency install isolated in its own layer so subsequent rebuilds
# from source-only changes don't re-fetch every npm package.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# package-lock.json is optional; copy is permissive so the build works
# either with `npm ci` (locked) or with `npm install` (unlocked).
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for production safety. Alpine's default 'node' user
# (UID 1000) already exists in the base image.
USER node

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node server.mjs ./

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Health check for the StreamableHTTP transport's underlying Express
# server. The /healthz endpoint is wired in server.mjs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider --quiet http://127.0.0.1:3001/healthz || exit 1

CMD ["node", "server.mjs"]

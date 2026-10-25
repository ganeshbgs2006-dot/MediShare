# Node.js 20 Alpine Linux base for minimal attack surface
FROM node:20-alpine AS base

# Install dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root application user for defense-in-depth
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package definitions
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Assign ownership to non-root user
RUN chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Dumb-init ensures graceful SIGTERM/SIGINT shutdown handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]

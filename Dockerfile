FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port Cloud Run expects
EXPOSE 8080

# Run as non-root user for security
USER node

# Start the application
CMD ["node", "server/index.js"]

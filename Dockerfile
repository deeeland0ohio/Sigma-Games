# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dev and production dependencies for compilation
RUN npm ci

# Copy the rest of the source code
COPY . .

# Run the build script (Vite bundling + server compilation to dist/server.cjs)
RUN npm run build

# Stage 2: Clean production image
FROM node:20-slim AS runner

WORKDIR /app

# Define production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency files and build output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies to keep the image as tiny as possible
RUN npm ci --only=production

# Expose port 3000
EXPOSE 3000

# Run the production bundle
CMD ["npm", "run", "start"]

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
# The mounted secret files are owned by the host user (compose sets user:).
# Default uid 1000 matches the node image; compose overrides it explicitly.
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]

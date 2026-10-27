# AlgoMentor AI backend — production image
#
# The code execution worker (`codeRunnerWorker.cjs`) must sit at the package
# root: `dist/services/codeRunner.js` resolves it as `../../codeRunnerWorker.cjs`.

# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    LOCAL_STORE_PATH=/app/data/local-store.json
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY codeRunnerWorker.cjs ./

# Durable fallback store for attempts/revision when migrations 003–005 are absent.
# Mount a volume here to keep learner data across container restarts.
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]

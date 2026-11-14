# Skill Check web app: production image (Next.js standalone server)
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values so the build can load modules; real ones come from the server's .env at runtime.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build BETTER_AUTH_SECRET=build npm run build \
 && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]

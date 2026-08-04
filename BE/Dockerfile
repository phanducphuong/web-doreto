FROM node:20-alpine AS builder
WORKDIR /app
# pnpm-workspace.yaml chứa allowBuilds — bắt buộc để pnpm build bcrypt/sharp/prisma engines
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
# Sinh Prisma Client theo schema rồi mới build Nest
RUN npx prisma generate && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy nguyên node_modules từ builder (đã có Prisma Client + native modules build sẵn)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080
ENV PORT=8080

CMD ["node", "dist/main.js"]

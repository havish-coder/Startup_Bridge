# Backend container — Express + Prisma
FROM node:20-alpine

WORKDIR /app

# Install deps first for layer caching. Keep dev deps: the Prisma CLI
# (a devDependency) is needed for `prisma generate` and `migrate deploy`.
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 4000

# Apply pending migrations, then start. `migrate deploy` is the production-safe
# command (no prompts, no schema drift) — never use `migrate dev` here.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

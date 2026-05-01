# Stage 1: Build
FROM node:20-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./

COPY packages/ui ./packages/ui
COPY packages/owner ./packages/owner

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @qrmenu/owner build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/packages/owner/dist /usr/share/nginx/html
COPY packages/owner/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build
FROM node:20-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./

COPY packages/ui ./packages/ui
COPY packages/admin ./packages/admin

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @qrmenu/admin build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/packages/admin/dist /usr/share/nginx/html
COPY packages/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/dist/onboardiq-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

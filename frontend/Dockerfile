# Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm config set strict-dep-builds false && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/dist/onboardiq-frontend/browser /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Filter envsubst so internal Nginx variables ($host, $uri, etc.) are untouched
ENV NGINX_ENVSUBST_FILTER='BACKEND_URL'
ENV BACKEND_URL=http://backend:8000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

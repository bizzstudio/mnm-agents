# ============================================================================
#  mnm-agents — React 18 + Vite SPA → nginx
#  משתני VITE_* נצרבים בזמן ה-build (build args).
# ============================================================================

# ---------- שלב build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

ARG VITE_APP_API_BASE_URL
ARG VITE_APP_API_SOCKET_URL
ARG VITE_BACKEND_PROXY
ENV VITE_APP_API_BASE_URL=$VITE_APP_API_BASE_URL \
    VITE_APP_API_SOCKET_URL=$VITE_APP_API_SOCKET_URL \
    VITE_BACKEND_PROXY=$VITE_BACKEND_PROXY

RUN npm run build

# ---------- שלב serve ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

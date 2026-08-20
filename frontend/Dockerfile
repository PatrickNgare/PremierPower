# --- build ---------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Demo mode is opt-in at build time. The API base stays the default same-origin
# /api, which nginx proxies to the api service — so no host URL is baked in.
ARG VITE_DEMO=""
ENV VITE_DEMO=$VITE_DEMO
RUN npm run build

# --- serve ---------------------------------------------------------------
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

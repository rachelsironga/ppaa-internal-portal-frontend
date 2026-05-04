# Override via compose build.args / .env (DOCKER_NODE_IMAGE / DOCKER_NGINX_IMAGE) or --build-arg.
# Defaults use mirror.gcr.io (Google mirror of Docker Official Images). Set DOCKER_* to ECR or Hub if needed.

ARG NODE_IMAGE=mirror.gcr.io/library/node:18-alpine
ARG NGINX_IMAGE=mirror.gcr.io/library/nginx:alpine

# ---- Stage 1: Build the React app ----
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy rest of the source and build
COPY . .
RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM ${NGINX_IMAGE}

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

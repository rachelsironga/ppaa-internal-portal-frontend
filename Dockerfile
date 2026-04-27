# Override bases in `.env` (DOCKER_NODE_IMAGE / DOCKER_NGINX_IMAGE) or pass --build-arg.
# Defaults target AWS Public ECR (Docker Official Images mirror) so builds work when
# registry-1.docker.io / auth.docker.io do not resolve. Use Hub explicitly if you prefer:
#   DOCKER_NODE_IMAGE=node:18-alpine
#   DOCKER_NGINX_IMAGE=nginx:alpine

ARG NODE_IMAGE=public.ecr.aws/docker/library/node:18-alpine
ARG NGINX_IMAGE=public.ecr.aws/docker/library/nginx:alpine

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

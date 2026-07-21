# Stage 1: Build the React/Vite application and compile vite source code into static html/js assets (dist/)
# AS build gives this stage a name

FROM node:20-alpine AS build

# Set working directory, Docker automatically does cd /app for future
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the production frontend, creates the static bundle in /app/dist
RUN npm run build

# /app/dist
# ├── index.html
# └── assets/
#     ├── index-abc123.js
#     └── index-xyz456.css


# Stage 2: Serve the production application, using a lightweight nginx server to server static assets (htms/js/css), discarding node.js and node_modules
FROM nginx:alpine

# Copy the compiled static Vite files from Stage 1
# COPY --from=<stage-name> <source> <destination>

# Nginx Container
# └── /usr/share/nginx/html
#     ├── index.html
#     └── assets/
#         ├── app.js
#         └── app.css

COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx's default HTTP port
EXPOSE 80

# Keep Nginx running in the foreground
CMD ["nginx", "-g", "daemon off;"]
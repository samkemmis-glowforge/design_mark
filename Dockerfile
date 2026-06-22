# Design Mark — remote MCP server (render.com / any Docker host)
# Ubuntu-24.04-based Node to match the environment Chromium is proven on, with the
# system libs @sparticuz/chromium needs to run headless.
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation fontconfig \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
    libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 \
    libxfixes3 libxkbcommon0 libxrandr2 libdrm2 libxshmfence1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (cache layer). NODE_ENV unset here so tsx (runtime) installs.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p output

ENV NODE_ENV=production
# Render injects PORT + RENDER_EXTERNAL_URL; the server reads both.
EXPOSE 8787
CMD ["npm", "run", "mcp"]

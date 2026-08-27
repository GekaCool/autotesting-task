# Must match the @playwright/test version in package.json exactly, otherwise
# the browsers baked into this image won't match what the npm package expects.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app

# Copied separately so this layer only rebuilds when dependencies change.
COPY package*.json ./
RUN npm ci

COPY . .

# --host 0.0.0.0 is required for the report server to be reachable through
# Docker's port mapping at all; open http://localhost:9323 on the host to view it.
EXPOSE 9323
CMD ["sh", "-c", "npx playwright test; npx playwright show-report --host 0.0.0.0"]

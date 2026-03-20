FROM node:20-alpine

WORKDIR /app

COPY backend-services/package*.json ./backend-services/
COPY mcp-server/package*.json ./mcp-server/

RUN cd backend-services && npm install --production
RUN cd mcp-server && npm install --production

COPY backend-services ./backend-services
COPY mcp-server ./mcp-server

WORKDIR /app/backend-services

CMD ["node", "src/index.js"]

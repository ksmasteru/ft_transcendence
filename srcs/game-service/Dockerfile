FROM node:20

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g prisma@6

# Copy package files first for better Docker layer caching
COPY tools/package*.json ./

EXPOSE 9090 4003

CMD ["sh", "-c", "npm install && npx prisma generate && npm run dev"]


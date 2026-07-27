FROM node:20

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g prisma@6

EXPOSE 4001

CMD ["sh", "-c", "npm install && npx prisma db push && npx prisma generate && npm run dev"]

# CMD ["tail", "-f", "/dev/null"]
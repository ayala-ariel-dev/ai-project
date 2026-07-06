FROM node:20

WORKDIR /app

# העתק רק package.json כדי לזרז את ההתקנות
COPY package*.json ./
RUN npm install

# העתק את שאר הקבצים כולל .env
COPY . .

EXPOSE 3001
CMD ["node", "src/server.js"]

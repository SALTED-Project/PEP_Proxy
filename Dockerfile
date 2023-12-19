FROM node:19.2.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY config.json .
COPY keycloak.json .
COPY server.js .

CMD ["node", "server.js"]


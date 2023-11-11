FROM node:18-alpine

RUN mkdir -p /app

WORKDIR /app/
RUN mkdir -p core
RUN mkdir -p swagger

WORKDIR /app/swagger/
COPY ./swagger .
RUN npm install

WORKDIR /app/core/
COPY ./core .

WORKDIR /app/
COPY ./package.json .
COPY ./tsconfig.json .
COPY ./.env .
RUN npm config set registry http://registry.npmjs.org/
RUN npm install

WORKDIR /app/swagger
RUN npm run build

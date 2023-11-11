FROM node:18-alpine

RUN mkdir -p /app

WORKDIR /app/
RUN mkdir -p gateway

WORKDIR /app/gateway/
COPY ./gateway .
RUN npm install

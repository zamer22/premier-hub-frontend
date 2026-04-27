FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

ARG VITE_API_URL
ARG VITE_APP_URL
ARG VITE_SUPABASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

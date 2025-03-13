FROM node:18-alpine

WORKDIR /server

# Copy the package file over
COPY package*.json ./

# tsconfig definitions
COPY tsconfig*.json ./

# Copy the entire app source tree
COPY . .

RUN apk add --no-cache openssl

RUN npm install --legacy-peer-deps --frozen-lockfile

# ALLnet
EXPOSE 80
# Mucha
EXPOSE 10082
# Service
EXPOSE 9002

# Compile the application source code
RUN npx prisma generate
RUN npm run build_protos
RUN npx tsc

# Entrypoint
CMD ["node", "dist"]

ENV BAYSHORE_DATA_PATH /data
COPY server_wangan.key server_wangan.crt /data/
# Copy game configuration file
COPY config.json .
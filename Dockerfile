FROM node:18-alpine

WORKDIR /server

# Copy the entire app source tree
COPY package.json package-lock.json convert_game_protos.js tsconfig.json tsconfig.proto.json .npmrc ./
COPY src ./src
COPY prisma ./prisma

RUN apk add --no-cache openssl

RUN npm install --frozen-lockfile

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

COPY server_wangan.key server_wangan.crt /server/

# Copy game configuration file
COPY config.json .
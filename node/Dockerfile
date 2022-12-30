FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

RUN npm run compile

ENV NODE_ENV=production
ENV TZ=UTC

CMD [ "node", "--max_old_space_size=3000", "--unhandled-rejections=strict", "--require=./tsconfig-paths-bootstrap.js", "dist/index.js" ]
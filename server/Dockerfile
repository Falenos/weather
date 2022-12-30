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

ENV PORT=3030
EXPOSE 3030

HEALTHCHECK --interval=2m --timeout=5s \
  CMD curl -f http://localhost:3030/ || exit 1

ENV NODE_ENV=production
ENV TZ=UTC
CMD [ "node", "--max_old_space_size=1500","--trace-uncaught", "lib/index.js" ]
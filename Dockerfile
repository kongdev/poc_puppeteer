FROM node:16.15.0-slim
RUN mkdir -p /usr/src/app
WORKDIR /usr/src

RUN apt-get update  && \
    apt-get install -y wget gnupg && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install -y google-chrome-stable libxss1 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY package.json .
RUN npm install
COPY . .

RUN npm run build
EXPOSE 3000
CMD ["npm","start"]
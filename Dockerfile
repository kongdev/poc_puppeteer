FROM ghcr.io/puppeteer/puppeteer:18.2.1

WORKDIR /home/pptruser




COPY --chown=pptruser package*.json .
RUN npm install
COPY --chown=pptruser . .

RUN npm run build
EXPOSE 3000
CMD ["npm","start"]
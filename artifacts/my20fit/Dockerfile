FROM node:22-alpine

RUN npm install -g pnpm@9.15.0 serve

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/my20fit run build

EXPOSE 3000

CMD ["serve", "-s", "artifacts/my20fit/dist/public", "-l", "3000"]

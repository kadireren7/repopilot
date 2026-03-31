import { TechStack, TemplateContext } from "../types/generation";

export function getDockerfileTemplate(stack: TechStack, _context: TemplateContext): string {
  if (stack === "Python") {
    return `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
`;
  }

  if (stack === "Go") {
    return `FROM golang:1.23-alpine AS build
WORKDIR /app
COPY . .
RUN go build -o app .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/app ./app
CMD ["./app"]
`;
  }

  return `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
`;
}

export function getDockerIgnoreTemplate(): string {
  return `node_modules
dist
build
.git
.env
npm-debug.log
`;
}

export function getGitHubActionsTemplate(_stack: TechStack): string {
  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test --if-present
`;
}

export function getEnvExampleTemplate(_stack: TechStack): string {
  return `# Environment variables
NODE_ENV=development
PORT=3000
`;
}

import { TechStack, TemplateContext } from "../types/generation";

export function getDockerfileTemplate(stack: TechStack, context: TemplateContext): string {
  if (stack === "Python") {
    return `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
COPY . .
ENV PYTHONUNBUFFERED=1
CMD ["python", "main.py"]
`;
  }

  if (stack === "Go") {
    return `FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app .

FROM alpine:3.20
WORKDIR /app
RUN adduser -D appuser
USER appuser
COPY --from=build /out/app ./app
CMD ["./app"]
`;
  }

  if (stack === "Rust") {
    const bin = sanitizeBinaryName(context.projectName);
    return `FROM rust:1.83-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo build --release
# Update CMD if [package].name differs from "${bin}"
CMD ["./target/release/${bin}"]
`;
  }

  if (stack === "Java") {
    return `FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY . .
RUN chmod +x mvnw gradlew 2>/dev/null || true
RUN ./mvnw -q -DskipTests package || mvn -q -DskipTests package || ./gradlew -q assemble || true
EXPOSE 8080
CMD ["sh", "-c", "exec java -jar $(ls /app/target/*.jar /app/build/libs/*.jar 2>/dev/null | head -n1)"]
`;
  }

  if (stack === "Next.js") {
    return `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \\
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \\
    else npm ci; fi

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build || yarn build || pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
`;
  }

  return `FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \\
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \\
    else npm ci; fi
COPY . .
RUN npm run build --if-present
EXPOSE 3000
CMD ["npm", "start"]
`;
}

function sanitizeBinaryName(projectName: string): string {
  return projectName.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() || "app";
}

export function getDockerIgnoreTemplate(): string {
  return `node_modules
dist
build
target
.git
.env
.env.*
!.env.example
npm-debug.log
coverage
.turbo
.next
`;
}

export function getGitHubActionsTemplate(stack: TechStack): string {
  if (stack === "Python") {
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
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt || pip install .
      - run: pytest -q || python -m pytest -q || true
`;
  }

  if (stack === "Go") {
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
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
      - run: go test ./...
`;
  }

  if (stack === "Rust") {
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
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test
      - run: cargo clippy -- -D warnings
`;
  }

  if (stack === "Java") {
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
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
      - name: Test with Maven or Gradle
        run: |
          if [ -f pom.xml ]; then ./mvnw -B test || mvn -B test; fi
          if [ -f gradlew ]; then chmod +x gradlew && ./gradlew test; fi
`;
  }

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
      - run: npm ci || yarn install --frozen-lockfile || pnpm i --frozen-lockfile
      - run: npm test --if-present || yarn test --if-present || pnpm test --if-present
`;
}

export function getEnvExampleTemplate(stack: TechStack): string {
  if (stack === "Python") {
    return `# Python
PYTHONUNBUFFERED=1
PORT=8000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
`;
  }
  if (stack === "Go" || stack === "Rust") {
    return `# Server
HOST=0.0.0.0
PORT=8080
RUST_LOG=info
`;
  }
  if (stack === "Java") {
    return `# JVM
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev
`;
  }
  return `# Environment variables
NODE_ENV=development
PORT=3000
`;
}

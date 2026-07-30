# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build the Spring Boot backend, with the SPA baked into static ----
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/ ./
COPY --from=frontend /fe/dist/ ./src/main/resources/static/
RUN mvn -q -s settings-central.xml -DskipTests clean package

# ---- Stage 3: slim runtime ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/cce-backend-0.1.0.jar app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
# Let the JVM use the machine's memory allotment.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]

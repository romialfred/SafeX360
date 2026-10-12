# syntax=docker/dockerfile:1.7
#
# Image Eureka-Server. Construite par deploy/vps/docker-compose.yml.
# Étape 1 : compilation Maven (cache ~/.m2 partagé entre builds via BuildKit).
# Étape 2 : JRE 17 seul, utilisateur non root, curl pour le healthcheck.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY src src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests package \
 && cp target/Eureka-Server-0.0.1-SNAPSHOT.jar /app.jar

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --home-dir /home/safex --uid 10001 safex \
 && install -d -o safex -g safex /app
WORKDIR /app
COPY --from=build --chown=safex:safex /app.jar /app/app.jar
USER safex
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

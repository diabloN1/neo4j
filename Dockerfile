FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY . .

ARG SERVICE

RUN test -n "$SERVICE" \ 
        && mvn -B -pl "$SERVICE" -am -DskipTests package


FROM eclipse-temurin:21-jre
WORKDIR /app

ARG SERVICE
ARG APP_PORT
ENV APP_PORT=${APP_PORT}

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /workspace/${SERVICE}/target/${SERVICE}-0.0.1-SNAPSHOT.jar app.jar

USER 10001:10001

EXPOSE ${APP_PORT}

HEALTHCHECK --interval=30s \
    --timeout=5s \
    --start-period=40s \
    --retries=3 \
    CMD curl -fsS http://localhost:${APP_PORT}/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
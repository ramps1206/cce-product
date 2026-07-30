#!/bin/sh
set -e

# Fly Postgres (and most managed Postgres) expose a single DATABASE_URL like
#   postgres://user:pass@host:5432/dbname?params
# Spring Boot wants the JDBC URL + username + password separately, so map it.
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
  no_proto="${DATABASE_URL#*://}"          # user:pass@host:5432/db?params
  creds="${no_proto%%@*}"                   # user:pass
  hostportdb="${no_proto#*@}"               # host:5432/db?params
  export SPRING_DATASOURCE_USERNAME="${creds%%:*}"
  export SPRING_DATASOURCE_PASSWORD="${creds#*:}"
  export SPRING_DATASOURCE_URL="jdbc:postgresql://${hostportdb}"
fi

exec java -jar /app/app.jar

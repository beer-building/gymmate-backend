FROM alpine:3.21

ARG PB_VERSION=0.39.3
ARG TARGETARCH

WORKDIR /app

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8090

# start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=./pb_data", "--migrationsDir=./pb_migrations", "--hooksDir=./pb_hooks"]

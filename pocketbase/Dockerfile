# Image PocketBase du site TEC (migrations + hooks du dépôt inclus).
#   docker build -t tec-pocketbase pocketbase/
#   docker run -p 8090:8090 -v tec_pb_data:/pb/pb_data tec-pocketbase
# Les données vivent dans le volume /pb/pb_data (à sauvegarder).
FROM alpine:3.20

ARG PB_VERSION=0.40.6
ARG TARGETARCH=amd64

RUN apk add --no-cache ca-certificates unzip wget \
  && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pb.zip \
  && unzip /tmp/pb.zip pocketbase -d /pb \
  && rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

VOLUME /pb/pb_data
EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations", "--hooksDir=/pb/pb_hooks"]

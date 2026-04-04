FROM golang:1.24-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 go build -o server ./cmd/server

FROM alpine:3.19

RUN apk add --no-cache ca-certificates \
    && wget -qO /app/grpc-health-probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.35/grpc_health_probe-linux-amd64 \
    && chmod +x /app/grpc-health-probe

WORKDIR /app
COPY --from=builder /app/server ./server

EXPOSE 50051

CMD ["./server"]

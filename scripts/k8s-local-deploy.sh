#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

NAMESPACE="meta-tsundr"
K8S_BASE="k8s/base"

# ---- Preflight: check minikube ----
if ! command -v minikube &>/dev/null; then
  echo "ERROR: minikube is not installed."
  echo "  brew install minikube   # macOS"
  echo "  curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 # Linux"
  exit 1
fi

if ! minikube status --format='{{.Host}}' 2>/dev/null | grep -q Running; then
  echo "ERROR: minikube is not running."
  echo "  minikube start --cpus=4 --memory=8192 --driver=docker"
  exit 1
fi

echo "==> minikube is running"

# ---- Point docker to minikube ----
echo "==> Configuring docker env for minikube..."
eval "$(minikube docker-env)"

# ---- Build images inside minikube ----
echo "==> Building web image..."
docker build -t ghcr.io/fffyyyfff/meta-tsundr-next-gen:latest .

if [ -f Dockerfile.agent-service ]; then
  echo "==> Building agent-service image..."
  docker build -t ghcr.io/fffyyyfff/meta-tsundr-agent-service:latest -f Dockerfile.agent-service .
fi

# ---- Apply namespace first ----
echo "==> Applying namespace..."
kubectl apply -f "${K8S_BASE}/namespace.yaml"

# ---- Create secrets with dummy values ----
echo "==> Creating secrets (dummy values for local dev)..."
kubectl create secret generic meta-tsundr-secrets \
  --namespace="${NAMESPACE}" \
  --from-literal=DATABASE_URL="postgresql://meta_tsundr:meta_tsundr_dev@postgres:5432/meta_tsundr" \
  --from-literal=QDRANT_URL="http://qdrant:6333" \
  --from-literal=ANTHROPIC_API_KEY="sk-ant-dummy-local-dev" \
  --from-literal=FIGMA_ACCESS_TOKEN="dummy-figma-token" \
  --from-literal=LINEAR_API_KEY="dummy-linear-key" \
  --from-literal=GITHUB_CLIENT_ID="dummy-github-id" \
  --from-literal=GITHUB_CLIENT_SECRET="dummy-github-secret" \
  --from-literal=NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  --dry-run=client -o yaml | kubectl apply -f -

# ---- Apply manifests in order ----
echo "==> Applying deployments & services..."
kubectl apply -f "${K8S_BASE}/web-deployment.yaml"
kubectl apply -f "${K8S_BASE}/agent-service-deployment.yaml"

echo "==> Applying ingress..."
kubectl apply -f "${K8S_BASE}/ingress.yaml"

echo "==> Applying HPAs..."
kubectl apply -f "${K8S_BASE}/hpa.yaml"

# ---- Wait for rollout ----
echo "==> Waiting for deployments to be ready..."
kubectl rollout status deployment/web -n "${NAMESPACE}" --timeout=120s
kubectl rollout status deployment/agent-service -n "${NAMESPACE}" --timeout=120s

# ---- Summary ----
echo ""
echo "==> Deployment complete!"
echo ""
kubectl get all -n "${NAMESPACE}"
echo ""
echo "Access via:  minikube service web -n ${NAMESPACE} --url"

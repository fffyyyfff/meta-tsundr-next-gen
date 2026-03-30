#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="meta-tsundr"

echo "==> Deleting namespace '${NAMESPACE}' and all resources within it..."
kubectl delete namespace "${NAMESPACE}" --ignore-not-found

echo "==> Cleanup complete."

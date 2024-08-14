# Setup k8s cluster by kind
```
kind create cluster --config kind-cluster/kind-config.yaml --name dev
kind get clusters
```

# Ingress NGINX
```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

# Build and Push Docker image
```
docker build --tag <Docker-Hub-Username>/color-app:1.0.0  .
docker push <Docker-Hub-Username>/color-app:1.0.0
```

# Deploy to k8s
```
kubectl apply -f k8s-manifests/deployment.yml
kubectl apply -f k8s-manifests/service.yml
kubectl apply -f k8s-manifests/ingress.yaml
```

# Development Test (Browse)
```
http://localhost/red/hostname
or
http://localhost/white/hostname
```

# Flux CD
```
brew install fluxcd/tap/flux

export GITHUB_TOKEN=<your-token>
export GITHUB_USER=<your-username>
export GITHUB_REPO=<repo-name>

flux check --pre


flux bootstrap github \
    --owner="${GITHUB_USER}" \
    --repository="${GITHUB_REPO}" \
    --private=false \
    --path=./clusters/cluster1 \
    --personal \
    --token-auth \
    --branch=master
```

## Create a flux secret
```
flux create secret git k8s-fluxcd-secret \
    --url=ssh://git@github.com/${GITHUB_USER}/${GITHUB_REPO}
```

## Add below Deploy key into Github repo(Settings -> Deploy Keys):
```
kubectl get secret k8s-fluxcd-secret -n flux-system -ojson \
    | jq -r '.data."identity.pub"' | base64 -d

```

## Create a flux source:
```
# git clone git@github.com:afshinp-deriv/k8s-fluxcd.git
# cd k8s-fluxcd

flux create source git k8s-fluxcd \
    --url=ssh://git@github.com/${GITHUB_USER}/${GITHUB_REPO} \
    --secret-ref k8s-fluxcd-secret \
    --branch=master \
    --export > ./clusters/cluster1/k8s-fluxcd.yaml

# Verify
flux get source git
cat ./clusters/cluster1/k8s-fluxcd.yaml
```

## Create flux kustomization and push changes into deployment repo(GitOps):
```
flux create kustomization k8s-fluxcd \
  --source=k8s-fluxcd \
  --path=./prod \
  --prune=true \
  --interval=1m \
  --export > ./clusters/cluster1/k8s-fluxcd-kustomization.yaml

git add ./clusters/cluster1/k8s-fluxcd.yaml ./clusters/cluster1/k8s-fluxcd-kustomization.yaml
git commit -m "add k8s-fluxcd source"
git push origin master

# verify
flux reconcile source git simplephone
watch kubectl get -n flux-system gitrepositories
```
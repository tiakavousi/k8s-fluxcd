# Setup k8s cluster by kind
```
kind create cluster --config kind-cluster/kind-config.yaml --name color-app
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

# FluxCD bootstrap
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

## Create a flux secret for flux-system, prod, staging nanespaces:
```
kubectl create secret generic k8s-fluxcd-secret \
    --from-file=identity=/Users/tayebekavousi/.ssh/k8s-fluxcd-key \
    --from-file=identity.pub=/Users/tayebekavousi/.ssh/k8s-fluxcd-key.pub \
    -n flux-system

kubectl create secret generic k8s-fluxcd-secret \
  --from-file=identity=/Users/tayebekavousi/.ssh/k8s-fluxcd-key \
  --from-file=identity.pub=/Users/tayebekavousi/.ssh/k8s-fluxcd-key.pub \
  --from-file=known_hosts=./known_hosts \
  -n prod --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic k8s-fluxcd-secret \
  --from-file=identity=/Users/tayebekavousi/.ssh/k8s-fluxcd-key \
  --from-file=identity.pub=/Users/tayebekavousi/.ssh/k8s-fluxcd-key.pub \
  --from-file=known_hosts=./known_hosts \
  -n staging --dry-run=client -o yaml | kubectl apply -f -
```

## Add below Deploy key into Github repo(Settings -> Deploy Keys):
```
 kubectl get secret k8s-fluxcd-secret -n flux-system -o yaml
 kubectl get secret k8s-fluxcd-secret -n prod -o yaml
 kubectl get secret k8s-fluxcd-secret -n staging -o yaml

```

## Create a flux source in each namespace
```
# git clone git@github.com:afshinp-deriv/k8s-fluxcd.git
# cd k8s-fluxcd

flux create source git k8s-fluxcd \
    --url=ssh://git@github.com/${GITHUB_USER}/${GITHUB_REPO} \
    --secret-ref k8s-fluxcd-secret \
    --branch=master \
    --export > ./clusters/cluster1/gitrepository.yaml


# Verify
flux get source git
cat ./clusters/cluster1/gitrepository.yaml
```

# verify
flux reconcile source git k8s-fluxcd
watch kubectl get -n flux-system gitrepositories
```

## Watch the Kustomization
```
watch flux get kustomizations
```

# Development Test (Browse)
```
http://localhost/prod/hostname
or
http://localhost/staging/hostname
```
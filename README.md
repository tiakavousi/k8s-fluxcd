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

## Create a flux secret for flux-system, prod, qa nanespaces:
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
  -n qa --dry-run=client -o yaml | kubectl apply -f -
```

## Add below Deploy key into Github repo(Settings -> Deploy Keys):
```
 kubectl get secret k8s-fluxcd-secret -n flux-system -o yaml

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

flux create source git k8s-fluxcd-prod \
  --url=ssh://git@github.com/tiakavousi/k8s-fluxcd.git \
  --secret-ref k8s-fluxcd-secret \
  --branch=master \
  --namespace=prod \
  --export > ./clusters/cluster1/prod/gitrepository-prod.yaml

flux create source git k8s-fluxcd\
  --url=ssh://git@github.com/tiakavousi/k8s-fluxcd.git \
  --secret-ref k8s-fluxcd-secret \
  --branch=master \
  --namespace=qa \
  --export > ./clusters/cluster1/qa/gitrepository-qa.yaml

# Verify
flux get source git
cat ./clusters/cluster1/gitrepository.yaml
```

## Create flux kustomization and push changes into deployment repo(GitOps):
```
flux create kustomization k8s-fluxcd-prod \
  --source=k8s-fluxcd \
  --path=./clusters/cluster1/prod \
  --prune=true \
  --interval=1m \
  --namespace=prod \
  --export > ./clusters/cluster1/prod/kustomization-prod.yaml


kubectl apply -f ./clusters/cluster1/prod/kustomization-prod.yaml


flux create kustomization k8s-fluxcd-qa \
  --source=k8s-fluxcd \
  --path=./clusters/cluster1/qa \
  --prune=true \
  --interval=1m \
  --namespace=qa \
  --export > ./clusters/cluster1/qa/kustomization-qa.yaml

kubectl apply -f ./clusters/cluster1/qa/kustomization-qa.yaml

git add ./clusters/cluster1/k8s-fluxcd.yaml ./clusters/cluster1/k8s-fluxcd-kustomization.yaml
git commit -m "add k8s-fluxcd source"
git push origin master

# verify
flux reconcile source git k8s-fluxcd
watch kubectl get -n flux-system gitrepositories
```

# imagerepository
```
kubectl apply -f clusters/cluster1/qa/imagerepository.yml
kubectl get imagerepository -n qa
````

## Watch the Kustomization
```
watch flux get kustomizations
```

# Development Test (Browse)
```
http://localhost/prod/hostname
or
http://localhost/qa/hostname
```
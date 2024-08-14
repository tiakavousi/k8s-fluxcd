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

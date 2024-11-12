# Kubernetes for Dummies

This training day is designed to give you a basic understanding of Kubernetes and how to use it.
I wanted to understand what I'm using at work and I don't fully understand it yet.
At the end of the day, I would like to be able to deploy a simple application to a **Local** Kubernetes cluster
and collect a set of aliases and commands that I can use to interact with the cluster in my day-to-day work.

## What is Kubernetes?

Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.
It groups containers that make up an application into logical units for easy management and discovery.

### Kubernetes Objects

A Kubernetes object is a "record of intent" – once you create the object,
the Kubernetes system will constantly work to ensure that object exists.
By creating an object, you’re effectively telling the Kubernetes system what you want your cluster’s workload
to look like; this is your cluster’s desired state.

There are many different types of objects (`kind` in the `k8n.yaml`), but the most common ones are:

- **Pod**: A group of one or more containers, with shared storage/network, and a specification for how to run the containers.
- **Service**: An abstraction which defines a logical set of Pods and a policy by which to access them.
- **Volume**: A directory which is accessible to the containers in a pod.
- **Namespace**: are virtual clusters backed by the physical cluster.
- **ServiceAccount**: Provides an identity for processes that run in a Pod. It needs a `Role` and `RoleBinding` to be able to access resources.
- **Endpoints**: A way to expose a service to the outside world.

Then, there are also the following controllers that help you manage the lifecycle of your objects:

- **ReplicaSet**: Ensures that a specified number of pod replicas are running at any given time.
- **Deployment**: Describes how to change the current state of the cluster to the desired state.
- **StatefulSet**: Manages the deployment and scaling of a set of Pods, and provides guarantees about the ordering and uniqueness of these Pods.
- **DaemonSet**: Ensures that all (or some) Nodes run a copy of a Pod on all the cluster nodes.
- **Job**: Performs a task and then terminates.
- **ConfigMap**: Allows you to decouple configuration artifacts from image content to keep containerized applications portable.
- **Ingress**: Exposes HTTP and HTTPS routes from outside the cluster to services within the cluster. By default, Kubernetes provides isolation between pods and the outside world. If you want to communicate with a service running in a pod, you have to open up a channel for communication.

### Kubernetes Control Plane

In Kubernetes, the control plane is a set of containers that manage the Kubernetes cluster.
The Control Plane maintains a record of all of the Kubernetes Objects in the system,
and runs continuous control loops to manage the object’s state.
At any given time, the Control Plane’s control loops will respond to changes in the cluster
and work to make the actual state of all the objects in the system match the desired state that you defined.

### Kubernetes Nodes

The Kubernetes nodes are basically worker machines (VMs, physical, bare metal servers, etc) in a cluster running your workloads.
The nodes are controlled by Kubernetes master and are continuously monitored to maintain the desired state of the application.

### Kubernetes Master

As a part of the Kubernetes Control Plane, the Kubernetes master works towards continuously
maintaining the desired state throughout your cluster.
The **`kubectl`** is a CLI tool that allows you to interact with the Kubernetes master through the Kubernetes API.

Most used commands:

```sh
# Lists all nodes in the cluster, showing their status, roles, and versions
kubectl get nodes

# Get the list of namespace's pods filtered by name
kubectl get pods -l name=my-app-live

# Get the list of all pods in the cluster
kubectl get pods --all-namespaces

# Get the list of k8n objects
kubectl get deployments
kubectl get services
kubectl get namespaces
kubectl get configmaps
kubectl get all

# Show detailed information about a resource
kubectl describe pod <pod-name>

# Fetches logs for a specific pod, useful for debugging
kubectl logs <pod-name> -f

# Executes a command inside a running pod. The `-it` option is for interactive commands (e.g., `bash`)
kubectl exec -it <pod-name> -- <command>

# Port-forwarding allows you to access a pod from your local machine
kubectl port-forward <pod-name> <local-port>

# Execute a command in a pod by knowing the app name
kubectl exec --stdin --tty $(kubectl get pods -l name=<my-app> | awk 'NR==2{print $1}') -- echo "hello"

# Applies a configuration from a YAML file to create/update resources
kubectl apply -f <file.yaml>

# Deletes a resource by filename
kubectl delete -f <file.yaml>

# Monitor resource usage and performance characteristics of nodes
kubectl top nodes
kubectl top pods

# Get the list of events in the cluster
kubectl get events
```


## Utility Tools

To easily manage your Kubernetes cluster, you can use the following tools:

- **[`kubectl`](https://kubernetes.io/docs/reference/kubectl/kubectl/)**: The Kubernetes CLI tool that allows you to interact with the Kubernetes master.
- **[`kubectx`](https://github.com/ahmetb/kubectx)**: A utility to switch between Kubernetes contexts.
- **`kubens`**: A utility to switch between Kubernetes namespaces (installed within `kubectx`).

The most used commands are:

```sh
# List all available contexts
kubectx

# Switch to a different context
kubectx <context-name>

# List all available namespaces
kubens

# Switch to a different namespace
kubens <namespace-name>
```


## Deploying a Simple Application

We need to create a simple application that we can deploy to our Kubernetes cluster.
For this, we will create a simple Node.js application that returns a "Hello World" message.

### Creating the cluster

To create a local Kubernetes cluster, we can use **`minikube`**, [**`kind`**](https://kind.sigs.k8s.io/docs/user/quick-start#installation)
or whatever docker-based solution you prefer.
I will use the [Docker Desktop Kubernetes cluster](https://docs.docker.com/desktop/features/kubernetes/).

```sh
# Select the Kubernetes cluster in Docker Desktop
kubectx docker-desktop
```

### Creating the application

Just do it: check the `simple-app/package.json` files.

```sh
cd simple-app/
npm run build
docker inspect hello-node:v1
```

### Deploying the application

```sh
cd simple-app/
# Create the deployment to run the app
kubectl apply -f k8n-deployment.yml
# Create the service to expose the app
kubectl apply -f k8n-service.yml
# Test the app
open http://localhost:3088
# Check the status of the deployment
kubectl get deployments
# Dispose the deployment
kubectl delete -f k8n-service.yml
kubectl delete -f k8n-deployment.yml
```

Now we can play by:

- Creating a namespace: `kubectl apply -f k8n-namespace.yml`
- Redeploying the app with the `metadata.namespace`: `kubectl apply -f k8n-deployment.yml`



## Useful Links

- https://www.freecodecamp.org/news/a-friendly-introduction-to-kubernetes-670c50ce4542/
- https://medium.com/google-cloud/kubernetes-101-pods-nodes-containers-and-clusters-c1509e409e16

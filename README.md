# Setup kubeconfig action

This action create a kubeconfig file in `~/.kube/config` for connecting to the Kubernetes cluster using a specific IAM role.

## Inputs

### `cluster-name`

**Required** The name of the EKS cluster to connect to.

### `cluster-region`

**Required** The AWS region where the EKS cluster is deployed.

### `account-id`

**Required** The AWS account id where the cluster is.

## Example usage

```yaml
uses: airnity/setup-kubeconfig-action@v2
with:
  cluster-name: myEKSCluster
  cluster-region: eu-west-1
  account-id: 123456789101
```

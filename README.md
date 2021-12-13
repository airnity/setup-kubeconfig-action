# Setup kubeconfig action

This action create a kubeconfig file in `~/.kube/config` for connecting to the Kubernetes cluster using a specific IAM role.

## Inputs

### `cluster-name`

**Required** The name of the EKS cluster to connect to.

### `cluster-region`

**Required** The AWS region where the EKS cluster is deployed.

### `cluster-auth-arn`

**Required** The AWS arn of the role assumed to connect to the EKS cluster.

## Example usage

```yaml
uses: airnity/setup-kubeconfig-action@v1
with:
  cluster-name: myEKSCluster
  cluster-region: eu-west-1
  cluster-auth-arn: arn:aws:iam::123456789101:role/myRole
```

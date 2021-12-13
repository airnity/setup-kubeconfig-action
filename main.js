const core = require("@actions/core");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const { EKSClient, DescribeClusterCommand } = require("@aws-sdk/client-eks");

const basePath = path.join(process.env.HOME, ".kube");
const fileName = "config";

async function buildKubeconfig(clusterName, clusterRegion, clusterAuthARN) {
  const eks = new EKSClient({ region: clusterRegion });
  const command = new DescribeClusterCommand({ name: clusterName });

  const results = await eks.send(command);

  const kubeconfig = {
    kind: "Config",
    apiVersion: "v1",
    clusters: [
      {
        cluster: {
          "certificate-authority-data":
            results.cluster.certificateAuthority.data,
          server: results.cluster.endpoint,
        },
        name: clusterName,
      },
    ],
    contexts: [
      {
        context: { cluster: clusterName, user: "eks-user" },
        name: clusterName,
      },
    ],
    "current-context": clusterName,
    users: [
      {
        name: "eks-user",
        user: {
          exec: {
            apiVersion: "client.authentication.k8s.io/v1alpha1",
            args: [
              "--region",
              clusterRegion,
              "eks",
              "get-token",
              "--cluster-name",
              clusterName,
              "--role",
              clusterAuthARN,
            ],
            command: "aws",
          },
        },
      },
    ],
  };

  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

  fs.writeFile(
    path.join(basePath, fileName),
    YAML.stringify(kubeconfig, { indent: 2, indentSeq: false }),
    { mode: 0o600 },
    (err) => {
      // In case of a error throw err.
      if (err) throw err;
    }
  );
}

try {
  const clusterName = core.getInput("cluster-name");
  const clusterRegion = core.getInput("cluster-region");
  const clusterAuthARN = core.getInput("cluster-auth-arn");

  buildKubeconfig(clusterName, clusterRegion, clusterAuthARN);

  console.log("Kubeconfig created in: ", path.join(basePath, fileName));
} catch (error) {
  core.setFailed(error.message);
}

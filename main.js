const core = require("@actions/core");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const { EKSClient, DescribeClusterCommand } = require("@aws-sdk/client-eks");
const {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleCommandInput,
} = require("@aws-sdk/client-sts");

const basePath = path.join(process.env.HOME, ".kube");
const fileName = "config";

async function assumeRole(runnerRegion, accountID) {
  const roleArn = `arn:aws:iam::${accountID}:role/eks-apps-deployer-dev.role`;

  const client = new STSClient({ region: runnerRegion });

  const params = {
    RoleArn: roleArn,
    RoleSessionName: "tmp-session",
  };
  const command = new AssumeRoleCommand(params);

  try {
    const data = await client.send(command);
    // process data.
    return {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
    };
  } catch (error) {
    console.log(error);
    // error handling.
  } finally {
    // finally.
  }
}

async function buildKubeconfig(
  credentials,
  clusterName,
  clusterRegion,
  accountID
) {
  const eks = new EKSClient({
    region: clusterRegion,
    credentials: credentials,
  });
  const command = new DescribeClusterCommand({ name: clusterName });

  const clusterAuthARN = `arn:aws:iam::${accountID}:role/eks-apps-deployer-dev.role`;

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

async function run() {
  try {
    const clusterName = core.getInput("cluster-name");
    const clusterRegion = core.getInput("cluster-region");
    const accountID = core.getInput("account-id");
    const runnerRegion = process.env.AWS_REGION;

    const credentials = await assumeRole(runnerRegion, accountID);

    buildKubeconfig(credentials, clusterName, clusterRegion, accountID);

    console.log("Kubeconfig created in: ", path.join(basePath, fileName));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

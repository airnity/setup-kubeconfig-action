const fs = require("fs");
const path = require("path");

const basePath = path.join(process.env.HOME, ".kube");
const fileName = "config";

try {
  fs.unlinkSync(path.join(basePath, fileName));
  //file removed
  console.log("Kubeconfig deleted");
} catch (err) {
  console.error(err);
}

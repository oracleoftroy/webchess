const args = ["start"];
const opts = { stdio: "inherit", cwd: "www", shell: true };
require("child_process").spawn("npm", args, opts);

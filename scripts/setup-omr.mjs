import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const root = process.cwd();
const isWindows = process.platform === "win32";
const venv = join(root, "backend", ".venv");
const python = join(venv, isWindows ? "Scripts/python.exe" : "bin/python");
const requirements = join(root, "backend", "requirements.txt");
const stamp = join(venv, ".requirements-sha256");
const requirementsHash = createHash("sha256")
  .update(readFileSync(requirements))
  .digest("hex");

function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error || result.status !== 0) {
    console.error(`[omr] ${label} failed.`);
    process.exit(result.status || 1);
  }
}

if (!existsSync(python)) {
  console.log("[omr] Creating the bundled Python environment...");
  mkdirSync(dirname(venv), { recursive: true });
  run(isWindows ? "py" : "python3", ["-m", "venv", venv], "Python environment setup");
}

run(
  python,
  [
    "-c",
    "import sys; raise SystemExit(0 if sys.version_info >= (3, 9) else 'VisionAcademy OMR requires Python 3.9 or newer.')",
  ],
  "Python version check",
);

const installedHash = existsSync(stamp) ? readFileSync(stamp, "utf8").trim() : "";
if (installedHash !== requirementsHash) {
  console.log("[omr] Installing bundled OMR dependencies...");
  run(python, ["-m", "pip", "install", "-r", requirements], "Dependency installation");
  writeFileSync(stamp, requirementsHash);
}

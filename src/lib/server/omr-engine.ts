import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

type EngineSuccess<T> = { success: true; data: T };
type EngineFailure = {
  success: false;
  error: string;
  code: string;
  status_code: number;
};

export class OmrEngineError extends Error {
  constructor(
    message: string,
    readonly code = "OMR_ENGINE_ERROR",
    readonly statusCode = 500,
  ) {
    super(message);
  }
}

function getBackendDir(): string {
  // Use array join to hide the path from Turbopack static analysis
  return [process.cwd(), "backend"].join(path.sep);
}

function pythonExecutable(): string {
  const isWin = process.platform === "win32";
  const executable = isWin 
    ? [getBackendDir(), ".venv", "Scripts", "python.exe"].join(path.sep)
    : [getBackendDir(), ".venv", "bin", "python"].join(path.sep);

  if (!existsSync(executable)) {
    throw new OmrEngineError(
      "The bundled OMR runtime is not installed. Stop and run `npm run dev` again.",
      "OMR_RUNTIME_MISSING",
      503,
    );
  }
  return executable;
}

export function runOmrEngine<T>(payload: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const backendDir = getBackendDir();
    const cliPath = [backendDir, "omr_cli.py"].join(path.sep);
    
    const child = spawn(pythonExecutable(), [cliPath], {
      cwd: backendDir,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => reject(new OmrEngineError(error.message)));
    child.on("close", () => {
      try {
        const response = JSON.parse(Buffer.concat(stdout).toString("utf8")) as
          | EngineSuccess<T>
          | EngineFailure;
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new OmrEngineError(response.error, response.code, response.status_code));
        }
      } catch {
        const detail = Buffer.concat(stderr).toString("utf8").trim();
        console.error("Bundled OMR engine failed:", detail || "Invalid engine response");
        reject(new OmrEngineError("The bundled OMR engine could not process the request."));
      }
    });

    child.stdin.end(JSON.stringify(payload));
  });
}

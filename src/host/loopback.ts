import { createServer, type Server } from "node:http";

export const CALLBACK_OK = "<!doctype html><title>Grok</title><p>Sign-in complete. You can close this window.</p>";
export const CALLBACK_FAIL = "<!doctype html><title>Grok</title><p>Sign-in did not complete. You can close this window and try again.</p>";

export interface LoopbackListener {
  server: Server;
  port: number;
}

export type CallbackResult =
  | { kind: "code"; code: string }
  | { kind: "denied" }
  | { kind: "mismatch" };

export function listenLoopback(): Promise<LoopbackListener> {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("loopback listener has no port"));
        return;
      }
      resolve({
        server,
        port: address.port
      });
    });
  });
}

export function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

export function waitForCallback(
  server: Server,
  expectedState: string,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result: CallbackResult | Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      server.removeListener("request", onRequest);
      if (result instanceof Error) reject(result);
      else resolve(result);
    };
    const onAbort = () => {
      finish(Object.assign(new Error("Sign-in was cancelled."), { code: "ABORT_ERR" }));
    };
    const timer = setTimeout(() => {
      finish(Object.assign(new Error("Sign-in timed out."), { code: "TIMEOUT" }));
    }, timeoutMs);
    const onRequest = (request: any, response: any) => {
      try {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        if (url.pathname !== "/callback") {
          response.writeHead(404, { "content-type": "text/plain" }).end("not found");
          return;
        }
        const state = url.searchParams.get("state");
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        if (state !== expectedState) {
          response.writeHead(400, { "content-type": "text/html; charset=utf-8" }).end(CALLBACK_FAIL);
          finish({ kind: "mismatch" });
          return;
        }
        if (error !== null || code === null || code.length === 0) {
          response.writeHead(400, { "content-type": "text/html; charset=utf-8" }).end(CALLBACK_FAIL);
          finish({ kind: "denied" });
          return;
        }
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(CALLBACK_OK);
        finish({
          kind: "code",
          code
        });
      } catch (error) {
        response.writeHead(400).end();
        finish(error instanceof Error ? error : new Error("invalid callback"));
      }
    };
    if (signal?.aborted === true) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
    server.on("request", onRequest);
  });
}

export function isLoopbackAddress(address?: string): boolean {
  if (typeof address !== "string" || address.length === 0) return false;
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

export function sendJson(res: any, statusCode: number, value: unknown): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    connection: "close"
  }).end(`${JSON.stringify(value)}\n`);
}

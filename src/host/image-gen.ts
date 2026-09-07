import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { createRequire } from "node:module";
import { AttachmentId } from "@deepseek-ai/dsh-attachment";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { isRecord } from "../common/contract.js";
import {
  GROK_IMAGE_GEN_TIMEOUT_MS,
  GROK_IMAGE_GEN_TOOL_NAME,
  GROK_IMAGINE_ASPECT_RATIOS,
  GROK_IMAGINE_BASE_URL,
  GROK_IMAGINE_MODEL
} from "../common/constants.js";
import { GROK_CLI_REQUEST_HEADERS } from "./oauth.js";

const { name: PACKAGE_NAME, version: PACKAGE_VERSION } = createRequire(import.meta.url)("./package.json");
export const GROK_PLUGIN_IDENTITY_HEADER = `${PACKAGE_NAME}/${PACKAGE_VERSION}`;

/** Detect PNG, JPEG, WebP, or GIF from a leading signature. */
export function mediaTypeOf(data: Uint8Array): string | undefined {
  if (
    data.length >= 8 &&
    data[0] === 137 &&
    data[1] === 80 &&
    data[2] === 78 &&
    data[3] === 71 &&
    data[4] === 13 &&
    data[5] === 10 &&
    data[6] === 26 &&
    data[7] === 10
  )
    return "image/png";
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) return "image/jpeg";
  if (data.length >= 6) {
    const signature = String.fromCharCode(...data.subarray(0, 6));
    if (signature === "GIF87a" || signature === "GIF89a") return "image/gif";
  }
  if (
    data.length >= 12 &&
    String.fromCharCode(...data.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...data.subarray(8, 12)) === "WEBP"
  )
    return "image/webp";
  return undefined;
}

/** File extension that matches a sniffed raster type. */
export function extensionOf(mediaType: string): string {
  if (mediaType === "image/jpeg") return "jpg";
  if (mediaType === "image/webp") return "webp";
  if (mediaType === "image/gif") return "gif";
  return "png";
}

function redact(message: string, secret: string): string {
  return secret.length === 0 ? message : message.split(secret).join("[redacted]");
}

function fail(message: string, secret: string): never {
  throw new Error(redact(message, secret));
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0 ? error.message : "network error";
}

function isTransportDrop(error: unknown): boolean {
  return /\bterminated\b|premature close|ECONNRESET|ECONNABORTED|other side closed|fetch failed/i.test(
    errorMessage(error)
  );
}

function describeNetworkFailure(
  error: unknown,
  user: AbortSignal | undefined,
  timeout: { aborted: boolean },
  timeoutMs: number
): string {
  if (user?.aborted) return "Grok Imagine request was cancelled";
  if (timeout.aborted) return `Grok Imagine timed out after ${String(timeoutMs / 1000)}s`;
  if (isTransportDrop(error)) return "Grok Imagine connection dropped while reading the image (undici: terminated)";
  return `Grok Imagine request failed: ${errorMessage(error)}`;
}

function combineSignals(
  user: AbortSignal | undefined,
  timeoutMs: number
): { signal: AbortSignal; timeout: { aborted: boolean }; dispose: () => void } {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (user === undefined) {
    return {
      signal: timeout,
      timeout,
      dispose: () => undefined
    };
  }
  if (typeof (AbortSignal as any).any === "function") {
    return {
      signal: (AbortSignal as any).any([user, timeout]),
      timeout,
      dispose: () => undefined
    };
  }
  const controller = new AbortController();
  const onAbort = () => {
    controller.abort(user.aborted ? user.reason : timeout.reason);
  };
  user.addEventListener("abort", onAbort);
  timeout.addEventListener("abort", onAbort);
  if (user.aborted || timeout.aborted) onAbort();
  return {
    signal: controller.signal,
    timeout,
    dispose: () => {
      user.removeEventListener("abort", onAbort);
      timeout.removeEventListener("abort", onAbort);
    }
  };
}

function requestHeaders(accessToken: string) {
  return {
    ...GROK_CLI_REQUEST_HEADERS,
    "X-Dsh-Plugin": GROK_PLUGIN_IDENTITY_HEADER,
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json"
  };
}

function imagesURL(override?: string): string {
  if (override !== undefined && override.length > 0) return override;
  return "https://api.x.ai/v1/images/generations";
}

function decodeB64(value: string, secret: string): Uint8Array {
  try {
    return Uint8Array.from(Buffer.from(value, "base64"));
  } catch (error) {
    fail(
      `Grok Imagine returned unreadable image data: ${
        error instanceof Error && error.message.length > 0 ? error.message : "invalid base64"
      }`,
      secret
    );
  }
}

async function downloadUrl(
  url: string,
  accessToken: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal
): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      signal
    });
  } catch (error) {
    fail(
      `Grok Imagine image download failed: ${
        error instanceof Error && error.message.length > 0 ? error.message : "network error"
      }`,
      accessToken
    );
  }
  if (!response.ok) fail(`Grok Imagine image download failed with HTTP ${String(response.status)}`, accessToken);
  return new Uint8Array(await response.arrayBuffer());
}

function firstImage(payload: unknown, secret: string) {
  if (!isRecord(payload)) fail("Grok Imagine returned an unparseable body", secret);
  const data = payload["data"];
  if (!Array.isArray(data) || data.length === 0 || !isRecord(data[0])) {
    fail("Grok Imagine returned no image data", secret);
  }
  const row = data[0];
  const b64 = typeof row["b64_json"] === "string" && row["b64_json"].length > 0 ? row["b64_json"] : undefined;
  const url = typeof row["url"] === "string" && row["url"].length > 0 ? row["url"] : undefined;
  const revisedPrompt =
    typeof row["revised_prompt"] === "string" && row["revised_prompt"].length > 0 ? row["revised_prompt"] : undefined;
  return {
    ...(b64 === undefined ? {} : { b64 }),
    ...(url === undefined ? {} : { url }),
    ...(revisedPrompt === undefined ? {} : { revisedPrompt })
  };
}

export async function generateGrokImage(request: {
  accessToken: string;
  prompt: string;
  aspectRatio?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  imagesURL?: string;
  referenceImages?: Array<{ url: string }>;
  signal?: AbortSignal;
}): Promise<{ bytes: Uint8Array; mediaType: string; revisedPrompt?: string }> {
  const prompt = request.prompt.trim();
  if (prompt.length === 0) throw new Error("grok_image_gen prompt must not be empty");
  if (request.aspectRatio !== undefined && !(GROK_IMAGINE_ASPECT_RATIOS as readonly string[]).includes(request.aspectRatio)) {
    throw new Error(`grok_image_gen aspect_ratio must be one of ${GROK_IMAGINE_ASPECT_RATIOS.join(", ")}`);
  }
  const timeoutMs = request.timeoutMs ?? GROK_IMAGE_GEN_TIMEOUT_MS;
  const fetchImpl = request.fetchImpl ?? fetch;
  const isEdit = request.referenceImages !== undefined && request.referenceImages.length > 0;
  // Prompt-triggered resolution: mentioning "2k" in the prompt switches output to 2k (default 1k).
  const wants2k = /\b2k\b/i.test(prompt);
  const body = isEdit
    ? {
        model: GROK_IMAGINE_MODEL,
        prompt,
        n: 1,
        images: request.referenceImages,
        response_format: "b64_json",
        ...(request.aspectRatio === undefined ? {} : { aspect_ratio: request.aspectRatio }),
        ...(wants2k ? { resolution: "2k" } : {})
      }
    : {
        model: GROK_IMAGINE_MODEL,
        prompt,
        n: 1,
        quality: "medium",
        response_format: "b64_json",
        ...(request.aspectRatio === undefined ? {} : { aspect_ratio: request.aspectRatio }),
        ...(wants2k ? { resolution: "2k" } : {})
      };
  const endpoint = isEdit ? `${GROK_IMAGINE_BASE_URL}/images/edits` : imagesURL(request.imagesURL);
  const attempts = 2;
  let raw = "";
  let response: Response | undefined;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { signal, timeout, dispose } = combineSignals(request.signal, timeoutMs);
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: requestHeaders(request.accessToken),
        body: JSON.stringify(body),
        signal
      });
      raw = await response.text();
      dispose();
      break;
    } catch (error) {
      dispose();
      if (
        !(attempt < attempts && !request.signal?.aborted && !timeout.aborted && isTransportDrop(error))
      ) {
        fail(describeNetworkFailure(error, request.signal, timeout, timeoutMs), request.accessToken);
      }
    }
  }
  if (response === undefined) fail("Grok Imagine request failed: network error", request.accessToken);
  if (!response.ok) {
    let detail = raw.slice(0, 500);
    try {
      const parsed = JSON.parse(raw);
      if (isRecord(parsed) && isRecord(parsed["error"]) && typeof parsed["error"]["message"] === "string") {
        detail = parsed["error"]["message"];
      }
    } catch {}
    fail(`Grok Imagine failed with HTTP ${String(response.status)}: ${detail}`, request.accessToken);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail("Grok Imagine returned an unparseable body", request.accessToken);
  }
  const image = firstImage(parsed, request.accessToken);
  const bytes =
    image.b64 !== undefined
      ? decodeB64(image.b64, request.accessToken)
      : image.url === undefined
      ? fail("Grok Imagine returned no image data", request.accessToken)
      : await downloadUrl(image.url, request.accessToken, fetchImpl, request.signal ?? AbortSignal.timeout(timeoutMs));
  const mediaType = mediaTypeOf(bytes);
  if (mediaType === undefined) {
    fail("Grok Imagine returned image data that is not PNG, JPEG, WebP, or GIF", request.accessToken);
  }
  return {
    bytes,
    mediaType,
    ...(image.revisedPrompt === undefined ? {} : { revisedPrompt: image.revisedPrompt })
  };
}

function refOf(image: any) {
  return {
    attachmentId: AttachmentId(image.attachmentId),
    mediaType: image.mediaType,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    ...(image.name === undefined ? {} : { name: image.name })
  };
}

function contentOf(value: any): any[] {
  const lines = [
    `<path>${value.path}</path>`,
    `<model>${value.model}</model>`,
    `<image>${value.image.mediaType}, ${String(value.image.width)}x${String(value.image.height)} px, ${String(
      value.image.bytes
    )} bytes</image>`
  ];
  if (value.revisedPrompt !== undefined) lines.push(`<revised_prompt>${value.revisedPrompt}</revised_prompt>`);
  if (value.saveWarning !== undefined) lines.push(`<warning>${value.saveWarning}</warning>`);
  return [
    {
      type: "text",
      text: lines.join("\n")
    },
    {
      type: "image",
      attachment: refOf(value.image)
    }
  ];
}

function sanitizeFilePart(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]+/gu, "_").replace(/^_+|_+$/gu, "");
  return cleaned.length > 0 ? cleaned.slice(0, 48) : "image";
}

function defaultRelativePath(prompt: string, mediaType: string): string {
  return `generated/grok-${new Date()
    .toISOString()
    .replace(/[:.]/gu, "-")
    .replace(/T/u, "-")
    .replace(/Z$/u, "")}-${sanitizeFilePart(prompt)}.${extensionOf(mediaType)}`;
}

async function writeGeneratedFile(ctx: any, exec: any, relativePath: string, bytes: Uint8Array): Promise<string> {
  const cwd = exec.agent?.session.header.cwd;
  const target = await ctx.fs.resolve(relativePath, {
    ...(cwd === undefined ? {} : { cwd }),
    signal: exec.signal
  });
  const processPath = ctx.fs.processPath(target);
  await mkdir(dirname(processPath), { recursive: true });
  await writeFile(processPath, bytes);
  const info = await ctx.fs.stat(target, exec.signal);
  if (info !== undefined) {
    ctx.emit(
      "fs/observed",
      target,
      {
        kind: "present",
        version: info.version
      },
      exec
    );
  }
  return target.displayPath;
}

function aspectRatioOf(value?: string): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (!(GROK_IMAGINE_ASPECT_RATIOS as readonly string[]).includes(trimmed)) {
    throw new Error(`grok_image_gen aspect_ratio must be one of ${GROK_IMAGINE_ASPECT_RATIOS.join(", ")}`);
  }
  return trimmed;
}

export function grokImageGenTool(
  ctx: any,
  options: {
    resolveAccessToken: () => Promise<string>;
    imagesURL?: string;
    fetchImpl?: typeof fetch;
  }
) {
  return defineTool({
    name: GROK_IMAGE_GEN_TOOL_NAME,
    description:
      "Generate a raster image with Grok Imagine (xAI SuperGrok / Grok Build session). Uses this plugin's xAI login and subscription credits. When reference_images is provided, the request becomes a multi-reference edit on /v1/images/edits (up to 5 reference images; refer to them as <IMAGE_0>, <IMAGE_1>, ... in the prompt). If the prompt contains \"2k\", the image is generated at 2k resolution (default: 1k). Distinct from Codex `codex_generate_image`. Do not call unless the user asked for a bitmap image.",
    parameters: {
      prompt: {
        type: "string",
        required: true,
        description: "Image prompt. Be specific about subject, composition, style, text, and constraints."
      },
      aspect_ratio: {
        type: "string",
        enum: [...GROK_IMAGINE_ASPECT_RATIOS],
        description: "Optional aspect ratio. Examples: 1:1, 16:9, 9:16, auto."
      },
      reference_images: {
        type: "array",
        items: { type: "string" },
        description:
          "Optional. 1-5 local image paths (PNG/JPEG/WebP/GIF) used as reference images for multi-image editing. When provided, the request goes to /v1/images/edits and the prompt should refer to them as <IMAGE_0>, <IMAGE_1>, etc."
      },
      path: {
        type: "string",
        description: "Workspace-relative destination. Defaults to generated/grok-<stamp>.<ext> under the session cwd."
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          path: {
            type: "string",
            required: true
          },
          prompt: {
            type: "string",
            required: true
          },
          model: {
            type: "string",
            required: true
          },
          revisedPrompt: { type: "string" },
          saveWarning: { type: "string" },
          image: {
            type: "object",
            required: true,
            additionalProperties: false,
            properties: {
              attachmentId: {
                type: "string",
                required: true
              },
              mediaType: {
                type: "string",
                required: true,
                enum: ["image/png", "image/jpeg", "image/webp", "image/gif"]
              },
              bytes: {
                type: "integer",
                required: true
              },
              width: {
                type: "integer",
                required: true
              },
              height: {
                type: "integer",
                required: true
              },
              name: { type: "string" }
            }
          }
        }
      },
      render: (_args: any, value: any) => contentOf(value)
    },
    timeoutMs: GROK_IMAGE_GEN_TIMEOUT_MS,
    isConcurrencySafe: () => false,
    async execute(args: any, exec: any) {
      const prompt = args.prompt.trim();
      if (prompt.length === 0) throw new Error("grok_image_gen prompt must not be empty");
      const attachments = ctx.attachments;
      const accessToken = await options.resolveAccessToken();
      const aspectRatio = aspectRatioOf(args.aspect_ratio);
      let referenceImages: Array<{ url: string }> | undefined;
      if (Array.isArray(args.reference_images) && args.reference_images.length > 0) {
        const cwd = exec.agent?.session.header.cwd;
        referenceImages = [];
        for (const ref of args.reference_images.slice(0, 5)) {
          const refPath = String(ref);
          const resolved = await ctx.fs.resolve(refPath, {
            ...(cwd === undefined ? {} : { cwd }),
            signal: exec.signal
          });
          const bytes = await readFile(ctx.fs.processPath(resolved));
          const mediaType = mediaTypeOf(bytes);
          if (mediaType === undefined) {
            throw new Error(`reference image ${refPath} is not a PNG, JPEG, WebP, or GIF file`);
          }
          referenceImages.push({ url: `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}` });
        }
      }
      const generated = await generateGrokImage({
        accessToken,
        prompt,
        signal: exec.signal,
        ...(aspectRatio === undefined ? {} : { aspectRatio }),
        ...(referenceImages === undefined ? {} : { referenceImages }),
        ...(options.imagesURL === undefined ? {} : { imagesURL: options.imagesURL }),
        ...(options.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl })
      }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (/^terminated$/i.test(message)) {
          throw new Error("Grok Imagine connection dropped while reading the image (undici: terminated)");
        }
        throw error;
      });
      if (!attachments.imageLimits.mediaTypes.includes(generated.mediaType)) {
        throw new Error(`${generated.mediaType} images are disabled by this deployment`);
      }
      const requestedPath =
        args.path === undefined || args.path.trim().length === 0
          ? defaultRelativePath(prompt, generated.mediaType)
          : args.path.trim();
      // Keep the file extension true to the actual media type: model output is
      // often JPEG even when the caller asks for a .png path, and image upload
      // pipelines reject mismatched files.
      const desiredExt = extensionOf(generated.mediaType);
      const currentExt = basename(requestedPath).includes(".") ? basename(requestedPath).split(".").pop() : "";
      const relativePath =
        currentExt.length > 0 && currentExt.toLowerCase() !== desiredExt
          ? requestedPath.replace(/\.[^.]+$/, `.${desiredExt}`)
          : requestedPath;
      const ref = await attachments.saveImage({
        data: generated.bytes,
        mediaType: generated.mediaType,
        name: basename(relativePath)
      });
      let path = relativePath;
      let saveWarning: string | undefined;
      try {
        path = await writeGeneratedFile(ctx, exec, relativePath, generated.bytes);
      } catch (error) {
        saveWarning = `Image generation succeeded, but the image could not be saved to disk: ${
          error instanceof Error && error.message.length > 0 ? error.message : String(error)
        }`;
      }
      const value = {
        path,
        prompt,
        model: GROK_IMAGINE_MODEL,
        image: {
          attachmentId: ref.attachmentId,
          mediaType: ref.mediaType,
          bytes: ref.bytes,
          width: ref.width,
          height: ref.height,
          ...(ref.name === undefined ? {} : { name: ref.name })
        },
        ...(generated.revisedPrompt === undefined ? {} : { revisedPrompt: generated.revisedPrompt }),
        ...(saveWarning === undefined ? {} : { saveWarning })
      };
      if (exec.parent !== undefined) {
        exec.deferContext(
          createUserMessage({
            content: contentOf(value) as any,
            source: {
              kind: "plugin",
              plugin: "dsh-llm-grok"
            }
          })
        );
      }
      return value;
    },
    presentCall: (args: any) => ({
      card: "generic",
      title: `Grok image: ${args.prompt}`,
      kind: "other",
      rawInput: args.prompt,
      ...(args.path === undefined || args.path.trim().length === 0 ? {} : { locations: [{ path: args.path }] })
    })
  });
}

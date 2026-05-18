import type { GovernanceRequest } from './types';
import { asRecord, toText } from './normalizers';

export const defaultApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000').trim();

const messagePreviewMaxLength = 240;

function looksLikeHtmlResponse(value: string): boolean {
  return /<(?:!doctype|html|head|body|script|div)\b/i.test(value.trim().slice(0, 512));
}

function compactMessage(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function formatUnexpectedResponseMessage(status: number, contentType?: string): string {
  const contentTypeLabel = contentType?.trim() ? `，Content-Type: ${contentType.trim()}` : '';
  return [
    `API 服务返回了非 JSON 响应（HTTP ${status}${contentTypeLabel}）。`,
    `请确认后端服务已启动，且 API 地址 ${defaultApiBaseUrl} 指向本项目 Fastify 后端。`,
  ].join('');
}

function sanitizeResponseMessage(message: string, status: number): string {
  if (looksLikeHtmlResponse(message)) {
    return formatUnexpectedResponseMessage(status, 'text/html');
  }

  const compacted = compactMessage(message);
  if (!compacted) {
    return `Request failed with status ${status}.`;
  }

  return compacted.length > messagePreviewMaxLength
    ? `${compacted.slice(0, messagePreviewMaxLength)}...`
    : compacted;
}

export function readErrorMessage(payload: unknown, status: number): string {
  const root = asRecord(payload);
  const error = root ? asRecord(root.error) : null;
  if (error) {
    const code = toText(error.code);
    const rawMessage = toText(error.message);
    const message = rawMessage ? sanitizeResponseMessage(rawMessage, status) : undefined;
    if (code && message) {
      return `${code}: ${message}`;
    }
    if (message) {
      return message;
    }
  }

  const rawMessage = root ? toText(root.message) : undefined;
  const message = rawMessage ? sanitizeResponseMessage(rawMessage, status) : undefined;
  if (message) {
    return message;
  }

  return `Request failed with status ${status}.`;
}

async function readJsonPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  await response.text();
  throw new Error(formatUnexpectedResponseMessage(response.status, contentType));
}

export async function requestGovernance<T>(request: GovernanceRequest): Promise<T> {
  const desktopBridge = window.desktopApi?.requestGovernance;

  if (desktopBridge) {
    const bridgeResponse = await desktopBridge(request);
    if (!bridgeResponse.ok) {
      throw new Error(readErrorMessage(bridgeResponse.payload, bridgeResponse.status));
    }
    return bridgeResponse.payload as T;
  }

  const init: RequestInit = {
    method: request.method,
    headers: {
      Accept: 'application/json',
    },
  };

  if (request.body !== undefined) {
    init.headers = {
      ...init.headers,
      'Content-Type': 'application/json',
    };
    init.body = JSON.stringify(request.body);
  }

  const response = await fetch(new URL(request.path, defaultApiBaseUrl), init);
  const payload = await readJsonPayload(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, response.status));
  }

  return payload as T;
}

// apps/app/src/lib/services/http/HttpService.ts
import { Ok, Err } from '@epicenterhq/result';
import type { z } from 'zod';

type HttpServiceErrCodes =
	| { code: 'NetworkError'; error: unknown }
	| { code: 'HttpError'; error: unknown; status: number }a
	| { code: 'ParseError'; error: unknown };

type HttpServiceErrProperties = {
	_tag: 'HttpServiceErr';
	error: unknown;
} & HttpServiceErrCodes;

export type HttpServiceErr = Err<HttpServiceErrProperties>;
export type HttpServiceResult<T> = Ok<T> | HttpServiceErr;

export const HttpServiceErr = (
	args: { error: unknown } & HttpServiceErrCodes,
): HttpServiceErr =>
	Err({
		_tag: 'HttpServiceErr',
		...args,
	});

export type HttpService = {
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		body: BodyInit | FormData;
		schema: TSchema;
		headers?: Record<string, string>;
		sslVerify?: boolean; // Added sslVerify option
	}) => Promise<HttpServiceResult<z.infer<TSchema>>>;
};

export function createHttpService(): HttpService {
	return {
		async post<TSchema extends z.ZodTypeAny>({
			url,
			body,
			schema,
			headers = {},
			sslVerify = true,
		}) {
			try {
				// Note: In browsers, fetch doesn't allow disabling SSL verification natively.
				// For local testing with http, ensure the URL uses http:// (not https://).
				// sslVerify=false is a no-op in browsers unless proxied externally.
				const response = await fetch(url, {
					method: 'POST',
					headers,
					body,
					credentials: 'omit',
				});

				if (!response.ok) {
					const errorText = await response.text();
					return HttpServiceErr({
						code: 'HttpError',
						error: errorText,
						status: response.status,
					});
				}

				const data = await response.json();
				const parsed = schema.safeParse(data);
				if (!parsed.success) {
					return HttpServiceErr({
						code: 'ParseError',
						error: parsed.error,
					});
				}

				return Ok(parsed.data);
			} catch (error) {
				return HttpServiceErr({
					code: 'NetworkError',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		},
	};
}

// Export a singleton instance if desired
export const httpService = createHttpService();

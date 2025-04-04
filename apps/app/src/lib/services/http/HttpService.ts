export function createHttpService(): HttpService {
	return {
		async post<TSchema extends z.ZodTypeAny>({
			url,
			body,
			schema,
			headers = {}, // Default to empty object, but don't override Content-Type for FormData
			sslVerify = true,
		}) {
			try {
				const response = await fetch(url, {
					method: 'POST',
					headers: body instanceof FormData ? {} : headers, // Skip headers for FormData
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

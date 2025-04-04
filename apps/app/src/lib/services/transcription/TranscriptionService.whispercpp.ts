// createWhisperCppTranscriptionService.ts
import { Ok } from '@epicenterhq/result';
import { z } from 'zod';
import type { HttpService } from '../http/HttpService';
import {
	type TranscriptionService,
	TranscriptionServiceErr,
} from './TranscriptionService';

export function createWhisperCppTranscriptionService({
	HttpService,
	serverUrl,
	sslVerify,
	model,
}: {
	HttpService: HttpService;
	serverUrl: string;
	sslVerify: boolean;
	model: string; // Add model as a required parameter
}): TranscriptionService {
	return {
		async transcribe({ file }) {
			if (!serverUrl) {
				return TranscriptionServiceErr({
					title: 'Whisper.cpp server URL not provided.',
					description:
						'Please enter the Whisper.cpp server URL in the settings',
					action: {
						type: 'link',
						label: 'Go to settings',
						goto: '/settings/transcription',
					},
				});
			}

			const formData = new FormData();
			formData.append('file', file);
			formData.append('temperature', '0.0');
			formData.append('response_format', 'json');
			formData.append('model', model); // Include the model in the request

			const result = await HttpService.post({
				url: `${serverUrl}/inference`,
				body: formData,
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				schema: z.object({
					text: z.string(),
				}),
				sslVerify,
			});

			if (!result.ok) {
				return TranscriptionServiceErr({
					title: 'Server error from Whisper.cpp',
					description: result.error.error || 'Unknown error occurred.',
				});
			}

			return Ok({ transcribedText: result.data.text });
		},
	};
}

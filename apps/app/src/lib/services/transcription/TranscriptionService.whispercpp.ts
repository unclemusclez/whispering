// createWhisperCppTranscriptionService.ts
import { Ok } from '@epicenterhq/result';
import { z } from 'zod'; // Add missing import
import type { HttpService } from '../http/HttpService';
import {
  type TranscriptionService,
  TranscriptionServiceErr,
} from './TranscriptionService';
import { settings } from '$lib/stores/settings.svelte';

export function createWhisperCppTranscriptionService({
  HttpService,
}: {
  HttpService: HttpService;
}): TranscriptionService {
  return {
    async transcribe({ file }) {
      const serverUrl = settings.value['transcription.whisperCpp.serverUrl'];
      const sslVerify = settings.value['transcription.sslVerify'];

      if (!serverUrl) {
        return TranscriptionServiceErr({
          title: 'Whisper.cpp server URL not provided.',
          description: 'Please enter the Whisper.cpp server URL in the settings',
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

      const result = await HttpService.post({
        url: `${serverUrl}/inference`,
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        schema: z.object({
          text: z.string(),
        }),
        sslVerify, // Pass the SSL verification toggle
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
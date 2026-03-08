import type { GenerateRequest, AIDayResult } from '../types/itinerary';

export interface StreamCallbacks {
  onStatus: (message: string, itineraryId?: string) => void;
  onDay: (day: AIDayResult) => void;
  onComplete: (itineraryId: string) => void;
  onError: (error: string) => void;
}

export function startGeneration(data: GenerateRequest, callbacks: StreamCallbacks): () => void {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const abortController = new AbortController();

  fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    signal: abortController.signal,
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: '请求失败' }));
      callbacks.onError(err.error || '请求失败');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('无法读取响应流');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6).trim();
        } else if (line === '' && eventType && eventData) {
          try {
            const parsed = JSON.parse(eventData);
            switch (eventType) {
              case 'status':
                callbacks.onStatus(parsed.message, parsed.itineraryId);
                break;
              case 'day':
                callbacks.onDay(parsed);
                break;
              case 'complete':
                callbacks.onComplete(parsed.itineraryId);
                break;
              case 'error':
                callbacks.onError(parsed.message);
                break;
            }
          } catch {
            // ignore parse errors
          }
          eventType = '';
          eventData = '';
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      callbacks.onError(err.message || '网络错误');
    }
  });

  return () => abortController.abort();
}

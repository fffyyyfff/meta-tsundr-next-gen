'use client';

import { useCallback, useRef, useState } from 'react';

// ---- Event type definitions ----

export interface StreamStatusEvent {
  phase: 'queued' | 'started' | 'agent_switch';
  agentType?: string;
  label?: string;
  message: string;
  step?: number;
  totalSteps?: number;
}

export interface StreamProgressEvent {
  percent: number;
  message: string;
  step?: number;
  totalSteps?: number;
  duration?: number;
}

export interface StreamCompleteEvent {
  success?: boolean;
  result?: string;
  results?: { agentType: string; success: boolean; result?: string }[];
  duration?: number;
  tokenUsage?: number;
  totalSteps?: number;
  completedSteps?: number;
  artifacts?: Record<string, unknown>;
}

export interface StreamErrorEvent {
  message: string;
  step?: number;
  agentType?: string;
  duration?: number;
}

export type StreamEvent =
  | { type: 'status'; data: StreamStatusEvent }
  | { type: 'progress'; data: StreamProgressEvent }
  | { type: 'complete'; data: StreamCompleteEvent }
  | { type: 'error'; data: StreamErrorEvent };

// ---- Connection state ----

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error';

interface UseAgentStreamOptions {
  maxRetries?: number;
  retryDelay?: number;
  onEvent?: (event: StreamEvent) => void;
}

interface UseAgentStreamReturn {
  connect: (params: { task: string; agentType?: string; workflow?: string }) => void;
  disconnect: () => void;
  connectionState: ConnectionState;
  lastEvent: StreamEvent | null;
  progress: number;
  statusMessage: string;
  error: string | null;
  isComplete: boolean;
}

export function useAgentStream(options: UseAgentStreamOptions = {}): UseAgentStreamReturn {
  const { maxRetries = 3, retryDelay = 2000, onEvent } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const paramsRef = useRef<{ task: string; agentType?: string; workflow?: string } | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const processEvent = useCallback(
    (event: StreamEvent) => {
      setLastEvent(event);
      onEvent?.(event);

      switch (event.type) {
        case 'status':
          setStatusMessage(event.data.message);
          break;
        case 'progress':
          setProgress(event.data.percent);
          setStatusMessage(event.data.message);
          break;
        case 'complete':
          setProgress(100);
          setStatusMessage('Complete');
          setIsComplete(true);
          setConnectionState('closed');
          cleanup();
          break;
        case 'error':
          setError(event.data.message);
          setStatusMessage(`Error: ${event.data.message}`);
          setConnectionState('error');
          cleanup();
          break;
      }
    },
    [onEvent, cleanup],
  );

  const startConnection = useCallback(
    (params: { task: string; agentType?: string; workflow?: string }) => {
      cleanup();

      const searchParams = new URLSearchParams({ task: params.task });
      if (params.agentType) searchParams.set('agentType', params.agentType);
      if (params.workflow) searchParams.set('workflow', params.workflow);

      setConnectionState('connecting');

      const es = new EventSource(`/api/agent/stream?${searchParams.toString()}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionState('connected');
        retriesRef.current = 0;
      };

      const handleSSE = (eventType: StreamEvent['type']) => (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          processEvent({ type: eventType, data } as StreamEvent);
        } catch {
          // Ignore malformed events
        }
      };

      es.addEventListener('status', handleSSE('status'));
      es.addEventListener('progress', handleSSE('progress'));
      es.addEventListener('complete', handleSSE('complete'));
      es.addEventListener('error', handleSSE('error'));

      es.onerror = () => {
        // EventSource fires error on close too — only retry if not already done
        if (es.readyState === EventSource.CLOSED) {
          cleanup();

          // If not completed and retries remain, reconnect
          if (!isComplete && retriesRef.current < maxRetries) {
            retriesRef.current += 1;
            setConnectionState('reconnecting');
            setStatusMessage(`Reconnecting (${retriesRef.current}/${maxRetries})...`);

            setTimeout(() => {
              if (paramsRef.current) {
                startConnection(paramsRef.current);
              }
            }, retryDelay * retriesRef.current);
          } else if (!isComplete) {
            setConnectionState('error');
            setError('Connection lost after max retries');
          }
        }
      };
    },
    [cleanup, processEvent, isComplete, maxRetries, retryDelay],
  );

  const connect = useCallback(
    (params: { task: string; agentType?: string; workflow?: string }) => {
      // Reset state
      setProgress(0);
      setStatusMessage('');
      setError(null);
      setIsComplete(false);
      setLastEvent(null);
      retriesRef.current = 0;
      paramsRef.current = params;

      startConnection(params);
    },
    [startConnection],
  );

  const disconnect = useCallback(() => {
    cleanup();
    paramsRef.current = null;
    setConnectionState('closed');
    setStatusMessage('Disconnected');
  }, [cleanup]);

  return {
    connect,
    disconnect,
    connectionState,
    lastEvent,
    progress,
    statusMessage,
    error,
    isComplete,
  };
}

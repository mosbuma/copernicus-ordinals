import { useCallback, useEffect, useRef } from 'react';

type EventCallback<T> = (data?: T) => void;

class EventEmitter<T> extends EventTarget {
  emit(data?: T) {
    this.dispatchEvent(new CustomEvent('emit', { detail: data }));
  }
}

export function useEventEmitter<T>() {
  const emitterRef = useRef<EventEmitter<T>>();

  if (!emitterRef.current) {
    emitterRef.current = new EventEmitter<T>();
  }

  const emit = useCallback((data?: T) => {
    emitterRef.current?.emit(data);
  }, []);

  const useSubscription = (callback: EventCallback<T>) => {
    useEffect(() => {
      const handler = (e: Event) => {
        const customEvent = e as CustomEvent<T>;
        callback(customEvent.detail);
      };

      emitterRef.current?.addEventListener('emit', handler);
      return () => {
        emitterRef.current?.removeEventListener('emit', handler);
      };
    }, [callback]);
  };

  return {
    emit,
    useSubscription,
  };
}

import { Observable } from "rxjs";
import {
  type Accessor,
  createRoot,
  createEffect,
  getOwner,
  onCleanup,
  createSignal,
} from "../../lib/signals";

export function observable<T>(input: Accessor<T>) {
  return new Observable<T>((observer) => {
    const dispose = createRoot((disposer) => {
      createEffect(input, (v) => observer.next(v));
      return disposer;
    });

    if (getOwner()) onCleanup(dispose);

    return () => dispose();
  });
}

export function from<T>(producer: {
  subscribe: (fn: (v: T) => void) => { unsubscribe: () => void };
}): Accessor<T | undefined> {
  const [s, set] = createSignal<T | undefined>(undefined);
  const sub = producer.subscribe(set);
  onCleanup(() => sub.unsubscribe());
  return s;
}

export type WsMessage<T> = T & { id: string };

export type WsMessageUp<I = any> =
  | {
      type: "create";
      name: string;
      input?: I;
    }
  | {
      type: "subscribe";
      ref: SerializedRef;
      input?: I;
    }
  | {
      type: "dispose";
    }
  | {
      type: "invoke";
      ref: SerializedRef;
      input?: I;
    };

export type WsMessageDown<T> = {
  value: T;
};

export type SerializedRef<I = any, O = any> = {
  __type: "ref";
  name: string;
  scope: string;
};

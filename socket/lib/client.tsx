import { from as rxFrom, mergeMap, Observable } from "rxjs";
import { SerializedRef, WsMessage, WsMessageDown, WsMessageUp } from "./shared";
import { getListener, onCleanup } from "solid-js";

const globalWsPromise = new Promise<SimpleWs>((resolve) => {
  const ws = new WebSocket("ws://localhost:3000/_ws");
  ws.onopen = () => resolve(ws);
});

export type Listener = (ev: { data: any }) => any;
export type SimpleWs = {
  removeEventListener(type: "message", listener: Listener): void;
  addEventListener(type: "message", listener: Listener): void;
  send(data: string): void;
};

function wsRpc<T>(message: WsMessageUp, wsPromise: Promise<SimpleWs>) {
  const id = crypto.randomUUID() as string;

  return new Promise<{ value: T; dispose: () => void }>(async (res, rej) => {
    const ws = await wsPromise;

    function dispose() {
      ws.send(
        JSON.stringify({ type: "dispose", id } satisfies WsMessage<WsMessageUp>)
      );
    }

    function handler(event: { data: string }) {
      // console.log(`handler ${id}`, message, { data: event.data });
      const data = JSON.parse(event.data) as WsMessage<WsMessageDown<T>>;
      if (data.id === id) {
        res({ value: data.value, dispose });
        ws.removeEventListener("message", handler);
      }
    }

    ws.addEventListener("message", handler);
    ws.send(
      JSON.stringify({ ...message, id } satisfies WsMessage<WsMessageUp>)
    );
  });
}

function wsSub<T>(message: WsMessageUp, wsPromise: Promise<SimpleWs>) {
  const id = crypto.randomUUID();

  return rxFrom(Promise.resolve(wsPromise)).pipe(
    mergeMap((ws) => {
      return new Observable<T>((obs) => {
        function handler(event: { data: string }) {
          const data = JSON.parse(event.data) as WsMessage<WsMessageDown<T>>;
          if (data.id === id) obs.next(data.value);
        }

        ws.addEventListener("message", handler);
        ws.send(
          JSON.stringify({ ...message, id } satisfies WsMessage<WsMessageUp>)
        );

        return () => ws.removeEventListener("message", handler);
      });
    })
  );
}

export type SocketRef<I = any, O = any> = (
  input?: I
) => Observable<O> | Promise<O>;

export function createRef<I, O>(
  refPromise: Promise<SerializedRef>,
  wsPromise: Promise<SimpleWs>
) {
  return (input: I) => {
    if (getListener()) {
      return rxFrom(refPromise).pipe(
        mergeMap((ref) => {
          // console.log(`exposeRef 2`, refPromise);
          return wsSub<O>(
            {
              type: "subscribe",
              ref,
              input,
            },
            wsPromise
          );
        })
      );
    } else {
      return refPromise.then((ref) => {
        return wsRpc<O>(
          {
            type: "invoke",
            ref,
            input,
          },
          wsPromise
        ).then(({ value }) => value);
      });
    }
  };
}
function assertRef(ref: any): SerializedRef {
  if (ref.__type === "ref") return ref;
  throw new Error(`not a ref`);
}

export function createEndpoint(name: string, wsPromise = globalWsPromise) {
  const scopePromise = wsRpc<SerializedRef | Record<string, SerializedRef>>(
    { type: "create", name },
    wsPromise
  );
  const scopeValue = scopePromise.then(({ value }) => value);

  onCleanup(() => {
    scopePromise.then(({ dispose }) => dispose());
  });

  scopeValue.then((sv) => console.log({ sv }));

  return new Proxy<SocketRef | Record<string, SocketRef>>((() => {}) as any, {
    apply(_, __, [input]) {
      const refPromise = scopeValue.then(assertRef);
      const invokeRef = createRef(refPromise, wsPromise);
      return invokeRef(input);
    },
    get(_, path) {
      const refPromise = scopeValue.then((callables) =>
        // @ts-expect-error
        assertRef(callables[path])
      );
      const invokeRef = createRef(refPromise, wsPromise);
      return invokeRef;
    },
  });
}

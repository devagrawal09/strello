import { createEffect, createSignal, onCleanup } from "../../lib/signals";
import { SimplePeer, Endpoints, LiveSolidServer } from "./server";
import type { WsMessage, WsMessageDown } from "./shared";

function createCounter() {
  const [count, setCount] = createSignal(0);

  return { count, setCount };
}

function createTimer() {
  const [timer, setTimer] = createSignal(0);

  // createEffect(timer, (t) => console.log(`server createEffect timer: ${t}`));

  // console.log(`setting up interval`);

  const interval = setInterval(() => {
    // console.log(`triggering interval`);
    setTimer(timer() + 1);
  }, 100);

  onCleanup(() => {
    // console.log(`cleaning up interval`);
    clearInterval(interval);
  });

  return timer;
}

let outbox: WsMessage<WsMessageDown<any>>[] = [];

const peer: SimplePeer = {
  id: `test-peer`,
  send(message) {
    // console.log(`Received ${message}`);
    outbox.push(JSON.parse(message));
  },
};
export const endpoints: Endpoints = {
  createCounter,
  createTimer,
};

export const client = new LiveSolidServer(peer);
export function getOutbox() {
  return outbox;
}
export function resetOutbox() {
  outbox = [];
}

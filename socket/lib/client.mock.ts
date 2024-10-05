import { Listener, SimpleWs } from "./client";
import { LiveSolidServer } from "./server";
import { endpoints } from "./server.mock";
import { WsMessage, WsMessageDown, WsMessageUp } from "./shared";

let outbox: WsMessage<WsMessageUp>[] = [];
let inbox: WsMessage<WsMessageDown<any>>[] = [];
const listeners = new Set<Listener>();

const client = new LiveSolidServer(
  {
    id: `test-peer`,
    send(message) {
      // console.log(`Received ${message}`);
      inbox.push(JSON.parse(message));
      listeners.forEach((listener) => listener({ data: message }));
    },
  },
  endpoints
);

export const ws: SimpleWs = {
  addEventListener(_, listener) {
    listeners.add(listener);
  },
  removeEventListener(_, listener) {
    listeners.delete(listener);
  },
  send(data) {
    // console.log(`Sending ${data}`);
    outbox.push(JSON.parse(data));
    client.handleMessage(JSON.parse(data));
  },
};
export function getOutbox() {
  return outbox;
}
export function getInbox() {
  return inbox;
}
export function resetMail() {
  outbox = [];
  inbox = [];
}

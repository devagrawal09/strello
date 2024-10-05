import { afterEach, describe, expect, test } from "vitest";
import { createEndpoint, type SocketRef } from "./client";
import { getInbox, getOutbox, resetMail, ws } from "./client.mock";
import { Observable } from "rxjs";
import { setTimeout } from "timers/promises";
import { createRoot } from "../../lib/signals";

describe(`LiveSolidClient createEndpoint`, () => {
  let disposal: () => void;

  afterEach(async () => {
    disposal?.();
    await setTimeout(0);
    resetMail();
  });

  test(`exposes timer ref`, async () => {
    const serverTimer = createRoot((d) => {
      disposal = d;

      return createEndpoint(`createTimer`, Promise.resolve(ws)) as SocketRef<
        void,
        number
      >;
    });

    expect(serverTimer).toBeInstanceOf(Function);

    await setTimeout(0);

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].type).toBe(`create`);

    expect(getInbox().length).toBe(1);
  });

  test(`can subscribe to timer ref`, async () => {
    const serverTimer = createRoot((d) => {
      disposal = d;

      return createEndpoint(`createTimer`, Promise.resolve(ws)) as SocketRef<
        void,
        number
      >;
    });
    const timer$ = serverTimer(null, true) as Observable<number>;
    await setTimeout(0);

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].type).toBe(`create`);

    let latestTime: number;
    const sub = timer$.subscribe((t) => (latestTime = t));
    await setTimeout(0);

    expect(getOutbox().length).toBe(2);
    expect(getOutbox()[1].type).toBe(`subscribe`);
    expect(getInbox().length).toBe(2);

    await setTimeout(150);

    expect(getInbox().length).toBe(3);
    expect(latestTime).toBe(1);

    await setTimeout(100);

    expect(getInbox().length).toBe(4);
    expect(latestTime).toBe(2);

    sub.unsubscribe();
  });

  test(`exposes counter ref`, async () => {
    const serverCounter = createRoot((d) => {
      disposal = d;

      return createEndpoint(`createCounter`, Promise.resolve(ws)) as {
        count: SocketRef<void, number>;
        setCount: SocketRef<number, number>;
      };
    });

    expect(serverCounter.count).toBeInstanceOf(Function);
    expect(serverCounter.setCount).toBeInstanceOf(Function);

    await setTimeout(0);

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].type).toBe(`create`);

    expect(getInbox().length).toBe(1);
  });

  test(`can subscribe to counter ref`, async () => {
    const serverCounter = createRoot((d) => {
      disposal = d;

      return createEndpoint(`createCounter`, Promise.resolve(ws)) as {
        count: SocketRef<void, number>;
        setCount: SocketRef<number, number>;
      };
    });
    const counter = serverCounter.count(null, true) as Observable<number>;
    await setTimeout(0);

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].type).toBe(`create`);

    let latestCount: number;
    const sub = counter.subscribe((c) => (latestCount = c));
    await setTimeout(0);

    expect(getOutbox().length).toBe(2);
    expect(getOutbox()[1].type).toBe(`subscribe`);

    await serverCounter.setCount(7, false);
    await setTimeout(0);

    expect(latestCount).toBe(7);
    sub.unsubscribe();
  });

  test(`disposes timer ref`, async () => {
    let innerDisposal: () => void;

    const serverTimer = createRoot((d) => {
      innerDisposal = d;

      return createEndpoint(`createTimer`, Promise.resolve(ws)) as SocketRef<
        void,
        number
      >;
    });
    const timer$ = serverTimer(null, true) as Observable<number>;
    await setTimeout(0);

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].type).toBe(`create`);

    let latestTime: number;
    const sub = timer$.subscribe((t) => (latestTime = t));
    await setTimeout(0);

    expect(getOutbox().length).toBe(2);
    expect(getOutbox()[1].type).toBe(`subscribe`);
    expect(getInbox().length).toBe(2);

    await setTimeout(150);

    expect(latestTime).toBe(1);
    expect(getInbox().length).toBe(3);

    innerDisposal?.();
    await setTimeout(100);

    expect(latestTime).toBe(1);
    expect(getInbox().length).toBe(3);

    sub.unsubscribe();
  });

  test(`disposes counter ref`, async () => {
    let innerDisposal: () => void;

    const serverCounter = createRoot((d) => {
      innerDisposal = d;

      return createEndpoint(`createCounter`, Promise.resolve(ws)) as {
        count: SocketRef<void, number>;
        setCount: SocketRef<number, number>;
      };
    });
    const counter = serverCounter.count(null, true) as Observable<number>;
    await setTimeout(0);

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].type).toBe(`create`);
    expect(getInbox().length).toBe(1);

    let latestCount: number;
    const sub = counter.subscribe((c) => (latestCount = c));
    await setTimeout(0);

    expect(getOutbox().length).toBe(2);
    expect(getOutbox()[1].type).toBe(`subscribe`);
    expect(getInbox().length).toBe(2);

    await serverCounter.setCount(7, false);
    await setTimeout(0);

    expect(latestCount).toBe(7);
    expect(getInbox().length).toBe(4);

    innerDisposal?.();
    await setTimeout(100);

    expect(latestCount).toBe(7);
    expect(getInbox().length).toBe(4);

    sub.unsubscribe();
  });
});

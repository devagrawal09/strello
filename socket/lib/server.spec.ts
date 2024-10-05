import { setTimeout } from "timers/promises";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { client, getOutbox, resetOutbox } from "./server.mock";
import { SerializedRef } from "./shared";

describe.skip(`LiveSolidServer`, () => {
  beforeEach(() => {
    resetOutbox();
  });

  afterEach(() => {
    client.cleanup();
  });

  test(`creates endpoint with Callable`, () => {
    const id = `1`;
    client.handleMessage({ id, type: "create", name: "createTimer" });

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].id).toBe(id);

    const value: SerializedRef = getOutbox()[0].value;
    expect(value.__type).toBe("ref");
  });

  test(`creates endpoint with Record`, () => {
    const id = `1`;
    client.handleMessage({ id, type: "create", name: "createCounter" });

    expect(getOutbox().length).toBe(1);
    expect(getOutbox()[0].id).toBe(id);

    const value: Record<string, SerializedRef> = getOutbox()[0].value;
    expect(value.count.__type).toBe("ref");
    expect(value.setCount.__type).toBe("ref");
  });

  test(`can invoke a ref after creating Callable`, () => {
    client.handleMessage({ id: `1`, type: "create", name: "createTimer" });
    const ref: SerializedRef = getOutbox()[0].value;
    client.handleMessage({ id: `2`, type: "invoke", ref });

    expect(getOutbox().length).toBe(2);
    const result = getOutbox()[1];
    expect(result.id).toBe(`2`);
    expect(result.value).toBe(0);
  });

  test(`can invoke a ref after creating Record`, () => {
    client.handleMessage({ id: `1`, type: "create", name: "createCounter" });
    const ref: Record<string, SerializedRef> = getOutbox()[0].value;
    client.handleMessage({ id: `2`, type: "invoke", ref: ref.count });

    expect(getOutbox().length).toBe(2);
    const result = getOutbox()[1];
    expect(result.id).toBe(`2`);
    expect(result.value).toBe(0);
  });

  test(`disposes an endpoint`, () => {
    client.handleMessage({ id: `1`, type: "create", name: "createTimer" });
    client.handleMessage({ id: `1`, type: "dispose" });

    const ref: SerializedRef = getOutbox()[0].value;
    const invokation = () =>
      client.handleMessage({ id: `2`, type: "invoke", ref });

    expect(invokation).toThrowError(`Callable 1 not found`);
    expect(getOutbox().length).toBe(1);
  });

  test(`can subscribe to a ref after creating Timer`, async () => {
    client.handleMessage({ id: `1`, type: "create", name: "createTimer" });
    const ref: SerializedRef = getOutbox()[0].value;
    client.handleMessage({ id: `2`, type: "subscribe", ref });

    await setTimeout(0);

    expect(getOutbox().length).toBe(2);
    const result = getOutbox()[1];
    expect(result.id).toBe(`2`);
    expect(result.value).toBe(0);

    await setTimeout(100);

    expect(getOutbox().length).toBe(3);
    const result2 = getOutbox()[2];
    expect(result2.id).toBe(`2`);
    expect(result2.value).toBe(1);
  });

  test(`can subscribe to a ref after creating Counter`, async () => {
    client.handleMessage({ id: `1`, type: "create", name: "createCounter" });
    const ref: Record<string, SerializedRef> = getOutbox()[0].value;
    client.handleMessage({ id: `2`, type: "subscribe", ref: ref.count });

    await setTimeout(0);

    expect(getOutbox().length).toBe(2);
    const first = getOutbox()[1];
    expect(first.id).toBe(`2`);
    expect(first.value).toBe(0);

    client.handleMessage({
      id: `3`,
      type: "invoke",
      ref: ref.setCount,
      input: 5,
    });
    expect(getOutbox().length).toBe(3);
    const second = getOutbox()[2];
    expect(second.id).toBe(`3`);
    expect(second.value).toBe(5);

    await setTimeout(0);
    expect(getOutbox().length).toBe(4);
    const third = getOutbox()[3];
    expect(third.id).toBe(`2`);
    expect(third.value).toBe(5);
  });
});

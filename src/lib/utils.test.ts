import { describe, it, expect } from "vitest";
import { sortIntoArray } from "./utils";

describe("sortIntoArray", () => {
  type TestItem = {
    id: string;
    order: number;
    data?: string;
  };

  it("should add item to empty array", () => {
    const array: TestItem[] = [];
    const item: TestItem = { id: "1", order: 1 };

    sortIntoArray(array, item);
    expect(array).toEqual([{ id: "1", order: 1 }]);
  });

  it("should insert item in correct order position", () => {
    const array: TestItem[] = [
      { id: "1", order: 1 },
      { id: "3", order: 3 },
    ];
    const item: TestItem = { id: "2", order: 2 };

    sortIntoArray(array, item);
    expect(array).toEqual([
      { id: "1", order: 1 },
      { id: "2", order: 2 },
      { id: "3", order: 3 },
    ]);
  });

  it("should update existing item and maintain order", () => {
    const array: TestItem[] = [
      { id: "1", order: 1 },
      { id: "2", order: 2 },
      { id: "3", order: 3 },
    ];
    const item: TestItem = { id: "2", order: 4, data: "updated" };

    sortIntoArray(array, item);
    expect(array).toEqual([
      { id: "1", order: 1 },
      { id: "3", order: 3 },
      { id: "2", order: 4, data: "updated" },
    ]);
  });

  it("should append item with highest order", () => {
    const array: TestItem[] = [
      { id: "1", order: 1 },
      { id: "2", order: 2 },
    ];
    const item: TestItem = { id: "3", order: 3 };

    sortIntoArray(array, item);
    expect(array).toEqual([
      { id: "1", order: 1 },
      { id: "2", order: 2 },
      { id: "3", order: 3 },
    ]);
  });

  it("should insert item with lowest order", () => {
    const array: TestItem[] = [
      { id: "2", order: 2 },
      { id: "3", order: 3 },
    ];
    const item: TestItem = { id: "1", order: 1 };

    sortIntoArray(array, item);
    expect(array).toEqual([
      { id: "1", order: 1 },
      { id: "2", order: 2 },
      { id: "3", order: 3 },
    ]);
  });

  it("should handle items with same order", () => {
    const array: TestItem[] = [
      { id: "1", order: 1 },
      { id: "2", order: 1 },
    ];
    const item: TestItem = { id: "3", order: 1 };

    sortIntoArray(array, item);
    expect(array).toEqual([
      { id: "1", order: 1 },
      { id: "2", order: 1 },
      { id: "3", order: 1 },
    ]);
  });

  it("should preserve additional properties when updating", () => {
    const array: TestItem[] = [{ id: "1", order: 1, data: "original" }];
    const item: TestItem = { id: "1", order: 2, data: "updated" };

    sortIntoArray(array, item);
    expect(array).toEqual([{ id: "1", order: 2, data: "updated" }]);
  });
});

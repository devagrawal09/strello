export function getIndicesBetween(
  below: number | undefined,
  above: number | undefined,
  n: number = 1
) {
  let start: number;
  let step: number;
  if (typeof below === "number" && below === above) {
    throw new Error(`below ${below} and above ${above} cannot be the same`);
  }
  if (below !== undefined && above !== undefined) {
    // Put items between
    step = (above - below) / (n + 1);
    start = below + step;
  } else if (below === undefined && above !== undefined) {
    // Put items below (bottom of the list)
    step = above / (n + 1);
    start = step;
  } else if (below !== undefined && above === undefined) {
    // Put items above (top of the list)
    start = below + 1;
    step = 1;
  } else {
    return Array.from(Array(n)).map((_, i) => i + 1);
  }
  return Array.from(Array(n)).map((_, i) => start + i * step);
}
export const getIndexBetween = (
  below: number | undefined,
  above: number | undefined
) => getIndicesBetween(below, above, 1)[0];

export function sortIntoArray<T extends { id: string; order: number }>(
  array: T[],
  item: T
) {
  if (array.length === 0) {
    array.push(item);
  } else {
    const index = array.findIndex((n) => n.id === item.id);

    if (index !== -1) {
      array.splice(index, 1);
    }

    let inserted = false;
    for (let i = 0; i < array.length; i++) {
      if (array[i].order > item.order) {
        array.splice(i, 0, item);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      array.push(item);
    }
  }
}

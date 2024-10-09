"use socket";

import { createEffect, createSignal } from "solid-js/dist/solid";

export const createBoard = () => {
  const [boardState, setBoard] = createSignal();

  createEffect(() => console.log(`boardState`, boardState()));

  setTimeout(() => {
    console.log(`timeout`);
    setBoard(Date.now());
  }, 5000);

  return {
    boardState,
    setBoard,
  };
};

"use socket";

import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { BoardData, BoardId } from "./Board";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { createSocketMemo } from "../../socket/lib/shared";
import { ColumnId } from "./Column";
import { NoteId } from "./Note";

const [boards, setBoards] = createSignal<Record<string, BoardData>>({});

export const useBoards = () => {
  return {
    boards: createSocketMemo(boards),
    async createBoard(title: string, color: string) {
      const boardId = `${Object.keys(boards()).length + 1}`;
      setBoards((b) => ({
        ...b,
        [boardId]: {
          board: { id: boardId, title, color },
          columns: [],
          notes: [],
        },
      }));
      return boardId;
    },
    deleteBoard(boardId: BoardId) {
      setBoards((b) => {
        const { [boardId]: _, ...rest } = b;
        return rest;
      });
    },
  };
};

export const useBoard = (boardId: () => string | undefined) => {
  createEffect(() => console.log(`boardId`, boardId()));
  function moveColumn(columnId: ColumnId, order: number) {
    const id = boardId();
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        columns: b[id].columns.map((c) =>
          c.id === columnId ? { ...c, order } : c
        ),
      },
    }));
  }

  function renameColumn(columnId: ColumnId, name: string) {
    const id = boardId();
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        columns: b[id].columns.map((c) =>
          c.id === columnId ? { ...c, name } : c
        ),
      },
    }));
  }

  function deleteColumn(columnId: ColumnId) {
    const id = boardId();
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        columns: b[id].columns.filter((c) => c.id !== columnId),
      },
    }));
  }

  function createColumn(columnId: ColumnId, title: string) {
    const id = boardId() as BoardId;
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        columns: [
          ...b[id].columns,
          {
            id: columnId,
            order: b[id].columns.length + 1,
            board: id,
            title,
          },
        ],
      },
    }));
  }

  function moveNote(noteId: NoteId, column: ColumnId, order: number) {
    console.log(`moveNote`, noteId, column, order);
    const id = boardId();
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        notes: b[id].notes.map((n) =>
          n.id === noteId ? { ...n, column, order } : n
        ),
      },
    }));
  }

  function createNote(
    noteId: NoteId,
    column: ColumnId,
    body: string,
    order: number
  ) {
    const id = boardId() as BoardId;
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        notes: [
          ...b[id].notes,
          {
            id: noteId,
            column,
            body,
            order,
            board: id,
          },
        ],
      },
    }));
  }

  function editNote(noteId: NoteId, content: string) {
    const id = boardId() as BoardId;
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        notes: b[id].notes.map((n) =>
          n.id === noteId ? { ...n, body: content } : n
        ),
      },
    }));
  }

  function deleteNote(noteId: NoteId) {
    const id = boardId() as BoardId;
    if (!id) return;
    setBoards((b) => ({
      ...b,
      [id]: {
        ...b[id],
        notes: b[id].notes.filter((n) => n.id !== noteId),
      },
    }));
  }

  return {
    board: createSocketMemo(() =>
      boardId() ? boards()[boardId()!] : undefined
    ),
    async setBoard(data: BoardData) {
      setBoards((b) => ({ ...b, [data.board.id]: data }));
    },
    moveColumn,
    moveNote,
    renameColumn,
    deleteColumn,
    createColumn,
    createNote,
    editNote,
    deleteNote,
  };
};

export type PresenceUser = {
  name: string;
  x: number;
  y: number;
  color: string;
};

const [users, setUsers] = createSignal<Record<string, PresenceUser>>({});

export const usePresence = (
  mousePos: () => { x: number; y: number } | undefined
) => {
  const id = crypto.randomUUID();
  const color = Math.floor(Math.random() * 16777215).toString(16);
  const name = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    style: "capital",
    separator: " ",
  });

  createEffect(() => {
    const { x, y } = mousePos() || {};
    console.log(name, x, y);
    x && y && setUsers((u) => ({ ...u, [id]: { name, x, y, color } }));
  });

  onCleanup(() => {
    setUsers(({ [id]: _, ...rest }) => rest);
  });

  const otherUsers = createMemo(() => {
    const { [id]: _, ...rest } = users();
    return rest;
  });

  return createSocketMemo(otherUsers);
};

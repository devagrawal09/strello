import { createSubjectStore } from "solid-events";
import { For, createMemo } from "solid-js";
import { AddColumn, Column, ColumnGap } from "./Column";
import { Note } from "./Note";
import { useBoardActions } from "./actions";

export enum DragTypes {
  Note = "application/note",
  Column = "application/column",
}

export type BoardId = string & { __brand?: "BoardId" };

export type Board = {
  id: BoardId;
  title: string;
  color: string;
};

export type BoardData = {
  board: Board;
  columns: Column[];
  notes: Note[];
};

export function Board(props: { board: BoardData }) {
  const {
    onMoveColumn,
    onMoveNote,
    onCreateNote,
    onCreateColumn,
    onDeleteColumn,
    onRenameColumn,
    onDeleteNote,
    onEditNote,
    boardData,
  } = useBoardActions();

  const boardStore = createSubjectStore(
    boardData,
    onCreateNote(([note]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.notes.findIndex((n) => n.id === note.id);
      if (index === -1) board.notes.push(note);
    }),
    onMoveNote(([note, column, order]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.notes.findIndex((n) => n.id === note);
      if (index !== -1) {
        board.notes[index].column = column;
        board.notes[index].order = order;
      }
    }),
    onEditNote(([id, content]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.notes.findIndex((n) => n.id === id);
      if (index !== -1) board.notes[index].body = content;
    }),
    onDeleteNote(([id]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.notes.findIndex((n) => n.id === id);
      if (index !== -1) board.notes.splice(index, 1);
    }),
    onCreateColumn(([id, boardId, name]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.columns.findIndex((c) => c.id === id);
      if (index === -1)
        board.columns.push({
          id: id,
          board: boardId,
          title: name,
          order: board.columns.length + 1,
        });
    }),
    onRenameColumn(([id, name]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.columns.findIndex((c) => c.id === id);
      if (index !== -1) board.columns[index].title = name;
    }),
    onMoveColumn(([id, order]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.columns.findIndex((c) => c.id === id);
      if (index !== -1) board.columns[index].order = order;
    }),
    onDeleteColumn(([id]) => (board) => {
      if (!optimisticUpdates) return;
      const index = board.columns.findIndex((c) => c.id === id);
      if (index !== -1) board.columns.splice(index, 1);
    })
  );

  const sortedColumns = createMemo(() =>
    boardStore.columns.slice().sort((a, b) => a.order - b.order)
  );

  let scrollContainerRef: HTMLDivElement | undefined;

  return (
    <div
      ref={(el) => {
        scrollContainerRef = el;
      }}
      class="pb-8 h-[calc(100vh-160px)] min-w-full overflow-x-auto overflow-y-hidden flex flex-start items-start flex-nowrap"
    >
      <ColumnGap right={sortedColumns()[0]} />
      <For each={sortedColumns()}>
        {(column, i) => (
          <>
            <Column
              column={column}
              board={props.board.board}
              notes={boardStore.notes}
            />
            <ColumnGap
              left={sortedColumns()[i()]}
              right={sortedColumns()[i() + 1]}
            />
          </>
        )}
      </For>
      <AddColumn
        board={props.board.board.id}
        onAdd={() => {
          scrollContainerRef &&
            (scrollContainerRef.scrollLeft = scrollContainerRef.scrollWidth);
        }}
      />
    </div>
  );
}

let optimisticUpdates = true;
if (typeof window !== "undefined") {
  // disable optimistic updates in production for testing/demonstration purposes
  // @ts-expect-error
  window.toggleOptimistic = () => {
    optimisticUpdates = !optimisticUpdates;
  };
}

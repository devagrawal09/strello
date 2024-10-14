import { action, json, useAction } from "@solidjs/router";
import { BsPlus, BsTrash } from "solid-icons/bs";
import { RiEditorDraggable } from "solid-icons/ri";
import { Match, Switch } from "solid-js";
import { BoardId, DragTypes } from "./Board";
import { ColumnId } from "./Column";
import { getIndexBetween } from "~/lib/utils";
import { getAuthUser } from "~/lib/auth";
import { db } from "~/lib/db";
import { fetchBoard } from "~/lib";
import {
  createEvent,
  createPartition,
  createSubject,
  halt,
} from "solid-events";
import { useBoardActions } from "./actions";

export const createNote = action(
  async ({
    id,
    column,
    body,
    order,
    timestamp,
    board,
  }: {
    id: NoteId;
    board: BoardId;
    column: ColumnId;
    body: string;
    order: number;
    timestamp: number;
  }) => {
    "use server";
    const accountId = await getAuthUser();
    const mutation = {
      id: String(id),
      title: String(body),
      order,
      boardId: +board,
      columnId: String(column),
    };

    await db.item.upsert({
      where: {
        id: mutation.id,
        Board: {
          accountId,
        },
      },
      create: mutation,
      update: mutation,
    });

    return json(true, { revalidate: fetchBoard.key });
  },
  "create-item"
);

export const editNote = action(
  async (id: NoteId, content: string, timestamp: number) => {
    "use server";
    const accountId = await getAuthUser();
    const mutation = {
      id: String(id),
      title: String(content),
    };

    await db.item.update({
      where: {
        id: mutation.id,
        Board: {
          accountId,
        },
      },
      data: mutation,
    });

    return json(true, { revalidate: fetchBoard.key });
  },
  "edit-item"
);

export const moveNote = action(
  async (note: NoteId, column: ColumnId, order: number, timestamp: number) => {
    "use server";
    const accountId = await getAuthUser();
    const mutation = {
      id: String(note),
      columnId: String(column),
      order,
    };

    await db.item.update({
      where: {
        id: mutation.id,
        Board: {
          accountId,
        },
      },
      data: mutation,
    });

    return json(true, { revalidate: fetchBoard.key });
  },
  "move-item"
);

export const deleteNote = action(async (id: NoteId, timestamp: number) => {
  "use server";
  const accountId = await getAuthUser();

  await db.item.delete({ where: { id, Board: { accountId } } });

  return json(true, { revalidate: fetchBoard.key });
}, "delete-card");

export type NoteId = string & { __brand?: "NoteId" };

export type Note = {
  id: NoteId;
  board: BoardId;
  column: ColumnId;
  order: number;
  body: string;
};

type BlurTextArea = FocusEvent & {
  target: HTMLTextAreaElement;
};

export function Note(props: { note: Note; previous?: Note; next?: Note }) {
  const { emitMoveNote, emitDeleteNote, emitEditNote } = useBoardActions();

  let input: HTMLTextAreaElement | undefined;

  const [onDragStart, emitDragStart] = createEvent<DragEvent>();
  const [onDrag, emitDrag] = createEvent<DragEvent>();
  const [onDragEnd, emitDragEnd] = createEvent<DragEvent>();
  const [onDragEnter, emitDragEnter] = createEvent<DragEvent>();
  const [onDragOver, emitDragOver] = createEvent<
    DragEvent & {
      currentTarget: HTMLDivElement;
    }
  >();
  const [onDragExit, emitDragExit] = createEvent<DragEvent>();
  const [onDragLeave, emitDragLeave] = createEvent<DragEvent>();
  const [onDrop, emitDrop] = createEvent<DragEvent>();
  const [onBlur, emitBlur] = createEvent<BlurTextArea>();

  onDragStart((e) => {
    e.dataTransfer?.setData(DragTypes.Note, props.note.id.toString());
  });

  const isBeingDragged = createSubject(
    false,
    onDrag(() => true),
    onDragEnd(() => false)
  );

  onDrop((e) => {
    if (!e.dataTransfer?.types.includes(DragTypes.Note)) return;

    const noteId = e.dataTransfer?.getData(DragTypes.Note) as
      | NoteId
      | undefined;

    if (!noteId || noteId === props.note.id) return;

    if (acceptDrop() === "top" && props.previous?.id !== noteId) {
      return emitMoveNote([
        noteId,
        props.note.column,
        getIndexBetween(props.previous?.order, props.note.order),
        new Date().getTime(),
      ]);
    }

    if (acceptDrop() === "bottom" && props.next?.id !== noteId) {
      return emitMoveNote([
        noteId,
        props.note.column,
        getIndexBetween(props.note.order, props.next?.order),
        new Date().getTime(),
      ]);
    }
  });

  onBlur((e) =>
    emitEditNote([props.note.id, e.target.value, new Date().getTime()])
  );

  const [onDragOverValidEl, onDragOverInvalidEl] = createPartition(
    onDragOver,
    (e) => !!e.dataTransfer?.types.includes(DragTypes.Note)
  );

  const acceptDrop = createSubject<"top" | "bottom" | false>(
    false,
    onDragExit(() => false),
    onDragLeave(() => false),
    onDrop(() => false),
    onDragOverInvalidEl(() => false),
    onDragOverValidEl((e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = (rect.top + rect.bottom) / 2;
      const isTop = e.clientY < midpoint;

      return isTop ? "top" : "bottom";
    })
  );

  return (
    <div
      style={{
        opacity: isBeingDragged() ? 0.25 : 1,
        "border-top":
          acceptDrop() === "top" ? "2px solid red" : "2px solid transparent",
        "border-bottom":
          acceptDrop() === "bottom" ? "2px solid red" : "2px solid transparent",
      }}
      draggable="true"
      class="card card-side px-1 py-2 w-full bg-slate-200 text-lg flex justify-between items-center space-x-1"
      onDragStart={emitDragStart}
      onDrag={emitDrag}
      onDragEnd={emitDragEnd}
      onDragEnter={(e) => (
        e.preventDefault(), e.stopPropagation(), emitDragEnter(e)
      )}
      onDragOver={(e) => (
        e.preventDefault(), e.stopPropagation(), emitDragOver(e)
      )}
      onDragExit={emitDragExit}
      onDragLeave={emitDragLeave}
      onDrop={(e) => (e.preventDefault(), e.stopPropagation(), emitDrop(e))}
    >
      <div>
        <RiEditorDraggable size={6} class="cursor-move" />
      </div>
      <textarea
        class="textarea textarea-ghost text-lg w-full"
        ref={input}
        style={{
          resize: "none",
        }}
        onBlur={emitBlur}
      >
        {`${props.note.body}`}
      </textarea>
      <button
        class="btn btn-ghost btn-sm btn-circle"
        onClick={() => emitDeleteNote([props.note.id, new Date().getTime()])}
      >
        <BsTrash />
      </button>
    </div>
  );
}

type FocusOut = FocusEvent & {
  currentTarget: HTMLFormElement;
};

export function AddNote(props: {
  column: ColumnId;
  length: number;
  onAdd: () => void;
  board: BoardId;
}) {
  const { emitCreateNote } = useBoardActions();

  const [onSubmit, emitSubmit] = createEvent();
  const [onCancel, emitCancel] = createEvent();
  const [onClickAdd, emitClickAdd] = createEvent();
  const [onFocusOut, emitFocusOut] = createEvent<FocusOut>();

  const active = createSubject(
    false,
    onClickAdd(() => true),
    onCancel(() => false),
    onFocusOut((e) =>
      e.currentTarget.contains(e.relatedTarget as any) ? halt() : false
    )
  );

  onSubmit(() => {
    const body = inputRef?.value.trim() ?? "Note";
    if (body === "") {
      inputRef?.setCustomValidity("Please fill out this field.");
      inputRef?.reportValidity();
      return;
    }
    emitCreateNote([
      {
        id: crypto.randomUUID() as NoteId,
        board: props.board,
        column: props.column,
        body,
        order: props.length + 1,
        timestamp: new Date().getTime(),
      },
    ]);
    inputRef && (inputRef.value = "");
    props.onAdd();
  });

  let inputRef: HTMLInputElement | undefined;

  return (
    <div class="w-full flex justify-center p-2">
      <Switch>
        <Match when={active()}>
          <form
            class="flex flex-col space-y-2 card w-full"
            onSubmit={(e) => (e.preventDefault(), emitSubmit(e))}
            onFocusOut={emitFocusOut}
          >
            <input
              ref={(el) => {
                inputRef = el;
                setTimeout(() => requestAnimationFrame(() => void el.focus()));
              }}
              class="textarea dark:text-white"
              placeholder="Add a Note"
              required
            />
            <div class="flex justify-between">
              <button class="btn btn-success" type="submit">
                Add
              </button>
              <button class="btn btn-error" type="reset" onClick={emitCancel}>
                Cancel
              </button>
            </div>
          </form>
        </Match>
        <Match when={!active()}>
          <button class="btn w-full" onClick={emitClickAdd}>
            <BsPlus size={10} /> Add a card
          </button>
        </Match>
      </Switch>
    </div>
  );
}

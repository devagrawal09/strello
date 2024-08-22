import { useAction } from "@solidjs/router";
import { BsPlus, BsTrash } from "solid-icons/bs";
import { RiEditorDraggable } from "solid-icons/ri";
import { Match, Switch, createSignal } from "solid-js";
import { createNote, deleteNote, editNote, moveNote } from "~/lib/queries";
import { BoardId, DragTypes } from "./Board";
import { ColumnId } from "./Column";
import { getIndexBetween } from "~/lib/utils";

export type NoteId = string & { __brand?: "NoteId" };

export type Note = {
  id: NoteId;
  board: BoardId;
  column: ColumnId;
  order: number;
  body: string;
};

export function Note(props: { note: Note; previous?: Note; next?: Note }) {
  const updateAction = useAction(editNote);
  const deleteAction = useAction(deleteNote);
  const moveNoteAction = useAction(moveNote);

  let input: HTMLTextAreaElement | undefined;

  const [isBeingDragged, setIsBeingDragged] = createSignal(false);

  const [acceptDrop, setAcceptDrop] = createSignal<"top" | "bottom" | false>(
    false
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
      class="card card-side px-1 py-2 w-full bg-base-200 text-lg flex justify-between items-center space-x-1"
      onDragStart={(e) => {
        e.dataTransfer?.setData("application/note", props.note.id.toString());
      }}
      onDrag={(e) => {
        setIsBeingDragged(true);
      }}
      onDragEnd={(e) => {
        setIsBeingDragged(false);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!e.dataTransfer?.types.includes(DragTypes.Note)) {
          setAcceptDrop(false);
          return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = (rect.top + rect.bottom) / 2;
        const isTop = e.clientY < midpoint;

        setAcceptDrop(isTop ? "top" : "bottom");
      }}
      onDragExit={(e) => {
        setAcceptDrop(false);
      }}
      onDragLeave={(e) => {
        setAcceptDrop(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer?.types.includes("application/note")) {
          const noteId = e.dataTransfer?.getData("application/note") as
            | NoteId
            | undefined;

          action: if (noteId && noteId !== props.note.id) {
            if (acceptDrop() === "top") {
              if (props.previous && props.previous?.id === noteId) {
                break action;
              }
              moveNoteAction(
                noteId,
                props.note.column,
                getIndexBetween(props.previous?.order, props.note.order),
                new Date().getTime()
              );
            }

            if (acceptDrop() === "bottom") {
              if (props.previous && props.next?.id === noteId) {
                break action;
              }
              moveNoteAction(
                noteId,
                props.note.column,
                getIndexBetween(props.note.order, props.next?.order),
                new Date().getTime()
              );
            }
          }
        }

        setAcceptDrop(false);
      }}
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
        onBlur={(e) =>
          updateAction(
            props.note.id,
            (e.target as HTMLTextAreaElement).value,
            new Date().getTime()
          )
        }
      >
        {`${props.note.body}`}
      </textarea>
      <button
        class="btn btn-ghost btn-sm btn-circle"
        onClick={() => deleteAction(props.note.id, new Date().getTime())}
      >
        <BsTrash />
      </button>
    </div>
  );
}

export function AddNote(props: {
  column: ColumnId;
  length: number;
  onAdd: () => void;
  board: BoardId;
}) {
  const [active, setActive] = createSignal(false);
  const addNote = useAction(createNote);
  let inputRef: HTMLInputElement | undefined;
  return (
    <div class="w-full flex justify-center">
      <Switch>
        <Match when={active()}>
          <form
            class="flex flex-col space-y-2 card bg-base-200 p-2 w-full"
            onSubmit={(e) => {
              e.preventDefault();
              addNote({
                id: crypto.randomUUID() as NoteId,
                board: props.board,
                column: props.column,
                body: inputRef?.value ?? "Note",
                order: props.length + 1,
                timestamp: new Date().getTime(),
              });
              inputRef && (inputRef.value = "");
              props.onAdd();
            }}
          >
            <input
              ref={(el) => {
                inputRef = el;
                setTimeout(() => requestAnimationFrame(() => void el.focus()));
              }}
              class="textarea"
              placeholder="Add a Note"
              required
            />
            <div class="space-x-2">
              <button class="btn btn-success" type="submit">
                Add
              </button>
              <button
                class="btn btn-error"
                type="reset"
                onClick={() => setActive(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Match>
        <Match when={!active()}>
          <button class="btn btn-circle" onClick={() => setActive(true)}>
            <BsPlus size={10} />
          </button>
        </Match>
      </Switch>
    </div>
  );
}

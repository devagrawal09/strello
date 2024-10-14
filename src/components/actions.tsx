import { useAction, useSubmission } from "@solidjs/router";
import { Accessor, createContext, ParentProps, useContext } from "solid-js";

import { createColumn, deleteColumn, moveColumn, renameColumn } from "./Column";
import { createNote, deleteNote, editNote, moveNote } from "./Note";
import { BoardData } from "./Board";
import {
  createEvent,
  createSubject,
  createTopic,
  Emitter,
  halt,
  Handler,
} from "solid-events";

type CreateColumnProps = Parameters<typeof createColumn>;
type MoveColumnProps = Parameters<typeof moveColumn>;
type RenameColumnProps = Parameters<typeof renameColumn>;
type DeleteColumnProps = Parameters<typeof deleteColumn>;
type CreateNoteProps = Parameters<typeof createNote>;
type MoveNoteProps = Parameters<typeof moveNote>;
type EditNoteProps = Parameters<typeof editNote>;
type DeleteNoteProps = Parameters<typeof deleteNote>;

const ctx = createContext<{
  onCreateNote: Handler<CreateNoteProps>;
  emitCreateNote: Emitter<CreateNoteProps>;
  onMoveNote: Handler<MoveNoteProps>;
  emitMoveNote: Emitter<MoveNoteProps>;
  onEditNote: Handler<EditNoteProps>;
  emitEditNote: Emitter<EditNoteProps>;
  onDeleteNote: Handler<DeleteNoteProps>;
  emitDeleteNote: Emitter<DeleteNoteProps>;
  onCreateColumn: Handler<CreateColumnProps>;
  emitCreateColumn: Emitter<CreateColumnProps>;
  onMoveColumn: Handler<MoveColumnProps>;
  emitMoveColumn: Emitter<MoveColumnProps>;
  onRenameColumn: Handler<RenameColumnProps>;
  emitRenameColumn: Emitter<RenameColumnProps>;
  onDeleteColumn: Handler<DeleteColumnProps>;
  emitDeleteColumn: Emitter<DeleteColumnProps>;
  boardData: Accessor<BoardData>;
}>();

export function useBoardActions() {
  const value = useContext(ctx);
  if (!value) throw new Error("BoardActionsProvider not found");
  return value;
}

export function BoardActionsProvider(props: ParentProps<{ board: BoardData }>) {
  const [onCreateNote, emitCreateNote] = createEvent<CreateNoteProps>();
  const createNoteAction = useAction(createNote);
  const createNoteSubmission = useSubmission(createNote);
  const onCreateNoteComplete = onCreateNote((p) => createNoteAction(...p));

  const [onMoveNote, emitMoveNote] = createEvent<MoveNoteProps>();
  const moveNoteAction = useAction(moveNote);
  const moveNoteSubmission = useSubmission(moveNote);
  const onMoveNoteComplete = onMoveNote((p) => moveNoteAction(...p));

  const [onEditNote, emitEditNote] = createEvent<EditNoteProps>();
  const updateNoteAction = useAction(editNote);
  const updateNoteSubmission = useSubmission(editNote);
  const onEditNoteComplete = onEditNote((p) => updateNoteAction(...p));

  const [onDeleteNote, emitDeleteNote] = createEvent<DeleteNoteProps>();
  const deleteNoteAction = useAction(deleteNote);
  const deleteNoteSubmission = useSubmission(deleteNote);
  const onDeleteNoteComplete = onDeleteNote((p) => deleteNoteAction(...p));

  const [onCreateColumn, emitCreateColumn] = createEvent<CreateColumnProps>();
  const createColumnAction = useAction(createColumn);
  const createColumnSubmission = useSubmission(createColumn);
  const onCreateColumnComplete = onCreateColumn((p) =>
    createColumnAction(...p)
  );

  const [onMoveColumn, emitMoveColumn] = createEvent<MoveColumnProps>();
  const moveColumnAction = useAction(moveColumn);
  const moveColumnSubmission = useSubmission(moveColumn);
  const onMoveColumnComplete = onMoveColumn((p) => moveColumnAction(...p));

  const [onRenameColumn, emitRenameColumn] = createEvent<RenameColumnProps>();
  const renameColumnAction = useAction(renameColumn);
  const renameColumnSubmission = useSubmission(renameColumn);
  const onRenameColumnComplete = onRenameColumn((p) =>
    renameColumnAction(...p)
  );

  const [onDeleteColumn, emitDeleteColumn] = createEvent<DeleteColumnProps>();
  const deleteColumnAction = useAction(deleteColumn);
  const deleteColumnSubmission = useSubmission(deleteColumn);
  const onDeleteColumnComplete = onDeleteColumn((p) =>
    deleteColumnAction(...p)
  );

  const onActionComplete = createTopic(
    onCreateNoteComplete,
    onMoveNoteComplete,
    onEditNoteComplete,
    onDeleteNoteComplete,
    onCreateColumnComplete,
    onMoveColumnComplete,
    onRenameColumnComplete,
    onDeleteColumnComplete
  );

  const boardData = createSubject(
    {
      board: props.board.board,
      columns: props.board.columns,
      notes: props.board.notes,
    },
    onActionComplete(() => {
      if (
        createNoteSubmission.pending ||
        moveNoteSubmission.pending ||
        updateNoteSubmission.pending ||
        deleteNoteSubmission.pending ||
        createColumnSubmission.pending ||
        moveColumnSubmission.pending ||
        renameColumnSubmission.pending ||
        deleteColumnSubmission.pending
      )
        halt();

      return props.board;
    })
  );

  const value = {
    onCreateNote,
    emitCreateNote,
    onMoveNote,
    emitMoveNote,
    onEditNote,
    emitEditNote,
    onDeleteNote,
    emitDeleteNote,
    onCreateColumn,
    emitCreateColumn,
    onMoveColumn,
    emitMoveColumn,
    onRenameColumn,
    emitRenameColumn,
    onDeleteColumn,
    emitDeleteColumn,
    boardData,
  };

  return <ctx.Provider value={value}>{props.children}</ctx.Provider>;
}

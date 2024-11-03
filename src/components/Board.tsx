import { Column } from "./Column";
import { Note } from "./Note";

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

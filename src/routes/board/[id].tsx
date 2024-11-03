import { Title } from "@solidjs/meta";
import { RouteSectionProps } from "@solidjs/router";
import { createComputed, createEffect, createMemo, For, Show } from "solid-js";
import { useBoard } from "~/components/board-data";
import EditableText from "~/components/EditableText";
import { createSocketMemo } from "../../../socket/lib/shared";
import { AddColumn, Column, ColumnGap } from "~/components/Column";
import { createStore } from "solid-js/store";
import { reconcile } from "solid-js/store";
import { Presence } from "~/components/Presence";

export default function Page(props: RouteSectionProps) {
  const boardId = createSocketMemo(() => props.params.id);
  const serverBoard = useBoard(boardId);
  let scrollContainerRef: HTMLDivElement | undefined;

  return (
    <Show when={serverBoard.board()}>
      {(board) => {
        const [boardStore, setBoardStore] = createStore(board());
        createComputed(() => setBoardStore(reconcile(board())));

        const sortedColumns = createMemo(
          () =>
            boardStore.columns.slice().sort((a, b) => a.order - b.order) || []
        );

        return (
          <main
            class="w-full p-8 space-y-2"
            style={{ "background-color": board().board.color }}
          >
            <Title>{board().board.title} | Strello</Title>
            <Presence />
            <h1 class="mb-4">
              <EditableText
                text={board().board.title || ""}
                saveAction={(value: string) => {}}
              />
            </h1>

            <div
              ref={scrollContainerRef}
              class="pb-8 h-[calc(100vh-160px)] min-w-full overflow-x-auto overflow-y-hidden flex flex-start items-start flex-nowrap"
            >
              <ColumnGap
                right={sortedColumns()[0]}
                moveColumn={serverBoard.moveColumn}
              />
              <For each={sortedColumns()}>
                {(column, i) => (
                  <>
                    <Column
                      boardId={props.params.id}
                      column={column}
                      notes={boardStore.notes}
                      moveNote={serverBoard.moveNote}
                      renameColumn={serverBoard.renameColumn}
                      deleteColumn={serverBoard.deleteColumn}
                      createNote={serverBoard.createNote}
                      deleteNote={serverBoard.deleteNote}
                      editNote={serverBoard.editNote}
                    />
                    <ColumnGap
                      left={sortedColumns()[i()]}
                      right={sortedColumns()[i() + 1]}
                      moveColumn={serverBoard.moveColumn}
                    />
                  </>
                )}
              </For>
              <AddColumn
                board={board().board.id}
                createColumn={(...p) => serverBoard.createColumn(...p)}
              />
            </div>
          </main>
        );
      }}
    </Show>
  );
}

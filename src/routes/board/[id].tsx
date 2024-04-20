import { Title } from "@solidjs/meta";
import { RouteDefinition, RouteSectionProps, createAsync, useAction, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { Board } from "~/components/Board";
import EditableText from "~/components/EditableText";
import { fetchBoard, createColumn, renameColumn, moveColumn, deleteColumn, deleteNote, createNote, editNote, moveNote, updateBoardName } from "~/lib/queries";

export const route: RouteDefinition = {
  load: (props) => fetchBoard(+props.params.id),
};

export default function Page(props: RouteSectionProps) {
  const board = createAsync(() => fetchBoard(+props.params.id));
  const submission = useSubmission(updateBoardName);
  const updateBoardNameAction = useAction(updateBoardName);

  return (
    <Show when={board()}>
      <Title>{board()?.board.title} | Strello</Title>

      <h1 class="mx-8 my-4">
        <EditableText
          text={submission.input && submission.input[1] || board()?.board.title || ''}
          saveAction={(value: string) => updateBoardNameAction(+props.params.id, value)}
        />
      </h1>

      <div class="h-screen overflow-hidden">
        <Board
          board={board()!}
          actions={{
            createColumn,
            renameColumn,
            moveColumn,
            deleteColumn,
            createNote,
            editNote,
            moveNote,
            deleteNote,
          }}
        />
      </div>
    </Show>
  );
}

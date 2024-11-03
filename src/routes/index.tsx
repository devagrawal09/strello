import { Title } from "@solidjs/meta";
import { A, useNavigate, type RouteDefinition } from "@solidjs/router";
import { BsTrash } from "solid-icons/bs";
import { For, Show, onMount } from "solid-js";
import { useBoards } from "~/components/board-data";

export const route = {
  load: () => {},
} satisfies RouteDefinition;

export default function Home() {
  const serverBoards = useBoards();

  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    inputRef?.focus();
  });

  const nav = useNavigate();

  const boardsList = () => Object.values(serverBoards.boards() || {});

  return (
    <main class="w-full p-8 space-y-2">
      <Title>Boards | Strello</Title>

      <div class="h-full">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get("name") as string;
            const color = formData.get("color") as string;
            const boardId = await serverBoards.createBoard(name, color);
            nav(`/board/${boardId}`);
          }}
          class="max-w-md"
        >
          <div>
            <h2 class="w-full text-2xl font-medium block rounded-lg text-left border border-transparent pb-4">
              New Board
            </h2>
            <label for="name" class="block text-sm font-medium leading-6 ">
              Name
            </label>
            <div class="mt-2">
              <input
                name="name"
                ref={inputRef}
                autofocus
                type="text"
                required
                id="name"
                class="dark:text-white px-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div class="mt-4 flex items-center gap-4">
            <div class="flex items-center gap-1">
              <label
                for="board-color"
                class="block text-sm font-medium leading-6"
              >
                Color
              </label>
              <input
                id="board-color"
                name="color"
                type="color"
                class="bg-slate-800 bg-opacity-0 hover:bg-opacity-20 rounded"
                value="#A2DEFF"
              />
            </div>
            <button
              type="submit"
              class="flex w-full justify-center rounded-md bg-slate-900 text-white px-1 py-1 text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-slate-800"
            >
              Create
            </button>
          </div>
        </form>
        <div class="py-8">
          <h2 class="font-bold mb-2 text-xl">Boards</h2>
          <nav class="flex flex-wrap gap-8">
            <Show when={boardsList().length} fallback="No boards found.">
              <For each={boardsList() || []}>
                {(board) => (
                  <div class="relative">
                    <A
                      class="w-60 h-40 p-4 block border-b-8 shadow rounded hover:shadow-lg bg-slate-50 relative "
                      href={`/board/${board.board.id}`}
                      style={`border-color: ${board.board.color}`}
                    >
                      <div class="font-bold">{board.board.title}</div>
                    </A>

                    <form
                      class="absolute top-2.5 right-2.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        serverBoards.deleteBoard(board.board.id);
                      }}
                    >
                      <button
                        aria-label="Delete board"
                        class="btn btn-ghost btn-sm btn-circle"
                        type="submit"
                      >
                        <BsTrash />
                      </button>
                    </form>
                  </div>
                )}
              </For>
            </Show>
          </nav>
        </div>
      </div>
    </main>
  );
}

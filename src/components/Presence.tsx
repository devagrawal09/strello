import { createComputed, createEffect, createSignal, For } from "solid-js";
import { PresenceUser, usePresence } from "./board-data";
import { createSocketMemo } from "../../socket/lib/shared";
import {
  createPositionToElement,
  useMousePosition,
} from "@solid-primitives/mouse";
import { debounce } from "@solid-primitives/scheduled";
import { createStore, reconcile } from "solid-js/store";
import { Tooltip } from "@kobalte/core/tooltip";
import { RiDevelopmentCursorLine } from "solid-icons/ri";

export function Presence() {
  const pos = useMousePosition();
  const users = usePresence(createSocketMemo(() => pos));
  const [presenceStore, setPresenceStore] = createStore<PresenceUser[]>([]);

  createComputed(() =>
    setPresenceStore(reconcile(Object.values(users() || {})))
  );

  return (
    <div style={{ "text-align": "right", height: "0", padding: "5px 0" }}>
      <For each={presenceStore}>
        {(user) => {
          createEffect(() => {
            console.log(user.name, user.x, user.y);
          });
          return (
            <Tooltip>
              <Tooltip.Trigger>
                <div
                  style={{
                    "background-color": `#${user.color}`,
                    "border-radius": "50%",
                    width: "30px",
                    height: "30px",
                    display: "inline-block",
                    "text-align": "center",
                    "line-height": "30px",
                    color: "white",
                    "font-weight": "bold",
                    "margin-right": "5px",
                    "font-size": "12px",
                  }}
                >
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  style={{
                    "background-color": `#${user.color}`,
                    color: "white",
                    "border-radius": "5px",
                    padding: "5px",
                  }}
                >
                  <Tooltip.Arrow />
                  {user.name}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip>
          );
        }}
      </For>
      <For each={presenceStore}>
        {(user) => {
          return (
            <div
              class="user"
              style={{
                position: "absolute",
                left: `${user.x}px`,
                top: `${user.y}px`,
                color: `#${user.color}`,
                "font-size": "25px",
                "z-index": "10",
              }}
            >
              <RiDevelopmentCursorLine />
            </div>
          );
        }}
      </For>
    </div>
  );
}

function createDebouncedMousePos(ref: () => HTMLElement | undefined) {
  const pos = useMousePosition();
  const relative = createPositionToElement(ref, () => pos);
  const [debouncedPos, setDebouncedPos] = createSignal<{
    x: number;
    y: number;
  }>();
  const trigger = debounce(
    (pos: { x: number; y: number }) => setDebouncedPos(pos),
    5
  );
  createEffect(() => {
    const { x, y } = relative;
    x && y && trigger({ x, y });
  });
  return debouncedPos;
}

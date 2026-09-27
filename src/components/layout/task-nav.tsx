"use client";

import { cn } from "@/lib/cn";
import { TASKS, TASK_ORDER } from "@/lib/tasks";
import { TaskIcon, TASK_ICON_SIZE } from "@/components/ui/task-icon";
import type { TaskId } from "@/types/task";

export interface TaskNavProps {
  activeTask: TaskId;
  onSelect: (id: TaskId) => void;
}

const SHORT_LABEL: Record<TaskId, string> = {
  imgconvert: "Image",
  vidconvert: "Video",
  trim: "Trim",
  audio: "Audio",
  gif: "GIF",
  poster: "Poster",
};

export function TaskNav({ activeTask, onSelect }: TaskNavProps) {
  return (
    <>
      {/* desktop side rail */}
      <nav
        aria-label="Tasks"
        className="hidden w-[220px] flex-none overflow-y-auto border-r border-line px-2.5 py-[18px] md:block"
      >
        <div className="px-2.5 pb-2.5 font-mono text-[11px] text-text-dim">
          TASKS
        </div>
        <ul className="flex flex-col gap-0.5">
          {TASK_ORDER.map((id) => {
            const task = TASKS[id];
            const active = id === activeTask;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-[11px] text-left text-[14.5px] transition-colors",
                    active
                      ? "bg-panel-2 shadow-[inset_3px_0_0_var(--amber)]"
                      : "hover:bg-panel-2"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="flex w-[18px] flex-none items-center justify-center">
                    <TaskIcon name={task.icon} size={TASK_ICON_SIZE} />
                  </span>
                  <span>{task.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* mobile bottom nav */}
      <nav
        aria-label="Tasks"
        className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 backdrop-blur-md md:hidden"
      >
        <ul className="flex overflow-x-auto">
          {TASK_ORDER.map((id) => {
            const task = TASKS[id];
            const active = id === activeTask;
            return (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  className={cn(
                    "flex w-full min-w-[64px] cursor-pointer flex-col items-center gap-1 px-1 py-2.5 text-[10px] transition-colors",
                    active
                      ? "text-amber shadow-[inset_0_2px_0_var(--amber)]"
                      : "text-text-dim hover:text-text"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <TaskIcon name={task.icon} size={20} strokeWidth={active ? 2.25 : 2} />
                  <span className="max-w-full truncate px-0.5">
                    {SHORT_LABEL[id]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

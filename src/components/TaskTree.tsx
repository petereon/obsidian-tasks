import React from "react";
import type { Task } from "../types";
import { TaskItem } from "./TaskItem";

interface Props {
  task: Task;
  depth: number;
  completed: boolean;
  childrenByParent: Map<string, Task[]>;
  onToggle: (task: Task) => void;
  onSkip?: (task: Task) => void;
}

// Renders a task row plus its subtasks (recursively, indented). The parent's
// `completed` flag reflects which bucket/section it's rendered in; a child's
// own completed state is used instead, since children aren't independently
// bucketed — they always render nested under their parent.
export function TaskTree({ task, depth, completed, childrenByParent, onToggle, onSkip }: Props) {
  const children = childrenByParent.get(task.id) ?? [];

  return (
    <>
      <TaskItem task={task} completed={completed} onToggle={onToggle} onSkip={onSkip} indent={depth} />
      {children.map((child) => (
        <TaskTree
          key={child.id}
          task={child}
          depth={depth + 1}
          completed={child.completed}
          childrenByParent={childrenByParent}
          onToggle={onToggle}
          onSkip={onSkip}
        />
      ))}
    </>
  );
}

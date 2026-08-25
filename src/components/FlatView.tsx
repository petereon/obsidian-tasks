import React from "react";
import type { Task } from "../types";
import { TaskTree } from "./TaskTree";

interface Props {
  activeTasks: Task[];
  completedTodayTasks: Task[];
  childrenByParent: Map<string, Task[]>;
  onToggle: (task: Task) => void;
  onSkip: (task: Task) => void;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.getTime() - b.due.getTime();
  });
}

export function FlatView({ activeTasks, completedTodayTasks, childrenByParent, onToggle, onSkip }: Props) {
  const sorted = sortTasks(activeTasks);
  const sortedCompleted = sortTasks(completedTodayTasks);

  return (
    <div className="tasks-flat">
      {sorted.map((task) => (
        <TaskTree
          key={task.id}
          task={task}
          depth={0}
          completed={false}
          childrenByParent={childrenByParent}
          onToggle={onToggle}
          onSkip={onSkip}
        />
      ))}
      {sortedCompleted.map((task) => (
        <TaskTree
          key={task.id}
          task={task}
          depth={0}
          completed={true}
          childrenByParent={childrenByParent}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

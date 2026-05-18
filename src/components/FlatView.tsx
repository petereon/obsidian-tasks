import React from "react";
import type { Task } from "../types";
import { TaskItem } from "./TaskItem";

interface Props {
  activeTasks: Task[];
  completedTodayTasks: Task[];
  onToggle: (task: Task) => void;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.getTime() - b.due.getTime();
  });
}

export function FlatView({ activeTasks, completedTodayTasks, onToggle }: Props) {
  const sorted = sortTasks(activeTasks);
  const sortedCompleted = sortTasks(completedTodayTasks);

  return (
    <div className="tasks-flat">
      {sorted.map((task) => (
        <TaskItem key={task.id} task={task} completed={false} onToggle={onToggle} />
      ))}
      {sortedCompleted.map((task) => (
        <TaskItem key={task.id} task={task} completed={true} onToggle={onToggle} />
      ))}
    </div>
  );
}

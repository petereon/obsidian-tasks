import React, { useState } from "react";
import type { Task } from "../types";
import { type SortDirection, type SortField, sortTasks } from "../sortTasks";
import { TaskTree } from "./TaskTree";

interface Props {
  activeTasks: Task[];
  completedTodayTasks: Task[];
  childrenByParent: Map<string, Task[]>;
  onToggle: (task: Task) => void;
  onSkip: (task: Task) => void;
}

export function FlatView({ activeTasks, completedTodayTasks, childrenByParent, onToggle, onSkip }: Props) {
  const [sortField, setSortField] = useState<SortField>("due");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const sorted = sortTasks(activeTasks, sortField, direction);
  const sortedCompleted = sortTasks(completedTodayTasks, sortField, direction);

  return (
    <div className="tasks-flat">
      <div className="tasks-flat__sort-bar">
        <button
          className={`tasks-flat__sort-btn${sortField === "due" ? " tasks-flat__sort-btn--active" : ""}`}
          onClick={() => setSortField("due")}
        >
          Due
        </button>
        <button
          className={`tasks-flat__sort-btn${sortField === "priority" ? " tasks-flat__sort-btn--active" : ""}`}
          onClick={() => setSortField("priority")}
        >
          Priority
        </button>
        <button
          className="tasks-flat__sort-dir"
          onClick={() => setDirection((d) => (d === "asc" ? "desc" : "asc"))}
          title={direction === "asc" ? "Ascending — click for descending" : "Descending — click for ascending"}
        >
          {direction === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>
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

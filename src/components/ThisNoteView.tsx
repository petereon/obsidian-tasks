import React, { useEffect, useState } from "react";
import type { Task } from "../types";
import { splitByNote } from "../thisNote";
import { Section } from "./GroupedView";
import { useApp } from "./AppContext";

interface Props {
  activeTasks: Task[];
  childrenByParent: Map<string, Task[]>;
  onToggle: (task: Task) => void;
  onSkip: (task: Task) => void;
}

export function ThisNoteView({ activeTasks, childrenByParent, onToggle, onSkip }: Props) {
  const app = useApp();
  // file-open (not active-leaf-change) so clicking the panel itself doesn't clear the note.
  const [activePath, setActivePath] = useState<string | null>(() => app.workspace.getActiveFile()?.path ?? null);
  useEffect(() => {
    const ref = app.workspace.on("file-open", (f) => setActivePath(f?.path ?? null));
    return () => app.workspace.offref(ref);
  }, [app]);

  const { inNote, backlinks } = splitByNote(activeTasks, activePath, app.metadataCache.resolvedLinks);

  if (!activePath) return <div className="tasks-empty">Open a note to see its tasks.</div>;
  if (inNote.length === 0 && backlinks.length === 0) {
    return <div className="tasks-empty">No open tasks in or linking to this note.</div>;
  }

  return (
    <div className="tasks-this-note">
      {inNote.length > 0 && (
        <Section label="IN THIS NOTE" tasks={inNote} defaultOpen={true}
          childrenByParent={childrenByParent} onToggle={onToggle} onSkip={onSkip} />
      )}
      {backlinks.length > 0 && (
        <Section label="LINKING HERE" tasks={backlinks} defaultOpen={true}
          childrenByParent={childrenByParent} onToggle={onToggle} onSkip={onSkip} />
      )}
    </div>
  );
}

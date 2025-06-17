import {
  ContextMenuData,
  Task,
  TaskDataHandlers,
  TaskFolder,
} from "../../types";
import { DragData } from "../../Hooks/DragAndDropHook";
import TaskFolderComponent from "./TaskFolder";
import { DropTarget } from "../../Hooks/DragAndDropHook";

interface FolderListProps {
  folders: TaskFolder[];
  handlers: TaskDataHandlers;
  draggedTask: DragData | null;
  selectedTaskId: string | null;
  selectedFolderId: string | null;
  onContextMenu: (e: React.MouseEvent, data: ContextMenuData) => void;
  onTaskDragStart: (
    element: HTMLDivElement,
    clientX: number,
    clientY: number,
    task: Task,
    folderId: string
  ) => void;
  dropTarget: DropTarget | null;
  onTaskClick: (taskId: string, folderId: string) => void;
  onFolderContainerClick: (folderId: string) => void;
}

export default function FolderList({
  folders,
  handlers,
  draggedTask,
  selectedTaskId,
  selectedFolderId,
  onContextMenu,
  onTaskDragStart,
  dropTarget,
  onTaskClick,
  onFolderContainerClick,
}: FolderListProps) {
  // If there are no folders, this component renders nothing.
  if (folders.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {folders.map((folder) => (
        <TaskFolderComponent
          key={folder.id}
          folder={folder}
          toggleFolderVisibility={handlers.toggleFolderVisibility}
          toggleTaskCompletion={handlers.toggleTaskCompletion}
          deleteTask={handlers.deleteTask}
          duplicateTask={handlers.duplicateTask}
          deleteFolder={handlers.deleteFolder}
          onContextMenu={onContextMenu}
          onTaskDragStart={onTaskDragStart}
          onTaskClick={onTaskClick}
          onContainerClick={onFolderContainerClick}
          dropTarget={dropTarget}
          draggedTask={draggedTask}
          selectedTaskId={selectedTaskId}
          selectedFolderId={selectedFolderId}
        />
      ))}
    </div>
  );
}

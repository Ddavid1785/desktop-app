import { ContextMenuData, Task, TaskDataHandlers } from "../../types";
import { DragData } from "../../Hooks/DragAndDropHook";
import TaskComponent from "./Task";
import { DropTarget } from "../../Hooks/DragAndDropHook";

// Define the props this component needs.
interface UngroupedTaskListProps {
  tasks: Task[];
  handlers: TaskDataHandlers;
  draggedTask: DragData | null;
  selectedTaskId: string | null;
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
}

export default function UngroupedTaskList({
  tasks,
  handlers,
  draggedTask,
  selectedTaskId,
  onContextMenu,
  onTaskDragStart,
  dropTarget,
  onTaskClick,
}: UngroupedTaskListProps) {
  // Simplified logic: show empty state only when there are no tasks AND no drag is happening
  // This prevents the container from shrinking during drag operations
  const shouldShowEmptyState = tasks.length === 0;
  const isDragActive = draggedTask !== null;
  const isValidDropTarget = dropTarget?.folderId === "";

  return (
    <div
      className={`
        border-t border-gray-800 p-3 pt-2 space-y-2 transition-all duration-200
        max-h-48 overflow-y-auto no-scrollbar
        ${
          isValidDropTarget
            ? "bg-gray-900 ring-2 ring-blue-500/50"
            : "bg-transparent"
        }
      `}
      data-folder-drop-id=""
      style={{
        // Ensure consistent minimum height to prevent layout shifts
        minHeight: shouldShowEmptyState ? "4rem" : "auto",
      }}
    >
      {shouldShowEmptyState ? (
        <div className="text-gray-600 text-center py-4 text-sm h-16 flex items-center justify-center">
          {isDragActive && isValidDropTarget
            ? "Drop task here"
            : "No tasks yet"}
        </div>
      ) : (
        tasks.map((task, index) => (
          <TaskComponent
            key={task.id || `ungrouped-task-${task.id}-${index}`}
            task={task}
            folderId=""
            duplicateTask={handlers.duplicateTask}
            index={index}
            toggleTaskCompletion={handlers.toggleTaskCompletion}
            deleteTask={handlers.deleteTask}
            onContextMenu={onContextMenu}
            dropTarget={dropTarget}
            onMouseDown={(element, clientX, clientY) =>
              onTaskDragStart(element, clientX, clientY, task, "")
            }
            onClick={() => onTaskClick(task.id, "")}
            isDragging={draggedTask?.taskId === task.id}
            isSelected={selectedTaskId === task.id}
          />
        ))
      )}
    </div>
  );
}

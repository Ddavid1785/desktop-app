import { useRef } from "react";
import { Check, Trash2, Copy } from "lucide-react";
import { Task, ContextMenuData } from "../../types";
import { DropTarget } from "../../Hooks/DragAndDropHook";

export default function TaskComponent({
  task,
  folderId,
  index,
  toggleTaskCompletion,
  deleteTask,
  duplicateTask,
  onContextMenu,
  onMouseDown,
  onClick,
  isDragging = false,
  isSelected,
  dropTarget,
}: {
  task: Task;
  folderId: string;
  index: number;
  toggleTaskCompletion: (taskId: string, folderId: string) => void;
  deleteTask: (taskId: string, folderId: string) => void;
  duplicateTask: (taskId: string, folderId: string) => void;
  onContextMenu: (e: React.MouseEvent, data: ContextMenuData) => void;
  onMouseDown: (
    element: HTMLDivElement,
    clientX: number,
    clientY: number
  ) => void;
  onClick: () => void;
  isDragging?: boolean;
  isSelected: boolean;
  dropTarget: DropTarget | null;
}) {
  const dragStartTimer = useRef<number | null>(null);
  const initialMousePos = useRef<{ x: number; y: number } | null>(null);
  const DRAG_DELAY = 200;
  const DRAG_THRESHOLD = 5;

  const clearDragTimer = () => {
    if (dragStartTimer.current) {
      clearTimeout(dragStartTimer.current);
      dragStartTimer.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) {
      return;
    }
    clearDragTimer();

    const element = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;

    initialMousePos.current = { x: clientX, y: clientY };

    dragStartTimer.current = setTimeout(() => {
      onMouseDown(element, clientX, clientY);
      dragStartTimer.current = null;
    }, DRAG_DELAY);
  };

  const handleMouseUp = () => {
    clearDragTimer();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStartTimer.current && initialMousePos.current) {
      const dx = Math.abs(e.clientX - initialMousePos.current.x);
      const dy = Math.abs(e.clientY - initialMousePos.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        clearDragTimer();
        onMouseDown(e.currentTarget, e.clientX, e.clientY);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, {
      type: "task",
      taskId: task.id,
      isCompleted: task.completed,
      folderId: folderId,
    });
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleTaskCompletion(task.id, folderId);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteTask(task.id, folderId);
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    duplicateTask(task.id, folderId);
  };

  // Check if this task is the drop target
  const isDropTarget = dropTarget?.taskId === task.id;
  const isTopHalf = dropTarget?.isFolderTopHalf;

  return (
    <div className="relative">
      {/* Improved drop indicator - only shows between tasks, not at widget edges */}
      {isDropTarget && (
        <div
          className={`
            absolute left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10
            shadow-lg shadow-blue-500/50
            ${isTopHalf ? "-top-1" : "-bottom-1"}
          `}
        />
      )}

      <div
        key={task.id || `task-${task.id}-${index}`}
        data-task-id={task.id}
        className={`
          group flex items-center gap-3 p-2 rounded-md relative
          transition-all duration-200 
          outline-2
          ${isDragging ? "opacity-0" : "opacity-100"}
          ${
            isDropTarget
              ? "ring-2 ring-blue-500/30 bg-blue-950/20"
              : task.completed
              ? "bg-gray-900"
              : "bg-gray-900 hover:bg-gray-800"
          }
          ${!isDragging ? "cursor-grab" : ""}
          ${
            isSelected
              ? "border-transparent outline-blue-500"
              : "border-gray-800 outline-transparent"
          }
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        <button
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            task.completed
              ? "bg-green-600 border-green-600"
              : "border-gray-600 hover:border-gray-500"
          }`}
          onClick={handleCheckboxClick}
        >
          {task.completed && <Check className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm truncate ${
              task.completed ? "line-through text-gray-500" : "text-gray-200"
            }`}
          >
            {task.text}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 transition-opacity ${
            isDragging ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <button
            onClick={handleCopyClick}
            className="text-gray-500 hover:text-blue-400 transition-all p-1 rounded hover:bg-gray-800 hover:cursor-pointer"
            title="Duplicate task"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="text-gray-500 hover:text-red-400 transition-all p-1 rounded hover:bg-gray-800 hover:cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

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
  
  // Enhanced color system
  const taskColor = task.colour || '#6366f1'; // Default to indigo if no color
  const completedColor = '#10b981'; // Green for completed tasks

  return (
    <div className="relative group">
      {/* Enhanced drop indicator with glow effect */}
      {isDropTarget && (
        <div
          className={`
            absolute left-0 right-0 h-1 rounded-full z-10
            transition-all duration-200 animate-pulse
            ${isTopHalf ? "-top-2" : "-bottom-2"}
          `}
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${taskColor} 50%, transparent 100%)`,
            boxShadow: `0 0 8px ${taskColor}40`
          }}
        />
      )}

      <div
        key={task.id || `task-${task.id}-${index}`}
        data-task-id={task.id}
        style={{ 
          '--task-color': taskColor,
          '--completed-color': completedColor
        } as React.CSSProperties}
        className={`
          group/task flex items-center gap-3 p-3 rounded-lg relative overflow-hidden
          transition-all duration-200 border focus:outline-none
          ${isDragging ? "opacity-0 scale-95" : "opacity-100 scale-100"}
          ${
            isDropTarget
              ? "ring-2 ring-blue-500/40 bg-blue-950/20 border-blue-500/30"
              : task.completed
              ? `bg-[var(--completed-color)]/10 border-[var(--completed-color)]/20 hover:bg-[var(--completed-color)]/15`
              : `bg-[var(--task-color)]/10 border-[var(--task-color)]/20 hover:bg-[var(--task-color)]/15 hover:border-[var(--task-color)]/30`
          }
          ${!isDragging ? "cursor-grab active:cursor-grabbing" : ""}
          ${
            isSelected
              ? "!border-blue-500 !outline-2 !outline-blue-500/50 !outline-offset-1 !outline"
              : ""
          }
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        tabIndex={-1}
      >
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 opacity-5 group-hover/task:opacity-10 transition-opacity duration-200"
          style={{
            background: task.completed 
              ? `linear-gradient(135deg, ${completedColor} 0%, transparent 70%)`
              : `linear-gradient(135deg, ${taskColor} 0%, transparent 70%)`
          }}
        />

        {/* Enhanced left accent bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover/task:w-1.5"
          style={{ 
            backgroundColor: task.completed ? completedColor : taskColor,
            opacity: task.completed ? 0.6 : 0.8
          }}
        />

        {/* Enhanced checkbox with glow effect */}
        <div className="relative z-10">
          <button
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center 
              transition-all duration-200 flex-shrink-0 relative overflow-hidden
              focus:outline-none
              ${
                task.completed
                  ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500 shadow-lg shadow-green-500/25"
                  : "border-gray-500 hover:border-gray-400 bg-gray-900/50 hover:bg-gray-800/50"
              }
            `}
            onClick={handleCheckboxClick}
          >
            {/* Subtle inner glow for unchecked state */}
            {!task.completed && (
              <div 
                className="absolute inset-0.5 rounded-full opacity-20 transition-opacity duration-200 hover:opacity-30"
                style={{ backgroundColor: taskColor }}
              />
            )}
            
            {task.completed && (
              <Check 
                className="w-3 h-3 text-white transition-transform duration-200 scale-100" 
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
              />
            )}
          </button>
        </div>

        {/* Enhanced task text */}
        <div className="flex-1 min-w-0 relative z-10">
          <p
            className={`
              text-sm font-medium transition-all duration-200 relative
              ${
                task.completed 
                  ? "line-through text-gray-400" 
                  : "text-gray-100 group-hover/task:text-white"
              }
            `}
            style={{
              textShadow: task.completed ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {task.text}
          </p>
          
          {/* Subtle color accent line under text */}
          {!task.completed && (
            <div 
              className="absolute bottom-0 left-0 h-0.5 w-0 group-hover/task:w-full transition-all duration-300 rounded-full"
              style={{ 
                backgroundColor: taskColor,
                opacity: 0.3
              }}
            />
          )}
        </div>

        {/* Enhanced action buttons */}
        <div
          className={`
            flex items-center gap-1 transition-all duration-200 relative z-10
            ${isDragging ? "opacity-0" : "opacity-0 group-hover/task:opacity-100"}
          `}
        >
          <button
            onClick={handleCopyClick}
            className="
              text-gray-500 hover:text-blue-400 transition-all duration-200 
              p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110
              relative overflow-hidden group/btn focus:outline-none
            "
            title="Duplicate task"
          >
            {/* Subtle button glow on hover */}
            <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
            <Copy className="w-4 h-4 relative z-10" />
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="
              text-gray-500 hover:text-red-400 transition-all duration-200 
              p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110
              relative overflow-hidden group/btn focus:outline-none
            "
            title="Delete task"
          >
            {/* Subtle button glow on hover */}
            <div className="absolute inset-0 bg-red-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
            <Trash2 className="w-4 h-4 relative z-10" />
          </button>
        </div>

        {/* Task priority indicator (small colored dot) */}
        <div 
          className={`
            absolute top-2 right-2 w-1.5 h-1.5 rounded-full transition-all duration-200
            ${task.completed ? "opacity-30" : "opacity-60 group-hover/task:opacity-80"}
          `}
          style={{ 
            backgroundColor: task.completed ? completedColor : taskColor
          }}
        />
      </div>
    </div>
  );
}
import { Circle, Trash2 } from "lucide-react";
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
  onContainerClick: (folderId: string) => void;
  selectedFolderId: string | null;
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
  onContainerClick,
  selectedFolderId,
}: UngroupedTaskListProps) {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const remainingTasks = totalTasks - completedTasks;
  
  const shouldShowEmptyState = tasks.length === 0;
  const isDragActive = draggedTask !== null;
  const isValidDropTarget = dropTarget?.folderId === "ungrouped";
  const isUngroupedSelected = selectedFolderId === "ungrouped" && !selectedTaskId;

  // Define the ungrouped section color
  const ungroupedColor = '#10b981'; // Green for ungrouped tasks

  return (
    <div
      style={{ '--ungrouped-color': ungroupedColor } as React.CSSProperties}
      className={`
        bg-gray-950 rounded-lg mb-3 overflow-hidden 
        transition-all duration-200 
        outline-2 outline-offset-2
        border border-gray-800 
        border-l-4 
        ${
          isUngroupedSelected
            ? "border-transparent outline-blue-500"
            : "border-l-[var(--ungrouped-color)] outline-transparent"
        }
        ${isValidDropTarget ? "ring-2 ring-[var(--ungrouped-color)]/40" : ""}
      `}
    >
      {/* Enhanced header matching folder style */}
      <div
        className="group flex items-center gap-3 p-3 transition-all cursor-pointer relative overflow-hidden"
        onClick={() => onContainerClick("ungrouped")}
        data-folder-drop-id="ungrouped"
        style={{
          background: `linear-gradient(135deg, ${ungroupedColor}08 0%, ${ungroupedColor}04 50%, transparent 100%)`
        }}
      >
        {/* Subtle animated accent bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-2"
          style={{ backgroundColor: ungroupedColor }}
        />
        
        {/* Enhanced ungrouped icon with subtle glow effect */}
        <div className="relative ml-2">
          <Circle 
            className="w-4 h-4 transition-all duration-200 group-hover:scale-110" 
            style={{ color: ungroupedColor }}
          />
          <div 
            className="absolute inset-0 w-4 h-4 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-200 blur-sm"
            style={{ backgroundColor: ungroupedColor }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Enhanced section name with subtle color accent */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate group-hover:text-gray-100 transition-colors">
              Ungrouped Tasks
            </h3>
            {/* Small colored dot as accent */}
            <div 
              className="w-1.5 h-1.5 rounded-full opacity-60 group-hover:opacity-80 transition-opacity"
              style={{ backgroundColor: ungroupedColor }}
            />
          </div>
        </div>
        
        {/* Clear all completed button */}
        {completedTasks > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // You might want to add a handler for clearing completed tasks
              tasks.filter(task => task.completed).forEach(task => {
                handlers.deleteTask(task.id, "ungrouped");
              });
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-gray-800 transition-all duration-200"
            title="Clear completed tasks"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        {/* Enhanced status indicator */}
        <div className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              remainingTasks > 0 ? "opacity-40" : "opacity-80 animate-pulse"
            }`}
            style={{ 
              backgroundColor: remainingTasks > 0 ? ungroupedColor : '#10b981'
            }}
          />
          <div className={`text-xs font-medium ${
            remainingTasks > 0 
              ? "text-gray-400 group-hover:text-gray-300"
              : "text-green-400"
          } transition-colors`}>
            {totalTasks === 0 
              ? "No tasks" 
              : remainingTasks > 0 
                ? `${remainingTasks} remaining` 
                : "All done"
            }
          </div>
        </div>
      </div>

      {/* Enhanced content area */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onContainerClick("ungrouped");
          }
        }}
        className={`
          border-t transition-all duration-200
          max-h-48 overflow-y-auto no-scrollbar
          ${
            isValidDropTarget
              ? `bg-[var(--ungrouped-color)]/15 border-[var(--ungrouped-color)]/30`
              : "bg-gray-950/50 border-gray-800"
          }
        `}
        data-folder-drop-id="ungrouped"
        style={{
          minHeight: shouldShowEmptyState ? "4rem" : "auto",
          background: isValidDropTarget 
            ? `linear-gradient(135deg, ${ungroupedColor}15 0%, ${ungroupedColor}08 100%)`
            : `linear-gradient(135deg, ${ungroupedColor}03 0%, transparent 100%)`
        }}
      >
        <div className="p-3 pt-2 space-y-2">
          {shouldShowEmptyState ? (
            <div className={`text-center py-4 text-sm h-16 flex items-center justify-center transition-colors ${
              isDragActive && isValidDropTarget 
                ? "text-gray-300 font-medium" 
                : "text-gray-600"
            }`}>
              {isDragActive && isValidDropTarget ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: ungroupedColor }}
                  />
                  Drop task here
                </div>
              ) : (
                "No tasks yet"
              )}
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskComponent
                key={task.id || `ungrouped-task-${task.id}-${index}`}
                task={task}
                folderId="ungrouped"
                duplicateTask={handlers.duplicateTask}
                index={index}
                toggleTaskCompletion={handlers.toggleTaskCompletion}
                deleteTask={handlers.deleteTask}
                onContextMenu={onContextMenu}
                dropTarget={dropTarget}
                onMouseDown={(element, clientX, clientY) =>
                  onTaskDragStart(element, clientX, clientY, task, "ungrouped")
                }
                onClick={() => onTaskClick(task.id, "ungrouped")}
                isDragging={draggedTask?.taskId === task.id}
                isSelected={selectedTaskId === task.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
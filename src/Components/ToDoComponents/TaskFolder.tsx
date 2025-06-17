import { ChevronDown, ChevronRight, Folder, Trash2 } from "lucide-react";
import { ContextMenuData, TaskFolder, Task, DragData } from "../../types";
import TaskComponent from "./Task";
import { DropTarget } from "../../Hooks/DragAndDropHook";

export default function TaskFolderComponent({
  folder,
  toggleFolderVisibility,
  toggleTaskCompletion,
  deleteTask,
  deleteFolder,
  onContextMenu,
  duplicateTask,
  onTaskDragStart,
  onTaskClick,
  onContainerClick,
  draggedTask,
  selectedTaskId,
  selectedFolderId,
  dropTarget,
}: {
  folder: TaskFolder;
  toggleFolderVisibility: (folderId: string) => void;
  toggleTaskCompletion: (taskId: string, folderId: string) => void;
  deleteTask: (taskId: string, folderId: string) => void;
  deleteFolder: (folderId: string) => void;
  onContextMenu: (e: React.MouseEvent, data: ContextMenuData) => void;
  duplicateTask: (taskId: string, folderId: string) => void;
  onTaskDragStart: (
    element: HTMLDivElement,
    clientX: number,
    clientY: number,
    task: Task,
    folderId: string
  ) => void;
  onTaskClick: (taskId: string, folderId: string) => void;
  onContainerClick: (folderId: string) => void;
  draggedTask: DragData | null;
  selectedTaskId: string | null;
  selectedFolderId: string | null;
  dropTarget: DropTarget | null;
}) {
  const completedTasks = folder.tasks.filter((task) => task.completed).length;
  const totalTasks = folder.tasks.length;
  const remainingTasks = totalTasks - completedTasks;
  const allTasksCompleted = totalTasks > 0 && remainingTasks === 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, {
      type: "folder",
      folderId: folder.id,
      folder_visible: folder.visible,
      tasks: folder.tasks,
    });
  };

  const isCurrentlyDragOver = dropTarget?.folderId === folder.id;
  const isFolderSelected = selectedFolderId === folder.id && !selectedTaskId;

  // Fixed: Simplified logic to prevent layout shifts during drag operations
  const shouldShowEmptyState = folder.tasks.length === 0;
  const isDragActive = draggedTask !== null;

  return (
    <div
      className={`
        bg-gray-950 rounded-lg mb-3 overflow-hidden 
        transition-colors duration-200 
        outline-2 outline-offset-2
        ${
          isFolderSelected
            ? "border-transparent outline-blue-500"
            : "border-gray-800 outline-transparent"
        }
    `}
      onContextMenu={handleContextMenu}
    >
      {/* Header remains the same */}
      <div
        className="group flex items-center gap-3 p-3 hover:bg-gray-900 transition-all cursor-pointer"
        onClick={() => toggleFolderVisibility(folder.id)}
      >
        <button className="text-gray-400 hover:text-gray-200 transition-colors hover:cursor-pointer">
          {folder.visible ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div
          className={`${
            allTasksCompleted ? "text-green-400" : "text-blue-400"
          }`}
        >
          <Folder className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {folder.name}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteFolder(folder.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-gray-800"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="text-xs text-gray-500 w-16 text-right">
          {remainingTasks > 0 ? `${remainingTasks} remaining` : "All done"}
        </div>
      </div>

      {/* Fixed content area with consistent height */}
      {folder.visible && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onContainerClick(folder.id);
            }
          }}
          className={`
                border-t border-gray-800 p-3 pt-2 space-y-2 transition-all duration-200
                max-h-48 overflow-y-auto no-scrollbar
                ${
                  isCurrentlyDragOver
                    ? "bg-gray-900 ring-2 ring-blue-500/50"
                    : "bg-transparent"
                }
            `}
          data-folder-drop-id={folder.id}
          style={{
            // Force minimum height to prevent layout shifts
            minHeight: shouldShowEmptyState ? "4rem" : "auto",
          }}
        >
          {shouldShowEmptyState ? (
            <div className="text-gray-600 text-center py-4 text-sm h-16 flex items-center justify-center">
              {isDragActive && isCurrentlyDragOver
                ? "Drop task here"
                : "No tasks in folder"}
            </div>
          ) : (
            folder.tasks.map((task, index) => (
              <TaskComponent
                key={task.id || `folder-${folder.id}-task-${task.id}-${index}`}
                task={task}
                folderId={folder.id}
                duplicateTask={duplicateTask}
                index={index}
                toggleTaskCompletion={toggleTaskCompletion}
                deleteTask={deleteTask}
                onContextMenu={onContextMenu}
                dropTarget={dropTarget}
                onMouseDown={(element, clientX, clientY) =>
                  onTaskDragStart(element, clientX, clientY, task, folder.id)
                }
                isDragging={draggedTask?.taskId === task.id}
                onClick={() => onTaskClick(task.id, folder.id)}
                isSelected={selectedTaskId === task.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

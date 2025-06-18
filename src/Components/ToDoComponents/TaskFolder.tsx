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

  const shouldShowEmptyState = folder.tasks.length === 0;
  const isDragActive = draggedTask !== null;

  const folderColor = folder.colour || '#8b5cf6';

  return (
    <div
      style={{ '--folder-color': folderColor } as React.CSSProperties}
      className={`
        bg-gray-950 rounded-lg mb-3 overflow-hidden 
        transition-all duration-200 
        outline-2 outline-offset-2
        border border-gray-800 
        border-l-4 
        ${
          isFolderSelected
            ? "border-transparent outline-blue-500"
            : "border-l-[var(--folder-color)] outline-transparent"
        }
        ${isCurrentlyDragOver ? "ring-2 ring-[var(--folder-color)]/40" : ""}
      `}
      onContextMenu={handleContextMenu}
    >
      {/* Enhanced header with better color integration */}
      <div
        className="group flex items-center gap-3 p-3 transition-all cursor-pointer relative overflow-hidden"
        onClick={() => toggleFolderVisibility(folder.id)}
        data-folder-drop-id={folder.id}
        style={{
          background: `linear-gradient(135deg, ${folderColor}08 0%, ${folderColor}04 50%, transparent 100%)`
        }}
      >
        {/* Subtle animated accent bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-2"
          style={{ backgroundColor: folderColor }}
        />
        
        <button className="text-gray-400 hover:text-gray-200 transition-colors hover:cursor-pointer ml-2">
          {folder.visible ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {/* Enhanced folder icon with subtle glow effect */}
        <div className="relative">
          <Folder 
            className="w-4 h-4 transition-all duration-200 group-hover:scale-110" 
            style={{ color: folderColor }}
          />
          <div 
            className="absolute inset-0 w-4 h-4 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-200 blur-sm"
            style={{ backgroundColor: folderColor }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Enhanced folder name with subtle color accent */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate group-hover:text-gray-100 transition-colors">
              {folder.name}
            </h3>
            {/* Small colored dot as accent */}
            <div 
              className="w-1.5 h-1.5 rounded-full opacity-60 group-hover:opacity-80 transition-opacity"
              style={{ backgroundColor: folderColor }}
            />
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteFolder(folder.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-gray-800 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        {/* Enhanced status indicator */}
        <div className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              remainingTasks > 0 ? "opacity-40" : "opacity-80 animate-pulse"
            }`}
            style={{ 
              backgroundColor: remainingTasks > 0 ? folderColor : '#10b981'
            }}
          />
          <div className={`text-xs font-medium ${
            remainingTasks > 0 
              ? "text-gray-400 group-hover:text-gray-300"
              : "text-green-400"
          } transition-colors`}>
            {remainingTasks > 0 ? `${remainingTasks} remaining` : "All done"}
          </div>
        </div>
      </div>

      {/* Enhanced content area */}
      {folder.visible && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onContainerClick(folder.id);
            }
          }}
          className={`
            border-t transition-all duration-200
            max-h-48 overflow-y-auto no-scrollbar
            ${
              isCurrentlyDragOver
                ? `bg-[var(--folder-color)]/15 border-[var(--folder-color)]/30`
                : "bg-gray-950/50 border-gray-800"
            }
          `}
          data-folder-drop-id={folder.id}
          style={{
            minHeight: shouldShowEmptyState ? "4rem" : "auto",
            background: isCurrentlyDragOver 
              ? `linear-gradient(135deg, ${folderColor}15 0%, ${folderColor}08 100%)`
              : `linear-gradient(135deg, ${folderColor}03 0%, transparent 100%)`
          }}
        >
          <div className="p-3 pt-2 space-y-2">
            {shouldShowEmptyState ? (
              <div className={`text-center py-4 text-sm h-16 flex items-center justify-center transition-colors ${
                isDragActive && isCurrentlyDragOver 
                  ? "text-gray-300 font-medium" 
                  : "text-gray-600"
              }`}>
                {isDragActive && isCurrentlyDragOver ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: folderColor }}
                    />
                    Drop task here
                  </div>
                ) : (
                  "No tasks in folder"
                )}
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
        </div>
      )}
    </div>
  );
}
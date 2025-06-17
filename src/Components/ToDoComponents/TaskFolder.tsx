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

  // Get the color from folder.colour (assuming same format as task.colour)
  const folderColor = folder.colour || '#8b5cf6';

  return (
    <div
      // STEP 1: Set the CSS variable on the parent element.
      style={{ '--folder-color': folderColor } as React.CSSProperties}
      className={`
        bg-gray-950 rounded-lg mb-3 overflow-hidden 
        transition-colors duration-200 
        outline-2 outline-offset-2
        border border-gray-800 
        border-l-4 
        ${
          isFolderSelected
            ? "border-transparent outline-blue-500"
            : "border-l-[var(--folder-color)] outline-transparent" // STEP 2: Use the variable for the left border color.
        }
    `}
      onContextMenu={handleContextMenu}
    >
      {/* Header with color accents */}
      <div
        className={`group flex items-center gap-3 p-3 transition-all cursor-pointer ${
          !folder.visible && isCurrentlyDragOver ? "bg-[var(--folder-color)]/20" : ""
        }`}
        style={{ 
          backgroundColor: folder.colour ? `${folder.colour}10` : 'transparent',
          '--hover-color': folder.colour ? `${folder.colour}20` : '#1f2937'
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = folder.colour ? `${folder.colour}20` : '#1f2937';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = folder.colour ? `${folder.colour}10` : 'transparent';
        }}
        onClick={() => toggleFolderVisibility(folder.id)}
        data-folder-drop-id={folder.id}
      >
        <button className="text-gray-400 hover:text-gray-200 transition-colors hover:cursor-pointer">
          {folder.visible ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div
          className={`text-[var(--folder-color)] ${folderColor === '#111827' ? 'text-white' : ''}`}
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
        <div className={`text-xs w-16 text-right ${
          remainingTasks > 0 
            ? folderColor === '#111827' 
              ? "text-white/70"
              : "text-[var(--folder-color)]/70"
            : "text-green-400/70"
        }`}>
          {remainingTasks > 0 ? `${remainingTasks} remaining` : "All done"}
        </div>
      </div>

      {/* Content area with subtle color accent */}
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
                    ? `bg-[var(--folder-color)]/20 ring-2 ring-[var(--folder-color)]/50` // Use variable for drag-over state
                    : "bg-transparent"
                }
            `}
          data-folder-drop-id={folder.id}
          style={{
            minHeight: shouldShowEmptyState ? "4rem" : "auto",
          }}
        >
          {shouldShowEmptyState ? (
            <div className={`text-gray-600 text-center py-4 text-sm h-16 flex items-center justify-center ${
              isDragActive && isCurrentlyDragOver ? `text-[var(--folder-color)]` : "" // Use variable for drag-over text
            }`}>
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
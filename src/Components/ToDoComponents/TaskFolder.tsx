import { ChevronDown, ChevronRight, Folder, Trash2, Edit, Save, X, Palette, Wand2, Check } from "lucide-react";
import { ContextMenuData, TaskFolder, Task, DragData } from "../../types";
import TaskComponent from "./Task";
import { DropTarget } from "../../Hooks/DragAndDropHook";
import { useState, useRef } from "react";
import CustomColorPicker from "../ColorPicker";
import { createPortal } from "react-dom";

const COLORS = [
  { name: "Default", value: "#8b5cf6" }, // purple-600
  { name: "Blue", value: "#2563eb" },    // blue-600
  { name: "Green", value: "#16a34a" },   // green-600
  { name: "Purple", value: "#9333ea" },  // purple-600
  { name: "Pink", value: "#db2777" },    // pink-600
  { name: "Orange", value: "#ea580c" },  // orange-600
  { name: "Teal", value: "#0d9488" },    // teal-600
  { name: "Indigo", value: "#4f46e5" },  // indigo-600
  { name: "Cyan", value: "#0891b2" },    // cyan-600
  { name: "Rose", value: "#e11d48" },    // rose-600
  { name: "Amber", value: "#d97706" },   // amber-600
];

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
  editTask,
  editFolder,
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
  editTask: (taskId: string, folderId: string, newText: string, newColour: string) => void;
  editFolder: (folderId: string, newName: string, newColour: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFolder, setEditedFolder] = useState<{name: string, colour: string}>({name: folder.name, colour: folder.colour});
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleContainerClick = (e: React.MouseEvent) => {
    // Allow selection when clicking anywhere in the content area that's not a task
    const target = e.target as HTMLElement;
    const isClickOnTask = target.closest('[data-task-id]');
    
    if (!isClickOnTask && !isEditing) {
      onContainerClick(folder.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
    setEditedFolder({name: folder.name, colour: folder.colour});
    // Focus the input after a brief delay to ensure it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleSaveEdit = () => {
    if (editedFolder.name.trim()) {
      editFolder(folder.id, editedFolder.name.trim(), editedFolder.colour);
    }
    setIsEditing(false);
    setShowColorMenu(false);
    setShowCustomPicker(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowColorMenu(false);
    setShowCustomPicker(false);
    setEditedFolder({name: folder.name, colour: folder.colour});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleColorSelect = (color: string) => {
    setEditedFolder({...editedFolder, colour: color});
    setShowColorMenu(false);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    if (!isEditing) {
      toggleFolderVisibility(folder.id);
    }
  };

  const isCurrentlyDragOver = dropTarget?.folderId === folder.id;
  const isFolderSelected = selectedFolderId === folder.id && !selectedTaskId;

  const shouldShowEmptyState = folder.tasks.length === 0;
  const isDragActive = draggedTask !== null;

  const folderColor = isEditing ? editedFolder.colour || '#8b5cf6' : folder.colour || '#8b5cf6';

  return (
    <div
      style={{ '--folder-color': folderColor } as React.CSSProperties}
      className={`
        bg-gray-950 rounded-lg mb-3 overflow-hidden 
        transition-all duration-200 border
        border-l-4 
        ${
          isFolderSelected
            ? "!border-blue-500 !border-l-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)]"
            : "border-gray-800 border-l-[var(--folder-color)]"
        }
        ${isCurrentlyDragOver ? "ring-2 ring-[var(--folder-color)]/40" : ""}
      `}
      onContextMenu={isEditing ? undefined : handleContextMenu}
    >
      {/* Enhanced header with editing capability */}
      <div
        className="group flex items-center gap-3 p-3 transition-all cursor-pointer relative overflow-hidden"
        onClick={handleToggleVisibility}
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
          {/* Enhanced folder name with editing capability */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedFolder.name}
                onChange={(e) => setEditedFolder({...editedFolder, name: e.target.value})}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="
                  flex-1 bg-gray-800/50 border border-gray-600 rounded px-2 py-1 
                  text-sm text-gray-100 focus:outline-none focus:border-blue-500
                  focus:bg-gray-800/70 transition-all duration-200
                "
                placeholder="Enter folder name..."
              />
            ) : (
              <>
                <h3 className="text-sm font-medium text-white truncate group-hover:text-gray-100 transition-colors">
                  {folder.name}
                </h3>
                {/* Small colored dot as accent */}
                <div 
                  className="w-1.5 h-1.5 rounded-full opacity-60 group-hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: folderColor }}
                />
              </>
            )}
          </div>
        </div>

        {/* Edit controls when editing */}
        {isEditing && (
          <div className="flex items-center gap-2 relative z-10">
            {/* Color picker button */}
            <div className="relative">
              <button
                ref={colorButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorMenu(!showColorMenu);
                }}
                className="w-6 h-6 rounded border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
                style={{ backgroundColor: editedFolder.colour }}
                title="Change color"
              />
              
              {/* Color menu dropdown */}
              {showColorMenu && !showCustomPicker && createPortal(
                  <div 
                  className="fixed inset-0 z-50"
                  onClick={() => setShowColorMenu(false)}
                >
                  <div 
                    className="
                      absolute p-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 
                      rounded-2xl shadow-2xl z-10 w-60 overflow-hidden
                    "
                    style={{
                      left: colorButtonRef.current?.getBoundingClientRect().left ? 
                        colorButtonRef.current.getBoundingClientRect().left - 220 : 0,
                      top: colorButtonRef.current?.getBoundingClientRect().bottom ? 
                        colorButtonRef.current.getBoundingClientRect().bottom + 8 : 0,
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Menu gradient background */}
                    <div 
                      className="absolute inset-0 opacity-5"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)'
                      }}
                    />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">Choose Color</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleColorSelect(color.value)}
                            style={{ backgroundColor: color.value }}
                            className={`
                              group relative w-10 h-10 rounded-xl border-2 transition-all duration-200 
                              hover:scale-110 hover:shadow-lg overflow-hidden
                              ${editedFolder.colour === color.value
                                ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 border-white/50"
                                : "border-gray-600/30 hover:border-gray-500/50"
                              }
                            `}
                            title={color.name}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            {editedFolder.colour === color.value && (
                              <Check className="absolute inset-0 w-4 h-4 m-auto text-white" />
                            )}
                          </button>
                        ))}
                        
                        {/* Custom Color Picker Button */}
                        <button
                          onClick={() => {
                            setShowCustomPicker(true);
                            setShowColorMenu(false);
                          }}
                          className="
                            group relative w-10 h-10 rounded-xl border-2 border-gray-600/50 
                            flex items-center justify-center transition-all duration-200 
                            hover:border-purple-500/50 hover:scale-110 hover:shadow-lg
                            bg-gradient-to-br from-purple-500/20 to-pink-500/20
                          "
                          title="Custom color"
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                          <Wand2 className="w-4 h-4 text-purple-400 relative z-10" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* Custom color picker */}
              {showCustomPicker && createPortal(
                <div 
                  className="fixed inset-0 z-50" 
                  onClick={() => setShowCustomPicker(false)}
                >
                  <div 
                    className="absolute z-50" 
                    style={{ 
                      left: colorButtonRef.current?.getBoundingClientRect().left ? 
                        colorButtonRef.current.getBoundingClientRect().left - 250 : 0, 
                      top: colorButtonRef.current?.getBoundingClientRect().bottom ? 
                        colorButtonRef.current.getBoundingClientRect().bottom + 8 : 0
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CustomColorPicker
                      color={editedFolder.colour}
                      onChange={(color) => setEditedFolder({...editedFolder, colour: color})}
                      onClose={() => setShowCustomPicker(false)}
                    />
                  </div>
                </div>,
                document.body
              )}
            </div>  

            {/* Save button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
              className="
                text-green-600 hover:text-green-400 transition-all duration-200 
                p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110 hover:cursor-pointer
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Save changes"
            >
              <div className="absolute inset-0 bg-green-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <Save className="w-4 h-4 relative z-10" />
            </button>

            {/* Cancel button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              className="
                text-gray-500 hover:text-gray-400 transition-all duration-200 
                p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110 hover:cursor-pointer
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Cancel editing"
            >
              <div className="absolute inset-0 bg-gray-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <X className="w-4 h-4 relative z-10" />
            </button>
          </div>
        )}

        {/* Action buttons when not editing */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            {/* Edit button */}
            <button
              onClick={handleEditClick}
              className="
                opacity-0 group-hover:opacity-100 text-gray-500 hover:text-yellow-400 
                transition-all duration-200 p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Edit folder"
            >
              <div className="absolute inset-0 bg-yellow-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <Edit className="w-4 h-4 relative z-10" />
            </button>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(folder.id);
              }}
              className="
                opacity-0 hover:cursor-pointer group-hover:opacity-100 text-gray-500 hover:text-red-400 
                p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110 transition-all duration-200
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Delete folder"
            >
              <div className="absolute inset-0 bg-red-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <Trash2 className="w-4 h-4 relative z-10" />
            </button>
          </div>
        )}
        
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

      {/* Enhanced content area with improved click handling */}
      {folder.visible && (
        <div
          onClick={handleContainerClick}
          className={`
            border-t transition-all duration-200 cursor-pointer
            max-h-48 overflow-y-auto no-scrollbar
            ${
              isCurrentlyDragOver
                ? `bg-[var(--folder-color)]/15 border-[var(--folder-color)]/30`
                : "bg-gray-950/50 border-gray-800"
            }
            ${
              isFolderSelected && !selectedTaskId
                ? "ring-1 ring-blue-500/30 bg-blue-950/10"
                : ""
            }
          `}
          data-folder-drop-id={folder.id}
          style={{
            minHeight: shouldShowEmptyState ? "4rem" : "auto",
            background: isCurrentlyDragOver 
              ? `linear-gradient(135deg, ${folderColor}15 0%, ${folderColor}08 100%)`
              : isFolderSelected && !selectedTaskId
              ? `linear-gradient(135deg, #3b82f610 0%, ${folderColor}03 100%)`
              : `linear-gradient(135deg, ${folderColor}03 0%, transparent 100%)`
          }}
        >
          <div className="p-3 pt-2 space-y-2">
            {shouldShowEmptyState ? (
              <div 
                className={`
                  text-center py-4 text-sm h-16 flex items-center justify-center transition-colors cursor-pointer
                  ${isDragActive && isCurrentlyDragOver 
                    ? "text-gray-300 font-medium" 
                    : isFolderSelected && !selectedTaskId
                    ? "text-gray-400"
                    : "text-gray-600"
                  }
                `}
                onClick={handleContainerClick}
              >
                {isDragActive && isCurrentlyDragOver ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: folderColor }}
                    />
                    Drop task here
                  </div>
                ) : isFolderSelected && !selectedTaskId ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: folderColor }}
                    />
                    Folder selected - paste tasks here
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
                  editTask={editTask}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
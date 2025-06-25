import {
  ChevronDown,
  ChevronRight,
  Folder,
  Trash2,
  Edit,
  CheckIcon,
  X,
  Palette,
  Wand2,
  Check,
  GripVertical,
  GripHorizontal,
} from "lucide-react";
import { ContextMenuData, TaskFolder, Task, DragData } from "../../types";
import TaskComponent from "./Task";
import { DropTarget } from "../../Hooks/DragAndDropHook";
import { useRef, useState, useCallback, useEffect } from "react";
import CustomColorPicker from "../ColorPicker";
import { createPortal } from "react-dom";

const COLORS = [
  { name: "Default", value: "#8b5cf6" }, // purple-600
  { name: "Blue", value: "#2563eb" }, // blue-600
  { name: "Green", value: "#16a34a" }, // green-600
  { name: "Purple", value: "#9333ea" }, // purple-600
  { name: "Pink", value: "#db2777" }, // pink-600
  { name: "Orange", value: "#ea580c" }, // orange-600
  { name: "Teal", value: "#0d9488" }, // teal-600
  { name: "Indigo", value: "#4f46e5" }, // indigo-600
  { name: "Cyan", value: "#0891b2" }, // cyan-600
  { name: "Rose", value: "#e11d48" }, // rose-600
  { name: "Amber", value: "#d97706" }, // amber-600
];

// Minimum and maximum constraints for resizing
const MIN_WIDTH = 200;
const MAX_WIDTH = 800;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;

export default function TaskFolderComponent({
  folder,
  toggleFolderVisibility,
  toggleTaskCompletion,
  resizeFolder,
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
  showColorMenu,
  setShowColorMenu,
  showCustomPicker,
  setShowCustomPicker,
  editingState,
  setEditingState,
  moveFolderPosition,
  bringToFront,
  clearSelected,
}: {
  folder: TaskFolder;
  toggleFolderVisibility: (folderId: string) => void;
  toggleTaskCompletion: (taskId: string, folderId: string) => void;
  resizeFolder: (
    folderId: string,
    newWidth: number,
    newMaxHeight: number
  ) => void;
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
  editTask: (
    taskId: string,
    folderId: string,
    newText: string,
    newColour: string
  ) => void;
  editFolder: (folderId: string, newName: string, newColour: string) => void;
  showColorMenu: boolean;
  setShowColorMenu: (show: boolean) => void;
  showCustomPicker: boolean;
  setShowCustomPicker: (show: boolean) => void;
  editingState: {
    type: "task" | "folder" | null;
    id: string | null;
    data: {
      text?: string;
      name?: string;
      colour: string;
    } | null;
  };
  setEditingState: (state: {
    type: "task" | "folder" | null;
    id: string | null;
    data: {
      text?: string;
      name?: string;
      colour: string;
    } | null;
  }) => void;
  moveFolderPosition: (folderId: string, newX: number, newY: number) => void;
  bringToFront: (folderId: string) => void;
  clearSelected: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const folderRef = useRef<HTMLDivElement>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState<{
    type: "width" | "height" | "corner" | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({ type: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);

  const completedTasks = folder.tasks.filter((task) => task.completed).length;
  const totalTasks = folder.tasks.length;
  const remainingTasks = totalTasks - completedTasks;

  // Check if this folder is currently being edited
  const isFolderBeingEdited =
    editingState.type === "folder" && editingState.id === folder.id;

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isFolderBeingEdited) return;

      e.preventDefault();
      e.stopPropagation();

      // Clear any selections and bring this folder to front
      clearSelected();

      // Bring this folder to front by updating its zIndex
      bringToFront(folder.id);

      const rect = folderRef.current?.getBoundingClientRect();
      if (!rect) return;

      setIsDragging(true);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [isFolderBeingEdited, folder.id, bringToFront, clearSelected]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      if (folderRef.current) {
        const rect = folderRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate boundaries (keep at least 50px visible on each side)
        const minX = -rect.width + 50;
        const maxX = viewportWidth - 50;
        const minY = 0; // Don't allow dragging above viewport
        const maxY = viewportHeight - 50;

        // Constrain the position
        const constrainedX = Math.max(minX, Math.min(maxX, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));

        folderRef.current.style.position = "fixed";
        folderRef.current.style.left = `${constrainedX}px`;
        folderRef.current.style.top = `${constrainedY}px`;
        folderRef.current.style.zIndex = "9999"; // Very high zIndex while dragging
      }
    },
    [isDragging, dragOffset]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    if (folderRef.current) {
      const rect = folderRef.current.getBoundingClientRect();

      // Save the new position
      moveFolderPosition(folder.id, rect.left, rect.top);

      // Ensure this folder stays on top after dropping
      bringToFront(folder.id);

      // Keep the position fixed after dragging
      folderRef.current.style.position = "fixed";
      folderRef.current.style.left = `${rect.left}px`;
      folderRef.current.style.top = `${rect.top}px`;
      // Remove the temporary high zIndex - let the data's zIndex take over
      folderRef.current.style.zIndex = "";
    }

    setIsDragging(false);
    setJustFinishedDragging(true);

    // Clear the flag after a short delay
    setTimeout(() => {
      setJustFinishedDragging(false);
    }, 150);
  }, [isDragging, folder.id, moveFolderPosition, bringToFront]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, type: "width" | "height" | "corner") => {
      e.preventDefault();
      e.stopPropagation();

      // Get current dimensions from the DOM element
      const currentRect = folderRef.current?.getBoundingClientRect();
      const contentArea = folderRef.current?.querySelector(
        "[data-content-area]"
      ) as HTMLElement;

      // Get the actual computed style dimensions instead of just the folder properties
      let currentWidth = currentRect ? currentRect.width : folder.width;
      let currentHeight = folder.height;

      if (contentArea && folder.visible) {
        const contentRect = contentArea.getBoundingClientRect();
        currentHeight = contentRect.height;
      }

      setIsResizing({
        type,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentWidth,
        startHeight: currentHeight,
      });
    },
    [folder.width, folder.height, folder.visible]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing.type === null) return;

      const deltaX = e.clientX - isResizing.startX;
      const deltaY = e.clientY - isResizing.startY;

      let newWidth = isResizing.startWidth;
      let newHeight = isResizing.startHeight;

      // Only update the dimension being resized
      if (isResizing.type === "width" || isResizing.type === "corner") {
        newWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, isResizing.startWidth + deltaX)
        );

        // Force apply the width immediately
        if (folderRef.current) {
          folderRef.current.style.width = `${newWidth}px`;
          folderRef.current.style.minWidth = `${newWidth}px`;
        }
      }

      if (isResizing.type === "height" || isResizing.type === "corner") {
        newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, isResizing.startHeight + deltaY)
        );

        // Force apply the height immediately
        const contentArea = folderRef.current?.querySelector(
          "[data-content-area]"
        ) as HTMLElement;
        if (contentArea && folder.visible) {
          contentArea.style.height = `${newHeight}px`;
          contentArea.style.maxHeight = `${newHeight}px`;
          contentArea.style.minHeight = `${newHeight}px`;
        }
      }
    },
    [isResizing, folder.visible]
  );

  const handleResizeEnd = useCallback(() => {
    if (isResizing.type === null) return;

    // Get the current dimensions from the DOM
    if (folderRef.current) {
      const rect = folderRef.current.getBoundingClientRect();
      const contentArea = folderRef.current.querySelector(
        "[data-content-area]"
      ) as HTMLElement;

      let newWidth = rect.width;
      let newHeight = folder.height;

      if (contentArea && folder.visible) {
        const contentRect = contentArea.getBoundingClientRect();
        newHeight = contentRect.height;
      }

      // Ensure values are within bounds
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));

      // Save to backend
      resizeFolder(folder.id, Math.round(newWidth), Math.round(newHeight));
    }

    setIsResizing({
      type: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
    });
  }, [isResizing.type, folder.id, folder.height, folder.visible, resizeFolder]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Mouse event listeners for resizing
  useEffect(() => {
    if (isResizing.type !== null) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor =
        isResizing.type === "width"
          ? "ew-resize"
          : isResizing.type === "height"
          ? "ns-resize"
          : "nw-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing.type, handleResizeMove, handleResizeEnd]);

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
    const isClickOnTask = target.closest("[data-task-id]");

    if (!isClickOnTask && !isFolderBeingEdited) {
      bringToFront(folder.id); // Add this line
      onContainerClick(folder.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingState({
      type: "folder",
      id: folder.id,
      data: {
        name: folder.name,
        colour: folder.colour || "#8b5cf6",
      },
    });
  };

  const handleSaveEdit = () => {
    if (editingState.data?.name?.trim()) {
      editFolder(
        folder.id,
        editingState.data.name.trim(),
        editingState.data.colour
      );
    }
    setEditingState({
      type: null,
      id: null,
      data: null,
    });
    setShowColorMenu(false);
    setShowCustomPicker(false);
  };

  const handleCancelEdit = () => {
    setShowColorMenu(false);
    setShowCustomPicker(false);
    setEditingState({
      type: null,
      id: null,
      data: null,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleColorSelect = (color: string) => {
    setEditingState({
      type: "folder",
      id: folder.id,
      data: {
        ...editingState.data,
        colour: color,
      },
    });
    setShowColorMenu(false);
  };

  const handleToggleVisibility = () => {
    if (!isFolderBeingEdited && !isDragging && !justFinishedDragging) {
      toggleFolderVisibility(folder.id);
    }
  };

  const isCurrentlyDragOver = dropTarget?.folderId === folder.id;
  const isFolderSelected = selectedFolderId === folder.id && !selectedTaskId;

  const shouldShowEmptyState = folder.tasks.length === 0;
  const isDragActive = draggedTask !== null;

  const folderColor = isFolderBeingEdited
    ? editingState.data?.colour || "#8b5cf6"
    : folder.colour || "#8b5cf6";

  useEffect(() => {
    if (isFolderBeingEdited && editingState.id === folder.id) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isFolderBeingEdited, editingState.id, folder.id]);

  return (
    <div
      ref={folderRef}
      style={
        {
          "--folder-color": folderColor,
          width: `${folder.width}px`,
          minWidth: `${folder.width}px`,
          position:
            folder.x !== undefined && folder.y !== undefined
              ? "fixed"
              : "relative",
          left: folder.x !== undefined ? `${folder.x}px` : "auto",
          top: folder.y !== undefined ? `${folder.y}px` : "auto",
          zIndex:
            folder.x !== undefined && folder.y !== undefined
              ? folder.zindex || 10
              : "auto",
        } as React.CSSProperties
      }
      className={`
        bg-gray-950 rounded-lg mb-3 overflow-hidden 
        transition-all duration-200 border
        border-l-4 relative
        ${
          isDragging
            ? "shadow-2xl ring-2 ring-blue-500/50 !transition-none !z-[9999]"
            : ""
        }
        ${
          isFolderSelected
            ? "!border-blue-500 !border-l-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)]"
            : "border-gray-800 border-l-[var(--folder-color)]"
        }
        ${isCurrentlyDragOver ? "ring-2 ring-[var(--folder-color)]/40" : ""}
        ${isResizing.type !== null ? "transition-none" : ""}
      `}
      onContextMenu={isFolderBeingEdited ? undefined : handleContextMenu}
    >
      {/* Enhanced header with editing capability */}
      <div
        className="group flex items-center gap-3 p-3 transition-all cursor-pointer relative overflow-hidden"
        onClick={() => {
          if (!isDragging) {
            bringToFront(folder.id); // Add this line
            handleToggleVisibility();
          }
        }}
        data-folder-drop-id={folder.id}
        style={{
          background: `linear-gradient(135deg, ${folderColor}08 0%, ${folderColor}04 50%, transparent 100%)`,
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
        <button
          onMouseDown={handleDragStart}
          className="text-gray-500 hover:text-gray-300 transition-colors cursor-grab active:cursor-grabbing p-1"
          title="Drag to move folder"
        >
          <GripVertical className="w-3 h-3" />
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
            {isFolderBeingEdited ? (
              <input
                ref={inputRef}
                type="text"
                value={editingState.data?.name}
                onChange={(e) =>
                  setEditingState({
                    type: "folder",
                    id: folder.id,
                    data: {
                      ...editingState.data,
                      name: e.target.value,
                      colour: editingState.data?.colour || "#8b5cf6",
                    },
                  })
                }
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
        {isFolderBeingEdited && (
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
                style={{ backgroundColor: editingState.data?.colour }}
                title="Change color"
              />

              {/* Color menu dropdown */}
              {showColorMenu &&
                !showCustomPicker &&
                createPortal(
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
                        left: colorButtonRef.current?.getBoundingClientRect()
                          .left
                          ? colorButtonRef.current.getBoundingClientRect()
                              .left - 220
                          : 0,
                        top: colorButtonRef.current?.getBoundingClientRect()
                          .bottom
                          ? colorButtonRef.current.getBoundingClientRect()
                              .bottom + 8
                          : 0,
                        boxShadow:
                          "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Menu gradient background */}
                      <div
                        className="absolute inset-0 opacity-5"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                        }}
                      />

                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <Palette className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">
                            Choose Color
                          </span>
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
                              ${
                                editingState.data?.colour === color.value
                                  ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 border-white/50"
                                  : "border-gray-600/30 hover:border-gray-500/50"
                              }
                            `}
                              title={color.name}
                            >
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              {editingState.data?.colour === color.value && (
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
              {showCustomPicker &&
                createPortal(
                  <div
                    className="fixed inset-0 z-50"
                    onClick={() => setShowCustomPicker(false)}
                  >
                    <div
                      className="absolute z-50"
                      style={{
                        left: colorButtonRef.current?.getBoundingClientRect()
                          .left
                          ? colorButtonRef.current.getBoundingClientRect()
                              .left - 250
                          : 0,
                        top: colorButtonRef.current?.getBoundingClientRect()
                          .bottom
                          ? colorButtonRef.current.getBoundingClientRect()
                              .bottom + 8
                          : 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CustomColorPicker
                        color={editingState.data?.colour || "#8b5cf6"}
                        onChange={(color) =>
                          setEditingState({
                            type: "folder",
                            id: folder.id,
                            data: {
                              ...editingState.data,
                              colour: color,
                            },
                          })
                        }
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
              <CheckIcon className="w-4 h-4 relative z-10" />
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
        {!isFolderBeingEdited && (
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
        {!isFolderBeingEdited && (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                remainingTasks > 0 ? "opacity-40" : "opacity-80 animate-pulse"
              }`}
              style={{
                backgroundColor: remainingTasks > 0 ? folderColor : "#10b981",
              }}
            />
            <div
              className={`text-xs font-medium ${
                remainingTasks > 0
                  ? "text-gray-400 group-hover:text-gray-300"
                  : "text-green-400"
              } transition-colors`}
            >
              {remainingTasks > 0 ? `${remainingTasks} remaining` : "All done"}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced content area with improved click handling */}
      {folder.visible && (
        <div
          onClick={handleContainerClick}
          className={`
          border-t cursor-pointer
          overflow-y-auto no-scrollbar relative
          ${
            isResizing.type === "height" || isResizing.type === "corner"
              ? ""
              : "transition-all duration-200"
          }
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
          style={{
            height: `${folder.height}px`,
            maxHeight: `${folder.height}px`,
            minHeight: `${folder.height}px`,
            background: isCurrentlyDragOver
              ? `linear-gradient(135deg, ${folderColor}15 0%, ${folderColor}08 100%)`
              : isFolderSelected && !selectedTaskId
              ? `linear-gradient(135deg, #3b82f610 0%, ${folderColor}03 100%)`
              : `linear-gradient(135deg, ${folderColor}03 0%, transparent 100%)`,
          }}
          data-folder-drop-id={folder.id}
          data-content-area
        >
          <div className="p-3 pt-2 space-y-2 h-full overflow-y-auto no-scrollbar">
            {shouldShowEmptyState ? (
              <div
                className={`
                  text-center py-4 text-sm flex items-center justify-center transition-colors cursor-pointer
                  ${
                    isDragActive && isCurrentlyDragOver
                      ? "text-gray-300 font-medium"
                      : isFolderSelected && !selectedTaskId
                      ? "text-gray-400"
                      : "text-gray-600"
                  }
                `}
                onClick={handleContainerClick}
                style={{ height: `${folder.height - 32}px` }} // 32px accounts for container padding (p-3 = 12px * 2 + pt-2 = 8px)
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
                  key={
                    task.id || `folder-${folder.id}-task-${task.id}-${index}`
                  }
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
                  showColorMenu={showColorMenu}
                  setShowColorMenu={setShowColorMenu}
                  showCustomPicker={showCustomPicker}
                  setShowCustomPicker={setShowCustomPicker}
                  editingState={editingState}
                  setEditingState={setEditingState}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Resize handles - only show when not editing and folder is visible */}
      {!isFolderBeingEdited && (
        <>
          {/* Width resize handle (right edge) */}
          <div
            className="absolute top-0 right-0 w-2 cursor-ew-resize group/resize opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{ height: "100%" }}
            onMouseDown={(e) => handleResizeStart(e, "width")}
            title="Resize width"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-600 group-hover/resize:bg-blue-500 rounded-full transition-colors duration-200" />
            <div className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity duration-200">
              <GripVertical className="w-3 h-3 text-gray-400" />
            </div>
          </div>

          {/* Height resize handle (bottom edge) - only when visible */}
          {folder.visible && (
            <div
              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group/resize opacity-0 hover:opacity-100 transition-opacity duration-200"
              onMouseDown={(e) => handleResizeStart(e, "height")}
              title="Resize height"
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-gray-600 group-hover/resize:bg-blue-500 rounded-full transition-colors duration-200" />
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity duration-200">
                <GripHorizontal className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          )}

          {/* Corner resize handle (bottom-right) - only when visible */}
          {folder.visible && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize group/resize opacity-0 hover:opacity-100 transition-opacity duration-200"
              onMouseDown={(e) => handleResizeStart(e, "corner")}
              title="Resize both width and height"
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-600 group-hover/resize:border-blue-500 transition-colors duration-200" />
            </div>
          )}
        </>
      )}

      {/* Resize overlay - shows constraints while resizing */}
      {isResizing.type !== null && (
        <div className="absolute -top-8 left-0 bg-gray-800/90 text-xs text-gray-300 px-2 py-1 rounded border border-gray-600 backdrop-blur-sm">
          {folder.width}×{folder.height}px
        </div>
      )}
    </div>
  );
}

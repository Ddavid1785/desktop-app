import { useRef } from "react";
import { Check, Trash2, Copy, Edit, X, Palette, Wand2 } from "lucide-react";
import { Task, ContextMenuData } from "../../types";
import { DropTarget } from "../../Hooks/DragAndDropHook";
import CustomColorPicker from "../ColorPicker";
import { createPortal } from "react-dom";
import { useEffect } from "react";

const COLORS = [
  { name: "Default", value: "#111827" }, // gray-900
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

const PORTAL_ZINDEX = 999999999;

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
  editTask,
  showColorMenu,
  setShowColorMenu,
  showCustomPicker,
  setShowCustomPicker,
  editingState,
  setEditingState,
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
  editTask: (
    taskId: string,
    folderId: string,
    newText: string,
    newColour: string
  ) => void;
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
}) {
  const dragStartTimer = useRef<number | null>(null);
  const initialMousePos = useRef<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const DRAG_DELAY = 200;
  const DRAG_THRESHOLD = 5;

  // Check if this task is currently being edited
  const isCurrentlyEditing =
    editingState.type === "task" && editingState.id === task.id;

  const clearDragTimer = () => {
    if (dragStartTimer.current) {
      clearTimeout(dragStartTimer.current);
      dragStartTimer.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.button !== 0 ||
      (e.target as HTMLElement).closest("button") ||
      isCurrentlyEditing
    ) {
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
    if (
      dragStartTimer.current &&
      initialMousePos.current &&
      !isCurrentlyEditing
    ) {
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingState({
      type: "task",
      id: task.id,
      data: {
        text: task.text,
        colour: task.colour || "#6366f1",
      },
    });
    // Focus the input after a brief delay to ensure it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleSaveEdit = () => {
    if (editingState.data?.text?.trim()) {
      editTask(
        task.id,
        folderId,
        editingState.data.text.trim(),
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
      type: "task",
      id: task.id,
      data: {
        ...editingState.data,
        colour: color,
      },
    });
    setShowColorMenu(false);
  };

  // Check if this task is the drop target
  const isDropTarget = dropTarget?.taskId === task.id;
  const isTopHalf = dropTarget?.isFolderTopHalf;

  // Enhanced color system
  const taskColor = task.colour || "#6366f1"; // Default to indigo if no color
  const editedColor = editingState.data?.colour || "#6366f1";
  const completedColor = "#10b981"; // Green for completed tasks

  useEffect(() => {
    if (isCurrentlyEditing && editingState.id === task.id) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isCurrentlyEditing, editingState.id, task.id]);

  return (
    <div className="relative group">
      {/* Enhanced drop indicator with glow effect */}
      {isDropTarget && !isCurrentlyEditing && (
        <div
          className={`
            absolute left-0 right-0 h-1 rounded-full z-10
            transition-all duration-200 animate-pulse
            ${isTopHalf ? "-top-2" : "-bottom-2"}
          `}
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${taskColor} 50%, transparent 100%)`,
            boxShadow: `0 0 8px ${taskColor}40`,
          }}
        />
      )}

      <div
        key={task.id || `task-${task.id}-${index}`}
        data-task-id={task.id}
        style={
          {
            "--task-color": isCurrentlyEditing ? editedColor : taskColor,
            "--completed-color": completedColor,
          } as React.CSSProperties
        }
        className={`
          group/task flex items-center gap-3 p-3 rounded-lg relative overflow-hidden
          transition-all duration-200 border focus:outline-none
          ${isDragging ? "opacity-0 scale-95" : "opacity-100 scale-100"}
          ${
            isDropTarget && !isCurrentlyEditing
              ? "ring-2 ring-blue-500/40 bg-blue-950/20 border-blue-500/30"
              : task.completed
              ? `bg-[var(--completed-color)]/10 border-[var(--completed-color)]/20 hover:bg-[var(--completed-color)]/15`
              : `bg-[var(--task-color)]/10 border-[var(--task-color)]/20 hover:bg-[var(--task-color)]/15 hover:border-[var(--task-color)]/30`
          }
          ${
            !isDragging && !isCurrentlyEditing
              ? "cursor-grab active:cursor-grabbing"
              : ""
          }
          ${
            isSelected && !isCurrentlyEditing
              ? "!border-blue-500 !ring-2 !ring-blue-500/30"
              : ""
          }
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClick={isCurrentlyEditing ? undefined : onClick}
        onContextMenu={isCurrentlyEditing ? undefined : handleContextMenu}
        tabIndex={-1}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-5 group-hover/task:opacity-10 transition-opacity duration-200"
          style={{
            background: task.completed
              ? `linear-gradient(135deg, ${completedColor} 0%, transparent 70%)`
              : `linear-gradient(135deg, ${
                  isCurrentlyEditing ? editedColor : taskColor
                } 0%, transparent 70%)`,
          }}
        />

        {/* Enhanced left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover/task:w-1.5"
          style={{
            backgroundColor: task.completed
              ? completedColor
              : isCurrentlyEditing
              ? editedColor
              : taskColor,
            opacity: task.completed ? 0.6 : 0.8,
          }}
        />

        {/* Enhanced checkbox with glow effect */}
        <div className="relative z-10">
          <button
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center 
              transition-all duration-200 flex-shrink-0 relative overflow-hidden hover:cursor-pointer
              focus:outline-none
              ${
                task.completed
                  ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500 shadow-lg shadow-green-500/25"
                  : "border-gray-500 hover:border-gray-400 bg-gray-900/50 hover:bg-gray-800/50"
              }
            `}
            onClick={handleCheckboxClick}
            disabled={isCurrentlyEditing}
          >
            {/* Subtle inner glow for unchecked state */}
            {!task.completed && (
              <div
                className="absolute inset-0.5 rounded-full opacity-20 transition-opacity duration-200 hover:opacity-30"
                style={{
                  backgroundColor: isCurrentlyEditing ? editedColor : taskColor,
                }}
              />
            )}

            {task.completed && (
              <Check
                className="w-3 h-3 text-white transition-transform duration-200 scale-100"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
              />
            )}
          </button>
        </div>

        {/* Enhanced task text or input field */}
        <div className="flex-1 min-w-0 relative z-10">
          {isCurrentlyEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editingState.data?.text || ""}
              onChange={(e) =>
                setEditingState({
                  type: "task",
                  id: task.id,
                  data: {
                    ...editingState.data,
                    text: e.target.value,
                    colour: editingState.data?.colour || "#6366f1",
                  },
                })
              }
              onKeyDown={handleKeyDown}
              className="
                w-full bg-gray-800/50 border border-gray-600 rounded px-2 py-1 
                text-sm text-gray-100 focus:outline-none focus:border-blue-500
                focus:bg-gray-800/70 transition-all duration-200
              "
              placeholder="Enter task text..."
            />
          ) : (
            <>
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
                  textShadow: task.completed
                    ? "none"
                    : "0 1px 2px rgba(0,0,0,0.5)",
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
                    opacity: 0.3,
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Color picker and edit controls */}
        {isCurrentlyEditing && (
          <div className="flex items-center gap-2 relative z-10">
            {/* Color picker button */}
            <div className="relative">
              <button
                ref={colorButtonRef}
                onClick={() => setShowColorMenu(!showColorMenu)}
                className="w-6 h-6 rounded border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
                style={{ backgroundColor: editedColor }}
                title="Change color"
              />

              {/* Color menu dropdown */}
              {showColorMenu &&
                !showCustomPicker &&
                createPortal(
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: PORTAL_ZINDEX }}
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
                        zIndex: PORTAL_ZINDEX + 1,
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
                    className="fixed inset-0"
                    style={{ zIndex: PORTAL_ZINDEX }}
                    onClick={() => setShowCustomPicker(false)}
                  >
                    <div
                      className="absolute"
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
                        zIndex: PORTAL_ZINDEX + 1,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CustomColorPicker
                        color={editedColor}
                        onChange={(color) =>
                          setEditingState({
                            type: "task",
                            id: task.id,
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
              onClick={handleSaveEdit}
              className="
                text-green-600 hover:text-green-400 transition-all duration-200 
                p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110 hover:cursor-pointer
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Save changes"
            >
              <div className="absolute inset-0 bg-green-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <Check className="w-4 h-4 relative z-10" />
            </button>

            {/* Cancel button */}
            <button
              onClick={handleCancelEdit}
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

        {/* Enhanced action buttons (only show when not editing) */}
        {!isCurrentlyEditing && (
          <div
            className={`
              flex items-center gap-1 transition-all duration-200 relative z-10
              ${
                isDragging
                  ? "opacity-0"
                  : "opacity-0 group-hover/task:opacity-100"
              }
            `}
          >
            <button
              onClick={handleEditClick}
              className="
                text-gray-500 hover:text-yellow-400 transition-all duration-200 hover:cursor-pointer
                p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Edit task"
            >
              <div className="absolute inset-0 bg-yellow-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <Edit className="w-4 h-4 relative z-10" />
            </button>

            <button
              onClick={handleCopyClick}
              className="
                text-gray-500 hover:text-blue-400 transition-all duration-200 hover:cursor-pointer
                p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Duplicate task"
            >
              <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <Copy className="w-4 h-4 relative z-10" />
            </button>

            <button
              onClick={handleDeleteClick}
              className="
                text-gray-500 hover:text-red-400 transition-all duration-200 hover:cursor-pointer
                p-1.5 rounded-md hover:bg-gray-800/60 hover:scale-110
                relative overflow-hidden group/btn focus:outline-none
              "
              title="Delete task"
            >
              <div className="absolute inset-0 bg-red-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 rounded-md" />
              <Trash2 className="w-4 h-4 relative z-10" />
            </button>
          </div>
        )}

        {/* Task priority indicator (small colored dot) */}
        <div
          className={`
            absolute top-2 right-2 w-1.5 h-1.5 rounded-full transition-all duration-200
            ${
              task.completed
                ? "opacity-30"
                : "opacity-60 group-hover/task:opacity-80"
            }
          `}
          style={{
            backgroundColor: task.completed
              ? completedColor
              : isCurrentlyEditing
              ? editedColor
              : taskColor,
          }}
        />
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  Circle,
  FolderOpen,
  Copy,
  Edit,
  Trash2,
  Palette,
  ChevronRight,
  Folder,
  EyeOff,
  Eye,
} from "lucide-react";
import { ContextMenuData, TaskDataHandlers, TaskFolder } from "../types";

interface ContextMenuProps {
  show: boolean;
  x: number;
  y: number;
  data: ContextMenuData | null;
  onClose: () => void;
  folders: TaskFolder[]; // Add folders prop
  handlers: TaskDataHandlers;
}

export default function ContextMenu({
  show,
  x,
  y,
  data,
  onClose,
  folders,
  handlers,
}: ContextMenuProps) {
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add refs for the main menu and submenu containers
  const menuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the click is not inside the main menu OR the submenu (if it exists)
      // then close the entire context menu.
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        (!subMenuRef.current ||
          !subMenuRef.current.contains(event.target as Node))
      ) {
        onClose();
        // The onClose() should already handle setShowFolderSubmenu(false)
        // or the parent component will re-render and hide it.
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [show, onClose]); // Depend on show and onClose

  // Reset submenu when context menu is hidden
  useEffect(() => {
    if (!show) {
      setShowFolderSubmenu(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [show]);

  const handleMoveToFolderHover = (event: React.MouseEvent) => {
    // Clear any existing timeout to keep the submenu open if re-hovered quickly
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setSubmenuPosition({
      x: rect.right - 2,
      y: rect.top,
    });
    setShowFolderSubmenu(true);
  };

  const handleMoveToFolderLeave = () => {
    // Set a timeout to hide the submenu.
    // This gives a small window to move the mouse to the submenu itself.
    timeoutRef.current = setTimeout(() => {
      setShowFolderSubmenu(false);
    }, 150); // Slightly increased delay for better UX
  };

  const handleSubmenuEnter = () => {
    // When the mouse enters the submenu, clear the timeout
    // so it doesn't disappear while being hovered.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowFolderSubmenu(true);
  };

  const handleSubmenuLeave = () => {
    // When the mouse leaves the submenu, set a timeout to hide it.
    timeoutRef.current = setTimeout(() => {
      setShowFolderSubmenu(false);
    }, 150);
  };

  const handleFolderSelect = (folderId: string) => {
    if (data?.taskId) {
      handlers.moveTaskToFolder(data.taskId, data.folderId || "", folderId);
      onClose(); // Close the entire menu after action
      setShowFolderSubmenu(false); // Ensure submenu is hidden
    }
  };

  const getAvailableFolders = () => {
    // Ensure we only show folders that are not the current folder of the task
    const availableFolders = folders.filter(
      (folder) => folder.id !== data?.folderId // Exclude the folder the task is currently in
    );

    // Initialize folder options
    const folderOptions = [];

    // If the task is currently in a folder, add the "Ungrouped Tasks" option
    // (A task in a folder can be moved to ungrouped)
    if (data?.folderId) {
      folderOptions.push({
        id: "", // Use an empty string to represent the ungrouped state
        name: "Ungrouped Tasks",
        isUngrouped: true, // Custom flag for UI distinction
      });
    }
    // If the task is currently ungrouped (data.folderId is ""),
    // then the "Ungrouped Tasks" option should NOT be shown.
    // In this case, availableFolders will already correctly exclude it implicitly.

    // Add all other available folders
    folderOptions.push(
      ...availableFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        isUngrouped: false, // Not an ungrouped option
      }))
    );

    return folderOptions;
  };

  // Get context menu items based on the data
  const getContextMenuItems = () => {
    if (!data) return [];

    // All `onClick` functions are updated to use the new handler names.
    if (data.type === "task") {
      return [
        {
          id: "toggle-complete",
          text: data.isCompleted ? "Mark as Incomplete" : "Mark as Complete",
          icon: data.isCompleted ? Circle : CheckCircle,
          textColor: data.isCompleted ? "text-gray-300" : "text-green-400",
          onClick: () =>
            handlers.toggleTaskCompletion(data.taskId!, data.folderId || ""),
        },
        {
          id: "rename",
          text: "Rename Task",
          icon: Edit,
          textColor: "text-blue-400",
          onClick: () => handlers.renameTask(data.taskId!, data.folderId || ""),
        },
        {
          id: "choose-color",
          text: "Choose Color",
          icon: Palette,
          textColor: "text-indigo-400",
          onClick: () => handlers.chooseTaskColor(data.taskId!),
        },
        {
          id: "duplicate",
          text: "Duplicate Task",
          icon: Copy,
          textColor: "text-purple-400",
          onClick: () =>
            handlers.duplicateTask(data.taskId!, data.folderId || ""),
        },
        {
          id: "move",
          text: "Move to Folder",
          icon: FolderOpen,
          textColor: "text-yellow-400",
          hasSubmenu: true,
          onClick: () => {}, // No direct onClick for submenu items
        },
        {
          id: "delete",
          text: "Delete Task",
          icon: Trash2,
          textColor: "text-red-400",
          onClick: () => handlers.deleteTask(data.taskId!, data.folderId || ""),
        },
      ];
    } else if (data?.type === "folder") {
      return [
        {
          id: "toggle-visibility",
          text: data.folder_visible ? "Hide Folder" : "Show Folder",
          icon: data.folder_visible ? EyeOff : Eye,
          textColor: "text-blue-400",
          onClick: () => handlers.toggleFolderVisibility(data.folderId!),
        },
        {
          id: "rename",
          text: "Rename Folder",
          icon: Edit,
          textColor: "text-blue-400",
          onClick: () => handlers.renameFolder(data.folderId!),
        },
        {
          id: "choose-color",
          text: "Choose Color",
          icon: Palette,
          textColor: "text-indigo-400",
          onClick: () => handlers.chooseFolderColor(data.folderId!),
        },
        {
          id: "duplicate",
          text: "Duplicate Folder",
          icon: Copy,
          textColor: "text-purple-400",
          onClick: () => handlers.duplicateFolder(data.folderId!),
        },
        {
          id: "delete",
          text: "Delete Folder",
          icon: Trash2,
          textColor: "text-red-400",
          onClick: () => handlers.deleteFolder(data.folderId!),
        },
      ];
    }

    return [];
  };

  if (!show) return null;

  return (
    <>
      {/* Main Context Menu */}
      <div
        id="main-context-menu" // Keep ID for potential direct access
        ref={menuRef} // Assign the ref here
        className="fixed z-50"
        style={{
          left: x,
          top: y,
        }}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 min-w-48">
          {getContextMenuItems().map((item) => {
            const IconComponent = item.icon;

            if (item.hasSubmenu) {
              return (
                <div
                  key={item.id}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-800 transition-colors cursor-pointer relative"
                  onMouseEnter={handleMoveToFolderHover}
                  onMouseLeave={handleMoveToFolderLeave}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    <span className={`${item.textColor}`}>{item.text}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  onClose(); // Close the menu after an action
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-800 transition-colors text-left hover:cursor-pointer"
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className={`${item.textColor}`}>{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Folder Submenu */}
      {showFolderSubmenu && data?.type === "task" && (
        <div
          id="folder-submenu" // Keep ID for potential direct access
          ref={subMenuRef} // Assign the ref here
          className="fixed z-50"
          style={{
            left: submenuPosition.x,
            top: submenuPosition.y,
          }}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 min-w-40">
            {getAvailableFolders().length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No folders available
              </div>
            ) : (
              getAvailableFolders().map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder.id)}
                  className="w-full hover:cursor-pointer flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-800 transition-colors text-left"
                >
                  {folder.isUngrouped ? (
                    <Circle className="w-4 h-4 flex-shrink-0 text-green-500" />
                  ) : (
                    <Folder className="w-4 h-4 flex-shrink-0 text-blue-400" />
                  )}
                  <span className="text-gray-300">{folder.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

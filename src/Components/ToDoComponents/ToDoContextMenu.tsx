// src/Components/ToDoComponents/ToDoContextMenu.tsx (FIXED)

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle, Circle, FolderOpen, Copy, Edit, Trash2, ChevronRight, Folder, EyeOff, Eye,
} from "lucide-react";
import { ContextMenuData, TaskDataHandlers, TaskFolder } from "../../types";

interface ToDoContextMenuProps {
  data: ContextMenuData;
  folders: TaskFolder[];
  handlers: TaskDataHandlers;
  onClose: () => void;
  onStartEdit: () => void;
}

export default function ToDoContextMenu({ data, folders, handlers, onClose, onStartEdit }: ToDoContextMenuProps) {
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  
  const menuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const moveToFolderRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMoveToFolderHover = (event: React.MouseEvent) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();
    
    if (menuRect) {
      // Calculate position relative to viewport, not the parent menu
      const submenuX = menuRect.right + 8; // Position to the right of main menu with small gap
      const submenuY = rect.top; // Align with the hovered item
      
      // Check if submenu would go off-screen and adjust if needed
      const submenuWidth = 200; // Approximate width of submenu
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let finalX = submenuX;
      let finalY = submenuY;
      
      // If submenu would go off right edge, position it to the left of main menu
      if (submenuX + submenuWidth > viewportWidth) {
        finalX = menuRect.left - submenuWidth - 8;
      }
      
      // If submenu would go off bottom edge, adjust Y position
      const estimatedSubmenuHeight = getAvailableFolders().length * 48 + 16; // Approximate height
      if (submenuY + estimatedSubmenuHeight > viewportHeight) {
        finalY = viewportHeight - estimatedSubmenuHeight - 10;
      }
      
      setSubmenuPosition({
        x: finalX,
        y: finalY,
      });
    }
    setShowFolderSubmenu(true);
  };

  const handleMoveToFolderLeave = () => {
    // Start a timeout to close the submenu, but it can be cancelled if mouse enters submenu
    timeoutRef.current = setTimeout(() => {
      setShowFolderSubmenu(false);
    }, 100); // Short delay to allow moving to submenu
  };

  const handleSubmenuEnter = () => {
    // Cancel the timeout if mouse enters the submenu
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  const handleSubmenuLeave = () => {
    // Close submenu when mouse leaves it
    setShowFolderSubmenu(false);
  };

  const handleFolderSelect = (folderId: string) => {
    if (data?.type === 'task' && data.taskId) {
      handlers.moveTaskToFolder(data.taskId, data.folderId!, folderId);
      onClose();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getAvailableFolders = () => {
    if(data?.type !== 'task') return [];
    
    return folders.filter((f) => f.id !== data.folderId);
  };

  const getContextMenuItems = () => {
    if (!data) return [];
    if (data.type === "task") {
      return [
        { id: "toggle-complete", text: data.isCompleted ? "Mark as Incomplete" : "Mark as Complete", icon: data.isCompleted ? Circle : CheckCircle, textColor: data.isCompleted ? "text-gray-300" : "text-green-400", onClick: () => handlers.toggleTaskCompletion(data.taskId!, data.folderId!) },
        { id: "edit", text: "Edit Task", icon: Edit, textColor: "text-blue-400", onClick: () => onStartEdit() },
        { id: "duplicate", text: "Duplicate Task", icon: Copy, textColor: "text-purple-400", onClick: () => handlers.duplicateTask(data.taskId!, data.folderId!) },
        { id: "move", text: "Move to Folder", icon: FolderOpen, textColor: "text-yellow-400", hasSubmenu: true },
        { id: "delete", text: "Delete Task", icon: Trash2, textColor: "text-red-400", onClick: () => handlers.deleteTask(data.taskId!, data.folderId!) },
      ];
    } else if (data.type === "folder") {
      return [
        { id: "toggle-visibility", text: data.folder_visible ? "Hide Folder" : "Show Folder", icon: data.folder_visible ? EyeOff : Eye, textColor: "text-blue-400", onClick: () => handlers.toggleFolderVisibility(data.folderId!) },
        { id: "edit", text: "Edit Folder", icon: Edit, textColor: "text-blue-400", onClick: () => onStartEdit() },
        { id: "duplicate", text: "Duplicate Folder", icon: Copy, textColor: "text-purple-400", onClick: () => handlers.duplicateFolder(data.folderId!) },
        { id: "delete", text: "Delete Folder", icon: Trash2, textColor: "text-red-400", onClick: () => handlers.deleteFolder(data.folderId!) },
      ];
    }
    return [];
  };

  return (
    <>
      <div ref={menuRef} className="relative py-2 min-w-52">
        {getContextMenuItems().map((item, index) => {
          const IconComponent = item.icon;
          const isLast = index === getContextMenuItems().length - 1;
          
          if (item.hasSubmenu) {
            return (
              <div 
                key={item.id}
                ref={moveToFolderRef}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-800/60 relative cursor-pointer transition-all duration-150 hover:translate-x-1 group ${item.textColor}`} 
                onMouseEnter={handleMoveToFolderHover}
                onMouseLeave={handleMoveToFolderLeave}
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{item.text}</span>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
              </div>
            );
          }
          return (
            <div key={item.id} className="relative">
              <button 
                onClick={() => { item.onClick?.(); onClose(); }} 
                className="w-full hover:cursor-pointer flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-800/60 text-left transition-all duration-150 hover:translate-x-1 group"
              >
                <IconComponent size={16} className={`${item.textColor} group-hover:scale-110 transition-transform`} />
                <span className="text-gray-200 font-medium group-hover:text-white transition-colors">{item.text}</span>
              </button>
              {!isLast && item.id === 'duplicate' && (
                <div className="mx-4 h-px bg-gray-700/50"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submenu rendered as portal to avoid overflow issues */}
      {showFolderSubmenu && data?.type === "task" && createPortal(
        <div 
          ref={subMenuRef} 
          className="fixed z-[60] bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl py-2 px-1 min-w-48 animate-in fade-in-0 zoom-in-95 duration-200"
          style={{ 
            left: submenuPosition.x, 
            top: submenuPosition.y,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}
          onMouseEnter={handleSubmenuEnter} 
          onMouseLeave={handleSubmenuLeave}
        >
          {getAvailableFolders().length === 0 
            ? <div className="px-4 py-3 text-sm text-gray-500 italic">No other folders</div>
            : getAvailableFolders().map((folder) => (
                <button 
                  key={folder.id} 
                  onClick={() => handleFolderSelect(folder.id)} 
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-800/60 text-left transition-all duration-150 hover:translate-x-1 group"
                >
                  <Folder size={16} style={{ color: folder.colour }} className="group-hover:scale-110 transition-transform" />
                  <span 
                    className="font-medium group-hover:text-white transition-colors"
                    style={{ color: folder.colour }}
                  >
                    {folder.name}
                  </span>
                </button>
              ))}
        </div>,
        document.body
      )}
    </>
  );
}
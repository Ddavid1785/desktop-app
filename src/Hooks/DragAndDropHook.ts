// src/Hooks/useDragAndDrop.ts

import { useState, useEffect, useRef } from "react";
import { Task, TaskData } from "../types";

export interface DragData {
  taskId: string;
  currentFolderId: string;
  task: Task;
  initialX: number;
  initialY: number;
}

export interface DropTarget {
  folderId: string | null;
  taskId: string | null;
  isFolderTopHalf: boolean;
}

export function useDragAndDrop(
  taskData: TaskData,
  onMoveToFolder: (taskId: string, currentFolderId: string, newFolderId: string) => void,
  onReorderTask: (taskId: string, folderId: string, newIndex: number) => void
) {
  const [draggedTask, setDraggedTask] = useState<DragData | null>(null);
  const [draggedTaskClientXY, setDraggedTaskClientXY] = useState<{ x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  
  // Track if we actually performed a drag operation
  const dragOperationPerformed = useRef(false);
  const dragStartTime = useRef<number>(0);

  const handleDragStartManual = (
    element: HTMLDivElement,
    clientX: number,
    clientY: number,
    task: Task,
    currentFolderId: string
  ) => {
    const rect = element.getBoundingClientRect();
    const initialX = clientX - rect.left;
    const initialY = clientY - rect.top;

    setDraggedTask({ taskId: task.id, currentFolderId, task, initialX, initialY });
    setDraggedTaskClientXY({ x: clientX, y: clientY });
    dragOperationPerformed.current = false;
    dragStartTime.current = Date.now();
  };

  const resetDragState = () => {
    setDraggedTask(null);
    setDraggedTaskClientXY(null);
    setDropTarget(null);
    
    // Add a small delay before allowing clicks again to prevent unwanted folder selection
    if (dragOperationPerformed.current) {
      setTimeout(() => {
        dragOperationPerformed.current = false;
      }, 100);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedTask) return;
      
      // Mark that we've moved the mouse during drag (indicates actual drag operation)
      const dragDuration = Date.now() - dragStartTime.current;
      if (dragDuration > 100) { // Only consider it a drag after 100ms
        dragOperationPerformed.current = true;
      }
      
      setDraggedTaskClientXY({ x: e.clientX, y: e.clientY });

      let newDropTarget: DropTarget | null = null;
      const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
      
      for (const element of elementsUnderMouse) {
        // Check for dropping on a specific task
        const hoverTaskId = element.getAttribute("data-task-id");
        if (hoverTaskId && hoverTaskId !== draggedTask.taskId) {
          const folderElement = element.closest("[data-folder-drop-id], .ungrouped-drop-zone");
          if (folderElement) {
            const folderId = folderElement.getAttribute("data-folder-drop-id") ?? "ungrouped";
            
            const rect = element.getBoundingClientRect();
            const isTopHalf = (e.clientY - rect.top) < (rect.height / 2);
            newDropTarget = { folderId, taskId: hoverTaskId, isFolderTopHalf: isTopHalf };
            break;
          }
        }
        
        // Check for dropping on a folder's empty space
        const hoverFolderId = element.getAttribute("data-folder-drop-id");
        if (hoverFolderId && hoverFolderId !== draggedTask.currentFolderId) {
          newDropTarget = { folderId: hoverFolderId, taskId: null, isFolderTopHalf: false };
          break;
        }
        
        // Check for dropping on the ungrouped container
        if (element.classList.contains("ungrouped-drop-zone") && draggedTask.currentFolderId !== "ungrouped") {
          newDropTarget = { folderId: "ungrouped", taskId: null, isFolderTopHalf: false };
          break;
        }
      }

      setDropTarget(newDropTarget);
      document.body.style.cursor = newDropTarget ? "copy" : "no-drop";
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggedTask) return;

      // Prevent the mouseup event from bubbling if we performed a drag operation
      if (dragOperationPerformed.current) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (dropTarget) {
        // SCENARIO 1: POSITIONING
        if (dropTarget.taskId && dropTarget.folderId !== null) {
          const targetFolderId = dropTarget.folderId;
          const isSameFolder = targetFolderId === draggedTask.currentFolderId;
          
          const targetTaskList = targetFolderId === "ungrouped"
            ? taskData.ungrouped
            : taskData.folders.find(f => f.id === targetFolderId)?.tasks || [];
          
          let targetIndex = targetTaskList.findIndex(t => t.id === dropTarget.taskId);
          
          if (targetIndex !== -1) {
            let newIndex = targetIndex;
            
            if (!dropTarget.isFolderTopHalf) {
              newIndex += 1;
            }
            
            if (isSameFolder) {
              const draggedTaskIndex = targetTaskList.findIndex(t => t.id === draggedTask.taskId);
              if (draggedTaskIndex !== -1 && draggedTaskIndex < targetIndex) {
                newIndex -= 1;
              }
              
              onReorderTask(draggedTask.taskId, draggedTask.currentFolderId, newIndex);
            } else {
              onMoveToFolder(draggedTask.taskId, draggedTask.currentFolderId, targetFolderId);
              
              setTimeout(() => {
                onReorderTask(draggedTask.taskId, targetFolderId, newIndex);
              }, 0);
            }
          }
        }
        // SCENARIO 2: SIMPLE FOLDER MOVE
        else if (dropTarget.folderId !== null) {
          onMoveToFolder(draggedTask.taskId, draggedTask.currentFolderId, dropTarget.folderId);
        }
      }

      resetDragState();
    };

    if (draggedTask) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp, true); // Use capture phase
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp, true);
      document.body.style.cursor = "auto";
      document.body.style.userSelect = "auto";
    };
  }, [draggedTask, taskData, onMoveToFolder, onReorderTask, dropTarget]);

  const ghostStyle: React.CSSProperties = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 1000,
    opacity: 0.8,
    left: draggedTaskClientXY ? `${draggedTaskClientXY.x - (draggedTask?.initialX || 0)}px` : "0px",
    top: draggedTaskClientXY ? `${draggedTaskClientXY.y - (draggedTask?.initialY || 0)}px` : "0px",
    width: "auto",
    minWidth: "200px",
    maxWidth: "300px",
    transform: "rotate(3deg)",
  };

  // Export function to check if we should ignore clicks
  const shouldIgnoreClick = () => dragOperationPerformed.current;

  return { 
    draggedTask, 
    dropTarget, 
    ghostStyle, 
    handleDragStartManual,
    shouldIgnoreClick 
  };
}
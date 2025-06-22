import { useEffect, useRef } from "react";
import { Task, TaskDataHandlers, TaskFolder } from "../types";

interface KeyboardShortcutsProps {
  taskData: TaskFolder[];
  handlers:TaskDataHandlers;
  selectedTaskId: string | null;
  selectedFolderId: string | null;
  setShowAddForm: (show: boolean) => void;
  setAddFormMode: (mode: "task" | "folder") => void;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
  editingState: {
    type: 'task' | 'folder' | null;
    id: string | null;
    data: {
      text?: string;
      name?: string;
      colour: string;
    } | null;
  };
  setEditingState: (state: {
    type: 'task' | 'folder' | null;
    id: string | null;
    data: {
      text?: string;
      name?: string;
      colour: string;
    } | null;
  }) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
}

let clipboardTask: { task: Task; folderId: string } | null = null;

export function useKeyboardShortcuts({
  taskData,
  handlers,
  selectedTaskId,
  selectedFolderId,
  setShowAddForm,
  setAddFormMode,
  onShowToast,
  editingState,
  setEditingState,
  setSelectedTaskId,
  setSelectedFolderId,
}: KeyboardShortcutsProps) {
  const lastActionRef = useRef<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      const findSelectedTask = () => {
        if (!selectedTaskId) return null;
        for (const folder of taskData) {
          const folderTask = folder.tasks.find((t) => t.id === selectedTaskId);
          if (folderTask) return { task: folderTask, folderId: folder.id };
        }
        return null;
      };

      // COPY SHORTCUTS
      if (isCtrl && e.key.toLowerCase() === "c") {
        e.preventDefault();
        const selectedTask = findSelectedTask();
        if (selectedTask) {
          clipboardTask = selectedTask;
          onShowToast?.(`Copied task: "${selectedTask.task.text}"`, "success");
          lastActionRef.current = "copy-task";
        } else if (selectedFolderId) {
          onShowToast?.(
            "Cannot copy folders. Use Ctrl+D to duplicate.",
            "info"
          );
        }
        return;
      }

      // PASTE SHORTCUTS
      if (isCtrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        if (clipboardTask) {
          const targetFolderId = selectedFolderId ?? "no id provided";
          // THE FIX: Use the 'completed' status from the copied task
          const newTask = {
            text: clipboardTask.task.text,
            completed: clipboardTask.task.completed,
            colour: clipboardTask.task.colour,
          };
          handlers.addTask(newTask, targetFolderId);
          onShowToast?.(`Pasted task: "${newTask.text}"`, "success");
          lastActionRef.current = "paste-task";
        } else {
          onShowToast?.("Clipboard is empty.", "info");
        }
        return;
      }

      // DUPLICATE SHORTCUTS
      if (isCtrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const selectedTask = findSelectedTask();
        if (selectedTask) {
          handlers.duplicateTask(selectedTask.task.id, selectedTask.folderId);
          onShowToast?.(
            `Duplicated task: "${selectedTask.task.text}"`,
            "success"
          );
          lastActionRef.current = "duplicate-task";
        } else if (selectedFolderId) {
          const folder = taskData.find(
            (f) => f.id === selectedFolderId
          );
          if (folder) {
            handlers.duplicateFolder(selectedFolderId);
            onShowToast?.(`Duplicated folder: "${folder.name}"`, "success");
            lastActionRef.current = "duplicate-folder";
          }
        }
        return;
      }

      // DELETE SHORTCUTS
      if (e.key === "Delete" || (isCtrl && e.key === "Backspace")) {
        e.preventDefault();
        const selectedTask = findSelectedTask();
        if (selectedTask) {
          handlers.deleteTask(selectedTask.task.id, selectedTask.folderId);
          onShowToast?.(`Deleted task: "${selectedTask.task.text}"`, "success");
          lastActionRef.current = "delete-task";
        } else if (selectedFolderId) {
          const folder = taskData.find(
            (f) => f.id === selectedFolderId
          );
          if (folder) {
            handlers.deleteFolder(selectedFolderId);
            onShowToast?.(`Deleted folder: "${folder.name}"`, "success");
            lastActionRef.current = "delete-folder";
          }
        }
        return;
      }

      // TOGGLE COMPLETION
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const selectedTask = findSelectedTask();
        if (selectedTask) {
          handlers.toggleTaskCompletion(
            selectedTask.task.id,
            selectedTask.folderId
          );
          const status = selectedTask.task.completed
            ? "incomplete"
            : "complete";
          onShowToast?.(`Marked task as ${status}`, "success");
          lastActionRef.current = "toggle-completion";
        }
        return;
      }

      // ADD NEW TASK/FOLDER FORMS
      if (isCtrl && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (isShift) {
          setAddFormMode("folder");
          setShowAddForm(true);
          lastActionRef.current = "new-folder-form";
        } else {
          setAddFormMode("task");
          setShowAddForm(true);
          lastActionRef.current = "new-task-form";
        }
        return;
      }

      // QUICK ADD TASK (Alt + N)
      if (isAlt && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const quickTask = { text: "New Task", completed: false, colour: "#111827" };
        const targetFolderId = selectedFolderId ?? "no id provided";
        handlers.addTask(quickTask, targetFolderId);
        onShowToast?.("Quick task added", "success");
        lastActionRef.current = "quick-add-task";
        return;
      }

      // ESCAPE - Close forms
      if (e.key === "Escape") {
        setShowAddForm(false);
        return;
      }

      // F2 - Start editing selected task or folder
      if (e.key === "F2") {
        e.preventDefault();
        const selectedTask = findSelectedTask();
        if (selectedTask) {
          // Start editing the selected task
          setEditingState({
            type: 'task',
            id: selectedTask.task.id,
            data: {
              text: selectedTask.task.text,
              colour: selectedTask.task.colour || '#6366f1',
            },
          });
          lastActionRef.current = "edit-task";
        } else if (selectedFolderId) {
          // Start editing the selected folder
          const folder = taskData.find((f) => f.id === selectedFolderId);
          if (folder) {
            setEditingState({
              type: 'folder',
              id: folder.id,
              data: {
                name: folder.name,
                colour: folder.colour || '#8b5cf6',
              },
            });
            lastActionRef.current = "edit-folder";
          }
        } else {
          onShowToast?.("No item selected to edit", "info");
        }
        return;
      }

      // Arrow keys for navigation
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        
        // Left/Right arrows - navigate between folders only
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const currentFolderIndex = taskData.findIndex(folder => folder.id === selectedFolderId);
          if (currentFolderIndex !== -1) {
            let newFolderIndex = currentFolderIndex;
            if (e.key === "ArrowLeft") {
              newFolderIndex = Math.max(0, currentFolderIndex - 1);
            } else {
              newFolderIndex = Math.min(taskData.length - 1, currentFolderIndex + 1);
            }
            
            if (newFolderIndex !== currentFolderIndex) {
              const newFolder = taskData[newFolderIndex];
              setSelectedFolderId(newFolder.id);
              setSelectedTaskId(null);
            }
          } else if (taskData.length > 0) {
            // No folder selected, select first or last
            const targetIndex = e.key === "ArrowLeft" ? taskData.length - 1 : 0;
            setSelectedFolderId(taskData[targetIndex].id);
            setSelectedTaskId(null);
          }
          return;
        }

        // Up/Down arrows - navigate through all items (folders and tasks) in order
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          // Create a flat list of all items in order
          const allItems: Array<{ type: 'folder' | 'task', id: string, folderId?: string }> = [];
          taskData.forEach(folder => {
            // Add folder
            allItems.push({ type: 'folder', id: folder.id });
            // Add tasks in this folder
            folder.tasks.forEach(task => {
              allItems.push({ type: 'task', id: task.id, folderId: folder.id });
            });
          });

          // Find current item index - check both selectedTaskId and selectedFolderId
          let currentItemIndex = -1;
          if (selectedTaskId) {
            currentItemIndex = allItems.findIndex(item => 
              item.type === 'task' && item.id === selectedTaskId
            );
          } else if (selectedFolderId) {
            currentItemIndex = allItems.findIndex(item => 
              item.type === 'folder' && item.id === selectedFolderId
            );
          }

          console.log('Navigation debug:', {
            selectedTaskId,
            selectedFolderId,
            currentItemIndex,
            allItems: allItems.map(item => `${item.type}:${item.id}`),
            key: e.key
          });

          if (currentItemIndex === -1) {
            // No selection, select first item
            if (allItems.length > 0) {
              const firstItem = allItems[0];
              if (firstItem.type === 'folder') {
                setSelectedFolderId(firstItem.id);
                setSelectedTaskId(null);
              } else {
                setSelectedTaskId(firstItem.id);
                setSelectedFolderId(firstItem.folderId || null);
              }
            }
            return;
          }

          // Calculate new index
          let newIndex = currentItemIndex;
          if (e.key === "ArrowUp") {
            newIndex = Math.max(0, currentItemIndex - 1);
          } else {
            newIndex = Math.min(allItems.length - 1, currentItemIndex + 1);
          }

          console.log('Navigation update:', {
            currentItemIndex,
            newIndex,
            currentItem: allItems[currentItemIndex],
            newItem: allItems[newIndex]
          });

          // Update selection
          if (newIndex !== currentItemIndex) {
            const newItem = allItems[newIndex];
            if (newItem.type === 'folder') {
              setSelectedFolderId(newItem.id);
              setSelectedTaskId(null);
            } else {
              setSelectedTaskId(newItem.id);
              setSelectedFolderId(newItem.folderId || null);
            }
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    taskData,
    selectedTaskId,
    selectedFolderId,
    handlers,
    setShowAddForm,
    setAddFormMode,
    onShowToast,
    editingState,
    setEditingState,
    setSelectedTaskId,
    setSelectedFolderId,
  ]);

  return {
    lastAction: lastActionRef.current,
    clipboardHasTask: clipboardTask !== null,
  };
}

export function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 font-medium mb-2">Editing</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">Copy Task</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Ctrl+C
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Paste Task</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Ctrl+V
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Duplicate</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Ctrl+D
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Delete</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Del
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Toggle Complete</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Space
                  </kbd>
                </div>
              </div>
            </div>
            <div>
              <div className="text-gray-400 font-medium mb-2">General</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">New Task Form</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Ctrl+N
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">New Folder Form</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Ctrl+Shift+N
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Quick Add Task</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Alt+N
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Close Dialog</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    Esc
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Show Help</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">
                    F1
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Pro tip: Click a task, an empty space in a folder, or the "Tasks"
            header to select it.
          </p>
        </div>
      </div>
    </div>
  );
}

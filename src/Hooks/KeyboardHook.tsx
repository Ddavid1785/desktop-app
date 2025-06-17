import { useEffect, useRef } from "react";
import { Task, TaskFolder } from "../types";

interface KeyboardShortcutsProps {
  taskData: {
    ungrouped: Task[];
    folders: TaskFolder[];
  };
  handlers: {
    duplicateTask: (taskId: string, folderId: string) => void;
    deleteTask: (taskId: string, folderId: string) => void;
    toggleTaskCompletion: (taskId: string, folderId: string) => void;
    addTask: (task: Omit<Task, "id">, folderId: string) => void;
    addFolder: (folderName: string) => void;
    duplicateFolder: (folderId: string) => void;
    deleteFolder: (folderId: string) => void;
  };
  selectedTaskId: string | null;
  selectedFolderId: string | null;
  setShowAddForm: (show: boolean) => void;
  setAddFormMode: (mode: "task" | "folder") => void;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
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
        const ungroupedTask = taskData.ungrouped.find(
          (t) => t.id === selectedTaskId
        );
        if (ungroupedTask) return { task: ungroupedTask, folderId: "" };
        for (const folder of taskData.folders) {
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
          const targetFolderId = selectedFolderId ?? "";
          // THE FIX: Use the 'completed' status from the copied task
          const newTask = {
            text: clipboardTask.task.text,
            completed: clipboardTask.task.completed,
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
        } else if (selectedFolderId && selectedFolderId !== "") {
          const folder = taskData.folders.find(
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
        } else if (selectedFolderId && selectedFolderId !== "") {
          const folder = taskData.folders.find(
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
        const quickTask = { text: "New Task", completed: false };
        const targetFolderId = selectedFolderId ?? "";
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

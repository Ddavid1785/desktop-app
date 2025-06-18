import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Task, TaskFolder, TaskDataHandlers } from "../types";
import { useToast } from "../Components/ToastNotification";

// This hook manages all data and operations related to tasks and folders.
export function useTaskDataManager() {
  const { showToast } = useToast();
  const [taskData, setTaskData] = useState<TaskFolder[]>([]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: TaskFolder[] = await invoke("fetch_task_data");
        setTaskData(data);
      } catch (error) {
        console.error("Error fetching task data", error);
        showToast("Failed to load tasks", "error");
      }
    };
    fetchData();
  }, []);

  const toggleTaskCompletion = async (taskId: string, folderId: string) => {
    try {
      await invoke("complete_task", { taskId, folderId });
      setTaskData((prev) => {
        const newFolders = prev.map(folder => {
          if (folder.id !== folderId) return folder;
          const newTasks = folder.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          );
          return { ...folder, tasks: newTasks };
        });
        return newFolders;
      });
    } catch (e) {
        showToast("Failed to toggle task completion", "error");
    }
  };

  const deleteTask = async (taskId: string, folderId: string) => {
    try {
        await invoke("delete_task", { taskId, folderId });
        setTaskData((prev) => {
            return prev.map(f => f.id === folderId ? { ...f, tasks: f.tasks.filter(t => t.id !== taskId) } : f);
        });
    } catch (e) {
        showToast("Failed to delete task", "error");
    }
  };
  
  const addTask = async (taskInput: Omit<Task, "id">, folderId: string) => {
    const taskId = crypto.randomUUID();
    try {
        // Ensure color is set to a default if not provided
        const taskWithColor = {
            ...taskInput,
            colour: taskInput.colour || "bg-gray-800", // Default color if none provided
            id: taskId
        };
        await invoke("create_task", { t: taskWithColor, folderId });
        setTaskData((prev) => {
            return prev.map(f => f.id === folderId ? { ...f, tasks: [...f.tasks, taskWithColor] } : f);
        });
        return taskId;
    } catch(e) {
      console.error("Failed to create task", e);
        showToast("Failed to create task", "error");
        return null;
    }
  };

  const addFolder = async (folderName: string, folderColor: string) => {
    const folderId = crypto.randomUUID();
    try {
        await invoke("create_folder", { folderName, folderId, folderColor });
        setTaskData(prev => [...prev, { name: folderName, id: folderId, visible: true, tasks: [], colour: folderColor }]);
        return folderId;
    } catch (e) {
        showToast("Failed to create folder", "error");
        return null;
    }
  };

const moveTaskToFolder = async (taskId: string, currentFolderId: string, newFolderId: string) => {
    if (newFolderId === currentFolderId) return;
    try {
        await invoke("move_task_to_folder", { taskId, folderId: currentFolderId, newFolderId });

        setTaskData((prevData) => {
            let taskToMove: Task | undefined;

            // Step 1: Find and Remove the task from its original location
            const updatedFolders = prevData.map(folder => {
                if (folder.id === currentFolderId) {
                    taskToMove = folder.tasks.find(t => t.id === taskId);
                    // Return a new folder object with the task removed
                    return { ...folder, tasks: folder.tasks.filter(t => t.id !== taskId) };
                }
                return folder;
            });

            if (!taskToMove) {
                console.error("Task to move not found. Aborting state update.");
                return prevData; // Abort if something went wrong
            }

            // Step 2: Add the task to its new location
            return updatedFolders.map(folder => {
                if (folder.id === newFolderId) {
                    // Return a new folder object with the task added
                    return { ...folder, tasks: [...folder.tasks, taskToMove!] };
                }
                return folder;
            });
        });
    } catch (error) {
        console.error("Failed to move task:", error);
        showToast("Failed to move task", "error");
    }
};

const reorderTask = async (taskId: string, folderId: string, newIndex: number) => {
    try {        
        // First, call your Rust backend to make the change permanent.
        await invoke("move_task_order", { taskId, folderId, newIndex });

        // Then, update the local React state immediately for a snappy UI.
        setTaskData((prev) => {
            // Find the folder containing the task
            const folder = prev.find(f => f.id === folderId);
            if (!folder) {
                console.error("Could not find folder to reorder");
                return prev;
            }

            // Find the task that's being moved
            const taskToMove = folder.tasks.find(t => t.id === taskId);
            if (!taskToMove) {
                console.error("Could not find task to move");
                return prev;
            }

            // Create a new array without the task we're moving
            const remainingTasks = folder.tasks.filter(t => t.id !== taskId);

            // Insert the task at its new position in the filtered array
            remainingTasks.splice(newIndex, 0, taskToMove);

            // Update the folder with the reordered tasks
            return prev.map(f => {
                if (f.id === folderId) {
                    return {
                        ...f,
                        tasks: remainingTasks
                    };
                }
                return f;
            });
        });

    } catch (error) {
        console.error("Failed to reorder task:", error);
        showToast("Failed to reorder task", "error");
    }
};

const moveTaskToFolderAndReorder = async (
    taskId: string, 
    currentFolderId: string, 
    newFolderId: string, 
    newIndex: number
  ) => {
    try {
      // First move to the new folder
      await invoke("move_task_to_folder", { 
        taskId, 
        folderId: currentFolderId, 
        newFolderId 
      });
      
      // Then reorder within that folder
      await invoke("move_task_order", { 
        taskId, 
        folderId: newFolderId, 
        newIndex 
      });
  
      // Refresh the entire state from backend to ensure consistency
      const updatedData: TaskFolder[] = await invoke("fetch_task_data");
      setTaskData(updatedData);
  
    } catch (error) {
      console.error("Failed to move and reorder task:", error);
      showToast("Failed to move task", "error");
    }
  };

  const duplicateTask = async (taskId: string, folderId: string) => {
    const cloneTaskId = crypto.randomUUID();
    try {
        await invoke("duplicate_task", { taskId, cloneTaskId, folderId });
        setTaskData((prev) => {
            const folder = prev.find(f => f.id === folderId);
            if (!folder) return prev;
            
            const originalTask = folder.tasks.find(task => task.id === taskId);
            if (!originalTask) return prev;
            
            const duplicatedTask = { ...originalTask, id: cloneTaskId };
            if (!folder.tasks.some(task => task.id === cloneTaskId)) {
                return prev.map(f => {
                    if (f.id === folderId) {
                        return {
                            ...f,
                            tasks: [...f.tasks, duplicatedTask]
                        };
                    }
                    return f;
                });
            }
            return prev;
        });
    } catch (error) {
        showToast("Failed to duplicate task", "error");
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
        await invoke("delete_tasks_folder", { folderId });
        setTaskData((prev) => prev.filter((folder) => folder.id !== folderId));
    } catch (error) {
        showToast("Failed to delete folder", "error");
    }
  };

  const toggleFolderVisibility = async (folderId: string) => {
    try {
        await invoke("toggle_visability_folder", { folderId });
        setTaskData((prev) => prev.map((f) => f.id === folderId ? { ...f, visible: !f.visible } : f));
    } catch (error) {
        showToast("Failed to toggle folder visibility", "error");
    }
  };

  const duplicateFolder = async (folderId: string) => {
    const folder = taskData.find((f) => f.id === folderId);
    if (!folder) return;

    const newFolderId = crypto.randomUUID();
    const newTaskIds = folder.tasks.map(() => crypto.randomUUID());

    try {
        await invoke("duplicate_folder", { folderId: folderId, folderCloneId: newFolderId, taskCloneIds: newTaskIds });
        const clonedTasks = folder.tasks.map((task, index) => ({ ...task, id: newTaskIds[index] }));
        const clonedFolder: TaskFolder = { ...folder, id: newFolderId, name: `${folder.name} (Copy)`, tasks: clonedTasks };
        setTaskData((prev) => [...prev, clonedFolder]);
    } catch (error) {
        showToast("Failed to duplicate folder", "error");
    }
  };

  // Create the final handlers object that matches the TaskDataHandlers interface
  const dataHandlers: TaskDataHandlers = {
    toggleTaskCompletion,
    deleteTask,
    addTask,
    reorderTask,
    moveTaskToFolderAndReorder,
    editTask: (taskId, folderId) => showToast("Rename feature coming soon!", "info"),
    duplicateTask,
    addFolder,
    deleteFolder,
    toggleFolderVisibility,
    editFolder: (folderId) => showToast("Rename feature coming soon!", "info"),
    duplicateFolder,
    moveTaskToFolder,
  };

  return { taskData, dataHandlers };
}
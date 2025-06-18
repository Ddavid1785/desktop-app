export interface Task {
    text: string;
    colour: string;
    completed: boolean;
    id: string;
}

export interface TaskFolder{
     id: string,
     name: string,
     colour: string;
     visible: boolean,
     tasks: Task[],
}

export interface DragData {
  taskId: string;
  currentFolderId: string; // "" for ungrouped
  task: Task; // Storing the full task object
}

export interface ContextMenuData {
  type: "task" | "folder";
  taskId?: string;
  folderId?: string;

  // Optional properties for specific item states
  isCompleted?: boolean;
  folder_visible?: boolean;
  colour?: string; // The color of the item that was clicked
  tasks?: Task[];
}

export interface TaskDataHandlers {
  // Task-specific operations
  toggleTaskCompletion: (taskId: string, folderId: string) => void;
  deleteTask: (taskId: string, folderId: string) => void;
  addTask: (taskInput: Omit<Task, "id">, folderId: string) => void;
  editTask: (taskId: string, folderId: string) => void;
  duplicateTask: (taskId: string, folderId: string) => void;
  
  // Folder-specific operations
  addFolder: (folderName: string, folderColor: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderVisibility: (folderId: string) => void;
  editFolder: (folderId: string) => void;
  duplicateFolder: (folderId: string) => void;

  // Cross-cutting operations
  moveTaskToFolder: (taskId: string, currentFolderId: string, newFolderId: string) => void;
  reorderTask: (taskId: string, folderId: string, newIndex: number) => void;
  moveTaskToFolderAndReorder: (taskId: string, currentFolderId: string, newFolderId: string, newIndex: number) => void;
}
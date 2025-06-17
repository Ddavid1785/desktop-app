import { FolderPlus, Plus } from "lucide-react";

export default function ToDoActionButtons({
  showAddForm,
  addFormMode,
  setShowAddForm,
  setAddFormMode,
}: {
  showAddForm: boolean;
  addFormMode: "task" | "folder";
  setShowAddForm: (b: boolean) => void;
  setAddFormMode: (mode: "task" | "folder") => void;
}) {
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => {
          if (showAddForm && addFormMode === "task") {
            setShowAddForm(false);
          } else {
            setAddFormMode("task");
            setShowAddForm(true);
          }
        }}
        className="flex-1 p-2 bg-gray-900 border border-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-700 transition-all text-sm flex items-center justify-center gap-2 hover:cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </button>
      <button
        onClick={() => {
          if (showAddForm && addFormMode === "folder") {
            setShowAddForm(false);
          } else {
            setAddFormMode("folder");
            setShowAddForm(true);
          }
        }}
        className="p-2 bg-gray-900 border border-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-700 transition-all text-sm flex items-center justify-center gap-2 hover:cursor-pointer"
      >
        <FolderPlus className="w-4 h-4" />
        Folder
      </button>
    </div>
  );
}

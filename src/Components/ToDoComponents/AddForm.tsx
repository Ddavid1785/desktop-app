import { useState } from "react";
import { Task, TaskFolder } from "../../types";
import { Check, X } from "lucide-react";

interface AddFormProps {
  showAddForm: boolean;
  addFormMode: "task" | "folder";
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id">, folderId: string) => void;
  onAddFolder: (folderName: string) => void;
  folders: TaskFolder[];
}

export default function AddForm({
  showAddForm,
  addFormMode,
  onClose,
  onAddTask,
  onAddFolder,
  folders,
}: AddFormProps) {
  const [addingTask, setAddingTask] = useState<Omit<Task, "id">>({
    text: "",
    completed: false,
  });
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");

  const handleChangeOnInputForTask = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const field = e.target.name as keyof Omit<Task, "id">;
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;

    setAddingTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (addFormMode === "task") {
      if (addingTask.text.trim()) {
        onAddTask(addingTask, selectedFolderId);
        setAddingTask({ text: "", completed: false });
      }
    } else {
      if (newFolderName.trim()) {
        onAddFolder(newFolderName);
        setNewFolderName("");
      }
    }
  };

  const handleCancel = () => {
    setAddingTask({ text: "", completed: false });
    setNewFolderName("");
    setSelectedFolderId("");
    onClose();
  };

  if (!showAddForm) return null;

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 shadow-2xl mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">
          {addFormMode === "task" ? "New Task" : "New Folder"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors hover:cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {addFormMode === "task" ? (
          <>
            {/* Task Text Input */}
            <input
              type="text"
              name="text"
              onChange={handleChangeOnInputForTask}
              value={addingTask.text}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-md text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
            />

            {/* Folder Selection Dropdown */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Add to folder:</label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
              >
                <option value="">Ungrouped</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Completed Checkbox */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setAddingTask((prev) => ({
                    ...prev,
                    completed: !prev.completed,
                  }))
                }
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all hover:cursor-pointer ${
                  addingTask.completed
                    ? "bg-green-600 border-green-600"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                {addingTask.completed && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </button>
              <span className="text-sm text-gray-400">Mark as completed</span>
            </div>
          </>
        ) : (
          <>
            {/* Folder Name Input */}
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-md text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
            />
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={
              addFormMode === "task"
                ? !addingTask.text.trim()
                : !newFolderName.trim()
            }
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              (
                addFormMode === "task"
                  ? addingTask.text.trim()
                  : newFolderName.trim()
              )
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {addFormMode === "task" ? "Add Task" : "Create Folder"}
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-700 transition-all text-sm hover:cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

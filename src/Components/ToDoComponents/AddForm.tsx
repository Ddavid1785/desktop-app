import { useState, useRef, useEffect } from "react";
import { Task, TaskFolder } from "../../types";
import { Check, X, Palette } from "lucide-react";

interface AddFormProps {
  showAddForm: boolean;
  addFormMode: "task" | "folder";
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id">, folderId: string) => void;
  onAddFolder: (folderName: string, folderColor: string) => void;
  folders: TaskFolder[];
}

const COLORS = [
  { name: "Default", value: "#111827" }, // gray-900
  { name: "Blue", value: "#2563eb" },    // blue-600
  { name: "Green", value: "#16a34a" },   // green-600
  { name: "Purple", value: "#9333ea" },  // purple-600
  { name: "Pink", value: "#db2777" },    // pink-600
  { name: "Orange", value: "#ea580c" },  // orange-600
  { name: "Teal", value: "#0d9488" },    // teal-600
  { name: "Indigo", value: "#4f46e5" },  // indigo-600
  { name: "Cyan", value: "#0891b2" },    // cyan-600
  { name: "Rose", value: "#e11d48" },    // rose-600
  { name: "Amber", value: "#d97706" },   // amber-600
];

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
    colour: "#111827",
  });
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [folderColor, setFolderColor] = useState("#111827");
  const [showColorMenu, setShowColorMenu] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setShowColorMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        setAddingTask({ text: "", completed: false, colour: "#111827" });
      }
    } else {
      if (newFolderName.trim()) {
        onAddFolder(newFolderName, folderColor);
        setNewFolderName("");
        setFolderColor("#111827");
      }
    }
  };

  const handleCancel = () => {
    setAddingTask({ text: "", completed: false, colour: "#111827" });
    setNewFolderName("");
    setSelectedFolderId("");
    setFolderColor("#111827");
    setShowColorMenu(false);
    onClose();
  };

  const handleColorButtonClick = () => {
    setShowColorMenu(!showColorMenu);
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
            <div className="flex gap-2">
              <input
                type="text"
                name="text"
                onChange={handleChangeOnInputForTask}
                value={addingTask.text}
                placeholder="What needs to be done?"
                className="flex-1 px-3 py-2 bg-black border border-gray-800 rounded-md text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
              />
              <div className="relative" ref={colorMenuRef}>
                <button
                  onClick={handleColorButtonClick}
                  className="w-8 h-8 rounded-md border-2 border-gray-700 hover:border-gray-600 transition-colors"
                  style={{ backgroundColor: addingTask.colour }}
                  title="Choose color"
                />
                {showColorMenu && (
                  <div className="absolute right-0 mt-2 p-4 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-10 min-w-[200px]">
                    <div className="grid grid-cols-4 gap-4">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setAddingTask((prev) => ({
                              ...prev,
                              colour: color.value,
                            }));
                            setShowColorMenu(false);
                          }}
                          style={{ backgroundColor: color.value }}
                          className={`w-8 h-8 rounded border-2 transition-all ${
                            addingTask.colour === color.value
                              ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                              : "hover:ring-2 hover:ring-white/50"
                          }`}
                          title={color.name}
                        />
                      ))}
                      {/* Custom Color Picker for Tasks */}
                      <div className="relative">
                        <button
                          onClick={() => document.getElementById('custom-color-input-task')?.click()}
                          className={`w-8 h-8 rounded border-2 border-gray-700 flex items-center justify-center transition-all hover:ring-2 hover:ring-white/50 ${
                            !COLORS.find(c => c.value === addingTask.colour) 
                              ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" 
                              : ""
                          }`}
                          style={{ 
                            backgroundColor: !COLORS.find(c => c.value === addingTask.colour) 
                              ? addingTask.colour 
                              : 'transparent' 
                          }}
                          title="Choose custom color"
                        >
                          {COLORS.find(c => c.value === addingTask.colour) && (
                            <Palette className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <input
                          id="custom-color-input-task"
                          type="color"
                          value={addingTask.colour}
                          onChange={(e) => {
                            setAddingTask((prev) => ({
                              ...prev,
                              colour: e.target.value,
                            }));
                          }}
                          onBlur={() => setShowColorMenu(false)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Choose custom color"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 px-3 py-2 bg-black border border-gray-800 rounded-md text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
            />
            <div className="relative" ref={colorMenuRef}>
              <button
                onClick={handleColorButtonClick}
                className="w-8 h-8 rounded-md border-2 border-gray-700 hover:border-gray-600 transition-colors"
                style={{ backgroundColor: folderColor }}
                title="Choose color"
              />
              
              {showColorMenu && (
                <div className="absolute right-0 mt-2 p-4 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-10 min-w-[200px]">
                  <div className="grid grid-cols-4 gap-4">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          setFolderColor(color.value);
                          setShowColorMenu(false);
                        }}
                        style={{ backgroundColor: color.value }}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          folderColor === color.value
                            ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                            : "hover:ring-2 hover:ring-white/50"
                        }`}
                        title={color.name}
                      />
                    ))}
                    
                    {/* Custom Color Picker for Folders */}
                    <div className="relative">
                      <button
                        onClick={() => document.getElementById('custom-color-input-folder')?.click()}
                        className={`w-8 h-8 rounded border-2 border-gray-700 flex items-center justify-center transition-all hover:ring-2 hover:ring-white/50 ${
                          !COLORS.find(c => c.value === folderColor) 
                            ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" 
                            : ""
                        }`}
                        style={{ 
                          backgroundColor: !COLORS.find(c => c.value === folderColor) 
                            ? folderColor 
                            : 'transparent' 
                        }}
                        title="Choose custom color"
                      >
                        {COLORS.find(c => c.value === folderColor) && (
                          <Palette className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <input
                        id="custom-color-input-folder"
                        type="color"
                        value={folderColor}
                        onChange={(e) => {
                          setFolderColor(e.target.value);
                        }}
                        onBlur={() => setShowColorMenu(false)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Choose custom color"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
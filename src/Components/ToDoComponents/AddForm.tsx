import { useState, useRef, useEffect } from "react";
import { Check, X, Palette, Sparkles, FolderOpen, Target, Wand2, ChevronDown, Folder } from "lucide-react";
import { Task, TaskFolder } from "../../types";
import { createPortal } from "react-dom";
import CustomColorPicker from "../ColorPicker";

interface AddFormProps {
  showAddForm: boolean;
  isAddFormOpen: boolean;
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
  isAddFormOpen,
  addFormMode,
  onClose,
  onAddTask,
  onAddFolder,
  folders = [],
}: AddFormProps) {
  const [addingTask, setAddingTask] = useState({
    text: "",
    completed: false,
    colour: "#6366f1",
  });
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folders.length > 0 ? folders[0].id : null);
  const [folderColor, setFolderColor] = useState("#6366f1");
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const colorMenuRef = useRef(null);
  const customColorPickerRef = useRef(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isTaskMode = addFormMode === "task";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorMenuRef.current && !(colorMenuRef.current as HTMLElement).contains(event.target as Node) &&
          customColorPickerRef.current && !(customColorPickerRef.current as HTMLElement).contains(event.target as Node)) {
        setShowColorMenu(false);
        setShowCustomPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddFormOpen) {
        onClose();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isAddFormOpen) {
        e.preventDefault();
        // Check if form is valid before submitting
        if (isTaskMode) {
          if (addingTask.text.trim() && selectedFolderId) {
            handleSubmit();
          }
        } else {
          if (newFolderName.trim()) {
            handleSubmit();
          }
        }
      }
    };

    if (isAddFormOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleEnter);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleEnter);
      document.body.style.overflow = 'unset';
    };
  }, [isAddFormOpen, onClose, isTaskMode, addingTask.text, selectedFolderId, newFolderName]);

  const handleChangeOnInputForTask = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name;
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;

    setAddingTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (addFormMode === "task") {
      if (addingTask.text.trim() && selectedFolderId) {
        onAddTask(addingTask, selectedFolderId);
        setAddingTask({ text: "", completed: false, colour: "#6366f1" });
      }
    } else {
      if (newFolderName.trim()) {
        onAddFolder(newFolderName, folderColor);
        setNewFolderName("");
        setFolderColor("#6366f1");
      }
    }
  };

  const handleCancel = () => {
    setAddingTask({ text: "", completed: false, colour: "#6366f1" });
    setNewFolderName("");
    setSelectedFolderId("ungrouped");
    setFolderColor("#6366f1");
    setShowColorMenu(false);
    setShowCustomPicker(false);
    setShowFolderDropdown(false);
    onClose();
  };

  const handleColorButtonClick = () => {
    setShowColorMenu(!showColorMenu);
    setShowCustomPicker(false);
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setShowFolderDropdown(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!showAddForm || !isAddFormOpen) return null;

  // Render as portal to ensure it's on top of everything
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Enhanced backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300" />
      
      {/* Modal container */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Form Container */}
        <div 
          className="relative bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-6 overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Animated background gradient */}
          <div 
            className="absolute inset-0 opacity-5 animate-pulse"
            style={{
              background: isTaskMode 
                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f59e0b 100%)'
            }}
          />
          
          {/* Animated accent line */}
          <div 
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"
          />

          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl bg-gradient-to-br shadow-lg"
                style={{
                  background: isTaskMode 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                  boxShadow: isTaskMode 
                    ? '0 8px 20px rgba(59, 130, 246, 0.3)'
                    : '0 8px 20px rgba(139, 92, 246, 0.3)'
                }}
              >
                {isTaskMode ? (
                  <Target className="w-5 h-5 text-white" />
                ) : (
                  <FolderOpen className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isTaskMode ? "Create New Task" : "Create New Folder"}
                </h3>
                <p className="text-sm text-gray-400">
                  {isTaskMode ? "Add a task to your workflow" : "Organize your tasks with folders"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="
                group text-gray-400 hover:text-white transition-all duration-200 
                p-2 rounded-xl hover:bg-gray-800/60 hover:scale-110 hover:cursor-pointer
                relative overflow-hidden
              "
            >
              <div className="absolute inset-0 bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
              <X className="w-5 h-5 relative z-10" />
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            {isTaskMode ? (
              <>
                {/* Enhanced Task Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Task Description
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        name="text"
                        onChange={handleChangeOnInputForTask}
                        value={addingTask.text}
                        placeholder="What amazing thing will you accomplish?"
                        className="
                          w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl 
                          text-white text-sm placeholder-gray-500 
                          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                          transition-all duration-200 backdrop-blur-sm
                        "
                        autoFocus
                      />
                      {/* Input glow effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 peer-focus:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    </div>

                    {/* Enhanced Color Picker */}
                    <div className="relative" ref={colorMenuRef}>
                      <button
                        onClick={handleColorButtonClick}
                        className="
                          group relative w-12 h-12 rounded-xl border-2 border-gray-600/50 
                          hover:border-gray-500/50 transition-all duration-200 overflow-hidden
                          hover:scale-110 hover:shadow-lg
                        "
                        style={{ 
                          backgroundColor: addingTask.colour,
                          boxShadow: `0 4px 12px ${addingTask.colour}40`
                        }}
                        title="Choose task color"
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <Palette className="absolute inset-0 w-4 h-4 m-auto text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </button>

                      {/* Enhanced Color Menu */}
                      {showColorMenu && !showCustomPicker && (
                        <div 
                          className="
                            absolute right-0 mt-3 p-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 
                            rounded-2xl shadow-2xl z-10 min-w-[240px] overflow-hidden
                          "
                          style={{
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          {/* Menu gradient background */}
                          <div 
                            className="absolute inset-0 opacity-5"
                            style={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)'
                            }}
                          />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <Palette className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-medium text-white">Choose Color</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
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
                                  className={`
                                    group relative w-10 h-10 rounded-xl border-2 transition-all duration-200 
                                    hover:scale-110 hover:shadow-lg overflow-hidden
                                    ${addingTask.colour === color.value
                                      ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 border-white/50"
                                      : "border-gray-600/30 hover:border-gray-500/50"
                                    }
                                  `}
                                  title={color.name}
                                >
                                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                  {addingTask.colour === color.value && (
                                    <Check className="absolute inset-0 w-4 h-4 m-auto text-white" />
                                  )}
                                </button>
                              ))}
                              
                              {/* Custom Color Picker Button */}
                              <button
                                onClick={() => {
                                  setShowCustomPicker(true);
                                  setShowColorMenu(false);
                                }}
                                className="
                                  group relative w-10 h-10 rounded-xl border-2 border-gray-600/50 
                                  flex items-center justify-center transition-all duration-200 
                                  hover:border-purple-500/50 hover:scale-110 hover:shadow-lg
                                  bg-gradient-to-br from-purple-500/20 to-pink-500/20
                                "
                                title="Custom color"
                              >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                                <Wand2 className="w-4 h-4 text-purple-400 relative z-10" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Color Picker */}
                      {showCustomPicker && createPortal(
                        <div className="fixed" style={{
                          top: '50%',
                          left: '50%',
                          transform: 'translate(50%, -25%)',
                          zIndex: 9999
                        }}
                        ref={customColorPickerRef}
                        >
                          <CustomColorPicker
                            color={addingTask.colour}
                            onChange={(color:string) => setAddingTask(prev => ({ ...prev, colour: color }))}
                            onClose={() => setShowCustomPicker(false)}
                          />
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Folder Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    Add to Folder
                  </label>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFolderDropdown(!showFolderDropdown);
                      }}
                      className="
                        w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl 
                        text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 
                        focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm
                        flex items-center justify-between hover:bg-gray-700/60
                      "
                    >
                      <div className="flex items-center gap-3">
                        <Folder size={16} style={{ color: folders.find(f => f.id === selectedFolderId)?.colour }} />
                        <span 
                          className="font-medium"
                          style={{ color: folders.find(f => f.id === selectedFolderId)?.colour }}
                        >
                          {folders.find(f => f.id === selectedFolderId)?.name || "Select a folder"}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {showFolderDropdown && (
                      <div 
                        className="
                          absolute top-full left-0 right-0 mt-2 z-10
                          bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 
                          rounded-xl shadow-2xl py-2 animate-in fade-in-0 zoom-in-95 duration-200 px-1
                        "
                        style={{
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {folders.map((folder) => (
                          <button 
                            key={folder.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFolderSelect(folder.id);
                            }}
                            className={`
                              w-full flex items-center gap-3 px-4 py-3 text-sm text-left 
                              transition-all duration-150 hover:translate-x-1 group
                              ${selectedFolderId === folder.id 
                                ? 'bg-gray-800/80' 
                                : 'hover:bg-gray-800/60'
                              }
                            `}
                          >
                            <Folder 
                              size={16} 
                              style={{ color: folder.colour }} 
                              className={`group-hover:scale-110 transition-transform ${
                                selectedFolderId === folder.id ? 'scale-110' : ''
                              }`} 
                            />
                            <span 
                              className={`font-medium transition-colors ${
                                selectedFolderId === folder.id ? 'text-white' : ''
                              }`}
                              style={{ color: folder.colour }}
                            >
                              {folder.name}
                            </span>
                            {selectedFolderId === folder.id && (
                              <Check className="w-4 h-4 ml-auto text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Completed Checkbox */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <button
                    onClick={() =>
                      setAddingTask((prev) => ({
                        ...prev,
                        completed: !prev.completed,
                      }))
                    }
                    className={`
                      w-6 h-6 rounded-lg border-2 flex items-center justify-center 
                      transition-all duration-200 flex-shrink-0 relative overflow-hidden
                      ${addingTask.completed
                        ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500 shadow-lg shadow-green-500/25"
                        : "border-gray-500 hover:border-gray-400 bg-gray-800/50 hover:bg-gray-700/50"
                      }
                    `}
                  >
                    {addingTask.completed && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Mark as completed</p>
                    <p className="text-xs text-gray-500">Task will be created in completed state</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Enhanced Folder Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    Folder Name
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name (e.g., Work, Personal, Ideas)"
                        className="
                          w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl 
                          text-white text-sm placeholder-gray-500 
                          focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50
                          transition-all duration-200 backdrop-blur-sm
                        "
                        autoFocus
                      />
                    </div>

                    {/* Folder Color Picker */}
                    <div className="relative" ref={colorMenuRef}>
                      <button
                        onClick={handleColorButtonClick}
                        className="
                          group relative w-12 h-12 rounded-xl border-2 border-gray-600/50 
                          hover:border-gray-500/50 transition-all duration-200 overflow-hidden
                          hover:scale-110 hover:shadow-lg
                        "
                        style={{ 
                          backgroundColor: folderColor,
                          boxShadow: `0 4px 12px ${folderColor}40`
                        }}
                        title="Choose folder color"
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <Palette className="absolute inset-0 w-4 h-4 m-auto text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </button>

                      {/* Enhanced Color Menu for Folder */}
                      {showColorMenu && !showCustomPicker && createPortal(
                        <div 
                          className="
                            fixed bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 
                            rounded-2xl shadow-2xl z-[9999] min-w-[240px] overflow-hidden p-4
                          "
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(5%, -50%)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          {/* Menu gradient background */}
                          <div 
                            className="absolute inset-0 opacity-5"
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f59e0b 100%)'
                            }}
                          />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <Palette className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-medium text-white">Choose Color</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              {COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => {
                                    setFolderColor(color.value);
                                    setShowColorMenu(false);
                                  }}
                                  style={{ backgroundColor: color.value }}
                                  className={`
                                    group relative w-10 h-10 rounded-xl border-2 transition-all duration-200 
                                    hover:scale-110 hover:shadow-lg overflow-hidden
                                    ${folderColor === color.value
                                      ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 border-white/50"
                                      : "border-gray-600/30 hover:border-gray-500/50"
                                    }
                                  `}
                                  title={color.name}
                                >
                                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                  {folderColor === color.value && (
                                    <Check className="absolute inset-0 w-4 h-4 m-auto text-white" />
                                  )}
                                </button>
                              ))}
                              
                              {/* Custom Color Picker Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCustomPicker(true);
                                  setShowColorMenu(false);
                                }}
                                className="
                                  group relative w-10 h-10 rounded-xl border-2 border-gray-600/50 
                                  flex items-center justify-center transition-all duration-200 
                                  hover:border-purple-500/50 hover:scale-110 hover:shadow-lg
                                  bg-gradient-to-br from-purple-500/20 to-pink-500/20
                                "
                                title="Custom color"
                              >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                                <Wand2 className="w-4 h-4 text-purple-400 relative z-10" />
                              </button>
                            </div>
                          </div>
                        </div>,
                        document.body
                      )}

                      {showCustomPicker && createPortal(
                        <div className="fixed" style={{
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 9999
                        }}
                        ref={customColorPickerRef}
                        >
                          <CustomColorPicker
                            color={folderColor}
                            onChange={setFolderColor}
                            onClose={() => setShowCustomPicker(false)}
                          />
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}{/* Enhanced Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={
                  isTaskMode 
                    ? !addingTask.text.trim() 
                    : !newFolderName.trim()
                }
                className={`
                  flex-1 relative overflow-hidden rounded-xl px-6 py-3 font-medium text-white 
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  ${isTaskMode 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25'
                  }
                  hover:scale-[1.02] active:scale-[0.98]
                `}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {isTaskMode ? (
                    <>
                      <Target className="w-4 h-4" />
                      Create Task
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-4 h-4" />
                      Create Folder
                    </>
                  )}
                </div>
              </button>
  
              <button
                onClick={handleCancel}
                className="
                  px-6 py-3 rounded-xl font-medium text-gray-300 border border-gray-600/50 
                  hover:border-gray-500/50 hover:bg-gray-800/50 transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden
                "
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                <div className="relative z-10 flex items-center justify-center gap-2 hover:cursor-pointer">
                  <X className="w-4 h-4" />
                  Cancel
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
      document.body
    );
  }
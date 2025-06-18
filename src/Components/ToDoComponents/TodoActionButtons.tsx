import { FolderPlus, Plus, Sparkles } from "lucide-react";

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
  const taskButtonActive = showAddForm && addFormMode === "task";
  const folderButtonActive = showAddForm && addFormMode === "folder";

  return (
    <div className="sticky bottom-4 z-50 mx-4 mt-6">
      {/* Floating action bar with premium styling */}
      <div 
        className="
          relative bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 
          rounded-2xl shadow-2xl p-3 overflow-hidden
          animate-in slide-in-from-bottom-4 duration-500
        "
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Subtle animated background gradient */}
        <div 
          className="absolute inset-0 opacity-5 animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)'
          }}
        />
        
        {/* Animated accent line */}
        <div 
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"
        />

        <div className="flex items-center gap-3 relative z-10">
          {/* Enhanced Add Task Button */}
          <button
            onClick={() => {
              if (taskButtonActive) {
                setShowAddForm(false);
              } else {
                setAddFormMode("task");
                setShowAddForm(true);
              }
            }}
            className={`
              group flex-1 relative overflow-hidden p-3 rounded-xl text-sm font-medium
              transition-all duration-300 flex items-center justify-center gap-2 hover:cursor-pointer
              ${taskButtonActive
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 scale-105"
                : "bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/60 hover:border-gray-600/50 hover:scale-105"
              }
            `}
          >
            {/* Button glow effect */}
            <div 
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300
                ${taskButtonActive ? "bg-white" : "bg-blue-400"}
              `}
            />
            
            {/* Animated icon */}
            <Plus 
              className={`
                w-4 h-4 transition-all duration-300 group-hover:scale-110
                ${taskButtonActive ? "rotate-45" : "group-hover:rotate-90"}
              `} 
            />
            
            <span className="relative z-10 transition-all duration-300">
              {taskButtonActive ? "Close Form" : "Add Task"}
            </span>
            
            {/* Subtle sparkle effect for active state */}
            {taskButtonActive && (
              <Sparkles className="w-3 h-3 animate-pulse opacity-60" />
            )}
          </button>

          {/* Elegant separator */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-600 to-transparent opacity-50" />

          {/* Enhanced Add Folder Button */}
          <button
            onClick={() => {
              if (folderButtonActive) {
                setShowAddForm(false);
              } else {
                setAddFormMode("folder");
                setShowAddForm(true);
              }
            }}
            className={`
              group relative overflow-hidden p-3 rounded-xl text-sm font-medium hover:cursor-pointer
              transition-all duration-300 flex items-center justify-center gap-2 min-w-[100px]
              ${folderButtonActive
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25 scale-105"
                : "bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/60 hover:border-gray-600/50 hover:scale-105"
              }
            `}
          >
            {/* Button glow effect */}
            <div 
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300
                ${folderButtonActive ? "bg-white" : "bg-purple-400"}
              `}
            />
            
            {/* Animated icon */}
            <FolderPlus 
              className={`
                w-4 h-4 transition-all duration-300 group-hover:scale-110
                ${folderButtonActive ? "scale-110" : ""}
              `} 
            />
            
            <span className="relative z-10 transition-all duration-300">
              {folderButtonActive ? "Close" : "Folder"}
            </span>
            
            {/* Subtle sparkle effect for active state */}
            {folderButtonActive && (
              <Sparkles className="w-3 h-3 animate-pulse opacity-60" />
            )}
          </button>
        </div>

        {/* Bottom accent glow */}
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-20"
        />
      </div>

      {/* Optional: Status indicator for active forms */}
      {showAddForm && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800/60 rounded-full text-xs text-gray-400">
            <div 
              className={`w-2 h-2 rounded-full animate-pulse ${
                addFormMode === "task" ? "bg-blue-400" : "bg-purple-400"
              }`}
            />
            <span>
              {addFormMode === "task" ? "Adding new task..." : "Creating new folder..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
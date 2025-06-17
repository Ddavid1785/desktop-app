import { useEffect, useState, useRef } from "react";
import { ContextMenuData, Task, TaskFolder } from "../../types";
import TaskComponent from "./Task";
import AddForm from "./AddForm";
import ToDoActionButtons from "./TodoActionButtons";
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from "../../Hooks/KeyboardHook";
import { useToast, ToastContainer } from "../ToastNotification";
import { useDragAndDrop } from "../../Hooks/DragAndDropHook";
import UngroupedTaskList from "./UngroupedTasks";
import FolderList from "./FolderList";
import { useTaskDataManager } from "../../Hooks/useTaskDataManager";

export default function ToDoWidget({
  onContextMenu,
}: {
  onContextMenu: (
    e: React.MouseEvent,
    data: ContextMenuData,
    handlers: any,
    folders: TaskFolder[]
  ) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormMode, setAddFormMode] = useState<"task" | "folder">("task");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { taskData, dataHandlers } = useTaskDataManager();
  const {
    draggedTask,
    dropTarget,
    ghostStyle,
    handleDragStartManual,
    shouldIgnoreClick,
  } = useDragAndDrop(
    taskData,
    dataHandlers.moveTaskToFolder,
    dataHandlers.reorderTask
  );

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    taskData,
    handlers: dataHandlers,
    selectedTaskId,
    selectedFolderId,
    setShowAddForm,
    setAddFormMode,
    onShowToast: showToast,
  });

  useEffect(() => {
    const handleF1 = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };

    window.addEventListener("keydown", handleF1);
    return () => window.removeEventListener("keydown", handleF1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isClickOnContextMenu =
        target.closest("#main-context-menu") ||
        target.closest("#folder-submenu");

      if (
        widgetRef.current &&
        !widgetRef.current.contains(target) &&
        !isClickOnContextMenu
      ) {
        setSelectedTaskId(null);
        setSelectedFolderId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const remainingTasks = taskData.ungrouped.filter((t) => !t.completed).length;

  // Context Menu Helper
  const handleContextMenuWithHandlers = (
    e: React.MouseEvent,
    data: ContextMenuData
  ) => {
    onContextMenu(e, data, dataHandlers, taskData.folders);
  };

  const handleAddTask = async (
    taskInput: Omit<Task, "id">,
    folderId: string
  ) => {
    const newTaskId = crypto.randomUUID();
    dataHandlers.addTask(taskInput, folderId);
    setSelectedTaskId(newTaskId);
    setShowAddForm(false);
  };

  const handleAddFolder = async (folderName: string) => {
    const newFolderId = crypto.randomUUID();
    dataHandlers.addFolder(folderName);
    setSelectedFolderId(newFolderId);
    setShowAddForm(false);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
  };

  const handleTaskClick = (taskId: string, folderId: string) => {
    // Ignore clicks that happen right after a drag operation
    if (shouldIgnoreClick()) {
      return;
    }
    setSelectedTaskId(taskId);
    setSelectedFolderId(folderId);
  };

  const handleContainerClick = (folderId: string) => {
    if (shouldIgnoreClick()) {
      return;
    }
    setSelectedFolderId(folderId);
    setSelectedTaskId(null);
  };

  return (
    <>
      <ToastContainer />

      {draggedTask && (
        <div ref={dragGhostRef} style={ghostStyle}>
          <TaskComponent
            task={draggedTask.task}
            folderId={draggedTask.currentFolderId}
            dropTarget={null}
            index={-1}
            toggleTaskCompletion={() => {}}
            duplicateTask={() => {}}
            deleteTask={() => {}}
            onContextMenu={() => {}}
            isDragging={false}
            onMouseDown={() => {}}
            onClick={() => {}}
            isSelected={false}
          />
        </div>
      )}
      <div className="absolute top-16 left-16 w-1/4" ref={widgetRef}>
        {/* FIXED: Removed drop zone styling from outer container */}
        <div
          className={`
            ungrouped-drop-zone bg-gray-950 border border-gray-800 rounded-lg p-4 shadow-2xl mb-4 
            transition-colors duration-200 outline-2 outline-offset-2
            ${
              selectedFolderId === "" && !selectedTaskId
                ? "outline-blue-500"
                : "outline-transparent"
            }
          `}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleContainerClick("");
            }
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Tasks
            </h2>
            <div className="text-xs text-gray-500">
              {remainingTasks > 0 ? `${remainingTasks} remaining` : "All done"}
            </div>
          </div>

          <UngroupedTaskList
            tasks={taskData.ungrouped}
            handlers={dataHandlers}
            draggedTask={draggedTask}
            dropTarget={dropTarget}
            selectedTaskId={selectedTaskId}
            onContextMenu={handleContextMenuWithHandlers}
            onTaskDragStart={handleDragStartManual}
            onTaskClick={handleTaskClick}
          />

          {/* This action button part remains untouched */}
          <ToDoActionButtons
            setAddFormMode={setAddFormMode}
            setShowAddForm={setShowAddForm}
            addFormMode={addFormMode}
            showAddForm={showAddForm}
          />
        </div>

        <FolderList
          folders={taskData.folders}
          handlers={dataHandlers}
          draggedTask={draggedTask}
          dropTarget={dropTarget}
          selectedTaskId={selectedTaskId}
          selectedFolderId={selectedFolderId}
          onContextMenu={handleContextMenuWithHandlers}
          onTaskDragStart={handleDragStartManual}
          onTaskClick={handleTaskClick}
          onFolderContainerClick={handleContainerClick}
        />

        <AddForm
          showAddForm={showAddForm}
          addFormMode={addFormMode}
          onClose={handleCloseAddForm}
          onAddTask={handleAddTask}
          onAddFolder={handleAddFolder}
          folders={taskData.folders}
        />

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
        )}
      </div>
    </>
  );
}

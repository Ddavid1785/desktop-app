import { useEffect, useState, useRef } from "react";
import { ContextMenuData, Task } from "../../types";
import TaskComponent from "./Task";
import AddForm from "./AddForm";
import ToDoActionButtons from "./TodoActionButtons";
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from "../../Hooks/KeyboardHook";
import { useToast, ToastContainer } from "../ToastNotification";
import { useDragAndDrop } from "../../Hooks/DragAndDropHook";
import FolderList from "./FolderList";
import { useTaskDataManager } from "../../Hooks/useTaskDataManager";
import ToDoContextMenu from "./ToDoContextMenu";

interface ToDoWidgetProps {
  onContextMenu: (
    e: React.MouseEvent, menuContent: React.ReactNode, themeColor?: string
  ) => void;
  handleCloseContextMenu: () => void;
}

export default function ToDoWidget({
  onContextMenu,
  handleCloseContextMenu,
} : ToDoWidgetProps) {
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
    dataHandlers.reorderTask,
    dataHandlers.moveTaskToFolderAndReorder
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

  // Context Menu Helper
  const handleContextMenuWithHandlers = (e: React.MouseEvent, data: ContextMenuData) => {
    e.stopPropagation();

    // The onClose function that we pass down to the menu content.
    // It triggers the main App's global click handler to close the menu.

    // We build the full JSX element here and pass it up to App.
    const menuContent = (
      <ToDoContextMenu
        data={data}
        folders={taskData}
        handlers={dataHandlers}
        onClose={handleCloseContextMenu}
      />
    );

    onContextMenu(e, menuContent, data.colour);
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

  const handleAddFolder = async (folderName: string, folderColor: string) => {
    const newFolderId = crypto.randomUUID();
    dataHandlers.addFolder(folderName, folderColor);
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
            editTask={() => {}}
            isSelected={false}
          />
        </div>
      )}

      {/* OPTION 1: Fixed position at top of widget */}
      <div className="absolute top-16 left-16 w-1/4 flex flex-col" ref={widgetRef}>
        {/* Action buttons at the top */}
        <div className="sticky top-0 z-50 mb-4">
          <ToDoActionButtons
            setAddFormMode={setAddFormMode}
            setShowAddForm={setShowAddForm}
            addFormMode={addFormMode}
            showAddForm={showAddForm}
          />
        </div>

        <AddForm
          showAddForm={showAddForm}
          addFormMode={addFormMode}
          onClose={handleCloseAddForm}
          onAddTask={handleAddTask}
          onAddFolder={handleAddFolder}
          folders={taskData}
          isAddFormOpen={showAddForm}
        />

        {/* Content container with proper spacing */}
        <div className="flex-1 space-y-4 pb-20"> {/* pb-20 to prevent overlap with floating buttons */}
          <FolderList
            folders={taskData}
            handlers={dataHandlers}
            draggedTask={draggedTask}
            dropTarget={dropTarget}
            selectedTaskId={selectedTaskId}
            selectedFolderId={selectedFolderId}
            onContextMenu={handleContextMenuWithHandlers}
            onTaskDragStart={handleDragStartManual}
            onTaskClick={handleTaskClick}
            onFolderContainerClick={handleContainerClick}
            editTask={dataHandlers.editTask}
            editFolder={dataHandlers.editFolder}
          />
        </div>

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
        )}
      </div>
    </>
  );
}
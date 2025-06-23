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
import { useTaskDataManager } from "../../Hooks/useTaskDataManager";
import ToDoContextMenu from "./ToDoContextMenu";
import TaskFolderComponent from "./TaskFolder";

interface ToDoWidgetProps {
  onContextMenu: (
    e: React.MouseEvent,
    menuContent: React.ReactNode,
    themeColor?: string
  ) => void;
  handleCloseContextMenu: () => void;
}

export default function ToDoWidget({
  onContextMenu,
  handleCloseContextMenu,
}: ToDoWidgetProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormMode, setAddFormMode] = useState<"task" | "folder">("task");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [editingState, setEditingState] = useState<{
    type: "task" | "folder" | null;
    id: string | null;
    data: {
      text?: string;
      name?: string;
      colour: string;
    } | null;
  }>({
    type: null,
    id: null,
    data: null,
  });

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
    editingState,
    setEditingState,
    setSelectedTaskId,
    setSelectedFolderId,
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
  const handleContextMenuWithHandlers = (
    e: React.MouseEvent,
    data: ContextMenuData
  ) => {
    e.stopPropagation();

    // --- THIS IS THE NEW PART ---
    // Create a function that knows how to start editing based on the clicked item's data.
    const handleStartEdit = () => {
      if (data.type === "task" && data.taskId) {
        const folder = taskData.find((f) => f.id === data.folderId);
        const task = folder?.tasks.find((t) => t.id === data.taskId);
        if (task) {
          setEditingState({
            type: "task",
            id: task.id,
            data: { text: task.text, colour: task.colour || "#6366f1" },
          });
        }
      } else if (data.type === "folder" && data.folderId) {
        const folder = taskData.find((f) => f.id === data.folderId);
        if (folder) {
          setEditingState({
            type: "folder",
            id: folder.id,
            data: { name: folder.name, colour: folder.colour || "#8b5cf6" },
          });
        }
      }
      // We don't need to call handleCloseContextMenu here, as the menu will do it.
    };

    // We build the full JSX element here and pass it up to App.
    const menuContent = (
      <ToDoContextMenu
        data={data}
        folders={taskData}
        handlers={dataHandlers}
        onClose={handleCloseContextMenu}
        // Pass our newly created handler down to the context menu
        onStartEdit={handleStartEdit}
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
            showColorMenu={false}
            setShowColorMenu={() => {}}
            showCustomPicker={false}
            setShowCustomPicker={() => {}}
            editingState={{ type: null, id: null, data: null }}
            setEditingState={() => {}}
          />
        </div>
      )}

      <div className="absolute top-16 left-16 flex flex-col" ref={widgetRef}>
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

        <div className="flex-1 space-y-4 pb-20">
          {taskData.map((folder) => (
            <TaskFolderComponent
              key={folder.id}
              folder={folder}
              toggleFolderVisibility={dataHandlers.toggleFolderVisibility}
              toggleTaskCompletion={dataHandlers.toggleTaskCompletion}
              deleteTask={dataHandlers.deleteTask}
              duplicateTask={dataHandlers.duplicateTask}
              deleteFolder={dataHandlers.deleteFolder}
              onContextMenu={handleContextMenuWithHandlers}
              onTaskDragStart={handleDragStartManual}
              onTaskClick={handleTaskClick}
              onContainerClick={handleContainerClick}
              dropTarget={dropTarget}
              draggedTask={draggedTask}
              selectedTaskId={selectedTaskId}
              selectedFolderId={selectedFolderId}
              editTask={dataHandlers.editTask}
              editFolder={dataHandlers.editFolder}
              resizeFolder={dataHandlers.resizeFolder}
              showColorMenu={showColorMenu}
              setShowColorMenu={setShowColorMenu}
              showCustomPicker={showCustomPicker}
              setShowCustomPicker={setShowCustomPicker}
              editingState={editingState}
              setEditingState={setEditingState}
            />
          ))}
        </div>

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
        )}
      </div>
    </>
  );
}

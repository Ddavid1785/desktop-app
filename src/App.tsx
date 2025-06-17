import { useState } from "react";
import "./App.css";
import ToDoWidget from "./Components/ToDoComponents/TodoWidget";
import ContextMenu from "./Components/ContextMenu";
import { ContextMenuData } from "./types";

export default function App() {
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: ContextMenuData | null;
    handlers: any;
    folders: any[]; // Add folders to context menu state
  }>({
    show: false,
    x: 0,
    y: 0,
    data: null,
    handlers: {},
    folders: [],
  });

  const handleContextMenu = (
    e: React.MouseEvent,
    data: ContextMenuData,
    handlers: any,
    folders: any[] = [] // Add folders parameter
  ) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      data,
      handlers,
      folders,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <ToDoWidget onContextMenu={handleContextMenu} />
      <div className="p-6 pt-20">
        <div className="text-center text-gray-600 mt-20">
          <p className="text-lg"></p>
          <p className="text-sm mt-2"></p>
        </div>
      </div>

      {/* Global Context Menu */}
      <ContextMenu
        show={contextMenu.show}
        x={contextMenu.x}
        y={contextMenu.y}
        data={contextMenu.data}
        onClose={handleCloseContextMenu}
        handlers={contextMenu.handlers}
        folders={contextMenu.folders}
      />
    </div>
  );
}

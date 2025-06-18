import { useState } from "react";
import "./App.css";
import ToDoWidget from "./Components/ToDoComponents/TodoWidget";
import ContextMenu from "./Components/ContextMenu";

export default function App() {
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    content: React.ReactNode | null; // It will hold the JSX for the menu's content
    themeColor?: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    content: null,
    themeColor: undefined,
  });

  const handleContextMenu = (
    e: React.MouseEvent,
    menuContent: React.ReactNode,
    themeColor?: string
  ) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      content: menuContent,
      themeColor: themeColor,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  return (
    <div className="min-h-screen bg-black text-white relative" onClick={handleCloseContextMenu}>
      <ToDoWidget onContextMenu={handleContextMenu} handleCloseContextMenu={handleCloseContextMenu} />
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
        onClose={handleCloseContextMenu}
        children={contextMenu.content}
      />
    </div>
  );
}

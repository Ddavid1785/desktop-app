import { useRef, useEffect } from "react";

interface ContextMenuProps {
  show: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
  themeColor?: string;
}

export default function ContextMenu({
  show,
  x,
  y,
  onClose,
  children,
  themeColor,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const PORTAL_ZINDEX = 999999999;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (show) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [show, onClose]);

  if (!show) return null;

  const handleClickInside = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Ensure the menu doesn't go off-screen
  const adjustedX = Math.min(x, window.innerWidth - 220); // Account for menu width
  const adjustedY = Math.min(y, window.innerHeight - 300); // Account for menu height

  return (
    <div
      ref={menuRef}
      className="fixed animate-in fade-in-0 zoom-in-95 duration-200"
      style={{ left: adjustedX, top: adjustedY, zIndex: PORTAL_ZINDEX }}
      onClick={handleClickInside}
    >
      <div
        className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden relative"
        style={{
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px ${
            themeColor || "#4b5563"
          }40`,
        }}
      >
        {/* Subtle accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
          style={{ backgroundColor: themeColor || "#4b5563" }}
        />

        {/* Menu content */}
        <div className="relative">{children}</div>

        {/* Subtle bottom accent */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gray-600/30 to-transparent" />
      </div>
    </div>
  );
}

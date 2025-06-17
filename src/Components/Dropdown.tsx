import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  id: string;
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  textColor?: string;
  onClick: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  placeholder?: string;
  className?: string;
}

export default function Dropdown({
  items,
  placeholder = "Select an option",
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <span className="truncate">{placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No options available
            </div>
          ) : (
            items.map((item) => {
              const IconComponent = item.icon;
              const textColorClass = item.textColor || "text-gray-200";

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-800 transition-colors text-left first:rounded-t-lg last:rounded-b-lg"
                >
                  {IconComponent && (
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className={`truncate ${textColorClass}`}>
                    {item.text}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

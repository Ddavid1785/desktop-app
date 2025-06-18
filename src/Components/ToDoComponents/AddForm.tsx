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

// Simple Color Picker Component
interface CustomColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

function CustomColorPicker({ color, onChange, onClose }: CustomColorPickerProps) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [value, setValue] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert hex to HSV
  const hexToHsv = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;

    if (diff !== 0) {
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
  };

  // Convert HSV to hex
  const hsvToHex = (h: number, s: number, v: number) => {
    h /= 360;
    s /= 100;
    v /= 100;

    const c = v * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h < 1/6) { r = c; g = x; b = 0; }
    else if (h < 2/6) { r = x; g = c; b = 0; }
    else if (h < 3/6) { r = 0; g = c; b = x; }
    else if (h < 4/6) { r = 0; g = x; b = c; }
    else if (h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  // Initialize HSV values from current color
  useEffect(() => {
    const [h, s, v] = hexToHsv(color);
    setHue(h);
    setSaturation(s);
    setValue(v);
  }, [color]);

  // Draw the color area
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create the saturation/value gradient
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = (x / width) * 100;
        const v = ((height - y) / height) * 100;
        const hex = hsvToHex(hue, s, v);
        const rgb = hexToRgb(hex);
        
        const index = (y * width + x) * 4;
        data[index] = rgb.r;
        data[index + 1] = rgb.g;
        data[index + 2] = rgb.b;
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [hue]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newS = (x / rect.width) * 100;
    const newV = ((rect.height - y) / rect.height) * 100;

    setSaturation(Math.max(0, Math.min(100, newS)));
    setValue(Math.max(0, Math.min(100, newV)));

    const newColor = hsvToHex(hue, newS, newV);
    onChange(newColor);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleCanvasClick(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleCanvasClick(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = Number(e.target.value);
    setHue(newHue);
    const newColor = hsvToHex(newHue, saturation, value);
    onChange(newColor);
  };

  const currentColor = hsvToHex(hue, saturation, value);
  const currentRgb = hexToRgb(currentColor);

  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-md shadow-lg w-64">
      <div className="space-y-3">
        {/* Color Area */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={200}
            height={150}
            className="w-full h-32 border border-gray-700 rounded cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          {/* Crosshair */}
          <div
            className="absolute w-3 h-3 border-2 border-white rounded-full pointer-events-none"
            style={{
              left: `${(saturation / 100) * 100}%`,
              top: `${(1 - value / 100) * 100}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
            }}
          />
        </div>

        {/* Hue Bar */}
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={handleHueChange}
          className="w-full h-4 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), 
              hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), 
              hsl(360, 100%, 50%))`
          }}
        />

        {/* RGB Values */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>R: {currentRgb.r}</span>
          <span>G: {currentRgb.g}</span>
          <span>B: {currentRgb.b}</span>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedFolderId, setSelectedFolderId] = useState(folders.length > 0 ? folders[0].id : "");
  const [folderColor, setFolderColor] = useState("#111827");
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);

  // Update selectedFolderId when folders change
  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setShowColorMenu(false);
        setShowCustomPicker(false);
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
    setShowCustomPicker(false);
    onClose();
  };

  const handleColorButtonClick = () => {
    setShowColorMenu(!showColorMenu);
    setShowCustomPicker(false);
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
                {showColorMenu && !showCustomPicker && (
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
                      
                      {/* Custom Color Picker Button */}
                      <button
                        onClick={() => {
                          setShowCustomPicker(true);
                          setShowColorMenu(false);
                        }}
                        className="w-8 h-8 rounded border-2 border-gray-700 flex items-center justify-center transition-all hover:ring-2 hover:ring-white/50"
                        title="Custom color"
                      >
                        <Palette className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
                {showCustomPicker && (
                  <div className="absolute right-0 mt-2 z-20">
                    <CustomColorPicker
                      color={addingTask.colour}
                      onChange={(color) => setAddingTask(prev => ({ ...prev, colour: color }))}
                      onClose={() => setShowCustomPicker(false)}
                    />
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
                className="w-8 h-8 rounded-md hover:cursor-pointer border-2 border-gray-700 hover:border-gray-600 transition-colors"
                style={{ backgroundColor: folderColor }}
                title="Choose color"
              />
              
              {showColorMenu && !showCustomPicker && (
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
                        className={`w-8 h-8 rounded border-2 transition-all hover:cursor-pointer ${
                          folderColor === color.value
                            ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                            : "hover:ring-2 hover:ring-white/50"
                        }`}
                        title={color.name}
                      />
                    ))}
                    
                    {/* Custom Color Picker Button */}
                    <button
                      onClick={() => {
                        setShowCustomPicker(true);
                        setShowColorMenu(false);
                      }}
                      className="w-8 h-8 rounded border-2 border-gray-700 flex items-center justify-center transition-all hover:ring-2 hover:ring-white/50"
                      title="Custom color"
                    >
                      <Palette className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
              {showCustomPicker && (
                <div className="absolute right-0 mt-2 z-20">
                  <CustomColorPicker
                    color={folderColor}
                    onChange={setFolderColor}
                    onClose={() => setShowCustomPicker(false)}
                  />
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
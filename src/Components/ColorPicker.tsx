import { Wand2Icon, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface CustomColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    onClose: () => void;
  }
  
 export default function CustomColorPicker({ color, onChange, onClose }: CustomColorPickerProps) {
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [value, setValue] = useState(100);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
  
    // Convert hex to HSV
    const hexToHsv = useCallback((hex: string) => {
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
    }, []);
  
    // Convert HSV to hex
    const hsvToHex = useCallback((h: number, s: number, v: number) => {
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
    }, []);
  
    // Convert hex to RGB
    const hexToRgb = useCallback((hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    }, []);
  
    // Initialize HSV values from current color only once
    useEffect(() => {
      if (!isInitialized) {
        const [h, s, v] = hexToHsv(color);
        setHue(h);
        setSaturation(s);
        setValue(v);
        setIsInitialized(true);
      }
    }, [color, hexToHsv, isInitialized]);
  
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
    }, [hue, hsvToHex, hexToRgb]);
  
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      const newS = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newV = Math.max(0, Math.min(100, ((rect.height - y) / rect.height) * 100));
  
      setSaturation(newS);
      setValue(newV);
  
      const newColor = hsvToHex(hue, newS, newV);
      onChange(newColor);
    }, [hue, hsvToHex, onChange]);
  
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
      <div 
        className="relative bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-4 w-72 overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-5 animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)'
          }}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Wand2Icon className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Custom Color</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
  
        <div className="space-y-4 relative z-10">
          {/* Color Area */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={200}
              height={120}
              className="w-full h-28 border border-gray-700/50 rounded-lg cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {/* Enhanced Crosshair */}
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-lg"
              style={{
                left: `${(saturation / 100) * 100}%`,
                top: `${(1 - value / 100) * 100}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 0 12px rgba(255,255,255,0.3)'
              }}
            >
              <div className="absolute inset-1 bg-white rounded-full opacity-60" />
            </div>
          </div>
  
          {/* Fixed Hue Bar with proper styling */}
          <div className="relative">
            <div 
              className="w-full h-4 rounded-lg border border-gray-700/50"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), 
                  hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), 
                  hsl(360, 100%, 50%))`
              }}
            />
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={handleHueChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Custom thumb indicator */}
            <div
              className="absolute top-1/2 w-6 h-6 bg-white border-2 border-gray-800 rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.2)'
              }}
            >
              <div 
                className="absolute inset-1 rounded-full"
                style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
              />
            </div>
          </div>
  
          {/* Color Preview & RGB Values */}
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
            <div 
              className="w-10 h-10 rounded-lg border-2 border-gray-600/50 shadow-lg flex-shrink-0"
              style={{ 
                backgroundColor: currentColor,
                boxShadow: `0 4px 12px ${currentColor}40`
              }}
            />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-300 font-mono">
                <span>R: {currentRgb.r}</span>
                <span>G: {currentRgb.g}</span>
                <span>B: {currentRgb.b}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 font-mono">
                {currentColor.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
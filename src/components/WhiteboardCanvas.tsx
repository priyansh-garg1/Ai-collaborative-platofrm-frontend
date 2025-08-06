import React, { useEffect, useRef, useState, useReducer } from 'react';
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  ArrowUpRight,
  Type,
  Palette,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Layers,
  Trash2,
  Move
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// --- TYPES AND CONSTANTS ---

type Tool = 'select' | 'pan' | 'freehand' | 'rect' | 'circle' | 'arrow' | 'text' | 'eraser';

const TOOLS = {
  SELECT: 'select' as Tool,
  PAN: 'pan' as Tool,
  FREEHAND: 'freehand' as Tool,
  RECT: 'rect' as Tool,
  CIRCLE: 'circle' as Tool,
  ARROW: 'arrow' as Tool,
  TEXT: 'text' as Tool,
  ERASER: 'eraser' as Tool,
};

const COLORS = ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00'];
const STROKES = [2, 4, 6, 8];
const ERASER_STROKES = [8, 12, 20, 32];
const FONT_SIZES = [16, 24, 32, 48];

interface Point {
  x: number;
  y: number;
}

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WhiteboardElement {
  id: string;
  type: Tool;
  points: Point[];
  color: string;
  strokeWidth: number;
  fontSize?: number;
  text?: string;
  bbox?: BBox;
}

interface WhiteboardState {
  elements: WhiteboardElement[];
  selectedElementIds: string[];
  history: WhiteboardElement[][];
  historyIndex: number;
  zoom: number;
  pan: Point;
}

type WhiteboardAction =
  | { type: 'ADD_ELEMENT'; element: WhiteboardElement }
  | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<WhiteboardElement> }
  | { type: 'DELETE_ELEMENTS'; ids: string[] }
  | { type: 'SELECT_ELEMENTS'; ids: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; pan: Point }
  | { type: 'LOAD_STATE'; state: WhiteboardElement[] };

interface WhiteboardCanvasProps {
  roomId: string;
  socket?: Socket;
  className?: string;
}

const whiteboardReducer = (state: WhiteboardState, action: WhiteboardAction): WhiteboardState => {
  switch (action.type) {
    case 'ADD_ELEMENT':
      const newElements = [...state.elements, action.element];
      return {
        ...state,
        elements: newElements,
        history: [...state.history.slice(0, state.historyIndex + 1), newElements],
        historyIndex: state.historyIndex + 1,
      };
    
    case 'UPDATE_ELEMENT':
      const updatedElements = state.elements.map(el =>
        el.id === action.id ? { ...el, ...action.updates } : el
      );
      return {
        ...state,
        elements: updatedElements,
      };
    
    case 'DELETE_ELEMENTS':
      const filteredElements = state.elements.filter(el => !action.ids.includes(el.id));
      return {
        ...state,
        elements: filteredElements,
        selectedElementIds: [],
        history: [...state.history.slice(0, state.historyIndex + 1), filteredElements],
        historyIndex: state.historyIndex + 1,
      };
    
    case 'SELECT_ELEMENTS':
      return {
        ...state,
        selectedElementIds: action.ids,
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedElementIds: [],
      };
    
    case 'UNDO':
      if (state.historyIndex > 0) {
        return {
          ...state,
          elements: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
          selectedElementIds: [],
        };
      }
      return state;
    
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state,
          elements: state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
          selectedElementIds: [],
        };
      }
      return state;
    
    case 'CLEAR_ALL':
      const emptyElements: WhiteboardElement[] = [];
      return {
        ...state,
        elements: emptyElements,
        selectedElementIds: [],
        history: [...state.history.slice(0, state.historyIndex + 1), emptyElements],
        historyIndex: state.historyIndex + 1,
      };
    
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: Math.max(0.1, Math.min(5, action.zoom)),
      };
    
    case 'SET_PAN':
      return {
        ...state,
        pan: action.pan,
      };
    
    case 'LOAD_STATE':
      return {
        ...state,
        elements: action.state,
      };
    
    default:
      return state;
  }
};

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ roomId, socket, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, dispatch] = useReducer(whiteboardReducer, {
    elements: [],
    selectedElementIds: [],
    history: [[]],
    historyIndex: 0,
    zoom: 1,
    pan: { x: 0, y: 0 },
  });

  const [currentTool, setCurrentTool] = useState<Tool>(TOOLS.FREEHAND);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentStroke, setCurrentStroke] = useState(STROKES[1]);
  const [currentFontSize, setCurrentFontSize] = useState(FONT_SIZES[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-board', roomId);

    socket.on('whiteboard-update', (data: WhiteboardElement[]) => {
      dispatch({ type: 'LOAD_STATE', state: data });
    });

    return () => {
      socket.off('whiteboard-update');
    };
  }, [socket, roomId]);

  // Emit changes to other users
  const emitWhiteboardUpdate = () => {
    if (socket) {
      socket.emit('whiteboard-update', { boardId: roomId, data: state.elements });
    }
  };

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(state.pan.x, state.pan.y);

    // Draw all elements
    state.elements.forEach(element => {
      drawElement(ctx, element);
    });

    // Draw current element being created
    if (currentElement) {
      drawElement(ctx, currentElement);
    }

    // Draw text input preview
    if (textInput) {
      ctx.font = `${currentFontSize}px Arial`;
      ctx.fillStyle = currentColor;
      ctx.fillText(textInput.value, textInput.x, textInput.y);
    }

    ctx.restore();
  }, [state.elements, state.zoom, state.pan, currentElement, textInput, currentFontSize, currentColor]);

  const drawElement = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'freehand':
        if (element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'rect':
        if (element.points.length === 2) {
          const [start, end] = element.points;
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        }
        break;

      case 'circle':
        if (element.points.length === 2) {
          const [start, end] = element.points;
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (element.points.length === 2) {
          const [start, end] = element.points;
          drawArrow(ctx, start, end);
        }
        break;

      case 'text':
        if (element.points.length > 0 && element.text) {
          ctx.font = `${element.fontSize || 16}px Arial`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.points[0].x, element.points[0].y);
        }
        break;
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    const headLength = 10;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - state.pan.x * state.zoom) / state.zoom,
      y: (e.clientY - rect.top - state.pan.y * state.zoom) / state.zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getMousePos(e);

    // Eraser: remove element under cursor
    if (currentTool === 'eraser') {
      const hitElement = state.elements.findLast(el => {
        if (el.type === 'freehand') {
          return el.points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 10);
        } else if (el.points.length > 0) {
          // Simple bbox hit test
          const minX = Math.min(...el.points.map(p => p.x));
          const maxX = Math.max(...el.points.map(p => p.x));
          const minY = Math.min(...el.points.map(p => p.y));
          const maxY = Math.max(...el.points.map(p => p.y));
          return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
        }
        return false;
      });
      if (hitElement) {
        dispatch({ type: 'DELETE_ELEMENTS', ids: [hitElement.id] });
        setTimeout(() => emitWhiteboardUpdate(), 0);
      }
      return;
    }

    // Text: place text input
    if (currentTool === 'text') {
      setTextInput({ x: point.x, y: point.y, value: '' });
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);

    if (currentTool === 'freehand') {
      const newElement: WhiteboardElement = {
        id: Date.now().toString(),
        type: currentTool,
        points: [point],
        color: currentColor,
        strokeWidth: currentStroke,
      };
      setCurrentElement(newElement);
    } else if (['rect', 'circle', 'arrow'].includes(currentTool)) {
      const newElement: WhiteboardElement = {
        id: Date.now().toString(),
        type: currentTool,
        points: [point],
        color: currentColor,
        strokeWidth: currentStroke,
      };
      setCurrentElement(newElement);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;

    const point = getMousePos(e);

    if (currentTool === 'freehand') {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, point],
      });
    } else if (['rect', 'circle', 'arrow'].includes(currentTool)) {
      setCurrentElement({
        ...currentElement,
        points: [currentElement.points[0], point],
      });
    }
  };

  const handleMouseUp = () => {
    if (currentElement) {
      dispatch({ type: 'ADD_ELEMENT', element: currentElement });
      setCurrentElement(null);
      // Emit update after state is actually updated (next tick)
      setTimeout(() => emitWhiteboardUpdate(), 0);
    }
    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
    emitWhiteboardUpdate();
  };

  const handleRedo = () => {
    dispatch({ type: 'REDO' });
    emitWhiteboardUpdate();
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_ALL' });
    emitWhiteboardUpdate();
  };

  const handleZoomIn = () => {
    dispatch({ type: 'SET_ZOOM', zoom: state.zoom * 1.2 });
  };

  const handleZoomOut = () => {
    dispatch({ type: 'SET_ZOOM', zoom: state.zoom / 1.2 });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          {Object.entries(TOOLS).map(([key, tool]) => {
            const icons = {
              select: MousePointer2,
              pan: Move,
              freehand: Pencil,
              rect: Square,
              circle: Circle,
              arrow: ArrowUpRight,
              text: Type,
              eraser: Eraser,
            };
            const Icon = icons[tool];
            return (
              <button
                key={key}
                onClick={() => setCurrentTool(tool)}
                className={`p-2 rounded hover:bg-gray-100 ${
                  currentTool === tool ? 'bg-blue-100 text-blue-600' : ''
                }`}
                title={tool}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-8 h-8 rounded border-2 ${
                currentColor === color ? 'border-gray-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          {STROKES.map(stroke => (
            <button
              key={stroke}
              onClick={() => setCurrentStroke(stroke)}
              className={`p-2 rounded hover:bg-gray-100 ${
                currentStroke === stroke ? 'bg-blue-100' : ''
              }`}
            >
              <div
                className="bg-gray-800 rounded-full"
                style={{ width: stroke * 2, height: stroke * 2 }}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            className="p-2 rounded hover:bg-gray-100"
            disabled={state.historyIndex <= 0}
          >
            <Undo size={20} />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 rounded hover:bg-gray-100"
            disabled={state.historyIndex >= state.history.length - 1}
          >
            <Redo size={20} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded hover:bg-gray-100 text-red-600"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {textInput && (
          <input
            type="text"
            autoFocus
            value={textInput.value}
            onChange={e => setTextInput({ ...textInput, value: e.target.value })}
            onBlur={() => {
              if (textInput.value.trim()) {
                dispatch({
                  type: 'ADD_ELEMENT',
                  element: {
                    id: Date.now().toString(),
                    type: 'text',
                    points: [{ x: textInput.x, y: textInput.y }],
                    color: currentColor,
                    strokeWidth: 1,
                    fontSize: currentFontSize,
                    text: textInput.value,
                  },
                });
                setTimeout(() => emitWhiteboardUpdate(), 0);
              }
              setTextInput(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            style={{
              position: 'absolute',
              left: textInput.x * state.zoom + state.pan.x,
              top: textInput.y * state.zoom + state.pan.y,
              fontSize: currentFontSize,
              color: currentColor,
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid #ccc',
              padding: '2px 4px',
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WhiteboardCanvas;

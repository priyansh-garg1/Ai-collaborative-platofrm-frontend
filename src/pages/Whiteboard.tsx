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

interface BaseShape {
  id: string;
  type: Tool;
  color: string;
  stroke: number;
  fontSize: number;
  bbox?: BBox;
}

interface FreehandShape extends BaseShape {
  type: 'freehand' | 'eraser';
  points: Point[];
}

interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ArrowShape extends BaseShape {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface TextShape extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

type Shape = FreehandShape | RectShape | CircleShape | ArrowShape | TextShape;

interface AppState {
  shapes: Shape[];
  history: Shape[][];
  historyIndex: number;
}

type AppAction =
  | { type: 'ADD_SHAPE'; payload: Shape }
  | { type: 'UPDATE_SHAPES'; payload: Shape[] }
  | { type: 'SET_SHAPES_NO_HISTORY'; payload: Shape[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

const initialState: AppState = {
  shapes: [],
  history: [[]],
  historyIndex: 0,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_SHAPE': {
      const newShapes = [...state.shapes, action.payload];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newShapes);
      return { ...state, shapes: newShapes, history: newHistory, historyIndex: newHistory.length - 1 };
    }
    case 'UPDATE_SHAPES': {
      const newShapes = action.payload;
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newShapes);
      return { ...state, shapes: newShapes, history: newHistory, historyIndex: newHistory.length - 1 };
    }
    case 'SET_SHAPES_NO_HISTORY': {
        return { ...state, shapes: action.payload };
    }
    case 'UNDO': {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return { ...state, shapes: state.history[newIndex], historyIndex: newIndex };
      }
      return state;
    }
    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return { ...state, shapes: state.history[newIndex], historyIndex: newIndex };
      }
      return state;
    }
    case 'CLEAR': {
        return { ...state, shapes: [], history: [[]], historyIndex: 0 };
    }
    default:
      return state;
  }
}

interface ViewState {
    x: number;
    y: number;
    zoom: number;
}

const getPointerWorldPos = (e: React.PointerEvent<HTMLCanvasElement>, view: ViewState): Point => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - view.x) / view.zoom,
        y: (e.clientY - rect.top - view.y) / view.zoom,
    };
};

const isPointInShape = (px: number, py: number, shape: Shape): boolean => {
    if (!shape.bbox) return false;
    const { x, y, width, height } = shape.bbox;
    return px >= x && px <= x + width && py >= y && py <= y + height;
}

const updateBoundingBox = (shape: Shape, ctx: CanvasRenderingContext2D): Shape => {
    switch (shape.type) {
        case 'freehand':
        case 'eraser': {
            if (shape.points.length === 0) { shape.bbox = { x: 0, y: 0, width: 0, height: 0 }; break; }
            const minX = Math.min(...shape.points.map(p => p.x));
            const minY = Math.min(...shape.points.map(p => p.y));
            const maxX = Math.max(...shape.points.map(p => p.x));
            const maxY = Math.max(...shape.points.map(p => p.y));
            shape.bbox = { x: minX - shape.stroke / 2, y: minY - shape.stroke / 2, width: (maxX - minX) + shape.stroke, height: (maxY - minY) + shape.stroke };
            break;
        }
        case 'rect': case 'circle': {
            shape.bbox = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
            break;
        }
        case 'arrow': {
            shape.bbox = { x: Math.min(shape.x1, shape.x2), y: Math.min(shape.y1, shape.y2), width: Math.abs(shape.x1 - shape.x2), height: Math.abs(shape.y1 - shape.y2) };
            break;
        }
        case 'text': {
            ctx.font = `${shape.fontSize}px sans-serif`;
            const metrics = ctx.measureText(shape.text);
            shape.bbox = { x: shape.x, y: shape.y - metrics.actualBoundingBoxAscent, width: metrics.width, height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent };
            break;
        }
    }
    return shape;
}

const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.stroke;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape.type) {
        case 'freehand':
        case 'eraser':
            if (shape.points.length < 1) return;
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            shape.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
            break;
        case 'rect':
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            break;
        case 'circle':
            ctx.beginPath();
            ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, Math.abs(shape.width / 2), Math.abs(shape.height / 2), 0, 0, 2 * Math.PI);
            ctx.stroke();
            break;
        case 'arrow':
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
            const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
            ctx.translate(shape.x2, shape.y2);
            ctx.rotate(angle);
            ctx.moveTo(0, 0);
            ctx.lineTo(-12, -6);
            ctx.moveTo(0, 0);
            ctx.lineTo(-12, 6);
            ctx.stroke();
            ctx.restore();
            break;
        case 'text':
            ctx.fillStyle = shape.color;
            ctx.font = `${shape.fontSize}px sans-serif`;
            ctx.fillText(shape.text, shape.x, shape.y);
            break;
    }
};

const drawSelectionBox = (ctx: CanvasRenderingContext2D, shape: Shape, view: ViewState) => {
    if (!shape.bbox) return;
    const { x, y, width, height } = shape.bbox;
    const padding = 5;
    ctx.save();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 1 / view.zoom;
    ctx.setLineDash([4 / view.zoom, 4 / view.zoom]);
    ctx.strokeRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
    ctx.restore();
};

const Whiteboard = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { shapes } = state;

    const [tool, setTool] = useState<Tool>(TOOLS.SELECT);
    const [color, setColor] = useState<string>(COLORS[0]);
    const [stroke, setStroke] = useState<number>(STROKES[1]);
    const [eraserStroke, setEraserStroke] = useState<number>(ERASER_STROKES[1]);
    const [fontSize, setFontSize] = useState<number>(FONT_SIZES[1]);

    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [action, setAction] = useState<'none' | 'drawing' | 'panning' | 'dragging'>('none'); 
    const [editingShapeIndex, setEditingShapeIndex] = useState<number | null>(null);

    const [view, setView] = useState<ViewState>({ x: 0, y: 0, zoom: 1 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(view.x, view.y);
        ctx.scale(view.zoom, view.zoom);

        // First pass: draw all regular shapes
        shapes.forEach((shape, index) => {
            if (shape.type !== 'eraser' && index !== editingShapeIndex) {
                 drawShape(ctx, shape);
            }
        });
        
        // Second pass: draw all eraser paths to "cut out" from the drawn shapes
        ctx.globalCompositeOperation = 'destination-out';
        shapes.forEach((shape) => {
            if (shape.type === 'eraser') {
                drawShape(ctx, shape);
            }
        });
        
        // Reset composite operation for subsequent draws (like selection boxes)
        ctx.globalCompositeOperation = 'source-over';

        // Draw selection boxes on top
        if (tool === TOOLS.SELECT) {
            shapes.forEach((shape, index) => {
                if (selectedIndices.includes(index)) {
                    drawSelectionBox(ctx, shape, view);
                }
            });
        }

        ctx.restore();
    }, [shapes, view, selectedIndices, tool, editingShapeIndex]);

    const finishEditingText = () => {
        if (editingShapeIndex === null) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const currentShapes = [...shapes];
        const shape = currentShapes[editingShapeIndex];
        if (shape.type === 'text' && shape.text.trim() === '') {
            const filteredShapes = currentShapes.filter((_, index) => index !== editingShapeIndex);
            dispatch({ type: 'UPDATE_SHAPES', payload: filteredShapes });
        } else {
            updateBoundingBox(shape, ctx);
            dispatch({ type: 'UPDATE_SHAPES', payload: currentShapes });
        }
        setEditingShapeIndex(null);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (editingShapeIndex !== null) {
            finishEditingText();
            return;
        }
        const pos = getPointerWorldPos(e, view);
        setStartPoint(pos);

        if (tool === TOOLS.PAN || e.button === 1) {
            setAction('panning');
            return;
        }

        if (tool === TOOLS.SELECT) {
            let found = false;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (isPointInShape(pos.x, pos.y, shapes[i])) {
                    setSelectedIndices([i]);
                    setAction('dragging');
                    found = true;
                    break;
                }
            }
            if (!found) setSelectedIndices([]);
            return;
        }
        
        if (tool === TOOLS.TEXT) {
            const newShape: TextShape = { id: Date.now().toString(), type: 'text', color, fontSize, x: pos.x, y: pos.y, text: "", stroke: 0 };
            updateBoundingBox(newShape, canvasRef.current!.getContext('2d')!);
            dispatch({ type: 'ADD_SHAPE', payload: newShape });
            setIsDrawing(false);
            setEditingShapeIndex(shapes.length);
            return;
        }

        setAction('drawing');
        setIsDrawing(true);

        const id = Date.now().toString();
        let newShape: Shape;
        switch (tool) {
            case TOOLS.FREEHAND:
                newShape = { id, type: 'freehand', color, stroke, fontSize, points: [pos] };
                break;
            case TOOLS.ERASER:
                newShape = { id, type: 'eraser', color: '#fff', stroke: eraserStroke, fontSize, points: [pos] };
                break;
            case TOOLS.RECT:
                newShape = { id, type: 'rect', color, stroke, fontSize, x: pos.x, y: pos.y, width: 0, height: 0 };
                break;
            case TOOLS.CIRCLE:
                newShape = { id, type: 'circle', color, stroke, fontSize, x: pos.x, y: pos.y, width: 0, height: 0 };
                break;
            case TOOLS.ARROW:
                newShape = { id, type: 'arrow', color, stroke, fontSize, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
                break;
            default: return;
        }
        updateBoundingBox(newShape, canvasRef.current!.getContext('2d')!);
        dispatch({ type: 'ADD_SHAPE', payload: newShape });
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!startPoint) return;
        const pos = getPointerWorldPos(e, view);

        if (action === 'panning') {
            setView(prev => ({ ...prev, x: prev.x + e.movementX, y: prev.y + e.movementY }));
            return;
        }
        
        const currentShapes = [...shapes];
        if (action === 'dragging' && selectedIndices.length > 0) {
            const dx = pos.x - startPoint.x;
            const dy = pos.y - startPoint.y;
            selectedIndices.forEach(index => {
                const shape = currentShapes[index];
                if (shape.type === 'freehand' || shape.type === 'eraser') {
                    shape.points = shape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                } else if (shape.type === 'arrow') {
                    shape.x1 += dx; shape.y1 += dy; shape.x2 += dx; shape.y2 += dy;
                } else {
                    shape.x += dx; shape.y += dy;
                }
                updateBoundingBox(shape, canvasRef.current!.getContext('2d')!);
            });
            dispatch({ type: 'SET_SHAPES_NO_HISTORY', payload: currentShapes });
            setStartPoint(pos);
            return;
        }

        if (!isDrawing) return;
        const lastShape = currentShapes[currentShapes.length - 1];
        if (!lastShape) return;

        // In handlePointerMove, for eraser, remove intersecting shapes
        if (action === 'drawing' && tool === TOOLS.ERASER) {
            const currentShapes = [...shapes];
            const lastShape = currentShapes[currentShapes.length - 1];
            if (!lastShape || lastShape.type !== 'eraser') return;
            lastShape.points.push(pos);
            // Remove any shape that intersects with eraser path
            const ctx = canvasRef.current!.getContext('2d')!;
            const eraserBBox = { x: pos.x - eraserStroke, y: pos.y - eraserStroke, width: eraserStroke * 2, height: eraserStroke * 2 };
            const filtered = currentShapes.filter((shape, idx) => {
                if (idx === currentShapes.length - 1) return true;
                if (!shape.bbox) return true;
                // Check bbox intersection
                const a = eraserBBox, b = shape.bbox;
                const intersect = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
                if (intersect && shape.type !== 'eraser' && shape.type !== 'freehand') return false;
                return true;
            });
            dispatch({ type: 'SET_SHAPES_NO_HISTORY', payload: filtered });
            return;
        }

        switch (lastShape.type) {
            case 'freehand': case 'eraser':
                lastShape.points.push(pos);
                break;
            case 'rect': case 'circle':
                lastShape.width = pos.x - lastShape.x;
                lastShape.height = pos.y - lastShape.y;
                break;
            case 'arrow':
                lastShape.x2 = pos.x; lastShape.y2 = pos.y;
                break;
        }
        updateBoundingBox(lastShape, canvasRef.current!.getContext('2d')!);
        dispatch({ type: 'SET_SHAPES_NO_HISTORY', payload: currentShapes });
    };

    const handlePointerUp = () => {
        if (action === 'drawing') {
            const currentShapes = [...shapes];
            const lastShape = currentShapes[currentShapes.length - 1];
            if (lastShape) {
                if (lastShape.type === 'rect' || lastShape.type === 'circle') {
                    if (lastShape.width < 0) { lastShape.x += lastShape.width; lastShape.width *= -1; }
                    if (lastShape.height < 0) { lastShape.y += lastShape.height; lastShape.height *= -1; }
                }
                updateBoundingBox(lastShape, canvasRef.current!.getContext('2d')!);
                dispatch({ type: 'UPDATE_SHAPES', payload: currentShapes });
            }
        }
        setIsDrawing(false);
        setAction('none');
        setStartPoint(null);
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (editingShapeIndex !== null) return;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        const newViewX = pointerX - (pointerX - view.x) * zoomFactor;
        const newViewY = pointerY - (pointerY - view.y) * zoomFactor;
        setView({ x: newViewX, y: newViewY, zoom: Math.max(0.1, Math.min(view.zoom * zoomFactor, 10)) });
    };

    const handleDoubleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const pos = getPointerWorldPos(e, view);
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            if (shape.type === 'text' && isPointInShape(pos.x, pos.y, shape)) {
                setTool(TOOLS.SELECT);
                setEditingShapeIndex(i);
                setSelectedIndices([i]);
                return;
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIndices.length > 0 && editingShapeIndex === null) {
                    const newShapes = shapes.filter((_, index) => !selectedIndices.includes(index));
                    dispatch({ type: 'UPDATE_SHAPES', payload: newShapes });
                    setSelectedIndices([]);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') dispatch({ type: 'UNDO' });
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') dispatch({ type: 'REDO' });
            if (e.key === 'Escape') finishEditingText();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndices, shapes, editingShapeIndex]);

    useEffect(() => {
        if (editingShapeIndex !== null) {
            setTimeout(() => textAreaRef.current?.focus(), 0);
        }
    }, [editingShapeIndex]);

    return (
        <div className="w-screen h-screen bg-gray-800 flex flex-col items-center justify-center font-sans">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 z-10">
                 <button title="Select" onClick={() => setTool(TOOLS.SELECT)} className={`p-2 rounded ${tool === TOOLS.SELECT ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><MousePointer2 size={20} /></button>
                <button title="Pan" onClick={() => setTool(TOOLS.PAN)} className={`p-2 rounded ${tool === TOOLS.PAN ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Move size={20} /></button>
                <div className="w-px h-6 bg-gray-200" />
                <button title="Pencil" onClick={() => setTool(TOOLS.FREEHAND)} className={`p-2 rounded ${tool === TOOLS.FREEHAND ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Pencil size={20} /></button>
                <button title="Rectangle" onClick={() => setTool(TOOLS.RECT)} className={`p-2 rounded ${tool === TOOLS.RECT ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Square size={20} /></button>
                <button title="Circle" onClick={() => setTool(TOOLS.CIRCLE)} className={`p-2 rounded ${tool === TOOLS.CIRCLE ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Circle size={20} /></button>
                <button title="Arrow" onClick={() => setTool(TOOLS.ARROW)} className={`p-2 rounded ${tool === TOOLS.ARROW ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><ArrowUpRight size={20} /></button>
                <button title="Text" onClick={() => setTool(TOOLS.TEXT)} className={`p-2 rounded ${tool === TOOLS.TEXT ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Type size={20} /></button>
                <button title="Eraser" onClick={() => setTool(TOOLS.ERASER)} className={`p-2 rounded ${tool === TOOLS.ERASER ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Eraser size={20} /></button>
                <div className="w-px h-6 bg-gray-200" />
                <button title="Undo" onClick={() => dispatch({ type: 'UNDO' })} className="p-2 rounded hover:bg-gray-100"><Undo size={20} /></button>
                <button title="Redo" onClick={() => dispatch({ type: 'REDO' })} className="p-2 rounded hover:bg-gray-100"><Redo size={20} /></button>
                <button title="Clear All" onClick={() => { finishEditingText(); dispatch({ type: 'CLEAR' }); }} className="p-2 rounded hover:bg-gray-100"><Trash2 size={20} /></button>
            </div>

            <div className="absolute bottom-4 bg-white rounded-lg shadow-lg p-2 flex items-center gap-4 z-10">
                <div className="flex items-center gap-2">
                    <Palette size={20} className="text-gray-600" />
                    {COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="flex items-center gap-2">
                    <Layers size={20} className="text-gray-600" />
                    {tool === TOOLS.ERASER ? (
                        ERASER_STROKES.map(s => (
                            <button key={s} onClick={() => setEraserStroke(s)} className={`w-8 h-8 rounded flex items-center justify-center ${eraserStroke === s ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                                <div className="bg-gray-400 rounded-full" style={{ width: s, height: s }} />
                            </button>
                        ))
                    ) : (
                        STROKES.map(s => (
                            <button key={s} onClick={() => setStroke(s)} className={`w-8 h-8 rounded flex items-center justify-center ${stroke === s ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                                <div className="rounded-full" style={{ backgroundColor: color, width: s + 2, height: s + 2 }} />
                            </button>
                        ))
                    )}
                </div>
                 <div className="w-px h-6 bg-gray-200" />
                <div className="flex items-center gap-2">
                    <button title="Zoom Out" onClick={() => handleWheel({ deltaY: 100, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, currentTarget: canvasRef.current!, preventDefault: () => {} } as React.WheelEvent<HTMLCanvasElement>)} className="p-2 rounded hover:bg-gray-100"><ZoomOut size={20} /></button>
                    <span className="text-sm font-medium w-12 text-center">{Math.round(view.zoom * 100)}%</span>
                    <button title="Zoom In" onClick={() => handleWheel({ deltaY: -100, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, currentTarget: canvasRef.current!, preventDefault: () => {} } as React.WheelEvent<HTMLCanvasElement>)} className="p-2 rounded hover:bg-gray-100"><ZoomIn size={20} /></button>
                </div>
            </div>

            {editingShapeIndex !== null && shapes[editingShapeIndex]?.type === 'text' && (
                <textarea
                    ref={textAreaRef}
                    value={(shapes[editingShapeIndex] as TextShape).text}
                    onChange={(e) => {
                        const currentShapes = [...shapes];
                        const shapeToUpdate = currentShapes[editingShapeIndex] as TextShape;
                        shapeToUpdate.text = e.target.value;
                        updateBoundingBox(shapeToUpdate, canvasRef.current!.getContext('2d')!);
                        dispatch({ type: 'SET_SHAPES_NO_HISTORY', payload: currentShapes });
                    }}
                    onBlur={finishEditingText}
                    style={{
                        position: 'absolute',
                        left: `${((shapes[editingShapeIndex] as TextShape).x * view.zoom) + view.x}px`,
                        top: `${((shapes[editingShapeIndex] as TextShape).y * view.zoom) + view.y - (shapes[editingShapeIndex].bbox?.height! * view.zoom || 0)}px`,
                        fontSize: `${(shapes[editingShapeIndex] as TextShape).fontSize * view.zoom}px`,
                        lineHeight: 1.2,
                        fontFamily: 'sans-serif',
                        color: (shapes[editingShapeIndex] as TextShape).color,
                        background: 'transparent',
                        border: '1px dashed #777',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                        whiteSpace: 'pre',
                        zIndex: 20,
                    }}
                />
            )}

            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
                className={`cursor-${tool === 'pan' ? 'grab' : 'crosshair'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onWheel={handleWheel}
                onDoubleClick={handleDoubleClick}
            />
        </div>
    );
};

export default Whiteboard;

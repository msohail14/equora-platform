import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pen, Minus, Square, Circle, Eraser, Type, Undo2, Redo2, Trash2,
  Upload, Save, Image as ImageIcon, Paintbrush,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppButton from '../../ui/AppButton';
import { saveCourseLayoutApi, updateCourseLayoutApi } from '../../../features/operations/operationsApi';

const TOOLS = [
  { id: 'pen', label: 'Pen', icon: Pen },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'text', label: 'Text', icon: Type },
];

const COLORS = [
  { id: '#000000', label: 'Black' },
  { id: '#dc2626', label: 'Red' },
  { id: '#2563eb', label: 'Blue' },
  { id: '#16a34a', label: 'Green' },
  { id: '#10b981', label: 'Amber' },
];

const WIDTHS = [1, 2, 4, 6, 8];

const TABS = [
  { id: 'draw', label: 'Draw', icon: Paintbrush },
  { id: 'upload', label: 'Upload Photo', icon: Upload },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const drawStroke = (ctx, stroke) => {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }
  ctx.lineWidth = stroke.width;

  if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
    if (!stroke.points?.length) return;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  } else if (stroke.tool === 'line') {
    if (!stroke.points || stroke.points.length < 2) return;
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (stroke.tool === 'rect') {
    if (!stroke.points || stroke.points.length < 2) return;
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    ctx.beginPath();
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (stroke.tool === 'circle') {
    if (!stroke.points || stroke.points.length < 2) return;
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    const cx = start.x + (end.x - start.x) / 2;
    const cy = start.y + (end.y - start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stroke.tool === 'text') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = stroke.color;
    ctx.font = `${Math.max(stroke.width * 4, 14)}px sans-serif`;
    ctx.fillText(stroke.text || '', stroke.x, stroke.y);
  }
};

const redrawCanvas = (canvas, strokes) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  strokes.forEach((s) => drawStroke(ctx, s));
  ctx.globalCompositeOperation = 'source-over';
};

const CourseLayoutEditor = ({ courseId, existingLayoutUrl, existingDrawingData, onSaved }) => {
  const [activeTab, setActiveTab] = useState('draw');
  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeWidth, setActiveWidth] = useState(2);
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentStrokeRef = useRef(null);

  useEffect(() => {
    if (existingDrawingData && Array.isArray(existingDrawingData)) {
      setStrokes(existingDrawingData);
    }
  }, [existingDrawingData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      redrawCanvas(canvas, strokes);
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    return () => observer.disconnect();
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redrawCanvas(canvas, strokes);
  }, [strokes]);

  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (activeTool === 'text') return;
    const point = getCanvasPoint(e);
    currentStrokeRef.current = {
      tool: activeTool,
      color: activeColor,
      width: activeWidth,
      points: [point],
    };
    setIsDrawing(true);
  }, [activeTool, activeColor, activeWidth, getCanvasPoint]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const point = getCanvasPoint(e);
    currentStrokeRef.current.points.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    redrawCanvas(canvas, strokes);
    drawStroke(canvas.getContext('2d'), currentStrokeRef.current);
  }, [isDrawing, strokes, getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentStrokeRef.current) return;
    setStrokes((prev) => [...prev, currentStrokeRef.current]);
    setRedoStack([]);
    currentStrokeRef.current = null;
    setIsDrawing(false);
  }, [isDrawing]);

  const handleCanvasClick = useCallback((e) => {
    if (activeTool !== 'text') return;
    const point = getCanvasPoint(e);
    setTextPosition(point);
    setTextInput('');
  }, [activeTool, getCanvasPoint]);

  const handleTextSubmit = useCallback(() => {
    if (!textPosition || !textInput.trim()) {
      setTextPosition(null);
      setTextInput('');
      return;
    }
    setStrokes((prev) => [
      ...prev,
      {
        tool: 'text',
        color: activeColor,
        width: activeWidth,
        points: [],
        text: textInput.trim(),
        x: textPosition.x,
        y: textPosition.y,
      },
    ]);
    setRedoStack([]);
    setTextPosition(null);
    setTextInput('');
  }, [textPosition, textInput, activeColor, activeWidth]);

  const handleUndo = () => {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Only PNG and JPEG images are accepted.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be under 10MB.');
      return;
    }
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const removeUploadedFile = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadedFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportCanvasBlob = () =>
    new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) { resolve(null); return; }
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      let layoutImage = null;

      if (activeTab === 'draw') {
        const blob = await exportCanvasBlob();
        if (blob) layoutImage = new File([blob], 'course-layout.png', { type: 'image/png' });
      } else if (uploadedFile) {
        layoutImage = uploadedFile;
      }

      if (!layoutImage) {
        toast.error('No layout to save. Draw something or upload an image.');
        setSaving(false);
        return;
      }

      const drawingData = activeTab === 'draw' ? strokes : null;
      const apiCall = existingLayoutUrl ? updateCourseLayoutApi : saveCourseLayoutApi;
      await apiCall({ courseId, layoutImage, drawingData });
      toast.success('Course layout saved successfully.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save layout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Course Layout</h3>
        <AppButton onClick={handleSave} disabled={saving} className="gap-2">
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Layout'}
        </AppButton>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'draw' && (
        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    title={tool.label}
                    onClick={() => setActiveTool(tool.id)}
                    className={`rounded-md p-2 transition ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setActiveColor(c.id)}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    activeColor === c.id
                      ? 'border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: c.id }}
                />
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center gap-1">
              {WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  title={`${w}px`}
                  onClick={() => setActiveWidth(w)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    activeWidth === w
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{ width: w + 4, height: w + 4 }}
                  />
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Undo"
                onClick={handleUndo}
                disabled={!strokes.length}
                className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                title="Redo"
                onClick={handleRedo}
                disabled={!redoStack.length}
                className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Redo2 size={16} />
              </button>
              <button
                type="button"
                title="Clear"
                onClick={handleClear}
                disabled={!strokes.length}
                className="rounded-md p-2 text-rose-500 transition hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-900/30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700"
          >
            <canvas
              ref={canvasRef}
              className={`h-full w-full ${activeTool === 'text' ? 'cursor-text' : activeTool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              onClick={handleCanvasClick}
            />

            {textPosition && (
              <div
                className="absolute z-10"
                style={{ left: textPosition.x, top: textPosition.y }}
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') { setTextPosition(null); setTextInput(''); } }}
                  onBlur={handleTextSubmit}
                  autoFocus
                  className="min-w-[120px] rounded border border-emerald-400 bg-white px-2 py-1 text-sm shadow-lg outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Type text..."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="p-4">
          {!uploadPreview && !existingLayoutUrl && (
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[480px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-emerald-400 hover:bg-emerald-50/30 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                <ImageIcon size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Drop an image here or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-400">PNG or JPEG, max 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFileDrop}
              />
            </div>
          )}

          {uploadPreview && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <img
                  src={uploadPreview}
                  alt="Layout preview"
                  className="max-h-[480px] w-full object-contain bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <AppButton variant="secondary" onClick={removeUploadedFile} className="gap-2">
                <Trash2 size={14} />
                Remove
              </AppButton>
            </div>
          )}

          {!uploadPreview && existingLayoutUrl && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Current Layout
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <img
                  src={existingLayoutUrl}
                  alt="Existing layout"
                  className="max-h-[480px] w-full object-contain bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <AppButton variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload size={14} />
                Replace Image
              </AppButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFileDrop}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseLayoutEditor;

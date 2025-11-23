import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, FabricText } from "fabric";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Pencil,
  Square,
  CircleIcon,
  Type,
  Eraser,
  Download,
  Undo,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface XRayViewerProps {
  imageUrl: string;
  onAnnotationsSave?: (annotations: string) => void;
}

export const XRayViewer = ({ imageUrl, onAnnotationsSave }: XRayViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [tool, setTool] = useState<"select" | "draw" | "rectangle" | "circle" | "text">("select");
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#000000",
    });

    // Initialize drawing brush
    const brush = new PencilBrush(canvas);
    brush.color = "#00ff00";
    brush.width = 2;
    canvas.freeDrawingBrush = brush;

    setFabricCanvas(canvas);

    // Load the X-ray image
    const imgElement = new Image();
    imgElement.crossOrigin = "anonymous";
    imgElement.onload = () => {
      const img = new fabric.FabricImage(imgElement);
      
      // Scale image to fit canvas
      const scale = Math.min(
        canvas.width! / img.width!,
        canvas.height! / img.height!
      );
      img.scale(scale);
      
      // Center image
      img.set({
        left: (canvas.width! - img.width! * scale) / 2,
        top: (canvas.height! - img.height! * scale) / 2,
        selectable: false,
        evented: false,
      });
      
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    };
    imgElement.onerror = (error) => {
      console.error("Error loading image:", error);
      toast.error("Failed to load X-ray image");
    };
    imgElement.src = imageUrl;

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = tool === "draw";
    
    if (tool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = "#00ff00";
      fabricCanvas.freeDrawingBrush.width = 2;
    }
  }, [tool, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.setZoom(zoom);
    fabricCanvas.renderAll();
  }, [zoom, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    const baseImage = objects[0];
    
    if (baseImage && 'filters' in baseImage) {
      // Apply brightness and contrast filters
      fabricCanvas.renderAll();
    }
  }, [brightness, contrast, fabricCanvas]);

  const handleToolClick = (selectedTool: typeof tool) => {
    setTool(selectedTool);

    if (!fabricCanvas) return;

    if (selectedTool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: "#00ff00",
        strokeWidth: 2,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
    } else if (selectedTool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: "#00ff00",
        strokeWidth: 2,
        radius: 50,
      });
      fabricCanvas.add(circle);
    } else if (selectedTool === "text") {
      const text = new FabricText("Add text", {
        left: 100,
        top: 100,
        fill: "#00ff00",
        fontSize: 20,
      });
      fabricCanvas.add(text);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    // Keep only the background image (first object)
    objects.slice(1).forEach((obj) => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
    toast.success("Annotations cleared");
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    if (objects.length > 1) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
    }
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });
    
    const link = document.createElement('a');
    link.download = 'annotated-xray.png';
    link.href = dataURL;
    link.click();
    
    toast.success("Image downloaded");
  };

  const handleSave = () => {
    if (!fabricCanvas || !onAnnotationsSave) return;
    
    const json = JSON.stringify(fabricCanvas.toJSON());
    onAnnotationsSave(json);
    toast.success("Annotations saved");
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={tool === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("select")}
        >
          <Move className="h-4 w-4 mr-1" />
          Select
        </Button>
        <Button
          variant={tool === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("draw")}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Draw
        </Button>
        <Button
          variant={tool === "rectangle" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("rectangle")}
        >
          <Square className="h-4 w-4 mr-1" />
          Rectangle
        </Button>
        <Button
          variant={tool === "circle" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("circle")}
        >
          <CircleIcon className="h-4 w-4 mr-1" />
          Circle
        </Button>
        <Button
          variant={tool === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("text")}
        >
          <Type className="h-4 w-4 mr-1" />
          Text
        </Button>
        
        <div className="border-l mx-2" />
        
        <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(zoom + 0.1, 3))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="border-l mx-2" />
        
        <Button variant="outline" size="sm" onClick={handleUndo}>
          <Undo className="h-4 w-4 mr-1" />
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        {onAnnotationsSave && (
          <Button size="sm" onClick={handleSave}>
            Save Annotations
          </Button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <Label>Zoom: {(zoom * 100).toFixed(0)}%</Label>
          <Slider
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
            min={0.5}
            max={3}
            step={0.1}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Brightness: {brightness}%</Label>
          <Slider
            value={[brightness]}
            onValueChange={([value]) => setBrightness(value)}
            min={0}
            max={200}
            step={1}
            className="mt-2"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-black flex items-center justify-center">
        <canvas ref={canvasRef} />
      </div>
    </Card>
  );
};

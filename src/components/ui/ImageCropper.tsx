import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { Button } from "./Button";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageFile) {
        onCropComplete(croppedImageFile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Crop Profile Photo</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-[300px] sm:h-[400px] bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-white space-y-6">
          <div className="flex items-center gap-4">
            <ZoomOut className="text-slate-400" size={20} />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <ZoomIn className="text-slate-400" size={20} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApplyCrop} disabled={isProcessing} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isProcessing ? "Processing..." : (
                <>
                  <Check size={18} className="mr-2" />
                  Crop & Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { Button } from "./Button";
import { X, Crop, Loader2 } from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
  isUploading?: boolean;
}

export function ImageCropperModal({ imageSrc, onCropComplete, onClose, isUploading = false }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Crop size={20} className="text-brand-blue" /> Crop Profile Photo
          </h3>
          <button 
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="relative w-full h-[400px] bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-600 font-medium">
              <span>Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-brand-blue"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleConfirmCrop} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  "Crop & Upload"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

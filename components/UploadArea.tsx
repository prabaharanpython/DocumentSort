import React, { useCallback, useState, useRef } from 'react';
import { IconUpload } from './Icons';

interface UploadAreaProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onUpload, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onUpload(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  if (showCamera) {
    return (
      <div className="relative w-full h-72 rounded-xl overflow-hidden bg-black flex flex-col items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 flex gap-4 z-10">
          <button 
            onClick={stopCamera}
            className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full text-sm font-medium hover:bg-white/30 transition"
          >
            Cancel
          </button>
          <button 
            onClick={capturePhoto}
            className="px-6 py-2 bg-brand-500 text-white rounded-full text-sm font-bold shadow-lg hover:bg-brand-600 transition flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            Capture
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-64 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center overflow-hidden
        ${isDragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {isProcessing ? (
        <div className="text-center space-y-3 z-10">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
          <div>
            <p className="text-sm font-medium text-slate-700">Analyzing Document...</p>
            <p className="text-xs text-slate-500">Extracting details via Local OCR</p>
          </div>
        </div>
      ) : (
        <>
            <div className="p-4 rounded-full bg-white shadow-sm mb-3">
                <IconUpload className="w-6 h-6 text-brand-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">
                Drag & Drop or Upload
            </p>
            <div className="flex gap-3 mt-4">
              <label className="cursor-pointer px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm">
                  Select File
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleChange}
                    disabled={isProcessing}
                  />
              </label>
              <button 
                onClick={startCamera}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
              >
                <span>📷</span> Take Photo
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-4">
                Supports JPG, PNG (Max 5MB)
            </p>
        </>
      )}
    </div>
  );
};

export default UploadArea;
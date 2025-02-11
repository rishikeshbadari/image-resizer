import React, { useState, useRef, useEffect } from 'react';
import { computeEnergyMap, findSeam, removeSeam } from '../../lib/seamCarving';

const ImageSeamCarver = () => {
  const [imageFile, setImageFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);

  useEffect(() => {
    if (!imageFile) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      const setupCanvas = (canvas, ctx) => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };

      // Set up both canvases
      setupCanvas(originalCanvasRef.current, originalCanvasRef.current.getContext('2d'));
      setupCanvas(canvasRef.current, canvasRef.current.getContext('2d'));
    };
  }, [imageFile]);

  const highlightSeam = (ctx, seam, width, height, direction = 'vertical') => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    if (direction === 'vertical') {
      for (let y = 0; y < height; y++) {
        const x = seam[y];
        const index = (y * width + x) * 4;
        data[index] = 255;     // R
        data[index + 1] = 0;   // G
        data[index + 2] = 0;   // B
        data[index + 3] = 255; // A
      }
    } else {
      for (let x = 0; x < width; x++) {
        const y = seam[x];
        const index = (y * width + x) * 4;
        data[index] = 255;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleSeamRemoval = async (numSeams = 1, direction = 'vertical') => {
    if (processing) return;
    setProcessing(true);
    setProgress(0);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < numSeams; i++) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const energyMap = await computeEnergyMap(imageData);
      const seam = findSeam(energyMap, direction);
      
      // Highlight seam
      highlightSeam(ctx, seam, canvas.width, canvas.height, direction);
      
      // Wait a moment to show the highlighted seam
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Remove seam
      const newImageData = removeSeam(imageData, seam, direction);
      canvas.width = newImageData.width;
      canvas.height = newImageData.height;
      ctx.putImageData(newImageData, 0, 0);

      setProgress(((i + 1) / numSeams) * 100);
    }

    setProcessing(false);
    setProgress(0);
  };

  const handleReset = () => {
    if (!imageFile) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const originalCanvas = originalCanvasRef.current;
    
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;
    ctx.drawImage(originalCanvas, 0, 0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Face-Aware Seam Carving</h2>
      
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="block w-full mb-4"
        />

        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="border border-gray-200 rounded">
          <div className="max-h-[70vh] flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
        
        <canvas 
          ref={originalCanvasRef}
          style={{ display: 'none' }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Vertical Seams</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSeamRemoval(1, 'vertical')} 
                disabled={!imageFile || processing}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
              >
                Remove 1 Vertical
              </button>
              <button 
                onClick={() => handleSeamRemoval(10, 'vertical')} 
                disabled={!imageFile || processing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Remove 10 Vertical
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Horizontal Seams</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSeamRemoval(1, 'horizontal')} 
                disabled={!imageFile || processing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Remove 1 Horizontal
              </button>
              <button 
                onClick={() => handleSeamRemoval(10, 'horizontal')} 
                disabled={!imageFile || processing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Remove 10 Horizontal
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8 justify-center">
          <button 
            onClick={handleReset} 
            disabled={!imageFile || processing}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
          >
            Reset Image
          </button>
          <button 
            onClick={handleDownload} 
            disabled={!imageFile || processing}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Download Result
          </button>
        </div>

        {processing && (
          <div className="text-center text-sm text-gray-500">
            Processing... Please wait
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSeamCarver;
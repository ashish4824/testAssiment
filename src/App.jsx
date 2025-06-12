import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// Car models data
const CAR_MODELS = [
  { id: 1, name: 'Peugeot Partner L2 White', image: '/photo_5992130465353549853_w.png' },
  { id: 2, name: 'Peugeot Partner L2 Blue', image: '/photo_5992130465353549852_w.png' },
  { id: 3, name: 'Peugeot Partner L2 Red', image: '/photo_5992130465353549851_w.png' },
];

// Color options
const COLORS = [
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
];

// Decal options
const DECALS = [
  { id: 1, name: 'Racing Stripe', image: '/stripe1.svg', position: { x: 50, y: 50 }, size: 100, rotation: 0 },
  { id: 2, name: 'Logo', image: '/logo1.svg', position: { x: 50, y: 50 }, size: 100, rotation: 0 },
  { id: 3, name: 'Number', image: '/number1.svg', position: { x: 50, y: 50 }, size: 100, rotation: 0 },
];

function App() {
  const [selectedCar, setSelectedCar] = useState(CAR_MODELS[0]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [decals, setDecals] = useState([]);
  const [activeDecal, setActiveDecal] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [customColor, setCustomColor] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Draw the car after setting canvas size
    drawCar();
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [selectedCar]);

  // Redraw when color or decals change
  useEffect(() => {
    drawCar();
  }, [selectedColor, decals]);

  // Draw car with current configuration
  // import { useCallback } from 'react';

  // Utility: Convert hex color to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  const drawCar = useCallback(() => {
    if (!canvasRef.current) {
      console.error('Canvas reference is null');
      return;
    }
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
  
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    const carImage = new Image();
    carImage.crossOrigin = 'anonymous';
    carImage.src = selectedCar.image;
  
    carImage.onload = () => {
      const aspectRatio = carImage.width / carImage.height;
      let drawWidth = canvas.width;
      let drawHeight = drawWidth / aspectRatio;
  
      if (drawHeight > canvas.height) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * aspectRatio;
      }
  
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
  
      ctx.drawImage(carImage, x, y, drawWidth, drawHeight);
  
      if (selectedColor && selectedColor !== 'none') {
        // Get image data for manual processing
        const imageData = ctx.getImageData(x, y, drawWidth, drawHeight);
        const data = imageData.data;
        const color = hexToRgb(selectedColor.value);
  
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
  
          // Skip pixels that are nearly white
          if (!(r > 240 && g > 240 && b > 240)) {
            data[i] = (r * color.r) / 255;
            data[i + 1] = (g * color.g) / 255;
            data[i + 2] = (b * color.b) / 255;
          }
        }
  
        // Apply updated image
        ctx.putImageData(imageData, x, y);
      }
  
      // Draw decals
      decals.forEach(decal => {
        if (!decal.position) return;
  
        const decalImg = new Image();
        decalImg.crossOrigin = 'anonymous';
        decalImg.src = decal.image;
  
        decalImg.onload = () => {
          // Calculate size based on decal.size (percentage of default size)
          const sizeMultiplier = decal.size / 100;
          const decalWidth = drawWidth * 0.2 * sizeMultiplier;
          const decalHeight = (decalWidth / decalImg.width) * decalImg.height;
  
          const decalX = x + (decal.position.x / 100) * drawWidth - decalWidth / 2;
          const decalY = y + (decal.position.y / 100) * drawHeight - decalHeight / 2;
  
          // Save the current context state
          ctx.save();
          
          // Move to the center of where the decal should be
          ctx.translate(
            decalX + decalWidth / 2,
            decalY + decalHeight / 2
          );
          
          // Rotate the context
          ctx.rotate((decal.rotation * Math.PI) / 180);
          
          // Draw the decal centered at the origin (which is now at the decal's center)
          ctx.drawImage(
            decalImg, 
            -decalWidth / 2, 
            -decalHeight / 2, 
            decalWidth, 
            decalHeight
          );
          
          // Restore the context to its original state
          ctx.restore();
          
          // Highlight active decal with a border
          if (decal.id === activeDecal) {
            ctx.save();
            ctx.translate(
              decalX + decalWidth / 2,
              decalY + decalHeight / 2
            );
            ctx.rotate((decal.rotation * Math.PI) / 180);
            ctx.strokeStyle = '#2563eb'; // Blue border
            ctx.lineWidth = 2;
            ctx.strokeRect(
              -decalWidth / 2, 
              -decalHeight / 2, 
              decalWidth, 
              decalHeight
            );
            ctx.restore();
          }
        };
  
        decalImg.onerror = (error) => {
          console.error(`Error loading decal image ${decal.name}:`, error);
        };
      });
    };
  
    carImage.onerror = (error) => {
      console.error('Error loading car image:', error);
    };
  }, [selectedCar, selectedColor, decals]);
  
  // Handle car model change
  const handleCarChange = (car) => {
    setSelectedCar(car);
    setDecals([]);
    setSelectedColor(null);
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color === selectedColor ? null : color);
  };

  // Handle decal selection
  const handleDecalSelect = (decal) => {
    const newDecal = {
      ...decal,
      id: Date.now(),
      position: { x: 50, y: 50 }, // Center of the canvas by default (percentage-based)
      size: 100, // Default size (percentage)
      rotation: 0 // Default rotation (degrees)
    };
    setDecals([...decals, newDecal]);
    setActiveDecal(newDecal.id);
  };

  // Handle canvas click
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // If color picker is active, pick the color
    if (isColorPickerActive) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Get pixel color data at the clicked position
      const pixelData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      
      // Convert RGB to hex
      const hexColor = `#${pixelData[0].toString(16).padStart(2, '0')}${pixelData[1].toString(16).padStart(2, '0')}${pixelData[2].toString(16).padStart(2, '0')}`;
      
      // Create a custom color object
      const pickedColor = {
        name: 'Custom Color',
        value: hexColor
      };
      
      // Set the custom color
      setCustomColor(pickedColor);
      setSelectedColor(pickedColor);
      
      // Deactivate the color picker
      setIsColorPickerActive(false);
      return;
    }
    
    // Otherwise handle decal placement
    if (!activeDecal) return;
    
    // Update decal position using the position object with percentage values
    setDecals(decals.map(decal => 
      decal.id === activeDecal ? { 
        ...decal, 
        position: { 
          x: (x / rect.width) * 100, 
          y: (y / rect.height) * 100 
        } 
      } : decal
    ));
  };

  // Handle decal drag start
  const handleDecalDragStart = (e, decalId) => {
    // Store the decal template ID, not an existing decal ID
    e.dataTransfer.setData('decalTemplateId', decalId.toString());
    setIsDragging(true);
  };

  // Handle decal drag over
  const handleDecalDragOver = (e) => {
    e.preventDefault();
  };

  // Handle decal drop
  const handleDecalDrop = (e) => {
    e.preventDefault();
    const decalTemplateId = parseInt(e.dataTransfer.getData('decalTemplateId'));
    
    // Find the decal template from DECALS array
    const decalTemplate = DECALS.find(d => d.id === decalTemplateId);
    
    if (decalTemplate) {
      // Get canvas position
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create a new decal instance with position
      const newDecal = {
        ...decalTemplate,
        id: Date.now(), // Generate unique ID
        position: { x: (x / rect.width) * 100, y: (y / rect.height) * 100 },
        size: 100, // Default size (percentage)
        rotation: 0 // Default rotation (degrees)
      };
      
      // Add the new decal to the list
      setDecals([...decals, newDecal]);
      setActiveDecal(newDecal.id);
    }
    
    setIsDragging(false);
  };

  // Remove active decal
  const removeActiveDecal = () => {
    if (activeDecal) {
      setDecals(decals.filter(decal => decal.id !== activeDecal));
      setActiveDecal(null);
    }
  };

  // Save configuration
  const saveConfiguration = () => {
    const config = {
      car: selectedCar,
      color: selectedColor,
      decals: decals,
      timestamp: new Date().toISOString()
    };
    console.log('Saved Configuration:', config);
    alert('Configuration saved to console!');
  };

  // Reset configuration
  const resetConfiguration = () => {
    setSelectedCar(CAR_MODELS[0]);
    setSelectedColor(null);
    setDecals([]);
    setActiveDecal(null);
  };

  // Download image
  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = 'custom-car.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Add a separate useEffect to redraw when color or decals change
  useEffect(() => {
    if (canvasRef.current) {
      drawCar();
    }
  }, [selectedColor, decals]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="bg-blue-600 text-white p-4 rounded-lg mb-6">
        <h1 className="text-2xl font-bold">Peugeot Partner Customizer</h1>
        <p className="text-blue-100">Design your perfect vehicle</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-1/4 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Customization Options</h2>
          
          {/* Car Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Select Car Model</h3>
            <div className="grid grid-cols-2 gap-2">
              {CAR_MODELS.map((car) => (
                <button
                  key={car.id}
                  className={`p-2 border rounded ${
                    selectedCar.id === car.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleCarChange(car)}
                >
                  {car.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Select Car Color</h3>
            <div className="flex items-center mb-2">
              <button
                className={`mr-2 p-2 rounded ${isColorPickerActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setIsColorPickerActive(!isColorPickerActive)}
                title="Color Picker Tool"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.94 2.94a.75.75 0 0 1 1.06 0l10.5 10.5a.75.75 0 1 1-1.06 1.06l-10.5-10.5a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
                  <path d="M4.5 13.28a.75.75 0 0 0-1.5 0v2.97a.75.75 0 0 0 1.5 0v-2.97z" />
                  <path fillRule="evenodd" d="M5.25 15a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75z" clipRule="evenodd" />
                </svg>
              </button>
              {isColorPickerActive && (
                <div className="text-sm text-blue-600 ml-2">
                  Click on the car to pick a color
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor?.value === color.value ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color)}
                  title={color.name}
                />
              ))}
            </div>
            
            {/* Custom Color Display */}
            {customColor && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-1">Custom Color</h4>
                <div className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full border-2 ${selectedColor?.value === customColor.value ? 'border-blue-500' : 'border-gray-200'}`} 
                    style={{ backgroundColor: customColor.value }}
                    onClick={() => setSelectedColor(customColor)}
                  ></div>
                  <span className="text-sm ml-2">{customColor.value}</span>
                </div>
              </div>
            )}
          </div>

          {/* Decal Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Add Decals</h3>
            <div className="flex flex-wrap gap-2">
              {DECALS.map((decal) => (
                <div
                  key={decal.id}
                  className="p-2 border rounded cursor-move bg-gray-50"
                  draggable
                  onDragStart={(e) => handleDecalDragStart(e, decal.id)}
                >
                  <img 
                    src={decal.image} 
                    alt={decal.name} 
                    className="w-12 h-12 object-contain"
                  />
                  <div className="text-xs text-center mt-1">{decal.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {activeDecal && (
              <div className="mb-4 p-3 border rounded bg-blue-50">
                <h3 className="font-medium mb-2">Edit Selected Decal</h3>
                
                {/* Size Control */}
                <div className="mb-3">
                  <label className="block text-sm mb-1">Size</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="50" 
                      max="200" 
                      className="flex-1 mr-2"
                      value={decals.find(d => d.id === activeDecal)?.size || 100}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value);
                        setDecals(decals.map(decal => 
                          decal.id === activeDecal ? { ...decal, size: newSize } : decal
                        ));
                      }}
                    />
                    <span className="text-sm w-8 text-right">
                      {decals.find(d => d.id === activeDecal)?.size || 100}%
                    </span>
                  </div>
                </div>
                
                {/* Rotation Control */}
                <div className="mb-3">
                  <label className="block text-sm mb-1">Rotation</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="360" 
                      className="flex-1 mr-2"
                      value={decals.find(d => d.id === activeDecal)?.rotation || 0}
                      onChange={(e) => {
                        const newRotation = parseInt(e.target.value);
                        setDecals(decals.map(decal => 
                          decal.id === activeDecal ? { ...decal, rotation: newRotation } : decal
                        ));
                      }}
                    />
                    <span className="text-sm w-8 text-right">
                      {decals.find(d => d.id === activeDecal)?.rotation || 0}°
                    </span>
                  </div>
                </div>
                
                <button
                  className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors w-full"
                  onClick={removeActiveDecal}
                >
                  Remove Decal
                </button>
              </div>
            )}
            
            <button
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              onClick={saveConfiguration}
            >
              Save Configuration
            </button>
            <button
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              onClick={downloadImage}
            >
              Download Image
            </button>
            <button
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              onClick={resetConfiguration}
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Right Panel - Canvas */}
        <div className="flex-1 bg-white p-4 rounded-lg shadow">
          <div 
            ref={containerRef}
            className="relative w-full h-[70vh] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
            onDrop={handleDecalDrop}
            onDragOver={handleDecalDragOver}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onClick={handleCanvasClick}
            />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-lg">
                Drop decal on the car
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Click on the canvas to place the selected decal.</p>
            <p>Drag and drop decals to reposition them.</p>
            <p>Select a decal to adjust its size and rotation using the controls in the left panel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

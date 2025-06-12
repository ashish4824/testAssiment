import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// Car models data
const CAR_MODELS = [
  { id: 1, name: 'Peugeot Partner L2 White', image: '/photo_5992130465353549853_w.jpg' },
  { id: 2, name: 'Peugeot Partner L2 Blue', image: '/photo_5992130465353549852_w.jpg' },
  { id: 3, name: 'Peugeot Partner L2 Red', image: '/photo_5992130465353549851_w.jpg' },
];

// Color options
const COLORS = [
  { name: 'No Color', value: 'transparent' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
];

// Decal options
const DECALS = [
  { id: 1, name: 'Racing Stripe', image: '/stripe1.svg', position: { x: 50, y: 50 } },
  { id: 2, name: 'Logo', image: '/logo1.svg', position: { x: 50, y: 50 } },
  { id: 3, name: 'Number', image: '/number1.svg', position: { x: 50, y: 50 } },
];

function App() {
  const [selectedCar, setSelectedCar] = useState(CAR_MODELS[0]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorIntensity, setColorIntensity] = useState(100); // 0-100%
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
  // Add a useCallback to memoize the drawCar function
  const drawCar = useCallback(() => {
    if (!canvasRef.current) {
      console.error('Canvas reference is null');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw the car image
    const carImage = new Image();
    carImage.crossOrigin = 'anonymous'; // Add this to handle CORS issues
    carImage.src = selectedCar.image;
    
    console.log('Loading car image:', selectedCar.image);
    
    carImage.onload = () => {
      console.log('Car image loaded successfully');
      // Calculate aspect ratio to fit the image within the canvas
      const aspectRatio = carImage.width / carImage.height;
      let drawWidth = canvas.width;
      let drawHeight = drawWidth / aspectRatio;
      
      // If the height exceeds the canvas, scale down
      if (drawHeight > canvas.height) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * aspectRatio;
      }
      
      // Center the image on the canvas
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      
      // Draw the base car image
      ctx.drawImage(carImage, x, y, drawWidth, drawHeight);
      
      // Apply color overlay if a color is selected
      if (selectedColor && selectedColor.value !== 'transparent') {
        ctx.globalCompositeOperation = 'multiply';
        // Apply color with intensity
        const intensity = colorIntensity / 100;
        ctx.globalAlpha = intensity;
        ctx.fillStyle = selectedColor.value;
        ctx.fillRect(x, y, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0; // Reset alpha
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // Draw decals
      decals.forEach(decal => {
        if (!decal.position) return;
        
        const decalImg = new Image();
        decalImg.crossOrigin = 'anonymous'; // Add this to handle CORS issues
        decalImg.src = decal.image;
        
        console.log('Loading decal image:', decal.image);
        
        decalImg.onload = () => {
          console.log('Decal image loaded successfully:', decal.name);
          // Scale decal to a reasonable size (e.g., 20% of car width)
          const decalWidth = drawWidth * 0.2;
          const decalHeight = (decalWidth / decalImg.width) * decalImg.height;
          
          // Position decal based on user placement
          const decalX = x + (decal.position.x / 100) * drawWidth - decalWidth / 2;
          const decalY = y + (decal.position.y / 100) * drawHeight - decalHeight / 2;
          
          ctx.drawImage(decalImg, decalX, decalY, decalWidth, decalHeight);
        };
        
        decalImg.onerror = (error) => {
          console.error(`Error loading decal image ${decal.name}:`, error);
        };
      });
    };
    
    carImage.onerror = (error) => {
      console.error('Error loading car image:', error);
    };
  }, [selectedCar, selectedColor, decals, colorIntensity]);

  // Handle car model change
  const handleCarChange = (car) => {
    setSelectedCar(car);
    setDecals([]);
    setSelectedColor(null);
    setColorIntensity(100);
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
      position: { x: 50, y: 50 } // Center of the canvas by default (percentage-based)
    };
    setDecals([...decals, newDecal]);
    setActiveDecal(newDecal.id);
  };

  // Handle color picker click
  const handleColorPickerClick = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get pixel color data at the clicked position
    const x = Math.floor(lastClickX);
    const y = Math.floor(lastClickY);
    
    // Get pixel color data at the clicked position
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    
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
  };
  
  // Track last click position
  const [lastClickX, setLastClickX] = useState(0);
  const [lastClickY, setLastClickY] = useState(0);
  
  // Handle canvas click
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Store the click position
    setLastClickX(x);
    setLastClickY(y);
    
    // If color picker is active, pick the color
    if (isColorPickerActive) {
      handleColorPickerClick();
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
        position: { x: (x / rect.width) * 100, y: (y / rect.height) * 100 }
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
      colorIntensity: colorIntensity,
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
    setColorIntensity(100);
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
            <h3 className="text-lg font-semibold mb-2">Select Color</h3>
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
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  className={`p-2 border rounded flex flex-col items-center ${
                    selectedColor && selectedColor.value === color.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleColorSelect(color)}
                >
                  <div 
                    className={`w-12 h-12 rounded-full border mb-1 ${
                      color.value === 'transparent' ? 'bg-white relative overflow-hidden' : ''
                    }`}
                    style={{ backgroundColor: color.value !== 'transparent' ? color.value : undefined }}
                  >
                    {color.value === 'transparent' && (
                      <>
                        <div className="absolute inset-0 bg-gray-200 opacity-50" style={{ 
                          backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)', 
                          backgroundSize: '8px 8px',
                          backgroundPosition: '0 0, 4px 4px'
                        }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-medium">{color.name}</span>
                </button>
              ))}
            </div>
            
            {/* Custom Color Display */}
            {customColor && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-1">Custom Color</h4>
                <div className="flex items-center">
                  <div 
                    className={`w-10 h-10 rounded-md mr-2 border border-gray-300 ${selectedColor?.value === customColor.value ? 'ring-2 ring-blue-500' : ''}`} 
                    style={{ backgroundColor: customColor.value }}
                    onClick={() => setSelectedColor(customColor)}
                  ></div>
                  <span className="text-sm">{customColor.value}</span>
                </div>
              </div>
            )}
            
            {/* Color Intensity Slider - only show when a color is selected */}
            {selectedColor && selectedColor.value !== 'transparent' && (
              <div className="mt-4 p-3 bg-gray-50 rounded border">
                <h4 className="text-sm font-medium mb-2">Adjust Color Intensity</h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Light</span>
                  <label className="text-sm font-medium">{colorIntensity}%</label>
                  <span className="text-xs text-gray-500">Intense</span>
                </div>
                <input
                  id="intensity-slider"
                  type="range"
                  min="10"
                  max="100"
                  value={colorIntensity}
                  onChange={(e) => setColorIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div 
                  className="mt-2 w-full h-6 rounded" 
                  style={{ 
                    backgroundColor: selectedColor.value,
                    opacity: colorIntensity / 100
                  }}
                ></div>
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
            {activeDecal && (
              <button
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                onClick={removeActiveDecal}
              >
                Remove Selected Decal
              </button>
            )}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

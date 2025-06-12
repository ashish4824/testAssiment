import { useState, useRef, useEffect } from 'react';
import './App.css';

// Car models data
const CAR_MODELS = [
  { id: 1, name: 'Peugeot Partner L2 White', image: '/photo_5992130465353549853_w.jpg' },
  { id: 2, name: 'Peugeot Partner L2 Blue', image: '/photo_5992130465353549852_w.jpg' },
  { id: 3, name: 'Peugeot Partner L2 Red', image: '/photo_5992130465353549851_w.jpg' },
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
  { id: 1, name: 'Racing Stripe', image: '/stripe1.svg' },
  { id: 2, name: 'Logo', image: '/logo1.svg' },
  { id: 3, name: 'Number', image: '/number1.svg' },
];

function App() {
  const [selectedCar, setSelectedCar] = useState(CAR_MODELS[0]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [decals, setDecals] = useState([]);
  const [activeDecal, setActiveDecal] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        drawCar();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [selectedCar]);

  // Draw car with current configuration
  const drawCar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw car image
    const img = new Image();
    img.src = selectedCar.image;
    img.onload = () => {
      // Calculate aspect ratio
      const aspectRatio = img.width / img.height;
      let width = canvas.width * 0.8;
      let height = width / aspectRatio;
      
      if (height > canvas.height * 0.8) {
        height = canvas.height * 0.8;
        width = height * aspectRatio;
      }
      
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      
      // Draw base car image
      ctx.drawImage(img, x, y, width, height);
      
      // Apply color overlay if selected
      if (selectedColor) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = selectedColor;
        ctx.fillRect(x, y, width, height);
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // Draw decals
      decals.forEach(decal => {
        const decalImg = new Image();
        decalImg.src = decal.image;
        decalImg.onload = () => {
          ctx.drawImage(
            decalImg,
            decal.x - decal.width / 2,
            decal.y - decal.height / 2,
            decal.width,
            decal.height
          );
        };
      });
    };
  };

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
      x: 100,
      y: 100,
      width: 100,
      height: 50,
    };
    setDecals([...decals, newDecal]);
    setActiveDecal(newDecal.id);
  };

  // Handle canvas click
  const handleCanvasClick = (e) => {
    if (!activeDecal) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDecals(decals.map(decal => 
      decal.id === activeDecal ? { ...decal, x, y } : decal
    ));
  };

  // Handle decal drag start
  const handleDecalDragStart = (e, decalId) => {
    e.dataTransfer.setData('text/plain', decalId);
    setActiveDecal(decalId);
    setIsDragging(true);
  };

  // Handle decal drag over
  const handleDecalDragOver = (e) => {
    e.preventDefault();
  };

  // Handle decal drop
  const handleDecalDrop = (e) => {
    e.preventDefault();
    const decalId = e.dataTransfer.getData('text/plain');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDecals(decals.map(decal => 
      decal.id.toString() === decalId ? { ...decal, x, y } : decal
    ));
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
            <h3 className="font-medium mb-2">Select Color</h3>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color.value ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                />
              ))}
            </div>
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

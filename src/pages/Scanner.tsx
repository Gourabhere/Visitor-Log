import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { loadModels, getFaceDescriptor, findBestMatch } from '../lib/face';
import { db, type Visitor, type Log } from '../lib/db';
import { Camera, CheckCircle2, UserPlus, XCircle, Loader2 } from 'lucide-react';

export default function Scanner() {
  const webcamRef = useRef<Webcam>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'MATCH' | 'NO_MATCH' | 'ERROR', visitor?: Visitor, message?: string } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);
  
  // Registration Form State
  const [name, setName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadModels().then(() => setIsModelLoaded(true)).catch(console.error);
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!webcamRef.current || !isModelLoaded) return;
    
    setIsScanning(true);
    setScanResult(null);
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setIsScanning(false);
      return;
    }

    setCapturedImage(imageSrc);

    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => { img.onload = resolve; });

      const descriptor = await getFaceDescriptor(img);
      
      if (!descriptor) {
        setScanResult({ type: 'ERROR', message: 'No face detected. Please try again.' });
        setIsScanning(false);
        return;
      }

      setCapturedDescriptor(descriptor);

      const visitors = await db.getVisitors();
      const labeledDescriptors = visitors.map(v => ({
        id: v.id,
        descriptor: new Float32Array(v.descriptor)
      }));

      const match = findBestMatch(descriptor, labeledDescriptors);

      if (match) {
        const visitor = visitors.find(v => v.id === match.id);
        if (visitor) {
          setScanResult({ type: 'MATCH', visitor });
        }
      } else {
        setScanResult({ type: 'NO_MATCH' });
      }
    } catch (error) {
      console.error(error);
      setScanResult({ type: 'ERROR', message: 'Error processing face.' });
    } finally {
      setIsScanning(false);
    }
  }, [isModelLoaded]);

  const handleCheckInOut = async (type: 'IN' | 'OUT') => {
    if (!scanResult?.visitor) return;
    
    const log: Log = {
      id: crypto.randomUUID(),
      visitorId: scanResult.visitor.id,
      type,
      timestamp: Date.now(),
      purpose: type === 'IN' ? purpose : undefined,
    };
    
    await db.saveLog(log);
    resetScanner();
    alert(`Successfully checked ${type.toLowerCase()} ${scanResult.visitor.name}`);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedDescriptor || !capturedImage) return;

    const newVisitor: Visitor = {
      id: crypto.randomUUID(),
      name,
      flatNo,
      phone,
      photoUrl: capturedImage,
      descriptor: Array.from(capturedDescriptor),
      registeredAt: Date.now(),
    };

    await db.saveVisitor(newVisitor);
    
    // Auto check-in
    const log: Log = {
      id: crypto.randomUUID(),
      visitorId: newVisitor.id,
      type: 'IN',
      timestamp: Date.now(),
      purpose,
    };
    await db.saveLog(log);
    
    resetScanner();
    alert(`Registered and checked in ${name}`);
  };

  const resetScanner = () => {
    setScanResult(null);
    setCapturedImage(null);
    setCapturedDescriptor(null);
    setName('');
    setFlatNo('');
    setPhone('');
    setPurpose('');
  };

  if (!isModelLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Loading AI Models...</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full max-w-md mx-auto">
      {!scanResult && !capturedImage ? (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-[3/4] shadow-xl">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment' }}
              className="w-full h-full object-cover"
            />
            
            {/* Scanner Overlay UI */}
            <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-3xl m-4 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-xl" />
            </div>
          </div>

          <button
            onClick={captureAndScan}
            disabled={isScanning}
            className="w-full bg-zinc-900 text-white rounded-2xl py-4 font-semibold text-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6" />
                <span>Scan Face</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pb-8">
          <div className="relative rounded-3xl overflow-hidden bg-zinc-100 aspect-square shadow-sm">
            {capturedImage && <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />}
            <button 
              onClick={resetScanner}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {scanResult?.type === 'ERROR' && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-center font-medium">
              {scanResult.message}
            </div>
          )}

          {scanResult?.type === 'MATCH' && scanResult.visitor && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">{scanResult.visitor.name}</h2>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider mt-1">
                  {scanResult.visitor.flatNo ? `Flat ${scanResult.visitor.flatNo}` : 'No Flat'} {scanResult.visitor.phone ? `• ${scanResult.visitor.phone}` : ''}
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Purpose of visit (Optional for Check In)"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCheckInOut('IN')}
                    className="bg-emerald-600 text-white rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform"
                  >
                    Check In
                  </button>
                  <button
                    onClick={() => handleCheckInOut('OUT')}
                    className="bg-zinc-900 text-white rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanResult?.type === 'NO_MATCH' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-3">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">New Visitor</h2>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">
                  Face not recognized. Please register.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 ml-1">Flat No <span className="text-zinc-400 font-normal lowercase capitalize-none">(Optional)</span></label>
                    <input type="text" value={flatNo} onChange={e => setFlatNo(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 ml-1">Phone <span className="text-zinc-400 font-normal lowercase capitalize-none">(Optional)</span></label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 ml-1">Purpose</label>
                  <input required type="text" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm active:scale-[0.98] transition-transform mt-2">
                  Register & Check In
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

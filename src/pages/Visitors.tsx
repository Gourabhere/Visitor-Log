import { useEffect, useState, useRef } from 'react';
import { db, type Visitor } from '../lib/db';
import { Search, User, Phone, Home, Trash2, Plus, Upload, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { loadModels, getFaceDescriptor } from '../lib/face';

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAdding, setIsAdding] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);
  
  // Form state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [newVisitor, setNewVisitor] = useState({ name: '', flatNo: '', phone: '', image: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.getVisitors().then(setVisitors);
    loadModels().catch(console.error);
  }, []);

  const filtered = visitors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    (v.flatNo && v.flatNo.toLowerCase().includes(search.toLowerCase())) ||
    (v.phone && v.phone.includes(search))
  );

  const handleDelete = async () => {
    if (!visitorToDelete) return;
    await db.deleteVisitor(visitorToDelete.id);
    setVisitors(await db.getVisitors());
    setVisitorToDelete(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setNewVisitor(prev => ({ ...prev, image: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitor.image || !newVisitor.name) {
      setError('Name and photo are required.');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const img = new Image();
      img.src = newVisitor.image;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const descriptor = await getFaceDescriptor(img);
      
      if (!descriptor) {
        setError('No face detected in the uploaded image. Please try a clearer photo.');
        setIsProcessing(false);
        return;
      }
      
      const visitor: Visitor = {
        id: crypto.randomUUID(),
        name: newVisitor.name,
        flatNo: newVisitor.flatNo,
        phone: newVisitor.phone,
        photoUrl: newVisitor.image,
        descriptor: Array.from(descriptor),
        registeredAt: Date.now(),
      };
      
      await db.saveVisitor(visitor);
      setVisitors(await db.getVisitors());
      
      // Reset form
      setIsAdding(false);
      setNewVisitor({ name: '', flatNo: '', phone: '', image: '' });
    } catch (err) {
      console.error(err);
      setError('Failed to process image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Visitors Directory</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by name, flat, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <User className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-medium">No visitors found</p>
          </div>
        ) : (
          filtered.map(visitor => (
            <div key={visitor.id} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                {visitor.photoUrl ? (
                  <img src={visitor.photoUrl} alt={visitor.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 m-4 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-zinc-900 truncate">{visitor.name}</h3>
                <div className="flex items-center space-x-3 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center"><Home className="w-3 h-3 mr-1" /> {visitor.flatNo ? `Flat ${visitor.flatNo}` : 'No Flat'}</span>
                  {visitor.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {visitor.phone}</span>}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 font-mono uppercase tracking-wider">
                  Registered: {format(visitor.registeredAt, 'MMM d, yyyy')}
                </p>
              </div>
              <button 
                onClick={() => setVisitorToDelete(visitor)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {visitorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Delete Visitor?</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Are you sure you want to delete <strong>{visitorToDelete.name}</strong>? This will also remove their check-in logs. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setVisitorToDelete(null)}
                className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-700 font-semibold rounded-xl active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl active:scale-95 transition-transform"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Visitor Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900">Add Visitor Manually</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="flex flex-col items-center justify-center mb-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-zinc-50 transition-colors relative group"
                >
                  {newVisitor.image ? (
                    <>
                      <img src={newVisitor.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-400">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-xs font-medium">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <input required type="text" value={newVisitor.name} onChange={e => setNewVisitor({...newVisitor, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 ml-1">Flat No <span className="text-zinc-400 font-normal lowercase capitalize-none">(Optional)</span></label>
                  <input type="text" value={newVisitor.flatNo} onChange={e => setNewVisitor({...newVisitor, flatNo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 ml-1">Phone <span className="text-zinc-400 font-normal lowercase capitalize-none">(Optional)</span></label>
                  <input type="tel" value={newVisitor.phone} onChange={e => setNewVisitor({...newVisitor, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing || !newVisitor.image || !newVisitor.name}
                className="w-full bg-emerald-600 text-white rounded-xl py-3.5 font-semibold text-sm active:scale-[0.98] transition-transform mt-4 disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing Face...
                  </>
                ) : (
                  'Save Visitor'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

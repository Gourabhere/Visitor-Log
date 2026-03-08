import { useEffect, useState } from 'react';
import { db, type Visitor } from '../lib/db';
import { Search, User, Phone, Home } from 'lucide-react';
import { format } from 'date-fns';

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    db.getVisitors().then(setVisitors);
  }, []);

  const filtered = visitors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.flatNo.toLowerCase().includes(search.toLowerCase()) ||
    v.phone.includes(search)
  );

  return (
    <div className="p-4 space-y-4">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { db, type Log, type Visitor } from '../lib/db';
import { format } from 'date-fns';
import { Clock, LogIn, LogOut, Search } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState<(Log & { visitor?: Visitor })[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      const allLogs = await db.getLogs();
      const logsWithVisitor = await Promise.all(
        allLogs.map(async (l) => ({
          ...l,
          visitor: await db.getVisitorById(l.visitorId),
        }))
      );
      setLogs(logsWithVisitor.sort((a, b) => b.timestamp - a.timestamp));
    }
    loadLogs();
  }, []);

  const filtered = logs.filter(l => 
    l.visitor?.name.toLowerCase().includes(search.toLowerCase()) || 
    l.visitor?.flatNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search logs by name or flat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-medium">No logs found</p>
          </div>
        ) : (
          filtered.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  log.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {log.type === 'IN' ? <LogIn className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{log.visitor?.name || 'Unknown'}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{log.visitor?.flatNo ? `Flat ${log.visitor?.flatNo}` : 'No Flat'}</p>
                  {log.purpose && (
                    <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-medium">
                      Purpose: {log.purpose}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  log.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {log.type}
                </span>
                <p className="text-xs text-zinc-900 font-medium mt-1">
                  {format(log.timestamp, 'HH:mm')}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {format(log.timestamp, 'MMM d')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

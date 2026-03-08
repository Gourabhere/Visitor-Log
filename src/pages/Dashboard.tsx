import { useEffect, useState } from 'react';
import { db, type Log, type Visitor } from '../lib/db';
import { format } from 'date-fns';
import { Users, LogIn, LogOut, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    currentlyInside: 0,
    todayEntries: 0,
    todayExits: 0,
  });
  const [recentLogs, setRecentLogs] = useState<(Log & { visitor?: Visitor })[]>([]);

  useEffect(() => {
    async function loadData() {
      const visitors = await db.getVisitors();
      const logs = await db.getLogs();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayLogs = logs.filter(l => l.timestamp >= today.getTime());
      
      // Calculate currently inside
      let insideCount = 0;
      for (const v of visitors) {
        const latestLog = await db.getLatestLogForVisitor(v.id);
        if (latestLog?.type === 'IN') {
          insideCount++;
        }
      }

      setStats({
        totalVisitors: visitors.length,
        currentlyInside: insideCount,
        todayEntries: todayLogs.filter(l => l.type === 'IN').length,
        todayExits: todayLogs.filter(l => l.type === 'OUT').length,
      });

      // Get recent 5 logs
      const recent = logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      const recentWithVisitor = await Promise.all(
        recent.map(async (l) => ({
          ...l,
          visitor: await db.getVisitorById(l.visitorId),
        }))
      );
      setRecentLogs(recentWithVisitor);
    }
    loadData();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-start space-y-2">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{stats.totalVisitors}</p>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Registered</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-start space-y-2">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{stats.currentlyInside}</p>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Currently Inside</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-start space-y-2">
          <div className="p-2 bg-zinc-50 rounded-xl">
            <LogIn className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{stats.todayEntries}</p>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Entries Today</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-start space-y-2">
          <div className="p-2 bg-zinc-50 rounded-xl">
            <LogOut className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{stats.todayExits}</p>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Exits Today</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider">Recent Activity</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
          {recentLogs.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-sm">No recent activity</div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden shrink-0">
                    {log.visitor?.photoUrl ? (
                      <img src={log.visitor.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 m-2.5 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{log.visitor?.name || 'Unknown'}</p>
                    <p className="text-xs text-zinc-500">{log.visitor?.flatNo ? `Flat ${log.visitor.flatNo}` : 'No Flat'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    log.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                  }`}>
                    {log.type}
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                    {format(log.timestamp, 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

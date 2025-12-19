import React, { useState, useEffect } from 'react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
      <h2 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Current Time</h2>
      <div className="text-4xl md:text-5xl font-bold text-slate-800 tabular-nums">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-slate-400 text-sm mt-2 font-medium">
        {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
};
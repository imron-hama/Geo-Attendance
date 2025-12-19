
import React, { useState, useEffect, useMemo } from 'react';
import { Clock as ClockIcon } from 'lucide-react';
import { Clock } from './components/Clock';
import { HistoryItem } from './components/HistoryItem';
import { Login } from './components/Login';
import { AdminSettings } from './components/AdminSettings';
import { WorkplaceMap } from './components/WorkplaceMap';
import { AttendanceRecord, AttendanceType, GeoLocation, User, UserRole, WorkplaceConfig } from './types';
import { api } from './services/api';
import { generateWorkSummary } from './services/geminiService';
import { MapPin, Loader2, RefreshCw, AlertTriangle, Sparkles, LogOut, Shield, Database, Settings, MessageSquare, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState<boolean>(false);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [wpConfig, setWpConfig] = useState<WorkplaceConfig | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [appError, setAppError] = useState<string | null>(null);
  
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [adminViewAll, setAdminViewAll] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Error catching for initialization
  useEffect(() => {
    const initApp = async () => {
        try {
            const user = await api.getCurrentUser();
            if (user) {
                setCurrentUser(user);
            }
        } catch (e: any) {
            console.error("Initialization Error:", e);
            // Don't set error for guest users
        }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (currentUser) {
        fetchLocation();
        loadRecords();
        loadWorkplaceConfig();
    }
  }, [currentUser]);

  useEffect(() => {
    if (location && wpConfig) {
      const d = calculateDistance(
        location.latitude, location.longitude,
        wpConfig.latitude, wpConfig.longitude
      );
      setDistance(d);
    }
  }, [location, wpConfig]);

  const loadWorkplaceConfig = async () => {
    try {
      const config = await api.getWorkplaceConfig();
      setWpConfig(config);
    } catch (e) {
      console.error("Config load error", e);
    }
  };

  const loadRecords = async () => {
    if (!currentUser) return;
    setLoadingRecords(true);
    try {
      const data = await api.getHistory(currentUser.id, currentUser.role);
      setRecords(data);
    } catch (e: any) {
      console.error("Failed to load records", e);
      setAppError("Failed to fetch history from database.");
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported.");
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoadingLocation(false);
      },
      (error) => {
        setLocationError("Unable to retrieve location. Please enable GPS.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAttendance = async (type: AttendanceType) => {
    if (!currentUser || !location) {
      alert("Missing user or location data.");
      return;
    }
    
    if (wpConfig && distance !== null) {
      if (distance > wpConfig.radiusMeters) {
        alert(`❌ อยู่นอกขอบเขตที่กำหนด!\nคุณอยู่ห่างจากจุดปักหมุด ${Math.round(distance)} เมตร (จำกัด ${wpConfig.radiusMeters} เมตร)`);
        return;
      }
    }

    setIsProcessing(true);
    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      type,
      timestamp: Date.now(),
      location: location,
      note: currentNote.trim(),
      synced: false
    };

    try {
      await api.saveRecord(newRecord);
      setRecords(prev => [newRecord, ...prev]);
      setCurrentNote(''); 
    } catch (error: any) {
      console.error("Attendance Error:", error);
      alert(`⚠️ บันทึกไม่สำเร็จ: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
        await api.logout();
        setCurrentUser(null);
    } catch (e) {
        console.error("Logout error", e);
        setCurrentUser(null); // Force clear even if API fails
    }
  };

  const handleGenerateSummary = async () => {
    if (displayRecords.length === 0) return;
    setGeneratingSummary(true);
    const summary = await generateWorkSummary(displayRecords);
    setAiSummary(summary);
    setGeneratingSummary(false);
  };

  const displayRecords = useMemo(() => {
    if (!currentUser) return [];
    return records.filter(record => adminViewAll ? true : record.userId === currentUser.id);
  }, [records, adminViewAll, currentUser?.id]);

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: AttendanceRecord[] } = {};
    displayRecords.forEach(record => {
      const date = new Date(record.timestamp);
      const dateKey = date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    return groups;
  }, [displayRecords]);

  const userRecords = useMemo(() => {
    if (!currentUser) return [];
    return records.filter(r => r.userId === currentUser.id);
  }, [records, currentUser?.id]);

  const isCheckedIn = userRecords.length > 0 && userRecords[0].type === AttendanceType.CHECK_IN;
  const isInRange = distance !== null && wpConfig && distance <= wpConfig.radiusMeters;

  if (appError) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-red-100">
                <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                <h1 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h1>
                <p className="text-slate-600 mb-6 text-sm">{appError}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
  }

  if (!currentUser) return <Login onLogin={setCurrentUser} />;
  if (showAdminSettings) return <AdminSettings onClose={() => { setShowAdminSettings(false); loadWorkplaceConfig(); }} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-${currentUser.avatarColor || 'indigo'}-500 shadow-sm ring-2 ring-white`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-slate-800 leading-tight">{currentUser.name}</h2>
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                        {currentUser.role}
                    </span>
                </div>
            </div>
            <div className="flex items-center space-x-1">
                {currentUser.role === UserRole.ADMIN && (
                    <button onClick={() => setShowAdminSettings(true)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Settings size={20} />
                    </button>
                )}
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                </button>
            </div>
        </div>

        {currentUser.role === UserRole.ADMIN && (
             <div className="flex bg-indigo-50 p-1 rounded-lg border border-indigo-100">
                <button onClick={() => setAdminViewAll(false)} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${!adminViewAll ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400'}`}>My Records</button>
                <button onClick={() => setAdminViewAll(true)} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${adminViewAll ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400'}`}>All Records</button>
             </div>
        )}

        <Clock />

        {/* Tracking Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-2">
                <div className={`flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${isInRange ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isInRange ? <CheckCircle2 size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                    {isInRange ? 'In Range' : 'Out of Range'}
                </div>
                {distance !== null && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Dist: {Math.round(distance)}m
                  </span>
                )}
             </div>
             <button onClick={fetchLocation} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-colors">
                <RefreshCw size={16} className={loadingLocation ? "animate-spin" : ""} />
             </button>
          </div>

          {wpConfig && (
            <WorkplaceMap 
              userLat={location?.latitude} 
              userLng={location?.longitude} 
              workplaceLat={wpConfig.latitude} 
              workplaceLng={wpConfig.longitude} 
              radius={wpConfig.radiusMeters} 
            />
          )}

          <div className="mt-4">
             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Remarks / Note</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MessageSquare size={14} />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Traffic jam, Working from home..." 
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                />
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAttendance(AttendanceType.CHECK_IN)}
            disabled={isCheckedIn || isProcessing || loadingLocation || !location}
            className={`p-6 rounded-2xl border-2 transition-all font-bold relative overflow-hidden flex flex-col items-center justify-center space-y-2 ${isCheckedIn ? 'bg-slate-50 border-slate-100 text-slate-300 shadow-none cursor-not-allowed' : 'bg-white border-green-500 text-green-700 hover:shadow-lg hover:-translate-y-1'}`}
          >
             {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
             <span>Check In</span>
             {isCheckedIn && <CheckCircle2 size={14} className="absolute top-2 right-2 text-green-500 opacity-50" />}
          </button>
          <button
            onClick={() => handleAttendance(AttendanceType.CHECK_OUT)}
            disabled={!isCheckedIn || isProcessing || loadingLocation || !location}
            className={`p-6 rounded-2xl border-2 transition-all font-bold relative overflow-hidden flex flex-col items-center justify-center space-y-2 ${!isCheckedIn ? 'bg-slate-50 border-slate-100 text-slate-300 shadow-none cursor-not-allowed' : 'bg-white border-red-500 text-red-700 hover:shadow-lg hover:-translate-y-1'}`}
          >
             {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <ArrowLeft size={24} />}
             <span>Check Out</span>
             {!isCheckedIn && records.length > 0 && <CheckCircle2 size={14} className="absolute top-2 right-2 text-red-500 opacity-50" />}
          </button>
        </div>

        {/* AI Summary */}
        {displayRecords.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-5 rounded-full blur-xl"></div>
             <div className="flex items-center justify-between mb-3">
               <h3 className="font-bold flex items-center text-xs tracking-wider uppercase">
                 <Sparkles size={14} className="mr-2 text-yellow-300" />
                 AI Summary Report
               </h3>
               {!aiSummary && (
                 <button 
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm uppercase"
                 >
                   {generatingSummary ? 'Analyzing...' : 'Generate report'}
                 </button>
               )}
             </div>
             {aiSummary && (
               <div className="text-xs text-indigo-50 leading-relaxed bg-black/10 p-3 rounded-lg border border-white/10 animate-in fade-in zoom-in-95 duration-300">
                 {aiSummary}
               </div>
             )}
          </div>
        )}

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center">
              <div className="bg-slate-200 p-1.5 rounded-lg text-slate-500 mr-3">
                <ClockIcon size={14} />
              </div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">
                Recent Activity
              </h3>
            </div>
            {loadingRecords && <Loader2 size={14} className="animate-spin text-slate-400" />}
          </div>
          
          <div className="space-y-6">
            {Object.keys(groupedRecords).length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <Database className="mx-auto text-slate-200 mb-2" size={32} />
                <p className="text-xs text-slate-400">No activity recorded yet</p>
              </div>
            ) : (
              Object.entries(groupedRecords).map(([date, dateRecords]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center space-x-2 px-1">
                    <span className="h-px bg-slate-200 flex-1"></span>
                    <h4 className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {date}
                    </h4>
                    <span className="h-px bg-slate-200 flex-1"></span>
                  </div>
                  {dateRecords.map(r => (
                    <HistoryItem 
                      key={r.id} 
                      record={r} 
                      showUserIdentity={adminViewAll} 
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

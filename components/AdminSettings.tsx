import React, { useState, useEffect, useRef } from 'react';
import { WorkplaceConfig } from '../types';
import { api } from '../services/api';
import { Save, MapPin, Navigation, ArrowLeft, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';

declare const L: any;

interface AdminSettingsProps {
  onClose: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<WorkplaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      const data = await api.getWorkplaceConfig();
      setConfig(data);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!config || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([config.latitude, config.longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
      
      mapInstance.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setConfig(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
      });
    }

    // Update marker
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([config.latitude, config.longitude], { draggable: true }).addTo(mapInstance.current);
    
    markerRef.current.on('dragend', (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      setConfig(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
    });

    // Update circle
    if (circleRef.current) circleRef.current.remove();
    circleRef.current = L.circle([config.latitude, config.longitude], {
      radius: config.radiusMeters,
      color: '#4f46e5'
    }).addTo(mapInstance.current);

  }, [config, loading]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateWorkplaceConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Improved Header with Back Button */}
      <div className="p-4 border-b flex items-center bg-white sticky top-0 z-20 shadow-sm">
        <button 
          onClick={onClose} 
          className="flex items-center space-x-1 px-3 py-2 -ml-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-bold">กลับหน้าหลัก</span>
        </button>
        <h2 className="flex-1 text-center font-bold text-slate-800 pr-20">ตั้งค่าสถานที่</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold mb-1">Geofencing Setup</h3>
            <p className="text-xs text-indigo-100 leading-relaxed">
              กำหนดขอบเขตพื้นที่ที่อนุญาตให้พนักงานลงเวลาเข้า-ออกงานได้โดยอิงจากพิกัด GPS
            </p>
          </div>
          <Navigation className="absolute bottom-[-10px] right-[-10px] text-white/10" size={80} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 px-1">
             <MapPin size={16} className="text-indigo-600" />
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Map Location</h4>
          </div>
          <div className="h-72 rounded-2xl border-2 border-white overflow-hidden shadow-xl ring-1 ring-slate-200">
            <div ref={mapRef} className="w-full h-full"></div>
          </div>
          <p className="text-[10px] text-center text-slate-400 italic">** คลิกที่แผนที่หรือลากหมุดเพื่อเปลี่ยนตำแหน่งพิกัด</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-3 rounded-xl border border-slate-200">
             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">พิกัดละติจูด</label>
             <input readOnly value={config?.latitude.toFixed(6)} className="w-full bg-transparent font-mono text-sm text-slate-600 outline-none" />
           </div>
           <div className="bg-white p-3 rounded-xl border border-slate-200">
             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">พิกัดลองจิจูด</label>
             <input readOnly value={config?.longitude.toFixed(6)} className="w-full bg-transparent font-mono text-sm text-slate-600 outline-none" />
           </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-4 flex justify-between items-center">
            <span>รัศมีที่อนุญาต (เมตร)</span>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs">{config?.radiusMeters} m</span>
          </label>
          <input 
            type="range" 
            min="50" 
            max="2000" 
            step="50"
            value={config?.radiusMeters}
            onChange={(e) => setConfig(prev => prev ? { ...prev, radiusMeters: parseInt(e.target.value) } : null)}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
            <span>50m</span>
            <span>1km</span>
            <span>2km</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 fixed bottom-0 left-0 right-0 z-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full max-w-md mx-auto py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 ${
            success ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {saving ? <Loader2 className="animate-spin mr-2" /> : success ? <CheckCircle className="mr-2" /> : <Save className="mr-2" />}
          {saving ? 'กำลังบันทึก...' : success ? 'บันทึกเรียบร้อยแล้ว' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
};
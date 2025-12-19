import React from 'react';
import { AttendanceRecord, AttendanceType } from '../types';
import { MapPin, Clock, ArrowRight, ArrowLeft, User, MessageSquare } from 'lucide-react';

interface HistoryItemProps {
  record: AttendanceRecord;
  showUserIdentity?: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ record, showUserIdentity = false }) => {
  const isCheckIn = record.type === AttendanceType.CHECK_IN;
  const date = new Date(record.timestamp);

  return (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-colors">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCheckIn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
        {isCheckIn ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`text-sm font-bold ${isCheckIn ? 'text-green-700' : 'text-red-700'}`}>
              {isCheckIn ? 'Clocked In' : 'Clocked Out'}
            </h3>
            {showUserIdentity && (
              <p className="text-xs font-semibold text-slate-800 flex items-center mt-0.5">
                <User size={10} className="mr-1" />
                {record.userName} <span className="ml-1 text-slate-400 font-normal">({record.userRole})</span>
              </p>
            )}
          </div>
          <span className="text-xs text-slate-400 tabular-nums">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          <p className="text-[11px] text-slate-500 flex items-center">
            <Clock size={11} className="mr-1" />
            {date.toLocaleDateString()}
          </p>
          
          {record.location && (
            <a 
              href={`https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-500 flex items-center hover:underline truncate max-w-[150px]"
            >
              <MapPin size={11} className="mr-1" />
              Location
            </a>
          )}
        </div>

        {record.note && (
          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-start">
            <MessageSquare size={12} className="text-slate-400 mr-2 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-600 italic leading-relaxed">
              "{record.note}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
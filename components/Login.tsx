import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { Lock, User as UserIcon, LogIn, Loader2, Mail, UserPlus, Shield, GraduationCap, School, AlertCircle, ExternalLink } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-login check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          onLogin(user);
        }
      } catch (e) {
        // No session
      }
    };
    checkSession();
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name) throw new Error("Name is required");
        const user = await api.register(email, password, name, role);
        onLogin(user);
      } else {
        const user = await api.login(email, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
  };

  // Check if error is related to email confirmation
  const isEmailConfirmationError = error.includes("Email not confirmed") || error.includes("Email confirmation is enabled");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
             {isRegistering ? <UserPlus className="text-white" size={32} /> : <UserIcon className="text-white" size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isRegistering ? 'Create Account' : 'HR Attendance'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">GeoAttend Map</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register-only fields */}
          {isRegistering && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="John Doe"
                    required={isRegistering}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: UserRole.STUDENT, icon: GraduationCap, label: 'Student' },
                    { val: UserRole.TEACHER, icon: School, label: 'Teacher' },
                    { val: UserRole.ADMIN, icon: Shield, label: 'Admin' }
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setRole(r.val)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                        role === r.val 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <r.icon size={20} className="mb-1" />
                      <span className="text-xs font-medium">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                placeholder="name@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className={`p-4 rounded-lg flex flex-col items-start gap-2 ${isEmailConfirmationError ? 'bg-orange-50 text-orange-800 border border-orange-200' : 'bg-red-50 text-red-600'}`}>
              <div className="flex items-center">
                <AlertCircle className="shrink-0 mr-2" size={18} />
                <span className="text-sm font-semibold">{isEmailConfirmationError ? 'Action Required' : 'Login Failed'}</span>
              </div>
              <p className="text-sm">{error}</p>
              
              {isEmailConfirmationError && (
                <div className="w-full mt-2 pt-2 border-t border-orange-200">
                  <p className="text-xs text-orange-700 mb-2">
                    Supabase requires email confirmation by default. Since you don't have an email provider set up, you must disable this setting.
                  </p>
                  <a 
                    href="https://supabase.com/dashboard/project/klpuwzhpumaudopwmmab/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-md text-xs font-bold transition-colors"
                  >
                    Go to Supabase Settings <ExternalLink size={12} className="ml-1" />
                  </a>
                  <p className="text-[10px] text-orange-600 mt-1 text-center">
                    Navigate to: Authentication &gt; Providers &gt; Email &gt; Toggle OFF "Confirm email"
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : (isRegistering ? <UserPlus size={20} className="mr-2" /> : <LogIn size={20} className="mr-2" />)}
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button 
            onClick={toggleMode}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
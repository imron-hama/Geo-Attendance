
import { AttendanceRecord, User, UserRole, WorkplaceConfig } from '../types';
import { supabase } from '../lib/supabase';

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("No user data returned");
    const metadata = data.user.user_metadata || {};
    return {
      id: data.user.id,
      username: data.user.email || email,
      name: metadata.name || data.user.email?.split('@')[0] || 'Unknown User',
      role: (metadata.role as UserRole) || UserRole.STUDENT,
      avatarColor: metadata.avatarColor || 'gray'
    };
  },

  register: async (email: string, password: string, name: string, role: UserRole): Promise<User> => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'indigo', 'pink'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name, role, avatarColor: randomColor } }
    });
    if (error) throw new Error(error.message);
    if (data.user && !data.session) throw new Error("Email confirmation is enabled in Supabase.");
    if (!data.user) throw new Error("Registration failed.");
    const metadata = data.user.user_metadata || {};
    return {
      id: data.user.id,
      username: data.user.email || email,
      name: metadata.name || name,
      role: (metadata.role as UserRole) || role,
      avatarColor: metadata.avatarColor || randomColor
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const metadata = session.user.user_metadata || {};
    return {
      id: session.user.id,
      username: session.user.email || '',
      name: metadata.name || session.user.email?.split('@')[0] || 'Unknown',
      role: (metadata.role as UserRole) || UserRole.STUDENT,
      avatarColor: metadata.avatarColor || 'gray'
    };
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  getHistory: async (userId?: string, role?: UserRole): Promise<AttendanceRecord[]> => {
    let query = supabase.from('attendance').select('*');
    
    // Security: Only fetch all records if user is an ADMIN
    // Otherwise, strictly filter by userId
    if (role !== UserRole.ADMIN) {
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        return []; // Safety fallback
      }
    }
    
    const { data, error } = await query.order('timestamp', { ascending: false });
    
    if (error) {
      console.error("Fetch History Error:", error);
      return [];
    }
    return data.map((row: any) => ({
      id: row.id, userId: row.user_id, userName: row.user_name, userRole: row.user_role as UserRole,
      type: row.type, timestamp: row.timestamp, location: row.location, synced: true, note: row.note
    }));
  },

  saveRecord: async (record: AttendanceRecord): Promise<AttendanceRecord> => {
    const dbPayload = {
      id: record.id, 
      user_id: record.userId, 
      user_name: record.userName, 
      user_role: record.userRole,
      type: record.type, 
      timestamp: record.timestamp, 
      location: record.location,
      note: record.note
    };
    
    const { error } = await supabase.from('attendance').insert([dbPayload]);
    
    if (error) {
      console.error("Supabase Save Error:", error);
      throw new Error(`Supabase Error: ${error.message}`);
    }
    
    return { ...record, synced: true };
  },

  getWorkplaceConfig: async (): Promise<WorkplaceConfig> => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'workplace').single();
    if (error) {
      return { latitude: 13.7563, longitude: 100.5018, radiusMeters: 500 };
    }
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMeters: data.radius_meters
    };
  },

  updateWorkplaceConfig: async (config: WorkplaceConfig): Promise<void> => {
    const { error } = await supabase.from('settings').upsert({
      id: 'workplace',
      latitude: config.latitude,
      longitude: config.longitude,
      radius_meters: config.radiusMeters
    });
    if (error) throw new Error("Failed to update settings: " + error.message);
  }
};

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://klpuwzhpumaudopwmmab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscHV3emhwdW1hdWRvcHdtbWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5Njc5MTMsImV4cCI6MjA4MTU0MzkxM30.TCirZuBhwrq75euu4fITMPvGnRqQLM0uLUn93-k-Af4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
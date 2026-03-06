import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fqvpfayvivvglndqjstc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdnBmYXl2aXZ2Z2xuZHFqc3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjQzMzksImV4cCI6MjA4ODM0MDMzOX0.YG16Ih5w_7gfmC-r4FJEoHXo47qOflTLZe3WkTXhprI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

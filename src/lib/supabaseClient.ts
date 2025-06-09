import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bwgkpymchviutppyooor.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Z2tweW1jaHZpdXRwcHlvb29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MTA0NDksImV4cCI6MjA1OTk4NjQ0OX0.vVX2E6NeaBH63SyWVHb66q-SC56yzRqUSOOHQDwRFL0';

// Handle SSR - Check if window is defined (client-side) before creating the client
const isSSR = typeof window === 'undefined';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isSSR ? undefined : AsyncStorage,
    autoRefreshToken: !isSSR,
    persistSession: !isSSR,
    detectSessionInUrl: !isSSR,
  },
}); 
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL e chave fixas — não usar env vars pois o Vercel pode ter variáveis
// apontando para outro projeto. A anon key é pública por design (client-side safe).
const SUPABASE_URL = 'https://brlqkqinpasdaotsyrob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybHFrcWlucGFzZGFvdHN5cm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTA4MTgsImV4cCI6MjA5NDg2NjgxOH0.myey0hSk8i5rDAMIM8NAFJeXSq19J4C2cS2m5FriHKc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

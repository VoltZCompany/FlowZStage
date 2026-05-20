import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL e chave fixas — não usar env vars pois o Vercel pode ter variáveis
// apontando para outro projeto. A anon key é pública por design (client-side safe).
const SUPABASE_URL = 'https://edbhjvzrrozsbbqorgfu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ej3hM5-uHuS_9Sz8tUFgog_m7R6iRfH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

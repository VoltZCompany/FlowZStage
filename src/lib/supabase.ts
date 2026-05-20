import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL e chave fixas — não usar env vars pois o Vercel pode ter variáveis
// apontando para outro projeto. A anon key é pública por design (client-side safe).
const SUPABASE_URL = 'https://rziiztwvwdggyekstamr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LBwflM-nWvJ_RSIoldG_Gg_112ZWeAL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

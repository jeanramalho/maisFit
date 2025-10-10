// Client Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jiylnsdhcyexxmsbqibs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeWxuc2RoY3lleHhtc2JxaWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDE3OTcsImV4cCI6MjA3NTM3Nzc5N30.6utK5xjiVNwxLGrdyBkiRp8uHbIhQS4h9VE9PhcNuYg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
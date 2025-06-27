import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqjutktofptxzwycfdiw.supabase.co'; // TODO: Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxanV0a3RvZnB0eHp3eWNmZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5Mzg1NjMsImV4cCI6MjA2NjUxNDU2M30.Vxx0RYVENdR0TRqFsXrj4WhXUVp9l6a4BjLkn4zFeU4'; // TODO: Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
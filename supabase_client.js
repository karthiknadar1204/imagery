
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://usrerccavvwfufmurmun.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcmVyY2NhdnZ3ZnVmbXVybXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyODE0ODYsImV4cCI6MjA2Mjg1NzQ4Nn0.ohoduYXqR4MlWM7VVWqlTbIMQ6P9nE_OORW5SPUG9Rs'
export const supabase = createClient(supabaseUrl, supabaseKey)
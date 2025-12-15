import { createClient } from '@supabase/supabase-js'

// REPLACE THESE WITH YOUR ACTUAL KEYS FROM PHASE 1
const supabaseUrl = 'https://ipkrbmncjjaurfrziunk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwa3JibW5jamphdXJmcnppdW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzA0MDUsImV4cCI6MjA4MTM0NjQwNX0.OGTceQr_ez5-ckzFhEFGWVemnB4HYtDJacuJDigWuKE'

export const supabase = createClient(supabaseUrl, supabaseKey)
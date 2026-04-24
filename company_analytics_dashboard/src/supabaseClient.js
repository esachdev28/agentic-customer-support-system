import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbnaqqycyohsaechkpfm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibmFxcXljeW9oc2FlY2hrcGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODc2NjgsImV4cCI6MjA5MjI2MzY2OH0.lnCpPPa2iEGIfbTHOAlzw_F4L2SPEDAPCv3pQWMS1vI';

export const supabase = createClient(supabaseUrl, supabaseKey);

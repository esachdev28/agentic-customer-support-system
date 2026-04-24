const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mbnaqqycyohsaechkpfm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibmFxcXljeW9oc2FlY2hrcGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODc2NjgsImV4cCI6MjA5MjI2MzY2OH0.lnCpPPa2iEGIfbTHOAlzw_F4L2SPEDAPCv3pQWMS1vI');
async function test() {
  await supabase.from('messages').insert([{sender: 'bot', content: 'test insert'}]);
  console.log('inserted');
}
test();

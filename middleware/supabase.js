const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://qnklgihlazkpiwsfdlpu.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const supabaseTenantUrl = 'https://wumwtcghvhxdpgctsoyy.supabase.co';
const supabaseTenantKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXd0Y2dodmh4ZHBnY3Rzb3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0OTEzNzUsImV4cCI6MjA0OTA2NzM3NX0.yA-Vhq1ojutM1ol5K90LKSTk9zfRgUPHyHNoMi3PHes';

const supabaseTenant = createClient(supabaseTenantUrl, supabaseTenantKey);


module.exports = {supabase ,supabaseTenant};

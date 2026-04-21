// ============================================
// TechOL — Supabase Configuration (FREE)
// ============================================
// SETUP:
// 1. Go to https://supabase.com → Sign up free with GitHub
// 2. Click "New Project" → Name it "TechOL"
// 3. Set a database password (save it!)
// 4. Wait for project to initialize (~2 min)
// 5. Go to Project Settings → API
// 6. Copy "Project URL" and "anon public" key below
// 7. Run the SQL from schema.sql in SQL Editor
// 8. Enable Google Auth in Authentication → Providers

const SUPABASE_URL = 'https://mnfmqimrgkuqqcleclzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZm1xaW1yZ2t1cXFjbGVjbHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzM3OTUsImV4cCI6MjA4NzcwOTc5NX0.0CB-4T0gnCin-OCdBVqlENPDBaIpYB8CTs1fxOegkWw';

let supabaseClient = null;
let isSupabaseReady = false;

function isConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

function initializeApp() {
  if (!isConfigured()) {
    console.warn('⚠️ TechOL: Supabase not configured. Add your credentials.');
    showSetupScreen();
    return;
  }
  try {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    isSupabaseReady = true;
    console.log('✅ TechOL: Connected to Supabase');
  } catch (e) {
    console.error('Supabase init error:', e);
    showSetupScreen();
  }
}

function showSetupScreen() {
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);padding:24px">
      <div style="max-width:560px;width:100%;background:var(--bg-card);border:1px solid var(--border-primary);border-radius:28px;padding:48px;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">⚡</div>
        <h1 style="font-size:28px;font-weight:800;margin-bottom:8px">TechOL Setup Required</h1>
        <p style="color:var(--text-secondary);margin-bottom:32px;line-height:1.6">Connect TechOL to Supabase (100% free, no credit card).</p>
        <div style="text-align:left;background:var(--bg-input);border-radius:16px;padding:24px;margin-bottom:24px">
          <div style="font-weight:600;margin-bottom:16px;color:var(--accent)">Quick Setup Guide</div>
          <ol style="color:var(--text-secondary);font-size:14px;line-height:2.2;padding-left:20px">
            <li>Go to <a href="https://supabase.com" target="_blank" style="color:var(--accent)">supabase.com</a> → Sign up with GitHub (free)</li>
            <li>Click <strong>"New Project"</strong> → Name it "TechOL" → Set a password</li>
            <li>Wait ~2 min for project to initialize</li>
            <li>Go to <strong>SQL Editor</strong> → Paste contents of <code style="background:var(--accent-subtle);padding:2px 6px;border-radius:4px;color:var(--accent)">schema.sql</code> → Click Run</li>
            <li>Go to <strong>Project Settings → API</strong></li>
            <li>Copy <strong>"Project URL"</strong> and <strong>"anon public"</strong> key</li>
            <li>Paste into <code style="background:var(--accent-subtle);padding:2px 6px;border-radius:4px;color:var(--accent)">js/supabase-config.js</code></li>
            <li>For Google login: <strong>Authentication → Providers → Google</strong> → Enable</li>
            <li>Refresh this page!</li>
          </ol>
        </div>
        <p style="font-size:12px;color:var(--text-tertiary)">Supabase free tier: 50K users, 500MB database, 1GB storage — no credit card.</p>
      </div>
    </div>`;
  const loader = document.getElementById('loading-screen');
  if (loader) loader.remove();
}

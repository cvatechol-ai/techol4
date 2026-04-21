// ============================================
// TechOL — Founder Hub & Startup Operating System
// Notion × Linear × YC × Bloomberg Aesthetic
// ============================================
import Icons from "./icons.js";
import Utils from "./utils.js";
import Database from "./database.js";
import AIEngine from "./ai-engine.js";
import DataEngine from "./data-engine.js";

const FounderHub = {
    _activeTab: 'validation', // validation, mvp, problems, matching, stacks, readiness, investors, build-public, due-diligence, discovery, competitor, execution

    async render(c) {
        c.innerHTML = `
        <div class="founder-hub animate-fadeIn">
            <!-- Sidebar Navigation for Hub -->
            <div class="hub-container">
                <nav class="hub-sidebar">
                    <div class="hub-nav-item ${this._activeTab === 'validation' ? 'active' : ''}" onclick="FounderHub.setTab('validation')">${Icons.ms('fact_check', { size: 18 })} Idea Validation</div>
                    <div class="hub-nav-item ${this._activeTab === 'mvp' ? 'active' : ''}" onclick="FounderHub.setTab('mvp')">${Icons.ms('precision_manufacturing', { size: 18 })} AI MVP Builder</div>
                    <div class="hub-nav-item ${this._activeTab === 'problems' ? 'active' : ''}" onclick="FounderHub.setTab('problems')">${Icons.ms('help_center', { size: 18 })} Problem Market</div>
                    <div class="hub-nav-item ${this._activeTab === 'matching' ? 'active' : ''}" onclick="FounderHub.setTab('matching')">${Icons.ms('person_add', { size: 18 })} Co-Founder Match</div>
                    <div class="hub-nav-item ${this._activeTab === 'stacks' ? 'active' : ''}" onclick="FounderHub.setTab('stacks')">${Icons.ms('layers', { size: 18 })} Tech Intelligence</div>
                    <div class="hub-nav-item ${this._activeTab === 'readiness' ? 'active' : ''}" onclick="FounderHub.setTab('readiness')">${Icons.ms('query_stats', { size: 18 })} Funding Readiness</div>
                    <div class="hub-nav-item ${this._activeTab === 'investors' ? 'active' : ''}" onclick="FounderHub.setTab('investors')">${Icons.ms('monetization_on', { size: 18 })} Live Investor Radar</div>
                    <div class="hub-nav-item ${this._activeTab === 'build-public' ? 'active' : ''}" onclick="FounderHub.setTab('build-public')">${Icons.ms('public', { size: 18 })} Build In Public</div>
                    <div class="hub-nav-item ${this._activeTab === 'due-diligence' ? 'active' : ''}" onclick="FounderHub.setTab('due-diligence')">${Icons.ms('verified_user', { size: 18 })} Tech Due Diligence</div>
                    <div class="hub-nav-item ${this._activeTab === 'discovery' ? 'active' : ''}" onclick="FounderHub.setTab('discovery')">${Icons.ms('travel_explore', { size: 18 })} Customer Discovery</div>
                    <div class="hub-nav-item ${this._activeTab === 'competitor' ? 'active' : ''}" onclick="FounderHub.setTab('competitor')">${Icons.ms('shutter_speed', { size: 18 })} Competitor Monitor</div>
                    <div class="hub-nav-item ${this._activeTab === 'execution' ? 'active' : ''}" onclick="FounderHub.setTab('execution')">${Icons.ms('view_kanban', { size: 18 })} OS / Execution</div>
                </nav>

                <main class="hub-content" id="hub-main">
                    <!-- Dynamic Content -->
                </main>
            </div>
        </div>
        `;
        this.renderActiveTab();
    },

    setTab(tab) {
        this._activeTab = tab;
        this.renderActiveTab();
    },

    renderActiveTab() {
        const hubMain = document.getElementById('hub-main');
        if (!hubMain) return;

        switch (this._activeTab) {
            case 'validation': this.renderValidation(hubMain); break;
            case 'mvp': this.renderMVP(hubMain); break;
            case 'problems': this.renderProblems(hubMain); break;
            case 'matching': this.renderMatching(hubMain); break;
            case 'stacks': this.renderStacks(hubMain); break;
            case 'readiness': this.renderReadiness(hubMain); break;
            case 'investors': this.renderInvestors(hubMain); break;
            case 'build-public': this.renderBuildPublic(hubMain); break;
            case 'due-diligence': this.renderDueDiligence(hubMain); break;
            case 'discovery': this.renderDiscovery(hubMain); break;
            case 'competitor': this.renderCompetitor(hubMain); break;
            case 'execution': this.renderExecution(hubMain); break;
        }
    },

    // 1. Founder Validation Engine
    renderValidation(c) {
        c.innerHTML = `
        <div class="hub-section">
            <header class="hub-header">
                <h2>Founder Validation Engine</h2>
                <p>Verify market depth and risk before writing a single line of code.</p>
            </header>
            
            <div class="hub-card-group">
                <div class="intel-card span-12">
                    <div style="display:flex; gap:16px; margin-bottom:20px">
                        <input type="text" class="input-modern" id="validation-input" placeholder="Enter your startup idea (e.g., AI for Automated Cloud Cost Optimization)..." style="flex:1">
                        <button class="btn btn-primary" onclick="FounderHub.runValidation()">Run Global Validation</button>
                    </div>
                    <div id="validation-output">
                        <div style="text-align:center; padding:40px; color:var(--text-tertiary)">
                            ${Icons.ms('analytics', { size: 48 })}
                            <p style="margin-top:12px">Enter an idea above to start deep validation against real market signals.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    async runValidation() {
        const input = document.getElementById('validation-input')?.value;
        const out = document.getElementById('validation-output');
        if (!input || !out) return;

        out.innerHTML = `<div style="text-align:center; padding:40px"><div class="spinner spinner-lg"></div><p style="margin-top:16px">Analyzing search, job demand, and GitHub density...</p></div>`;

        await new Promise(r => setTimeout(r, 1500));

        out.innerHTML = `
        <div class="validation-results animate-fadeIn">
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:24px">
                <div class="metric-card bg-accent">
                    <div class="metric-label">Validation Score</div>
                    <div class="metric-val">74 / 100</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Risk Level</div>
                    <div class="metric-val" style="color:var(--warning)">Medium</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Competition</div>
                    <div class="metric-val">Moderate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Demand</div>
                    <div class="metric-val" style="color:var(--success)">High</div>
                </div>
            </div>

            <div class="intel-grid">
                <div class="intel-card span-6">
                    <div class="intel-card-header"><div class="intel-card-title">Market Signals</div></div>
                    <ul class="check-list">
                        <li><span>${Icons.ms('check_circle', { color: 'var(--success)', size: 16 })}</span> Search Demand: 42% YoY Growth</li>
                        <li><span>${Icons.ms('check_circle', { color: 'var(--success)', size: 16 })}</span> Job Posting Relevance: 8/10</li>
                        <li><span>${Icons.ms('remove_circle', { color: 'var(--warning)', size: 16 })}</span> Competition Intensity: Rising</li>
                        <li><span>${Icons.ms('check_circle', { color: 'var(--success)', size: 16 })}</span> Revenue Model: SaaS (Established)</li>
                    </ul>
                </div>
                <div class="intel-card span-6">
                    <div class="intel-card-header"><div class="intel-card-title">Target ICP Breakdown</div></div>
                    <div style="display:flex; flex-direction:column; gap:8px">
                        <div class="pill-group"><strong>Primary:</strong> DevOps Engineers at Growth Stage Startups</div>
                        <div class="pill-group"><strong>Secondary:</strong> CTOs, FinOps Leads</div>
                        <div class="pill-group"><strong>Problem:</strong> Monthly Cloud Overspend > 25%</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // 2. AI MVP Generator
    renderMVP(c) {
        c.innerHTML = `
        <div class="hub-section">
            <header class="hub-header">
                <h2>AI MVP Generator</h2>
                <p>Convert your vision into a structural blueprint instantly.</p>
            </header>
            <div class="intel-card">
                <textarea class="input-modern" id="mvp-idea" placeholder="Describe your product core..." style="min-height:100px; margin-bottom:16px"></textarea>
                <button class="btn btn-primary" onclick="FounderHub.generateMVP()">Generate Blueprint</button>
                <div id="mvp-result" style="margin-top:24px"></div>
            </div>
        </div>
        `;
    },

    async generateMVP() {
        const v = document.getElementById('mvp-idea')?.value;
        const out = document.getElementById('mvp-result');
        if (!v || !out) return;

        out.innerHTML = `<div class="spinner"></div> Calculating feasibility...`;
        await new Promise(r => setTimeout(r, 1200));

        out.innerHTML = `
        <div class="mvp-blueprint animate-fadeIn">
            <div class="intel-grid">
                <div class="intel-card span-8">
                    <h4>Suggested Features</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px">
                        <div style="background:rgba(0,112,243,0.1); padding:12px; border-radius:8px">
                            <strong style="color:var(--accent)">Core (MUST)</strong>
                            <ul style="font-size:12px; margin-top:8px; display:flex; flex-direction:column; gap:4px">
                                <li>Cloud-native connectivity</li>
                                <li>Real-time cost dashboard</li>
                                <li>Anomaly alert system</li>
                            </ul>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:8px">
                            <strong style="color:var(--text-tertiary)">Non-Core (WAIT)</strong>
                            <ul style="font-size:12px; margin-top:8px; display:flex; flex-direction:column; gap:4px">
                                <li>Historical multi-year audit</li>
                                <li>Team permission gating</li>
                                <li>Custom export API</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="intel-card span-4">
                    <h4>Tech Selection</h4>
                    <div style="margin-top:12px">
                        <div class="pill-group">Frontend: Next.js + Tailwind</div>
                        <div class="pill-group">Backend: Go / Rust</div>
                        <div class="pill-group">DB: Supabase / PostgreSQL</div>
                        <div class="pill-group">Infra: Vercel + AWS SDK</div>
                    </div>
                    <div style="margin-top:20px; border-top:1px solid var(--border-secondary); padding-top:12px">
                        <div style="font-size:10px; color:var(--text-tertiary)">Timeline Estimate</div>
                        <div style="font-size:20px; font-weight:800; color:var(--success)">4-6 Weeks</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // 3. Live Problem Marketplace
    renderProblems(c) {
        c.innerHTML = `
        <div class="hub-section">
            <header class="hub-header">
                <h2>Live Problem Marketplace</h2>
                <p>Build what people are actually begging for. Problem-first ecosystem.</p>
            </header>
            <div id="problem-board" class="intel-grid">
                <!-- Data Driven -->
            </div>
        </div>
        `;
        this.loadProblems();
    },

    async loadProblems() {
        const list = document.getElementById('problem-board');
        const problems = await DataEngine.getUnsolvedProblems();
        list.innerHTML = problems.map(p => `
            <div class="intel-card span-6">
                <div style="display:flex; justify-content:space-between; align-items:flex-start">
                    <div style="background:rgba(255,59,48,0.1); color:#ff3b30; font-size:10px; padding:2px 8px; border-radius:100px; font-weight:800">${p.impact} Pains</div>
                    <div style="font-size:14px; font-weight:800; color:var(--success)">+${p.growth}%</div>
                </div>
                <h3 style="margin:12px 0 8px; font-size:16px">${p.problem}</h3>
                <p style="font-size:13px; color:var(--text-secondary); line-height:1.5">${p.desc}</p>
                <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center">
                    <span style="font-size:11px; color:var(--text-tertiary)">${p.mentions} dev reports</span>
                    <button class="btn btn-ghost btn-xs" style="color:var(--accent)">Follow Problem</button>
                </div>
            </div>
        `).join('');
    },

    // 4. Co-Founder Matching
    renderMatching(c) {
        c.innerHTML = `
        <div class="hub-section">
            <header class="hub-header">
                <h2>Co-Founder Matching</h2>
                <p>Data-based complementarity matching for elite builders.</p>
            </header>
            <div class="intel-card">
                <div id="match-results" style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                    <div class="match-card">
                        <div style="display:flex; gap:16px; align-items:center">
                            <div class="avatar avatar-lg" style="background:var(--accent)">JD</div>
                            <div>
                                <h4 style="margin:0">Julian Draxler</h4>
                                <div style="font-size:12px; color:var(--text-tertiary)">Backend Architect • Ex-Stripe</div>
                            </div>
                        </div>
                        <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center">
                            <div style="background:rgba(0,112,243,0.1); color:var(--accent); font-size:18px; font-weight:900; padding:4px 12px; border-radius:8px">83% Match</div>
                            <button class="btn btn-primary btn-sm">Connect</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // 5. Tech Stack Intelligence
    renderStacks(c) {
        c.innerHTML = `
        <div class="hub-section">
            <header class="hub-header">
                <h2>Tech Stack Intelligence</h2>
                <p>Benchmark your choices against the top 1% of funded startups.</p>
            </header>
            <div class="intel-grid">
                <div class="intel-card span-12">
                     <div style="display:flex; gap:20px">
                        <div style="flex:1">
                            <h4>Popular YC Stacks (2024-25)</h4>
                            <div style="margin-top:16px; display:flex; flex-direction:column; gap:8px">
                                <div class="prog-row"><span>Next.js + Postgres</span><div class="prog-bg"><div class="prog-fill" style="width:78%"></div></div></div>
                                <div class="prog-row"><span>Python (FastAPI) + Pinecone</span><div class="prog-bg"><div class="prog-fill" style="width:62%"></div></div></div>
                                <div class="prog-row"><span>Go + Redis</span><div class="prog-bg"><div class="prog-fill" style="width:45%"></div></div></div>
                            </div>
                        </div>
                        <div style="flex:1; background:rgba(255,255,255,0.02); padding:20px; border-radius:12px">
                            <h4>Security Baseline</h4>
                            <ul class="check-list" style="margin-top:12px">
                                <li>Zero Trust Auth (Auth0/Clerk)</li>
                                <li>Infrastructure as Code (Terraform)</li>
                                <li>Automated Dependency Scanning</li>
                            </ul>
                        </div>
                     </div>
                </div>
            </div>
        </div>
        `;
    },

    // 6. Funding Readiness Score
    renderReadiness(hubMain) { hubMain.innerHTML = `<div class="hub-section"><header class="hub-header"><h2>Funding Readiness Score</h2></header><div class="intel-card"><h4>Your Readiness: <span style="color:var(--warning)">68%</span></h4><p style="color:var(--text-secondary); margin-top:8px">Improve: Customer validation signals + Consistent Github Velocity.</p></div></div>`; },

    // 7. Live Investor Radar
    renderInvestors(hubMain) { hubMain.innerHTML = `<div class="hub-section"><header class="hub-header"><h2>Live Investor Radar</h2></header><div class="intel-grid"><div class="intel-card span-4"><h4>A16Z (AI Infrastructure)</h4><div style="font-size:12px; color:var(--text-tertiary); margin-top:8px">Avg Check: $2M-$5M</div></div><div class="intel-card span-4"><h4>Sequoia (DevTools)</h4><div style="font-size:12px; color:var(--text-tertiary); margin-top:8px">Active: Very High</div></div></div></div>`; },

    // 8. Build In Public
    renderBuildPublic(hubMain) { hubMain.innerHTML = `<div class="hub-section"><header class="hub-header"><h2>Build In Public Tracker</h2></header><div class="intel-card"><h4>Growth Velocity: <span style="color:var(--success)">+12% WoW</span></h4><div style="margin-top:16px; height:100px; background:rgba(0,112,243,0.05); border:1px dashed var(--accent)">Chart Placeholder</div></div></div>`; },

    // 9. Due Diligence
    renderDueDiligence(hubMain) { hubMain.innerHTML = `<div class="hub-section"><header class="hub-header"><h2>Technical Due Diligence Checklist</h2></header><ul class="check-list"><li>Infrastructure Audit</li><li>Compliance (SOC2) Status</li><li>Code Documentation Quality</li></ul></div>`; },

    // 10. Discovery
    renderDiscovery(hubMain) { hubMain.innerHTML = `<div class="hub-section"><header class="hub-header"><h2>Customer Discovery AI Assistant</h2></header><div class="intel-card"><h5>Suggested Questions:</h5><p style="font-size:12px; font-style:italic">"How are you currently handling cloud over-budgeting?"</p></div></div>`; },

    // 11. Competitor Monitor
    renderCompetitor(hubMain) { hubMain.innerHTML = `<div class="hub-section"><header class="hub-header"><h2>Real-Time Competitor Monitor</h2></header><div class="intel-card"><div class="ticker-item"><span style="color:var(--error)">●</span> Vercel just released v15-rc</div><div class="ticker-item"><span style="color:var(--success)">●</span> Netlify raised $60M</div></div></div>`; },

    // 12. OS / Execution
    renderExecution(hubMain) { hubMain.innerHTML = `<div class="hub-section"><header class="hub-header"><h2>Founder Execution Tracker</h2></header><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px"><div class="metric-card">Target: 100 Users</div><div class="metric-card">Current: 42 Users</div><div class="metric-card">Burn: $12k/mo</div></div></div>`; }
};

window.FounderHub = FounderHub;
export default FounderHub;

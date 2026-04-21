// ============================================
// TechOL — Founder Decision Engine
// Strategic Market Intelligence vs Vanity Charts
// ============================================
import Icons from "./icons.js";
import Utils from "./utils.js";
import Database from "./database.js";
import DataEngine from "./data-engine.js";
import AuthService from "./auth.js";

const DecisionEngine = {
    _lastUpdate: new Date(),
    _timeFilter: '24h',

    async render(c) {
        c.innerHTML = `
        <div class="decision-engine animate-fadeIn">
            <!-- Strategic Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-8); border-bottom:1px solid var(--border-primary); padding-bottom:var(--space-6)">
                <div>
                    <h1 style="font-size:32px; font-weight:900; letter-spacing:-1px">Founder Decision Engine</h1>
                    <p style="color:var(--text-tertiary); font-size:14px; margin-top:4px">Converting multi-source signals into high-conviction startup actions.</p>
                </div>
                <div style="text-align:right">
                    <div class="time-filters" style="margin-bottom:8px">
                        <button class="filter-btn ${this._timeFilter === '1h' ? 'active' : ''}" onclick="DecisionEngine.setFilter('1h')">1H</button>
                        <button class="filter-btn ${this._timeFilter === '24h' ? 'active' : ''}" onclick="DecisionEngine.setFilter('24h')">24H</button>
                        <button class="filter-btn ${this._timeFilter === '7d' ? 'active' : ''}" onclick="DecisionEngine.setFilter('7d')">7D</button>
                    </div>
                    <div style="font-size:10px; color:var(--text-tertiary); font-weight:700">LAST UPDATED: ${Utils.timeAgo(this._lastUpdate).toUpperCase()}</div>
                </div>
            </div>

            <div class="intel-grid">
                <!-- 1. Build Opportunity Score (Live) -->
                <div class="intel-card span-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Top 5 "Blue Ocean" Build Opportunities</div>
                        <div class="intel-card-badge">DECISION: WHAT TO BUILD</div>
                    </div>
                    <div id="build-opportunity-list" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 2. Skill ROI Index (Personalized) -->
                <div class="intel-card span-6 span-m-12">
                     <div class="intel-card-header">
                        <div class="intel-card-title">Skill ROI & Market Leverage</div>
                        <div class="intel-card-badge">DECISION: WHAT TO LEARN</div>
                    </div>
                    <div id="skill-roi-list" style="display:flex; flex-direction:column; gap:12px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 3. Emerging Spike Detector -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Real-Time Emerging Spike Alerts</div>
                        <div class="intel-card-badge pulse-red">SPIKE DETECTION</div>
                    </div>
                    <div id="spike-detector-list" style="display:flex; flex-direction:column; gap:12px">
                        <!-- Populated by JS -->
                    </div>
                    <div style="margin-top:20px; padding:12px; background:rgba(255,59,48,0.05); border-radius:12px; font-size:12px; color:var(--text-secondary)">
                        <strong>Context:</strong> Anomalies detected in search velocity (>100% growth in under 12 hours).
                    </div>
                </div>

                <!-- 4. Demand vs Competition Matrix -->
                <div class="intel-card span-7 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Market Entry Matrix</div>
                        <div class="intel-card-badge">OPPORTUNITY ZONE</div>
                    </div>
                    <div class="chart-container" style="height: 350px;">
                        <canvas id="chart-decision-matrix"></canvas>
                    </div>
                    <div style="display:flex; gap:20px; margin-top:16px; font-size:11px; color:var(--text-tertiary)">
                        <div><strong style="color:var(--accent)">●</strong> Focus: High Demand + Low Competition</div>
                        <div><strong>Source:</strong> GitHub Repos, Product Hunt, PH Funding</div>
                    </div>
                </div>

                <!-- 5. Funding Direction Map -->
                <div class="intel-card span-5 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Funding Flow Map (30D)</div>
                        <div class="intel-card-badge">STRATEGIC: MONEY FLOW</div>
                    </div>
                    <div id="funding-map-list" style="display:flex; flex-direction:column; gap:12px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 6. Problem Heatmap -->
                <div class="intel-card span-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Technical Pain & Frustration Heatmap</div>
                        <div class="intel-card-badge">SIGNAL: SOURCE OF IDEAS</div>
                    </div>
                    <div id="problem-sentiment-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap:20px">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>
        </div>
        `;

        await this.populateOpportunities();
        await this.populateSkillROI();
        await this.populateSpikes();
        await this.populateFunding();
        await this.populateProblems();
        await this.initMatrix();
    },

    async populateOpportunities() {
        const out = document.getElementById('build-opportunity-list');
        const ideas = await DataEngine.getDataBackedIdeas();
        out.innerHTML = ideas.map(id => `
            <div class="post-card" style="padding:24px; border:1px solid rgba(var(--accent-rgb), 0.2); background: linear-gradient(180deg, rgba(var(--accent-rgb), 0.03) 0%, transparent 100%)">
                <div style="display:flex; justify-content:space-between; margin-bottom:16px">
                    <div style="font-size:10px; font-weight:900; color:var(--accent); letter-spacing:1px">OPPORTUNITY SCORE: ${id.score}</div>
                    <div style="font-size:10px; color:var(--text-tertiary); font-weight:700">CONFIDENCE: ${id.confidence || 94}%</div>
                </div>
                
                <h4 style="font-size:18px; font-weight:800; margin:0 0 12px; letter-spacing:-0.5px">${id.opportunity}</h4>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px">
                    <div style="font-size:11px; color:var(--text-tertiary)">Demand: <strong style="color:var(--success)">+${id.demandGrowth}%</strong></div>
                    <div style="font-size:11px; color:var(--text-tertiary)">Comp: <strong style="color:var(--warning)">${id.competition}</strong></div>
                    <div style="font-size:11px; color:var(--text-tertiary)">Funding: <strong style="color:var(--text-primary)">${id.funding}</strong></div>
                    <div style="font-size:11px; color:var(--text-tertiary)">AI Leverage: <strong style="color:var(--accent)">High</strong></div>
                </div>

                <div style="background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; margin-bottom:12px">
                    <div style="font-size:10px; font-weight:800; color:var(--text-tertiary); margin-bottom:6px; text-transform:uppercase">Suggested MVP Scope</div>
                    <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0">${id.mvp}</p>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center">
                    <div style="font-size:11px; color:var(--text-tertiary)">Stack: <span style="color:var(--text-secondary); font-weight:600">Rust, Next.js, Pinecone</span></div>
                    <button class="btn btn-ghost btn-sm" style="font-size:10px; font-weight:800">EXPAND BLUEPRINT →</button>
                </div>
                
                <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-primary); font-size:10px; color:var(--text-tertiary); display:flex; gap:10px">
                    <span>Sources:</span>
                    <span style="color:var(--text-secondary)">Reddit</span>
                    <span style="color:var(--text-secondary)">Hacker News</span>
                    <span style="color:var(--text-secondary)">GitHub</span>
                </div>
            </div>
        `).join('');
    },

    async populateSkillROI() {
        const user = AuthService.getUser();
        const roi = await DataEngine.getSkillROI(user?.skills || []);
        const out = document.getElementById('skill-roi-list');
        out.innerHTML = roi.map(s => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:12px; border-radius:12px">
                <div>
                    <div style="font-weight:700; font-size:14px">${s.skill}</div>
                    <div style="font-size:11px; color:var(--text-tertiary)">${s.advantage}</div>
                </div>
                <div style="text-align:right">
                    <div style="color:var(--success); font-weight:800; font-size:14px">${s.salaryTrend} ROI</div>
                    <div style="font-size:10px; color:var(--text-tertiary)">Exp: +${s.growth}%</div>
                </div>
            </div>
        `).join('');
    },

    async populateSpikes() {
        const spikes = await DataEngine.getSearchAnomalies();
        const out = document.getElementById('spike-detector-list');
        out.innerHTML = spikes.map(s => `
            <div style="border-left:3px solid var(--error); padding:12px; background:rgba(255,59,48,0.03); border-radius:0 12px 12px 0">
                <div style="display:flex; justify-content:space-between">
                    <span style="font-size:13px; font-weight:700">⚡ ${s.term}</span>
                    <span style="color:var(--error); font-weight:900">+${s.spike}%</span>
                </div>
                <div style="font-size:11px; color:var(--text-tertiary); margin-top:4px">Spike Duration: ${s.duration}h • Signal: ${s.signals}</div>
            </div>
        `).join('');
    },

    async populateFunding() {
        const funds = await DataEngine.getFundingMapDetailed();
        const out = document.getElementById('funding-map-list');
        out.innerHTML = funds.map(f => `
            <div style="padding:12px; border-radius:12px; background:var(--bg-input)">
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <span style="font-weight:700; font-size:13px">${f.sector}</span>
                    <span style="color:${f.growth > 0 ? 'var(--success)' : 'var(--error)'}; font-weight:800; font-size:12px">${f.growth > 0 ? '↑' : '↓'} ${Math.abs(f.growth)}%</span>
                </div>
                <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:11px; color:var(--text-tertiary)">
                    <span>Deals: ${f.deals}</span>
                    <span>Avg Check: $${f.avgCheck}M</span>
                    <span style="color:var(--accent)">Momentum: ${f.momentum}</span>
                </div>
            </div>
        `).join('');
    },

    async populateProblems() {
        const problems = await DataEngine.getProblemSentiment();
        const out = document.getElementById('problem-sentiment-grid');
        out.innerHTML = problems.map(p => `
            <div class="post-card" style="padding:20px">
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <span style="background:rgba(255,59,48,0.1); color:var(--error); font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px">FRUSTRATION: ${p.frustration}%</span>
                    <span style="font-size:10px; color:var(--text-tertiary)">VELOCITY: ${p.velocity}/min</span>
                </div>
                <h4 style="margin:12px 0 8px; font-size:15px">${p.problem}</h4>
                <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:12px">Sources: ${p.source}</div>
                <div style="display:flex; gap:8px">
                    ${p.tags.map(t => `<span class="badge" style="font-size:10px">${t}</span>`).join('')}
                </div>
            </div>
        `).join('');
    },

    async initMatrix() {
        const ctx = document.getElementById('chart-decision-matrix')?.getContext('2d');
        if (!ctx) return;

        const matrixData = await DataEngine.getOpportunityMatrix();
        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Markets',
                    data: matrixData.map(d => ({ x: d.demand, y: d.competition })),
                    backgroundColor: matrixData.map(d => (d.demand > 75 && d.competition < 30) ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                    pointRadius: 12,
                    pointHoverRadius: 16
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { min: 0, max: 100, title: { display: true, text: 'DEMAND GROWTH →', color: '#666', font: { size: 10, weight: 'bold' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { min: 0, max: 100, title: { display: true, text: 'COMPETITION DENSITY ↑', color: '#666', font: { size: 10, weight: 'bold' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    },

    setFilter(f) {
        this._timeFilter = f;
        this._lastUpdate = new Date();
        const c = document.getElementById('content-area');
        if (c) this.render(c);
        Utils.showToast(`Calibrating decision engines for ${f} window...`, 'info');
    }
};

window.DecisionEngine = DecisionEngine;
export default DecisionEngine;

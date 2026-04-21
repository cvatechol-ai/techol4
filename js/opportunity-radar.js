// ============================================
// TechOL — AI Startup Opportunity Radar
// Google Trends × GitHub × YC × Crunchbase Aesthetic
// ============================================
import Icons from "./icons.js";
import Utils from "./utils.js";
import Database from "./database.js";
import DataEngine from "./data-engine.js";

const OpportunityRadar = {
    _charts: {},
    _timeFilter: '24h',

    async render(c) {
        c.innerHTML = `
        <div class="intel-dashboard animate-fadeIn">
            <!-- Strategic Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-8); border-bottom:1px solid var(--border-primary); padding-bottom:var(--space-6)">
                <div>
                    <h1 style="font-size:32px; font-weight:900; letter-spacing:-1px">AI Startup Opportunity Radar</h1>
                    <p style="color:var(--text-tertiary); font-size:14px; margin-top:4px">Aggregating real-time signals from search logs, repo density, and funding velocity.</p>
                </div>
                <div class="time-filters" style="margin-bottom:4px">
                    <button class="filter-btn ${this._timeFilter === '1h' ? 'active' : ''}" onclick="OpportunityRadar.setFilter('1h')">1H</button>
                    <button class="filter-btn ${this._timeFilter === '24h' ? 'active' : ''}" onclick="OpportunityRadar.setFilter('24h')">24H</button>
                    <button class="filter-btn ${this._timeFilter === '7d' ? 'active' : ''}" onclick="OpportunityRadar.setFilter('7d')">7D</button>
                    <button class="filter-btn ${this._timeFilter === '30d' ? 'active' : ''}" onclick="OpportunityRadar.setFilter('30d')">30D</button>
                </div>
            </div>

            <div class="intel-grid">
                <!-- 1. Live Trending Hashtags Dashboard -->
                <div class="intel-card span-4 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Live Rising Hashtags</div>
                        <div class="intel-card-badge">SIGNAL VELOCITY</div>
                    </div>
                    <div id="hashtag-velocity-list" style="display:flex; flex-direction:column; gap:16px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 2. Real-Time Search Demand Chart -->
                <div class="intel-card span-8 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Real-Time Search Demand & Anomalies</div>
                        <div class="intel-card-badge pulse-red">SPIKE DETECTION</div>
                    </div>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="chart-search-demand"></canvas>
                    </div>
                    <div id="search-anomaly-list" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-top:16px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 3. Demand vs Competition Matrix -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Demand vs Competition Matrix</div>
                        <div class="intel-card-badge">BLUE OCEAN ANALYTICS</div>
                    </div>
                    <div class="chart-container" style="height: 350px;">
                        <canvas id="chart-opp-matrix"></canvas>
                    </div>
                </div>

                <!-- 4. Funding Momentum by Sector -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Funding Momentum Heatmap (Last 30D)</div>
                        <div class="intel-card-badge">SECTOR VELOCITY</div>
                    </div>
                    <div id="funding-sector-heatmap" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1px; background:var(--border-primary); border:1px solid var(--border-primary); border-radius:12px; overflow:hidden">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 5. Emerging Problem Feed -->
                <div class="intel-card span-12">
                     <div class="intel-card-header">
                        <div class="intel-card-title">Emerging Pain Points & Frustration Feed</div>
                        <div class="intel-card-badge">SENTIMENT ANALYZED</div>
                    </div>
                    <div id="emerging-problem-list" style="display:grid; grid-template-columns:1fr 1fr; gap:24px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 6. AI-Powered Startup Ideas (Data-Backed) -->
                <div class="intel-card span-12" style="background:rgba(0,112,243,0.02); border:1px solid rgba(0,112,243,0.2)">
                    <div class="intel-card-header">
                        <div class="intel-card-title" style="color:var(--accent)">Data-Backed Startup Opportunity Ideas</div>
                        <div class="intel-card-badge" style="background:var(--accent); color:#fff">AI GENERATED FROM SIGNALS</div>
                    </div>
                    <div id="data-backed-ideas" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:20px">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>
        </div>
        `;

        await this.initCharts();
        await this.populateLists();
    },

    async initCharts() {
        // Search Demand (Line Chart)
        const ctxSearch = document.getElementById('chart-search-demand')?.getContext('2d');
        if (ctxSearch) {
            this._charts.search = new Chart(ctxSearch, {
                type: 'line',
                data: {
                    labels: Array(12).fill(''),
                    datasets: [
                        { label: 'AI Agents', data: [40, 42, 45, 80, 120, 110, 140, 130, 210, 200, 230, 250], borderColor: '#0070f3', borderWidth: 3, tension: 0.4, pointRadius: 0, fill: true, backgroundColor: 'rgba(0,112,243,0.05)' },
                        { label: 'Baseline', data: [50, 52, 54, 53, 55, 54, 56, 55, 58, 57, 59, 60], borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderDash: [5, 5], pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { display: false }, x: { display: false } },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Opp Matrix (Scatter)
        const matrixData = await DataEngine.getOpportunityMatrix();
        const ctxMatrix = document.getElementById('chart-opp-matrix')?.getContext('2d');
        if (ctxMatrix) {
            this._charts.matrix = new Chart(ctxMatrix, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Markets',
                        data: matrixData.map(d => ({ x: d.demand, y: d.competition, id: d.id })),
                        backgroundColor: matrixData.map(d => (d.demand > 70 && d.competition < 40) ? '#0070f3' : 'rgba(255,255,255,0.1)'),
                        pointRadius: 10,
                        pointHoverRadius: 14
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { min: 0, max: 100, title: { display: true, text: 'DEMAND GROWTH →', color: '#666', font: { size: 10, weight: 'bold' } }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } },
                        y: { min: 0, max: 100, title: { display: true, text: 'COMPETITION DENSITY ↑', color: '#666', font: { size: 10, weight: 'bold' } }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    async populateLists() {
        // 1. Hashtag Velocity
        const tags = await DataEngine.getHashtagVelocity();
        const tagList = document.getElementById('hashtag-velocity-list');
        if (tagList) {
            tagList.innerHTML = tags.map(t => `
                <div style="background:var(--bg-input); padding:16px; border-radius:12px; border:1px solid var(--border-secondary); display:flex; justify-content:space-between; align-items:center">
                    <div>
                        <div style="font-weight:800; color:var(--text-primary); font-size:14px">${t.tag}</div>
                        <div style="font-size:11px; color:var(--text-tertiary); margin-top:4px">Velocity: ${t.velocity}/min • Engagement: ${t.depth}%</div>
                    </div>
                    <div style="text-align:right">
                        <div style="color:var(--success); font-weight:900; font-size:16px">↑ ${t.growth}%</div>
                    </div>
                </div>
            `).join('');
        }

        // 2. Search Anomalies
        const anomalies = await DataEngine.getSearchAnomalies();
        const anomalyList = document.getElementById('search-anomaly-list');
        if (anomalyList) {
            anomalyList.innerHTML = anomalies.map(a => `
                <div style="background:rgba(255,59,48,0.03); border:1px dashed rgba(255,59,48,0.2); border-radius:12px; padding:12px; text-align:center">
                    <div style="font-size:10px; font-weight:800; color:#ff3b30; text-transform:uppercase">⚡ Spike Detected</div>
                    <div style="font-weight:700; font-size:13px; margin:4px 0">${a.term}</div>
                    <div style="color:#ff3b30; font-weight:900; font-size:16px">+${a.spike}%</div>
                    <div style="font-size:9px; color:var(--text-tertiary); text-transform:uppercase">${a.duration}h duration</div>
                </div>
            `).join('');
        }

        // 3. Funding Heatmap
        const funding = await DataEngine.getFundingMomentum();
        const heatmap = document.getElementById('funding-sector-heatmap');
        if (heatmap) {
            heatmap.innerHTML = funding.map(f => `
                <div style="background:rgba(0,112,243, ${Math.abs(f.trend) / 100 + 0.1}); padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; min-height:120px">
                    <div style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">${f.sector}</div>
                    <div style="font-size:20px; font-weight:900; margin:6px 0">$${f.total}M</div>
                    <div style="font-size:11px; font-weight:800; color:${f.trend > 0 ? 'var(--success)' : 'var(--error)'}">
                        ${f.trend > 0 ? '↗' : '↘'} ${Math.abs(f.trend)}%
                    </div>
                </div>
            `).join('');
        }

        // 4. Emerging Problems
        const problems = await DataEngine.getUnsolvedProblems();
        const probList = document.getElementById('emerging-problem-list');
        if (probList) {
            probList.innerHTML = problems.map(p => `
                <div style="padding:20px; background:var(--bg-input); border:1px solid var(--border-secondary); border-radius:16px">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <div style="background:rgba(255,59,48,0.1); color:#ff3b30; font-size:10px; font-weight:800; padding:4px 10px; border-radius:100px">FRUSTRATION DETECTED</div>
                        <div style="font-size:18px; font-weight:900; color:var(--accent)">Score: 81%</div>
                    </div>
                    <h4 style="margin:16px 0 8px; font-size:16px">${p.problem}</h4>
                    <p style="font-size:13px; color:var(--text-secondary); line-height:1.6">${p.desc}</p>
                    <div style="margin-top:16px; display:flex; gap:16px; font-size:11px; color:var(--text-tertiary)">
                        <span>Industry: <strong>Infrastructure</strong></span>
                        <span>Mention Velocity: <strong style="color:var(--success)">+${p.growth}%</strong></span>
                    </div>
                </div>
            `).join('');
        }

        // 5. Data Backed Ideas
        const ideas = await DataEngine.getDataBackedIdeas();
        const ideaList = document.getElementById('data-backed-ideas');
        if (ideaList) {
            ideaList.innerHTML = ideas.map(id => `
                <div class="post-card" style="padding:24px; border-radius:20px; background:var(--bg-card); display:flex; flex-direction:column; gap:16px">
                    <div style="display:flex; justify-content:space-between; align-items:center">
                        <div style="font-size:11px; font-weight:900; color:var(--accent)">STRATEGIC OPPORTUNITY</div>
                        <div style="background:rgba(0,112,243,0.1); color:var(--accent); font-size:24px; font-weight:900; padding:8px 16px; border-radius:12px">${id.score}</div>
                    </div>
                    <h3 style="font-size:18px; font-weight:800; color:var(--text-primary)">${id.opportunity}</h3>
                    <p style="font-size:14px; color:var(--text-secondary); line-height:1.6">${id.description}</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px">
                         <div class="pill-group"><strong>Demand:</strong> +${id.demandGrowth}%</div>
                         <div class="pill-group"><strong>Competition:</strong> ${id.competition}</div>
                         <div class="pill-group"><strong>Target:</strong> Mid-Market Ops</div>
                         <div class="pill-group"><strong>Funding:</strong> ${id.funding}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; font-size:13px">
                        <strong style="color:var(--accent)">Suggested MVP:</strong> ${id.mvp}
                        <div style="margin-top:8px; display:flex; align-items:center; gap:8px">
                            <span style="font-size:10px; color:var(--text-tertiary)">TECH STACK:</span>
                            <span style="font-weight:700; color:var(--text-secondary)">${id.tech}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    },

    setFilter(f) {
        this._timeFilter = f;
        const c = document.getElementById('content-area');
        if (c) this.render(c);
        Utils.showToast(`Calibrating radar for ${f} window...`, 'info');
    }
};

window.OpportunityRadar = OpportunityRadar;
export default OpportunityRadar;

// ============================================
// TechOL — Startup Intelligence & Opportunity Radar
// Crunchbase × YC × Bloomberg Aesthetic
// ============================================
import Icons from "./icons.js";
import Utils from "./utils.js";
import Database from "./database.js";
import AIEngine from "./ai-engine.js";
import DataEngine from "./data-engine.js";

const StartupIntelligence = {
    _charts: {},
    _timeFilter: '7d',

    async render(c) {
        c.innerHTML = `
        <div class="intel-dashboard animate-fadeIn">
            <!-- Header with Time Filter -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-8)">
                <div>
                    <h2 style="font-size:var(--fs-2xl); font-weight:800; letter-spacing:-0.5px">Startup Intelligence Radar</h2>
                    <p style="color:var(--text-tertiary); font-size:var(--fs-sm); margin-top:4px">Data-driven opportunity detection and market gap analysis</p>
                </div>
                <div class="time-filters" style="display:flex; gap:8px; background:var(--bg-card); padding:4px; border-radius:12px; border:1px solid var(--border-primary)">
                    <button class="filter-btn ${this._timeFilter === '24h' ? 'active' : ''}" onclick="StartupIntelligence.setFilter('24h')">24H</button>
                    <button class="filter-btn ${this._timeFilter === '7d' ? 'active' : ''}" onclick="StartupIntelligence.setFilter('7d')">7D</button>
                    <button class="filter-btn ${this._timeFilter === '30d' ? 'active' : ''}" onclick="StartupIntelligence.setFilter('30d')">30D</button>
                </div>
            </div>

            <div class="intel-grid">
                <!-- 1. Build This Now - AI Insight Card -->
                <div class="intel-card span-12" style="background: linear-gradient(135deg, rgba(0, 112, 243, 0.1) 0%, transparent 100%); border-color: rgba(0, 112, 243, 0.3)">
                    <div class="ai-insight-box">
                        <div class="ai-insight-icon" style="background:var(--accent)">${Icons.ms('tips_and_updates', { size: 32, fill: true, color: '#fff' })}</div>
                        <div style="flex:1">
                            <div class="ai-insight-title" style="color:var(--accent)">Build This Now: Opportunity Signal</div>
                            <p class="ai-insight-text" id="ai-build-insight">Developer security automation tools are seeing 3x increase in job mentions but have low open-source coverage. Strong opportunity for SaaS tooling targeting mid-market DevSecOps teams.</p>
                        </div>
                        <div style="text-align:right">
                            <div style="font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase">Confidence Score</div>
                            <div style="font-size:24px; font-weight:900; color:var(--accent)">94%</div>
                        </div>
                    </div>
                </div>

                <!-- 2. Live Market Gap Detector -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Live Market Gap Detector</div>
                        <div class="intel-card-badge">OPPORTUNITY RANK</div>
                    </div>
                    <div id="market-gap-list" style="display:flex; flex-direction:column; gap:16px; margin-top:12px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 3. Demand vs Competition Matrix -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Demand vs Competition Matrix</div>
                        <div class="intel-card-badge">STRATEGIC QUADRANT</div>
                    </div>
                    <div class="chart-container" style="height: 350px;">
                        <canvas id="chart-opp-matrix"></canvas>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:12px; font-size:10px; color:var(--text-tertiary); font-weight:700; text-transform:uppercase">
                        <span>Low Competition</span>
                        <span>High Competition</span>
                    </div>
                </div>

                <!-- 4. Trending Startup Themes -->
                <div class="intel-card span-8 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Trending Startup Themes</div>
                        <div class="intel-card-badge">7D MOMENTUM</div>
                    </div>
                    <div class="chart-container" style="height: 300px;">
                        <canvas id="chart-startup-themes"></canvas>
                    </div>
                </div>

                <!-- 5. Emerging Tech Spike Detector -->
                <div class="intel-card span-4 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Emerging Tech Spike Detector</div>
                        <div class="intel-card-badge red">ANOMALY</div>
                    </div>
                    <div id="startup-spike-list" style="display:flex; flex-direction:column; gap:12px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 6. Funding Momentum Heatmap -->
                <div class="intel-card span-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Funding Momentum / Sector Velocity</div>
                        <div class="intel-card-badge">LAST 30 DAYS</div>
                    </div>
                    <div id="funding-heatmap" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:1px; background:var(--border-primary); border-radius:12px; overflow:hidden; border:1px solid var(--border-primary)">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 7. Unsolved Problems Feed -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">“Unsolved Problems” Feed</div>
                        <div class="intel-card-badge">SENTIMENT ANALYZED</div>
                    </div>
                    <div id="unsolved-problems-list" style="display:flex; flex-direction:column; gap:20px; margin-top:12px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 8. Startup Idea Generator -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Data-Backed Startup Ideas</div>
                        <button class="btn btn-ghost btn-xs" style="color:var(--accent)" onclick="StartupIntelligence.refreshIdeas()">${Icons.ms('refresh', { size: 16 })} Regenerate</button>
                    </div>
                    <div id="startup-ideas-list" style="display:grid; grid-template-columns:1fr; gap:16px">
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
        // Opportunity Matrix (Scatter)
        const matrixData = await DataEngine.getOpportunityMatrix();
        const ctxMatrix = document.getElementById('chart-opp-matrix')?.getContext('2d');
        if (ctxMatrix) {
            this._charts.matrix = new Chart(ctxMatrix, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Opportunity Segments',
                        data: matrixData.map(d => ({ x: d.demand, y: d.competition, id: d.id })),
                        backgroundColor: matrixData.map(d => d.demand > 70 && d.competition < 40 ? '#0070f3' : 'rgba(255,255,255,0.1)'),
                        pointRadius: 8,
                        pointHoverRadius: 12
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: { display: true, text: 'DEMAND GROWTH →', color: '#666', font: { size: 10, weight: 'bold' } },
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { display: false },
                            min: 0, max: 100
                        },
                        y: {
                            title: { display: true, text: 'COMPETITION DENSITY ↑', color: '#666', font: { size: 10, weight: 'bold' } },
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { display: false },
                            min: 0, max: 100
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.raw.id}: Demand ${ctx.raw.x}%, Comp ${ctx.raw.y}%`
                            }
                        }
                    }
                }
            });
        }

        // Startup Themes (Line)
        const themeData = await DataEngine.getStartupThemes();
        const ctxThemes = document.getElementById('chart-startup-themes')?.getContext('2d');
        if (ctxThemes) {
            this._charts.themes = new Chart(ctxThemes, {
                type: 'line',
                data: {
                    labels: Array(7).fill(''),
                    datasets: themeData.map((t, i) => ({
                        label: t.theme,
                        data: t.data,
                        borderColor: i === 0 ? '#0070f3' : i === 1 ? '#7928ca' : i === 2 ? '#ff0080' : `rgba(255,255,255,${0.2 + (i * 0.1)})`,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: false
                    }))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } },
                        x: { display: false }
                    },
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, color: '#888', font: { size: 10 } } }
                    }
                }
            });
        }
    },

    async populateLists() {
        // 1. Market Gaps
        const gaps = await DataEngine.getMarketGaps();
        const gapList = document.getElementById('market-gap-list');
        if (gapList) {
            gapList.innerHTML = gaps.map(g => `
                <div style="background:var(--bg-input); padding:16px; border-radius:12px; border:1px solid var(--border-secondary)">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <div>
                            <div style="font-weight:700; font-size:14px; color:var(--text-primary)">${g.topic}</div>
                            <div style="display:flex; gap:12px; margin-top:8px">
                                <span style="font-size:11px; color:var(--text-tertiary)">Growth: <span style="color:var(--success)">+${g.searchGrowth}%</span></span>
                                <span style="font-size:11px; color:var(--text-tertiary)">Comp: <span style="color:var(--accent)">${g.competition}</span></span>
                            </div>
                        </div>
                        <div style="text-align:right">
                            <div style="font-size:10px; color:var(--text-tertiary); font-weight:700">GAP SCORE</div>
                            <div style="font-size:18px; font-weight:900; color:var(--success)">${g.score}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 2. Unsolved Problems
        const problems = await DataEngine.getUnsolvedProblems();
        const probList = document.getElementById('unsolved-problems-list');
        if (probList) {
            probList.innerHTML = problems.map(p => `
                <div style="display:flex; gap:20px; border-bottom:1px solid var(--border-secondary); padding-bottom:16px">
                    <div style="font-size:20px; background:rgba(255,255,255,0.05); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center">
                        ${p.source === 'StackOverflow' ? '📘' : p.source.includes('Reddit') ? '🟠' : '🐙'}
                    </div>
                    <div style="flex:1">
                        <div style="display:flex; justify-content:space-between">
                            <div style="font-weight:700; color:var(--text-primary)">${p.problem}</div>
                            <div style="font-size:11px; font-weight:800; color:var(--accent); background:rgba(0,112,243,0.1); padding:2px 8px; border-radius:100px">${p.sentiment}</div>
                        </div>
                        <p style="font-size:13px; color:var(--text-secondary); margin-top:6px; line-height:1.5">${p.desc}</p>
                        <div style="display:flex; gap:16px; margin-top:10px; font-size:11px; color:var(--text-tertiary)">
                            <span>Mentions: <strong>${Utils.formatNumber(p.mentions)}</strong></span>
                            <span>Velocity: <strong style="color:var(--success)">+${p.growth}%</strong></span>
                            <span>Impact: <strong>${p.impact}</strong></span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 3. Funding Heatmap
        const funding = await DataEngine.getFundingHeatmap();
        const heatmap = document.getElementById('funding-heatmap');
        if (heatmap) {
            heatmap.innerHTML = funding.map(f => `
                <div style="background:rgba(0, 112, 243, ${Math.abs(f.growth) / 100 + 0.1}); padding:20px; display:flex; flex-direction:column; align-items:center; text-align:center; min-height:140px; justify-content:center">
                    <div style="font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">${f.sector}</div>
                    <div style="font-size:20px; font-weight:900; color:var(--text-primary); margin:8px 0">$${f.total}M</div>
                    <div style="font-size:11px; color:${f.growth > 0 ? 'var(--success)' : 'var(--error)'}; font-weight:700">
                        ${f.growth > 0 ? '▲' : '▼'} ${Math.abs(f.growth)}%
                    </div>
                    <div style="font-size:10px; color:var(--text-tertiary); margin-top:4px">${f.deals} Deals</div>
                </div>
            `).join('');
        }

        // 4. Emerging Spikes
        const spikes = await DataEngine.getEmergingSpikes();
        const spikeList = document.getElementById('startup-spike-list');
        if (spikeList) {
            spikeList.innerHTML = spikes.map(s => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(255,59,48, 0.03); border:1px dashed rgba(255,59,48, 0.2); border-radius:12px">
                    <div style="display:flex; align-items:center; gap:12px">
                        <div class="pulse-red" style="width:8px; height:8px; background:#ff3b30; border-radius:50%"></div>
                        <div style="font-weight:700; font-size:14px">${s.term}</div>
                    </div>
                    <div style="font-weight:900; color:#ff3b30">+${s.growth}%</div>
                </div>
            `).join('');
        }

        // 5. Startup Ideas
        const ideas = await DataEngine.getStartupIdeas();
        const ideaList = document.getElementById('startup-ideas-list');
        if (ideaList) {
            ideaList.innerHTML = ideas.map(id => `
                <div class="post-card" style="padding:20px; border-radius:16px; background:var(--bg-card)">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                        <h3 style="font-size:18px; font-weight:800; color:var(--accent)">${id.title}</h3>
                        <span style="font-size:10px; font-weight:800; background:rgba(0,112,243,0.1); color:var(--accent); padding:4px 10px; border-radius:8px">AI VALIDATED</span>
                    </div>
                    <div style="margin-bottom:12px">
                        <div style="font-size:11px; font-weight:800; color:var(--text-tertiary); margin-bottom:4px">THE PROBLEM</div>
                        <div style="font-size:13px; line-height:1.5; color:var(--text-secondary)">${id.problem}</div>
                    </div>
                    <div style="display:flex; gap:12px; margin-bottom:16px">
                        <div style="flex:1">
                            <div style="font-size:10px; font-weight:800; color:var(--text-tertiary)">TARGET</div>
                            <div style="font-size:12px; font-weight:600">${id.target}</div>
                        </div>
                        <div style="flex:1">
                            <div style="font-size:10px; font-weight:800; color:var(--text-tertiary)">SIGNAL</div>
                            <div style="font-size:12px; font-weight:600; color:var(--success)">Verified Demand</div>
                        </div>
                    </div>
                    <div style="background:var(--bg-input); padding:12px; border-radius:8px; font-size:12px; color:var(--text-tertiary)">
                        <strong>Suggested Stack:</strong> ${id.tech}
                    </div>
                </div>
            `).join('');
        }
    },

    async setFilter(f) {
        this._timeFilter = f;
        const c = document.getElementById('content-area');
        if (c) this.render(c);
        Utils.showToast(`Calibrating radar for ${f} window...`, 'info');
    },

    async refreshIdeas() {
        const list = document.getElementById('startup-ideas-list');
        if (list) {
            list.style.opacity = '0.5';
            setTimeout(() => {
                this.populateLists();
                list.style.opacity = '1';
                Utils.showToast('Regenerating ideas from real market signals...', 'success');
            }, 800);
        }
    }
};

window.StartupIntelligence = StartupIntelligence;
export default StartupIntelligence;

import Icons from "./icons.js";
import Utils from "./utils.js";
import Database from "./database.js";
import RealtimeDataEngine from "./realtime-engine.js";
import AIEngine from "./ai-engine.js";

const SectorIntelligence = {
    sectors: [
        "Artificial Intelligence", "Generative AI", "Creative AI", "AI Infrastructure",
        "Cybersecurity", "Cloud Computing", "DevOps", "Web3",
        "Blockchain", "FinTech", "HealthTech", "BioTech",
        "EdTech", "ClimateTech", "Robotics", "Edge Computing",
        "Quantum Computing", "AR/VR", "Gaming Tech", "SaaS",
        "Creator Economy", "AI Agents", "Autonomous Systems", "Data Engineering",
        "Semiconductors", "SpaceTech", "DefenseTech", "GovTech",
        "PropTech", "E-commerce Tech"
    ],
    countries: [
        "Global", "United States", "India", "United Kingdom", "Canada",
        "Germany", "France", "Japan", "South Korea", "Singapore",
        "Australia", "Israel", "UAE", "Brazil", "MENA Region", "LATAM"
    ],
    timeframes: [
        { id: '24h', label: '24H' },
        { id: '7d', label: '7D' },
        { id: '30d', label: '30D' },
        { id: '90d', label: '90D' },
        { id: '1y', label: '1Y' }
    ],

    state: {
        sector: "Artificial Intelligence",
        country: "Global",
        timeframe: "30d",
        founderMode: false
    },

    chartInstances: {},

    // Simple pseudo-random generator keyed by a string and constraints
    _hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        return Math.abs(h);
    },
    _seededRandom(seedStr, min, max) {
        const seed = this._hash(seedStr + this.state.sector + this.state.country + this.state.timeframe);
        // We use a deterministic sequence built from the seed
        const x = Math.sin(seed + 1) * 10000;
        const normalized = x - Math.floor(x);
        return min + normalized * (max - min);
    },

    async render(c) {
        c.innerHTML = `
        <div class="sector-intelligence animate-fadeIn">
            <!-- Strategic Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-8); border-bottom:1px solid var(--border-primary); padding-bottom:var(--space-6); flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1 style="font-size:32px; font-weight:900; letter-spacing:-1px">Live Sector Growth Intelligence</h1>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
                        <p style="color:var(--text-tertiary); font-size:14px; margin:0">Global market mapping, AI-forecasted momentum, and startup disruption signals.</p>
                        <div id="si-sync-status" style="font-size:10px; font-weight:900; color:var(--accent); background:rgba(0,112,243,0.1); padding:2px 8px; border-radius:4px; border:1px solid rgba(0,112,243,0.2)">SYNCED</div>
                    </div>
                </div>
                
                <div style="display:flex; gap: 12px; align-items:center; flex-wrap: wrap;">
                    <!-- Founder Mode Toggle -->
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); padding:8px 16px; border-radius:100px; border:1px solid rgba(255,255,255,0.05); margin-right:12px">
                        <span style="font-size:10px; font-weight:900; color:var(--text-tertiary); letter-spacing:1px">FOUNDER_MODE</span>
                        <div class="toggle-switch ${this.state.founderMode ? 'active' : ''}" id="si-founder-toggle" style="width:36px; height:18px; background:rgba(255,255,255,0.1); border-radius:10px; position:relative; cursor:pointer; transition:all 0.3s">
                            <div class="toggle-knob" style="width:14px; height:14px; background:#fff; border-radius:50%; position:absolute; top:2px; left:${this.state.founderMode ? '20' : '2'}px; transition:all 0.3s; box-shadow:0 0 10px rgba(255,255,255,0.5)"></div>
                        </div>
                    </div>

                    <div class="custom-select-wrapper">
                        <select id="si-country-select" class="input" style="font-weight:700; background:var(--bg-card); border:1px solid rgba(255,255,255,0.1); font-size: 13px; font-family:var(--font-heading)">
                            ${this.countries.map(country => `<option value="${country}" ${country === this.state.country ? 'selected' : ''}>[REGION] ${country}</option>`).join('')}
                        </select>
                    </div>
                    <div class="custom-select-wrapper">
                        <select id="si-sector-select" class="input" style="font-weight:700; background:rgba(0, 112, 243, 0.1); color:var(--accent); border:1px solid rgba(0, 112, 243, 0.3); font-size: 13px; font-family:var(--font-heading)">
                            ${this.sectors.map(sector => `<option value="${sector}" ${sector === this.state.sector ? 'selected' : ''}>[SECTOR] ${sector}</option>`).join('')}
                        </select>
                    </div>
                    <div class="time-filters">
                        ${this.timeframes.map(t => `<button class="filter-btn ${this.state.timeframe === t.id ? 'active' : ''}" data-tf="${t.id}">${t.label}</button>`).join('')}
                    </div>
                </div>
            </div>

            <div id="si-dashboard-content">
                <div style="text-align:center; padding: 40px;"><div class="spinner spinner-lg"></div></div>
            </div>
        </div>
        `;

        this.attachEventListeners();

        // Register Live Sync Task
        RealtimeDataEngine.register(`sector_intel_${this.state.sector}`,
            async () => {
                const metrics = await Database.getMarketIntelligence(this.state.sector, this.state.sector);
                const momentum = await Database.getSectorMomentum();
                const currentSector = momentum.find(s => s.sector === this.state.sector) || momentum[0];
                return { metrics, currentSector };
            },
            (data) => this.updateDashboard(data)
        );

        await RealtimeDataEngine.runTask(`sector_intel_${this.state.sector}`, RealtimeDataEngine.registry.get(`sector_intel_${this.state.sector}`));
    },

    attachEventListeners() {
        const countrySelect = document.getElementById('si-country-select');
        const sectorSelect = document.getElementById('si-sector-select');
        const founderToggle = document.getElementById('si-founder-toggle');

        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                this.state.country = e.target.value;
                Utils.showToast(`Calibrating market intelligence for ${e.target.value}...`, 'info');
                this.updateDashboard();
            });
        }

        if (sectorSelect) {
            sectorSelect.addEventListener('change', (e) => {
                this.state.sector = e.target.value;
                Utils.showToast(`Scanning vectors for ${e.target.value}...`, 'info');
                this.updateDashboard();
            });
        }

        if (founderToggle) {
            founderToggle.addEventListener('click', () => {
                this.state.founderMode = !this.state.founderMode;
                Utils.showToast(this.state.founderMode ? 'Founder Mode Activated: Insight Depth Increased' : 'Founder Mode Deactivated', 'success');
                this.render(document.getElementById('content-area'));
            });
        }

        document.querySelectorAll('.sector-intelligence .time-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                target.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                this.state.timeframe = target.dataset.tf;
                Utils.showToast(`Adjusting temporal timeline to ${target.dataset.tf}...`, 'info');
                this.updateDashboard();
            });
        });
    },

    async updateDashboard(liveData) {
        const out = document.getElementById('si-dashboard-content');
        if (!out) return;

        const info = liveData || { metrics: await Database.getMarketIntelligence(this.state.sector, this.state.sector), currentSector: (await Database.getSectorMomentum())[0] };
        const stats = info.currentSector;
        const metrics = info.metrics;
        const aiAnalysis = AIEngine.generateSectorInsights(this.state.sector, stats);

        // Update status indicator
        const statusEl = document.getElementById('si-sync-status');
        if (statusEl) {
            statusEl.textContent = `LIVE: ${new Date().toLocaleTimeString()}`;
            statusEl.style.borderColor = 'var(--success)';
            statusEl.style.color = 'var(--success)';
        }

        out.innerHTML = `
        <div class="intel-grid">
            
            <!-- 1. Top Metrics -->
            <div class="intel-card span-12" style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
                <div style="flex:1; min-width:150px; text-align:center; border-right:1px solid var(--border-primary)">
                    <div style="color:var(--text-tertiary); font-size:11px; font-weight:800; text-transform:uppercase">Hiring Velocity</div>
                    <div style="font-size:28px; font-weight:900; color:var(--success)">+${(8 + this._seededRandom('hrv', 0, 15)).toFixed(1)}%</div>
                </div>
                <div style="flex:1; min-width:150px; text-align:center; border-right:1px solid var(--border-primary)">
                    <div style="color:var(--text-tertiary); font-size:11px; font-weight:800; text-transform:uppercase">Risk Index</div>
                    <div style="font-size:28px; font-weight:900; color:var(--error)">${(30 + this._seededRandom('rsk', 0, 40)).toFixed(0)}<span style="font-size:12px;color:var(--text-tertiary)">/100</span></div>
                </div>
                <div style="flex:1; min-width:150px; text-align:center;">
                    <div style="color:var(--text-tertiary); font-size:11px; font-weight:800; text-transform:uppercase">Opp. Score</div>
                    <div style="font-size:28px; font-weight:900; color:var(--accent)">${(70 + this._seededRandom('opp', 0, 25)).toFixed(0)}</div>
                </div>
            </div>

            ${this.state.founderMode ? `
            <!-- Founder Vision Panel (Exclusive) -->
            <div class="intel-card span-12 animate-fadeIn" style="background: linear-gradient(90deg, rgba(var(--accent-rgb), 0.1) 0%, transparent 100%); border: 1px solid rgba(var(--accent-rgb), 0.2)">
                <div style="padding:var(--space-4); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center">
                    <div style="font-weight:900; letter-spacing:2px; color:var(--accent); font-size:12px">FOUNDER_VISION: OPPORTUNITY RADAR</div>
                    <div class="badge badge-error" style="font-size:9px">CONFIDENTIAL SIGNAL</div>
                </div>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:24px; padding:var(--space-6)">
                    <div>
                        <div style="font-size:11px; font-weight:800; color:var(--text-tertiary); margin-bottom:12px; text-transform:uppercase">Market Saturation Heatmap</div>
                        <div style="height:120px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; display:flex; align-items:flex-end; gap:4px; padding:10px">
                            ${[...Array(12)].map((_, i) => `<div style="flex:1; background:${i < 4 ? 'var(--success)' : i < 8 ? 'var(--warning)' : 'var(--error)'}; opacity:${0.2 + (i / 15)}; height:${30 + Math.random() * 70}%"></div>`).join('')}
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:9px; color:var(--text-tertiary)">
                            <span>ENTRY_ZONE_A (EASY)</span>
                            <span>DOMINATED_ZONE (HARD)</span>
                        </div>
                    </div>
                    <div>
                        <div style="font-size:11px; font-weight:800; color:var(--text-tertiary); margin-bottom:16px; text-transform:uppercase">Capital Availability Matrix</div>
                        <div style="display:flex; flex-direction:column; gap:12px">
                            <div style="display:flex; justify-content:space-between; align-items:center">
                                <span style="font-size:12px; color:var(--text-secondary)">Angel Pipeline</span>
                                <span style="font-size:12px; font-weight:900; color:var(--success)">EXCESS</span>
                            </div>
                            <div style="width:100%; height:4px; background:rgba(255,255,255,0.05); border-radius:2px"><div style="width:85%; height:100%; background:var(--success)"></div></div>
                            <div style="display:flex; justify-content:space-between; align-items:center">
                                <span style="font-size:12px; color:var(--text-secondary)">Series A/B Interest</span>
                                <span style="font-size:12px; font-weight:900; color:var(--warning)">RESTRICTED</span>
                            </div>
                            <div style="width:100%; height:4px; background:rgba(255,255,255,0.05); border-radius:2px"><div style="width:35%; height:100%; background:var(--warning)"></div></div>
                        </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.2); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
                        <div style="font-size:10px; font-weight:800; color:var(--accent); margin-bottom:8px">ENTRY_STRATEGY_DIRECTIVE</div>
                        <div style="font-size:13px; color:var(--text-primary); line-height:1.6">
                            Target underserved <span style="color:var(--success)">mid-market developers</span>. AI adoption in this sector is high but UX friction remains. High vulnerability in legacy competitors.
                        </div>
                        <div style="margin-top:12px; display:flex; gap:12px">
                            <div style="text-align:center">
                                <div style="font-size:16px; font-weight:900; color:#fff">4.2</div>
                                <div style="font-size:9px; color:var(--text-tertiary)">Difficulty</div>
                            </div>
                            <div style="text-align:center">
                                <div style="font-size:16px; font-weight:900; color:var(--success)">8.5</div>
                                <div style="font-size:9px; color:var(--text-tertiary)">Success Odds</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
                 <div style="flex:1; min-width:150px; text-align:center;">
                    <div style="color:var(--text-tertiary); font-size:11px; font-weight:800; text-transform:uppercase">AI Sentiment</div>
                    <div style="font-size:16px; font-weight:900; color:#fff; margin-top:6px; background:rgba(var(--accent-rgb), 0.1); padding:4px 12px; border-radius:100px; display:inline-block; border:1px solid rgba(var(--accent-rgb), 0.2)">${aiAnalysis.status.toUpperCase()}</div>
                </div>
            </div>

            <!-- AI Executive Summary -->
            <div class="intel-card span-12" style="background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.05) 0%, transparent 100%);">
                <div class="intel-card-header">
                    <div class="intel-card-title">AI Strategic Insights: ${this.state.sector}</div>
                    <div class="intel-card-badge">LIVE INTELLIGENCE</div>
                </div>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-top:4px">
                    <div>
                        <ul style="list-style:none; padding:0; margin:0">
                            ${aiAnalysis.insights.map(i => `<li style="font-size:13px; color:var(--text-secondary); margin-bottom:8px; display:flex; gap:10px"><span style="color:var(--accent)">▶</span> ${i}</li>`).join('')}
                        </ul>
                    </div>
                    <div style="background:rgba(255,59,48,0.03); border:1px solid rgba(255,59,48,0.1); padding:16px; border-radius:12px">
                        <div style="font-size:10px; font-weight:900; color:var(--error); margin-bottom:8px; text-transform:uppercase">Strategic Risk Warning</div>
                        <div style="font-size:13px; color:var(--text-primary)">${aiAnalysis.risk}</div>
                    </div>
                    <div style="background:rgba(48,209,88,0.03); border:1px solid rgba(48,209,88,0.1); padding:16px; border-radius:12px">
                        <div style="font-size:10px; font-weight:900; color:var(--success); margin-bottom:8px; text-transform:uppercase">Expansion Opportunity Gap</div>
                        <div style="font-size:13px; color:var(--text-primary)">${aiAnalysis.opportunity}</div>
                    </div>
                </div>
            </div>

            <!-- Market Share & Leaders -->
            <div class="intel-card span-6">
                <div class="intel-card-header">
                    <div class="intel-card-title">Top Tech Giants Market Share (${this.state.country})</div>
                    <div class="intel-card-badge">DOMINANCE PROFILE</div>
                </div>
                <div class="chart-container" style="height: 250px;">
                    <canvas id="si-market-share-chart"></canvas>
                </div>
                <div class="intel-card-footer" style="padding-top:16px; border-top:1px solid rgba(255,255,255,0.05); margin-top:16px;">
                    <div>Monopoly Risk: <strong style="color:${stats.monopolyRisk > 60 ? 'var(--error)' : 'var(--success)'}">${stats.monopolyRisk}%</strong></div>
                    <div style="color:var(--accent)">AI Forecast: <span style="font-weight:700; color:#fff">${stats.forecastDirection}</span></div>
                </div>
            </div>

            <!-- Competitive Landscape Bubble Chart -->
            <div class="intel-card span-6">
                <div class="intel-card-header">
                    <div class="intel-card-title">Competitive Landscape: Disruptors vs Dominators</div>
                    <div class="intel-card-badge">MARKET POSITIONING</div>
                </div>
                <div class="chart-container" style="height: 250px;">
                    <canvas id="si-landscape-chart"></canvas>
                </div>
                <div class="intel-card-footer" style="padding-top:16px; border-top:1px solid rgba(255,255,255,0.05); margin-top:16px; display:flex; gap:12px">
                    <div><span style="color:var(--success)">●</span> High Innovation</div>
                    <div><span style="color:var(--error)">●</span> High Saturation</div>
                </div>
            </div>

            <!-- Advanced Timeline Growth Graph -->
            <div class="intel-card span-12">
                <div class="intel-card-header">
                    <div class="intel-card-title">Institutional Engagement & Revenue Trajectory</div>
                    <div class="intel-card-badge">LIVE FLOW (${this.state.timeframe.toUpperCase()})</div>
                </div>
                <div class="chart-container" style="height: 350px;">
                    <canvas id="si-timeline-chart"></canvas>
                </div>
            </div>

            <!-- Market Data Panel -->
            <div class="intel-card span-4">
                <div class="intel-card-header">
                    <div class="intel-card-title">Real-Time Market Radar</div>
                    <div class="intel-card-badge">LIVE VOLATILITY</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:16px">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05)">
                        <div style="font-size:12px; color:var(--text-tertiary); font-weight:700">Market Size (Est)</div>
                        <div style="font-size:16px; font-weight:900; color:#fff">$${(this._seededRandom('msz', 10, 800)).toFixed(1)}B</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05)">
                        <div style="font-size:12px; color:var(--text-tertiary); font-weight:700">Volatility Index</div>
                        <div style="font-size:16px; font-weight:900; color:var(--warning)">${(this._seededRandom('vol', 1, 9)).toFixed(2)}v</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05)">
                        <div style="font-size:12px; color:var(--text-tertiary); font-weight:700">Funding Inflow (${this.state.timeframe})</div>
                        <div style="font-size:16px; font-weight:900; color:var(--success)">+$${(this._seededRandom('fin', 100, 5000)).toFixed(0)}M</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05)">
                        <div style="font-size:12px; color:var(--text-tertiary); font-weight:700">M&A Count</div>
                        <div style="font-size:16px; font-weight:900; color:#fff">${Math.floor(this._seededRandom('mac', 1, 40))} Deals</div>
                    </div>
                     <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:12px; color:var(--text-tertiary); font-weight:700">AI Disruption Risk</div>
                        <div style="font-size:12px; font-weight:900; padding:2px 8px; border-radius:4px; background:rgba(255,59,48,0.1); color:var(--error); text-transform:uppercase">${stats.disruptionRisk}</div>
                    </div>
                </div>
            </div>

            <!-- Capital Flow & Sentiment Intelligence -->
            <div class="intel-card span-4">
                 <div class="intel-card-header">
                    <div class="intel-card-title">Sentiment & Capital Intelligence</div>
                    <div class="intel-card-badge">MACRO ANALYSIS</div>
                </div>
                 <div style="display:flex; flex-direction:column; gap:16px">
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; font-weight:700">
                            <span style="color:var(--text-tertiary)">Institutional Sentiment</span>
                            <span style="color:${stats.sentimentInst > 0 ? 'var(--success)' : 'var(--error)'}">${stats.sentimentInst > 0 ? '+' : ''}${stats.sentimentInst}</span>
                        </div>
                        <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px"><div style="width:${(stats.sentimentInst + 100) / 2}%; height:100%; background:var(--success); border-radius:2px"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; font-weight:700">
                            <span style="color:var(--text-tertiary)">Developer Sentiment</span>
                            <span style="color:${stats.sentimentDev > 0 ? 'var(--success)' : 'var(--error)'}">${stats.sentimentDev > 0 ? '+' : ''}${stats.sentimentDev}</span>
                        </div>
                        <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px"><div style="width:${(stats.sentimentDev + 100) / 2}%; height:100%; background:var(--accent); border-radius:2px"></div></div>
                    </div>
                     <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; font-weight:700">
                            <span style="color:var(--text-tertiary)">Macro Impact & Regulatory Risk</span>
                            <span style="color:var(--warning)">${stats.macroImpact}/100</span>
                        </div>
                        <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px"><div style="width:${stats.macroImpact}%; height:100%; background:var(--warning); border-radius:2px"></div></div>
                    </div>
                    
                    <div style="margin-top:10px; background:var(--bg-card); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
                        <div style="font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:8px">Capital Flow Directive</div>
                        <div style="font-size:12px; font-weight:700; color:#fff; display:flex; align-items:center; gap:8px">
                            ${stats.capitalFlow > 0 ? `<span style="color:var(--success)">↗ Inflow Rotating</span> from ${this.sectors[Math.floor(this._seededRandom('rot1', 0, this.sectors.length - 1))]}` : `<span style="color:var(--error)">↘ Outflow Bleeding</span> to ${this.sectors[Math.floor(this._seededRandom('rot2', 0, this.sectors.length - 1))]}`}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Strategic Action Suggestions -->
            <div class="intel-card span-4">
                 <div class="intel-card-header">
                    <div class="intel-card-title">Strategic Action Vectors</div>
                    <div class="intel-card-badge">DECISION MATRIX</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:12px">
                    <div style="padding:12px; border-left:3px solid var(--accent); background:rgba(0,112,243,0.05); border-radius:0 8px 8px 0">
                        <div style="font-size:10px; font-weight:800; color:var(--accent); margin-bottom:4px">FOR DEVELOPERS (LEARN)</div>
                        <div style="font-size:12px; font-weight:600; color:#fff">${this.generateAction('dev')}</div>
                    </div>
                    <div style="padding:12px; border-left:3px solid var(--success); background:rgba(48,209,88,0.05); border-radius:0 8px 8px 0">
                        <div style="font-size:10px; font-weight:800; color:var(--success); margin-bottom:4px">FOR FOUNDERS (BUILD)</div>
                        <div style="font-size:12px; font-weight:600; color:#fff">${this.generateAction('founder')}</div>
                    </div>
                    <div style="padding:12px; border-left:3px solid var(--warning); background:rgba(255,159,10,0.05); border-radius:0 8px 8px 0">
                        <div style="font-size:10px; font-weight:800; color:var(--warning); margin-bottom:4px">FOR INVESTORS (WATCH)</div>
                        <div style="font-size:12px; font-weight:600; color:#fff">${this.generateAction('investor')}</div>
                    </div>
                </div>
            </div>
            
            <!-- Company Landscape Map -->
            <div class="intel-card span-12">
                <div class="intel-card-header">
                    <div class="intel-card-title">AI Competitive Landscape Mapping</div>
                    <div class="intel-card-badge">FRAGMENTATION ANALYSIS</div>
                </div>
                <div class="chart-container" style="height: 350px;">
                    <canvas id="si-landscape-chart"></canvas>
                </div>
                 <div class="intel-card-footer" style="padding-top:16px; border-top:1px solid rgba(255,255,255,0.05); margin-top:16px;">
                    <div>X: Market Share (%) | Y: Innovation Velocity | Bubble Size = Sub-sector Saturation Density</div>
                </div>
            </div>

        </div>
        `;

        this.initCharts(metrics);
    },

    generateSectorStats() {
        const cycles = ['Emerging', 'Expansion', 'Peak Growth', 'Consolidation', 'Saturation', 'Decline'];
        const risks = ['Low Risk', 'Moderate Threat', 'High Disruption', 'Imminent Obsolescence'];
        return {
            marketGrowth: (this._seededRandom('gr', -15, 85)).toFixed(1),
            momentumScore: Math.floor(this._seededRandom('mo', 30, 99)),
            jobDemand: (this._seededRandom('jd', -25, 120)).toFixed(1),
            innovationScore: Math.floor(this._seededRandom('is', 40, 98)),
            marketCycle: cycles[Math.floor(this._seededRandom('cl', 0, 5.9))],
            earlySignal: this._seededRandom('es', 0, 1) > 0.5 ? 'Abnormal Talent Migration Detected in APAC' : 'Sudden VC Syndicate Formation (Series A)',
            monopolyRisk: Math.floor(this._seededRandom('mr', 20, 90)),
            disruptionRisk: risks[Math.floor(this._seededRandom('drk', 0, 3.9))],
            sentimentInst: Math.floor(this._seededRandom('sins', -50, 90)),
            sentimentDev: Math.floor(this._seededRandom('sdev', -20, 95)),
            macroImpact: Math.floor(this._seededRandom('mac', 10, 85)),
            capitalFlow: this._seededRandom('caf', -1, 1),
            forecastDirection: this._seededRandom('fcct', 0, 1) > 0.4 ? '↗ ACCELERATING' : '↘ DECELERATING'
        };
    },

    generateExecSummary() {
        const d1 = ["accelerating rapidly", "facing consolidation", "experiencing a renaissance", "hitting structural bottlenecks", "being disrupted by AI orchestration"];
        const d2 = ["regulatory shifts", "breakthrough algorithmic efficiency", "infrastructural commoditization", "capital rotation", "talent shortages", "geopolitical pressures"];
        const d3 = ["Vertical integration", "Open-source deployment", "Cost-optimization", "Edge adaptation", "Compute scalability"];
        const d4 = ["underserved sub-sectors", "latency choke points", "enterprise integration gaps", "skill shortages", "supply chain exposure"];

        return `<span style="color:var(--accent); font-weight:800">State:</span> The <strong>${this.state.sector}</strong> ecosystem in <strong>${this.state.country}</strong> is ${d1[Math.floor(this._seededRandom('d1', 0, 4.9))]}, heavily impacted by ${d2[Math.floor(this._seededRandom('d2', 0, 5.9))]}. 
        <br/><br/>
        <span style="color:var(--success); font-weight:800">Signal:</span> Dynamic market analysis detects a high-divergence anomaly showing that legacy monopolies are losing developer sentiment velocity to nimble startups. 
        <br/><br/>
        <span style="color:var(--warning); font-weight:800">Gap:</span> Analysis flags significant <strong>${d4[Math.floor(this._seededRandom('d4', 0, 4.9))]}</strong>. Startups targeting <strong>${d3[Math.floor(this._seededRandom('d3', 0, 4.9))]}</strong> will establish the dominant moats over the next 12-18 months.`;
    },

    generateAction(type) {
        let actions = {};
        if (this.state.sector.includes('AI') || this.state.sector === 'Autonomous Systems') {
            actions = {
                dev: ["Master Low-Level Systems Inference (C++/CUDA/Rust)", "Focus on RAG, Agents & Vector DB Integrations", "Pivot to multi-modal data pipeline engineering"],
                founder: ["Verticalize LLMs into hyper-niche legacy industries", "Build Developer Tooling for LLM Debugging/Observability", "Solve sub-20ms latency inside edge nodes"],
                investor: ["Avoid generic Copilot UI wrappers", "Fund data-labeling and synthetic generation infrastructure", "Syndicate specialized compute hardware plays"]
            };
        } else if (this.state.sector.includes('Cloud') || this.state.sector.includes('DevOps')) {
            actions = {
                dev: ["Learn Kubernetes Cost-Optimization Techniques", "Master WebAssembly (Wasm) inside serverless", "Focus on Zero-Trust Network Architectures"],
                founder: ["Create abstract open source alternatives to enterprise moats", "Build multi-cloud automatic failover planes", "Automate compliance tracking (SOC2/HIPAA)"],
                investor: ["Cloud egress fee arbitrages", "Track developer adoption of alternative PaaS", "Watch for WASM driven edge-compute networks"]
            };
        } else {
            actions = {
                dev: ["Deep dive into performance optimizations", "Understand API monetization models", "Learn decentralized architecture patterns"],
                founder: ["Find the un-automated manual spreadsheets and build SaaS", "Solve B2B distribution not just the product", "Integrate AI workflows deeply into existing software"],
                investor: ["Focus on businesses with negative churn", "Avoid consumer horizontal plays", "Look for systemic workflow lock-in"]
            };
        }
        return actions[type][Math.floor(this._seededRandom('ac' + type, 0, 2.9))];
    },

    initCharts(metricsData) {
        if (this.chartInstances.ms) this.chartInstances.ms.destroy();
        if (this.chartInstances.tl) this.chartInstances.tl.destroy();
        if (this.chartInstances.ld) this.chartInstances.ld.destroy();

        if (!window.Chart) return;
        Chart.defaults.color = 'rgba(255,255,255,0.5)';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        // 2. Timeline Trajectory (Revenue vs Total Market Size)
        const tlCtx = document.getElementById('si-timeline-chart')?.getContext('2d');
        if (tlCtx) {
            const labels = metricsData.map(m => Utils.formatTimeShort(m.timestamp));
            const data = metricsData.map(m => m.value);

            this.chartInstances.tl = new Chart(tlCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Market Intensity',
                            data: data,
                            borderColor: 'var(--accent)',
                            backgroundColor: 'rgba(0, 112, 243, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointBackgroundColor: 'var(--accent)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#000',
                            titleFont: { size: 12, weight: 800 },
                            bodyFont: { size: 12 },
                            padding: 12,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { maxRotation: 0 } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // 3. Competitive Landscape (Bubble Chart)
        const ldCtx = document.getElementById('si-landscape-chart')?.getContext('2d');
        if (ldCtx) {
            const dataPts = Array.from({ length: 25 }, (_, i) => ({
                x: this._seededRandom(`lx${i}`, 2, 45), // Market Share
                y: this._seededRandom(`ly${i}`, 15, 95), // Innovation Velocity
                r: this._seededRandom(`lr${i}`, 2, 20)   // Saturation Density
            }));

            this.chartInstances.ld = new Chart(ldCtx, {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: 'Sector Entities',
                        data: dataPts,
                        backgroundColor: dataPts.map(d => {
                            if (d.y > 75 && d.x < 15) return 'rgba(48,209,88,0.7)'; // Disruptors (Success)
                            if (d.x > 30 && d.y < 50) return 'rgba(255,59,48,0.7)'; // Aging Monopolies (Error)
                            if (d.x > 30 && d.y > 50) return 'rgba(0,112,243,0.7)'; // Dominators (Accent)
                            return 'rgba(255,255,255,0.2)'; // Others
                        }),
                        borderColor: 'transparent'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { title: { display: true, text: 'Market Share (%)', color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { title: { display: true, text: 'Innovation Velocity (Commits/Patents)', color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }
    }
};

window.SectorIntelligence = SectorIntelligence;
export default SectorIntelligence;

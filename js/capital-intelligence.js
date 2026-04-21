import Icons from "./icons.js";
import Utils from "./utils.js";
import Database from "./database.js";
import RealtimeDataEngine from "./realtime-engine.js";
import Components from "./components.js";
import AuthService from "./auth.js";
import AIEngine from "./ai-engine.js";

const CapitalIntelligence = {
    timer: null,
    sectors: [
        "Artificial Intelligence", "DevOps", "Cybersecurity", "FinTech", "HealthTech",
        "SpaceTech", "Robotics", "Web3", "ClimateTech", "Biotech"
    ],
    countries: ["USA", "UK", "India", "Germany", "France", "Israel", "UAE", "Singapore", "Canada"],
    stages: ["Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Growth", "IPO"],
    investors: ["Andreessen Horowitz", "Sequoia", "Y Combinator", "Lightspeed", "Founders Fund", "Index Ventures", "Accel", "Benchmark"],

    state: {
        sector: "All Sectors",
        country: "Global",
        stage: "All Stages",
        lastUpdate: new Date()
    },

    chartInstances: {},
    liveFeedData: [],

    async render(c) {
        c.innerHTML = `
        <div class="capital-intel animate-fadeIn">
            <!-- Terminal Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-8); border-bottom:1px solid var(--border-primary); padding-bottom:var(--space-6); flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1 style="font-size:32px; font-weight:900; letter-spacing:-1px; color:#fff">Live Capital & Corporate Intelligence</h1>
                    <div style="display:flex; align-items:center; gap:12px; margin-top:4px">
                        <p style="color:var(--text-tertiary); font-size:14px; margin:0; font-family:var(--font-heading)">TERMINAL VER 3.0 | <span style="color:var(--success)">SYSTEM ONLINE</span></p>
                        <div id="ci-sync-indicator" style="font-size:10px; font-weight:900; color:var(--accent); background:rgba(0,112,243,0.1); padding:2px 8px; border-radius:4px">SYNCED</div>
                    </div>
                </div>
                
                <div style="display:flex; gap: 12px; align-items:center; flex-wrap: wrap;">
                    <!-- Filter Selects truncated for brevity but kept functional -->
                    <div class="custom-select-wrapper">
                        <select id="ci-country" class="input" style="font-weight:700; background:#111; border:1px solid #333; font-size: 13px;">
                            <option value="Global">[REGION] Global</option>
                            ${this.countries.map(country => `<option value="${country}">[REGION] ${country}</option>`).join('')}
                        </select>
                    </div>
                    <div class="custom-select-wrapper">
                        <select id="ci-sector" class="input" style="font-weight:700; background:#111; color:var(--accent); border:1px solid rgba(0, 112, 243, 0.3); font-size: 13px;">
                            <option value="All Sectors">[SECTOR] All Sectors</option>
                            ${this.sectors.map(sector => `<option value="${sector}">[SECTOR] ${sector}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="Utils.showToast('Subscribed to current filter alerts.', 'success')">${Icons.ms('notifications_active', { size: 16 })} Alert Me</button>
                </div>
            </div>

            <div id="ci-dashboard-content">
                <div style="text-align:center; padding: 40px; grid-column:span 12;"><div class="spinner spinner-lg"></div></div>
            </div>
        </div>
        `;

        this.attachEventListeners();

        // Register Live Task with Engine
        RealtimeDataEngine.register('capital_intel',
            async () => {
                const alerts = await Database.getFundingAlerts();
                const metrics = await Database.getMarketIntelligence('Global', 'All');
                return { alerts, metrics };
            },
            (data) => this.updateDashboard(data)
        );

        await RealtimeDataEngine.runTask('capital_intel', RealtimeDataEngine.registry.get('capital_intel'));
    },

    attachEventListeners() {
        ['ci-country', 'ci-sector', 'ci-stage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    try {
                        // Safe state update
                        const filterKey = id.replace('ci-', '');
                        if (this.state) {
                            this.state[filterKey] = e.target.value;
                            this.state.lastUpdate = new Date();
                        }

                        Utils.showToast(`Relocating capital sensors: ${e.target.value}...`, 'info');

                        // Prevent errors by catching async
                        if (typeof this.updateDashboard === 'function') {
                            this.updateDashboard().catch(err => {
                                console.error('Dashboard update error:', err);
                                Utils.showToast('Failed to update dashboard', 'error');
                            });
                        }
                    } catch (error) {
                        console.error('Filter error:', error);
                        Utils.showToast('Filter change failed', 'error');
                    }
                });
            }
        });
    },

    createRandomAlert(date = new Date()) {
        const type = Math.random() > 0.8 ? 'milestone' : 'funding';
        const sector = this.sectors[Math.floor(Math.random() * this.sectors.length)];
        const country = this.countries[Math.floor(Math.random() * this.countries.length)];

        if (type === 'funding') {
            const stage = this.stages[Math.floor(Math.random() * this.stages.length)];
            const amount = stage.includes('Seed') ? Math.floor(Math.random() * 4) + 1 : stage.includes('A') ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 200) + 50;
            const investor = this.investors[Math.floor(Math.random() * this.investors.length)];

            let spike = '';
            if (Math.random() > 0.7) spike = '⚡ Funding Spike';
            if (Math.random() > 0.85) spike = '🔥 Oversubscribed';

            return {
                id: Math.random().toString(36).substr(2, 9),
                type: 'funding',
                company: `X-${Math.random().toString(36).substr(2, 4).toUpperCase()} ` + (sector.includes('AI') ? 'Neural' : 'Labs'),
                sector, country, stage, amount: `$${amount}M`, investor, date, spike,
                avgDelta: `+${Math.floor(Math.random() * 40) + 5}%`,
                insight: `Robust ${stage} capital allocation into ${sector} targeting specific infrastructure bottlenecks.`
            };
        } else {
            const events = ['Acquisition', 'IPO Filing', 'Strategic Merger', 'Product Unveil'];
            const e = events[Math.floor(Math.random() * events.length)];
            return {
                id: Math.random().toString(36).substr(2, 9),
                type: 'milestone',
                company: `Macro${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
                sector, country, event: e, date,
                insight: `Major consolidation signal within the ${sector} ecosystem in ${country}. Competitors should pivot strategy.`,
                avgDelta: `+${Math.floor(Math.random() * 20)}%`
            };
        }
    },

    formatTime(date) {
        if (!date) return '-';
        try {
            return Utils.formatTimeShort(date);
        } catch (e) {
            return new Date(date).toLocaleTimeString();
        }
    },

    async updateDashboard(liveData) {
        const out = document.getElementById('ci-dashboard-content');
        if (!out) return;

        let info;
        try {
            const countryFilter = this.state?.country || 'Global';
            const sectorFilter = this.state?.sector || 'All Sectors';

            info = (liveData && typeof liveData === 'object') ? liveData : {
                alerts: await Database.getFundingAlerts(20),
                metrics: await Database.getMarketIntelligence(countryFilter, sectorFilter)
            };
        } catch (e) {
            console.error("CI: Data fetch failed", e);
            info = { alerts: this.liveFeedData || [], metrics: [] };
        }

        this.liveFeedData = info.alerts || [];

        // Ensure metrics has meaningful data
        const metricsArray = info.metrics || [];
        const rawMetrics = metricsArray[0] || { value: 0 };
        const metrics = {
            value: rawMetrics.value || (50 + Math.random() * 500),
            growth: rawMetrics.growth || (Math.random() * 15 - 5).toFixed(1)
        };

        const isUpdate = liveData === true;

        // Update indicator
        const ind = document.getElementById('ci-sync-indicator');
        if (ind) {
            ind.textContent = `LAST SYNC: ${new Date().toLocaleTimeString()}`;
            ind.style.color = 'var(--success)';
        }

        const summaryHTML = `
            <div class="intel-card span-12" style="background: rgba(0,0,0,0.5); border-left: 3px solid var(--accent); padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:800; color:var(--text-tertiary); font-size:12px; letter-spacing:1px; text-transform:uppercase">[ EXECUTIVE CAPITAL BRIEFING ]</div>
                    <div style="padding: 2px 8px; border-radius: 4px; background: rgba(0,112,243,0.1); color: var(--accent); font-size:11px; font-weight:700">REAL-TIME FLOW</div>
                </div>
                <div style="display:flex; gap:24px; margin-top:16px; flex-wrap:wrap">
                    <div>
                        <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase">Global Market Intensity</div>
                        <div style="font-size:24px; font-weight:900; color:var(--text-primary)">$${Utils.formatNumber(metrics.value)}</div>
                    </div>
                    <div>
                        <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase">Aggregate Velocity Change</div>
                        <div style="font-size:24px; font-weight:900; color:${metrics.growth > 0 ? 'var(--success)' : 'var(--error)'}">${metrics.growth > 0 ? '+' : ''}${metrics.growth}%</div>
                    </div>
                    <div style="flex:1; min-width:200px; padding-left:16px; border-left:1px dashed #333">
                         <div style="font-size:11px; color:var(--warning); text-transform:uppercase">⚠️ Strategic Anomaly Alert</div>
                         <div style="font-size:13px; color:var(--text-secondary); margin-top:4px">Capital pooling detected in AI infrastructure layers. VC liquidity rotating from fintech.</div>
                    </div>
                </div>
            </div>
        `;

        const feedHTML = `
            <div class="intel-card span-7 span-m-12" style="height: 600px; overflow-y:auto; overflow-x:hidden; background:rgba(10,10,10,0.8)" id="ci-feed">
                <div class="intel-card-header" style="position:sticky; top:0; background:rgba(10,10,10,0.9); z-index:10; padding-bottom:12px">
                    <div class="intel-card-title" style="font-family:monospace; font-size:13px"><span style="color:var(--success)">●</span> LIVE FUNDING STREAM</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:1px; background:#222">
                    ${this.liveFeedData.map((a, i) => `
                        <div class="ci-alert-item" style="background:#111; padding:16px; transition:all 0.3s ease; animation: ${i === 0 && isUpdate ? 'flashHighlight 1.5s ease-out' : 'none'}">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                                <div>
                                    <div style="display:flex; align-items:center; gap:8px">
                                        <div style="font-weight:900; color:#fff; font-size:16px">${a.company}</div>
                                        ${a.spike ? `<div style="font-size:10px; font-weight:800; background:rgba(255,159,10,0.1); color:var(--warning); padding:2px 6px; border-radius:4px">${a.spike}</div>` : ''}
                                    </div>
                                    <div style="font-size:12px; color:var(--text-tertiary); margin-top:4px; font-family:monospace">${a.sector} • ${a.country}</div>
                                </div>
                                <div style="text-align:right">
                                    <div style="font-family:monospace; font-size:11px; color:var(--text-tertiary)">${this.formatTime(a.date)}</div>
                                </div>
                            </div>
                            
                            ${a.type === 'funding' ? `
                                <div style="display:flex; gap:16px; align-items:center; margin-bottom:12px; flex-wrap:wrap">
                                    <div style="color:var(--success); font-weight:900; font-size:18px">${a.amount} <span style="font-size:12px; font-weight:700">${a.stage}</span></div>
                                    <div style="font-size:12px; color:var(--text-secondary)">Lead: <strong style="color:#fff">${a.investor}</strong></div>
                                    <div style="font-size:11px; color:var(--text-tertiary); border:1px solid #333; padding:2px 6px; border-radius:4px">vs Avg: <span style="color:var(--success)">${a.avgDelta}</span></div>
                                </div>
                            ` : `
                                <div style="display:flex; gap:16px; align-items:center; margin-bottom:12px;">
                                    <div style="color:var(--accent); font-weight:900; font-size:14px; text-transform:uppercase; border:1px solid var(--accent); padding:2px 8px; border-radius:4px">${a.event}</div>
                                </div>
                            `}
                            
                            <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:6px; font-size:12px; color:var(--text-secondary); border-left:2px solid ${a.type === 'funding' ? 'var(--success)' : 'var(--accent)'}">
                                <strong style="color:#fff">AI Insight:</strong> ${a.insight}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const heatmapData = this.sectors.slice(0, 5).map((s, i) => ({
            label: s,
            volume: 100 + Math.random() * 900,
            intensity: [82, 45, 96, 32, 74][i],
            change: (Math.random() * 20).toFixed(1)
        }));

        const analyticHTML = `
            <div class="span-5 span-m-12" style="display:flex; flex-direction:column; gap:20px;">
                ${Components.capitalFlowHeatmap(heatmapData)}

                <!-- Investor Tracker (Simplified) -->
                <div class="intel-card">
                    <div class="intel-card-header">
                        <div class="intel-card-title" style="font-weight:800; font-size:12px; text-transform:uppercase">Institutional Rotation (30D)</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
                        ${this.investors.slice(0, 4).map((inv, i) => `
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-size:13px; font-weight:700; color:#fff">${inv}</div>
                                <span style="font-size:10px; font-weight:900; color:var(--accent)">ACTIVE SYNC</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        out.innerHTML = summaryHTML + feedHTML + analyticHTML;
        this.injectCSS();
    },

    injectCSS() {
        if (!document.getElementById('ci-styles')) {
            const style = document.createElement('style');
            style.id = 'ci-styles';
            style.innerHTML = `
                @keyframes flashHighlight {
                    0% { background: rgba(0, 112, 243, 0.2); }
                    100% { background: #111; }
                }
            `;
            document.head.appendChild(style);
        }
    },

    initCharts() {
        if (this.chartInstances.hm) this.chartInstances.hm.destroy();

        if (!window.Chart) return;
        Chart.defaults.color = 'rgba(255,255,255,0.5)';
        Chart.defaults.font.family = "'Inter', monospace";

        const hmCtx = document.getElementById('ci-heatmap-chart')?.getContext('2d');
        if (hmCtx) {
            this.chartInstances.hm = new Chart(hmCtx, {
                type: 'bar',
                data: {
                    labels: this.sectors.slice(0, 6),
                    datasets: [{
                        label: 'Inflow ($M)',
                        data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 800) + 100),
                        backgroundColor: (ctx) => {
                            const val = ctx.raw || 0;
                            return val > 600 ? 'rgba(48,209,88,0.8)' : (val > 300 ? 'rgba(0,112,243,0.8)' : 'rgba(255,255,255,0.2)');
                        },
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } }
                    },
                    animation: { duration: 0 }
                }
            });
        }
    },

    destroy() {
        if (this.timer) clearInterval(this.timer);
    }
};

window.CapitalIntelligence = CapitalIntelligence;
export default CapitalIntelligence;

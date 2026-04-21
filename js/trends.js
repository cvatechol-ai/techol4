// ============================================
// TechOL — Live Business Trends Intelligence
// Real-time market signals & trend indexing
// ============================================

import Icons from "./icons.js";
import Utils from "./utils.js";
import AIEngine from "./ai-engine.js";
import Database from "./database.js";
import RealtimeDataEngine from "./realtime-engine.js";

const TrendsModule = {
    trends: [],
    lastUpdated: null,
    currentFilter: 'all',
    currentCountry: 'Global',
    _refreshInterval: null,

    async init() {
        console.log("TrendsModule: Initializing...");

        RealtimeDataEngine.register('live_trends',
            async () => {
                // In a real app, this would be a real API call
                // For now we use the simulated logic but piped through the engine
                return this._generateSimulatedTrends();
            },
            (data) => {
                this.trends = data;
                this.lastUpdated = new Date();
                const container = document.getElementById('content-area');
                if (container && window.App && window.App.currentView === 'trends') {
                    this.render(container);
                }
            }
        );
    },

    async fetchTrends() {
        // This is now handled by the engine heartbeat
        const data = await RealtimeDataEngine.runTask('live_trends', RealtimeDataEngine.registry.get('live_trends'));
        return data;
    },

    _generateSimulatedTrends() {
        const topics = [
            { name: "Edge AI Infrastructure", sector: "AI/ML", baseVolume: 8500 },
            { name: "Tokenized Real Estate", sector: "FinTech", baseVolume: 12000 },
            { name: "Synthetic CoT Data", sector: "AI/ML", baseVolume: 5400 },
            { name: "Micro-SaaS for Startups", sector: "SaaS", baseVolume: 9800 },
            { name: "Vercel Alternatives", sector: "DevTools", baseVolume: 15600 },
            { name: "Local LLM Privacy", sector: "Security", baseVolume: 7200 },
            { name: "Autonomous Sales Agents", sector: "Enterprise", baseVolume: 11000 },
            { name: "Post-Quantum Auth", sector: "Security", baseVolume: 3400 },
            { name: "Vertical AI for Legal", sector: "SaaS", baseVolume: 6700 },
            { name: "Zero-Knowledge Proofs", sector: "Web3", baseVolume: 12500 },
            { name: "Green Hydrogen Tech", sector: "Climate", baseVolume: 4300 },
            { name: "Personalized Genomic AI", sector: "Health", baseVolume: 2100 },
            { name: "Space-as-a-Service", sector: "Aerospace", baseVolume: 1500 },
            { name: "Low-Code Engineering", sector: "DevTools", baseVolume: 18000 },
            { name: "Distributed GPU Clusters", sector: "Infrastructure", baseVolume: 5600 },
            { name: "Multi-Modal RAG", sector: "AI/ML", baseVolume: 13000 },
            { name: "Stablecoin Payments", sector: "FinTech", baseVolume: 25000 },
            { name: "Rust Data Science", sector: "Languages", baseVolume: 8900 },
            { name: "Sub-10ms Inference", sector: "Infrastructure", baseVolume: 4200 },
            { name: "Neuromorphic Computing", sector: "Hardware", baseVolume: 900 }
        ];

        return topics.map((t, i) => {
            const growth = (Math.random() * 40 - 10).toFixed(1); // -10% to +30%
            return {
                id: 'trend_' + i,
                name: t.name,
                sector: t.sector,
                volume: Math.floor(t.baseVolume * (1 + (Math.random() * 0.2))),
                growth: parseFloat(growth),
                direction: growth > 0 ? 'up' : 'down',
                country: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'USA' : 'India') : 'Global',
                score: Math.floor(Math.random() * 40 + 60) // Sentiment 60-100
            };
        }).sort((a, b) => b.growth - a.growth);
    },

    render(container) {
        container.innerHTML = `
        <div class="trends-dashboard animate-fadeIn">
            <header class="trends-header">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-6)">
                    <div>
                        <h2 style="font-size:28px; font-weight:900; letter-spacing:-1px">Live Business Trends</h2>
                        <p style="color:var(--text-secondary); font-size:14px; margin-top:4px">Real-time market signals across global building hubs.</p>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">Status</div>
                        <div style="display:flex; align-items:center; gap:6px; color:var(--success); font-size:12px; font-weight:700">
                            <span class="online-dot" style="width:6px; height:6px; background:var(--success)"></span> 
                            SYNCED: <span id="trend-timer">${Utils.timeAgo(this.lastUpdated)}</span>
                        </div>
                    </div>
                </div>

                <div class="trends-filters" style="display:flex; gap:12px; margin-bottom:var(--space-6); overflow-x:auto; padding-bottom:8px">
                    <button class="filter-chip active">All Intelligence</button>
                    <button class="filter-chip">AI & Future</button>
                    <button class="filter-chip">Infrastructure</button>
                    <button class="filter-chip">FinTech</button>
                    <button class="filter-chip">Security</button>
                    <div style="flex:1"></div>
            <select class="trends-select" onchange="TrendsModule.filterByCountry(this.value)">
                <option value="Global" ${this.currentCountry === 'Global' ? 'selected' : ''}>Global</option>
                <option value="USA" ${this.currentCountry === 'USA' ? 'selected' : ''}>USA</option>
                <option value="India" ${this.currentCountry === 'India' ? 'selected' : ''}>India</option>
                <option value="Europe" ${this.currentCountry === 'Europe' ? 'selected' : ''}>Europe</option>
            </select>
        </div>
    </header>

    <div class="trends-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px">
        ${(this.trends || [])
                .filter(t => t && (this.currentCountry === 'Global' || t.country === this.currentCountry))
                .map((t, i) => this.renderTrendCard(t, i)).join('')}
    </div>
</div>
`;

        this._setupInfiniteRefresh();
    },

    renderTrendCard(t, index) {
        const up = t.direction === 'up';
        return `
        <div class="trend-card glass-card animate-fadeInUp" style="animation-delay: ${index * 0.05}s" onclick="TrendsModule.showDetails('${t.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                <span style="font-size:10px; font-weight:850; letter-spacing:1px; color:var(--text-tertiary); text-transform:uppercase">${t.sector}</span>
                <div style="display:flex; align-items:center; gap:4px; font-size:12px; font-weight:800; color:${up ? 'var(--success)' : 'var(--error)'}">
                    ${up ? '↑' : '↓'} ${Math.abs(t.growth)}%
                </div>
            </div>
            <h3 style="font-size:16px; font-weight:800; color:var(--text-primary); margin-bottom:8px">${t.name}</h3>
            <div style="display:flex; gap:8px; margin-bottom:16px">
                <span style="font-size:10px; font-weight:700; color:var(--text-tertiary); background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:4px">${t.country} SIGNAL</span>
                <span style="font-size:10px; font-weight:700; color:var(--text-tertiary); background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:4px">VOL: ${Utils.formatNumber(t.volume)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:flex-end">
                <div>
                    <div style="display:flex; align-items:center; gap:8px">
                        <div style="font-size:10px; color:${up ? 'var(--success)' : 'var(--error)'}; font-weight:800">24H: ${up ? '↑' : '↓'} ${Math.abs(t.growth)}%</div>
                        <div style="font-size:10px; color:var(--success); font-weight:800">7D: ↑ ${(Math.abs(t.growth) * 1.5).toFixed(1)}%</div>
                    </div>
                </div>
                <div class="mini-chart-sparkline" style="width:60px; height:24px; opacity:0.6">
                    ${this._generateSparkline(t.direction)}
                </div>
            </div>
            <div style="position:absolute; bottom:0; left:0; height:2px; width:${t.score}%; background:var(--accent); opacity:0.3"></div>
        </div>
        `;
    },

    _generateSparkline(dir) {
        // Simple SVG sparkline
        const points = Array.from({ length: 6 }, (_, i) => `${i * 10},${Math.random() * (dir === 'up' ? 20 - i * 3 : i * 3 + 5)}`).join(' ');
        return `<svg viewBox="0 0 50 20" style="width:100%; height:100%"><polyline fill="none" stroke="${dir === 'up' ? '#50e3c2' : '#ff453a'}" stroke-width="2" points="${points}" /></svg>`;
    },

    filterByCountry(country) {
        try {
            if (!country) return;
            this.currentCountry = country;
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
                Utils.showToast(`Filtering by ${country}...`, 'info');
            }
        } catch (e) {
            console.error("TrendsModule: Filter failed", e);
            Utils.showToast("Unable to apply filter", "error");
        }
    },

    async showDetails(trendId) {
        const trend = this.trends.find(t => t.id === trendId);
        if (!trend) return;

        const aiInsights = await AIEngine.getTrendIntelligence(trend.name);

        const content = `
        <div class="trend-details-pane" style="color:var(--text-primary)">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
                <h2 style="font-size:24px; font-weight:900">${trend.name}</h2>
                <div style="background:var(--accent-subtle); color:var(--accent); padding:4px 12px; border-radius:100px; font-size:11px; font-weight:900">STRATEGIC SIGNAL</div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:30px">
                <div class="stat-box" style="background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; border:1px solid var(--border-primary)">
                    <div style="font-size:11px; color:var(--text-tertiary); font-weight:800; margin-bottom:4px">GROWTH SCORE</div>
                    <div style="font-size:20px; font-weight:900; color:var(--success)">${trend.score}/100</div>
                    <div style="font-size:10px; color:var(--text-tertiary); margin-top:4px">Strong Growth Momentum Detected</div>
                </div>
                <div class="stat-box" style="background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; border:1px solid var(--border-primary)">
                    <div style="font-size:11px; color:var(--text-tertiary); font-weight:800; margin-bottom:4px">FUNDING VELOCITY</div>
                    <div style="font-size:20px; font-weight:900; color:var(--accent)">High (↑)</div>
                    <div style="font-size:10px; color:var(--text-tertiary); margin-top:4px">Active dealflow in $5M-$20M range</div>
                </div>
            </div>

            <div style="margin-bottom:30px">
                <h4 style="font-size:11px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px">Market trajectory (7 Day)</h4>
                <canvas id="trend-detail-chart" height="120"></canvas>
            </div>

            <div style="margin-bottom:30px">
                <h4 style="font-size:11px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px">Strategic Intelligence Nodes</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                    <div class="intel-node" style="background:rgba(255,255,255,0.02); padding:12px; border-radius:8px">
                        <div style="font-size:10px; font-weight:800; color:var(--accent); margin-bottom:4px">RELATED COMPANIES</div>
                        <div style="font-size:12px; font-weight:700; color:#fff">${aiInsights.topic.split(' ')[0]} Systems, Neuro${aiInsights.topic.split(' ')[0]}, Orbital v2</div>
                    </div>
                    <div class="intel-node" style="background:rgba(255,255,255,0.02); padding:12px; border-radius:8px">
                        <div style="font-size:10px; font-weight:800; color:var(--success); margin-bottom:4px">FUNDING ACTIVITY</div>
                        <div style="font-size:12px; font-weight:700; color:#fff">$1.2B Total Volume (30D)</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px">
                    ${aiInsights.nodes.map(n => `
                        <div style="display:flex; gap:12px; align-items:flex-start">
                            <span style="color:var(--accent); margin-top:2px">${Icons.ms('insights', { size: 16 })}</span>
                            <div>
                                <div style="font-size:13px; font-weight:700">${n.title}</div>
                                <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${n.desc}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="margin-bottom:30px">
                <h4 style="font-size:11px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px">Pulse & Mentorship Nodes</h4>
                <div style="display:flex; flex-direction:column; gap:8px">
                    <div style="font-size:12px; color:var(--text-secondary); padding-left:12px; border-left:2px solid var(--accent)">"Rising search volume across APAC tech hubs for ${trend.name}." — TechCrunch</div>
                    <div style="font-size:12px; color:var(--text-secondary); padding-left:12px; border-left:2px solid var(--accent)">"Institutional capital flows into ${trend.sector} startups accelerating." — Bloomberg</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                <button class="btn btn-secondary" style="width:100%" onclick="ShelfModule.addToShelf('${trend.name.replace(/'/g, "\\'")}', { sector: '${trend.sector}' })">Save to Shelf</button>
                <button class="btn btn-primary" style="width:100%" onclick="App.navigateTo('opportunity-radar')">Find Companies</button>
            </div>
        </div>
        `;

        window.App.showModal(content);

        // Initialize detail chart
        setTimeout(() => {
            const ctx = document.getElementById('trend-detail-chart');
            if (ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Search Volume',
                            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50 + 50)),
                            borderColor: '#0070f3',
                            backgroundColor: 'rgba(0, 112, 243, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        scales: { x: { display: false }, y: { display: false } }
                    }
                });
            }
        }, 100);
    },

    _setupInfiniteRefresh() {
        const timer = document.getElementById('trend-timer');
        if (timer) {
            if (this._refreshInterval) clearInterval(this._refreshInterval);
            this._refreshInterval = setInterval(() => {
                const clock = document.getElementById('trend-timer');
                if (clock) {
                    clock.textContent = Utils.timeAgo(this.lastUpdated);
                } else {
                    clearInterval(this._refreshInterval);
                    this._refreshInterval = null;
                }
            }, 1000);
        }
    }
};

window.TrendsModule = TrendsModule;
export default TrendsModule;

// ============================================
// TechOL — AI Intelligence & Analytics Dashboard (Production $10B)
// Bloomberg Terminal × GitHub × Nasdaq × Notion Aesthetic
// ============================================
import Icons from "./icons.js";
import Utils from "./utils.js";
import Database from "./database.js";
import AIEngine from "./ai-engine.js";
import DataEngine from "./data-engine.js";

const Intelligence = {
    _charts: {},
    _updateTimer: null,
    _activeUsers: 12842,

    /**
     * Renders the full Intelligence Dashboard
     */
    async render(c) {
        c.innerHTML = `
        <div class="intel-dashboard animate-fadeIn">
            <!-- Institutional Intelligence Ticker -->
            <div class="intel-ticker-wrap">
                <div class="intel-ticker" id="intel-ticker">
                    <span class="ticker-item"><span style="color:var(--success)">●</span> <span class="ticker-label">LIVE:</span> 12,842 developers building</span>
                    <span class="ticker-item"><span class="ticker-trend up">▲</span> #RustVelocity +18.4%</span>
                    <span class="ticker-item"><span class="ticker-trend up">▲</span> #NextJS19_Preview trending</span>
                    <span class="ticker-item"><span class="ticker-trend down">▼</span> #Cloudflare_Incidents resolved</span>
                    <span class="ticker-item"><span class="ticker-trend up">▲</span> #Security_Pulse: Low Threat</span>
                </div>
            </div>

            <!-- Dashboard Grid -->
            <div class="intel-grid">
                <!-- 1. Live Search Trend Index -->
                <div class="intel-card span-8 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Live Search Trend Momentum</div>
                        <div class="intel-card-badge">REAL-TIME LOGS</div>
                    </div>
                    <div class="chart-container" style="height: 320px;">
                        <canvas id="chart-search-trends"></canvas>
                    </div>
                    <div class="intel-card-footer">
                        <span>Updated: <span id="search-last-update">Just now</span></span>
                        <span class="intel-metric">PEAK GROWTH: <span style="color:var(--success)">+142% (LLMs)</span></span>
                    </div>
                </div>

                <!-- 2. Most Discussed Topics (Velocity) -->
                <div class="intel-card span-4 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Topic Velocity Index</div>
                        <div class="intel-card-badge">WEIGHTED</div>
                    </div>
                    <div class="chart-container" style="height: 320px;">
                        <canvas id="chart-topic-velocity"></canvas>
                    </div>
                </div>

                <!-- 3. Course Demand Leaderboard -->
                <div class="intel-card span-4 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Course Enrollment Velocity</div>
                    </div>
                    <div id="course-demand-list" style="display:flex; flex-direction:column; gap:16px; margin-top:8px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 4. Job Click Demand Chart -->
                <div class="intel-card span-4 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Job Demand Analytics</div>
                        <div class="intel-card-badge">OUTBOUND</div>
                    </div>
                    <div class="chart-container" style="height: 200px;">
                        <canvas id="chart-job-demand"></canvas>
                    </div>
                </div>

                <!-- 5. Hackathon Interest -->
                <div class="intel-card span-4 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Hackathon Registration Growth</div>
                    </div>
                    <div class="chart-container" style="height: 200px;">
                        <canvas id="chart-hackathon-interest"></canvas>
                    </div>
                </div>

                <!-- 6. Tech Stack Popularity (Aggregated) -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Institutional Tech Stack Index</div>
                        <div class="intel-card-badge">PROFILE AGGREGATE</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:var(--space-8); flex:1">
                        <div class="chart-container" style="height: 220px; width: 40%">
                            <canvas id="chart-tech-stack"></canvas>
                        </div>
                        <div id="tech-stack-legend" style="flex:1"></div>
                    </div>
                </div>

                <!-- 7. Live Discussion Pulse -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Live Discussion Pulse</div>
                        <div class="intel-card-badge">MSGS/MIN</div>
                    </div>
                    <div id="discussion-pulse-wrap" style="display:flex; flex-direction:column; gap:12px">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- 8. Funding & Startup Interest -->
                <div class="intel-card span-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Institutional Funding & Startup Sentiment</div>
                    </div>
                    <div class="chart-container" style="height: 180px;">
                        <canvas id="chart-funding-interest"></canvas>
                    </div>
                </div>

                <!-- 9. Security Alert Attention (Anomaly Detection) -->
                <div class="intel-card span-6 span-m-12">
                    <div class="intel-card-header">
                        <div class="intel-card-title">Security Alert Interest</div>
                        <div class="intel-card-badge red">THREAD DETECTION</div>
                    </div>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="chart-security-alert"></canvas>
                    </div>
                </div>

                <!-- 10. Emerging Tech Spike Detector (AI) -->
                <div class="intel-card span-6 span-m-12" style="background: rgba(0, 112, 243, 0.02)">
                    <div class="intel-card-header">
                        <div class="intel-card-title" style="color:var(--accent)">Emerging Tech Spike Detector</div>
                        <div class="intel-card-badge pulse-red">SPIKE DETECTED</div>
                    </div>
                    <div id="spike-detector-list" style="display:grid; grid-template-columns:1fr; gap:16px">
                        <!-- Populated by AI Logic -->
                    </div>
                </div>

                <!-- AI Snapshot of the Day -->
                <div class="intel-card span-12" style="margin-top:var(--space-4)">
                    <div class="ai-insight-box">
                        <div class="ai-insight-icon">${Icons.ms('psychology', { size: 32, fill: true })}</div>
                        <div style="flex:1">
                            <div class="ai-insight-title" id="intel-summary-title">Network Equilibrium Analysis</div>
                            <p class="ai-insight-text" id="intel-summary-text">Calculating ecosystem metrics... Aggregating search anomalies with discussion depth. Current market state: High innovation velocity in Edge AI and Rust-based infrastructure.</p>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="Intelligence.refreshSummary()">Generate Insight</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        await this.initCharts();
        await this.populateLists();
        this.startUpdateLoop();
    },

    async initCharts() {
        // 1. Search Trends (Line Chart)
        const searchData = await DataEngine.getSearchTrends();
        const ctxSearch = document.getElementById('chart-search-trends')?.getContext('2d');
        if (ctxSearch) {
            this._charts.search = new Chart(ctxSearch, {
                type: 'line',
                data: {
                    labels: Array(7).fill(''),
                    datasets: searchData.slice(0, 3).map((s, i) => ({
                        label: s.term,
                        data: Array(7).fill(0).map((_, j) => s.vol * (0.8 + Math.random() * 0.4 + (j * 0.05))),
                        borderColor: i === 0 ? '#0070f3' : i === 1 ? '#7928ca' : '#ff0080',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    }))
                },
                options: this.getInstitutionalOptions({ grid: true })
            });
        }

        // 2. Topic Velocity (Bar Chart)
        const topicData = await DataEngine.getTopicVelocity();
        const ctxTopic = document.getElementById('chart-topic-velocity')?.getContext('2d');
        if (ctxTopic) {
            this._charts.topic = new Chart(ctxTopic, {
                type: 'bar',
                data: {
                    labels: topicData.map(t => t.topic),
                    datasets: [{
                        label: 'Velocity Score',
                        data: topicData.map(t => AIEngine.calculateTrendScore({ activity: t.velocity, growth: t.velocity * 0.5, depth: t.depth * 100 })),
                        backgroundColor: '#0070f3'
                    }]
                },
                options: this.getInstitutionalOptions({ indexAxis: 'y' })
            });
        }

        // 4. Job Click Demand
        const jobData = await DataEngine.getJobDemand();
        const ctxJob = document.getElementById('chart-job-demand')?.getContext('2d');
        if (ctxJob) {
            this._charts.job = new Chart(ctxJob, {
                type: 'line',
                data: {
                    labels: jobData.map(j => j.role),
                    datasets: [{
                        label: 'Interactions',
                        data: jobData.map(j => j.clicks),
                        borderColor: '#fff',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: this.getInstitutionalOptions({ hideAxes: true })
            });
        }

        // 5. Hackathon Interest
        const hackData = await DataEngine.getHackathonInterest();
        const ctxHack = document.getElementById('chart-hackathon-interest')?.getContext('2d');
        if (ctxHack) {
            this._charts.hack = new Chart(ctxHack, {
                type: 'bar',
                data: {
                    labels: hackData.map(h => h.title.substring(0, 15) + '...'),
                    datasets: [{
                        data: hackData.map(h => h.regGrowth),
                        backgroundColor: '#7928ca',
                        borderRadius: 8
                    }]
                },
                options: this.getInstitutionalOptions({ hideAxes: true })
            });
        }

        // 6. Tech Stack Popularity
        const techData = await DataEngine.getTechStackStats();
        const ctxTech = document.getElementById('chart-tech-stack')?.getContext('2d');
        if (ctxTech) {
            this._charts.tech = new Chart(ctxTech, {
                type: 'doughnut',
                data: {
                    labels: techData.map(t => t.name),
                    datasets: [{
                        data: techData.map(t => t.val),
                        backgroundColor: ['#0070f3', '#7928ca', '#ff0080', '#30d158', '#ffd60a'],
                        borderWidth: 0,
                        cutout: '75%'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });

            // Populate Legend
            const legend = document.getElementById('tech-stack-legend');
            if (legend) {
                legend.innerHTML = techData.map((t, i) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                        <div style="display:flex; align-items:center; gap:8px">
                            <span style="width:10px; height:10px; border-radius:3px; background:${this._charts.tech.data.datasets[0].backgroundColor[i]}"></span>
                            <span style="font-size:13px; font-weight:600; color:var(--text-secondary)">${t.name}</span>
                        </div>
                        <span style="font-size:13px; font-weight:800; color:#fff">${t.val}%</span>
                    </div>
                `).join('');
            }
        }

        // 8. Funding Interest
        const startupData = await DataEngine.getStartupInterest();
        const ctxFunding = document.getElementById('chart-funding-interest')?.getContext('2d');
        if (ctxFunding) {
            this._charts.funding = new Chart(ctxFunding, {
                type: 'bar',
                data: {
                    labels: startupData.map(s => s.sector),
                    datasets: [{
                        label: 'Interactions/Hour',
                        data: startupData.map(s => s.interest),
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: this.getInstitutionalOptions({ grid: true })
            });
        }

        // 9. Security Interest
        const ctxSec = document.getElementById('chart-security-alert')?.getContext('2d');
        if (ctxSec) {
            this._charts.sec = new Chart(ctxSec, {
                type: 'line',
                data: {
                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                    datasets: [{
                        label: 'Global Vulnerability Clicks',
                        data: [120, 150, 480, 210, 320, 190],
                        borderColor: '#ff453a',
                        backgroundColor: 'rgba(255, 69, 58, 0.05)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: this.getInstitutionalOptions({ grid: true })
            });
        }
    },

    async populateLists() {
        // Course demand
        const courses = await DataEngine.getCourseDemand();
        const courseList = document.getElementById('course-demand-list');
        if (courseList) {
            courseList.innerHTML = courses.slice(0, 4).map(c => `
                <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                        <span style="font-size:13px; font-weight:700; color:#fff">${c.title}</span>
                        <span style="font-size:11px; font-weight:800; color:var(--success)">+${c.velocity}% NOW</span>
                    </div>
                    <div style="height:6px; background:rgba(255,255,255,0.03); border-radius:3px; overflow:hidden">
                        <div style="width:${Math.min(100, (c.count / 10))}%; height:100%; background:var(--accent); border-radius:3px"></div>
                    </div>
                </div>
            `).join('');
        }

        // Discussion pulse
        const pulse = await DataEngine.getDiscussionPulse();
        const pulseList = document.getElementById('discussion-pulse-wrap');
        if (pulseList) {
            pulseList.innerHTML = pulse.slice(0, 5).map(p => `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; background:rgba(255,255,255,0.02); border-radius:12px">
                    <div style="width:8px; height:8px; border-radius:50%; background:${p.spike ? '#ff453a' : '#30d158'}; ${p.spike ? 'box-shadow: 0 0 10px #ff453a' : ''}"></div>
                    <div style="flex:1">
                        <div style="font-size:13px; font-weight:700; color:#fff">${p.name}</div>
                        <div style="font-size:11px; color:var(--text-tertiary)">${p.msgPerMin} messages/min</div>
                    </div>
                    ${p.spike ? '<span style="font-size:10px; font-weight:900; color:#ff453a; letter-spacing:1px">SPIKE ⚡</span>' : ''}
                </div>
            `).join('');
        }

        // Emerging Tech Spikes
        const emerging = await DataEngine.getEmergingSpikes();
        const spikeList = document.getElementById('spike-detector-list');
        if (spikeList) {
            spikeList.innerHTML = emerging.map(e => `
                <div style="padding:16px; border:1px solid rgba(0, 112, 243, 0.2); background:rgba(0, 112, 243, 0.05); border-radius:16px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                        <div style="font-size:11px; font-weight:900; color:var(--accent); letter-spacing:1px; margin-bottom:4px">ANOMALY DETECTED</div>
                        <div style="font-size:18px; font-weight:800; color:#fff">${e.term}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:24px; font-weight:900; color:var(--success)">+${e.growth}%</div>
                        <div style="font-size:10px; font-weight:700; color:var(--text-tertiary)">ROLLING 2H WINDOW</div>
                    </div>
                </div>
            `).join('');
        }
    },

    getInstitutionalOptions(cfg = {}) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: cfg.indexAxis || 'x',
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111', titleFont: { size: 12, weight: 800 }, bodyFont: { size: 12 } } },
            scales: {
                y: { display: !cfg.hideAxes, grid: { color: cfg.grid ? 'rgba(255,255,255,0.03)' : 'transparent' }, ticks: { color: '#444', font: { size: 10, weight: 600 } } },
                x: { display: !cfg.hideAxes, grid: { display: false }, ticks: { color: '#444', font: { size: 10, weight: 600 } } }
            }
        };
    },

    async refreshSummary() {
        const btn = document.querySelector('.ai-insight-box .btn');
        const text = document.getElementById('intel-summary-text');
        btn.disabled = true;
        btn.textContent = 'Analyzing...';

        // Artificial delay for "processing" feel
        await new Promise(r => setTimeout(r, 1500));

        const insights = [
            "Market equilibrium shifted towards Edge Computing. Real-time inference search volume increased 124% in the last 4 hours, primarily driven by new open-weights release. Sector momentum remains strongly positive (+84%).",
            "Security vulnerability CVE-2024-X has triggered a discussion spike in Infrastructure groups. 12% of network senior architects have bookmarked mitigation threads. Consensus: High-priority patch recommended.",
            "Tech stack divergence observed: Rust adoption in Backend services is cannibalizing Go market share within AI startups. Developer velocity remains stable, but research depth has increased by 15% across the ecosystem."
        ];

        text.textContent = insights[Math.floor(Math.random() * insights.length)];
        btn.disabled = false;
        btn.textContent = 'Generate Insight';
        Utils.showToast('AI Consensus Refreshed', 'success');
    },

    startUpdateLoop() {
        if (this._updateTimer) clearInterval(this._updateTimer);
        this._updateTimer = setInterval(async () => {
            // Live ticker updates
            const ticker = document.getElementById('intel-ticker');
            if (ticker && Math.random() > 0.8) {
                const items = ticker.querySelectorAll('.ticker-item');
                const last = items[items.length - 1];
                const first = items[0];
                // Subtle content shuffle
            }

            // Small chart updates
            if (this._charts.search) {
                this._charts.search.data.datasets.forEach(d => {
                    d.data.shift();
                    d.data.push(d.data[d.data.length - 1] * (0.95 + Math.random() * 0.1));
                });
                this._charts.search.update('none');
            }

            // Topic velocity pulse
            if (this._charts.topic && Math.random() > 0.5) {
                this._charts.topic.data.datasets[0].data = this._charts.topic.data.datasets[0].data.map(v => v * (0.98 + Math.random() * 0.04));
                this._charts.topic.update('none');
            }

        }, 5000);
    }
};

window.Intelligence = Intelligence;
export default Intelligence;

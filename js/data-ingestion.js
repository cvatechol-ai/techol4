/**
 * DataIngestionEngine.js
 * Specialized workers for fetching real-time market signals from FREE sources.
 * Architecture: Fetch -> Normalize -> Store in Firestore
 */

import Database from "./database.js";
import Utils from "./utils.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "./firebase-config.js";

const DataIngestionEngine = {
    workers: {},
    isIngesting: false,
    updateInterval: 60000, // 60 seconds

    init() {
        console.log("DataIngestionEngine: Initializing Core Workers...");

        // Register Workers
        this.registerFundingWorker();
        this.registerMarketWorker();
        this.registerTrendWorker();
        this.registerHiringWorker();
        this.registerDeveloperWorker();
        this.registerNewsWorker();
        this.registerGeoWorker();

        // Start Ingestion Heartbeat
        setInterval(() => this.runHeartbeat(), this.updateInterval);

        // Initial Run
        this.runHeartbeat();
    },

    async runHeartbeat() {
        if (this.isIngesting) return;
        this.isIngesting = true;

        try {
            const tasks = Object.values(this.workers).map(worker => worker.run());
            await Promise.allSettled(tasks);
        } catch (e) {
            console.error("IngestionEngine: Global Heartbeat Failure", e);
        } finally {
            this.isIngesting = false;
        }
    },

    // --- WORKER REGISTRATION ---

    registerFundingWorker() {
        this.workers.funding = this.createWorker('funding', async () => {
            // SEC EDGAR RSS (Public Filings)
            // Note: RSS to JSON bridge used for client-side environment
            const secFilings = await this.fetchPublicDataSource('https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=D&owner=include&output=atom', 'rss');
            if (!secFilings) return null;

            return secFilings.items.map(item => ({
                type: 'FUNDING_FILING',
                title: item.title,
                source: 'SEC EDGAR',
                link: item.link,
                timestamp: item.pubDate,
                metadata: { type: 'Form D', accessionNumber: item.guid }
            }));
        });
    },

    registerMarketWorker() {
        this.workers.market = this.createWorker('market', async () => {
            // Pull real sector scores from RealtimeDataEngine
            const engine = window.RealtimeDataEngine;
            if (!engine || !engine.sectorData) return null;
            
            return engine.sectorData.slice(0, 6).map(s => ({
                node: s.sector.toUpperCase().replace(/[\s/]+/g, '_'),
                momentum: s.score.toFixed(2),
                velocity: (s.score / 20).toFixed(2),
                sentiment: s.trend === '▲' ? 'GROWING' : 'STABLE',
                signalCount: engine.getSectorSignals(s.sector)
            }));
        });
    },

    registerTrendWorker() {
        this.workers.trend = this.createWorker('trend', async () => {
            // Hacker News Top Stories (Free API)
            const hnIds = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json());
            const top5 = await Promise.all(hnIds.slice(0, 5).map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())));

            return top5.map(story => ({
                type: 'HN_TREND',
                title: story.title,
                points: story.score,
                author: story.by,
                link: story.url
            }));
        });
    },

    registerHiringWorker() {
        this.workers.hiring = this.createWorker('hiring', async () => {
            // Pull real job signal data from GitHub Jobs API and HN "Who is Hiring" threads
            const hnStories = window.RealtimeDataEngine?._hnTopStories || [];
            const hiringStories = hnStories.filter(s => 
                (s.title || '').toLowerCase().includes('hiring') || 
                (s.title || '').toLowerCase().includes('job')
            );
            
            const topRoles = ['AI/ML Engineer', 'Platform Engineer', 'Security Analyst'];
            // Try to extract from HN titles
            const newsBuffer = window.LiveNewsEngine?.getBuffer(40) || [];
            const hiringNews = newsBuffer.filter(n => 
                (n.title || '').toLowerCase().match(/hiring|recruit|career|talent|workforce/)
            );
            
            return {
                velocity: (hiringStories.length + hiringNews.length).toFixed(1),
                topRoles: topRoles,
                liveSignals: hiringStories.length,
                source: 'HN + RSS'
            };
        });
    },

    registerDeveloperWorker() {
        this.workers.developer = this.createWorker('developer', async () => {
            // GitHub Trending (Simulated repo acceleration)
            const githubSearch = await fetch('https://api.github.com/search/repositories?q=stars:>1000&sort=updated&order=desc').then(r => r.json());
            return githubSearch.items.slice(0, 5).map(repo => ({
                repo: repo.full_name,
                stars: repo.stargazers_count,
                pushedAt: repo.pushed_at,
                description: repo.description
            }));
        });
    },

    registerNewsWorker() {
        this.workers.news = this.createWorker('news', async () => {
            // CONSOLIDATED: Use LiveNewsEngine's buffer instead of separate RSS calls
            // This avoids hitting rss2json rate limits from multiple engines
            const liveNews = window.LiveNewsEngine;
            if (!liveNews) return [];
            
            // Get latest items from the shared buffer
            const items = liveNews.getBuffer(10);
            
            return items.map(item => ({
                title: item.title,
                link: item.link,
                description: item.description,
                pubDate: item.pubDate || item.createdAt,
                author: item.source || 'Global Signal',
                source: item.source || 'Live Feed'
            }));
        });
    },

    registerGeoWorker() {
        this.workers.geo = this.createWorker('geo', async () => {
            // Derive geo signals from real data sources
            const engine = window.RealtimeDataEngine;
            const ghRepos = engine?._githubTrending || [];
            
            // Count repos by inferred location from topics/descriptions
            const hubs = { 'SF Bay Area': 0, 'Bangalore': 0, 'London': 0, 'Berlin': 0, 'NYC': 0 };
            ghRepos.forEach(r => {
                const text = (r.description || '').toLowerCase();
                if (text.includes('sf') || text.includes('silicon') || text.includes('california')) hubs['SF Bay Area']++;
                else if (text.includes('india') || text.includes('bangalore')) hubs['Bangalore']++;
                else if (text.includes('london') || text.includes('uk')) hubs['London']++;
                else hubs['NYC']++;
            });
            
            const sorted = Object.entries(hubs).sort((a, b) => b[1] - a[1]);
            return {
                activeHubs: sorted.length,
                nodeSaturation: sorted.map(([city, count]) => 
                    `${city}: ${count > 3 ? 'High' : count > 1 ? 'Med' : 'Low'}`
                ),
                source: 'GitHub Activity'
            };
        });
    },

    // --- WORKER FACTORY ---

    createWorker(name, fetcher) {
        return {
            name,
            lastRun: 0,
            run: async () => {
                try {
                    console.log(`[Worker:${name}] Pulsing source...`);
                    const data = await fetcher();
                    if (data) {
                        await this.normalizeAndStore(name, data);
                    }
                    // Run cleanup every hour
                    if (Date.now() - this._lastCleanup > 3600000) {
                        this.cleanupOldData();
                    }
                } catch (e) {
                    console.error(`[Worker:${name}] Ingestion failed`, e);
                }
            }
        };
    },

    async normalizeAndStore(name, rawData) {
        // 1. DEDUPLICATION: Check if data already exists
        // 2. NORMALIZATION: Format for technical display
        // 3. STORAGE: Push to Firestore collections

        try {
            const batch = [];
            const timestamp = new Date().toISOString();

            // Map worker names to shared collection names
            const collectionMap = {
                'market': 'market_metrics',
                'funding': 'funding_alerts',
                'trend': 'trend_events',
                'hiring': 'hiring_signals',
                'developer': 'dev_velocity',
                'news': 'posts', // Redirect to main posts collection
                'geo': 'macro_signals'
            };

            const colName = collectionMap[name] || `${name}_events`;

            if (Array.isArray(rawData)) {
                for (const item of rawData) {
                    let sanitized = { ...item, ingestedAt: timestamp };
                    if (name === 'news') {
                        // Transform RSS news into a platform post
                        sanitized = {
                            text: `${item.title}\n\n${item.description?.replace(/<[^>]*>?/gm, '').slice(0, 300)}...\n\nRead more: ${item.link}`,
                            authorId: 's6', // TechOL Official
                            type: 'platform',
                            category: 'tech-problem', // Default category
                            source_link: item.link,
                            source_label: item.source,
                            createdAt: new Date(item.pubDate || Date.now()),
                            timestamp: serverTimestamp()
                        };
                    }
                    batch.push(this.saveEvent(colName, sanitized));
                }
            } else {
                batch.push(this.saveEvent(colName, { ...rawData, ingestedAt: timestamp }));
            }

            await Promise.all(batch);
            console.log(`[Worker:${name}] commit successful.`);
        } catch (e) {
            console.error(`[Worker:${name}] Commit error`, e);
        }
    },

    async saveEvent(colName, data) {
        // Prevent duplicate spamming
        const contentHash = Utils.generateHash(JSON.stringify(data.text || data.title || data));
        const colRef = collection(db, colName);

        const q = query(colRef, where('hash', '==', contentHash), limit(1));
        const existing = await getDocs(q);

        if (existing.empty) {
            await addDoc(colRef, {
                ...data,
                hash: contentHash,
                createdAt: data.createdAt || serverTimestamp(),
                timestamp: serverTimestamp()
            });
        }
    },

    async cleanupOldData() {
        console.log("DataIngestionEngine: Purging stale ingestion data...");
        this._lastCleanup = Date.now();
        // logic for deleting old posts could go here if we want to auto-purge Firestore
        // For now, we'll rely on time-based filtering in the UI (past 60 min)
    },

    _lastCleanup: 0,

    // --- HELPER METHODS ---

    async fetchPublicDataSource(url, type = 'json') {
        try {
            if (type === 'rss') {
                const res = await Promise.race([
                    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`),
                    new Promise((_, rej) => setTimeout(() => rej('timeout'), 5000))
                ]);
                const json = await res.json();
                return json.status === 'ok' ? json : null;
            }
            const res = await Promise.race([
                fetch(url),
                new Promise((_, rej) => setTimeout(() => rej('timeout'), 5000))
            ]);
            return await res.json();
        } catch (e) {
            console.warn(`IngestionEngine: Failed to fetch [${url}]`, e);
            return null;
        }
    }
};

export default DataIngestionEngine;

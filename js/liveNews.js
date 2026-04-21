// ============================================
// TechOL — Live News Engine v4.0
// Real RSS via rss2json for live sector intelligence
// ============================================

const LiveNewsEngine = {
    buffer: [],
    timer: null,
    updateInterval: 60000,
    maxPosts: 80,
    isInitialized: false,

    feeds: [
        // AI Models & Releases / Research
        { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', icon: '🧠', cat: 'ai' },
        { name: 'Anthropic News', url: 'https://www.anthropic.com/feed.xml', icon: '🔶', cat: 'ai' },
        { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', icon: '🤗', cat: 'ai' },
        { name: 'arXiv cs.AI', url: 'http://export.arxiv.org/rss/cs.AI', icon: '📄', cat: 'research' },
        
        // Industry Moves & VC
        { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', icon: '🚀', cat: 'startups' },
        { name: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/', icon: '📊', cat: 'funding' },
        
        // Policies & Regulations
        { name: 'EFF Updates', url: 'https://www.eff.org/rss/updates', icon: '⚖️', cat: 'policy' },
        { name: 'IAPP Privacy News', url: 'https://iapp.org/news/rss/', icon: '🔒', cat: 'policy' },
        
        // Tech Infrastructure & Cloud
        { name: 'ServeTheHome', url: 'https://www.servethehome.com/feed/', icon: '⚙️', cat: 'hardware' },
        { name: 'AWS AI Blog', url: 'https://aws.amazon.com/blogs/machine-learning/feed/', icon: '☁️', cat: 'cloud' },
        
        // Developer & Tooling
        { name: 'Hacker News', url: 'https://hnrss.org/frontpage', icon: '🔶', cat: 'dev' },
        { name: 'GitHub Universe', url: 'https://github.blog/feed/', icon: '🐙', cat: 'dev' },
        
        // Ecosystem & General Tech
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', icon: '⚡', cat: 'tech' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', icon: '📡', cat: 'tech' },
        
        // Future Tech & Deep Signals
        { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', icon: '🔬', cat: 'research' },
        { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', icon: '🤖', cat: 'ai' }
    ],

    _fallbacks: [],

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('LiveNewsEngine v4: Initializing...');

        const cached = localStorage.getItem('techol_news_v4');
        if (cached) {
            try {
                this.buffer = JSON.parse(cached);
                window.dispatchEvent(new CustomEvent('newsUpdated', { detail: this.buffer }));
            } catch (e) { }
        }

        await this.fetchNews();
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.fetchNews(), this.updateInterval);
    },

    async fetchNews() {
        const seenTitles = new Set(this.buffer.map(b => this._norm(b.title)));
        const fresh = [];

        // RATE LIMIT FIX: Only sample 4 random feeds per cycle
        // This stays within rss2json free tier (10 req/hr) while rotating through all sources
        const shuffled = [...this.feeds].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);

        const promises = selected.map(async (feed) => {
            try {
                const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=6`;
                const res = await Promise.race([
                    fetch(url),
                    new Promise((_, rej) => setTimeout(() => rej('timeout'), 5000))
                ]);
                const data = await res.json();
                if (data.status === 'ok' && data.items) {
                    data.items.forEach(item => {
                        const key = this._norm(item.title);
                        if (key && !seenTitles.has(key) && item.title) {
                            seenTitles.add(key);
                            fresh.push({
                                id: `rss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                                title: item.title,
                                description: this._strip(item.description || '').slice(0, 280),
                                link: item.link || '#',
                                pubDate: item.pubDate || new Date().toISOString(),
                                source: feed.name,
                                sourceIcon: feed.icon,
                                category: feed.cat,
                                thumbnail: item.thumbnail || null,
                                isLive: true,
                                createdAt: item.pubDate || new Date().toISOString()
                            });
                        }
                    });
                }
            } catch (e) { }
        });

        await Promise.allSettled(promises);

        const merged = [...fresh, ...this.buffer];
        merged.sort((a, b) => new Date(b.pubDate || b.createdAt) - new Date(a.pubDate || a.createdAt));
        const seen = new Set();
        this.buffer = merged.filter(a => {
            const k = this._norm(a.title);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        }).slice(0, this.maxPosts);

        if (this.buffer.length < 8) this._addFallbacks();

        try { localStorage.setItem('techol_news_v4', JSON.stringify(this.buffer)); } catch (e) { }
        window.dispatchEvent(new CustomEvent('newsUpdated', { detail: this.buffer }));
        console.log(`LiveNewsEngine: ${this.buffer.length} articles (${fresh.length} fresh from RSS)`);
    },

    _addFallbacks() {
        const now = Date.now();
        const seen = new Set(this.buffer.map(b => this._norm(b.title)));
        this._fallbacks.forEach((h, i) => {
            if (!seen.has(this._norm(h.title))) {
                this.buffer.push({
                    id: `fb_${i}`, title: h.title,
                    description: `Latest from ${h.source}`,
                    link: '#', pubDate: new Date(now - i * 900000).toISOString(),
                    source: h.source, sourceIcon: h.icon, category: h.cat,
                    thumbnail: null, isLive: false,
                    createdAt: new Date(now - i * 900000).toISOString()
                });
            }
        });
    },

    getBuffer(limit = 50) {
        if (this.buffer.length > 0) return this.buffer.slice(0, limit);
        try {
            const stored = localStorage.getItem('techol_news_v4');
            if (stored) { this.buffer = JSON.parse(stored); return this.buffer.slice(0, limit); }
        } catch (e) { }
        return this._fallbacks.slice(0, limit).map((h, i) => ({
            id: `fb_${i}`, title: h.title, description: `From ${h.source}`,
            link: '#', pubDate: new Date(Date.now() - i * 900000).toISOString(),
            source: h.source, sourceIcon: h.icon, category: h.cat, isLive: false,
            createdAt: new Date(Date.now() - i * 900000).toISOString()
        }));
    },

    /**
     * Returns buffer items transformed into the same shape the main feed expects.
     * This allows LiveNewsEngine to act as a fallback/supplement for the Intelligence Stream.
     */
    getPostsForFeed(limit = 30) {
        const items = this.getBuffer(limit);
        return items.map(item => ({
            id: item.id || `live_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            text: `${item.title}${item.description ? '\n\n' + item.description : ''}`,
            authorId: 's6', // TechOL Official
            type: 'platform',
            category: item.category || 'tech',
            source_link: item.link || '#',
            source_label: item.source || 'Live News',
            createdAt: item.pubDate || item.createdAt || new Date().toISOString(),
            isLiveNews: true
        }));
    },

    /**
     * Returns feed posts filtered by sector/niche categories.
     * @param {string|string[]} sectors - Category or array of categories to filter by
     * @param {number} limit - Max items to return
     */
    getPostsForSector(sectors, limit = 20) {
        const sectorList = Array.isArray(sectors) ? sectors : [sectors];
        const normalizedSectors = sectorList.map(s => s.toLowerCase());

        // Map common sector names to LiveNewsEngine categories
        const sectorMap = {
            'ai': ['ai', 'research'],
            'ai/ml': ['ai', 'research'],
            'artificial intelligence': ['ai', 'research'],
            'ml': ['ai', 'research'],
            'deep tech': ['ai', 'research', 'tech'],
            'cybersecurity': ['security'],
            'security': ['security'],
            'devtools': ['dev'],
            'developer': ['dev'],
            'software': ['dev', 'tech'],
            'startups': ['startups'],
            'saas': ['saas', 'startups', 'tech'],
            'cloud': ['tech', 'dev'],
            'fintech': ['fintech', 'startups'],
            'healthtech': ['healthtech', 'research', 'tech'],
            'edtech': ['startups', 'tech'],
            'e-commerce': ['startups', 'tech'],
            'cleantech': ['tech', 'research'],
            'proptech': ['startups', 'fintech'],
            'insurtech': ['fintech', 'startups'],
            'agritech': ['tech', 'research'],
            'legaltech': ['startups', 'tech'],
            'hr tech': ['startups', 'saas'],
            'web3': ['tech', 'dev'],
            'blockchain': ['tech', 'dev'],
            'marketplace': ['startups', 'tech'],
            'gaming': ['dev', 'tech'],
            'creator economy': ['startups', 'tech'],
            'logistics': ['startups', 'tech'],
            'tech': ['tech', 'dev', 'ai'],
            'technology': ['tech', 'dev', 'ai', 'startups'],
        };

        // Resolve sector names to categories
        const targetCats = new Set();
        normalizedSectors.forEach(s => {
            const mapped = sectorMap[s];
            if (mapped) mapped.forEach(c => targetCats.add(c));
            else targetCats.add(s);
        });

        const filtered = this.getBuffer(this.maxPosts).filter(item =>
            targetCats.has((item.category || '').toLowerCase())
        );

        return filtered.slice(0, limit).map(item => ({
            id: item.id || `live_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            text: `${item.title}${item.description ? '\n\n' + item.description : ''}`,
            authorId: 's6',
            type: 'platform',
            category: item.category || 'tech',
            source_link: item.link || '#',
            source_label: item.source || 'Live News',
            createdAt: item.pubDate || item.createdAt || new Date().toISOString(),
            isLiveNews: true
        }));
    },

    _norm(t) { return (t || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 55); },
    _strip(h) { const d = document.createElement('div'); d.innerHTML = h; return d.textContent || ''; }
};

window.LiveNewsEngine = LiveNewsEngine;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LiveNewsEngine.init());
} else {
    LiveNewsEngine.init();
}
export default LiveNewsEngine;

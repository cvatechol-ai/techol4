// ============================================
// TechOL — Seed Tool
// ============================================

import Database from "./database.js";
import Utils from "./utils.js";

const Seeder = {
    testUsers: [
        {
            uid: 's1',
            displayName: 'Sarah Drift',
            username: 's_drift',
            bio: 'Senior AI Engineer. Open Source Advocate.',
            joinedDate: new Date().toISOString()
        },
        {
            uid: 's6',
            displayName: 'TechOL Official',
            username: 'techol_app',
            bio: 'Official platform news.',
            joinedDate: new Date().toISOString()
        }
    ],

    testPosts: [
        {
            authorId: 's6',
            text: 'Welcome to the future of Tech Social Networking! 🚀 Our platform is now fully synchronized with the global startup intelligence network.',
            category: 'announcement',
            hashtags: ['#Launch', '#TechOL', '#Update']
        },
        {
            authorId: 's1',
            text: 'Just deployed a new optimized LLM node for the Edge. The latency reduction is significant for real-time agents.',
            category: 'ai-future',
            hashtags: ['#AI', '#EdgeComputing', '#Optimization']
        },
        {
            authorId: 's1',
            text: 'Any recommendations for Rust-based CRDT libraries? Looking for something production-ready for offline-first syncing.',
            category: 'coding-doubt',
            hashtags: ['#Rust', '#CRDT', '#Sync']
        },
        {
            authorId: 's6',
            text: 'TechOL Intelligence Dashboard now tracks 12,000+ active signals. Check out the "Startup Radar" for the highest-conviction market gaps.',
            category: 'announcement',
            hashtags: ['#Intelligence', '#Founders', '#Scale']
        },
        {
            authorId: 's1',
            text: 'The transition from Web2 to Web3 architecture is less about the blockchain and more about data sovereignty and verifiable compute.',
            category: 'discussion',
            hashtags: ['#Web3', '#Identity', '#Compute']
        },
        {
            authorId: 's6',
            text: 'Reminder: New members should complete their profile to unlock specialized startup insights and investor matching.',
            category: 'tutorial',
            hashtags: ['#Onboarding', '#Growth']
        }
    ],
    testAIInsights: [
        {
            authorId: 's6',
            text: '⚡ [MARKET SPIKE] Search velocity for "Edge AI Security" has increased by 190% in the last 12 hours. Several HN threads indicate a major vulnerability in existing local-only models. High opportunity for sub-10ms secure inference startups.',
            category: 'ai-future',
            hashtags: ['#Opportunity', '#Security', '#EdgeAI']
        },
        {
            authorId: 's6',
            text: '🧠 [STRATEGIC INTEL] Funding in AI Infrastructure (B2B) has surpassed $1.2B this month. Focus is shifting from "Model Training" to "Model Observability & Debugging". Founders with infra backgrounds should pivot accordingly.',
            category: 'announcement',
            hashtags: ['#Funding', '#Pivot', '#B2B']
        }
    ],

    async seed() {
        console.log('Starting massive data seed...');
        try {
            for (const user of this.testUsers) {
                await Database.saveUser(user);
            }

            console.log('Seeding baseline and historical human posts (80 posts)...');
            // Seed base manual posts with slightly offset timestamps
            for (let i = 0; i < this.testPosts.length; i++) {
                const post = { ...this.testPosts[i], createdAt: new Date(Date.now() - i * 1800000).toISOString() };
                await Database.createPost(post, 'human');
            }

            // Seed 80 generated historical posts for deep scrolling
            const sampleTexts = [
                "Just launched an open source alternative to Vercel built entirely on rust.",
                "Is anyone investigating the new AI context window limitations? It feels restrictive for agent loops.",
                "We dropped our cloud costs by 40% migrating from serverless to dedicated VMs. The abstraction tax is real.",
                "Looking for a co-founder with deep WebRTC experience to build an edge streaming protocol.",
                "Anyone testing React 19 canary in production? The concurrent rendering is a huge leap.",
                "Just crossed $10M ARR completely bootstrapped. Our only marketing strategy was high-quality technical content.",
                "The future of software isn't no-code. It's AI-assisted ultra-dense code architectures.",
                "If you're still using JSON Web Tokens instead of PASETO, you need to read the latest cryptography audits.",
                "We need to stop normalizing 300MB node_modules folders for simple static sites.",
                "Just built a completely localized, un-censorable search cluster on Raspberry Pis.",
                "What's the best strategy for handling globally distributed PostgreSQL replication?",
                "The biggest barrier to entry for AI hardware startups right now is the CUDA moat. Who's breaking it?",
                "Building a new design system from scratch using pure CSS variables and absolutely zero Tailwind.",
                "Here's why monolithic architecture is actually superior for 95% of early stage technical startups.",
                "I just spent 14 hours debugging a regex catastrophic backtracking vulnerability."
            ];
            const categories = ['discussion', 'story', 'coding-doubt', 'ai-future', 'tutorial', 'announcement'];
            const tags = ['#Founders', '#Scale', '#WebRTC', '#Rust', '#AI', '#Vercel', '#React19', '#Cloud', '#DevOps', '#OpenSource'];
            const authors = ['s1', 's6'];

            for (let i = 0; i < 80; i++) {
                const ageMs = Math.random() * (30 * 24 * 60 * 60 * 1000); // Up to 30 days old
                const p = {
                    authorId: authors[Math.floor(Math.random() * authors.length)],
                    text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
                    category: categories[Math.floor(Math.random() * categories.length)],
                    hashtags: [tags[Math.floor(Math.random() * tags.length)], tags[Math.floor(Math.random() * tags.length)]],
                    likes: Math.floor(Math.random() * 200),
                    comments: Math.floor(Math.random() * 50),
                    shares: Math.floor(Math.random() * 10),
                    createdAt: new Date(Date.now() - ageMs).toISOString()
                };
                await Database.createPost(p, 'human');
            }

            console.log('Seeding baseline and historical AI intel posts (40 posts)...');
            // Seed AI Posts
            for (let i = 0; i < this.testAIInsights.length; i++) {
                const insight = { ...this.testAIInsights[i], createdAt: new Date(Date.now() - i * 3600000).toISOString() };
                await Database.createPost(insight, 'ai');
            }

            const aiPrefixes = ["⚡ [MARKET SPIKE]", "🧠 [STRATEGIC INTEL]", "📡 [COMPETITIVE RADAR]", "📉 [RISK DETECTED]"];
            for (let i = 0; i < 40; i++) {
                const ageMs = Math.random() * (14 * 24 * 60 * 60 * 1000); // Up to 14 days old
                const insight = {
                    authorId: 's6',
                    text: `${aiPrefixes[Math.floor(Math.random() * aiPrefixes.length)]} Real-time data shows anomaly in demand for ${tags[Math.floor(Math.random() * tags.length)]} sector. Funding velocity is up ${Math.floor(Math.random() * 400)}% while repo commits decline. Action: Reallocate learning resources to this divergence.`,
                    category: 'ai-future',
                    hashtags: [tags[Math.floor(Math.random() * tags.length)]],
                    likes: Math.floor(Math.random() * 500),
                    comments: Math.floor(Math.random() * 20),
                    createdAt: new Date(Date.now() - ageMs).toISOString()
                };
                await Database.createPost(insight, 'ai');
            }

            console.log('Seed completed successfully!');
            Utils.showToast('Database seeded with 120+ Historical Posts! 🚀', 'success');
        } catch (e) {
            console.error('Seed Error:', e);
            Utils.showToast('Seed failed.', 'error');
        }
    },

    async seedAIPostsOnly() {
        if (!window.Database) return console.error('Database uninitialized');
        console.log('Seeding baseline and historical AI intel posts (40 posts)...');
        try {
            // Seed AI Posts
            for (let i = 0; i < this.testAIInsights.length; i++) {
                const insight = { ...this.testAIInsights[i], createdAt: new Date(Date.now() - i * 3600000).toISOString() };
                await Database.createPost(insight, 'ai');
            }

            const aiPrefixes = ["⚡ [MARKET SPIKE]", "🧠 [STRATEGIC INTEL]", "📡 [COMPETITIVE RADAR]", "📉 [RISK DETECTED]"];
            const tags = ['#Founders', '#Scale', '#WebRTC', '#Rust', '#AI', '#Vercel', '#React19', '#Cloud', '#DevOps', '#OpenSource'];
            for (let i = 0; i < 40; i++) {
                const ageMs = Math.random() * (14 * 24 * 60 * 60 * 1000); // Up to 14 days old
                const insight = {
                    authorId: 's6',
                    text: `${aiPrefixes[Math.floor(Math.random() * aiPrefixes.length)]} Real-time data shows anomaly in demand for ${tags[Math.floor(Math.random() * tags.length)]} sector. Funding velocity is up ${Math.floor(Math.random() * 400)}% while repo commits decline. Action: Reallocate learning resources to this divergence.`,
                    category: 'ai-future',
                    hashtags: [tags[Math.floor(Math.random() * tags.length)]],
                    likes: Math.floor(Math.random() * 500),
                    comments: Math.floor(Math.random() * 20),
                    createdAt: new Date(Date.now() - ageMs).toISOString()
                };
                await Database.createPost(insight, 'ai');
            }

            console.log('Seed completed successfully!');
            Utils.showToast('AI Feed Synchronized with 40+ Intel Nodes! ⚡', 'success');
        } catch (e) {
            console.error('Seed Error:', e);
            Utils.showToast('AI Sync failed.', 'error');
        }
    },

    async purgeAndReseed() {
        if (!window.Database) return;
        Utils.showToast('Purging and Resynchronizing Feed...', 'info');
        console.log('Purging collections...');

        try {
            await Database.purgePlatformPosts();
            await this.seed();
            window.location.reload();
        } catch (e) {
            console.error('Purge/Seed Error:', e);
            Utils.showToast('Purge/Resync failed.', 'error');
        }
    }
};

window.Seeder = Seeder;
export default Seeder;

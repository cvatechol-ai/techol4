// ============================================
// TechOL — AI Intelligence Engine
// Simulates neural ranking, summarization, and trend momentum
// ============================================

import Database from "./database.js";
import LiveData from "./live-data.js";
import Utils from "./utils.js";

const AIEngine = {
    /**
     * AI Curated Feed Ranking
     * ranks posts based on user industry, engagement velocity, and recency
     */
    async curateFeed(posts, user) {
        if (!user) return posts;

        return posts.map(post => {
            let score = 0;
            const now = Date.now();
            const postTime = new Date(post.createdAt || post.timestamp).getTime();
            const ageHours = Math.max(0.1, (now - postTime) / (1000 * 60 * 60));

            // 1. Recency (Base score decaying over time)
            score += Math.max(0, 100 - (ageHours * 4));

            // 2. Signal Velocity (Weighted)
            const velocity = this.calculateSignalVelocity(post, ageHours);
            score += velocity * 15;

            // 3. User Interest Matching
            if (user.industry && post.category === Utils.getCategoryFromIndustry(user.industry)) {
                score += 60;
            }

            // 4. Topic Matching (Skills / Hashtags)
            if (user.skills && post.hashtags) {
                const matches = post.hashtags.filter(tag =>
                    user.skills.some(skill => tag.toLowerCase().includes(skill.toLowerCase()))
                );
                score += matches.length * 25;
            }

            // 5. Trust Factor
            const trust = this.getTrustScore(post.author || post.uid);
            score += trust * 0.5; // Up to +50 points

            // 6. Spam Penalty
            if (this.isSpam(post)) score -= 200;

            return { ...post, aiScore: score };
        }).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    },

    /**
     * Trust Score Formula: Multi-factor verification, Karma, and Account Age
     */
    getTrustScore(uid) {
        // Simulation based on UID properties or a lookup
        if (!uid) return 50;
        const hash = uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        let score = 40 + (hash % 40); // Base 40-80
        if (uid === 'admin' || uid.length < 10) score += 20; // Simulated verified badges
        return score;
    },

    /**
     * Is Spam Detection Logic
     */
    isSpam(post) {
        const text = post.text || "";
        if (text.length < 5) return true;
        // Check for common spam patterns
        const spamKeywords = ["buy now", "click here", "crypto moon", "get rich", "free giveaway"];
        const hasKeyword = spamKeywords.some(k => text.toLowerCase().includes(k));
        const linkDensity = (text.match(/https?:\/\//g) || []).length / (text.split(' ').length);

        return hasKeyword || linkDensity > 0.4 || text.toUpperCase() === text && text.length > 20;
    },

    /**
     * Signal Velocity Calculation (Formerly Engagement Velocity)
     * Focused on search volume, news velocity, and capital flow.
     */
    calculateSignalVelocity(post, ageHours) {
        // Platform posts have inherent velocity based on their impact
        const base = post.type === 'platform' ? 50 : 10;
        const impactBonus = post.impact === 'High' ? 40 : post.impact === 'Medium' ? 20 : 0;
        return (base + impactBonus) / (ageHours + 0.5);
    },

    /**
     * Trending Score (0-100) for UI display
     */
    getTrendingScore(post) {
        const now = Date.now();
        const postTime = new Date(post.createdAt || post.timestamp).getTime();
        const ageHours = Math.max(0.1, (now - postTime) / (1000 * 60 * 60));
        const velocity = this.calculateSignalVelocity(post, ageHours);

        // Balanced score for high velocity vs age
        let score = (velocity * 40) - (ageHours * 2);
        return Math.min(99, Math.max(12, Math.round(score)));
    },

    /**
     * AI News Summary Simulation
     */
    generateSummary(text) {
        if (!text) return "No summary available.";
        // Simulating a 3-line smart summary
        const sentences = text.split('. ');
        if (sentences.length <= 2) return text;
        return sentences.slice(0, 2).join('. ') + '. Advanced optimizations and strategic shifts noted in the latest technical review.';
    },

    /**
     * Get Trend Momentum
     */
    getTrendMomentum(tag) {
        // Deterministic but random-looking momentum based on tag name
        const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const momentum = (hash % 40) - 15; // Range -15% to 25%
        const velocity = (hash % 100);
        return {
            momentum: (momentum > 0 ? '+' : '') + momentum + '%',
            isUp: momentum > 0,
            velocity: velocity + ' units/hr',
            sparkline: this.generateSparkline(hash)
        };
    },

    generateSparkline(seed) {
        // Generate points for a small SVG sparkline
        let points = "";
        for (let i = 0; i < 10; i++) {
            const y = 15 + Math.sin((seed + i) * 0.5) * 10;
            points += `${i * 5},${y} `;
        }
        return points.trim();
    },

    /**
     * AI Personalized Insights
     */
    getUserInsights(user, feedPosts) {
        if (!user) return null;

        let topCat = 'ai-future';
        if (feedPosts && feedPosts.length > 0) {
            // Count categories in feed
            const cats = {};
            feedPosts.forEach(p => {
                if (p.category) cats[p.category] = (cats[p.category] || 0) + 1;
            });
            const keys = Object.keys(cats);
            if (keys.length > 0) {
                topCat = keys.reduce((a, b) => cats[a] > cats[b] ? a : b);
            }
        }

        const catLabel = Utils.getCategoryInfo ? Utils.getCategoryInfo(topCat).label : "Technology";

        return {
            primaryFocus: catLabel,
            networkDiscussion: "84% of your network reached consensus on " + (topCat === 'ai-future' ? 'AI alignment' : 'software architecture') + " trends today.",
            momentumShift: (user.industry || "Tech") + " related interests are rising in your circle."
        };
    },

    /**
     * AI Job & Course Match
     */
    calculateMatch(item, user) {
        if (!user) return 0;
        let match = 70; // Base match

        if (item.category && user.industry) {
            if (Utils.getCategoryFromIndustry(user.industry) === item.category) match += 15;
        }

        if (user.skills && item.requirements) {
            const matches = item.requirements.filter(req =>
                user.skills.some(skill => req.toLowerCase().includes(skill.toLowerCase()))
            );
            match += matches.length * 5;
        }

        if (user.skills && item.description) {
            const matches = user.skills.filter(skill =>
                item.description.toLowerCase().includes(skill.toLowerCase())
            );
            match += matches.length * 3;
        }

        return Math.min(98, match);
    },

    /**
     * AI Reply Generator
     */
    /**
     * AI Content Quality Analysis
     * processes real text to detect high-signal vs low-signal content
     */
    getPostQuality(post) {
        const text = post.text || "";
        let score = 50;

        // Signal indicators
        if (text.length > 200) score += 15; // Depth
        if (text.includes('```')) score += 20; // Technical proof
        if (post.hashtags && post.hashtags.length > 0) score += 10;

        // Author trust (Real data signal)
        const trust = this.getTrustScore(post.authorId);
        score += trust * 0.3;

        return Math.min(99, score);
    },

    isHighSignal(post) {
        return this.getPostQuality(post) > 80;
    },

    /**
     * AI Reply Generator
     */
    getReplySuggestions(post) {
        const text = (post.text || "").toLowerCase();
        if (text.includes('ai') || text.includes('llm') || text.includes('gpt')) {
            return [
                "Interesting point about feedback systems...",
                "Have you considered reinforcement learning models here?",
                "This could be a major shift for RAG architectures."
            ];
        } else if (text.includes('react') || text.includes('frontend') || text.includes('ui')) {
            return [
                "How does this impact the bundle size?",
                "The new compiler in React 19 is really impressive.",
                "Have you tried this with Server Components yet?"
            ];
        } else if (text.includes('rust') || text.includes('backend') || text.includes('scaling')) {
            return [
                "How does the memory safety guarantee affect velocity?",
                "Scaling this horizontally seems like the next step.",
                "Is the throughput bottlenecked by the DB?"
            ];
        }
        return [
            "Great insights! Looking forward to more.",
            "This is highly relevant to my current project.",
            "Can you elaborate more on the implementation details?"
        ];
    },
    /**
     * AI Trend Scoring Logic — Institutional Standard
     * Formula: (Recent Activity * 0.5) + (Growth Rate * 0.3) + (Engagement Depth * 0.2)
     */
    calculateTrendScore(stats) {
        const { activity, growth, depth } = stats;
        const score = (activity * 0.5) + (growth * 0.3) + (depth * 0.2);
        return Math.min(100, Math.round(score));
    },

    /**
     * AI Spike & Anomaly Detection
     */
    detectSpikes(currentVelocity, baselineVelocity) {
        if (!baselineVelocity || baselineVelocity === 0) return false;
        const growth = (currentVelocity - baselineVelocity) / baselineVelocity;
        return growth > 1.8; // 180% increase threshold for anomaly
    },

    /**
     * Spam & Duplicate suppression for Intelligence feeds
     */
    filterLowSignal(items) {
        return items.filter(item => !this.isSpam(item));
    },

    async getTrendIntelligence(topic) {
        // Simulate deep AI analysis for strategic business trends
        const insights = [
            `Global search velocity for ${topic} is outpacing infrastructure capacity.`,
            `High conviction signals detected in Seed-Stage startups focusing on ${topic}.`,
            `Enterprise adoption cycle for ${topic} is compressing from 18 to 6 months.`,
            `Regulatory headwinds in EU may decelerate ${topic} in Q3, but US demand remains strong.`,
            `Synergistic overlap detected between ${topic} and Distributed Ledger tech.`
        ];

        // Randomly pick nodes
        const nodes = [
            { title: `Emerging Market Gap: ${topic}`, desc: insights[Math.floor(Math.random() * insights.length)] },
            { title: `Strategic Pivot Signal`, desc: insights[Math.floor(Math.random() * insights.length)] },
            { title: `AI Predicted Trajectory`, desc: insights[(Math.floor(Math.random() * insights.length) + 1) % insights.length] }
        ];

        return { topic, nodes };
    },

    /**
     * AI Market Intelligence Layer
     */
    generateSectorInsights(sector, metrics) {
        const insights = [];
        const risks = [];
        const opportunities = [];
        const trend = metrics.change > 0 ? 'up' : 'down';

        if (trend === 'up') {
            insights.push(`Exponential growth detected in ${sector}. High clustering of talent nodes.`);
            opportunities.push("Strategic entry window: Valuations accelerating.");
        } else {
            insights.push(`${sector} sector consolidation phase active. Capital migrating.`);
            risks.push("Warning: Hiring velocity drop detected.");
        }

        return {
            insights: insights.slice(0, 3),
            risk: risks[0] || "No critical risks detected in current epoch.",
            opportunity: opportunities[0] || "Monitor for acceleration spikes.",
            status: trend === 'up' ? 'Growing' : 'Stable'
        };
    },

    /**
     * AI Market Insight Generator (Synthetic)
     */
    generateMarketInsight() {
        const templates = [
            {
                title: "FUNDING_ALERT: Capital Flux Detected",
                category: "startup-idea",
                impact: "High",
                type: "CAPITAL_ALERT",
                text: "Significant capital allocation identified in [SECTOR]. Institutional interest has spiked by [VALUE]% in the last [TIME]. Strategic entry recommended for early-stage builders."
            },
            {
                title: "SIGNAL_BREAK: Market Anomaly",
                category: "ai-future",
                impact: "Medium",
                type: "MARKET_ANOMALY",
                text: "Unusual data patterns observed in [SECTOR] search indices. Potential underserved niche detected in [NICHE]. Analysis suggests a 6-month window for first-mover advantage."
            },
            {
                title: "VELOCITY_SHIFT: Hiring Acceleration",
                category: "project",
                impact: "High",
                type: "NODE_VELOCITY",
                text: "Talent liquidity is flowing towards [SECTOR] specialized roles. Hiring velocity up [VALUE]% QoQ. Competitor drain detected in legacy [SECTOR] departments."
            }
        ];

        const sectors = ["Generative AI", "Cybersecurity", "FinTech", "ClimateTech", "Robotics", "Web3 Infrastructure"];
        const niches = ["Multi-modal Agents", "Zero-Knowledge Proofs", "Carbon Capture Logic", "Edge-Native LLMs", "Quantum-Safe Encryption"];

        const template = templates[Math.floor(Math.random() * templates.length)];
        const sector = sectors[Math.floor(Math.random() * sectors.length)];
        const niche = niches[Math.floor(Math.random() * niches.length)];
        const value = (15 + Math.random() * 45).toFixed(1);
        const time = ["12H", "24H", "72H"][Math.floor(Math.random() * 3)];

        let text = template.text
            .replace(/\[SECTOR\]/g, sector)
            .replace(/\[NICHE\]/g, niche)
            .replace(/\[VALUE\]/g, value)
            .replace(/\[TIME\]/g, time);

        return {
            title: template.title,
            text: `🔍 **INTEL_SIGNAL**: ${template.title}\n\n${text}\n\n---\n**SOURCE**: AI Infrastructure (NODE_OMEGA)`,
            category: template.category,
            impact: template.impact,
            type_label: template.type,
            confidence: 88 + Math.floor(Math.random() * 10),
            source_node: 'NODE_' + (Math.floor(Math.random() * 50) + 100)
        };
    }
};

export default AIEngine;

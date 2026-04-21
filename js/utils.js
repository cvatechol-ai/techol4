// ============================================
// TechOL - Utility Functions
// ============================================

const Utils = {
    // Format relative time
    timeAgo(date) {
        if (!date) return 'Just now';

        try {
            let t = null;
            if (date instanceof Date) {
                t = date;
            } else if (typeof date === 'string' || typeof date === 'number') {
                t = new Date(date);
            } else if (date.toDate && typeof date.toDate === 'function') {
                t = date.toDate();
            } else if (date.seconds !== undefined) {
                t = new Date(date.seconds * 1000);
            } else if (date._seconds !== undefined) {
                t = new Date(date._seconds * 1000);
            }

            if (!t || isNaN(t.getTime())) return 'Just now';

            const diffMs = Date.now() - t.getTime();
            const absDiffMs = Math.abs(diffMs);
            const seconds = Math.floor(absDiffMs / 1000);

            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
            if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
            if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
            if (seconds < 2592000) return Math.floor(seconds / 604800) + 'w ago';
            if (seconds < 31536000) return Math.floor(seconds / 2592000) + 'mo ago';
            return Math.floor(seconds / 31536000) + 'y ago';

        } catch (e) {
            return 'Just now';
        }
    },

    // Format numbers
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        const n = Number(num);
        if (isNaN(n)) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    },

    // Format date
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Format time for chat
    formatChatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    // Get initials from name
    getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Sanitize HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Parse hashtags in text
    parseHashtags(text) {
        return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    },

    // Parse code blocks in text
    parseCodeBlocks(text) {
        return text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre class="code-block"><code>${Utils.escapeHtml(code.trim())}</code></pre>`;
        });
    },

    // Format post text with hashtags, links, and code
    formatPostText(text) {
        let formatted = Utils.escapeHtml(text);
        // Code blocks
        formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
        });
        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        // Hashtags
        formatted = formatted.replace(/#(\w+)/g, '<span class="hashtag" onclick="App.searchHashtag(\'#$1\')">#$1</span>');
        // URLs
        formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    },

    // Validate email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate username (alphanumeric, underscores, 3-20 chars)
    isValidUsername(username) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    },

    // Debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                clearTimeout(timeout);
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Get category info
    getCategoryInfo(category) {
        const categories = {
            'ai-future': { label: 'AI & Future', color: 'primary', icon: '🤖' },
            'coding-doubt': { label: 'Coding Doubt', color: 'accent', icon: '❓' },
            'tech-problem': { label: 'Tech Problem', color: 'secondary', icon: '🔧' },
            'startup-idea': { label: 'Startup Idea', color: 'primary', icon: '💡' },
            'announcement': { label: 'Announcement', color: 'accent', icon: '📢' },
            'discussion': { label: 'Discussion', color: 'secondary', icon: '💬' },
            'tutorial': { label: 'Tutorial', color: 'primary', icon: '📚' },
            'project': { label: 'Project', color: 'accent', icon: '🚀' },
            'general': { label: 'General', color: 'secondary', icon: '📝' }
        };
        return categories[category] || categories['general'];
    },

    // Map industry to category
    getCategoryFromIndustry(industry) {
        if (!industry) return 'general';
        const map = {
            'Software Development': 'coding-doubt',
            'Artificial Intelligence': 'ai-future',
            'Data Science': 'ai-future',
            'Fintech': 'startup-idea',
            'Cybersecurity': 'tech-problem',
            'Web3': 'project',
            'Entrepreneurship': 'startup-idea',
            'Engineering': 'tech-problem'
        };
        return map[industry] || 'general';
    },

    generateHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    },

    // Set page with smooth transition
    setActiveView(viewId) {
        document.querySelectorAll('.view-page').forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none';
        });
        const view = document.getElementById(viewId);
        if (view) {
            view.style.display = 'block';
            requestAnimationFrame(() => view.classList.add('active'));
        }
    }
};

window.Utils = Utils;
export default Utils;

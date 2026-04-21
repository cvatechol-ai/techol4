const Utils = {
    timeAgo(date) {
        if (!date) return 'Just now';

        let t;
        // Handle various date types safely
        if (typeof date === 'string' || typeof date === 'number') {
            t = new Date(date);
        } else if (date instanceof Date) {
            t = date;
        } else if (date && typeof date.toDate === 'function') { // Firestore Timestamp
            t = date.toDate();
        } else if (date && date.seconds) { // Raw Firestore Timestamp fallback
            t = new Date(date.seconds * 1000);
        } else {
            return 'Just now';
        }

        if (isNaN(t.getTime())) return 'Just now';

        // If a post is in the future (e.g., client clock behind server), treat as 'Just now'
        const seconds = Math.floor((Date.now() - t) / 1000);
        console.log({ date, t: t.toISOString(), tMs: t.getTime(), nowMs: Date.now(), diff: Date.now() - t, seconds });
        if (seconds < 60) return 'Just now'; // less than 60s

        const intervals = [
            { label: 'y', seconds: 31536000 },
            { label: 'mo', seconds: 2592000 },
            { label: 'w', seconds: 604800 },
            { label: 'd', seconds: 86400 },
            { label: 'h', seconds: 3600 },
            { label: 'm', seconds: 60 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count > 0) return `${count}${interval.label} ago`;
        }
        return 'Just now';
    }
};

console.log(Utils.timeAgo('2026-02-28T18:47:00.000Z'));
console.log(Utils.timeAgo('2026-02-27T18:47:00.000Z'));
console.log(Utils.timeAgo(new Date(Date.now() - 3600000)));

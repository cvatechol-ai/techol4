// ============================================
// TechOL — Icon System (Material Symbols Rounded)
// Professional SVG-quality icons
// ============================================

const Icons = {
    // Helper to create a Material Symbol icon
    ms(name, opts = {}) {
        const size = opts.size || 20;
        const fill = opts.fill ? 1 : 0;
        const cls = opts.class || '';
        return `<span class="material-symbols-rounded ${cls}" style="font-size:${size}px;${opts.fill ? 'font-variation-settings:\'FILL\' 1;' : ''}">${name}</span>`;
    },

    // Navigation
    home: (f) => Icons.ms('home', { fill: f }),
    explore: (f) => Icons.ms('explore', { fill: f }),
    search: (f) => Icons.ms('search', { fill: f }),
    notifications: (f) => Icons.ms('notifications', { fill: f }),
    chat: (f) => Icons.ms('chat_bubble', { fill: f }),
    events: (f) => Icons.ms('event', { fill: f }),
    bookmark: (f) => Icons.ms('bookmark', { fill: f }),
    person: (f) => Icons.ms('person', { fill: f }),
    settings: (f) => Icons.ms('settings', { fill: f }),

    // Actions
    like: (f) => Icons.ms('favorite', { fill: f }),
    comment: (f) => Icons.ms('mode_comment', { fill: f }),
    share: (f) => Icons.ms('share'),
    more: () => Icons.ms('more_horiz'),
    send: () => Icons.ms('send', { fill: true }),
    add: () => Icons.ms('add'),
    close: () => Icons.ms('close'),
    edit: () => Icons.ms('edit'),
    delete: () => Icons.ms('delete'),
    camera: () => Icons.ms('photo_camera', { fill: true }),
    image: () => Icons.ms('image', { fill: true }),
    code: () => Icons.ms('code'),
    link: () => Icons.ms('link'),
    logout: () => Icons.ms('logout'),
    menu: () => Icons.ms('menu'),

    // Categories
    robot: () => Icons.ms('smart_toy', { fill: true }),
    lightbulb: () => Icons.ms('lightbulb', { fill: true }),
    bug: () => Icons.ms('bug_report', { fill: true }),
    help: () => Icons.ms('help', { fill: true }),
    forum: () => Icons.ms('forum', { fill: true }),
    school: () => Icons.ms('school', { fill: true }),
    rocket: () => Icons.ms('rocket_launch', { fill: true }),
    build: () => Icons.ms('build', { fill: true }),

    // Status & misc
    verified: () => Icons.ms('verified', { fill: true, size: 18, class: 'icon-verified' }),
    pin: () => Icons.ms('push_pin', { fill: true }),
    trending: () => Icons.ms('trending_up'),
    people: () => Icons.ms('group', { fill: true }),
    tag: () => Icons.ms('tag'),
    calendar: () => Icons.ms('calendar_today'),
    location: () => Icons.ms('location_on', { fill: true }),
    work: () => Icons.ms('work', { fill: true }),
    groups: () => Icons.ms('groups', { fill: true }),
    podcasts: () => Icons.ms('podcasts', { fill: true }),
    leaderboard: () => Icons.ms('leaderboard', { fill: true }),
    analytics: () => Icons.ms('analytics', { fill: true }),
    handshake: () => Icons.ms('handshake', { fill: true }),
    data_object: () => Icons.ms('data_object', { fill: true }),
    diversity_3: () => Icons.ms('diversity_3', { fill: true }),
    storefront: () => Icons.ms('storefront', { fill: true }),
    emoji_events: () => Icons.ms('emoji_events', { fill: true }),
    globe: () => Icons.ms('language'),
    lock: () => Icons.ms('lock'),
    shield: () => Icons.ms('shield'),
    palette: () => Icons.ms('palette', { fill: true }),
    info: () => Icons.ms('info', { fill: true }),
    bolt: () => Icons.ms('bolt', { fill: true, size: 24 }),

    // Brand
    logo: () => `<div class="brand-logo" style="background:var(--gradient-accent);box-shadow:0 0 15px var(--accent-glow)">${Icons.ms('memory', { fill: true, size: 22 })}</div>`,
};

window.Icons = Icons;
export default Icons;

// ============================================
// TechOL - Demo Data Store (Fallback when Firebase not configured)
// ============================================

const DemoData = {
    currentUser: null,

    users: {
        'user_1': {
            uid: 'user_1',
            displayName: 'Arjun Mehta',
            username: 'arjundev',
            email: 'arjun@techol.com',
            photoURL: null,
            bio: 'Full-stack developer | AI enthusiast | Building the future with code 🚀',
            location: 'Bangalore, India',
            website: 'https://arjundev.io',
            joinedDate: '2025-06-15',
            followers: 2340,
            following: 856,
            isCompany: false,
            verified: true
        },
        'user_2': {
            uid: 'user_2',
            displayName: 'Priya Sharma',
            username: 'priyacodes',
            email: 'priya@techol.com',
            photoURL: null,
            bio: 'Frontend wizard 🎨 | React & Vue.js | Open source contributor',
            location: 'Mumbai, India',
            website: '',
            joinedDate: '2025-08-22',
            followers: 1893,
            following: 432,
            isCompany: false,
            verified: true
        },
        'user_3': {
            uid: 'user_3',
            displayName: 'TechVerse Labs',
            username: 'techverse',
            email: 'hello@techverse.io',
            photoURL: null,
            bio: 'Building next-gen AI tools for developers. Join 50K+ devs worldwide.',
            location: 'San Francisco, CA',
            website: 'https://techverse.io',
            joinedDate: '2025-03-10',
            followers: 15200,
            following: 120,
            isCompany: true,
            verified: true
        },
        'user_4': {
            uid: 'user_4',
            displayName: 'Rahul Kumar',
            username: 'rahulk',
            email: 'rahul@techol.com',
            photoURL: null,
            bio: 'Backend engineer at scale | Golang & Rust | System design nerd',
            location: 'Delhi, India',
            website: '',
            joinedDate: '2025-09-01',
            followers: 1267,
            following: 654,
            isCompany: false,
            verified: false
        },
        'user_5': {
            uid: 'user_5',
            displayName: 'NeuralFlow AI',
            username: 'neuralflow',
            email: 'contact@neuralflow.ai',
            photoURL: null,
            bio: 'Open-source AI research lab. Democratizing AI for everyone. 🧠',
            location: 'London, UK',
            website: 'https://neuralflow.ai',
            joinedDate: '2025-04-18',
            followers: 28900,
            following: 85,
            isCompany: true,
            verified: true
        },
        'user_6': {
            uid: 'user_6',
            displayName: 'Sneha Patel',
            username: 'snehap',
            email: 'sneha@techol.com',
            photoURL: null,
            bio: 'ML Engineer | Computer Vision | Building @AutoPilotAI | IIT Bombay',
            location: 'Pune, India',
            website: 'https://sneha.dev',
            joinedDate: '2025-07-05',
            followers: 3450,
            following: 298,
            isCompany: false,
            verified: true
        }
    },

    posts: [
        {
            id: 'post_1',
            authorId: 'user_1',
            category: 'ai-future',
            text: "Just tested GPT-5's new reasoning capabilities and I'm blown away. The way it handles multi-step mathematical proofs is incredible.\n\nHere's what surprised me most: it can now identify logical fallacies in its own reasoning chain and self-correct. We're getting closer to AGI than most people realize.\n\nWhat are your thoughts on AI self-correction?",
            hashtags: ['#AI', '#GPT5', '#MachineLearning', '#AGI'],
            likes: 234,
            comments: 45,
            shares: 28,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            likedBy: []
        },
        {
            id: 'post_2',
            authorId: 'user_2',
            category: 'coding-doubt',
            text: "🤔 Can someone explain why React's useEffect cleanup runs before the next effect execution but React docs say it runs on unmount?\n\nI'm seeing inconsistent behavior when dealing with WebSocket connections in my app. The cleanup seems to fire when dependencies change too.\n\n```javascript\nuseEffect(() => {\n  const ws = new WebSocket(url);\n  return () => ws.close(); // When does this run?\n}, [url]);\n```\n\nAny React experts here? 🙏",
            hashtags: ['#React', '#JavaScript', '#WebDev', '#CodingHelp'],
            likes: 189,
            comments: 67,
            shares: 12,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            likedBy: []
        },
        {
            id: 'post_3',
            authorId: 'user_3',
            category: 'announcement',
            text: "🎉 Big announcement! TechVerse Labs is launching DevAssist Pro - an AI-powered coding assistant that actually understands your entire codebase.\n\nKey features:\n✅ Full repo context awareness\n✅ Automated code review\n✅ Smart refactoring suggestions\n✅ Multi-language support\n\nEarly access starts next week. Drop a 🚀 if interested!",
            hashtags: ['#DevTools', '#AI', '#Coding', '#Launch'],
            likes: 892,
            comments: 234,
            shares: 156,
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            likedBy: []
        },
        {
            id: 'post_4',
            authorId: 'user_4',
            category: 'startup-idea',
            text: "💡 Startup Idea: AI-powered code documentation generator\n\nProblem: Most codebases have poor or outdated documentation\n\nSolution: An AI tool that:\n1. Reads your entire codebase\n2. Generates comprehensive docs\n3. Keeps them synced with code changes\n4. Creates interactive API playgrounds\n\nEstimated market: $2B+ (developer tools market)\n\nLooking for a co-founder! DM me if interested.\n\nWhat do you all think? Would you use this?",
            hashtags: ['#StartupIdea', '#DevTools', '#AI', '#Entrepreneurship'],
            likes: 567,
            comments: 123,
            shares: 89,
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
            likedBy: []
        },
        {
            id: 'post_5',
            authorId: 'user_6',
            category: 'tech-problem',
            text: "Running into a weird CUDA memory leak when training my transformer model. GPU memory keeps climbing even after clearing cache.\n\nSetup:\n- PyTorch 2.3\n- CUDA 12.4\n- A100 80GB\n- Batch size: 32\n\nThings I've tried:\n❌ torch.cuda.empty_cache()\n❌ del model; gc.collect()\n❌ gradient checkpointing\n\nThe memory grows by ~500MB every 100 steps. Anyone seen this before?\n\n#HelpWanted",
            hashtags: ['#PyTorch', '#CUDA', '#DeepLearning', '#MLOps'],
            likes: 145,
            comments: 89,
            shares: 34,
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            likedBy: []
        },
        {
            id: 'post_6',
            authorId: 'user_5',
            category: 'ai-future',
            text: "Our latest research paper just dropped: 'Efficient Attention Mechanisms for Long-Context Language Models'\n\n📊 Key findings:\n- 40% reduction in compute for 128K context windows\n- New sparse attention pattern outperforms FlashAttention v2\n- Works with existing transformer architectures\n\nPaper: arxiv.org/abs/xxxx.xxxxx\nCode: Open-sourced on GitHub\n\nThis could change how we scale LLMs. Thread below 🧵",
            hashtags: ['#AIResearch', '#LLM', '#NLP', '#OpenSource'],
            likes: 2341,
            comments: 456,
            shares: 789,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            likedBy: []
        }
    ],

    events: [
        {
            id: 'event_1',
            companyId: 'user_3',
            title: 'DevAssist Pro Launch Event',
            description: 'Join us for the official launch of DevAssist Pro. Live demos, Q&A with the team, and exclusive early access for attendees.',
            date: '2026-03-15',
            time: '10:00 AM PST',
            location: 'Virtual (Zoom)',
            type: 'Launch Event',
            attendees: 1240,
            maxAttendees: 5000,
            tags: ['#DevTools', '#AI', '#Launch']
        },
        {
            id: 'event_2',
            companyId: 'user_5',
            title: 'AI Research Summit 2026',
            description: 'A 3-day virtual summit featuring top AI researchers. Topics include transformers, RLHF, multimodal AI, and the future of AGI.',
            date: '2026-04-20',
            time: '9:00 AM GMT',
            location: 'London + Virtual',
            type: 'Conference',
            attendees: 3600,
            maxAttendees: 10000,
            tags: ['#AI', '#Research', '#Conference']
        },
        {
            id: 'event_3',
            companyId: 'user_3',
            title: 'Hackathon: Build with AI',
            description: '48-hour hackathon where teams build innovative AI-powered apps. $50K in prizes. Open to all skill levels.',
            date: '2026-05-10',
            time: '12:00 PM PST',
            location: 'Virtual',
            type: 'Hackathon',
            attendees: 890,
            maxAttendees: 2000,
            tags: ['#Hackathon', '#AI', '#BuildInPublic']
        }
    ],

    conversations: [
        {
            id: 'conv_1',
            participants: ['user_1', 'user_2'],
            messages: [
                { id: 'm1', senderId: 'user_2', text: 'Hey Arjun! Saw your post about GPT-5. Super interesting!', timestamp: new Date(Date.now() - 3600000) },
                { id: 'm2', senderId: 'user_1', text: 'Thanks Priya! Yeah, the self-correction capability is a game changer', timestamp: new Date(Date.now() - 3500000) },
                { id: 'm3', senderId: 'user_2', text: 'Are you working on any projects using it?', timestamp: new Date(Date.now() - 3400000) },
                { id: 'm4', senderId: 'user_1', text: 'Actually yes! Building an AI-powered code reviewer. Want to collaborate?', timestamp: new Date(Date.now() - 3300000) },
                { id: 'm5', senderId: 'user_2', text: "That sounds amazing! I'd love to help with the frontend 🎨", timestamp: new Date(Date.now() - 3200000) },
            ],
            lastMessage: "That sounds amazing! I'd love to help with the frontend 🎨",
            lastTimestamp: new Date(Date.now() - 3200000),
            unread: true
        },
        {
            id: 'conv_2',
            participants: ['user_1', 'user_4'],
            messages: [
                { id: 'm1', senderId: 'user_4', text: 'Hi! I saw your profile. Fellow developer here. Interested in your AI projects.', timestamp: new Date(Date.now() - 86400000) },
                { id: 'm2', senderId: 'user_1', text: 'Hey Rahul! Always happy to connect with fellow devs. What are you working on?', timestamp: new Date(Date.now() - 85000000) },
                { id: 'm3', senderId: 'user_4', text: 'Building a startup around AI documentation. Looking for feedback!', timestamp: new Date(Date.now() - 84000000) },
            ],
            lastMessage: 'Building a startup around AI documentation. Looking for feedback!',
            lastTimestamp: new Date(Date.now() - 84000000),
            unread: false
        },
        {
            id: 'conv_3',
            participants: ['user_1', 'user_6'],
            messages: [
                { id: 'm1', senderId: 'user_6', text: 'Hi Arjun! Have you faced CUDA memory issues with PyTorch?', timestamp: new Date(Date.now() - 43200000) },
                { id: 'm2', senderId: 'user_1', text: 'Yes! Actually wrote a blog about it. The trick is to use gradient accumulation properly.', timestamp: new Date(Date.now() - 42000000) },
            ],
            lastMessage: 'Yes! Actually wrote a blog about it. The trick is to use gradient accumulation properly.',
            lastTimestamp: new Date(Date.now() - 42000000),
            unread: false
        }
    ],

    trendingHashtags: [
        { tag: '#GPT5', count: '12.5K posts' },
        { tag: '#CodingChallenge', count: '8.3K posts' },
        { tag: '#AIResearch', count: '6.7K posts' },
        { tag: '#StartupIdea', count: '5.2K posts' },
        { tag: '#WebDev', count: '4.9K posts' },
        { tag: '#OpenSource', count: '3.8K posts' },
        { tag: '#MachineLearning', count: '3.1K posts' },
        { tag: '#DevOps', count: '2.7K posts' }
    ]
};

// Demo authentication store
const DemoAuth = {
    registeredUsers: {},

    register(email, password, displayName, username) {
        if (this.registeredUsers[email]) {
            return { success: false, error: 'Email already registered' };
        }
        // Check username uniqueness
        const usernameTaken = Object.values(this.registeredUsers).some(u => u.username === username) ||
            Object.values(DemoData.users).some(u => u.username === username);
        if (usernameTaken) {
            return { success: false, error: 'Username already taken' };
        }

        const uid = 'user_' + Date.now();
        const user = {
            uid,
            displayName,
            username,
            email,
            photoURL: null,
            bio: '',
            location: '',
            website: '',
            joinedDate: new Date().toISOString().split('T')[0],
            followers: 0,
            following: 0,
            isCompany: false,
            verified: false
        };
        this.registeredUsers[email] = { ...user, password };
        DemoData.users[uid] = user;
        DemoData.currentUser = user;
        localStorage.setItem('techol_user', JSON.stringify(user));
        return { success: true, user };
    },

    login(email, password) {
        const user = this.registeredUsers[email];
        if (!user) {
            // Check if it's a demo user (allow any password for demo)
            const demoUser = Object.values(DemoData.users).find(u => u.email === email);
            if (demoUser) {
                DemoData.currentUser = demoUser;
                localStorage.setItem('techol_user', JSON.stringify(demoUser));
                return { success: true, user: demoUser };
            }
            return { success: false, error: 'No account found with this email' };
        }
        if (user.password !== password) {
            return { success: false, error: 'Incorrect password' };
        }
        const { password: _, ...userData } = user;
        DemoData.currentUser = userData;
        localStorage.setItem('techol_user', JSON.stringify(userData));
        return { success: true, user: userData };
    },

    loginWithGoogle() {
        // Simulate Google login with demo user
        const user = DemoData.users['user_1'];
        DemoData.currentUser = user;
        localStorage.setItem('techol_user', JSON.stringify(user));
        return { success: true, user };
    },

    logout() {
        DemoData.currentUser = null;
        localStorage.removeItem('techol_user');
    },

    getCurrentUser() {
        if (DemoData.currentUser) return DemoData.currentUser;
        const stored = localStorage.getItem('techol_user');
        if (stored) {
            DemoData.currentUser = JSON.parse(stored);
            return DemoData.currentUser;
        }
        return null;
    }
};

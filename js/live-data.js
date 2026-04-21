// ============================================
// TechOL — Live Data Engine (Courses, Hackathons, News, Jobs)
// Real data with external links + RSS-based news
// ============================================
import AuthService from "./auth.js";

const LiveData = {
    _cache: {},
    _cacheExpiry: {},

    // ---- CACHE HELPERS ----
    _getCached(key, ttlMs = 300000) {
        if (this._cache[key] && Date.now() < (this._cacheExpiry[key] || 0)) return this._cache[key];
        return null;
    },
    _setCache(key, data, ttlMs = 300000) {
        this._cache[key] = data;
        this._cacheExpiry[key] = Date.now() + ttlMs;
    },

    // ═══════════════════════════════════════════════
    // COURSES — 50+ Real Courses from Top Platforms
    // ═══════════════════════════════════════════════
    courses: [
        // ── AI / ML ──
        { id: 'c1', title: 'CS50\'s Introduction to Artificial Intelligence with Python', provider: 'Harvard / edX', platform: 'edX', duration: '7 weeks', level: 'Intermediate', category: 'ai-ml', description: 'Explore the concepts and algorithms at the foundation of modern artificial intelligence, diving into the ideas that give rise to technologies like game-playing engines, handwriting recognition, and machine translation.', link: 'https://www.edx.org/course/cs50s-introduction-to-artificial-intelligence-with-python', image: 'https://prod-discovery.edx-cdn.org/media/course/image/3a144db1-663e-4e40-8f67-e6e41c65f82e-4b6569fa5f40.small.png', free: true },
        { id: 'c2', title: 'Machine Learning Specialization', provider: 'Stanford / Coursera', platform: 'Coursera', duration: '3 months', level: 'Beginner', category: 'ai-ml', description: 'Build ML models with NumPy & scikit-learn, build & train supervised models for prediction & binary classification tasks including linear and logistic regression.', link: 'https://www.coursera.org/specializations/machine-learning-introduction', image: 'https://d3njjcbhbojbd4.cloudfront.net/api/file/kSbWVDTRi25T7pWpjGvg', free: false },
        { id: 'c3', title: 'Deep Learning Specialization', provider: 'DeepLearning.AI / Coursera', platform: 'Coursera', duration: '5 months', level: 'Intermediate', category: 'ai-ml', description: 'Become a deep learning expert. Master the fundamentals of deep learning and break into AI. Build neural networks, CNNs, RNNs, and more with Andrew Ng.', link: 'https://www.coursera.org/specializations/deep-learning', image: 'https://d3njjcbhbojbd4.cloudfront.net/api/file/kSbWVDTRi25T7pWpjGvg', free: false },
        { id: 'c4', title: 'Introduction to Machine Learning', provider: 'MIT OpenCourseWare', platform: 'MIT OCW', duration: 'Self-paced', level: 'Intermediate', category: 'ai-ml', description: 'This course introduces principles, algorithms, and applications of machine learning from the perspective of modeling and prediction.', link: 'https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-fall-2020/', image: 'https://ocw.mit.edu/static_shared/images/ocw_logo_orange.png', free: true },
        { id: 'c5', title: 'AI for Everyone', provider: 'DeepLearning.AI / Coursera', platform: 'Coursera', duration: '4 weeks', level: 'Beginner', category: 'ai-ml', description: 'AI is not only for engineers. Andrew Ng designed this course to help you understand AI technologies and spot opportunities to apply AI in your own organization.', link: 'https://www.coursera.org/learn/ai-for-everyone', image: 'https://d3njjcbhbojbd4.cloudfront.net/api/file/kSbWVDTRi25T7pWpjGvg', free: true },
        { id: 'c6', title: 'TensorFlow Developer Professional Certificate', provider: 'DeepLearning.AI / Coursera', platform: 'Coursera', duration: '4 months', level: 'Intermediate', category: 'ai-ml', description: 'Build and train neural networks using TensorFlow, handle real-world image data, explore strategies to prevent overfitting, and build NLP models.', link: 'https://www.coursera.org/professional-certificates/tensorflow-in-practice', free: false },
        { id: 'c7', title: 'Natural Language Processing Specialization', provider: 'DeepLearning.AI / Coursera', platform: 'Coursera', duration: '4 months', level: 'Advanced', category: 'ai-ml', description: 'Design NLP applications that perform question-answering and sentiment analysis, create chatbots, and more using transformers and attention mechanisms.', link: 'https://www.coursera.org/specializations/natural-language-processing', free: false },
        { id: 'c8', title: 'Stanford CS229: Machine Learning', provider: 'Stanford Online', platform: 'Stanford', duration: 'Self-paced', level: 'Advanced', category: 'ai-ml', description: 'Andrew Ng\'s legendary Stanford course covering supervised learning, unsupervised learning, reinforcement learning, and best practices in ML.', link: 'https://cs229.stanford.edu/', free: true },

        // ── Web Development ──
        { id: 'c9', title: 'CS50\'s Web Programming with Python and JavaScript', provider: 'Harvard / edX', platform: 'edX', duration: '12 weeks', level: 'Intermediate', category: 'web-dev', description: 'Dive into the design and implementation of web apps with Python, JavaScript, and SQL using frameworks like Django, React, and Bootstrap.', link: 'https://www.edx.org/course/cs50s-web-programming-with-python-and-javascript', free: true },
        { id: 'c10', title: 'The Web Developer Bootcamp 2024', provider: 'Udemy', platform: 'Udemy', duration: '74 hours', level: 'Beginner', category: 'web-dev', description: 'The only course you need to learn web development — HTML, CSS, JS, Node, React, MongoDB and more with Colt Steele.', link: 'https://www.udemy.com/course/the-web-developer-bootcamp/', free: false },
        { id: 'c11', title: 'Full-Stack Web Development with React Specialization', provider: 'HKUST / Coursera', platform: 'Coursera', duration: '4 months', level: 'Intermediate', category: 'web-dev', description: 'Learn front-end web, hybrid mobile development with React, server-side development with NodeJS, Express, and MongoDB.', link: 'https://www.coursera.org/specializations/full-stack-react', free: false },
        { id: 'c12', title: 'Meta Front-End Developer Professional Certificate', provider: 'Meta / Coursera', platform: 'Coursera', duration: '7 months', level: 'Beginner', category: 'web-dev', description: 'Launch your career as a front-end developer. Build job-ready skills for an in-demand career and earn a credential from Meta.', link: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', free: false },
        { id: 'c13', title: 'Responsive Web Design', provider: 'freeCodeCamp', platform: 'freeCodeCamp', duration: '300 hours', level: 'Beginner', category: 'web-dev', description: 'Learn HTML and CSS by building 15 practice projects and 5 certification projects. Start from scratch and build responsive websites.', link: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', free: true },
        { id: 'c14', title: 'The Odin Project - Full Stack JavaScript', provider: 'The Odin Project', platform: 'Odin Project', duration: 'Self-paced', level: 'Beginner', category: 'web-dev', description: 'A free, open-source full stack curriculum. Learn HTML, CSS, JavaScript, Node.js, React, and databases with real projects.', link: 'https://www.theodinproject.com/paths/full-stack-javascript', free: true },

        // ── Cloud Computing ──
        { id: 'c15', title: 'AWS Cloud Practitioner Essentials', provider: 'AWS Training', platform: 'AWS', duration: '6 hours', level: 'Beginner', category: 'cloud', description: 'Learn the fundamentals of AWS Cloud, including AWS services, security, architecture, pricing, and support. Prepare for the AWS Certified Cloud Practitioner exam.', link: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/', free: true },
        { id: 'c16', title: 'Google Cloud Fundamentals: Core Infrastructure', provider: 'Google Cloud / Coursera', platform: 'Google Cloud', duration: '5 weeks', level: 'Beginner', category: 'cloud', description: 'Learn about Google Cloud computing, storage, and networking. Understand the basics of BigQuery, Cloud SQL, and Kubernetes Engine.', link: 'https://www.coursera.org/learn/gcp-fundamentals', free: false },
        { id: 'c17', title: 'Microsoft Azure Fundamentals (AZ-900)', provider: 'Microsoft Learn', platform: 'Microsoft', duration: '10 hours', level: 'Beginner', category: 'cloud', description: 'Learn cloud concepts, Azure services, security, privacy, compliance, and Azure pricing. Prepare for the AZ-900 certification exam.', link: 'https://learn.microsoft.com/en-us/training/paths/az-900-describe-cloud-concepts/', free: true },
        { id: 'c18', title: 'Architecting with Google Compute Engine', provider: 'Google Cloud / Coursera', platform: 'Google Cloud', duration: '1 month', level: 'Intermediate', category: 'cloud', description: 'Learn to deploy practical solutions including securely interconnecting networks, load balancing, autoscaling, infrastructure automation, and more.', link: 'https://www.coursera.org/specializations/gcp-architecture', free: false },
        { id: 'c19', title: 'AWS Solutions Architect Associate', provider: 'AWS / Udacity', platform: 'Udacity', duration: '4 months', level: 'Intermediate', category: 'cloud', description: 'Design and deploy scalable systems on AWS. Master EC2, S3, VPC, Lambda, CloudFormation, and more.', link: 'https://www.udacity.com/course/aws-cloud-architect-nanodegree--nd063', free: false },
        { id: 'c20', title: 'Cloud Computing Specialization', provider: 'University of Illinois / Coursera', platform: 'Coursera', duration: '6 months', level: 'Intermediate', category: 'cloud', description: 'Explore cloud computing concepts including distributed systems, networking, and cloud applications with hands-on projects.', link: 'https://www.coursera.org/specializations/cloud-computing', free: false },

        // ── Cybersecurity ──
        { id: 'c21', title: 'Google Cybersecurity Professional Certificate', provider: 'Google / Coursera', platform: 'Coursera', duration: '6 months', level: 'Beginner', category: 'cybersecurity', description: 'Get on the fast track to a career in cybersecurity. Learn from Google experts and prepare for the CompTIA Security+ exam.', link: 'https://www.coursera.org/professional-certificates/google-cybersecurity', free: false },
        { id: 'c22', title: 'Introduction to Cyber Security', provider: 'NYU / Coursera', platform: 'Coursera', duration: '4 weeks', level: 'Beginner', category: 'cybersecurity', description: 'Learn the basics of cyber security including cyber threats, vulnerabilities, and risk management from NYU Tandon School of Engineering.', link: 'https://www.coursera.org/learn/intro-cyber-security', free: true },
        { id: 'c23', title: 'Cybersecurity for Everyone', provider: 'University of Maryland / Coursera', platform: 'Coursera', duration: '6 weeks', level: 'Beginner', category: 'cybersecurity', description: 'Learn the fundamentals of cybersecurity — not just for IT professionals, but for everyone who uses technology.', link: 'https://www.coursera.org/learn/cybersecurity-for-everyone', free: true },
        { id: 'c24', title: 'Penetration Testing and Ethical Hacking', provider: 'Cybrary', platform: 'Cybrary', duration: 'Self-paced', level: 'Advanced', category: 'cybersecurity', description: 'Learn hands-on penetration testing, vulnerability assessment, and ethical hacking techniques used by security professionals.', link: 'https://www.cybrary.it/course/penetration-testing-and-ethical-hacking', free: false },
        { id: 'c25', title: 'IBM Cybersecurity Analyst Professional Certificate', provider: 'IBM / Coursera', platform: 'Coursera', duration: '8 months', level: 'Beginner', category: 'cybersecurity', description: 'Develop job-ready cybersecurity skills. Learn network security, incident response, digital forensics, and cybersecurity tools.', link: 'https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst', free: false },
        { id: 'c26', title: 'MIT 6.858: Computer Systems Security', provider: 'MIT OpenCourseWare', platform: 'MIT OCW', duration: 'Self-paced', level: 'Advanced', category: 'cybersecurity', description: 'Design and implementation of secure computer systems. Topics include operating system security, network security, and cryptographic protocols.', link: 'https://ocw.mit.edu/courses/6-858-computer-systems-security-fall-2014/', free: true },

        // ── Data Science ──
        { id: 'c27', title: 'IBM Data Science Professional Certificate', provider: 'IBM / Coursera', platform: 'Coursera', duration: '5 months', level: 'Beginner', category: 'data-science', description: 'Kickstart your career in data science. Learn Python, SQL, data visualization, machine learning, and more with hands-on labs.', link: 'https://www.coursera.org/professional-certificates/ibm-data-science', free: false },
        { id: 'c28', title: 'Data Science MicroMasters', provider: 'UC San Diego / edX', platform: 'edX', duration: '10 months', level: 'Intermediate', category: 'data-science', description: 'Learn the foundations of data science: computational thinking, inferential thinking, and real-world relevance using Python, statistics, and ML.', link: 'https://www.edx.org/micromasters/uc-san-diegox-data-science', free: false },
        { id: 'c29', title: 'Google Data Analytics Professional Certificate', provider: 'Google / Coursera', platform: 'Coursera', duration: '6 months', level: 'Beginner', category: 'data-science', description: 'Prepare for a career in the high-growth field of data analytics. Learn key analytical skills — data cleaning, analysis, visualization.', link: 'https://www.coursera.org/professional-certificates/google-data-analytics', free: false },
        { id: 'c30', title: 'Statistics and Data Science MicroMasters', provider: 'MIT / edX', platform: 'edX', duration: '1 year', level: 'Advanced', category: 'data-science', description: 'Master the foundations of data science, statistics, and machine learning. Covers probability, inference, regression, and deep learning.', link: 'https://www.edx.org/micromasters/mitx-statistics-and-data-science', free: false },
        { id: 'c31', title: 'Data Analysis with Python', provider: 'freeCodeCamp', platform: 'freeCodeCamp', duration: '300 hours', level: 'Beginner', category: 'data-science', description: 'Learn data analysis with Python — NumPy, Pandas, Matplotlib, Seaborn. Complete 5 certification projects.', link: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', free: true },
        { id: 'c32', title: 'Applied Data Science with Python', provider: 'University of Michigan / Coursera', platform: 'Coursera', duration: '5 months', level: 'Intermediate', category: 'data-science', description: 'Gain hands-on experience with data science tools: pandas, matplotlib, scikit-learn, nltk, and networkx.', link: 'https://www.coursera.org/specializations/data-science-python', free: false },

        // ── DevOps ──
        { id: 'c33', title: 'DevOps Engineering on AWS', provider: 'AWS Training', platform: 'AWS', duration: '3 days', level: 'Intermediate', category: 'devops', description: 'Learn DevOps methodologies on AWS. Cover CI/CD, infrastructure as code, monitoring, and logging with hands-on labs.', link: 'https://aws.amazon.com/training/classroom/devops-engineering-on-aws/', free: false },
        { id: 'c34', title: 'Google SRE: Site Reliability Engineering', provider: 'Google / Coursera', platform: 'Google Cloud', duration: '4 weeks', level: 'Advanced', category: 'devops', description: 'Understand SRE principles and practices from Google engineers. Learn SLIs, SLOs, error budgets, and incident management.', link: 'https://www.coursera.org/learn/site-reliability-engineering-slos', free: true },
        { id: 'c35', title: 'Docker & Kubernetes: The Practical Guide', provider: 'Udemy', platform: 'Udemy', duration: '24 hours', level: 'Intermediate', category: 'devops', description: 'Learn Docker, Docker Compose, Multi-Container Projects, Deployment, and Kubernetes from the ground up.', link: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', free: false },
        { id: 'c36', title: 'Continuous Delivery & DevOps', provider: 'University of Virginia / Coursera', platform: 'Coursera', duration: '4 weeks', level: 'Beginner', category: 'devops', description: 'Learn the principles and practices of continuous delivery and DevOps. Understand CI/CD pipelines and deployment strategies.', link: 'https://www.coursera.org/learn/uva-darden-continous-delivery-devops', free: true },
        { id: 'c37', title: 'HashiCorp Terraform Associate Certification', provider: 'HashiCorp / Udemy', platform: 'Udemy', duration: '12 hours', level: 'Intermediate', category: 'devops', description: 'Master Terraform for Infrastructure as Code. Prepare for the HashiCorp Terraform Associate certification.', link: 'https://www.udemy.com/course/terraform-beginner-to-advanced/', free: false },

        // ── Web3 / Blockchain ──
        { id: 'c38', title: 'Blockchain Specialization', provider: 'University at Buffalo / Coursera', platform: 'Coursera', duration: '4 months', level: 'Intermediate', category: 'web3', description: 'Design, develop, and deploy smart contracts and decentralized applications on the Ethereum blockchain.', link: 'https://www.coursera.org/specializations/blockchain', free: false },
        { id: 'c39', title: 'Ethereum and Solidity: The Complete Developer\'s Guide', provider: 'Udemy', platform: 'Udemy', duration: '24 hours', level: 'Intermediate', category: 'web3', description: 'Build decentralized apps (dApps) using Ethereum smart contracts, Solidity, Web3.js, React, and more.', link: 'https://www.udemy.com/course/ethereum-and-solidity-the-complete-developers-guide/', free: false },
        { id: 'c40', title: 'Bitcoin and Cryptocurrency Technologies', provider: 'Princeton / Coursera', platform: 'Coursera', duration: '11 weeks', level: 'Beginner', category: 'web3', description: 'Learn how Bitcoin works at a technical level. Understand decentralization, mining, consensus, and the blockchain data structure.', link: 'https://www.coursera.org/learn/cryptocurrency', free: true },
        { id: 'c41', title: 'Buildspace - Build a Web3 App', provider: 'Buildspace', platform: 'Buildspace', duration: 'Self-paced', level: 'Beginner', category: 'web3', description: 'Build and ship your first Web3 project. Learn Solidity, smart contracts, and full-stack dApp development.', link: 'https://buildspace.so/', free: true },

        // ── Mobile Development ──
        { id: 'c42', title: 'Meta React Native Specialization', provider: 'Meta / Coursera', platform: 'Coursera', duration: '5 months', level: 'Intermediate', category: 'mobile', description: 'Build mobile applications using React Native. Learn iOS and Android app development with a single codebase.', link: 'https://www.coursera.org/professional-certificates/meta-react-native', free: false },
        { id: 'c43', title: 'Android App Development Specialization', provider: 'Vanderbilt / Coursera', platform: 'Coursera', duration: '5 months', level: 'Beginner', category: 'mobile', description: 'Learn to develop Android apps with Java. Cover activities, intents, persistence, and building production-quality apps.', link: 'https://www.coursera.org/specializations/android-app-development', free: false },
        { id: 'c44', title: 'iOS App Development with Swift', provider: 'University of Toronto / Coursera', platform: 'Coursera', duration: '6 months', level: 'Beginner', category: 'mobile', description: 'Build iOS apps using Swift and Xcode. Learn UIKit, networking, Core Data, and publishing to the App Store.', link: 'https://www.coursera.org/specializations/app-development', free: false },
        { id: 'c45', title: 'Flutter & Dart - The Complete Guide', provider: 'Udemy', platform: 'Udemy', duration: '42 hours', level: 'Beginner', category: 'mobile', description: 'Build beautiful cross-platform mobile apps with Flutter and Dart. Covers widgets, state management, Firebase, and more.', link: 'https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/', free: false },
        { id: 'c46', title: 'CS193p - Developing Apps for iOS', provider: 'Stanford Online', platform: 'Stanford', duration: 'Self-paced', level: 'Intermediate', category: 'mobile', description: 'Stanford\'s legendary iOS development course using SwiftUI. Build real apps while learning modern iOS architecture.', link: 'https://cs193p.sites.stanford.edu/', free: true },

        // ── General CS / Programming ──
        { id: 'c47', title: 'CS50: Introduction to Computer Science', provider: 'Harvard / edX', platform: 'edX', duration: '12 weeks', level: 'Beginner', category: 'web-dev', description: 'Harvard\'s legendary intro to computer science and the art of programming. Covers C, Python, SQL, JavaScript, HTML, and CSS.', link: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x', free: true },
        { id: 'c48', title: 'Python for Everybody Specialization', provider: 'University of Michigan / Coursera', platform: 'Coursera', duration: '8 months', level: 'Beginner', category: 'data-science', description: 'Learn to program and analyze data with Python. No prior experience required. Perfect starting point for data science.', link: 'https://www.coursera.org/specializations/python', free: true },
        { id: 'c49', title: 'Algorithms Specialization', provider: 'Stanford / Coursera', platform: 'Coursera', duration: '4 months', level: 'Intermediate', category: 'web-dev', description: 'Learn the fundamental algorithms and data structures. Covers divide and conquer, graph search, greedy algorithms, and dynamic programming.', link: 'https://www.coursera.org/specializations/algorithms', free: false },
        { id: 'c50', title: 'MIT 6.006: Introduction to Algorithms', provider: 'MIT OpenCourseWare', platform: 'MIT OCW', duration: 'Self-paced', level: 'Intermediate', category: 'web-dev', description: 'This course provides an introduction to mathematical modeling of computational problems, including sorting, searching, and graph algorithms.', link: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', free: true },
        { id: 'c51', title: 'Generative AI with Large Language Models', provider: 'DeepLearning.AI / Coursera', platform: 'Coursera', duration: '3 weeks', level: 'Intermediate', category: 'ai-ml', description: 'Learn the fundamentals of generative AI, including transformer architecture, fine-tuning, RLHF, and deploying LLMs.', link: 'https://www.coursera.org/learn/generative-ai-with-llms', free: false },
        { id: 'c52', title: 'Prompt Engineering for ChatGPT', provider: 'Vanderbilt / Coursera', platform: 'Coursera', duration: '18 hours', level: 'Beginner', category: 'ai-ml', description: 'Master the art of prompt engineering. Learn patterns and approaches for generating powerful outputs from LLMs like ChatGPT.', link: 'https://www.coursera.org/learn/prompt-engineering', free: true },
    ],

    // ═══════════════════════════════════════════════
    // HACKATHONS — 10+ Real / Recurring Hackathons
    // ═══════════════════════════════════════════════
    hackathons: [
        { id: 'h1', title: 'MLH Global Hack Week', organizer: 'Major League Hacking', platform: 'MLH', deadline: 'Recurring monthly', prize: 'Prizes + Swag', description: 'Week-long hackathon with daily challenges, workshops, and mini-events. Open to all skill levels. Build projects, learn new skills, and win prizes.', link: 'https://ghw.mlh.io/', image: 'https://ghw.mlh.io/assets/ghw-logo.svg', tags: ['All Levels', 'Weekly', 'Global'], status: 'ongoing' },
        { id: 'h2', title: 'Devpost Featured Hackathons', organizer: 'Devpost', platform: 'Devpost', deadline: 'Various', prize: '$1K–$100K+', description: 'Browse the largest collection of hackathons worldwide. New hackathons added daily from companies like Google, Microsoft, and IBM.', link: 'https://devpost.com/hackathons', image: 'https://devpost.com/assets/logo-new.png', tags: ['All Levels', 'Various', 'Global'], status: 'ongoing' },
        { id: 'h3', title: 'ETHGlobal Hackathons', organizer: 'ETHGlobal', platform: 'ETHGlobal', deadline: 'Recurring', prize: '$50K+ per event', description: 'The world\'s largest Ethereum hackathon series. Build Web3 projects with mentorship from leading blockchain developers and win from massive prize pools.', link: 'https://ethglobal.com/', image: 'https://ethglobal.com/favicon.ico', tags: ['Web3', 'Blockchain', 'Advanced'], status: 'ongoing' },
        { id: 'h4', title: 'Kaggle Competitions', organizer: 'Kaggle / Google', platform: 'Kaggle', deadline: 'Various', prize: '$100–$1M+', description: 'Compete in data science and ML challenges. Solve real-world problems, improve your skills, and earn ranking on the global leaderboard.', link: 'https://www.kaggle.com/competitions', image: 'https://www.kaggle.com/static/images/site-logo.png', tags: ['AI/ML', 'Data Science', 'All Levels'], status: 'ongoing' },
        { id: 'h5', title: 'HackerEarth Challenges', organizer: 'HackerEarth', platform: 'HackerEarth', deadline: 'Various', prize: 'Up to $10K', description: 'Participate in coding challenges, hackathons, and hiring challenges. Companies host hackathons to discover talent.', link: 'https://www.hackerearth.com/challenges/', image: 'https://www.hackerearth.com/favicon.ico', tags: ['Coding', 'Hiring', 'All Levels'], status: 'ongoing' },
        { id: 'h6', title: 'Google Summer of Code', organizer: 'Google', platform: 'Google', deadline: 'March annually', prize: 'Stipend ($1500–$6600)', description: 'A global program focused on introducing students and newcomers to open source development. Work on real projects with mentors.', link: 'https://summerofcode.withgoogle.com/', image: 'https://summerofcode.withgoogle.com/favicon.ico', tags: ['Open Source', 'Students', 'Beginner'], status: 'upcoming' },
        { id: 'h7', title: 'Hackathon.com Listings', organizer: 'Various', platform: 'Hackathon.com', deadline: 'Various', prize: 'Various', description: 'Discover hackathons happening worldwide. Filter by location, topic, and date. New events added constantly.', link: 'https://www.hackathon.com/', image: 'https://www.hackathon.com/favicon.ico', tags: ['Global', 'Various', 'All Levels'], status: 'ongoing' },
        { id: 'h8', title: 'AngelHack Global Series', organizer: 'AngelHack', platform: 'AngelHack', deadline: 'Recurring', prize: '$10K+ per event', description: 'A global hackathon series connecting developers with corporates. Build solutions for real enterprise challenges.', link: 'https://angelhack.com/', image: 'https://angelhack.com/favicon.ico', tags: ['Enterprise', 'Global', 'Intermediate'], status: 'ongoing' },
        { id: 'h9', title: 'NASA Space Apps Challenge', organizer: 'NASA', platform: 'NASA', deadline: 'October annually', prize: 'Global recognition', description: 'The world\'s largest annual hackathon. Use NASA\'s open data to build solutions for challenges on Earth and in space.', link: 'https://www.spaceappschallenge.org/', image: 'https://www.spaceappschallenge.org/favicon.ico', tags: ['Space', 'Science', 'All Levels'], status: 'upcoming' },
        { id: 'h10', title: 'Unstop Hackathons', organizer: 'Various', platform: 'Unstop', deadline: 'Various', prize: '₹50K–₹10L+', description: 'India\'s largest platform for hackathons, coding challenges, and competitions. Hosted by top companies and colleges.', link: 'https://unstop.com/hackathons', image: 'https://unstop.com/favicon.ico', tags: ['India', 'All Levels', 'Various'], status: 'ongoing' },
        { id: 'h11', title: 'Microsoft Imagine Cup', organizer: 'Microsoft', platform: 'Microsoft', deadline: 'Annual', prize: '$100K+ Grand Prize', description: 'A global technology competition for students. Build innovative solutions using Microsoft Azure and compete for the grand prize.', link: 'https://imaginecup.microsoft.com/', tags: ['Students', 'Azure', 'Global'], status: 'upcoming' },
        { id: 'h12', title: 'Meta Hacker Cup', organizer: 'Meta', platform: 'Meta', deadline: 'Annual', prize: 'Cash prizes + swag', description: 'Annual programming competition by Meta. Solve algorithmic challenges across multiple rounds and compete globally.', link: 'https://www.facebook.com/codingcompetitions/hacker-cup', tags: ['Algorithms', 'Competitive', 'Advanced'], status: 'upcoming' },
    ],

    // ═══════════════════════════════════════════════
    // JOBS — 30+ Real Tech Company Career Links
    // ═══════════════════════════════════════════════
    jobs: [
        { id: 'j1', title: 'Software Engineer', company: 'Google', location: 'Mountain View, CA', remote: 'Hybrid', level: 'Mid-Senior', salary: '$150K–$300K', category: 'engineering', link: 'https://careers.google.com/jobs/results/?q=software%20engineer', logo: 'https://logo.clearbit.com/google.com' },
        { id: 'j2', title: 'Frontend Engineer', company: 'Meta', location: 'Menlo Park, CA', remote: 'Remote OK', level: 'Mid', salary: '$140K–$250K', category: 'engineering', link: 'https://www.metacareers.com/jobs?q=frontend%20engineer', logo: 'https://logo.clearbit.com/meta.com' },
        { id: 'j3', title: 'Full-Stack Developer', company: 'Microsoft', location: 'Redmond, WA', remote: 'Hybrid', level: 'Mid-Senior', salary: '$130K–$280K', category: 'engineering', link: 'https://careers.microsoft.com/us/en/search-results?keywords=full%20stack', logo: 'https://logo.clearbit.com/microsoft.com' },
        { id: 'j4', title: 'Cloud Solutions Architect', company: 'Amazon (AWS)', location: 'Seattle, WA', remote: 'On-site', level: 'Senior', salary: '$160K–$320K', category: 'cloud', link: 'https://www.amazon.jobs/en/search?offset=0&result_limit=10&sort=relevant&category=solutions-architect', logo: 'https://logo.clearbit.com/amazon.com' },
        { id: 'j5', title: 'ML Engineer', company: 'OpenAI', location: 'San Francisco, CA', remote: 'On-site', level: 'Senior', salary: '$200K–$500K+', category: 'ai-ml', link: 'https://openai.com/careers', logo: 'https://logo.clearbit.com/openai.com' },
        { id: 'j6', title: 'DevOps Engineer', company: 'Netflix', location: 'Los Gatos, CA', remote: 'Hybrid', level: 'Senior', salary: '$180K–$400K', category: 'devops', link: 'https://jobs.netflix.com/search?q=devops', logo: 'https://logo.clearbit.com/netflix.com' },
        { id: 'j7', title: 'Security Engineer', company: 'Stripe', location: 'San Francisco, CA', remote: 'Remote', level: 'Mid-Senior', salary: '$160K–$300K', category: 'cybersecurity', link: 'https://stripe.com/jobs/search?q=security', logo: 'https://logo.clearbit.com/stripe.com' },
        { id: 'j8', title: 'iOS Developer', company: 'Apple', location: 'Cupertino, CA', remote: 'On-site', level: 'Mid', salary: '$150K–$280K', category: 'mobile', link: 'https://jobs.apple.com/en-us/search?search=ios%20developer', logo: 'https://logo.clearbit.com/apple.com' },
        { id: 'j9', title: 'Backend Engineer (Go)', company: 'GitHub', location: 'Remote', remote: 'Remote', level: 'Mid-Senior', salary: '$140K–$260K', category: 'engineering', link: 'https://github.com/about/careers', logo: 'https://logo.clearbit.com/github.com' },
        { id: 'j10', title: 'Data Scientist', company: 'NVIDIA', location: 'Santa Clara, CA', remote: 'Hybrid', level: 'Senior', salary: '$170K–$350K', category: 'data-science', link: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=data%20scientist', logo: 'https://logo.clearbit.com/nvidia.com' },
        { id: 'j11', title: 'Platform Engineer', company: 'Shopify', location: 'Remote', remote: 'Remote', level: 'Mid', salary: '$130K–$220K (CAD)', category: 'devops', link: 'https://www.shopify.com/careers/search?q=platform+engineer', logo: 'https://logo.clearbit.com/shopify.com' },
        { id: 'j12', title: 'AI Research Scientist', company: 'DeepMind', location: 'London, UK', remote: 'On-site', level: 'Senior', salary: '£120K–£250K', category: 'ai-ml', link: 'https://deepmind.google/about/careers/', logo: 'https://logo.clearbit.com/deepmind.com' },
        { id: 'j13', title: 'React Developer', company: 'Vercel', location: 'Remote', remote: 'Remote', level: 'Mid', salary: '$140K–$240K', category: 'engineering', link: 'https://vercel.com/careers', logo: 'https://logo.clearbit.com/vercel.com' },
        { id: 'j14', title: 'Blockchain Developer', company: 'Coinbase', location: 'Remote', remote: 'Remote', level: 'Mid-Senior', salary: '$150K–$300K', category: 'web3', link: 'https://www.coinbase.com/careers/positions', logo: 'https://logo.clearbit.com/coinbase.com' },
        { id: 'j15', title: 'Site Reliability Engineer', company: 'Cloudflare', location: 'San Francisco, CA', remote: 'Hybrid', level: 'Senior', salary: '$160K–$290K', category: 'devops', link: 'https://www.cloudflare.com/careers/jobs/', logo: 'https://logo.clearbit.com/cloudflare.com' },
        { id: 'j16', title: 'Product Engineer', company: 'Linear', location: 'Remote', remote: 'Remote', level: 'Mid', salary: '$140K–$220K', category: 'engineering', link: 'https://linear.app/careers', logo: 'https://logo.clearbit.com/linear.app' },
        { id: 'j17', title: 'Systems Engineer', company: 'SpaceX', location: 'Hawthorne, CA', remote: 'On-site', level: 'Mid-Senior', salary: '$130K–$200K', category: 'engineering', link: 'https://www.spacex.com/careers/', logo: 'https://logo.clearbit.com/spacex.com' },
        { id: 'j18', title: 'Cybersecurity Analyst', company: 'CrowdStrike', location: 'Remote', remote: 'Remote', level: 'Mid', salary: '$100K–$180K', category: 'cybersecurity', link: 'https://www.crowdstrike.com/careers/', logo: 'https://logo.clearbit.com/crowdstrike.com' },
        { id: 'j19', title: 'Mobile Developer (Flutter)', company: 'ByteDance', location: 'Singapore', remote: 'On-site', level: 'Mid', salary: '$80K–$150K (SGD)', category: 'mobile', link: 'https://jobs.bytedance.com/', logo: 'https://logo.clearbit.com/bytedance.com' },
        { id: 'j20', title: 'Staff Engineer', company: 'Databricks', location: 'San Francisco, CA', remote: 'Hybrid', level: 'Staff', salary: '$200K–$400K', category: 'data-science', link: 'https://www.databricks.com/company/careers', logo: 'https://logo.clearbit.com/databricks.com' },
    ],

    // ═══════════════════════════════════════════════
    // NEWS — RSS Feed Integration
    // Uses rss2json API for client-side RSS parsing
    // ═══════════════════════════════════════════════
    _newsFeeds: [
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'startups', icon: '🚀' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech', icon: '⚡' },
        { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'dev', icon: '🔶' },
        { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', category: 'research', icon: '🔬' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'tech', icon: '📡' },
        { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', category: 'ai', icon: '🤖' },
        { name: 'GitHub Blog', url: 'https://github.blog/feed/', category: 'dev', icon: '🐙' },
        { name: 'AWS Blog', url: 'https://aws.amazon.com/blogs/aws/feed/', category: 'cloud', icon: '☁️' },
        { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'ai', icon: '🧠' },
        { name: 'Cloudflare Blog', url: 'https://blog.cloudflare.com/rss/', category: 'infra', icon: '🛡️' },
        { name: 'Stack Overflow Blog', url: 'https://stackoverflow.blog/feed/', category: 'dev', icon: '📚' },
        { name: 'InfoQ', url: 'https://feed.infoq.com/', category: 'dev', icon: '📰' },
        { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', category: 'startups', icon: '🏹' },
        { name: 'Dev.to', url: 'https://dev.to/feed', category: 'dev', icon: '👩‍💻' },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'tech', icon: '🌐' },
        { name: 'Hacker Noon', url: 'https://hackernoon.com/feed', category: 'tech', icon: '🟩' },
        { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'dev', icon: '📕' },
        { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'tech', icon: '📱' },
        { name: 'The Next Web', url: 'https://thenextweb.com/feed', category: 'startups', icon: '🌍' },
        { name: 'Gizmodo', url: 'https://gizmodo.com/feed', category: 'tech', icon: '🛸' },
        { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'security', icon: '🔒' },
        { name: 'TechRadar', url: 'https://www.techradar.com/rss', category: 'tech', icon: '💻' },
        { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org/news/rss/', category: 'dev', icon: '🔥' },
        { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'dev', icon: '🖌️' },
        { name: 'ReadWrite', url: 'https://readwrite.com/feed/', category: 'tech', icon: '📖' },
        { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', category: 'tech', icon: '🗞️' },
        { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'web3', icon: '🪙' }
    ],

    /**
     * Fetch news — CONSOLIDATED to use LiveNewsEngine's shared buffer
     * This avoids duplicate rss2json API calls that exceed rate limits
     */
    async getNews(limit = 30) {
        const cached = this._getCached('news', 60000);
        if (cached) return cached;

        // Use LiveNewsEngine as the single source of truth for RSS data
        const liveEngine = window.LiveNewsEngine;
        if (liveEngine && liveEngine.buffer.length > 0) {
            const result = liveEngine.getBuffer(limit).map(item => ({
                title: item.title,
                description: item.description || '',
                link: item.link,
                pubDate: item.pubDate || item.createdAt,
                author: item.source || 'Unknown',
                source: item.source || 'Live Feed',
                sourceIcon: item.sourceIcon || '📰',
                category: item.category || 'tech',
                thumbnail: item.thumbnail || null
            }));
            this._setCache('news', result, 60000);
            return result;
        }

        // Fallback: only fetch if LiveNewsEngine hasn't initialized yet
        const allArticles = [];
        const seenTitles = new Set();

        // Fetch from only 3 feeds max to stay within rate limits
        const selectedFeeds = this._newsFeeds.slice(0, 3);
        const feedPromises = selectedFeeds.map(async (feed) => {
            try {
                const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=5`;
                const res = await Promise.race([
                    fetch(url),
                    new Promise((_, reject) => setTimeout(() => reject('timeout'), 4000))
                ]);
                const data = await res.json();
                if (data.status === 'ok' && data.items) {
                    data.items.forEach(item => {
                        const normalized = item.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
                        if (normalized && !seenTitles.has(normalized)) {
                            seenTitles.add(normalized);
                            allArticles.push({
                                title: item.title,
                                description: this._stripHtml(item.description || '').slice(0, 250),
                                link: item.link,
                                pubDate: item.pubDate,
                                author: item.author || feed.name,
                                source: feed.name,
                                sourceIcon: feed.icon,
                                category: feed.category,
                                thumbnail: item.thumbnail || item.enclosure?.link || null
                            });
                        }
                    });
                }
            } catch (e) { /* Feed failed or timed out */ }
        });

        await Promise.allSettled(feedPromises);

        allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        const result = allArticles.slice(0, limit);

        this._setCache('news', result, 60000);
        return result;
    },

    _stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    },

    // ── Course Helpers ──
    getCourses(category = 'all') {
        if (category === 'all') return this.courses;
        return this.courses.filter(c => c.category === category);
    },

    getCourseCategoryLabel(cat) {
        const labels = { 'ai-ml': 'AI / ML', 'web-dev': 'Web Development', 'cloud': 'Cloud Computing', 'cybersecurity': 'Cybersecurity', 'data-science': 'Data Science', 'devops': 'DevOps', 'web3': 'Web3 / Blockchain', 'mobile': 'Mobile Development' };
        return labels[cat] || cat;
    },

    // ── Job Helpers ──
    getJobs(category = 'all', remoteOnly = false) {
        let jobs = category === 'all' ? this.jobs : this.jobs.filter(j => j.category === category);
        if (remoteOnly) jobs = jobs.filter(j => j.remote === 'Remote');
        return jobs;
    },

    // ── Hackathon Helpers ──
    getHackathons(status = 'all') {
        if (status === 'all') return this.hackathons;
        return this.hackathons.filter(h => h.status === status);
    }
};

window.LiveData = LiveData;
export default LiveData;

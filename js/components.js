// ============================================
// TechOL - Component Renderers (Production)
// Professional Material Symbols icons
// ============================================

import Icons from "./icons.js";
import Utils from "./utils.js";
import AuthService from "./auth.js";
import AIEngine from "./ai-engine.js";

const Components = {
  transitionLoadingOverlay(text = 'Preparing your workspace...', subtext = 'Securing your session...') {
    const id = 'transition-overlay-' + Math.random().toString(36).substr(2, 9);
    // Use the existing intelligenceLoader but wrapped in a component that handles the overlay lifecycle
    return `
    <div id="${id}" class="transition-overlay" style="position:fixed; inset:0; z-index:9999; background: radial-gradient(circle at center, #121212 0%, #1e1e1e 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; transition: opacity 0.4s ease-out;">
      ${this.intelligenceLoader(text, subtext)}
    </div>`;
  },

  intelligenceLoader(text = 'Initializing Intelligence Layer...', subtext = 'Analyzing market signals in real time') {
    const id = 'wave-loader-' + Math.random().toString(36).substr(2, 9);
    setTimeout(() => {
      const canvas = document.getElementById(id + '-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let w, h;
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      };
      window.addEventListener('resize', resize);
      resize();

      const waves = [
        { amplitude: 25, period: 0.015, phase: 0, speed: 0.02, color: 'rgba(0, 112, 243, 0.4)' },
        { amplitude: 15, period: 0.02, phase: 0, speed: 0.04, color: 'rgba(0, 112, 243, 0.2)' },
        { amplitude: 35, period: 0.01, phase: 0, speed: 0.015, color: 'rgba(80, 227, 194, 0.15)' },
        { amplitude: 10, period: 0.03, phase: 0, speed: 0.06, color: 'rgba(121, 40, 202, 0.1)' }
      ];

      let frame = 0;
      const animate = () => {
        if (!document.getElementById(id + '-canvas')) return;
        ctx.clearRect(0, 0, w, h);
        frame++;

        waves.forEach((wave, i) => {
          ctx.beginPath();
          ctx.lineWidth = i === 0 ? 2 : 1;
          ctx.strokeStyle = wave.color;

          for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin(x * wave.period + wave.phase) * wave.amplitude * (0.8 + Math.sin(frame * 0.01 + i) * 0.2);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          wave.phase -= wave.speed;
        });

        // Scanning line
        const scanX = (frame * 2) % (w + 200) - 100;
        const grad = ctx.createLinearGradient(scanX - 50, 0, scanX + 50, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(scanX - 50, 0, 100, h);

        requestAnimationFrame(animate);
      };
      animate();

      // Counter animation
      let count = 0;
      const counterEl = document.getElementById(id + '-counter');
      const interval = setInterval(() => {
        if (!counterEl) { clearInterval(interval); return; }
        count += Math.floor(Math.random() * 3) + 1;
        if (count >= 100) { count = 100; clearInterval(interval); }
        counterEl.textContent = count;
      }, 50);
    }, 0);

    return `
    <div id="${id}" class="intelligence-loader-full" style="position:fixed; inset:0; z-index:9999; background:radial-gradient(circle at center, #010206 0%, #000 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; font-family:var(--font-display);">
      <div style="position:absolute; inset:0; opacity:0.03; pointer-events:none; background-image:url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.85\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\'/%3E%3C/svg%3E');"></div>
      
      <div style="position:relative; width:100%; max-width:600px; height:200px; margin-bottom:40px;">
        <canvas id="${id}-canvas" style="width:100%; height:100%;"></canvas>
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:4px; height:4px; background:#fff; border-radius:50%; box-shadow:0 0 20px #fff; animation: pulse 2s infinite;"></div>
      </div>

      <div style="text-align:center; position:relative; z-index:10;">
        <div style="font-size:14px; font-weight:800; letter-spacing:4px; text-transform:uppercase; color:#fff; margin-bottom:12px; opacity:0.9;">${text}</div>
        <div style="font-size:11px; font-weight:500; letter-spacing:1.5px; color:rgba(255,255,255,0.4); text-transform:uppercase;">${subtext}</div>
        
        <div style="margin-top:48px; font-family:var(--font-mono); font-size:12px; color:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; gap:12px;">
          <span style="letter-spacing:2px;">Loading</span>
          <span style="color:rgba(255,255,255,0.6); width:40px; text-align:right;"><span id="${id}-counter">0</span>%</span>
        </div>
      </div>
    </div>`;
  },

  topLoadingBar() {
    return `<div id="top-loading-bar" style="position:fixed; top:0; left:0; width:0%; height:3px; background:linear-gradient(to right, #0070f3, #7928ca); z-index:10000; transition: width 0.3s ease-out; box-shadow:0 0 10px var(--accent-glow)"></div>`;
  },

  infiniteScrollLoader() {
    return `
    <div class="infinite-loader" style="padding:var(--space-10); text-align:center; opacity:0.6;">
        <div class="spinner spinner-sm" style="margin:0 auto var(--space-3)"></div>
        <div style="font-size:10px; font-weight:800; letter-spacing:2px; color:var(--text-tertiary); text-transform:uppercase">Loading more...</div>
    </div>`;
  },

  loadingSpinner(text = 'Authenticating with Command Center...') {
    return this.intelligenceLoader(text);
  },

  _getAvatarGradient(user) {
    // Simple placeholder for avatar gradient generation
    // In a real app, this would be more sophisticated, e.g., based on user ID hash
    const colors = ['#673AB7', '#2196F3', '#00BCD4', '#4CAF50', '#FFC107', '#FF5722', '#E91E63'];
    const hash = user && user.uid ? user.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const color1 = colors[hash % colors.length];
    const color2 = colors[(hash + 1) % colors.length];
    return `linear-gradient(45deg, ${color1}, ${color2})`;
  },

  avatar(user, size = '', extra = '') {
    const isVerified = user && (user.uid === 'admin' || user.isVerified);
    const displayName = user && (user.displayName || user.username) ? (user.displayName || user.username) : 'Anonymous';
    const initial = displayName.charAt(0).toUpperCase();

    return `
        <div class="avatar-wrap ${size} ${isVerified ? 'verified-outline' : ''}" ${extra}>
            ${user && user.photoURL ? `<img src="${user.photoURL}" class="avatar ${size}" alt="${displayName}'s avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random'">` :
        `<div class="avatar avatar-placeholder ${size}" style="background: ${this._getAvatarGradient(user)}" aria-label="${displayName}">${initial}</div>`}
            ${isVerified ? `<div class="verified-badge">${Icons.verified(12)}</div>` : ''}
        </div>`;
  },

  // ---- Real-time Intelligence Components ----
  liveStatusIndicator(status = 'Live') {
    let color = 'var(--success)';
    let icon = 'fiber_manual_record';
    if (status === 'Syncing') { color = 'var(--accent)'; icon = 'sync'; }
    if (status === 'Error') { color = 'var(--error)'; icon = 'error'; }
    return `
      <div id="realtime-status-indicator" class="${status === 'Syncing' ? 'animate-pulse' : ''}" style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.4); padding:6px 12px; border-radius:100px; border:1px solid rgba(255,255,255,0.1); font-size:10px; font-weight:900; color:${color}; backdrop-filter:blur(10px)">
        <span class="material-symbols-outlined ${status === 'Syncing' ? 'spin' : ''}" style="font-size:14px">${icon}</span>
        ${status.toUpperCase()}
      </div>
    `;
  },

  capitalFlowHeatmap(data = []) {
    return `
      <div class="intel-card heatmap-card animate-fadeIn">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
          <h3 style="font-size:14px; font-weight:900; letter-spacing:1px; color:var(--text-primary)">LIVE CAPITAL FLOW HEATMAP</h3>
          <span style="font-size:10px; color:var(--accent); font-weight:800">24H VELOCITY</span>
        </div>
        <div class="heatmap-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:10px">
          ${data.map(item => `
            <div class="heatmap-item" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:12px; position:relative; overflow:hidden">
              <div style="position:absolute; top:0; left:0; height:100%; width:${item.intensity}%; background:rgba(var(--accent-rgb), 0.1); z-index:1"></div>
              <div style="position:relative; z-index:2">
                <div style="font-size:10px; font-weight:700; color:var(--text-secondary)">${item.label}</div>
                <div style="font-size:14px; font-weight:900; color:var(--text-primary); margin-top:4px">$${Utils.formatNumber(item.volume)}</div>
                <div style="font-size:9px; color:var(--success); font-weight:700; margin-top:2px">+${item.change}% ${Icons.ms('trending_up', { size: 10 })}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  fundingTicker(alerts = []) {
    if (!alerts || alerts.length === 0) {
      // Use RealtimeDataEngine fallback
      alerts = window.RealtimeDataEngine?.getLiveFundingAlerts() || [];
    }
    const items = [...alerts, ...alerts].map(a => `
      <span class="funding-item">
        <span style="color:var(--accent);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px">FUNDING</span>
        <span style="color:var(--text-primary);font-weight:800">${a.company}</span>
        <span style="color:var(--success);font-weight:900">$${a.amount}M</span>
        <span style="color:var(--text-secondary)">${a.round}</span>
        <span style="color:var(--text-tertiary);font-size:9px">← ${a.investor}</span>
        <span style="font-size:9px;background:rgba(var(--accent-rgb),0.1);border:1px solid rgba(var(--accent-rgb),0.2);color:var(--accent);padding:1px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:0.3px">${a.sector || 'Tech'}</span>
      </span>
    `).join('');
    return `
      <div class="funding-ticker-container">
        <div class="funding-ticker-inner">${items}</div>
      </div>
    `;
  },

  sectorMomentumBoard(sectors = []) {
    if (!sectors || sectors.length === 0) {
      sectors = window.RealtimeDataEngine?.getLiveSectorData() || [];
    }
    return `
      <div class="sector-grid">
        ${sectors.map(s => {
      const scoreColor = s.score >= 85 ? '#10b981' : s.score >= 75 ? '#0ea5e9' : s.score >= 65 ? '#f59e0b' : '#6b7280';
      return `
          <div class="sector-chip" data-tooltip="${s.insights?.[0] || ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span style="font-size:10px;font-weight:900;color:var(--text-primary);letter-spacing:0.3px">${s.sector.toUpperCase()}</span>
              <span style="font-size:14px;font-weight:900;color:${scoreColor}">${s.score}</span>
            </div>
            <div class="sector-progress">
              <div class="sector-progress-fill" style="width:${s.score}%;background:${scoreColor};color:${scoreColor}"></div>
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:10px;color:${s.trend === '▲' ? '#10b981' : '#ef4444'}">${s.trend || '▲'}</span>
              <span style="font-size:9px;color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${s.insights?.[0] || ''}</span>
            </div>
          </div>`
    }).join('')}
      </div>
    `;
  },

  skeleton(type = 'card', count = 1) {
    let html = '';
    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        html += `<div class="skeleton-card animate-pulse">
                    <div class="skeleton-header"><div class="skeleton-avatar"></div><div class="skeleton-line sm"></div></div>
                    <div class="skeleton-line lg"></div><div class="skeleton-line md"></div>
                </div>`;
      } else {
        html += `<div class="skeleton-line sm animate-pulse"></div>`;
      }
    }
    return html;
  },

  insightCard(post, author) {
    if (!author) return '';
    const cat = Utils.getCategoryInfo(post.category);
    const isPlatform = post.type === 'platform';
    const isLiveNews = post.isLiveNews === true;

    // Extract source link for live news items
    const sourceLink = post.source_link || '';
    const sourceLabel = post.source_label || '';

    // Split title and description for live news
    let headlineHtml = '';
    let bodyHtml = '';
    if (isLiveNews && post.text) {
        const parts = post.text.split('\n\n');
        const headline = parts[0] || '';
        const desc = parts.slice(1).join('\n\n') || '';
        headlineHtml = `<div style="font-size:16px;line-height:1.5;color:var(--text-primary);font-weight:700;font-family:var(--font-sans);margin-bottom:${desc ? '8px' : '0'}">${Utils.formatPostText(headline)}</div>`;
        if (desc) {
            bodyHtml = `<div style="font-size:13px;line-height:1.65;color:var(--text-secondary);font-family:var(--font-sans)">${Utils.formatPostText(desc)}</div>`;
        }
    } else {
        headlineHtml = `<div style="font-size:15px;line-height:1.75;color:var(--text-primary);white-space:pre-wrap;font-weight:400;font-family:var(--font-sans)">${Utils.formatPostText(post.text)}</div>`;
    }

    return `
    <article class="post-card animate-fadeInUp insight-card" id="post-${post.id}"
      style="padding:24px;margin-bottom:16px;background:${isPlatform ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.06) 0%, rgba(20, 25, 35, 0.5) 100%)' : 'rgba(20, 25, 35, 0.35)'}; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid ${isPlatform ? 'rgba(var(--accent-rgb), 0.15)' : 'rgba(255, 255, 255, 0.04)'};border-radius:16px;transition:all 0.25s ease;position:relative; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);">

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div style="display:flex;gap:12px;align-items:center">
          <div style="position:relative">
            ${this.avatar(author, 'avatar-md')}
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-weight:700;font-size:14px;color:var(--text-primary);font-family:var(--font-sans)">${author.displayName}</span>
              ${author.verified ? Icons.verified(14) : ''}
              ${sourceLabel ? `<span style="font-size:10px;font-weight:600;color:var(--text-tertiary);background:rgba(255,255,255,0.04);padding:2px 8px;border-radius:4px">${sourceLabel}</span>` : ''}
            </div>
            <div style="color:var(--text-tertiary);font-size:12px;margin-top:2px;font-family:var(--font-sans)">${Utils.timeAgo(post.createdAt)}${author.jobTitle ? ` · ${author.jobTitle}` : ''}${author.company ? ` at ${author.company}` : ''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${cat.label ? `<span style="font-size:10px;font-weight:600;color:var(--accent);background:rgba(var(--accent-rgb),0.08);padding:4px 10px;border-radius:6px;letter-spacing:0.3px">${cat.icon} ${cat.label}</span>` : ''}
        </div>
      </div>

      <div class="post-content" style="margin-bottom:16px">
        ${headlineHtml}
        ${bodyHtml}
        ${post.imageURL ? `<div style="margin-top:16px;border-radius:12px;overflow:hidden;border:1px solid var(--border-secondary);line-height:0"><img src="${post.imageURL}" style="width:100%;display:block;max-height:400px;object-fit:cover" alt="Post image" loading="lazy"></div>` : ''}
        ${isLiveNews && sourceLink && sourceLink !== '#' ? `<a href="${sourceLink}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:13px;color:var(--accent);text-decoration:none;font-weight:600;font-family:var(--font-sans)">Read full article ${Icons.ms('open_in_new', { size: 14 })}</a>` : ''}
      </div>

    </article>`;
  },

  postCard(post, author) {
    return this.insightCard(post, author);
  },

  sectionLoader(target) {
    if (!target) return '';
    return `
    <div class="section-transition-loader" style="padding:100px 40px; text-align:center; animation: fadeIn 0.5s ease-out">
      ${this.intelligenceLoader('Loading...', 'Please wait')}
    </div>`;
  },

  eventCard(event, company) {
    if (!company) return '';
    const d = new Date(event.date);
    return `<div class="event-card stagger-item"><div class="event-banner"><div class="event-date-badge"><div class="event-date-day">${d.getDate()}</div><div class="event-date-month">${d.toLocaleString('en', { month: 'short' }).toUpperCase()}</div></div></div>
      <div class="event-content"><div class="event-company">${this.avatar(company, 'avatar-sm')}<span class="event-company-name">${company.displayName}</span>${company.verified ? ' ' + Icons.verified() : ''}</div>
      <h3 class="event-title">${event.title}</h3><p class="event-desc">${event.description}</p>
      <div class="event-meta"><div class="event-meta-item">${Icons.calendar()} ${Utils.formatDate(event.date)}</div><div class="event-meta-item">${Icons.location()} ${event.location}</div></div>
      <div class="event-actions"><button class="btn btn-primary btn-sm" onclick="App.attendEvent('${event.id}')">Register</button></div></div></div>`;
  },

  feedToggle(activeMode = 'latest') {
    const modes = [
      { id: 'latest', label: 'Latest', icon: 'schedule' },
      { id: 'trending', label: 'Trending', icon: 'trending_up' }
    ];

    return `
    <div style="display:flex; flex-direction:column; gap:var(--space-4); margin-bottom:var(--space-8)">
        <div style="display:flex; gap:16px; padding:0 8px">
            ${modes.map(m => `
                <button onclick="App.setFeedMode('${m.id}')" 
                    style="font-size:11px; font-weight:800; color:${activeMode === m.id ? 'var(--text-primary)' : 'var(--text-tertiary)'}; background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:4px; opacity:${activeMode === m.id ? '1' : '0.6'}">
                    ${Icons.ms(m.icon, { size: 14 })} ${m.label.toUpperCase()}
                    ${activeMode === m.id ? '<div style="width:4px; height:4px; background:var(--accent); border-radius:50%; margin-left:4px"></div>' : ''}
                </button>
            `).join('')}
        </div>
    </div>`;
  },

  aiAlertBar() {
    return `
    <div class="ai-alert-bar animate-fadeInDown" style="margin-bottom:var(--space-6);padding:12px 20px;background:rgba(239, 68, 68, 0.1);border:1px solid rgba(239, 68, 68, 0.2);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:12px;color:#ef4444">
        ${Icons.ms('report', { size: 20, fill: true })}
        <div style="font-size:13px;font-weight:600">
          <span style="font-weight:800;text-transform:uppercase;margin-right:8px">AI Alert:</span>
          Kubernetes CVE vulnerability detected in cluster nodes – <a href="#" style="color:inherit;text-decoration:underline">See details</a>
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:18px">×</button>
    </div>`;
  },

  trendingSidebar(trending, suggested, news = []) {
    const user = AuthService.getUser();
    const insights = AIEngine.getUserInsights(user, []);

    const newsHtml = (news || []).slice(0, 3).map((item, idx) => `
      <div style="margin-bottom:${idx === 2 ? '0' : 'var(--space-4)'}; cursor:pointer" onclick="window.open('${item.link}', '_blank')">
        <div style="font-weight:700;font-size:13px;color:var(--text-primary);margin-bottom:4px;line-height:1.4">${item.title}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:10px;color:var(--text-tertiary)">${Utils.timeAgo(item.pubDate)} · ${item.source}</span>
          ${idx === 0 ? '<span style="font-size:10px;font-weight:800;color:var(--warning)">HOT 🔥</span>' : ''}
        </div>
      </div>
    `).join('<div style="border-top:1px solid var(--border-secondary);margin:var(--space-3) 0"></div>');

    const trendHtml = (trending || []).slice(0, 4).map(i => {
      const momentum = AIEngine.getTrendMomentum(i.tag);
      return `
      <div class="trending-item" style="padding:var(--space-3) var(--space-4);cursor:pointer;transition:all 0.2s" onclick="App.searchHashtag('${i.tag}')" onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background='transparent'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:2px">Trending in Tech</div>
            <div style="font-weight:700;color:var(--text-primary);font-size:14px">${i.tag}</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">${Utils.formatNumber(i.count)} posts · ${momentum.velocity}hr</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;font-weight:800;color:${momentum.isUp ? 'var(--success)' : 'var(--error)'};display:flex;align-items:center;justify-content:flex-end;gap:2px">
              ${momentum.isUp ? '▲' : '▼'} ${momentum.momentum}
            </div>
            <svg width="40" height="20" style="margin-top:4px">
              <polyline points="${momentum.sparkline}" fill="none" stroke="${momentum.isUp ? 'var(--success)' : 'var(--error)'}" stroke-width="1.5" />
            </svg>
          </div>
        </div>
      </div>
  `}).join('');

    const sugHtml = (suggested || []).slice(0, 3).map(u => `
  <div class="suggested-user" style="padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:12px">
    ${this.avatar(u, 'avatar-sm')}
        <div class="suggested-user-info" onclick="App.viewProfile('${u.uid}')" style="cursor:pointer;flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.displayName}</div>
          <div style="color:var(--text-tertiary);font-size:11px">@${u.username}</div>
        </div>
        <button class="btn btn-secondary btn-sm" style="padding:4px 12px;font-size:11px" onclick="App.toggleFollow('${u.uid}',this)">Follow</button>
      </div>
  `).join('');

    return `
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
      <!-- AI Live Intelligence Panel -->
      <div class="post-card" style="padding:0;overflow:hidden;border:1px solid var(--accent-subtle);background:linear-gradient(180deg, rgba(var(--accent-rgb), 0.05) 0%, transparent 100%)">
        <div style="padding:var(--space-4);background:rgba(var(--accent-rgb), 0.1);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-secondary)">
          <div style="font-weight:800;font-size:11px;letter-spacing:1px;color:var(--accent);text-transform:uppercase;display:flex;align-items:center;gap:6px">
            <span class="online-dot" style="margin:0;background:var(--error);width:6px;height:6px"></span> LATEST NEWS
          </div>
          <span style="font-size:10px;color:var(--text-tertiary)">LIVE FEED</span>
        </div>
        <div style="padding:var(--space-4)">
          ${newsHtml || `
            <div style="text-align:center;padding:var(--space-4);color:var(--text-tertiary);font-size:12px">
              Loading latest news...
            </div>
          `}
        </div>
        <div style="padding:var(--space-3);background:var(--bg-input);text-align:center;border-top:1px solid var(--border-secondary);cursor:pointer" onclick="App.navigateTo('news')">
            <span style="font-size:10px;font-weight:800;color:var(--accent);text-decoration:none;text-transform:uppercase;letter-spacing:0.5px">View all news →</span>
        </div>
      </div>

      <!-- Founder Ecosystem Pulse -->
      <div class="post-card" style="padding:var(--space-4);background:linear-gradient(180deg, rgba(var(--accent-rgb), 0.05) 0%, transparent 100%);border:1px solid var(--accent-subtle)">
        <div style="font-weight:900;font-size:10px;letter-spacing:1.5px;color:var(--accent);text-transform:uppercase;margin-bottom:var(--space-4);display:flex;align-items:center;justify-content:space-between">
          <span>ECOSYSTEM PULSE</span>
          <span style="display:flex;align-items:center;gap:4px">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--success);animation:pulse 2s infinite"></span>
            LIVE
          </span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
          <div style="background:var(--bg-input);padding:10px;border-radius:var(--radius-md);border:1px solid var(--border-secondary)">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px">Live Signals</div>
            <div style="font-size:var(--fs-md);font-weight:800;color:var(--text-primary)">${(() => { const engine = window.RealtimeDataEngine; if (!engine) return '—'; const total = engine.sectorData.reduce((sum, s) => { const sig = engine.getSectorSignals(s.sector); return sum + (sig.news || 0) + (sig.github || 0) + (sig.hn || 0); }, 0); return total > 0 ? total + ' signals' : 'Scanning...'; })()}</div>
          </div>
          <div style="background:var(--bg-input);padding:10px;border-radius:var(--radius-md);border:1px solid var(--border-secondary)">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px">Top Sector</div>
            <div style="font-size:var(--fs-md);font-weight:800;color:var(--success)">${(() => { const engine = window.RealtimeDataEngine; if (!engine || !engine.sectorData.length) return '—'; const top = engine.sectorData[0]; return top.sector + ' ' + top.score; })()}</div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--text-secondary);line-height:1.5">
          ${(() => { const engine = window.RealtimeDataEngine; if (!engine || !engine.sectorData.length) return 'Scanning global signals...'; const top2 = engine.sectorData.slice(0, 2); const ghCount = engine._githubTrending?.length || 0; const hnCount = engine._hnTopStories?.length || 0; return `High signal density in <strong style="color:var(--text-primary)">${top2[0]?.sector || 'Tech'}</strong> and <strong style="color:var(--text-primary)">${top2[1]?.sector || 'DevTools'}</strong>. ${ghCount} GitHub repos trending, ${hnCount} HN stories tracked.`; })()}
        </div>
      </div>

      <!-- AI Trend Radar -->
      <div class="post-card" style="padding:0;overflow:hidden">
        <div style="padding:var(--space-4) var(--space-4) var(--space-2);font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--text-tertiary);border-bottom:1px solid var(--border-secondary);display:flex;align-items:center;gap:8px">
          ${Icons.ms('radar', { size: 16 })} TRENDING TOPICS
        </div>
        <div style="display:flex;flex-direction:column">
          ${trendHtml}
        </div>
        <div style="padding:var(--space-4);border-top:1px solid var(--border-secondary);text-align:center">
          <a href="#" style="font-size:12px;color:var(--accent);font-weight:700;text-decoration:none">Launch Analysis Dashboard →</a>
        </div>
      </div>

      <!-- AI Personalized Insights -->
  ${insights ? `
      <div class="post-card" style="padding:var(--space-4);background:var(--bg-elevated)">
        <div style="font-weight:800;font-size:11px;letter-spacing:1px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
          ${Icons.ms('analytics', { size: 16 })} YOUR ACTIVITY
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span style="color:var(--accent)">${Icons.ms('target', { size: 18 })}</span>
            <div style="font-size:12px;color:var(--text-secondary)">You engaged mostly with <strong style="color:var(--text-primary)">${insights.primaryFocus}</strong> posts today.</div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span style="color:var(--success)">${Icons.ms('group', { size: 18 })}</span>
            <div style="font-size:12px;color:var(--text-secondary)">${insights.networkDiscussion}</div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span style="color:var(--error)">${Icons.ms('trending_down', { size: 18 })}</span>
            <div style="font-size:12px;color:var(--text-secondary)">${insights.momentumShift}</div>
          </div>
        </div>
      </div>
      ` : ''
      }

      <!-- AI Recommended Courses -->
      <div class="post-card" style="padding:var(--space-4)">
        <div style="font-weight:800;font-size:11px;letter-spacing:1px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
          ${Icons.ms('school', { size: 16 })} RECOMMENDED COURSES
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:12px;align-items:center;cursor:pointer" onclick="App.navigateTo('courses')">
            <div style="width:40px;height:40px;background:var(--bg-input);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px">🧠</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700">Advanced MLOps</div>
              <div style="font-size:11px;color:var(--text-tertiary)">Coursera · 94% Match</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;cursor:pointer" onclick="App.navigateTo('courses')">
            <div style="width:40px;height:40px;background:var(--bg-input);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px">🛡️</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700">Zero Trust Security</div>
              <div style="font-size:11px;color:var(--text-tertiary)">edX · 88% Match</div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Smart Jobs Panel -->
      <div class="post-card" style="padding:var(--space-4);border:1px solid rgba(16, 185, 129, 0.2)">
        <div style="font-weight:800;font-size:11px;letter-spacing:1px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
          ${Icons.ms('work', { size: 16 })} MATCHING JOBS
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="background:var(--bg-input);padding:10px;border-radius:var(--radius-md);cursor:pointer" onclick="App.navigateTo('jobs')">
            <div style="font-size:13px;font-weight:700">Backend Engineer</div>
            <div style="display:flex;justify-content:space-between;margin-top:4px">
              <span style="font-size:11px;color:var(--text-tertiary)">Remote · Google</span>
              <span style="font-size:11px;font-weight:800;color:var(--success)">92% Match</span>
            </div>
          </div>
          <div style="background:var(--bg-input);padding:10px;border-radius:var(--radius-md);cursor:pointer" onclick="App.navigateTo('jobs')">
            <div style="font-size:13px;font-weight:700">AI Research Intern</div>
            <div style="display:flex;justify-content:space-between;margin-top:4px">
              <span style="font-size:11px;color:var(--text-tertiary)">New York · OpenAI</span>
              <span style="font-size:11px;font-weight:800;color:var(--success)">87% Match</span>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px;font-size:11px" onclick="App.navigateTo('jobs')">View Career Portal →</button>
      </div>

      <!-- Footer -->
  <footer style="padding:0 var(--space-2);display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--text-tertiary)">
    <a href="#about" style="color:inherit;text-decoration:none">About</a>
    <a href="#legal" style="color:inherit;text-decoration:none">Legal</a>
    <a href="#privacy" style="color:inherit;text-decoration:none">Privacy</a>
    <a href="#cookies" style="color:inherit;text-decoration:none">Cookies</a>
    <span>TechOL © 2026</span>
  </footer>
    </div>`;
  },
  chatConvoItem(convo, currentUid, otherUser) {
    return `
    <div class="chat-convo-item" onclick="App.openChat('${convo.id}')" data-convo-id="${convo.id}">
      ${this.avatar(otherUser, 'avatar-sm')}
      <div class="chat-convo-info">
        <div class="chat-convo-name">${otherUser.displayName}</div>
        <div class="chat-convo-last">${convo.lastMessage || '...'}</div>
      </div>
    </div>`;
  },

  chatMessage(msg, currentUid) {
    const sent = msg.senderId === currentUid;
    return `
    <div class="chat-msg ${sent ? 'sent' : 'received'}">
      <div class="chat-msg-bubble">${Utils.escapeHtml(msg.text)}</div>
    </div>`;
  },

  profileHeader2(u, metrics, isOwn) {
    return `
    <div class="builder-identity-header animate-fadeIn">
      <div class="profile-banner-advanced" style="height:180px;background:linear-gradient(135deg, rgba(var(--accent-rgb),0.4) 0%, rgba(var(--accent-rgb),0.1) 100%);">
        <div class="glow-container"></div>
      </div>
      <div class="profile-content-wrap">
        <div class="profile-main-strip">
          <div class="profile-avatar-stack">
            <div class="avatar-glow"></div>
            ${this.avatar(u, 'avatar-2xl')}
            <div class="status-indicator-floating ${u.active ? 'active' : ''}"></div>
          </div>
          <div class="profile-actions-strip">
            ${isOwn ? `
              <button class="btn btn-secondary btn-icon" onclick="App.navigateTo('settings')">${Icons.ms('edit')}</button>
              <button class="btn btn-primary" onclick="App.navigateTo('settings')">Configure OS</button>
            ` : `
              <button class="btn btn-secondary btn-icon" onclick="App.startChatWith('${u.uid}')">${Icons.chat()}</button>
              <button class="btn btn-primary" onclick="App.toggleFollow('${u.uid}', this)">Follow Builder</button>
            `}
          </div>
        </div>
        <div class="builder-meta-grid">
          <div class="builder-primary-info">
            <div style="display:flex; align-items:center; gap:12px">
              <h1 class="profile-name-2xl">${u.displayName}</h1>
              ${u.verified ? Icons.verified() : ''}
              <div class="builder-trust-badge">${Icons.ms('verified_user', { size: 14 })} TRUSTED</div>
            </div>
            <div class="profile-username-tag">@${u.username} • <span class="highlight-accent">${u.jobTitle || 'Builder'}</span> ${u.company ? `@ ${u.company}` : ''}</div>
            <div class="builder-ai-summary">
              <p>${u.aiSummary || 'Platform engineer focused on scalable infrastructure.'}</p>
            </div>
            <div class="builder-exploring-tags">
              ${(metrics && metrics.exploring || []).map(t => `<span class="explorer-tag">${t}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="builder-metrics-row">
          <div class="builder-stat-item">
            <div class="stat-value">${Utils.formatNumber(metrics?.impact?.devsReached || 0)}</div>
            <div class="stat-label">Devs Reached</div>
          </div>
          <div class="stat-divider"></div>
          <div class="builder-stat-item">
            <div class="stat-value">${metrics?.impact?.solutionsHelpful || 0}</div>
            <div class="stat-label">Solutions Helpful</div>
          </div>
          <div class="stat-divider"></div>
          <div class="builder-stat-item">
            <div class="stat-value">${metrics?.impact?.postsTrending || 0}</div>
            <div class="stat-label">Trending Posts</div>
          </div>
          <div class="stat-divider"></div>
          <div class="builder-stat-item">
            <div class="stat-value">${metrics?.impact?.answersAdopted || 0}</div>
            <div class="stat-label">Answers Adopted</div>
          </div>
        </div>
      </div>
    </div>`;
  },

  contributionHeatmap(metrics) {
    const days = metrics?.contributions?.heatmap || new Array(28).fill(0);
    return `
    <div class="builder-panel">
      <h3 class="panel-header">Weekly Contribution Heatmap</h3>
      <div class="heatmap-grid">
        ${days.map(level => `<div class="heatmap-cell level-${level}"></div>`).join('')}
      </div>
      <div class="heatmap-footer">
        <span>Less</span>
        <div class="heatmap-legend">
          <div class="heatmap-cell level-0"></div>
          <div class="heatmap-cell level-1"></div>
          <div class="heatmap-cell level-2"></div>
          <div class="heatmap-cell level-3"></div>
          <div class="heatmap-cell level-4"></div>
        </div>
        <span>More</span>
      </div>
    </div>`;
  },

  builderTimeline(timeline) {
    if (!timeline) return '<div class="builder-panel"><p>No journey data available.</p></div>';
    return `
    <div class="builder-panel">
      <h3 class="panel-header">Builder Journey</h3>
      <div class="timeline-vertical">
        ${timeline.map(item => `
          <div class="timeline-item">
            <div class="timeline-icon">${Icons.ms(item.icon, { size: 16 })}</div>
            <div class="timeline-content">
              <div class="timeline-date">${item.date}</div>
              <div class="timeline-label">${item.label}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  },

  founderCard(founder) {
    if (!founder.active) return '';
    return `
    <div class="builder-panel founder-mode-panel">
      <div class="founder-badge">FOUNDER MODE</div>
      <h3 class="startup-name">${founder.startup}</h3>
      <div class="startup-meta">Stage: <span class="highlight">${founder.stage}</span></div>
      <div class="startup-seeking">
        <div class="seeking-label">Looking for:</div>
        <div class="seeking-value">${founder.seeking}</div>
      </div>
      <button class="btn btn-primary btn-sm" style="width:100%;margin-top:16px">View Pitch Deck</button>
    </div>`;
  },

  collabSignals(signals) {
    return `
    <div class="builder-panel">
      <h3 class="panel-header">Collaboration Signals</h3>
      <div class="signal-list">
        <div class="signal-item ${signals.mentorship ? 'active' : ''}">
          <span>${Icons.ms('school', { size: 16 })}</span> Open to Mentorship
        </div>
        <div class="signal-item ${signals.cofounder ? 'active' : ''}">
          <span>${Icons.ms('group_add', { size: 16 })}</span> Looking for Co-founder
        </div>
        <div class="signal-item ${signals.consulting ? 'active' : ''}">
          <span>${Icons.ms('work', { size: 16 })}</span> Available for Consulting
        </div>
      </div>
    </div>`;
  },

  githubCard(github) {
    return `
    <div class="builder-panel">
      <h3 class="panel-header">Open Source Core</h3>
      <div class="github-repos-list">
        ${github.repos.map(r => `
          <div class="github-repo-item">
            <div class="repo-header">
              <span class="repo-name">${r.name}</span>
              <span class="repo-stars">${Icons.ms('star', { size: 12 })} ${r.stars}</span>
            </div>
            <div class="repo-footer">
              <span class="repo-stack">${r.stack}</span>
              <span class="repo-velocity v-${r.velocity.toLowerCase()}">${r.velocity} Velocity</span>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px">View GitHub Profile →</button>
    </div>`;
  },

  groupCard(g) {
    return `
    <div class="group-card animate-fadeInScale" onclick="App.renderGroupFeed('${g.id}')">
      <div class="group-header">
        <div class="group-icon-wrapper">${g.image}</div>
        <div class="group-member-badge">
          ${Icons.ms('groups', { size: 14 })}
          <span>${Utils.formatNumber(g.members)}</span>
        </div>
      </div>
      <div class="group-content">
        <h3 class="group-name">${g.name}</h3>
        <p class="group-desc">${g.description}</p>
        <div class="group-footer">
          <div class="group-status">
            <span class="status-dot"></span>
            Active now
          </div>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();App.joinGroup('${g.id}','${g.name}',this)">Join</button>
        </div>
      </div>
    </div>`;
  },

  courseCard(course) {
    return `
    <div class="course-card animate-fadeInScale" onclick="window.open('${course.link}','_blank')">
      <div class="course-header">
        <span class="course-level-badge">${course.level}</span>
        <div class="course-badges">
          ${course.free ? '<span class="course-badge free">FREE</span>' : '<span class="course-badge paid">PAID</span>'}
          <span class="platform-name">${course.platform}</span>
        </div>
      </div>
      <div class="course-body">
        <h3 class="course-title" title="${course.title}">${course.title}</h3>
        <p class="course-description">${course.description}</p>
      </div>
      <div class="course-footer">
        <div class="course-meta">
          <div class="meta-item">
            ${Icons.ms('schedule', { size: 14 })}
            <span>${course.duration}</span>
          </div>
          <div class="meta-item">
            ${Icons.ms('business', { size: 14 })}
            <span>${course.provider}</span>
          </div>
        </div>
        <div class="enroll-action">
          <span>Enroll</span>
          ${Icons.ms('arrow_forward', { size: 16 })}
        </div>
      </div>
    </div>`;
  },

  globalPulse() {
    return `
    <div class="global-pulse-banner animate-fadeIn" style="background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-xl);padding:var(--space-5);margin-bottom:var(--space-6);display:flex;align-items:center;justify-content:space-between;gap:var(--space-6);overflow:hidden;position:relative">
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle at 10% 20%, rgba(var(--accent-rgb), 0.05) 0%, transparent 50%);pointer-events:none"></div>
      <div style="flex:1;position:relative;z-index:1">
        <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:var(--accent);margin-bottom:8px;display:flex;align-items:center;gap:8px">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--success);animation:pulse 2s infinite"></span>
          GLOBAL SIGNAL: ACTIVE BUILDER HUBS
        </div>
        <div style="font-size:var(--fs-lg);font-weight:800;line-height:1.4">
          Increasing collaboration on <span style="color:var(--success)">Open Source Projects</span> detected in major tech centers. High activity in <span class="text-gradient">Distributed Systems</span>.
        </div>
      </div>
      <div style="width:120px;text-align:right;position:relative;z-index:1">
        <div style="font-size:24px;font-weight:900;color:var(--text-primary)">+42% <span style="font-size:12px;color:var(--text-tertiary);font-weight:400">YOY</span></div>
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);margin-top:4px;text-transform:uppercase">Builder Velocity</div>
      </div>
    </div>`;
  }
};

window.Components = Components;
export default Components;

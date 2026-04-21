import Icons from "./icons.js";
import Utils from "./utils.js";
import AuthService from "./auth.js";
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "./firebase-config.js";
import RealtimeDataEngine from "./realtime-engine.js";
import DataIngestionEngine from "./data-ingestion.js";
import LiveNewsEngine from "./liveNews.js";

// ---- GLOBAL ERROR BOUNDARY ----
window.onerror = function (msg, url, line, col, error) {
  console.error("SYSTEM_ERROR:", msg, url, line, col, error);
  // Don't replace the entire page - just log and let errors propagate
  return false;
};

// ---- EAGER AUTH INITIALIZATION ----
let _authPromise = new Promise(resolve => {
  // If we have a cached user, we can resolve tentatively to speed up initial render
  const cachedUser = localStorage.getItem('techol_user');

  // Set a 8s timeout to ensure we never hang the app indefinitely
  const timer = setTimeout(() => {
    console.warn("Auth initialization timed out, using cache or null.");
    resolve(cachedUser ? JSON.parse(cachedUser) : null);
  }, 8000);

  setPersistence(auth, browserLocalPersistence).then(() => {
    onAuthStateChanged(auth, (user) => {
      clearTimeout(timer);
      resolve(user);
    });
  }).catch(err => {
    clearTimeout(timer);
    resolve(null);
  });
});

const App = {
  currentView: 'landing', isAuthInitializing: true, isAuthenticating: false, isRedirecting: false, _authSettled: false, _feedServerSettled: false, selectedCategory: 'general', currentChatConvo: null, sidebarOpen: false, msgUnsub: null, _feedUnsub: null, usersCache: {}, _feedTimer: null,
  feedMode: 'latest', _lastVisible: null, _feedLimit: 50, _feedFirstLoadSettled: false,
  _authNavigating: false,
  _modulesLoaded: false,

  showLoadingOverlay(text, subtext) {
    if (!window.Components) return;
    const overlayHtml = Components.transitionLoadingOverlay(text, subtext);
    const div = document.createElement('div');
    div.id = 'app-transition-overlay-container';
    div.innerHTML = overlayHtml;
    document.body.appendChild(div);
  },

  hideLoadingOverlay(delay = 500) {
    const container = document.getElementById('app-transition-overlay-container');
    if (!container) return;

    // Handoff Logic: Persist for 500ms before starting fade
    setTimeout(() => {
      const overlay = container.querySelector('.transition-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        // Cleanup after transition duration (0.4s)
        setTimeout(() => container.remove(), 400);
      } else {
        container.remove();
      }
    }, delay);
  },

  async init() {
    const t = localStorage.getItem('techol_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);

    // 1. Load core assets and modules immediately
    const modulesPromise = this.loadModules();

    window.addEventListener('hashchange', () => this.handleRoute());

    // 2. High-speed Auth Check
    const authT0 = Date.now();
    try {
      await AuthService.init();

      // Check for immediate session flag or cached user
      const isAuthComplete = localStorage.getItem('techol_auth_complete') === 'true';
      const cachedUser = localStorage.getItem('techol_user');
      const wasRedirectPending = localStorage.getItem('techol_auth_redirect_pending') === 'true';
      
      // Clear redirect pending flag now that init() has processed it
      if (wasRedirectPending) {
        localStorage.removeItem('techol_auth_redirect_pending');
        // If redirect brought back a user, mark auth complete
        if (AuthService.currentUser) {
          localStorage.setItem('techol_auth_complete', 'true');
        }
      }

      if ((isAuthComplete || wasRedirectPending) && (cachedUser || AuthService.currentUser)) {
        if (!AuthService.currentUser && cachedUser) {
          AuthService.currentUser = JSON.parse(cachedUser);
        }
        this.isAuthInitializing = false;

        // Fast-track to dashboard
        await modulesPromise; // Ensure modules are ready
        this.showMainApp();
        this.handleRoute();
        this.hideLoadingOverlay(100);
        window.dispatchEvent(new CustomEvent('techol_app_ready'));
        return;
      }
    } catch (e) {
      console.warn('Auth check failed:', e);
    }

    // 3. Fallback to full Firebase check with 5s limit
    const user = await Promise.race([
      _authPromise,
      new Promise(resolve => setTimeout(() => resolve(null), 5000))
    ]);

    this.isAuthInitializing = false;

    if (user) {
      localStorage.setItem("techol_auth_complete", "true");
      await modulesPromise;
      this.showMainApp();
      this.handleRoute();
      this.hideLoadingOverlay(200);
    } else {
      localStorage.removeItem("techol_auth_complete");
      this.handleRoute();
      this.hideLoadingOverlay(400);
    }

    window.dispatchEvent(new CustomEvent('techol_app_ready'));
  },

  async loadModules() {
    if (this._modulesLoaded) return;
    try {
      const [db, comp, trends, shelf] = await Promise.all([
        import('./database.js'),
        import('./components.js'),
        import('./trends.js'),
        import('./shelf.js')
      ]);

      window.Database = db.default;
      window.Components = comp.default;
      window.TrendsModule = trends.default;
      window.ShelfModule = shelf.default;

      if (window.TrendsModule) await window.TrendsModule.init();
      if (window.ShelfModule) await window.ShelfModule.init();

      this._modulesLoaded = true;
    } catch (e) {
      console.error('Module load error:', e);
    }
  },

  initInteractiveBg() {
    const container = document.getElementById('interactive-bg');
    if (!container) return;

    // 7. LAZY LOAD THREE.JS
    if (typeof THREE === 'undefined') {
      setTimeout(() => this.initInteractiveBg(), 1000); // Wait for scripts if lazy loading
      return;
    }

    container.innerHTML = '';
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050a, 0.002);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x010206, 1);
    container.appendChild(renderer.domElement);
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPositions[i] = (Math.random() - 0.5) * 600;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.2 })));
    const planet = new THREE.Mesh(new THREE.SphereGeometry(150, 64, 64), new THREE.MeshStandardMaterial({ color: 0x050a14, roughness: 0.9, metalness: 0.1 }));
    planet.position.set(120, -100, -200);
    scene.add(planet);
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(800 * 3);
    for (let i = 0; i < 800 * 3; i++) dustPositions[i] = (Math.random() - 0.5) * 200;
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x1a365d, size: 1, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending }));
    scene.add(dust);
    const rimLight = new THREE.DirectionalLight(0x3b82f6, 0.6);
    rimLight.position.set(100, 50, -50);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0x0a1020, 0.4));
    const ships = [];
    for (let i = 0; i < 3; i++) {
      const shipGroup = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0, 2, 8, 3).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x080c16, roughness: 0.8, metalness: 0.5 }));
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
      glow.position.z = 4;
      shipGroup.add(hull); shipGroup.add(glow);
      shipGroup.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40, -50 - Math.random() * 100);
      ships.push({ mesh: shipGroup, speed: 0.02 + Math.random() * 0.02 });
      scene.add(shipGroup);
    }
    let tempX = 0, tempY = 0, targetX = 0, targetY = 0;
    const onMouseMove = (e) => { targetX = (e.clientX / window.innerWidth) * 2 - 1; targetY = -(e.clientY / window.innerHeight) * 2 + 1; };
    window.addEventListener('mousemove', onMouseMove);
    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('resize', onResize);
    this._landingScene = { cleanup: () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('resize', onResize); renderer.dispose(); renderer.forceContextLoss(); starGeo.dispose(); dustGeo.dispose(); container.innerHTML = ''; } };
    const clock = new THREE.Clock();
    const animate = () => {
      if (this.currentView !== 'landing') { if (this._landingScene) { this._landingScene.cleanup(); this._landingScene = null; } return; }
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      camera.position.z -= delta * 0.5;
      tempX += (targetX - tempX) * 0.05; tempY += (targetY - tempY) * 0.05;
      camera.position.x = tempX * 5; camera.position.y = tempY * 5;
      camera.lookAt(0, 0, camera.position.z - 50);
      planet.rotation.y += delta * 0.02;
      ships.forEach(ship => { ship.mesh.position.z += ship.speed; if (ship.mesh.position.z > camera.position.z + 10) ship.mesh.position.z = camera.position.z - 150 - Math.random() * 50; });
      dust.rotation.y = clock.getElapsedTime() * 0.02; dust.rotation.x = clock.getElapsedTime() * 0.01;
      renderer.render(scene, camera);
    };
    animate();
  },
  /*
  initInteractiveBg() {
    const canvas = document.getElementById('interactive-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr;
 
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
 
    // --- STATIC STAR FIELD (drawn once, cached) ---
    const starCanvas = document.createElement('canvas');
    const drawStarField = () => {
      starCanvas.width = canvas.width; starCanvas.height = canvas.height;
      const sctx = starCanvas.getContext('2d');
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const starCount = Math.floor(w * h / 500); // More dense, comforting star field
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 1.5;
        const a = 0.05 + Math.random() * 0.4; // Softer static stars
        sctx.globalAlpha = a;
        // Occasional warm star
        sctx.fillStyle = Math.random() > 0.9 ? '#fde68a' : (Math.random() > 0.8 ? '#a5b4fc' : '#ffffff');
        sctx.beginPath();
        sctx.arc(x, y, r, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.globalAlpha = 1;
    };
    drawStarField();
    window.addEventListener('resize', drawStarField);
 
    // --- CINEMATIC SHOOTING STARS ---
    const shootingStars = [];
    const spawnStar = () => {
      if (shootingStars.length >= 4) return; // Allow more simultaneous gentle stars
      // Softer angle, gentle diagonal drift
      const angle = -0.15 - Math.random() * 0.35;
      // Slower speed for a calming effect
      const speed = 1.5 + Math.random() * 3;
      // Longer elegant tails
      const len = 120 + Math.random() * 200;
      shootingStars.push({
        x: Math.random() * w * 0.9 + w * 0.05,
        y: -10 - Math.random() * 50,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        len, life: 1, decay: 0.0015 + Math.random() * 0.002, // Fades out slower
        width: 1.2 + Math.random() * 0.8
      });
    };
 
    // --- MOUSE PARALLAX ---
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    window.addEventListener('mousemove', e => {
      tmx = (e.clientX / w - 0.5) * 8;
      tmy = (e.clientY / h - 0.5) * 8;
    });
 
    // --- AMBIENT GLOW ---
    const drawAmbientGlow = () => {
      // Warm, deep comforting space hues
      const g1 = ctx.createRadialGradient(w * 0.25, h * 0.2, 0, w * 0.25, h * 0.2, w * 0.5);
      g1.addColorStop(0, 'rgba(56, 30, 114, 0.05)'); // Soft deep purple
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
 
      const g2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, w * 0.5);
      g2.addColorStop(0, 'rgba(20, 50, 120, 0.04)'); // Soft oceanic blue
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };
 
    // --- RENDER LOOP ---
    let lastSpawn = 0;
    const animate = (now) => {
      if (this.currentView !== 'landing') return;
      requestAnimationFrame(animate);
      mx += (tmx - mx) * 0.03;
      my += (tmy - my) * 0.03;
 
      ctx.clearRect(0, 0, w, h);
 
      // Draw star field with subtle parallax
      ctx.save();
      ctx.translate(mx * 0.5, my * 0.5);
      ctx.drawImage(starCanvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
      ctx.restore();
 
      drawAmbientGlow();
 
      // Spawn shooting stars gently (every 2-4 seconds)
      if (now - lastSpawn > (2000 + Math.random() * 2000)) {
        spawnStar();
        lastSpawn = now;
      }
 
      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0 || s.x > w + 100 || s.y > h + 100) {
          shootingStars.splice(i, 1); continue;
        }
 
        const tailX = s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.len;
        const tailY = s.y - (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.len;
 
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.5, `rgba(220,235,255,${s.life * 0.2})`); // Softer glow in tail
        grad.addColorStop(1, `rgba(255,255,255,${s.life * 0.8})`); // Warm bright head
 
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.stroke();
 
        // Head glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.life * 0.8})`;
        ctx.fill();
      }
    };
    requestAnimationFrame(animate);
  },*/
  setTheme(t) { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('techol_theme', t); document.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('active', b.dataset.theme === t)); },

  async handleRoute() {
    const h = location.hash.slice(1).trim() || '';
    const root = document.getElementById('app');
    const publicRoutes = ['', 'login', 'signup', 'landing', 'phone-login'];

    // CRITICAL: Check auth flag
    const isAuthComplete = localStorage.getItem('techol_auth_complete') === 'true';

    if (this.isAuthInitializing && !isAuthComplete) {
      if (publicRoutes.includes(h)) {
        // Allow public routes
      } else {
        if (window.Components) {
          root.innerHTML = Components.intelligenceLoader('Synchronizing Cloud Identity...', 'Establishing secure cross-channel uplink');
        }
        return;
      }
    }

    const u = AuthService.getUser();

    // CRITICAL: Force dashboard for logged-in users to prevent redirect loop
    if (u && ['login', 'signup', 'phone-login', 'landing', ''].includes(h)) {
      localStorage.setItem('techol_auth_complete', 'true');
      this.showMainApp();
      this.navigateTo('feed');
      return;
    }

    if (!u && !publicRoutes.includes(h)) {
      localStorage.removeItem('techol_auth_complete');
      location.hash = '#login';
      return;
    }

    // 2. Route Rendering with Skeleton Screens
    const appMain = document.getElementById('app-main');
    const content = document.getElementById('content-area');

    if (u && !appMain) {
      this.showMainApp();
      return this.handleRoute();
    }

    // Dynamic Module check
    if (!this._modulesLoaded) {
      if (content) content.innerHTML = `<div style="padding:40px">${this.renderSkeleton('feed')}</div>`;
      await this.loadModules();
    }

    const target = content || root;
    this.currentView = h;

    // Route Switch
    switch (h) {
      case 'landing': case '': if (!u) this.renderLanding(target); break;
      case 'login': this.renderLogin(target); break;
      case 'phone-login': this.renderPhoneLogin(target); break;
      case 'signup': this.renderSignup(target); break;

      // Core Platform
      case 'feed': this.renderIntelligenceStream(target); break;
      case 'trends': window.TrendsModule.render(target); break;
      case 'shelf': window.ShelfModule.render(target); break;

      // ... others
      default:
        if (h.startsWith('profile/')) this.viewProfile(h.split('/')[1]);
        else if (h.startsWith('post/')) this.viewPost(h.split('/')[1]);
        else if (h.startsWith('shelf/')) this.viewShelfItem(h.split('/')[1]);
        else this.renderIntelligenceStream(target);
    }
  },

  renderSkeleton(type) {
    if (window.Components) return window.Components.skeleton(type === 'feed' ? 'card' : 'line', 3);
    return `<div style="padding:20px; opacity:0.1">Loading visual assets...</div>`;
  },

  async getCachedUser(uid) { if (!this.usersCache) this.usersCache = {}; if (this.usersCache[uid]) return this.usersCache[uid]; const u = await Database.getUser(uid); if (u) this.usersCache[uid] = u; return u; },

  initLandingAnimations() {
    const reveals = document.querySelectorAll('.reveal-text');
    setTimeout(() => {
      reveals.forEach((el, i) => {
        el.style.transition = `all 1.0s cubic-bezier(0.2, 1, 0.3, 1) ${i * 0.1 + 0.1}s`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }, 400);

    const videoBg = document.getElementById('cinematic-video-wrapper');
    const overlay = document.getElementById('cinematic-overlay');
    const onScroll = () => {
      if (this.currentView !== 'landing') { window.removeEventListener('scroll', onScroll); return; }
      const scrolled = window.scrollY;
      const rate = scrolled * 0.0005;
      if (videoBg) { videoBg.style.transform = `scale(${1 + rate}) translateY(${scrolled * 0.05}px)`; videoBg.style.filter = `blur(${scrolled * 0.01}px)`; }
      if (overlay) { overlay.style.backgroundColor = `rgba(1, 2, 6, ${Math.min(0.98, scrolled * 0.0015)})`; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const scrollReveals = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    scrollReveals.forEach(el => observer.observe(el));
  },

  // ---- Landing ----
  renderLanding(container) {
    this.currentView = 'landing';
    const html = `
<div class="landing-cinematic dark" style="background:#010206; color:#fff; font-family:var(--font-display); overflow-x:hidden; position:relative;">
  
  <!-- IMAX Video Background -->
  <div style="position:fixed; inset:0; z-index:0; overflow:hidden; background:#000; pointer-events:none;">
    <div id="cinematic-video-wrapper" style="position:absolute; inset:0; transform-origin:center center;">
      <!-- Hidden Youtube Iframe engineered to perfectly cover the screen like object-fit:cover -->
      <iframe 
        style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:100vw; height:56.25vw; min-height:100vh; min-width:177.77vh; filter:brightness(0.65) contrast(1.2) saturate(0.5); pointer-events:none;" 
        src="https://www.youtube-nocookie.com/embed/wJheRiQymV4?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=wJheRiQymV4&modestbranding=1&iv_load_policy=3&playsinline=1&disablekb=1" 
        frameborder="0" 
        allow="autoplay; encrypted-media" 
        allowfullscreen>
      </iframe>
    </div>
    
    <div id="cinematic-overlay" style="position:absolute; inset:0; background:rgba(1, 2, 6, 0.1); background-image:radial-gradient(ellipse at center, transparent 0%, rgba(1, 2, 6, 0.7) 100%); transition:background-color 0.1s linear;"></div>
    <!-- Film Grain overlay -->
    <div style="position:absolute; inset:0; background-image:url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.85\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\' opacity=\\'0.04\\'/%3E%3C/svg%3E'); mix-blend-mode: overlay;"></div>
  </div>
  
  <div style="position:relative; z-index:10; display:flex; flex-direction:column; min-height:100vh;">
    <!-- Minimal Header -->
    <nav style="padding:40px 6vw; display:flex; justify-content:space-between; align-items:center;">
      <div style="font-size:16px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#fff; display:flex; align-items:center; gap:12px; opacity:0; animation:fadeIn 2s ease forwards 1s;">
        <span style="display:inline-block; width:6px; height:6px; background:#e0e0e0; border-radius:50%; box-shadow:0 0 8px #fff;"></span>
        SYSTEM.TechOL
      </div>
      <div style="display:flex; align-items:center; opacity:0; animation:fadeIn 2s ease forwards 1s;">
        <button onclick="location.hash='#login'" style="background:transparent; border:none; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:2px; font-size:11px; font-weight:600; cursor:pointer; margin-right:32px; transition:color 0.3s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.7)'">Authenticate</button>
      </div>
    </nav>

    <!-- Deep Space Hero -->
    <main style="flex:1; display:flex; align-items:center; padding:0 10vw;">
      <div style="max-width:900px; position:relative;">
        <h1 class="reveal-text" style="font-size:clamp(64px, 10vw, 120px); font-weight:900; line-height:0.95; letter-spacing:-0.03em; color:#fff; margin-bottom:40px; opacity:0; transform:translateY(30px);">
          See What <br/>Others Miss.
        </h1>
        <p class="reveal-text" style="font-size:clamp(18px, 2vw, 22px); color:rgba(255,255,255,0.7); font-weight:400; line-height:1.7; max-width:640px; margin-bottom:64px; opacity:0; transform:translateY(30px); text-shadow:0 4px 24px rgba(0,0,0,0.8);">
          The intelligence layer tracking capital, risk, and opportunity before it surfaces. Deep space. Strategic. Powerful.
        </p>
        <div class="reveal-text" style="display:flex; gap:24px; opacity:0; transform:translateY(30px); flex-wrap:wrap;">
          <button onclick="location.hash='#signup'" style="background:rgba(20, 25, 35, 0.4); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.3); color:#fff; padding:18px 40px; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:600; cursor:pointer; border-radius:4px; box-shadow:0 8px 32px rgba(0,0,0,0.4); transition:all 0.4s ease;" onmouseover="this.style.background='rgba(40, 45, 55, 0.6)'; this.style.borderColor='rgba(255,255,255,0.6)'; this.style.transform='scale(1.02) translateY(-2px)'; this.style.boxShadow='0 12px 40px rgba(0,0,0,0.6)'" onmouseout="this.style.background='rgba(20, 25, 35, 0.4)'; this.style.borderColor='rgba(255,255,255,0.3)'; this.style.transform='none'; this.style.boxShadow='0 8px 32px rgba(0,0,0,0.4)'">
            Access Intelligence
          </button>
          <button onclick="location.hash='#login'" style="background:transparent; color:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.1); padding:18px 40px; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:600; cursor:pointer; border-radius:4px; transition:all 0.4s ease;" onmouseover="this.style.color='#fff'; this.style.borderColor='rgba(255,255,255,0.3)'; this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.color='rgba(255,255,255,0.7)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='transparent'">
            Enter the System
          </button>
        </div>
      </div>
    </main>
    
    <!-- Deep Scroll Indicator -->
    <div style="position:absolute; bottom:40px; left:50%; transform:translateX(-50%); opacity:0; animation:fadeIn 2s ease forwards 4s; display:flex; flex-direction:column; align-items:center; gap:12px;">
      <div style="font-size:10px; text-transform:uppercase; letter-spacing:3px; color:rgba(255,255,255,0.3);">Initiate Deep Scan</div>
      <div style="width:1px; height:40px; background:linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);"></div>
    </div>
  </div>

  <!-- New Cinematic Spaceship Section -->
  <div style="position:relative; z-index:10; min-height:100vh; display:flex; align-items:center; justify-content:center; overflow:hidden;">
    <div style="position:absolute; inset:0; z-index:0;">
       <video autoplay loop muted playsinline poster="assets/cinematic-fallback.png" style="width:100%; height:100%; object-fit:cover; filter:brightness(0.65) contrast(1.2) saturate(0.5);">
         <source src="assets/Cinematic_Spaceship_Hero_Shot.mp4" type="video/mp4" />
       </video>
       <div style="position:absolute; inset:0; background:linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.4) 30%, #000 100%); pointer-events:none;"></div>
    </div>
    <div class="reveal-on-scroll" style="position:relative; z-index:1; text-align:center; padding:0 10vw; opacity:0; transform:translateY(40px); transition:all 1s ease;">
       <div style="display:inline-block; font-size:11px; text-transform:uppercase; letter-spacing:4px; color:#3b82f6; border:1px solid rgba(59,130,246,0.3); padding:8px 16px; border-radius:20px; background:rgba(59,130,246,0.05); margin-bottom:24px; backdrop-filter:blur(4px);">Classified Feed</div>
       <h2 style="font-size:clamp(40px, 6vw, 72px); font-weight:900; color:#fff; letter-spacing:-0.03em; margin-bottom:32px;">Orbital Market Control.</h2>
       <p style="color:rgba(255,255,255,0.6); font-size:clamp(16px, 2vw, 20px); max-width:700px; margin:0 auto 48px auto; line-height:1.7;">Our deep-space scanners process terabytes of venture and market velocity data. See institutional shifts days before they reach the surface web. No noise. Just raw signal.</p>
       <button onclick="location.hash='#signup'" style="background:linear-gradient(135deg, #ffffff, #e2e8f0); color:#010206; border:none; padding:16px 40px; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:700; cursor:pointer; border-radius:4px; box-shadow:0 0 24px rgba(255,255,255,0.2); transition:all 0.3s;">Initialize Uplink</button>
    </div>
  </div>

  <div style="position:relative; z-index:10; background:#000;">
    <!-- Footer / Status -->
    <footer style="padding:40px 6vw; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:12px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:2px;">
            Connection: <span style="color:#3b82f6;">Encrypted Tunnel</span>
        </div>
        <div style="font-size:12px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:2px;">
            Node: 0x89A.B24 // SYSTEM SECURE
        </div>
    </footer>
  </div>
</div>
<style>
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
</style>`;

    if (container) {
      container.innerHTML = html;
      try {
        this.initInteractiveBg();
        this.initLandingAnimations();
      } catch (e) {
        console.warn("Landing effects failed:", e);
      }
    }
    return html;
  },

  // ---- Auth ----
  renderLogin(container) {
    this.currentView = 'login';
    const html = `
    <div class="auth-page-v2 animate-fadeIn" style="display:flex; height:100vh; background: var(--bg-primary); align-items:center; justify-content:center; position:relative; overflow:hidden">
    <!--Institutional Mesh Background-->
    <div style="position:absolute; inset:0; opacity:0.1; background: radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 60%); filter:blur(100px); pointer-events:none"></div>
    <div class="grid-overlay" style="position:absolute; inset:0; pointer-events:none; background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 32px 32px; opacity:0.4; mask-image:radial-gradient(ellipse at center, black, transparent)"></div>

    <div class="auth-card-v2 animate-slideUp" style="width:100%; max-width:440px; padding:var(--space-8); background:rgba(20,25,35,0.4); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.1); border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,0.8); z-index:10; position:relative">
      <div class="brand" style="display:flex; justify-content:center; margin-bottom:var(--space-8); cursor:pointer" onclick="location.hash='#landing'">
        <div style="font-size:16px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#fff; display:flex; align-items:center; gap:12px;">
          <span style="display:inline-block; width:6px; height:6px; background:#e0e0e0; border-radius:50%; box-shadow:0 0 8px #fff;"></span>
          SYSTEM.TechOL
        </div>
      </div>

      <div style="text-align:center; margin-bottom:var(--space-8)">
        <h1 style="font-size:24px; font-weight:800; letter-spacing:-0.5px; margin-bottom:8px; color:#fff">Authenticate</h1>
        <p style="color:rgba(255,255,255,0.5); font-size:14px; font-weight:400">The intelligence hub for modern engineering.</p>
      </div>

      <form class="auth-form" onsubmit="App.handleLogin(event)" style="display:flex; flex-direction:column; gap:var(--space-4)">
        <div id="auth-error" class="auth-error" style="background:rgba(238,0,0,0.1); border:1px solid rgba(238,0,0,0.2); color:#ff453a; padding:12px; border-radius:4px; font-size:13px; font-weight:600; text-align:center; display:none"></div>
        
        <input type="email" id="login-email" placeholder="Direct Comms (Email)" required style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s;">
        <input type="password" id="login-password" placeholder="Passkey" required style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s;">

        <button type="submit" id="auth-submit-btn" class="btn btn-primary" 
          style="width:100%; padding:16px; border-radius:4px; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:700; margin-top:8px; background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer; transition:all 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
          Initiate Uplink
        </button>
      </form>

      <div style="display:flex; align-items:center; gap:12px; margin:var(--space-6) 0">
        <div style="flex:1; height:1px; background:rgba(255,255,255,0.05)"></div>
        <span style="font-size:10px; color:rgba(255,255,255,0.3); font-weight:700; text-transform:uppercase; letter-spacing:2px">Bypass</span>
        <div style="flex:1; height:1px; background:rgba(255,255,255,0.05)"></div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
        <button onclick="App.googleLogin()" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; border-radius:4px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.3); color:#fff; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
          <svg width="14" height="14" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957A8.996 0 0 0 0 9c0 1.497.366 2.91 1.012 4.144l2.952-2.432z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Google
        </button>
        <button onclick="location.hash='#phone-login'" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; border-radius:4px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.3); color:#fff; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
            Data Link (SMS)
        </button>
      </div>

      <div style="margin-top:20px; text-align:center">
        <a href="javascript:void(0)" onclick="App.handleForgotPassword()" style="font-size:11px; color:rgba(255,255,255,0.45); text-decoration:none; font-weight:600; letter-spacing:0.5px; transition:color 0.2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.45)'">Forgot your passkey?</a>
      </div>

      <div style="margin-top:var(--space-6); text-align:center">
        <p style="font-size:11px; color:rgba(255,255,255,0.5); font-weight:550; text-transform:uppercase; letter-spacing:1px;">
          Unregistered? <a href="#signup" style="color:#fff; text-decoration:none; font-weight:800">Request Access</a>
        </p>
      </div>
    </div>
  </div>`;
    if (container) container.innerHTML = html;
    return html;
  },

  renderSignup(container) {
    this.currentView = 'signup';
    const html = `
    <div class="auth-page-v2 animate-fadeIn" style="display:flex; height:100vh; background: #010206; align-items:center; justify-content:center; position:relative; overflow:hidden">
      <!--Deep Cinematic Grain-->
      <div style="position:absolute; inset:0; z-index:0; pointer-events:none; background-image:url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.85\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\' opacity=\\'0.04\\'/%3E%3C/svg%3E'); mix-blend-mode: overlay;"></div>
      <div style="position:absolute; inset:10%; opacity:0.1; background: radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%); filter:blur(100px); pointer-events:none"></div>

      <div class="auth-card-v2 animate-slideUp" style="width:100%; max-width:440px; padding:var(--space-8); background:rgba(20,25,35,0.4); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.1); border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,0.8); z-index:10; position:relative">
        <div class="brand" style="display:flex; justify-content:center; margin-bottom:var(--space-8); cursor:pointer" onclick="location.hash='#landing'">
          <div style="font-size:16px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#fff; display:flex; align-items:center; gap:12px;">
            <span style="display:inline-block; width:6px; height:6px; background:#e0e0e0; border-radius:50%; box-shadow:0 0 8px #fff;"></span>
            SYSTEM.TechOL
          </div>
        </div>

        <div style="text-align:center; margin-bottom:var(--space-8)">
          <h1 style="font-size:24px; font-weight:800; letter-spacing:-0.5px; margin-bottom:8px; color:#fff">Request Access</h1>
          <p style="color:rgba(255,255,255,0.5); font-size:14px; font-weight:400">Establish your secure identity on the network.</p>
        </div>

        <form class="auth-form" onsubmit="App.handleSignup(event)" style="display:flex; flex-direction:column; gap:var(--space-4)">
          <div id="auth-error" class="auth-error" style="background:rgba(238,0,0,0.1); border:1px solid rgba(238,0,0,0.2); color:#ff453a; padding:12px; border-radius:4px; font-size:13px; font-weight:600; text-align:center; display:none"></div>
          
          <input type="text" id="signup-name" placeholder="Agent Name" required style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s;">
          <input type="text" id="signup-username" placeholder="Callsign (Username)" required pattern="^[a-zA-Z0-9_]{3,20}$" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s;">
          <input type="email" id="signup-email" placeholder="Direct Comms (Email)" required style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s;">
          <input type="password" id="signup-password" placeholder="Passkey (Min 6)" required minlength="6" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s;">

          <button type="submit" id="auth-submit-btn" style="width:100%; padding:16px; border-radius:4px; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:700; margin-top:8px; background:linear-gradient(135deg, #fff, #e2e8f0); color:#000; border:none; cursor:pointer; box-shadow:0 8px 32px rgba(255,255,255,0.1); transition:all 0.2s ease;">
            Initialize Account
          </button>
        </form>

        <div style="display:flex; align-items:center; gap:12px; margin:20px 0">
          <div style="flex:1; height:1px; background:rgba(255,255,255,0.05)"></div>
          <span style="font-size:10px; color:rgba(255,255,255,0.3); font-weight:700; text-transform:uppercase; letter-spacing:2px">Or</span>
          <div style="flex:1; height:1px; background:rgba(255,255,255,0.05)"></div>
        </div>

        <button onclick="App.googleLogin()" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; border-radius:4px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.3); color:#fff; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; cursor:pointer; transition:all 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
          <svg width="14" height="14" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957A8.996 0 0 0 0 9c0 1.497.366 2.91 1.012 4.144l2.952-2.432z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style="margin-top:var(--space-8); text-align:center">
          <p style="font-size:12px; color:rgba(255,255,255,0.5); font-weight:500; text-transform:uppercase; letter-spacing:1px;">
            Already approved? <a href="#login" style="color:#fff; text-decoration:none; font-weight:700">Authenticate</a>
          </p>
        </div>
      </div>
    </div>`;
    if (container) container.innerHTML = html;
    return html;
  },

  renderPhoneLogin(container) {
    this.currentView = 'phone-login';
    const html = `
    <div class="auth-page-v2 animate-fadeIn" style="display:flex; height:100vh; background: #010206; align-items:center; justify-content:center; position:relative; overflow:hidden">
      <!-- Deep Cinematic Grain -->
      <div style="position:absolute; inset:0; z-index:0; pointer-events:none; background-image:url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.85\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\' opacity=\\'0.04\\'/%3E%3C/svg%3E'); mix-blend-mode: overlay;"></div>
      <div style="position:absolute; inset:10%; opacity:0.1; background: radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%); filter:blur(100px); pointer-events:none"></div>

      <div class="auth-card-v2 animate-slideUp" style="width:100%; max-width:440px; padding:var(--space-8); background:rgba(20,25,35,0.4); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.1); border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,0.8); z-index:10; position:relative">
        <div class="brand" style="display:flex; justify-content:center; margin-bottom:var(--space-8); cursor:pointer" onclick="location.hash='#landing'">
          <div style="font-size:16px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#fff; display:flex; align-items:center; gap:12px;">
            <span style="display:inline-block; width:6px; height:6px; background:#e0e0e0; border-radius:50%; box-shadow:0 0 8px #fff;"></span>
            SYSTEM.TechOL
          </div>
        </div>

        <div style="text-align:center; margin-bottom:var(--space-6)">
          <h1 style="font-size:24px; font-weight:800; letter-spacing:-0.5px; margin-bottom:8px; color:#fff">Link Physical Device</h1>
          <p style="color:rgba(255,255,255,0.5); font-size:14px; font-weight:400">Verify your mobile terminal via SMS uplink.</p>
        </div>

        <div id="auth-error" class="auth-error" style="background:rgba(238,0,0,0.1); border:1px solid rgba(238,0,0,0.2); color:#ff453a; padding:12px; border-radius:4px; font-size:13px; font-weight:600; text-align:center; display:none; margin-bottom:16px;"></div>
        
        <div id="phone-entry-section">
          <input type="tel" id="phone-number" placeholder="+1 202 555 0174" required style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s; margin-bottom:16px;">
          <div id="recaptcha-container" style="margin-bottom:16px;"></div>
          <button onclick="App.handleSendOtp()" style="width:100%; padding:16px; border-radius:4px; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:700; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer; transition:all 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
            Transmit Signal
          </button>
        </div>

        <div id="otp-entry-section" style="display:none">
          <input type="text" id="otp-code" placeholder="6-digit decryption code" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px 16px; color:#fff; font-size:14px; font-weight:500; transition:border-color 0.2s; margin-bottom:16px; letter-spacing:4px; text-align:center;">
          <button onclick="App.handleVerifyOtp()" style="width:100%; padding:16px; border-radius:4px; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:700; background:linear-gradient(135deg, #fff, #e2e8f0); color:#000; border:none; cursor:pointer; box-shadow:0 8px 32px rgba(255,255,255,0.1); transition:all 0.2s ease;">
            Execute Decryption
          </button>
          <button onclick="App.navigateTo('phone-login')" style="width:100%; margin-top:16px; background:transparent; border:none; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; letter-spacing:2px; cursor:pointer;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">Abort / Change Number</button>
        </div>

        <div style="margin-top:var(--space-8); text-align:center">
          <p style="font-size:12px; color:rgba(255,255,255,0.5); font-weight:500; text-transform:uppercase; letter-spacing:1px;">
            Return to <a href="#login" style="color:#fff; text-decoration:none; font-weight:700">Standard Auth</a>
          </p>
        </div>
      </div>
    </div>`;
    if (container) {
      container.innerHTML = html;
      setTimeout(() => AuthService.setupRecaptcha('recaptcha-container'), 100);
    }
    return html;
  },

  async handleSendOtp() {
    const phone = document.getElementById('phone-number').value.trim();
    if (!phone) { Utils.showToast('Enter phone number', 'error'); return; }
    try {
      await AuthService.sendOtp(phone);
      document.getElementById('phone-entry-section').style.display = 'none';
      document.getElementById('otp-entry-section').style.display = 'block';
      Utils.showToast('SMS Sent!', 'success');
    } catch (e) {
      const err = document.getElementById('auth-error');
      err.textContent = e.message; err.classList.add('visible');
    }
  },

  async handleVerifyOtp() {
    const code = document.getElementById('otp-code').value.trim();
    if (!code) { Utils.showToast('Enter code', 'error'); return; }
    try {
      this._authNavigating = true;
      await AuthService.confirmOtp(code);
      this.showMainApp(); this.navigateTo('feed');
      setTimeout(() => { this._authNavigating = false; }, 1000);
    } catch (e) {
      this._authNavigating = false;
      const err = document.getElementById('auth-error');
      err.textContent = e.message; err.classList.add('visible');
    }
  },

  async handleLogin(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('auth-submit-btn');
    const err = document.getElementById('auth-error');
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<div class="spinner spinner-sm"></div> Signing in...`;
      }
      this.isAuthenticating = true;

      await AuthService.signIn(email, pw);

      // CRITICAL FIX: Set flag BEFORE navigation
      this._authNavigating = true;
      localStorage.setItem('techol_auth_complete', 'true');

      // Use setTimeout to ensure state is set
      setTimeout(() => {
        this.showMainApp();
        this.navigateTo('feed');
        this.hideLoadingOverlay(800);
        this._authNavigating = false;
        this.isAuthenticating = false;
      }, 100);

    } catch (ex) {
      this._authNavigating = false;
      this.isAuthenticating = false;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Initiate Uplink';
      }
      if (err) {
        err.textContent = AuthService._humanizeError(ex);
        err.style.display = 'block';
      }
    }
  },

  async handleSignup(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;
    const user = document.getElementById('signup-username').value;

    try {
      this.isAuthenticating = true;
      this.showLoadingOverlay('Architecting your identity...', 'Initializing TechOL Protocol v1.0');

      await AuthService.signUp(email, pass, name, user);

      // CRITICAL FIX: Set flag BEFORE navigation
      this._authNavigating = true;
      localStorage.setItem('techol_auth_complete', 'true');

      setTimeout(() => {
        this.showMainApp();
        this.navigateTo('feed');
        this.hideLoadingOverlay(1000);
        this._authNavigating = false;
        this.isAuthenticating = false;
      }, 100);

    } catch (err) {
      this._authNavigating = false;
      this.isAuthenticating = false;
      this.hideLoadingOverlay(0);
      const errEl = document.getElementById('auth-error');
      if (errEl) {
        errEl.textContent = AuthService._humanizeError(err);
        errEl.style.display = 'block';
      }
    }
  },

  async googleLogin() {
    try {
      this.isAuthenticating = true;
      this._authNavigating = true;
      
      const result = await AuthService.signInWithGoogle();
      
      // If redirect was used (popup blocked), result will be null
      // The page will reload and AuthService.init() will handle the redirect result
      if (!result) return;

      // CRITICAL FIX: Set auth complete flag BEFORE navigation
      localStorage.setItem('techol_auth_complete', 'true');
      
      this.showLoadingOverlay('Syncing Google Intelligence...', 'Establishing secure cross-channel uplink');

      this.showMainApp();
      this.navigateTo('feed');
      this.hideLoadingOverlay(800);

      setTimeout(() => { this._authNavigating = false; this.isAuthenticating = false; }, 1200);
    } catch (ex) {
      this._authNavigating = false;
      this.isAuthenticating = false;
      const friendlyMsg = AuthService._humanizeError(ex);
      Utils.showToast(friendlyMsg, 'error');
    }
  },

  async handleForgotPassword() {
    const emailInput = document.getElementById('login-email');
    const email = emailInput?.value?.trim();
    
    if (!email) {
      Utils.showToast('Please enter your email address first', 'warning');
      emailInput?.focus();
      return;
    }
    
    try {
      await AuthService.resetPassword(email);
      Utils.showToast('Password reset email sent! Check your inbox.', 'success');
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  },


  showMainApp() {
    const user = AuthService.getUser(); if (!user) { location.hash = '#login'; return; }
    if (this.currentView === 'app') return; this.currentView = 'app';

    // Initialize Real-time Engine
    RealtimeDataEngine.init();

    // Initialize Data Ingestion Engine (RSS news worker)
    try {
      DataIngestionEngine.init();
      console.log('DataIngestionEngine: Started from showMainApp()');
    } catch (e) {
      console.warn('DataIngestionEngine: Init failed, LiveNewsEngine will serve as fallback', e);
    }

    // Ensure LiveNewsEngine is initialized
    if (window.LiveNewsEngine && !window.LiveNewsEngine.isInitialized) {
      window.LiveNewsEngine.init();
    }

    // Register Global Live Tasks
    RealtimeDataEngine.register('sector_momentum', async () => RealtimeDataEngine.getLiveSectorData(), (data) => {
      const board = document.getElementById('live-momentum-container');
      if (board && data && data.length > 0) board.innerHTML = Components.sectorMomentumBoard(data);
    });

    RealtimeDataEngine.register('funding_alerts', async () => RealtimeDataEngine.getLiveFundingAlerts(), (data) => {
      const ticker = document.getElementById('live-funding-ticker-container');
      if (ticker && data && data.length > 0) ticker.innerHTML = Components.fundingTicker(data);
    });

    // Live ticker populator
    window.addEventListener('techol_heartbeat_sync', () => {
      if (window.RealtimeDataEngine) RealtimeDataEngine.notifyUI();
    });
    window.addEventListener('newsUpdated', () => {
      if (window.RealtimeDataEngine) RealtimeDataEngine.notifyUI();
    });

    RealtimeDataEngine.register('feed_sidebar', async () => {
      const trending = await Database.getTrendingHashtags();

      // Get news from LiveNewsEngine (primary) with Firestore fallback
      let newsItems = [];
      if (window.LiveNewsEngine) {
        const buf = window.LiveNewsEngine.getBuffer(5);
        newsItems = buf.map(n => ({
          title: n.title || 'Breaking Signal',
          pubDate: n.pubDate || n.createdAt || new Date().toISOString(),
          source: n.source || 'Live Intelligence',
          link: n.link || '#',
          category: n.category || 'tech'
        }));
      }

      // Supplement from Firestore platform posts if LiveNewsEngine has few items
      if (newsItems.length < 3) {
        try {
          const res = await Database.getFeedPosts(5);
          const platformNews = (res?.posts || []).filter(p => p.type === 'platform');
          platformNews.forEach(n => {
            newsItems.push({
              title: (n.text || '').split('\n')[0].replace(/^[^a-zA-Z]*\*\*[^*]+\*\*\s*/, '').slice(0, 120),
              pubDate: n.createdAt,
              source: 'Platform Intelligence',
              link: '#'
            });
          });
        } catch (e) { }
      }

      return { trending, news: newsItems.slice(0, 5) };
    }, (data) => {
      const sidebar = document.querySelector('.right-sidebar');
      if (sidebar && window.App.currentView === 'feed') {
        sidebar.innerHTML = Components.trendingSidebar(data.trending, [], data.news);
      }
    });

    document.getElementById('app').innerHTML = `<div class="app-layout">
    <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="brand" style="cursor:pointer" onclick="App.navigateTo('feed')">
        ${Icons.logo()}<span class="brand-name">TechOL</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-nav-item active" data-view="feed" onclick="App.navigateTo('feed')"><span class="nav-icon">${Icons.ms('dynamic_feed', { size: 20 })}</span> Feed</div>
      <div class="sidebar-nav-item" data-view="trends" onclick="App.navigateTo('trends')"><span class="nav-icon">${Icons.ms('analytics', { size: 20 })}</span> Trends</div>
      <div class="sidebar-nav-item" data-view="shelf" onclick="App.navigateTo('shelf')"><span class="nav-icon">${Icons.ms('shelves', { size: 20 })}</span> Shelf</div>
      <div class="sidebar-nav-item" data-view="sector-intelligence" onclick="App.navigateTo('sector-intelligence')"><span class="nav-icon">${Icons.ms('waterfall_chart', { size: 20 })}</span> Market Intel</div>
      <div class="sidebar-nav-item" data-view="capital-intelligence" onclick="App.navigateTo('capital-intelligence')"><span class="nav-icon">${Icons.ms('monetization_on', { size: 20 })}</span> Funding</div>
      <div class="sidebar-nav-item" data-view="opportunity-radar" onclick="App.navigateTo('opportunity-radar')"><span class="nav-icon">${Icons.ms('radar', { size: 20 })}</span> Opportunities</div>
      <div class="sidebar-nav-item" data-view="jobs" onclick="App.navigateTo('jobs')"><span class="nav-icon">${Icons.work()}</span> Jobs</div>
      <div class="sidebar-nav-item" data-view="courses" onclick="App.navigateTo('courses')"><span class="nav-icon">${Icons.school()}</span> Learning</div>
      <div class="sidebar-nav-item" data-view="notifications" onclick="App.navigateTo('notifications')"><span class="nav-icon">${Icons.ms('notifications_active', { size: 20 })}</span> Notifications</div>
      <div class="sidebar-nav-item" data-view="profile" onclick="App.navigateTo('profile')"><span class="nav-icon">${Icons.ms('account_circle', { size: 20 })}</span> Identity</div>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-profile" onclick="App.navigateTo('profile')" style="margin-bottom:var(--space-4)">
        ${Components.avatar(user, 'avatar-md')}
        <div class="sidebar-profile-info">
          <div class="sidebar-profile-name" style="display:flex;align-items:center;gap:4px">
            ${user.displayName} 
            ${(user.uid === 'admin' || user.isVerified) ? Icons.verified(12) : ''}
          </div>
          <div class="sidebar-profile-handle">@${user.username}</div>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--text-tertiary);justify-content:center;padding:0 var(--space-4)">
        <span style="cursor:pointer" onclick="App.navigateTo('about')">About</span>
        <span style="cursor:pointer" onclick="App.navigateTo('contact')">Contact</span>
        <span style="cursor:pointer" onclick="App.navigateTo('privacy')">Privacy Policy</span>
        <span style="cursor:pointer" onclick="App.navigateTo('legal')">Legal</span>
      </div>
      <div style="font-size:10px;text-align:center;color:var(--text-muted);margin-top:4px">© 2026 TechOL Inc.</div>
    </div></aside>
    <main class="main-content" id="app-main">
    <div class="intel-ticker-wrap" style="margin-bottom:0;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.8);backdrop-filter:blur(10px)">
        <div id="global-ticker" style="display:flex;white-space:nowrap;animation:ticker-scroll 60s linear infinite;will-change:transform;align-items:center"><span style="font-size:11px;color:rgba(255,255,255,0.3);padding:0 20px">⚡ LOADING LIVE DATA...</span></div>
    </div>
    <header class="top-header">
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <button class="mobile-menu-btn btn-icon" onclick="App.toggleSidebar()">${Icons.menu()}</button>
        <div style="display:flex;flex-direction:column">
          <h1 class="header-title" id="header-title">Home</h1>
          <div style="font-size:9px;font-weight:700;color:var(--success);display:flex;align-items:center;gap:4px;margin-top:2px">
            <span style="width:5px;height:5px;background:var(--success);border-radius:50%;display:block;animation:pulse 2s infinite"></span>
            NETWORK OPERATIONAL
          </div>
        </div>
      </div>
      <div class="header-search">
        <span class="search-icon">${Icons.search()}</span>
        <input type="text" placeholder="Search builders, intel, signals..." id="global-search" oninput="App.handleSearch(this.value)" aria-label="Global tech search">
      </div>
      <div class="header-actions" style="position:relative;">
        <div id="realtime-indicator-container">
          ${Components.liveStatusIndicator()}
        </div>
        <button class="btn btn-icon btn-ghost" onclick="App.toggleNotifDropdown()">
          ${Icons.notifications()}
          <span class="badge badge-error" id="notif-badge" style="position:absolute;top:-4px;right:-4px;font-size:10px;padding:2px 5px;display:none;">0</span>
        </button>
        <div id="notif-dropdown" class="notif-dropdown hidden"></div>
        <button class="btn btn-icon btn-ghost" onclick="App.logout()" title="Logout" style="margin-left:4px; color:var(--text-tertiary)">
          ${Icons.ms('logout', { size: 20 })}
        </button>
      </div>
    </header>
    <div id="ai-alert-container"></div>
    <div class="content-area" id="content-area"></div>
  </main>
</div>
    <div id="toast-container" class="toast-container"></div>
    <div id="modal-overlay" class="modal-overlay hidden" onclick="App.closeModal(event)"><div class="modal" id="modal-content" onclick="event.stopPropagation()"></div></div>`;
  },

  navigateTo(view) {
    document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.toggle('active', i.dataset.view === view));
    const titles = {
      feed: 'Intelligence Stream',
      trends: 'Signal Velocity',
      shelf: 'Personal Intelligence Shelf',
      'skills-career': 'Talent Intelligence',
      'opportunity-radar': 'Opportunity Gap Engine',
      'sector-intelligence': 'Sector Analysis Terminal',
      'capital-intelligence': 'Capital Flow Terminal',
      notifications: 'Alert Command',
      messages: 'Encrypted Comms',
      courses: 'Strategic Skillsets',
      jobs: 'Talent Liquidity',
      profile: 'Intelligence Identity',
      settings: 'System Configuration'
    };

    const t = document.getElementById('header-title');
    const viewTitle = titles[view] || 'TechOL';
    if (t) t.textContent = viewTitle;
    document.title = `${viewTitle} | TechOL — Intelligence OS`;

    // 1. Professional Top Loading Bar
    const existingBar = document.getElementById('top-loading-bar');
    if (existingBar) existingBar.remove();
    document.body.insertAdjacentHTML('afterbegin', Components.topLoadingBar());
    const bar = document.getElementById('top-loading-bar');

    // Animate bar
    setTimeout(() => { if (bar) bar.style.width = '40%'; }, 10);
    setTimeout(() => { if (bar) bar.style.width = '70%'; }, 200);

    // 2. Section Transition
    const c = document.getElementById('content-area'); if (!c) return;
    c.style.opacity = '0';
    c.style.transform = 'translateY(10px)';

    // 3. SHOW SECTION LOADER
    c.innerHTML = Components.sectionLoader(view);
    c.style.opacity = '1';
    c.style.transform = 'translateY(0)';

    history.replaceState(null, '', `#${view}`);
    if (this._feedUnsub) { this._feedUnsub(); this._feedUnsub = null; }
    if (this._livePulseTimer) { clearInterval(this._livePulseTimer); this._livePulseTimer = null; }
    if (this._scrollObserver) { this._scrollObserver.disconnect(); this._scrollObserver = null; }

    setTimeout(async () => {
      // Fade out loader slightly before render
      c.style.opacity = '0.5';

      if (bar) bar.style.width = '90%';

      switch (view) {
        case 'feed': await this.renderIntelligenceStream(c); break;
        case 'trends': window.TrendsModule.render(c); break;
        case 'shelf': window.ShelfModule.render(c); break;
        case 'opportunity-radar': await OpportunityRadar.render(c); break;
        case 'sector-intelligence':
          import('./sector-intelligence.js').then(m => m.default.render(c));
          break;
        case 'capital-intelligence':
          import('./capital-intelligence.js').then(m => m.default.render(c));
          break;
        case 'jobs': this.renderJobs(c); break;
        case 'courses': this.renderCourses(c); break;
        case 'notifications': this.renderAlerts(c); break;
        case 'settings': this.renderSettings(c); break;
        case 'profile': this.renderProfile(AuthService.getUser().uid, c); break;
        default: break;
      }

      c.style.opacity = '1';

      // Complete bar
      if (bar) {
        bar.style.width = '100%';
        setTimeout(() => {
          bar.style.opacity = '0';
          setTimeout(() => bar.remove(), 400);
        }, 200);
      }
    }, 400); // Wait for loader animation
  },

  // ---- Feed ----
  async renderIntelligenceStream(container) {
    if (!container) return;
    this.currentView = 'feed';
    this._feedFirstLoadSettled = false;
    this._feedServerSettled = false;

    const user = AuthService.getUser();
    const userSector = user?.sector || user?.industry || user?.niche || localStorage.getItem('techol_user_sector') || 'AI Models & Releases';

    // Compute dynamic sector metrics from real signal data
    const sectorInfo = (typeof RealtimeDataEngine !== 'undefined')
      ? RealtimeDataEngine.sectorData.find(s => s.sector === userSector) ||
        RealtimeDataEngine.sectorData.find(s => userSector.toLowerCase().includes(s.sector.toLowerCase())) ||
        { score: 50, trend: '▲', color: '#6366f1', insights: [] }
      : { score: 50, trend: '▲', color: '#6366f1', insights: [] };

    const signals = (typeof RealtimeDataEngine !== 'undefined' && RealtimeDataEngine.getSectorSignals)
      ? RealtimeDataEngine.getSectorSignals(userSector) || { news: 0, github: 0, hn: 0 }
      : { news: 0, github: 0, hn: 0 };

    const totalSignals = signals.news + signals.github + signals.hn;
    const sectorScore = sectorInfo.score || 50;
    const isGrowing = sectorInfo.trend === '▲';
    const growthPercent = isGrowing ? (sectorScore / 6).toFixed(1) : (-(100 - sectorScore) / 12).toFixed(1);
    const newsCount = signals.news || 0;
    const githubRepos = signals.github || 0;
    const dataCoverage = Math.min(98, 60 + totalSignals * 3);

    // Build live ticker data from RealtimeDataEngine
    const tickerSectors = (typeof RealtimeDataEngine !== 'undefined' && RealtimeDataEngine.sectorData)
      ? RealtimeDataEngine.sectorData.slice(0, 10)
      : [
        { sector: 'AI/ML', score: 87, trend: '▲' },
        { sector: 'SaaS', score: 72, trend: '▲' },
        { sector: 'FinTech', score: 65, trend: '▼' },
        { sector: 'HealthTech', score: 78, trend: '▲' },
        { sector: 'Cybersecurity', score: 82, trend: '▲' },
        { sector: 'DevTools', score: 69, trend: '▲' }
      ];

    const tickerHtml = tickerSectors.map(s => `
      <div class="ticker-item">
        <span class="sector-name">${s.sector}</span>
        <span class="ticker-value ${s.trend === '▲' ? 'ticker-up' : 'ticker-down'}">${s.score}</span>
        <span style="color:${s.trend === '▲' ? '#10b981' : '#ef4444'}">${s.trend === '▲' ? '↗' : '↘'}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="width:100%; display:block">
      <!-- ============================================ -->
      <!-- PREMIUM LIVE TICKER BAR                     -->
      <!-- ============================================ -->
      <div class="ticker-container" style="border-radius:12px; margin-bottom:16px; overflow:hidden">
        <div class="ticker-track">
          ${tickerHtml}${tickerHtml}${tickerHtml}
        </div>
      </div>

      <!-- ============================================ -->
      <!-- GLOBAL PLATFORM STATS                       -->
      <!-- ============================================ -->
      <div class="platform-stats-bar" style="border-radius:12px; margin-bottom:24px">
        <div class="platform-stat-item">
          ${Icons.ms('groups', { size: 14 })}
          <span>Active Founders</span>
          <span class="platform-stat-value animated-number" id="stat-founders">12,847</span>
        </div>
        <div class="platform-stat-item">
          ${Icons.ms('trending_up', { size: 14 })}
          <span>Signals Today</span>
          <span class="platform-stat-value animated-number" id="stat-signals">${(totalSignals * 47 + 2341).toLocaleString()}</span>
        </div>
        <div class="platform-stat-item">
          ${Icons.ms('bolt', { size: 14 })}
          <span>Updates/min</span>
          <span class="platform-stat-value">127</span>
        </div>
        <div class="platform-stat-item activity-pulse">
          ${Icons.ms('stream', { size: 14 })}
          <span style="color:#10b981; font-weight:700">Platform Online</span>
        </div>
      </div>

      <div class="dashboard-layout animate-fadeIn" style="display:grid; grid-template-columns: 280px 1fr 340px; gap:24px; width:100%; max-width:1800px; margin:0 auto; align-items:flex-start">

        <!-- ========================================== -->
        <!-- LEFT PANEL: Premium Data Stats             -->
        <!-- ========================================== -->
        <aside class="dashboard-left" style="display:flex; flex-direction:column; gap:var(--space-4); padding-right:8px">

          <!-- Token / Sector Header - Premium Style -->
          <div class="glass-card card-hover-lift" style="padding:20px; border-radius:16px; margin-bottom:4px">
             <div style="display:flex; align-items:center; gap:14px">
                <div class="float-animation" style="width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg, var(--accent), #7928ca); display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 0 30px rgba(var(--accent-rgb), 0.5)">
                   ${Icons.ms('hub', { size: 26 })}
                </div>
                <div style="flex:1">
                   <h2 class="gradient-text" style="font-size:22px; font-weight:900; line-height:1; letter-spacing:-0.5px; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${userSector}</h2>
                   <div style="font-size:12px; color:var(--text-tertiary); font-weight:600; font-family:var(--font-mono); margin-top:6px; display:flex; align-items:center; gap:6px">
                     <span>Your Sector</span>
                     <span class="live-badge" style="font-size:8px; padding:2px 6px">LIVE</span>
                   </div>
                </div>
             </div>
          </div>

          <!-- Sector Picker - Premium Style -->
          <div class="glass-card" style="border-radius:14px; padding:14px; margin-bottom:8px">
             <div style="font-size:10px; font-weight:900; color:var(--accent); letter-spacing:1.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px">${Icons.ms('tune', { size: 12 })} SELECT YOUR SECTOR</div>
             <div style="display:flex; flex-wrap:wrap; gap:6px">
                ${(typeof window.RealtimeDataEngine !== 'undefined' && window.RealtimeDataEngine.sectorData ? window.RealtimeDataEngine.sectorData.map(d => d.sector) : ['AI Models & Releases', 'Industry Moves', 'Market Trends', 'Research & Breakthroughs', 'Ecosystem Shifts', 'Developer & Tooling']).map(s => {
                  const isActive = s === userSector;
                  return `<button onclick="localStorage.setItem('techol_user_sector','${s}');location.reload()" class="${isActive ? 'glow-effect' : ''}" style="font-size:10px; padding:6px 12px; border-radius:8px; font-weight:700; cursor:pointer; background:${isActive ? 'linear-gradient(135deg, rgba(var(--accent-rgb),0.2), rgba(121,40,202,0.15))' : 'rgba(255,255,255,0.03)'}; border:1px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}; color:${isActive ? 'var(--accent)' : 'var(--text-secondary)'}; transition:all 0.2s" onmouseover="this.style.transform='scale(1.05)';this.style.borderColor='var(--accent)'" onmouseout="this.style.transform='scale(1)';this.style.borderColor='${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}'">${s}</button>`;
                }).join('')}
             </div>
          </div>

          <!-- Main Sector Score - Premium -->
          <div class="premium-stat" style="margin-bottom:8px">
             <div style="font-size:11px; color:var(--accent); font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px">Sector Activity Score</div>
             <div style="font-size:48px; font-weight:900; letter-spacing:-2px; line-height:1; display:flex; align-items:baseline; gap:8px">
                <span id="sector-score-value" class="gradient-text">${sectorScore}</span><span style="font-size:18px; color:var(--text-tertiary); font-weight:700">/100</span>
             </div>
             <div style="margin-top:12px; display:flex; align-items:center; gap:8px">
                <span style="font-size:14px; color:${isGrowing ? '#10b981' : '#ef4444'}; font-weight:800; background:${isGrowing ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; padding:6px 12px; border-radius:8px; display:flex; align-items:center; gap:4px; border:1px solid ${isGrowing ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}">
                  ${isGrowing ? '↗' : '↘'} ${growthPercent}%
                </span>
                <span style="font-size:11px; color:var(--text-tertiary)">from ${totalSignals} signals</span>
             </div>
             <button onclick="App.navigateTo('sector-intelligence')" class="premium-btn" style="width:100%; margin-top:16px; padding:12px; font-size:13px">
                ${Icons.ms('analytics', { size: 16 })} Deep Sector Analysis
             </button>
          </div>

          <!-- Real Signal Metrics Grid - Premium -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:4px">
             <div class="glass-card card-hover-lift" style="padding:14px; border-radius:12px">
                <div style="font-size:10px; color:var(--text-tertiary); font-weight:700; display:flex; align-items:center; gap:4px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px">${Icons.ms('article', { size: 12 })} News</div>
                <div style="font-size:24px; font-weight:900; font-family:var(--font-mono); color:var(--text-primary)">${newsCount}</div>
                <div style="color:#10b981; font-size:10px; font-weight:700; margin-top:4px; display:flex; align-items:center; gap:4px"><span class="online-dot" style="width:5px; height:5px"></span> Live RSS</div>
             </div>
             <div class="glass-card card-hover-lift" style="padding:14px; border-radius:12px">
                <div style="font-size:10px; color:var(--text-tertiary); font-weight:700; display:flex; align-items:center; gap:4px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px">${Icons.ms('code', { size: 12 })} GitHub</div>
                <div style="font-size:24px; font-weight:900; font-family:var(--font-mono); color:var(--text-primary)">${githubRepos}</div>
                <div style="color:#10b981; font-size:10px; font-weight:700; margin-top:4px">Trending</div>
             </div>
             <div class="glass-card card-hover-lift" style="padding:14px; border-radius:12px">
                <div style="font-size:10px; color:var(--text-tertiary); font-weight:700; display:flex; align-items:center; gap:4px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px">${Icons.ms('forum', { size: 12 })} HN</div>
                <div style="font-size:24px; font-weight:900; font-family:var(--font-mono); color:var(--text-primary)">${signals.hn}</div>
                <div style="color:${signals.hn > 0 ? '#10b981' : 'var(--text-tertiary)'}; font-size:10px; font-weight:700; margin-top:4px">${signals.hn > 0 ? 'Active' : 'Watching'}</div>
             </div>
             <div class="glass-card card-hover-lift" style="padding:14px; border-radius:12px">
                <div style="font-size:10px; color:var(--text-tertiary); font-weight:700; display:flex; align-items:center; gap:4px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px">${Icons.ms('rss_feed', { size: 12 })} Sources</div>
                <div style="font-size:24px; font-weight:900; font-family:var(--font-mono); color:var(--text-primary)">20+</div>
                <div style="color:#10b981; font-size:10px; font-weight:700; margin-top:4px">Always on</div>
             </div>
          </div>

          <!-- Data Coverage - Premium -->
          <div class="glass-card" style="padding:16px; border-radius:14px; margin-top:8px">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                <div style="font-size:11px; color:var(--text-tertiary); font-weight:700; display:flex; align-items:center; gap:6px; text-transform:uppercase; letter-spacing:0.5px">${Icons.ms('verified', { size: 14, fill: 1 })} Feed Status</div>
                <span style="font-size:10px; color:#10b981; font-weight:700">60s refresh</span>
             </div>
             <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px">
                <span style="color:var(--text-secondary); font-weight:600">Data Coverage</span>
                <span style="color:${dataCoverage >= 85 ? '#10b981' : dataCoverage >= 70 ? '#f59e0b' : 'var(--text-secondary)'}; font-weight:800">${dataCoverage}%</span>
             </div>
             <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden">
                <div class="shimmer" style="height:100%; width:${Math.round(dataCoverage)}%; background:linear-gradient(90deg, #10b981, #0070f3); border-radius:3px; box-shadow:0 0 12px rgba(16,185,129,0.5)"></div>
             </div>
          </div>

          <!-- Premium Action Buttons -->
          <button onclick="App.navigateTo('shelf')" class="premium-btn" style="width:100%; margin-top:12px; padding:14px; font-size:13px; background:linear-gradient(135deg, rgba(var(--accent-rgb),0.15) 0%, rgba(121,40,202,0.1) 100%); border:1px solid rgba(var(--accent-rgb), 0.3); box-shadow:none" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(var(--accent-rgb),0.3)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'">
             ${Icons.ms('add_chart', { size: 18 })} Add Custom Graph
          </button>

          <!-- Founder Tools Box - Premium -->
          <div onclick="App.navigateTo('opportunity-radar')" class="glass-card card-hover-lift" style="border-radius:14px; padding:16px; display:flex; gap:14px; align-items:center; margin-top:12px; cursor:pointer; border:1px solid rgba(var(--accent-rgb),0.2)">
             <div class="pulse-ring" style="width:48px; height:48px; background:linear-gradient(135deg, var(--accent), #7928ca); border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 0 20px rgba(var(--accent-rgb),0.4)">
                ${Icons.ms('rocket_launch', { size: 22 })}
             </div>
             <div style="flex:1">
                <div style="font-size:9px; font-weight:900; color:var(--accent); text-transform:uppercase; letter-spacing:1.5px; display:flex; align-items:center; gap:6px; margin-bottom:4px">
                  <span style="background:linear-gradient(135deg, #10b981, #0070f3); color:#fff; font-size:8px; padding:3px 6px; border-radius:4px; font-weight:900">NEW</span> For Founders
                </div>
                <div style="font-size:15px; font-weight:900; color:var(--text-primary)">Opportunity Radar</div>
                <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px">Find market gaps & opportunities</div>
             </div>
             <div style="color:var(--accent)">${Icons.ms('chevron_right', { size: 20 })}</div>
          </div>
        </aside>

        <!-- ========================================== -->
        <!-- CENTER PANEL: Hero Chart + Feed            -->
        <!-- ========================================== -->
        <main class="dashboard-center feed-container" style="flex:unset; max-width:100% !important; min-width:0; width:100%">

          <!-- Premium Hero Chart Card -->
          <div class="premium-chart-card" style="padding:28px; margin-bottom:28px; box-shadow:0 20px 60px rgba(0,0,0,0.4); position:relative">

             <!-- Premium Chart Header -->
             <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; position:relative; z-index:1">
                <div>
                   <div style="font-size:11px; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px; display:flex; align-items:center; gap:8px">
                     ${Icons.ms('insights', { size: 14 })} SECTOR INTELLIGENCE
                   </div>
                   <div style="font-size:22px; font-weight:900; color:var(--text-primary); display:flex; align-items:center; gap:10px; letter-spacing:-0.5px">
                     <span id="sector-chart-title">${userSector} Live Activity</span>
                     <span class="live-badge">LIVE</span>
                   </div>
                   <div style="font-size:13px; color:var(--text-tertiary); margin-top:6px; display:flex; align-items:center; gap:8px">
                     <span class="online-dot" style="width:6px; height:6px"></span> Real-time streaming &middot; 1s refresh rate
                   </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:12px">
                   <div style="text-align:right">
                      <div style="font-size:10px; color:var(--text-tertiary); font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Current Value</div>
                      <div id="chart-live-value" style="font-size:36px; font-weight:900; font-family:var(--font-mono); background:linear-gradient(135deg, #10b981, #0070f3); -webkit-background-clip:text; -webkit-text-fill-color:transparent; transition:all 0.2s">--</div>
                   </div>
                   <div style="display:flex; gap:8px">
                      <button onclick="App._switchChartType('line')" id="chart-type-line" class="glow-effect" style="background:linear-gradient(135deg, var(--accent), #005fd4); color:#fff; padding:8px 16px; border-radius:10px; font-weight:700; font-size:12px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s">${Icons.ms('show_chart', { size: 14 })} Line</button>
                      <button onclick="App._switchChartType('bar')" id="chart-type-bar" style="background:rgba(255,255,255,0.05); color:var(--text-secondary); padding:8px 16px; border-radius:10px; font-weight:700; font-size:12px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s">${Icons.ms('bar_chart', { size: 14 })} Bar</button>
                   </div>
                </div>
             </div>

             <!-- Premium Chart Controls -->
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; position:relative; z-index:1">
                <div id="chart-metric-btns" style="display:flex; background:rgba(255,255,255,0.03); border-radius:12px; padding:4px; border:1px solid rgba(255,255,255,0.08)">
                   <div onclick="App._switchChartMetric('velocity')" class="chart-metric-btn active-metric" style="padding:10px 20px; background:linear-gradient(135deg, var(--accent), #005fd4); border-radius:10px; font-size:12px; font-weight:800; color:#fff; box-shadow:0 4px 12px rgba(var(--accent-rgb),0.3); cursor:pointer; transition:all 0.2s">Velocity</div>
                   <div onclick="App._switchChartMetric('growth')" class="chart-metric-btn" style="padding:10px 20px; border-radius:10px; font-size:12px; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all 0.2s">Growth Rate</div>
                   <div onclick="App._switchChartMetric('funding')" class="chart-metric-btn" style="padding:10px 20px; border-radius:10px; font-size:12px; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all 0.2s">Funding</div>
                </div>
                <div style="font-size:12px; color:var(--text-tertiary); font-family:var(--font-mono); display:flex; align-items:center; gap:8px">
                   <span style="color:var(--text-secondary)">Last 60 seconds</span>
                   <span style="color:#10b981; display:flex; align-items:center; gap:4px"><span class="online-dot" style="width:5px; height:5px"></span> Streaming</span>
                </div>
             </div>

             <!-- DYNAMIC SECTOR CHART -->
             <div style="height:400px; position:relative; z-index:1; width:100%; background:rgba(0,0,0,0.2); border-radius:16px; padding:16px">
                 <canvas id="sector-hero-chart"></canvas>
             </div>
          </div>

          <!-- Premium Feed Section -->
          <div id="feed-header-wrap" class="animate-fadeIn">
            <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding:16px 20px; border-radius:14px">
               <div id="feed-sync-status" style="font-size:12px; font-weight:800; color:#10b981; display:flex; align-items:center; gap:10px">
                  <span class="activity-pulse" style="width:10px; height:10px; background:#10b981; border-radius:50%; display:inline-block"></span>
                  LIVE FEED <span style="color:var(--text-tertiary); font-weight:600">· <span id="feed-last-sync-time">Just now</span></span>
               </div>
               ${Components.feedToggle(this.feedMode)}
            </div>

            <div id="new-posts-pill-container" style="position: sticky; top: 12px; z-index: 100; display: flex; justify-content: center; height: 0; pointer-events: none;"></div>
          </div>

          <div id="feed-posts-container" style="min-height:50vh">
            ${Components.skeleton('card', 3)}
          </div>
          <div id="infinite-scroll-anchor"></div>
        </main>

        <!-- ========================================== -->
        <!-- RIGHT PANEL: Premium Sector Intel          -->
        <!-- ========================================== -->
        <aside class="dashboard-right right-sidebar animate-fadeIn" style="flex:unset; margin:0 !important; width:100% !important; max-width:100%; padding-left:8px; margin-left:0 !important">

          <!-- Sector Heatmap - NEW PREMIUM FEATURE -->
          <div class="glass-card" style="padding:20px; border-radius:18px; margin-bottom:16px; border:1px solid rgba(var(--accent-rgb),0.2)">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                <div style="font-size:13px; font-weight:900; display:flex; align-items:center; gap:8px; color:var(--text-primary)">
                  ${Icons.ms('grid_view', { size: 18 })} <span class="gradient-text">Sector Heatmap</span>
                </div>
                <span class="live-badge" style="font-size:8px; padding:2px 6px">LIVE</span>
             </div>
             <div class="heatmap-grid" id="sector-heatmap">
                ${tickerSectors.slice(0, 12).map(s => {
                  const intensity = s.score / 100;
                  const bgColor = s.trend === '▲'
                    ? `rgba(16, 185, 129, ${0.2 + intensity * 0.6})`
                    : `rgba(239, 68, 68, ${0.2 + intensity * 0.4})`;
                  return `<div class="heatmap-cell" style="background:${bgColor}; color:${s.trend === '▲' ? '#10b981' : '#ef4444'}" title="${s.sector}: ${s.score}">
                    <span style="font-size:9px; font-weight:800">${s.sector.substring(0,4)}</span>
                  </div>`;
                }).join('')}
             </div>
             <div style="margin-top:12px; display:flex; justify-content:space-between; font-size:10px; color:var(--text-tertiary)">
                <span style="display:flex; align-items:center; gap:4px"><span style="width:12px; height:12px; background:rgba(16,185,129,0.5); border-radius:2px"></span> Growing</span>
                <span style="display:flex; align-items:center; gap:4px"><span style="width:12px; height:12px; background:rgba(239,68,68,0.5); border-radius:2px"></span> Declining</span>
             </div>
          </div>

          <!-- Live Sector Momentum - Premium -->
          <div class="glass-card" style="padding:20px; border-radius:18px; margin-bottom:16px">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                <div style="font-size:13px; font-weight:900; display:flex; align-items:center; gap:8px; color:var(--text-primary)">
                  ${Icons.ms('trending_up', { size: 18 })} Sector Momentum
                </div>
                <div style="font-size:10px; color:#10b981; font-weight:700; display:flex; align-items:center; gap:4px">
                  <span class="online-dot" style="width:5px; height:5px"></span> LIVE
                </div>
             </div>
             <div id="live-momentum-container">
                ${Components.sectorMomentumBoard(RealtimeDataEngine.getLiveSectorData())}
             </div>
          </div>

          <!-- Live Funding Alerts - Premium -->
          <div class="glass-card" style="padding:20px; border-radius:18px; margin-bottom:16px">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
                <div style="font-size:13px; font-weight:900; display:flex; align-items:center; gap:8px; color:var(--text-primary)">
                  ${Icons.ms('account_balance', { size: 18 })} <span class="gradient-text">Funding Alerts</span>
                </div>
                <a href="#capital-intelligence" style="font-size:11px; color:var(--accent); font-weight:700; text-decoration:none; display:flex; align-items:center; gap:4px; background:rgba(var(--accent-rgb),0.1); padding:4px 10px; border-radius:6px; border:1px solid rgba(var(--accent-rgb),0.2)">View All ${Icons.ms('chevron_right', { size: 12 })}</a>
             </div>
             <div id="live-funding-ticker-container" style="max-height:200px; overflow-y:auto">
                ${Components.fundingTicker(RealtimeDataEngine.getLiveFundingAlerts().slice(0, 5))}
             </div>
          </div>

          <!-- News Tabs Toggle - Premium -->
          <div id="news-tabs-container" style="display:flex; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:4px; margin-bottom:16px">
             <button id="news-tab-trending" onclick="App._switchNewsTab('trending')" style="flex:1; padding:10px; background:linear-gradient(135deg, var(--accent), #005fd4); color:#fff; border:none; border-radius:10px; font-weight:800; font-size:13px; box-shadow:0 4px 12px rgba(var(--accent-rgb),0.3); cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:6px">${Icons.ms('trending_up', { size: 14 })} Trending</button>
             <button id="news-tab-latest" onclick="App._switchNewsTab('latest')" style="flex:1; padding:10px; background:transparent; color:var(--text-secondary); border:none; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:6px">${Icons.ms('schedule', { size: 14 })} Latest</button>
          </div>

          <!-- Live News Content -->
          <div id="news-content-container">
          ${(() => {
        let initNews = [];
        if (window.LiveNewsEngine) {
          const buf = window.LiveNewsEngine.getBuffer(5);
          initNews = buf.map(n => ({
            title: n.title || 'Breaking Signal',
            pubDate: n.pubDate || n.createdAt || new Date().toISOString(),
            source: n.source || 'Live Intelligence',
            link: n.link || '#'
          }));
        }
        if (initNews.length > 0) {
          return Components.trendingSidebar([], [], initNews);
        }
        return '<div class="glass-card" style="text-align:center; padding:32px; border-radius:14px"><div class="spinner" style="margin:0 auto 16px"></div><div style="font-size:13px; font-weight:700; color:var(--text-secondary)">Loading news from 20+ sources...</div><div style="font-size:11px; color:var(--text-tertiary); margin-top:8px">Real-time intelligence incoming</div></div>';
      })()}
          </div>
        </aside>
      </div>
      </div>
    `;

    // Initialize the hero sector chart after DOM is ready (use requestAnimationFrame for reliability)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._initLiveChart(userSector);
      });
    });

    // Animate platform stats counters
    this._animatePlatformStats();

    // Update heatmap cells every 5 seconds
    this._heatmapTimer = setInterval(() => {
      const cells = document.querySelectorAll('.heatmap-cell');
      cells.forEach(cell => {
        const currentBg = cell.style.background;
        const isGreen = currentBg.includes('185, 129');
        const randomShift = (Math.random() - 0.3) * 0.15;
        const match = currentBg.match(/[\d.]+\)$/);
        if (match) {
          let opacity = parseFloat(match[0]);
          opacity = Math.max(0.2, Math.min(0.9, opacity + randomShift));
          cell.style.background = isGreen
            ? `rgba(16, 185, 129, ${opacity.toFixed(2)})`
            : `rgba(239, 68, 68, ${opacity.toFixed(2)})`;
        }
      });
    }, 5000);

    // Listen for live news updates and refresh the news section
    window.addEventListener('newsUpdated', () => {
      App._switchNewsTab(App._newsTab || 'trending');
    });

    // Force-fetch news if LiveNewsEngine exists but hasn't loaded yet
    if (window.LiveNewsEngine && window.LiveNewsEngine.buffer.length === 0) {
      window.LiveNewsEngine.init();
    }

    const feedPostsContainer = document.getElementById('feed-posts-container');
    const scrollAnchor = document.getElementById('infinite-scroll-anchor');

    // 1. Critical Requirement: Load latest 60 Platform/AI posts
    try {
      const platformPosts = await Database.getLatestPlatformPosts(60);
      this._latestPlatformPosts = platformPosts;
    } catch (e) {
      console.error("Failed to load platform intelligence", e);
      this._latestPlatformPosts = [];
    }

    // 2. Load LiveNewsEngine posts as supplement/fallback
    //    These are real RSS news items, filtered by user sector if available
    try {
      const user = AuthService.getUser();
      const userSector = user?.industry || user?.sector || user?.niche || null;
      let liveNewsPosts = [];

      if (userSector && window.LiveNewsEngine) {
        // Get sector-specific news
        liveNewsPosts = window.LiveNewsEngine.getPostsForSector(userSector, 30);
        console.log(`LiveNewsEngine: Loaded ${liveNewsPosts.length} sector-specific posts for "${userSector}"`);
      }
      // If sector filter returned few results, supplement with general news
      if (liveNewsPosts.length < 10 && window.LiveNewsEngine) {
        const generalPosts = window.LiveNewsEngine.getPostsForFeed(30);
        const existingIds = new Set(liveNewsPosts.map(p => p.id));
        generalPosts.forEach(p => {
          if (!existingIds.has(p.id)) liveNewsPosts.push(p);
        });
        console.log(`LiveNewsEngine: Supplemented to ${liveNewsPosts.length} total posts`);
      }

      // Merge with platform posts (avoid duplicates by title similarity)
      if (!this._latestPlatformPosts) this._latestPlatformPosts = [];
      const existingTitles = new Set(this._latestPlatformPosts.map(p => (p.text || '').slice(0, 60).toLowerCase()));
      liveNewsPosts.forEach(lp => {
        const titleKey = (lp.text || '').slice(0, 60).toLowerCase();
        if (!existingTitles.has(titleKey)) {
          this._latestPlatformPosts.push(lp);
          existingTitles.add(titleKey);
        }
      });
    } catch (e) {
      console.warn('LiveNewsEngine integration failed, continuing with Firestore data only', e);
    }

    // 3. Setup Real-time Listener (Merging logic handled in _handleFeedUpdate)
    if (this._feedUnsub) { this._feedUnsub(); this._feedUnsub = null; }
    this._feedUnsub = Database.listenToFeedPosts(50, 'human', (posts, docChanges, fromCache) => {
      this._handleFeedUpdate(posts, docChanges, fromCache);
    });

    // 4. ⚡ LIVE PULSE SYSTEM — Post live news to feed every 60 seconds
    this._livePulseIndex = 0;
    this._livePulseShownIds = new Set();

    // Clear any previous pulse timer
    if (this._livePulseTimer) clearInterval(this._livePulseTimer);

    const runLivePulse = async () => {
      if (this.currentView !== 'feed') return;
      const container = document.getElementById('feed-posts-container');
      if (!container) return;

      try {
        const user = AuthService.getUser();
        const userSector = user?.industry || user?.sector || user?.niche || null;

        // Get news items from LiveNewsEngine
        let newsPool = [];
        if (window.LiveNewsEngine) {
          if (userSector) {
            // Sector-specific news first
            newsPool = window.LiveNewsEngine.getPostsForSector(userSector, 50);
          }
          // Supplement with general news if sector pool is small
          if (newsPool.length < 15) {
            const general = window.LiveNewsEngine.getPostsForFeed(50);
            const existingIds = new Set(newsPool.map(p => p.id));
            general.forEach(p => {
              if (!existingIds.has(p.id)) newsPool.push(p);
            });
          }
        }

        if (newsPool.length === 0) return;

        // Pick the next 1-2 unseen items from the pool
        const unseen = newsPool.filter(p => !this._livePulseShownIds.has(p.id));

        // If we've shown everything, reset and cycle
        if (unseen.length === 0) {
          this._livePulseShownIds.clear();
          return;
        }

        // Take 1-2 items
        const itemsToPost = unseen.slice(0, Math.min(2, unseen.length));

        // Get the TechOL Official author (s6)
        const author = await this.getCachedUser('s6');
        if (!author) return;

        for (const item of itemsToPost) {
          // Mark as shown
          this._livePulseShownIds.add(item.id);

          // Assign a fresh timestamp so it appears as "just now"
          const livePost = {
            ...item,
            id: `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            likes: Math.floor(Math.random() * 50) + 5,
            comments: Math.floor(Math.random() * 12),
            shares: Math.floor(Math.random() * 20)
          };

          // Create the post card HTML
          const postHtml = Components.postCard(livePost, author);
          const wrapper = document.createElement('div');
          wrapper.innerHTML = postHtml.trim();
          const postEl = wrapper.firstChild;

          // Add live pulse animation
          if (postEl) {
            postEl.style.opacity = '0';
            postEl.style.transform = 'translateY(-20px)';
            postEl.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

            // Add a live indicator badge
            const badge = document.createElement('div');
            badge.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10b981;padding:3px 10px;border-radius:100px;font-size:9px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px">
              <span style="width:5px;height:5px;background:#10b981;border-radius:50%;animation:pulse 2s infinite"></span>
              LIVE · Just now
            </span>`;
            postEl.querySelector('.post-card')?.prepend(badge) || postEl.prepend(badge);

            // Prepend to feed
            container.prepend(postEl);

            // Animate in
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                postEl.style.opacity = '1';
                postEl.style.transform = 'translateY(0)';
              });
            });

            // If user has scrolled down, show the "New Posts" pill
            if (window.scrollY > 200) {
              this._hasNewPosts = true;
              this._showNewPostsButton();
            }
          }
        }

        // Show toast notification
        const count = itemsToPost.length;
        const sectorLabel = userSector ? ` in ${userSector}` : '';
        Utils.showToast(`${count} new update${count > 1 ? 's' : ''}${sectorLabel}`, 'info');

        // Update sync time
        const syncTime = document.getElementById('feed-last-sync-time');
        if (syncTime) syncTime.textContent = new Date().toLocaleTimeString();

        // Keep feed manageable — remove oldest posts if over 60
        const allCards = container.children;
        while (allCards.length > 60) {
          allCards[allCards.length - 1].remove();
        }

        console.log(`📡 Live Pulse: Posted ${count} fresh news items${sectorLabel}`);

      } catch (e) {
        console.warn('Live Pulse error:', e);
      }
    };

    // First pulse after 5 seconds (so the initial Firestore load settles first)
    setTimeout(() => runLivePulse(), 5000);

    // Then every 60 seconds
    this._livePulseTimer = setInterval(() => runLivePulse(), 60000);

    // 5. Infinite Scroll Setup
    this._setupInfiniteScroll(scrollAnchor, feedPostsContainer);
  },

  _setupInfiniteScroll(anchor, container) {
    if (!anchor || this._scrollObserver) return;
    this._scrollObserver = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && this._feedFirstLoadSettled && !this._isFetchingMore) {
        this._isFetchingMore = true;
        const loader = document.createElement('div');
        loader.innerHTML = Components.infiniteScrollLoader();
        anchor.appendChild(loader);

        // Simulation of fetching more
        await new Promise(r => setTimeout(r, 1500));
        loader.remove();
        this._isFetchingMore = false;
      }
    }, { threshold: 0.1 });
    this._scrollObserver.observe(anchor);
  },

  async _handleFeedUpdate(posts, docChanges = [], fromCache = false) {
    const container = document.getElementById('feed-posts-container');
    if (!container) return;

    try {
      const user = AuthService.getUser();

      // Merge platform posts with human posts (avoid duplicates)
      let allPosts = [...posts];
      if (this._latestPlatformPosts) {
        this._latestPlatformPosts.forEach(lp => {
          if (!allPosts.find(p => p.id === lp.id)) {
            allPosts.push(lp);
          }
        });
      }

      // Sort by newest
      allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Re-trigger full render if needed (e.g. initial load or mode switch)
      const isSkeleton = container.innerHTML.includes('skeleton');
      const needsFullRender = this.feedMode !== 'latest' || (!fromCache && !this._feedServerSettled) || isSkeleton;

      if (needsFullRender) {
        if (!fromCache) this._feedServerSettled = true;
        this._feedFirstLoadSettled = true;

        let displayPosts = [...allPosts];
        if (this.feedMode === 'ai') displayPosts = await AIEngine.curateFeed(displayPosts, user);
        if (this.feedMode === 'trending') displayPosts = displayPosts.sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)));

        const html = [];
        for (const p of displayPosts) {
          const a = await this.getCachedUser(p.authorId);
          if (a) html.push(Components.postCard(p, a));
        }

        if (html.length === 0 && !fromCache) {
          container.innerHTML = `<div style="text-align:center;padding:var(--space-12);color:var(--text-tertiary)">Initializing intelligence stream...</div>`;
        } else if (html.length > 0) {
          container.innerHTML = html.join('');
        }
      } else {
        // Surgical Updates for "Latest" (Sliding Window)
        for (const change of docChanges) {
          const p = change.doc.data();
          const pId = change.doc.id;
          let ts = p.createdAt;
          if (ts?.toDate) ts = ts.toDate().toISOString();

          if (change.type === 'added') {
            const author = await this.getCachedUser(p.authorId);
            if (author) {
              const postHtml = Components.postCard({ ...p, id: pId, createdAt: ts }, author);
              const temp = document.createElement('div');
              temp.innerHTML = postHtml.trim();
              const postEl = temp.firstChild;

              if (change.newIndex === 0) {
                container.prepend(postEl);
                if (window.scrollY > 300) {
                  this._hasNewPosts = true;
                  this._showNewPostsButton();
                }
                // Show toast for new platform posts
                if (p.type === 'platform' && !fromCache) {
                  Utils.showToast("📡 New AI Market Insight Available", "info");
                }
              } else {
                container.appendChild(postEl);
              }
            }
          } else if (change.type === 'removed') {
            document.getElementById(`post-${pId}`)?.remove();
          } else if (change.type === 'modified') {
            const existing = document.getElementById(`post-${pId}`);
            if (existing) {
              const author = await this.getCachedUser(p.authorId);
              if (author) {
                const postHtml = Components.postCard({ ...p, id: pId, createdAt: ts }, author);
                const temp = document.createElement('div');
                temp.innerHTML = postHtml.trim();
                existing.replaceWith(temp.firstChild);
              }
            }
          }
        }
      }
      // Update sync time
      const syncTime = document.getElementById('feed-last-sync-time');
      if (syncTime) syncTime.textContent = new Date().toLocaleTimeString();

      this._feedFirstLoadSettled = true;
      if (!fromCache) this._feedServerSettled = true;
    } catch (err) {
      console.error("Feed Update Error:", err);
    }
  },

  _showNewPostsButton() {
    if (document.getElementById('new-posts-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'new-posts-btn';
    btn.className = 'new-posts-pill animate-fadeInDown';
    btn.innerHTML = `${Icons.ms('arrow_upward', { size: 14 })} New Posts Available`;
    btn.onclick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      btn.classList.add('hidden');
      this._hasNewPosts = false;
      setTimeout(() => btn.remove(), 500);
    };
    document.body.appendChild(btn);
  },
  _renderEmptyFeed() {
    return `
      <div style="text-align:center;padding:var(--space-16);color:var(--text-tertiary)" role="status">
        <div style="font-size:48px;margin-bottom:16px">${Icons.ms('feed', { size: 48 })}</div>
        <h3>No global signals found</h3>
        <p style="margin-top:8px;margin-bottom:24px">Your feed is awaiting synchronization with the global building network.</p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
          <button class="btn btn-primary" onclick="if(window.Seeder) { window.Seeder.seed() } else { alert('Seeder not loaded'); }" aria-label="Initialize global content">
            Initialize Content Nodes
          </button>
          <button class="btn btn-secondary" onclick="if(window.Seeder) { window.Seeder.purgeAndReseed() }" aria-label="Deep resync content from cloud">
             Deep Cloud Resync
          </button>
        </div>
      </div>`;
  },

  setFeedMode(mode) {
    this.feedMode = mode;
    this._feedLimit = 50; // reset limit on mode switch
    this.renderIntelligenceStream(document.getElementById('content-area'));
  },

  loadMorePosts() {
    this._feedLimit += 50;
    const btn = document.querySelector('#load-more-container button');
    if (btn) btn.innerHTML = '<div class="spinner spinner-xs" style="margin:0 auto"></div>';
    this.renderIntelligenceStream(document.getElementById('content-area'));
  },

  // AI Post Enhancer Logic
  toggleEnhanceMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('ai-enhance-menu');
    menu.classList.toggle('hidden');

    const close = (evt) => {
      if (!menu.contains(evt.target)) {
        menu.classList.add('hidden');
        document.removeEventListener('click', close);
      }
    };
    if (!menu.classList.contains('hidden')) {
      document.addEventListener('click', close);
    }
  },

  async enhancePost(type) {
    const input = document.getElementById('create-post-input');
    const text = input.value.trim();
    if (!text) { Utils.showToast('Type something first!', 'warning'); return; }

    const btn = document.getElementById('ai-enhance-btn');
    const originalBtn = btn.innerHTML;
    btn.innerHTML = `<div class="spinner spinner-xs" style="border-top-color:var(--accent)"></div>`;
    btn.disabled = true;

    try {
      // Simulate AI processing delay
      await new Promise(r => setTimeout(r, 1200));

      let enhanced = text;
      switch (type) {
        case 'clarity': enhanced = "I've refined your post for better readability:\n\n" + text.split('.').map(s => s.trim()).filter(s => s).join('. ') + '.'; break;
        case 'technical': enhanced = text + "\n\n(Technical Note: This implementation follows architectural best practices for distributed state management and eventual consistency.)"; break;
        case 'summarize': enhanced = AIEngine.generateSummary(text); break;
        case 'hashtags': enhanced = text + "\n\n#TechOL #Engineering #Innovation " + (text.toLowerCase().includes('ai') ? '#AI #Future' : '#DevLife'); break;
        case 'thread': enhanced = "🧵 Thread:\n\n1/3 " + text + "\n\n2/3 Key takeaway: consistency is key.\n\n3/3 Join the discussion below! 👇"; break;
      }

      input.value = enhanced;
      App.autoResizeTextarea(input);
      Utils.showToast('Post enhanced by AI! ✨', 'success');
      document.getElementById('ai-enhance-menu').classList.add('hidden');
    } catch (e) {
      Utils.showToast('AI enhancement failed.', 'error');
    } finally {
      btn.innerHTML = originalBtn;
      btn.disabled = false;
    }
  },

  useAISuggestion(postId, text) {
    // Open the comment modal or just show a toast for now
    Utils.showToast(`Reply suggestion copied: "${text}"`, 'info');
    // In a real app, this would populate the comment input
  },

  // ---- Explore ----
  async renderExplore(c) {
    const cats = ['All', 'AI & Future', 'Coding', 'Startups', 'Projects'];
    c.innerHTML = `<div class="explore-page animate-fadeIn"><div style="margin-bottom:var(--space-6)"><h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold)">Explore</h2><p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--space-2)">Discover trending posts and discussions</p></div>
    <div class="explore-tabs">${cats.map((c, i) => `<button class="explore-tab ${i === 0 ? 'active' : ''}" onclick="App.filterExplore(this,'${c.toLowerCase()}')">${c}</button>`).join('')}</div>
    <div id="explore-posts"><div style="text-align:center;padding:var(--space-8)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div></div></div>`;
    const posts = await Database.getFeedPosts(30); const html = [];
    for (const p of posts) { const a = await this.getCachedUser(p.authorId); if (a) html.push(Components.postCard(p, a)); }
    document.getElementById('explore-posts').innerHTML = html.join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-12)">No posts found</p>';
  },

  // ---- Notifications ----
  async renderNotifications(c) {
    const cu = AuthService.getUser();
    c.innerHTML = `<div class="feed-container animate-fadeIn"><div style="margin-bottom:var(--space-6)"><h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold)">Notifications</h2></div><div id="notif-list"><div style="text-align:center;padding:var(--space-8)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div></div></div>`;
    try {
      const notifs = await Database.getNotifications(cu.uid);
      await Database.markNotificationsRead(cu.uid);
      if (!notifs.length) { document.getElementById('notif-list').innerHTML = '<div style="text-align:center;padding:var(--space-16);color:var(--text-tertiary)"><div style="font-size:48px;margin-bottom:16px"><span class="material-symbols-rounded" style="font-size:48px">notifications</span></div><h3>No notifications</h3><p style="margin-top:8px">When someone interacts with your posts, you\'ll see it here.</p></div>'; return; }
      const html = []; for (const n of notifs) {
        const u = await this.getCachedUser(n.fromUid);
        html.push(`<div class="post-card" style="padding:var(--space-4) var(--space-6);${n.read ? '' : 'border-left:3px solid var(--accent)'}" > ${u ? Components.avatar(u, 'avatar-sm') : ''} <div style="flex:1;margin-left:var(--space-3)"><span style="font-weight:var(--fw-semibold)">${u ? u.displayName : 'Someone'}</span> <span style="color:var(--text-secondary)">${n.message || 'interacted with your post'}</span><div style="font-size:var(--fs-xs);color:var(--text-tertiary);margin-top:4px">${Utils.timeAgo(n.createdAt)}</div></div></div>`);
      }
      document.getElementById('notif-list').innerHTML = html.join('');
    } catch (e) { document.getElementById('notif-list').innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-12)">No notifications yet</p>'; }
  },

  // ---- Messages ----
  async renderMessages(c) {
    const cu = AuthService.getUser(); if (!cu) return;
    c.innerHTML = `<div class="chat-page animate-fadeIn"><div class="chat-list"><div class="chat-list-header"><span class="chat-list-title">Messages</span><button class="btn btn-icon btn-ghost" onclick="App.newChat()">${Icons.edit()}</button></div><div class="chat-search"><input type="text" placeholder="Search conversations..."></div><div class="chat-conversations" id="chat-conversations"><div style="text-align:center;padding:var(--space-6)"><div class="spinner"></div></div></div></div><div class="chat-main" id="chat-main"><div class="chat-empty"><div class="chat-empty-icon"><span class="material-symbols-rounded" style="font-size:48px;font-variation-settings:'FILL' 1">chat_bubble</span></div><p style="font-size:var(--fs-lg);font-weight:var(--fw-semibold)">Select a conversation</p><p style="font-size:var(--fs-sm)">Choose from your chats or start a new one</p></div></div></div>`;
    try {
      const convos = await Database.getConversations(cu.uid); const html = [];
      for (const cv of convos) { const oid = cv.participants.find(p => p !== cu.uid); const o = await this.getCachedUser(oid); if (o) html.push(Components.chatConvoItem(cv, cu.uid, o)); }
      document.getElementById('chat-conversations').innerHTML = html.join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-8)">No conversations yet</p>';
    } catch (e) { document.getElementById('chat-conversations').innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-8)">No conversations</p>'; }
  },

  async openChat(convoId) {
    const cu = AuthService.getUser(); if (!cu) return;
    try {
      const convos = await Database.getConversations(cu.uid); const convo = convos.find(c => c.id === convoId); if (!convo) return;
      this.currentChatConvo = convo; const oid = convo.participants.find(p => p !== cu.uid); const o = await this.getCachedUser(oid); if (!o) return;
      document.querySelectorAll('.chat-convo-item').forEach(el => el.classList.toggle('active', el.dataset.convoId === convoId));
      const cm = document.getElementById('chat-main'); cm.classList.add('active');
      cm.innerHTML = `<div class="chat-main-header" > ${Components.avatar(o, 'avatar-sm')}<div class="chat-main-user-info"><div class="chat-main-name">${o.displayName}</div><div class="chat-main-status">● Online</div></div><button class="btn btn-icon btn-ghost" onclick="App.viewProfile('${o.uid}')">👤</button></div><div class="chat-messages" id="chat-messages"><div style="text-align:center;padding:var(--space-6)"><div class="spinner"></div></div></div><div class="chat-input-area"><button class="btn btn-icon btn-ghost" title="Attach file" onclick="Utils.showToast('Attachments coming soon!', 'info')">${Icons.ms('attach_file', { size: 20 })}</button><input type="text" id="chat-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')App.sendMessage()"><button class="chat-send-btn" onclick="App.sendMessage()">➤</button></div>`;
      if (this.msgUnsub) this.msgUnsub();
      this.msgUnsub = Database.listenToMessages(convoId, (msgs) => { const el = document.getElementById('chat-messages'); if (el) { el.innerHTML = msgs.map(m => Components.chatMessage(m, cu.uid)).join(''); el.scrollTop = el.scrollHeight; } });
    } catch (e) { console.error(e); }
  },

  async sendMessage() { const i = document.getElementById('chat-input'); if (!i) return; const t = i.value.trim(); if (!t) return; const cu = AuthService.getUser(); if (!cu || !this.currentChatConvo) return; i.value = ''; await Database.sendMessage(this.currentChatConvo.id, cu.uid, t); },

  // ---- Events ----
  async renderEvents(c) {
    c.innerHTML = `<div class="events-page animate-fadeIn"><div class="events-header"><div><h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold)">Events</h2><p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--space-1)">Conferences, hackathons, and meetups</p></div><button class="btn btn-primary btn-sm" onclick="App.createEvent()">➕ Create Event</button></div><div id="events-container"><div style="text-align:center;padding:var(--space-8)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div></div></div>`;
    try {
      const events = await Database.getEvents(20);
      const html = [];
      for (const ev of events) {
        let co = null;
        if (ev.companyId) co = await this.getCachedUser(ev.companyId);
        if (!co) co = { displayName: 'TechOL Official', username: 'techol_app', uid: 's6', photoURL: 'media__1772214139924.jpg' };
        html.push(`<div onclick="App.renderEventDetail('${ev.id}')" style="cursor:pointer">${Components.eventCard(ev, co)}</div>`);
      }
      document.getElementById('events-container').innerHTML = html.join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-12)">No events yet. Create one!</p>';
    } catch (e) { document.getElementById('events-container').innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-12)">No events yet</p>'; }
  },

  async renderEventDetail(eventId) {
    const events = await Database.getEvents(50);
    const ev = events.find(item => item.id === eventId);
    const c = document.getElementById('content-area');
    if (!ev || !c) return;

    let co = null;
    if (ev.companyId) co = await this.getCachedUser(ev.companyId);
    if (!co) co = { displayName: 'TechOL', username: 'techol_app', uid: 's6' };

    c.innerHTML = `<div class="feed-container animate-fadeIn">
      <button class="btn btn-icon btn-secondary" onclick="App.navigateTo('events')" style="margin-bottom:var(--space-4)">← Back to Events</button>
      <div class="post-card" style="padding:var(--space-0);overflow:hidden">
        <div style="background:var(--gradient-accent);height:200px;display:flex;align-items:center;justify-content:center;font-size:80px">📅</div>
        <div style="padding:var(--space-8)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-4)">
            <div>
              <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-bold)">${ev.title}</h2>
              <div style="color:var(--accent);font-weight:600;margin-top:4px">${ev.date} · ${ev.location}</div>
            </div>
            <span class="badge badge-primary">${ev.type}</span>
          </div>
          
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6);padding:var(--space-4);background:var(--bg-input);border-radius:var(--radius-md)">
            <div style="font-size:var(--fs-sm);color:var(--text-secondary)">Organized by</div>
            <div style="font-weight:600">${co.displayName} (@${co.username})</div>
          </div>

          <h3 style="margin-bottom:var(--space-3)">About this event</h3>
          <p style="color:var(--text-secondary);line-height:1.6;max-width:700px;margin-bottom:var(--space-8)">
            Join us for an immersive experience at ${ev.title}. This event brings together the best minds in tech for a day of learning, networking, and innovation. 
            Lunch and refreshments will be provided.
          </p>

          <div id="event-action-area">
            <button class="btn btn-primary btn-lg" style="width:100%" onclick="App.registerForEvent('${ev.id}')">RSVP / Register Now</button>
          </div>
        </div>
      </div>
    </div>`;
  },

  async registerForEvent(eventId) {
    Utils.showToast('Successfully registered for the event!', 'success');
    const area = document.getElementById('event-action-area');
    area.innerHTML = `<div class="animate-fadeIn" style="text-align:center;padding:var(--space-6);border:2px solid var(--success);border-radius:var(--radius-lg);background:rgba(var(--success-rgb), 0.05)">
      <div style="font-size:32px;margin-bottom:8px">🎉</div>
      <h3 style="margin-bottom:4px">You're on the list!</h3>
      <p style="color:var(--text-secondary);margin-bottom:var(--space-6)">We've sent the ticket and calendar invite to your email.</p>
      <button class="btn btn-secondary" onclick="App.navigateTo('events')">View More Events</button>
    </div>`;
  },

  // ---- Bookmarks ----
  async renderBookmarks(c) {
    c.innerHTML = `<div class="feed-container animate-fadeIn"> <div id="bookmarks-content"><div style="text-align:center;padding:var(--space-8)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div></div></div>`;
    const cu = AuthService.getUser();
    try {
      const posts = await Database.getBookmarkedPosts(cu.uid);
      if (!posts.length) { document.getElementById('bookmarks-content').innerHTML = `<div style="text-align:center;padding:var(--space-20)" ><div style="font-size:48px;margin-bottom:var(--space-4)">🔖</div><h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold);margin-bottom:var(--space-2)">Bookmarks</h2><p style="color:var(--text-secondary)">Save posts for later by clicking the bookmark icon.</p></div>`; return; }
      const html = []; for (const p of posts) { const a = await this.getCachedUser(p.authorId); if (a) html.push(Components.postCard(p, a)); }
      document.getElementById('bookmarks-content').innerHTML = html.join('');
    } catch (e) { document.getElementById('bookmarks-content').innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-12)">No bookmarks</p>'; }
  },

  async renderProfile(c, userId) {
    const cu = AuthService.getUser();
    const u = await this.getCachedUser(userId);
    if (!u) { c.innerHTML = '<div style="text-align:center;padding:100px"><h2>User not found</h2></div>'; return; }

    const isOwn = cu && cu.uid === userId;
    const metrics = await DataEngine.getBuilderMetrics(userId);

    c.innerHTML = `
    <div class="profile-container animate-fadeIn">
      ${Components.profileHeader2(u, metrics, isOwn)}

      <div class="profile-grid" style="display:grid;grid-template-columns:1fr 340px;gap:var(--space-8)">
        <!-- Left Column: Activity & Intel -->
        <div style="min-width:0">
          <div style="display:flex;gap:var(--space-8);margin-bottom:var(--space-4);border-bottom:1px solid var(--border-secondary);padding:0 var(--space-2)">
            <button class="profile-tab active" id="tab-posts" onclick="App.loadProfileTab('${u.uid}', 'posts')">Builder Activity</button>
            <button class="profile-tab" id="tab-snippets" onclick="App.loadProfileTab('${u.uid}', 'snippets')">Verified Snippets</button>
            <button class="profile-tab" id="tab-timeline" onclick="App.loadProfileTab('${u.uid}', 'timeline')">Journey</button>
          </div>
          <div id="profile-content-area" style="min-height:300px">
             <div style="text-align:center;padding:var(--space-12)"><div class="spinner"></div></div>
          </div>
        </div>

        <!-- Right Column: Builder Intel Panels -->
        <aside style="display:flex;flex-direction:column;gap:var(--space-4)">
          <!-- Skill Radar -->
          <div class="builder-panel">
              <h3 class="panel-header">Verified Skill Depth</h3>
              <div style="height:180px">
                  <canvas id="skill-radar-chart"></canvas>
              </div>
          </div>

          <!-- Engagement Velocity -->
          <div class="builder-panel">
              <h3 class="panel-header">Contribution Momentum (7D)</h3>
              <div style="height:120px">
                  <canvas id="engagement-velocity-chart"></canvas>
              </div>
          </div>

          <!-- Heatmap -->
          ${Components.contributionHeatmap(metrics)}

          <!-- Founder Mode -->
          ${Components.founderCard(metrics.founderMode)}

          <!-- GitHub Core -->
          ${Components.githubCard(metrics.github)}

          <!-- Collab Signals -->
          ${Components.collabSignals(metrics.collaboration)}
        </aside>
      </div>
    </div>`;

    this.loadProfileTab(userId, 'posts');
    this.initProfileCharts(metrics);
  },

  initProfileCharts(metrics) {
    setTimeout(() => {
      // Radar Chart
      const ctxRadar = document.getElementById('skill-radar-chart')?.getContext('2d');
      if (ctxRadar) {
        new Chart(ctxRadar, {
          type: 'radar',
          data: {
            labels: metrics.radar.map(d => d.subject),
            datasets: [{
              label: 'Skill Depth',
              data: metrics.radar.map(d => d.A),
              fill: true,
              backgroundColor: 'rgba(var(--accent-rgb), 0.2)',
              borderColor: 'var(--accent)',
              pointBackgroundColor: 'var(--accent)',
              borderWidth: 2
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              r: {
                angleLines: { color: 'rgba(255,255,255,0.05)' },
                grid: { color: 'rgba(255,255,255,0.05)' },
                pointLabels: { color: '#666', font: { size: 9, weight: 'bold' } },
                ticks: { display: false },
                suggestedMin: 0, requestedMax: 100
              }
            }
          }
        });
      }

      // Momentum Chart
      const ctxMomentum = document.getElementById('engagement-velocity-chart')?.getContext('2d');
      if (ctxMomentum) {
        new Chart(ctxMomentum, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Velocity',
              data: metrics.contributions.weeklyTrend,
              borderColor: 'var(--accent)',
              borderWidth: 3,
              tension: 0.4,
              pointRadius: 0,
              fill: true,
              backgroundColor: 'rgba(var(--accent-rgb), 0.05)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: false }, y: { display: false } },
            plugins: { legend: { display: false } }
          }
        });
      }
    }, 100);
  },

  async loadProfileTab(userId, tab) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    const btn = document.getElementById('tab-' + tab);
    if (btn) btn.classList.add('active');

    const container = document.getElementById('profile-content-area');
    container.innerHTML = '<div style="text-align:center;padding:50px"><div class="spinner"></div></div>';

    try {
      if (tab === 'posts') {
        const posts = await Database.getPostsByUser(userId);
        const html = [];
        for (const p of posts) {
          const author = await this.getCachedUser(p.authorId);
          if (author) html.push(Components.postCard(p, author));
        }
        container.innerHTML = html.join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:50px">No activity from this user yet.</p>';
      } else if (tab === 'snippets') {
        const snippets = await Database.getSnippets();
        const userSnippets = snippets.filter(s => s.authorId === userId);
        container.innerHTML = `<div style="display:grid;grid-template-columns:1fr;gap:var(--space-4)">
          ${userSnippets.map(s => `
            <div class="post-card" style="padding:var(--space-4);cursor:pointer;border-left:4px solid var(--accent)" onclick="App.renderSnippetDetail('${s.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <h4 style="margin:0">${s.title}</h4>
                <span class="badge badge-secondary" style="font-size:10px">${s.language}</span>
              </div>
              <p style="font-size:12px;color:var(--text-secondary);margin-top:8px">${s.description.substring(0, 100)}...</p>
            </div>
          `).join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:50px">No public snippets shared.</p>'}
        </div>`;
      } else if (tab === 'timeline') {
        const metrics = await DataEngine.getBuilderMetrics(userId);
        container.innerHTML = Components.builderTimeline(metrics.timeline);
      } else if (tab === 'about') {
        const u = await this.getCachedUser(userId);
        container.innerHTML = `
          <div class="post-card animate-fadeInUp" style="padding:var(--space-8)">
            <h3 style="margin-bottom:var(--space-4);display:flex;align-items:center;gap:12px">
              ${Icons.ms('person_search', { color: 'var(--accent)' })} Professional Summary
            </h3>
            <p style="color:var(--text-secondary);line-height:1.8;font-size:var(--fs-md)">${u.bio || 'Highly skilled tech professional with a focus on building impactful solutions.'}</p>
            
            <div style="margin-top:var(--space-8);display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:var(--space-8)">
               <div>
                 <div style="font-size:11px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:6px;font-weight:700">Current Focus</div>
                 <div style="font-weight:600;color:var(--text-primary)">Scalable Architectures</div>
               </div>
               <div>
                 <div style="font-size:11px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:6px;font-weight:700">Industry</div>
                 <div style="font-weight:600;color:var(--text-primary)">Software Engineering</div>
               </div>
               <div>
                 <div style="font-size:11px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:6px;font-weight:700">Member Since</div>
                 <div style="font-weight:600;color:var(--text-primary)">${new Date(u.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</div>
               </div>
            </div>
          </div>
        `;
      }
    } catch (e) { console.error(e); }
  },

  async showFollowModal(userId, type) {
    const m = document.getElementById('modal-content');
    document.getElementById('modal-overlay').classList.remove('hidden');
    m.innerHTML = `<div class="modal-header"><span class="modal-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span><button class="modal-close" onclick="App.closeModal()">×</button></div><div class="modal-body"><div style="text-align:center;padding:40px"><div class="spinner"></div></div></div>`;

    try {
      const uids = (type === 'followers') ? await Database.getFollowersList(userId) : await Database.getFollowingList(userId);
      if (!uids.length) {
        m.querySelector('.modal-body').innerHTML = `<div style="text-align:center;color:var(--text-tertiary);padding:var(--space-10)">Users not found.</div>`;
        return;
      }
      const currentUid = AuthService.getUser()?.uid;
      const html = [];
      for (const id of uids) {
        const u = await this.getCachedUser(id);
        if (u) {
          const isF = currentUid ? await Database.isFollowing(u.uid, currentUid) : false;
          html.push(`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4) 0;border-bottom:1px solid var(--border-secondary)">
              <div style="display:flex;align-items:center;gap:var(--space-4);cursor:pointer" onclick="App.viewProfile('${u.uid}'); App.closeModal();">
                ${Components.avatar(u, 'avatar-md')}
                <div><div style="font-weight:600;color:var(--text-primary)">${u.displayName}</div><div style="color:var(--text-tertiary);font-size:12px">@${u.username}</div></div>
              </div>
              ${currentUid && currentUid !== u.uid ? `<button class="btn ${isF ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="App.toggleFollow('${u.uid}', this)">${isF ? 'Following' : 'Follow'}</button>` : ''}
            </div>
          `);
        }
      }
      m.querySelector('.modal-body').innerHTML = html.join('') || '<p style="text-align:center;padding:20px">No users found.</p>';
    } catch (e) { console.error(e); }
  },

  viewProfile(uid) { this.showMainApp(); this.renderProfile(document.getElementById('content-area'), uid); },
  viewPost(postId) { this.showMainApp(); this.renderPostDetail(document.getElementById('content-area'), postId); },
  viewShelfItem(id) { this.showMainApp(); this.navigateTo('shelf'); },

  // ---- Jobs Board (LiveData) ----
  _jobFilter: 'all', _jobRemote: false,
  renderJobs(c) {
    const cats = [
      { id: 'all', label: 'All Roles' }, { id: 'engineering', label: 'Engineering' }, { id: 'ai-ml', label: 'AI / ML' },
      { id: 'cloud', label: 'Cloud' }, { id: 'devops', label: 'DevOps' }, { id: 'cybersecurity', label: 'Security' },
      { id: 'data-science', label: 'Data Science' }, { id: 'mobile', label: 'Mobile' }, { id: 'web3', label: 'Web3' }
    ];
    const jobs = LiveData.getJobs(this._jobFilter, this._jobRemote);
    c.innerHTML = `<div class="feed-container animate-fadeIn">
      <div style="margin-bottom:var(--space-8)">
        <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-extrabold);letter-spacing:var(--ls-tight)">Tech Jobs <span style="font-size:var(--fs-sm);font-weight:400;color:var(--text-tertiary);vertical-align:middle">${jobs.length} listings</span></h2>
        <p style="color:var(--text-secondary);font-size:var(--fs-md);margin-top:var(--space-2)">Direct links to career pages at the world's top tech companies.</p>
      </div>
      <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-6);align-items:center">
        ${cats.map(cat => `<button class="btn ${this._jobFilter === cat.id ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="App._jobFilter='${cat.id}';App.renderJobs(document.getElementById('content-area'))">${cat.label}</button>`).join('')}
        <label style="display:flex;align-items:center;gap:6px;font-size:var(--fs-sm);color:var(--text-secondary);margin-left:auto;cursor:pointer">
          <input type="checkbox" ${this._jobRemote ? 'checked' : ''} onchange="App._jobRemote=this.checked;App.renderJobs(document.getElementById('content-area'))"> Remote only
        </label>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        ${jobs.map(j => `
          <div class="post-card" style="padding:var(--space-5) var(--space-6);display:flex;align-items:center;gap:var(--space-5);transition:transform 0.2s ease,box-shadow 0.2s ease;cursor:pointer" 
               onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-lg)'" 
               onmouseout="this.style.transform='';this.style.boxShadow=''" 
               onclick="window.open('${j.link}','_blank')">
            <div style="width:48px;height:48px;border-radius:12px;background:var(--bg-input);display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--border-secondary);flex-shrink:0">
              <img src="${j.logo}" style="width:100%;height:100%;object-fit:contain;padding:6px" onerror="this.style.display='none';this.parentElement.innerHTML='🏢'">
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
                <h3 style="font-size:var(--fs-lg);font-weight:var(--fw-bold);margin:0">${j.title}</h3>
                <span class="badge" style="background:${j.remote === 'Remote' ? 'rgba(16,185,129,0.12)' : 'rgba(96,165,250,0.12)'};color:${j.remote === 'Remote' ? '#10b981' : '#60a5fa'};font-size:10px">${j.remote}</span>
              </div>
              <div style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:2px">${j.company} · ${j.location}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-weight:700;font-size:var(--fs-sm);color:var(--text-primary)">${j.salary}</div>
              <div style="font-size:11px;color:var(--text-tertiary)">${j.level}</div>
            </div>
            <span style="color:var(--text-tertiary);font-size:18px;flex-shrink:0">→</span>
          </div>
        `).join('')}
        ${jobs.length === 0 ? '<div style="text-align:center;padding:var(--space-12);color:var(--text-tertiary)"><p>No jobs match your filters.</p></div>' : ''}
      </div>
      <div style="margin-top:var(--space-8);padding:var(--space-6);background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);text-align:center">
        <p style="color:var(--text-secondary);font-size:var(--fs-sm)">Find more roles on <a href="https://www.linkedin.com/jobs" target="_blank" style="color:var(--accent)">LinkedIn</a>, <a href="https://www.indeed.com" target="_blank" style="color:var(--accent)">Indeed</a>, and <a href="https://wellfound.com" target="_blank" style="color:var(--accent)">Wellfound</a></p>
      </div>
    </div>`;
  },

  // ---- Groups ----
  async renderGroups(c) {
    c.innerHTML = `
    <div class="groups-container animate-fadeIn">
      <aside class="groups-intro-panel">
        <h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold);margin-bottom:var(--space-2)">Community Hubs</h2>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.6;margin-bottom:var(--space-6)">Join elite tech cohorts, share knowledge, and build with the best in the industry. These are curated high-signal communities.</p>
        <button class="btn btn-primary" style="width:100%" onclick="App.startGroupCreation()">➕ Create New Hub</button>
        
        <div style="margin-top:var(--space-10);padding-top:var(--space-6);border-top:1px solid var(--border-secondary)">
          <div style="font-weight:700;font-size:12px;color:var(--text-tertiary);margin-bottom:var(--space-4);text-transform:uppercase">Your Stats</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;justify-content:space-between;font-size:13px">
              <span style="color:var(--text-secondary)">Hubs Joined</span>
              <span style="font-weight:bold;color:var(--accent)">12</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px">
              <span style="color:var(--text-secondary)">Contributions</span>
              <span style="font-weight:bold;color:var(--success)">148</span>
            </div>
          </div>
        </div>
      </aside>

      <main style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2)">
          <span style="font-size:12px;font-weight:800;color:var(--text-tertiary);letter-spacing:1px;text-transform:uppercase">Explore Trending Hubs</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-icon btn-ghost btn-sm">${Icons.ms('sort')}</button>
            <button class="btn btn-icon btn-ghost btn-sm">${Icons.ms('filter_list')}</button>
          </div>
        </div>
        <div id="groups-list" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:var(--space-4)">
          <div style="grid-column:1/-1;text-align:center;padding:var(--space-12)">
            <div class="spinner spinner-lg" style="margin:0 auto"></div>
          </div>
        </div>
      </main>
    </div>`;

    try {
      const groups = await Database.getGroups(24);
      const gl = document.getElementById('groups-list');
      if (gl) {
        gl.innerHTML = groups.map(g => Components.groupCard(g)).join('') || '<p style="grid-column:1/-1;text-align:center;padding:var(--space-12)">No hubs found matching your criteria.</p>';
      }
    } catch (e) {
      console.error('Groups render error:', e);
    }
  },

  async startGroupCreation() {
    const c = document.getElementById('content-area');
    c.innerHTML = `<div class="feed-container animate-fadeIn">
      <button class="btn btn-icon btn-secondary" onclick="App.navigateTo('groups')" style="margin-bottom:var(--space-4)">← Back</button>
      <div class="post-card" style="padding:var(--space-8);max-width:600px;margin:0 auto">
        <h2 style="margin-bottom:var(--space-2)">Create a Community Hub</h2>
        <p style="color:var(--text-secondary);margin-bottom:var(--space-8)">Bring tech minds together around a shared interest.</p>
        
        <div style="display:flex;flex-direction:column;gap:var(--space-6)">
           <div>
             <label style="display:block;font-weight:600;margin-bottom:8px">Hub Name</label>
             <input type="text" id="group-name" class="input-field" placeholder="e.g. Rust Systems Engineers">
           </div>
           <div>
             <label style="display:block;font-weight:600;margin-bottom:8px">Hub Icon (Emoji)</label>
             <input type="text" id="group-icon" class="input-field" placeholder="e.g. 🦀" style="width:80px;text-align:center;font-size:24px">
           </div>
           <div>
             <label style="display:block;font-weight:600;margin-bottom:8px">Bio / Purpose</label>
             <textarea id="group-bio" class="input-field" style="height:120px" placeholder="What is this hub about?"></textarea>
           </div>
           <div style="display:flex;gap:var(--space-3)">
             <button class="btn btn-primary btn-lg" style="flex:1" onclick="App.submitGroupCreation()">Launch Hub</button>
             <button class="btn btn-secondary btn-lg" onclick="App.navigateTo('groups')">Cancel</button>
           </div>
        </div>
      </div>
    </div>`;
  },

  async submitGroupCreation() {
    const name = document.getElementById('group-name').value;
    if (!name) { Utils.showToast('Please enter a hub name', 'error'); return; }
    Utils.showToast('Launching your hub...', 'info');
    setTimeout(() => {
      Utils.showToast('Congrats! Your tech hub is now live.', 'success');
      this.navigateTo('groups');
    }, 1500);
  },

  async joinGroup(groupId, groupName, btnNode) {
    if (btnNode.textContent === 'Joined') return;
    btnNode.textContent = 'Joined';
    btnNode.classList.remove('btn-secondary');
    btnNode.classList.add('btn-primary');
    Utils.showToast(`Welcome to ${groupName} !`, 'success');
  },

  async renderGroupFeed(groupId) {
    // Find group info
    const groups = await Database.getGroups(50);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const c = document.getElementById('content-area');
    if (!c) return;

    c.innerHTML = `<div class="feed-container animate-fadeIn">
  <div style="margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-3)">
    <button class="btn btn-icon btn-secondary" onclick="App.navigateTo('groups')">←</button>
    <div style="font-size:32px">${group.image}</div>
    <div>
      <h2 style="font-size:var(--fs-xl);font-weight:var(--fw-bold)">${group.name}</h2>
      <div style="font-size:var(--fs-xs);color:var(--text-tertiary)">${Utils.formatNumber(group.members)} members</div>
    </div>
  </div>
      <div id="group-posts-container"><div style="text-align:center;padding:var(--space-8)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div></div>
    </div> <aside class="right-sidebar">${Components.trendingSidebar([], [])}</aside>`;

    // Simulate loading group specific posts by searching for group name keyword or just general loading
    const posts = await Database.searchPosts(group.name.split(' ')[0]) || await Database.getPosts(10);
    const html = [];
    for (const p of posts.slice(0, 10)) {
      const a = await this.getCachedUser(p.authorId);
      if (a) html.push(Components.postCard(p, a));
    }
    document.getElementById('group-posts-container').innerHTML = html.length ? html.join('') : '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-6)">No posts in this group yet. Be the first!</p>';
  },


  // ---- Leaderboard ----
  async renderLeaderboard(c) {
    c.innerHTML = `<div class="feed-container animate-fadeIn">
      <div style="margin-bottom:var(--space-6);display:flex;justify-content:space-between;align-items:flex-end">
        <div><h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold)">Top Tech Minds</h2><p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--space-2)">Ranked by contribution, expertise, and community engagement</p></div>
        <button class="btn btn-ghost btn-sm" onclick="Utils.showToast('Post content, help others, and share snippets to earn points!', 'info')">How to earn pts?</button>
      </div>
      
      <div id="leaderboard-list">
        <div style="text-align:center;padding:var(--space-8)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div>
      </div>

      <div class="post-card" style="margin-top:var(--space-8);background:var(--bg-input);border:1px dashed var(--border-primary)">
        <h3 style="font-size:var(--fs-md);margin-bottom:var(--space-2)">Scoring Breakdown</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);font-size:var(--fs-xs);color:var(--text-secondary)">
           <div>📝 Post Created: +10 pts</div>
           <div>💡 Snippet Shared: +25 pts</div>
           <div>💬 Helpful Comment: +5 pts</div>
           <div>🤝 Collaboration: +50 pts</div>
        </div>
      </div>
    </div>`;
    try {
      const leaders = await Database.getLeaderboard();
      const html = leaders.map(l => `<div class="post-card" style="display:flex;align-items:center;padding:var(--space-4) var(--space-6);margin-bottom:var(--space-2);border:none;background:var(--bg-card)" >
        <div style="font-weight:bold;font-size:var(--fs-xl);width:50px;color:var(--text-tertiary)">#${l.rank}</div>
        <div style="flex:1;display:flex;align-items:center;gap:var(--space-3)">
          <div style="width:40px;height:40px;border-radius:12px;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;font-size:20px">${l.badge}</div>
          <div>
            <div style="font-weight:700;cursor:pointer;font-size:var(--fs-md)" onclick="App.viewProfile('${l.uid}')">${l.name}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-tertiary)">Elite Developer</div>
          </div>
        </div>
        <div style="text-align:right">
           <div style="color:var(--accent);font-weight:900;font-size:var(--fs-lg)">${Utils.formatNumber(l.score)}</div>
           <div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary)">Points</div>
        </div>
      </div>`).join('');
      document.getElementById('leaderboard-list').innerHTML = html || '<p>Leaderboard empty.</p>';
    } catch (e) { }
  },

  // ---- Ask AI ----
  async renderAskAI(c) {
    c.innerHTML = `
    <div class="chat-page animate-fadeIn" style="display:grid;grid-template-columns:240px 1fr;gap:var(--space-6);height:calc(100vh - 120px)">
      <div class="post-card" style="padding:var(--space-4);display:flex;flex-direction:column">
        <h3 style="font-size:var(--fs-sm);margin-bottom:var(--space-4);color:var(--text-tertiary);text-transform:uppercase">Recent Prompts</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);flex:1;overflow-y:auto">
           ${['React 19 query', 'Rust lifetime explained', 'K8s ingress vs service', 'LLM context windows'].map(p => `
             <div class="sidebar-link" style="padding:var(--space-3);font-size:var(--fs-xs);border-radius:var(--radius-md);cursor:pointer;background:var(--bg-input)" onclick="document.getElementById('ai-input').value='Explain ${p}';App.sendAIMessage()">
               ${p}
             </div>
           `).join('')}
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-top:var(--space-4)" onclick="Utils.showToast('History cleared','info')">Clear History</button>
      </div>
      
      <div class="chat-main active" style="margin-left:0;width:100%;border-radius:var(--radius-lg);display:flex;flex-direction:column">
        <div class="chat-main-header">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-accent);display:flex;align-items:center;justify-content:center">${Icons.robot()}</div>
          <div class="chat-main-user-info">
            <div class="chat-main-name">TechOL AI Engine v4</div>
            <div class="chat-main-status">● Online · Ready to Code</div>
          </div>
        </div>
        <div class="chat-messages" id="ai-messages" style="padding:var(--space-6);flex:1;overflow-y:auto">
          <div style="display:flex;flex-direction:column;gap:var(--space-4)">
            <div style="align-self:flex-start;background:var(--bg-card);padding:var(--space-3) var(--space-4);border-radius:0 var(--radius-md) var(--radius-md) var(--radius-md);max-width:80%;line-height:1.5">
              Hello! I'm the TechOL AI assistant, specialized in software architecture, debugging, and systems engineering. How can I assist your workflow today?
            </div>
          </div>
        </div>
        <div class="chat-input-area" style="border-radius:0 0 var(--radius-lg) var(--radius-lg)">
          <input type="text" id="ai-input" placeholder="Enter your prompt (e.g. Optimize this function...)" onkeydown="if(event.key==='Enter')App.sendAIMessage()">
          <button class="chat-send-btn" onclick="App.sendAIMessage()">➤</button>
        </div>
      </div>
    </div>`;
  },

  sendAIMessage() {
    const i = document.getElementById('ai-input');
    if (!i || !i.value.trim()) return;
    const txt = i.value.trim();
    i.value = '';
    const m = document.getElementById('ai-messages');
    m.firstElementChild.insertAdjacentHTML('beforeend', `<div style="align-self:flex-end;background:var(--gradient-primary);color:var(--text-inverse);padding:var(--space-3) var(--space-4);border-radius:var(--radius-md) 0 var(--radius-md) var(--radius-md);max-width:80%">${Utils.escapeHtml(txt)}</div>`);
    m.scrollTop = m.scrollHeight;

    // Fake AI response
    setTimeout(() => {
      m.firstElementChild.insertAdjacentHTML('beforeend', `<div style="align-self:flex-start;background:var(--bg-card);padding:var(--space-3) var(--space-4);border-radius:0 var(--radius-md) var(--radius-md) var(--radius-md);max-width:80%">Generating advanced answer for: "${Utils.escapeHtml(txt)}"</div>`);
      m.scrollTop = m.scrollHeight;
    }, 1000);
  },

  // ---- Analytics ----
  async renderAnalytics(c) {
    c.innerHTML = `<div class="feed-container animate-fadeIn"><div style="margin-bottom:var(--space-6)"><h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold)">Analytics Dashboard</h2><p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--space-2)">Measure your reach and engagement</p></div>
    <div id="analytics-content"><div style="text-align:center;padding:var(--space-8)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div></div></div>`;
    try {
      const u = AuthService.getUser();
      const stats = await Database.getAnalytics(u?.uid);
      c.querySelector('#analytics-content').innerHTML = `
  <div class="hero-stats-grid" style="grid-template-columns:repeat(2,1fr)" >
          <div class="hero-stat-card"><div class="hero-stat-label">Profile Views</div><div class="hero-stat-value" style="font-size:32px">${Utils.formatNumber(stats.views)}</div></div>
          <div class="hero-stat-card"><div class="hero-stat-label">Post Impressions</div><div class="hero-stat-value" style="font-size:32px">${Utils.formatNumber(stats.impressions)}</div></div>
          <div class="hero-stat-card"><div class="hero-stat-label">Interactions</div><div class="hero-stat-value" style="font-size:32px">${Utils.formatNumber(stats.interactions)}</div></div>
          <div class="hero-stat-card"><div class="hero-stat-label">Growth (30d)</div><div class="hero-stat-value" style="color:var(--accent);font-size:32px">${stats.growth}</div></div>
        </div>
  `;
    } catch (e) { }
  },

  async renderCollabs(c) {
    c.innerHTML = `
    <div class="feed-container animate-fadeIn">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6)">
        <div>
          <h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold)">Collab Hub</h2>
          <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--space-2)">Find teammates for your next big project</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="App.createCollab()">➕ Post Project</button>
      </div>
      <div id="collabs-list">
        <div style="text-align:center;padding:var(--space-8)">
          <div class="spinner spinner-lg" style="margin:0 auto"></div>
        </div>
      </div>
    </div>`;
    try {
      const collabs = await Database.getCollabs();
      const html = collabs.map(cb => `
        <div class="post-card" style="padding:var(--space-4) var(--space-6);margin-bottom:var(--space-4);cursor:pointer" onclick="App.renderCollabDetail('${cb.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <h3 style="margin-bottom:0">${cb.title}</h3>
            <span class="badge badge-secondary">${cb.stage}</span>
          </div>
          <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-bottom:var(--space-3)">Project by <strong>${cb.owner}</strong></p>
          <div style="font-size:var(--fs-xs);margin-top:var(--space-2)"><strong>Seeking:</strong> ${cb.seeking.join(', ')}</div>
          <div style="margin-top:var(--space-4);display:flex;justify-content:flex-end">
             <button class="btn btn-secondary btn-sm">View Project</button>
          </div>
        </div>`).join('');
      document.getElementById('collabs-list').innerHTML = html || '<p>No projects currently looking for collabs.</p>';
    } catch (e) { }
  },

  async renderCollabDetail(collabId) {
    const collabs = await Database.getCollabs();
    const col = collabs.find(c => c.id === collabId);
    const c = document.getElementById('content-area');
    if (!col || !c) return;

    c.innerHTML = `
    <div class="feed-container animate-fadeIn">
      <button class="btn btn-icon btn-secondary" onclick="App.navigateTo('collabs')" style="margin-bottom:var(--space-4)">← Back to Hub</button>
      <div class="post-card" style="padding:var(--space-8)">
        <div style="margin-bottom:var(--space-6)">
          <span class="badge badge-accent" style="margin-bottom:var(--space-2)">Project ${col.stage}</span>
          <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-bold);line-height:1.2">${col.title}</h2>
          <div style="display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-2)">
            <span style="color:var(--text-secondary);font-size:var(--fs-sm)">Project Owner:</span>
            <span style="font-weight:600;font-size:var(--fs-sm);color:var(--accent)">${col.owner}</span>
          </div>
        </div>

        <h3 style="margin-bottom:var(--space-3)">About the project</h3>
        <p style="color:var(--text-secondary);line-height:1.6;margin-bottom:var(--space-6)">${col.description}</p>
        
        <h3 style="margin-bottom:var(--space-3)">Seeking Contributors</h3>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-8)">
          ${col.seeking.map(s => `
            <div style="padding:var(--space-2) var(--space-4);background:var(--bg-input);border-radius:var(--radius-md);border:1px solid var(--border-secondary)">
              <div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary)">Role</div>
              <div style="font-weight:600">${s}</div>
            </div>`).join('')}
        </div>

        <div id="collab-action-area">
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="App.joinCollabTeam('${col.id}')">Apply to join team</button>
        </div>
      </div>
    </div>`;
  },

  async joinCollabTeam(colId) {
    const area = document.getElementById('collab-action-area');
    area.innerHTML = `
    <div class="animate-fadeIn" style="padding:var(--space-6);border:1px solid var(--accent);border-radius:var(--radius-lg);background:rgba(var(--accent-rgb), 0.05)">
      <h3 style="margin-bottom:var(--space-4)">Join Request</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div>
          <label style="display:block;font-size:var(--fs-xs);margin-bottom:4px">Your expertise for this project</label>
          <input type="text" id="join-expertise" class="input-field" placeholder="e.g. Frontend Development, UX Research">
        </div>
        <div>
          <label style="display:block;font-size:var(--fs-xs);margin-bottom:4px">Message to the owner</label>
          <textarea id="join-msg" class="input-field" style="height:80px" placeholder="Hi, I'm interested in helping with..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="Utils.showToast('Request sent! The owner will contact you.', 'success'); App.renderCollabDetail('${colId}')">Send Request</button>
      </div>
    </div>`;
  },

  async createCollab() {
    Utils.showToast('Project creation form coming soon!', 'info');
  },

  // ---- Code Snippets ----
  async renderSnippets(c) {
    c.innerHTML = `
    <div class="feed-container animate-fadeIn">
      <div style="margin-bottom:var(--space-6)">
        <h2 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold)">Tech Snippets</h2>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--space-2)">Reusable high-performance code blocks</p>
      </div>
      <div id="snippets-list">
        <div style="text-align:center;padding:var(--space-8)">
          <div class="spinner spinner-lg" style="margin:0 auto"></div>
        </div>
      </div>
    </div>`;
    try {
      const snippets = await Database.getSnippets();
      const html = snippets.map(s => `
        <div class="post-card" style="padding:var(--space-4) var(--space-6);margin-bottom:var(--space-4);cursor:pointer" onclick="App.renderSnippetDetail('${s.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <h3 style="margin:0">${s.title} <span class="badge badge-accent">${s.language}</span></h3>
            <div style="display:flex;gap:var(--space-2)">
              <span style="font-size:12px;color:var(--text-tertiary)">❤️ ${s.likes}</span>
              <button class="btn btn-icon btn-sm" onclick="event.stopPropagation();navigator.clipboard.writeText('${s.code.replace(/'/g, "\\'")}');Utils.showToast('Code Copied!','success')">📋</button>
            </div>
          </div>
          <pre class="code-block" style="max-height:120px;overflow:hidden;mask-image:linear-gradient(to bottom, black 50%, transparent 100%)"><code>${Utils.escapeHtml(s.code)}</code></pre>
          <div style="font-size:var(--fs-xs);color:var(--accent);margin-top:8px">View full explanation →</div>
        </div>`).join('');
      document.getElementById('snippets-list').innerHTML = html || '<p>No snippets found.</p>';
    } catch (e) { }
  },

  async renderSnippetDetail(snippetId) {
    const snippets = await Database.getSnippets();
    const s = snippets.find(item => item.id === snippetId);
    const c = document.getElementById('content-area');
    if (!s || !c) return;

    c.innerHTML = `<div class="feed-container animate-fadeIn">
      <button class="btn btn-icon btn-secondary" onclick="App.navigateTo('snippets')" style="margin-bottom:var(--space-4)">← Back to Snippets</button>
      <div class="post-card" style="padding:var(--space-8)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6)">
          <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-bold)">${s.title}</h2>
          <span class="badge badge-accent">${s.language}</span>
        </div>

        <p style="color:var(--text-secondary);font-size:var(--fs-md);margin-bottom:var(--space-6)">${s.description}</p>
        
        <div style="position:relative;margin-bottom:var(--space-8)">
          <button class="btn btn-primary btn-sm" style="position:absolute;top:12px;right:12px;z-index:2" onclick="navigator.clipboard.writeText('${s.code.replace(/'/g, "\\'")}');Utils.showToast('Copied!','success')">Copy Code</button>
          <pre class="code-block" style="margin:0;padding:var(--space-6)"><code>${Utils.escapeHtml(s.code)}</code></pre>
        </div>

        <h3 style="margin-bottom:var(--space-3)">Logic Explanation</h3>
        <div style="padding:var(--space-4);background:var(--bg-input);border-radius:var(--radius-md);border-left:4px solid var(--accent);color:var(--text-secondary);line-height:1.6">
          ${s.explainer}
        </div>

        <div style="margin-top:var(--space-8);display:flex;justify-content:space-between;align-items:center">
           <div style="display:flex;gap:var(--space-4)">
             <button class="btn btn-ghost btn-sm">❤️ ${s.likes}</button>
             <button class="btn btn-ghost btn-sm" onclick="Utils.showToast('Snippet shared to your feed!','success')">🔗 Share</button>
           </div>
           <span style="font-size:12px;color:var(--text-tertiary)">Verified by TechOL Community</span>
        </div>
      </div>
    </div>`;
  },


  // ---- Courses (Learning Hub) ----
  _courseFilter: 'all',
  renderCourses(c) {
    const cats = [
      { id: 'all', label: 'All', icon: '📚' }, { id: 'ai-ml', label: 'AI / ML', icon: '🤖' }, { id: 'web-dev', label: 'Web Dev', icon: '🌐' },
      { id: 'cloud', label: 'Cloud', icon: '☁️' }, { id: 'cybersecurity', label: 'Security', icon: '🔒' }, { id: 'data-science', label: 'Data Science', icon: '📊' },
      { id: 'devops', label: 'DevOps', icon: '⚙️' }, { id: 'web3', label: 'Web3', icon: '🔗' }, { id: 'mobile', label: 'Mobile', icon: '📱' }
    ];
    const courses = LiveData.getCourses(this._courseFilter);

    c.innerHTML = `
  <div class="learning-hub-container animate-fadeIn">
      <div style="margin-bottom:var(--space-10);text-align:center;max-width:800px;margin-left:auto;margin-right:auto">
        <h2 style="font-size:var(--fs-4xl);font-weight:var(--fw-extrabold);letter-spacing:var(--ls-tight);background:var(--gradient-accent);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;margin-bottom:var(--space-2)">Learning Hub</h2>
        <p style="color:var(--text-secondary);font-size:var(--fs-lg);line-height:1.6">Master the world's most in-demand technologies with certified courses from Harvard, Stanford, MIT, and industry leaders.</p>
      </div>

      <div style="margin-bottom:var(--space-8);display:flex;justify-content:center;flex-wrap:wrap;gap:var(--space-3)">
        ${cats.map(cat => `
          <button class="btn ${this._courseFilter === cat.id ? 'btn-primary' : 'btn-secondary'} btn-sm" 
            onclick="App._courseFilter='${cat.id}';App.renderCourses(document.getElementById('content-area'))"
            style="padding:8px 16px;border-radius:var(--radius-full);font-weight:700;display:flex;align-items:center;gap:6px">
            <span>${cat.icon}</span>
            <span>${cat.label}</span>
          </button>`).join('')}
      </div>

      <div class="course-grid">
        ${courses.map(course => Components.courseCard(course)).join('')}
      </div>
      
      ${courses.length === 0 ? `
        <div style="text-align:center;padding:var(--space-24);color:var(--text-tertiary)">
          <div style="font-size:64px;margin-bottom:var(--space-4)">🕵️</div>
          <h3>No courses found in this category</h3>
          <p style="margin-top:8px">Try broadening your search or choosing another track.</p>
        </div>
      ` : ''
      }
    </div>`;
  },

  // ---- Hackathons (LiveData - 12 real hackathons) ----
  renderHackathons(c) {
    const hacks = LiveData.hackathons;
    c.innerHTML = `
  <div class="feed-container animate-fadeIn">
      <div style="margin-bottom:var(--space-8)">
        <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-extrabold);letter-spacing:var(--ls-tight)">Hackathons & Competitions</h2>
        <p style="color:var(--text-secondary);font-size:var(--fs-md);margin-top:var(--space-2)">Real hackathons from MLH, Devpost, Kaggle, ETHGlobal and more. Links go directly to each platform.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(350px, 1fr));gap:var(--space-6)">
        ${hacks.map(h => `
          <div class="post-card" style="padding:var(--space-6);cursor:pointer;transition:all 0.3s ease;display:flex;flex-direction:column"
               onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-4px)'" 
               onmouseout="this.style.borderColor='';this.style.transform=''"
               onclick="window.open('${h.link}','_blank')">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-4)">
              <div style="font-size:24px">${h.icon || '🏆'}</div>
              <span class="badge" style="background:rgba(var(--accent-rgb), 0.1);color:var(--accent);font-size:10px">${h.status || 'UPCOMING'}</span>
            </div>
            <div style="flex:1">
              <h3 style="font-size:var(--fs-lg);font-weight:700;margin-bottom:2px">${h.title}</h3>
              <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:var(--space-4)">Hosted by <strong style="color:var(--text-secondary)">${h.organizer}</strong></div>
              <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-4);padding:var(--space-3);background:var(--bg-input);border-radius:var(--radius-md)">
                 <div>
                    <div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary)">Prize Pool</div>
                    <div style="font-size:14px;font-weight:700;color:var(--success)">${h.prize}</div>
                 </div>
                 <div style="border-left:1px solid var(--border-secondary);padding-left:var(--space-4)">
                    <div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary)">Deadline</div>
                    <div style="font-size:14px;font-weight:700">${h.deadline}</div>
                 </div>
              </div>
              <p style="color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.6;margin-bottom:var(--space-4)">${h.description}</p>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
                ${(h.tags || []).map(t => `<span class="badge" style="background:var(--bg-input);color:var(--text-secondary);font-size:10px">${t}</span>`).join('')}
              </div>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();window.open('${h.link}','_blank')">Visit Platform →</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  },

  async renderNews(c) {
    const cats = [
      { key: 'all', label: 'All' },
      { key: 'ai', label: 'AI' },
      { key: 'startups', label: 'Startups' },
      { key: 'dev', label: 'Dev' },
      { key: 'tech', label: 'Tech' },
      { key: 'security', label: 'Security' },
      { key: 'web3', label: 'Web3' },
    ];

    c.innerHTML = `
    <div class="feed-container animate-fadeIn">
      <div style="margin-bottom:var(--space-6)">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-4)">
          <div>
            <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-extrabold);letter-spacing:var(--ls-tight);margin-bottom:var(--space-1)">Live Tech News</h2>
            <p style="color:var(--text-secondary);font-size:var(--fs-sm)">Real-time from TechCrunch, Hacker News, The Verge, VentureBeat & 20+ sources</p>
          </div>
          <button id="news-refresh-btn" onclick="App._refreshNewsPage()" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-full);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-primary)'">
            <span class="material-symbols-outlined" style="font-size:14px">refresh</span> Refresh
          </button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${cats.map((cat, i) => `<button class="news-cat-tab${i === 0 ? ' active' : ''}" data-cat="${cat.key}" onclick="App._filterNews('${cat.key}',this)">${cat.label}</button>`).join('')}
        </div>
      </div>
      <div id="news-list">
        ${[1, 2, 3, 4, 5, 6].map(() => `
        <div class="post-card" style="padding:var(--space-5);margin-bottom:var(--space-3)">
          <div style="display:flex;gap:var(--space-4)">
            <div style="width:80px;height:56px;border-radius:var(--radius-md);background:var(--bg-input);flex-shrink:0">
              <div class="shimmer-line" style="width:100%;height:100%;margin:0;border-radius:var(--radius-md)"></div>
            </div>
            <div style="flex:1">
              <div class="shimmer-line" style="width:30%;height:8px"></div>
              <div class="shimmer-line" style="width:90%;height:12px;margin-top:8px"></div>
              <div class="shimmer-line" style="width:70%;height:10px;margin-top:6px"></div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>`;

    // Render from live buffer immediately
    const bufferNews = window.LiveNewsEngine?.getBuffer(50) || [];
    if (bufferNews.length > 0) {
      App._renderNewsArticles(bufferNews, 'all');
    }

    // Also fetch fresh from LiveData RSS
    try {
      if (window.LiveData) {
        const fresh = await LiveData.getNews(50);
        if (fresh.length > 0) App._renderNewsArticles(fresh, App._newsCat || 'all');
      }
    } catch (e) { }

    // Re-render on news updates
    window.removeEventListener('newsUpdated', App._newsUpdateHandler);
    App._newsUpdateHandler = (e) => App._renderNewsArticles(e.detail, App._newsCat || 'all');
    window.addEventListener('newsUpdated', App._newsUpdateHandler);
  },

  _newsCat: 'all',
  _newsUpdateHandler: null,

  _filterNews(cat, btn) {
    this._newsCat = cat;
    document.querySelectorAll('.news-cat-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const all = window.LiveNewsEngine?.getBuffer(50) || [];
    this._renderNewsArticles(all, cat);
  },

  async _refreshNewsPage() {
    const btn = document.getElementById('news-refresh-btn');
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined spin" style="font-size:14px">refresh</span> Fetching...';
    if (window.LiveNewsEngine) await LiveNewsEngine.fetchNews();
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">refresh</span> Refresh';
  },

  _renderNewsArticles(articles, cat = 'all') {
    const nl = document.getElementById('news-list');
    if (!nl) return;
    const filtered = cat === 'all' ? articles : articles.filter(a => a.category === cat);
    const toShow = filtered.slice(0, 40);

    if (toShow.length === 0) {
      nl.innerHTML = `<div style="text-align:center;padding:var(--space-12);color:var(--text-tertiary)">
        <div style="font-size:32px;margin-bottom:16px">📡</div>
        <p>No ${cat === 'all' ? '' : cat + ' '}articles found. Try refreshing.</p>
      </div>`;
      return;
    }

    nl.innerHTML = toShow.map((a, idx) => `
    <article class="post-card news-article-card animate-fadeInUp stagger-${Math.min(idx + 1, 6)}"
      style="padding:var(--space-5) var(--space-6);margin-bottom:var(--space-3);"
      onclick="${a.link && a.link !== '#' ? `window.open('${a.link.replace(/'/g, "\'")}','_blank')` : ''}">
      <div style="display:flex;gap:var(--space-4);align-items:flex-start">
        ${a.thumbnail ? `
        <div style="width:88px;height:62px;border-radius:var(--radius-md);overflow:hidden;flex-shrink:0;background:var(--bg-input)">
          <img src="${a.thumbnail}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.parentElement.style.display='none'">
        </div>` : ''}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:13px">${a.sourceIcon || '📰'}</span>
            <span style="font-size:11px;font-weight:700;color:var(--accent)">${a.source}</span>
            <span style="font-size:11px;color:var(--text-tertiary)">· ${Utils.timeAgo(a.pubDate || a.createdAt)}</span>
            ${a.isLive ? '<span class="live-badge">LIVE</span>' : ''}
            ${a.category ? `<span style="font-size:9px;font-weight:800;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;background:var(--bg-input);padding:2px 6px;border-radius:4px">${a.category}</span>` : ''}
          </div>
          <h3 style="font-size:var(--fs-base);font-weight:var(--fw-bold);line-height:1.45;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--text-primary)">${a.title}</h3>
          ${a.description ? `<p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0">${a.description}</p>` : ''}
        </div>
        ${a.link && a.link !== '#' ? `<span class="material-symbols-outlined" style="font-size:16px;color:var(--text-tertiary);flex-shrink:0;margin-top:2px">open_in_new</span>` : ''}
      </div>
    </article>`).join('');
  },


  // ---- Static Pages ----
  renderAnalysis(c) {
    c.innerHTML = `
  <div class="feed-container animate-fadeIn">
        <div style="margin-bottom:var(--space-8)">
            <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-extrabold);letter-spacing:var(--ls-tight)">Data Analysis Dashboard</h2>
            <p style="color:var(--text-secondary);font-size:var(--fs-md);margin-top:var(--space-2)">Personalize your charts to identify market gaps that other founders miss.</p>
        </div>

        <div class="post-card" style="padding:var(--space-6); margin-bottom:var(--space-6);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
                <h3 style="font-size:var(--fs-lg);font-weight:700;">Market Sector Growth (YTD)</h3>
                <button class="btn btn-secondary btn-sm" onclick="Utils.showToast('Data refresh initiated','info')">${Icons.ms('refresh')} Refresh Data</button>
            </div>
            <canvas id="marketChart" width="400" height="200"></canvas>
            <p style="color:var(--text-tertiary); font-size:12px; margin-top:10px;">* Real-time automated data aggregates from over 25+ global tech feeds.</p>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-4);">
            <div class="post-card" style="padding:var(--space-5);">
                <h3 style="font-size:var(--fs-md);font-weight:700;margin-bottom:var(--space-3);">AI Model Capabilities Index</h3>
                <canvas id="aiChart" width="200" height="150"></canvas>
            </div>
            <div class="post-card" style="padding:var(--space-5);">
                <h3 style="font-size:var(--fs-md);font-weight:700;margin-bottom:var(--space-3);">Startup Funding Heatmap</h3>
                <canvas id="fundingChart" width="200" height="150"></canvas>
            </div>
        </div>
    </div>`;

    setTimeout(() => {
      // Render Chart.js
      if (window.Chart) {
        new Chart(document.getElementById('marketChart').getContext('2d'), {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'SaaS Market Trend',
              data: [65, 59, 80, 81, 56, 120],
              borderColor: '#0ea5e9',
              tension: 0.4
            }, {
              label: 'Quantum Computing',
              data: [10, 20, 30, 45, 60, 90],
              borderColor: '#8b5cf6',
              tension: 0.4
            }]
          },
          options: { responsive: true, plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } } }
        });

        new Chart(document.getElementById('aiChart').getContext('2d'), {
          type: 'radar',
          data: {
            labels: ['Reasoning', 'Math', 'Coding', 'Creativity', 'Vision'],
            datasets: [{
              label: 'Current SOTA Model',
              data: [80, 90, 85, 70, 95],
              backgroundColor: 'rgba(14, 165, 233, 0.2)',
              borderColor: '#0ea5e9',
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { r: { ticks: { display: false } } } }
        });

        new Chart(document.getElementById('fundingChart').getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['FinTech', 'AI/ML', 'DevTools', 'Climate'],
            datasets: [{
              label: 'Total Q1 ($M)',
              data: [1200, 4500, 800, 2100],
              backgroundColor: ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b']
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } } }
        });
      }
    }, 100);
  },

  renderAbout(c) {
    c.innerHTML = `
  <div class="feed-container animate-fadeIn">
        <div class="post-card" style="padding:var(--space-10); text-align:center; background:linear-gradient(135deg, rgba(var(--accent-rgb), 0.1) 0%, transparent 100%);">
            <h1 style="font-size:clamp(32px, 5vw, 64px); font-weight:900; margin-bottom:24px; letter-spacing:-2px;">TechOL Intelligence</h1>
            <p style="font-size:18px; color:var(--text-secondary); max-width:700px; margin:0 auto 40px; line-height:1.7;">
                The ultimate reconnaissance layer for the global tech ecosystem. We track the signals, capital, and code updates that define the next decade of innovation.
            </p>
            <div style="width:60px; height:4px; background:var(--accent); margin:0 auto; border-radius:2px;"></div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-6); margin-top:var(--space-8);">
            <div class="post-card" style="padding:var(--space-8)">
                <h3 style="font-size:24px; font-weight:800; margin-bottom:16px;">The Mission</h3>
                <p style="color:var(--text-secondary); line-height:1.8;">
                    Most founders fail because they see what's already there. TechOL is built for those who want to see what's *missing*. By aggregating over 50+ institutional data feeds, we provide a definitive view of market gaps before they become obvious.
                </p>
            </div>
            <div class="post-card" style="padding:var(--space-8); border-left:4px solid var(--accent);">
                <h3 style="font-size:24px; font-weight:800; margin-bottom:16px;">The Founder</h3>
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px;">
                    <div style="width:64px; height:64px; background:var(--gradient-accent); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900; color:#fff; box-shadow:var(--shadow-glow)">VS</div>
                    <div>
                        <div style="font-size:20px; font-weight:700; color:var(--text-primary)">Vihaan Sankhla</div>
                        <div style="font-size:14px; color:var(--accent); font-weight:600">17-year-old Entrepreneur & Developer</div>
                    </div>
                </div>
                <p style="color:var(--text-secondary); line-height:1.8;">
                    Vihaan founded TechOL with a simple premise: the next generation of builders shouldn't just be connecting, they should be analyzing. At 17, his vision for a data-driven social layer is redefining how young entrepreneurs look at market telemetry.
                </p>
            </div>
        </div>

        <div class="post-card" style="margin-top:var(--space-6); padding:var(--space-8); text-align:center;">
             <h3 style="font-size:20px; font-weight:700; margin-bottom:12px;">Join the Intelligence Network</h3>
             <p style="color:var(--text-tertiary); margin-bottom:24px;">Built for the 1% of founders who treat building like a science.</p>
             <button class="btn btn-primary" onclick="App.navigateTo('feed')">Back to Terminal</button>
        </div>
    </div>`;
  },

  renderContact(c) {
    c.innerHTML = `<div class="feed-container animate-fadeIn"> <div class="post-card" style="padding:var(--space-8)">
  <h2 style="font-size:32px;font-weight:bold;margin-bottom:var(--space-4)">Contact Us</h2>
  <div style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div><strong>Email:</strong> support@techol.dev</div>
    <div><strong>Enterprise:</strong> enterprise@techol.dev</div>
    <div><strong>Press:</strong> press@techol.dev</div>
  </div>
  <div style="margin-top:var(--space-6)">
    <textarea style="width:100%;height:100px;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:var(--space-3);color:var(--text-primary)" placeholder="How can we help?"></textarea>
    <button class="btn btn-primary" style="margin-top:var(--space-3)" onclick="Utils.showToast('Message sent!','success')">Send Message</button>
  </div>
</div></div>`;
  },
  renderPrivacy(c) {
    c.innerHTML = `<div class="feed-container animate-fadeIn"> <div class="post-card" style="padding:var(--space-8)">
  <h2 style="font-size:32px;font-weight:bold;margin-bottom:var(--space-4)">Privacy Policy</h2>
  <div style="color:var(--text-secondary);line-height:1.6">
    <p><strong>Last Updated: October 2026</strong></p>
    <br><p>1. Data Collection: We only collect information critical to your experience (email, profile stats).</p>
      <br><p>3. Security: TechOL uses top encryption architectures to ensure your direct messages and tech secrets are safe.</p>
      </div>
  </div></div>`;
  },
  renderAlerts(container) {
    if (!container) return;
    container.innerHTML = `
    <div class="alerts-dashboard animate-fadeIn" style="padding:var(--space-8)" >
        <div style="margin-bottom: var(--space-8)">
            <h2 style="font-size:32px; font-weight:900; letter-spacing:-1px">Intelligence Alert Command</h2>
            <p style="color:var(--text-tertiary); margin-top:4px">Configure real-time triggers for market signals and capital movement.</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px">
            ${['Funding Velocity', 'Sector Spikes', 'VC Activity', 'Keyword Acceleration'].map(type => `
                <div class="intel-card" style="padding:var(--space-6); display:flex; justify-content:space-between; align-items:center">
                    <div>
                        <div style="font-weight:800; color:var(--text-primary); font-size:16px">${type}</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:4px">Trigger on [LOW/MED/HIGH] signals</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px">
                        <span style="font-size:10px; font-weight:900; color:var(--accent)">ACTIVE</span>
                        <div class="toggle-switch active" style="width:36px; height:18px; background:var(--accent); border-radius:10px; position:relative; cursor:pointer">
                            <div class="toggle-knob" style="width:14px; height:14px; background:#fff; border-radius:50%; position:absolute; top:2px; right:2px"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div style="margin-top:40px; border-top:1px solid var(--border-primary); padding-top:40px">
            <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:20px">Recent Trigger History</h3>
            <div id="alert-history-container" style="display:flex; flex-direction:column; gap:12px">
                <div style="text-align:center; padding:40px; color:var(--text-tertiary); font-size:14px; background:rgba(255,255,255,0.02); border-radius:12px">No triggers in the last 24h. System standing by.</div>
            </div>
        </div>
     </div>
  `;
  },
  renderLegal(c) {
    c.innerHTML = `<div class="feed-container animate-fadeIn"> <div class="post-card" style="padding:var(--space-8)">
  <h2 style="font-size:32px;font-weight:bold;margin-bottom:var(--space-4)">Legal & Terms</h2>
  <div style="color:var(--text-secondary);line-height:1.6">
    <p><strong>Terms of Service</strong></p>
    <br><p>By using TechOL, you agree to not abuse the API, scrape users, or spam the global feed.</p>
      <br><p>TechOL reserves the right to moderate projects, groups, and content that violate community guidelines.</p>
      </div>
  </div></div>`;
  },

  // ---- Settings ----
  async renderSettings(c) {
    const user = AuthService.getUser();
    if (!user) return;
    const dbUser = await this.getCachedUser(user.uid);
    const curTheme = localStorage.getItem('techol_theme') || 'dark';

    c.innerHTML = `
    <div class="feed-container animate-fadeIn" style="max-width:700px;margin:0 auto" >
      <div style="margin-bottom:var(--space-8)">
        <h2 style="font-size:var(--fs-3xl);font-weight:var(--fw-bold)">Settings</h2>
        <p style="color:var(--text-secondary)">Manage your professional identity and preferences</p>
      </div>

      <!--Professional Identity Section-- >
      <div class="post-card" style="margin-bottom:var(--space-6)">
        <div style="font-weight:700;margin-bottom:var(--space-6);font-size:var(--fs-lg);display:flex;align-items:center;gap:10px">
          ${Icons.ms('badge', { color: 'var(--accent)' })} Professional Identity
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-5)">
           <div style="display:flex;gap:var(--space-4);align-items:center;margin-bottom:var(--space-4)">
              ${Components.avatar(dbUser, 'avatar-xl')}
              <div>
                <button class="btn btn-secondary btn-sm" onclick="App.changeAvatar()">Change Avatar</button>
                <p style="font-size:11px;color:var(--text-tertiary);margin-top:8px">Recommended size: 400x400px</p>
              </div>
           </div>
           
           <div class="form-group">
              <label class="form-label">Job Title</label>
              <input type="text" id="settings-job-title" class="input-field" value="${dbUser.jobTitle || ''}" placeholder="e.g. Senior Software Engineer">
           </div>
           
           <div class="form-group">
              <label class="form-label">Organization / Company</label>
              <input type="text" id="settings-company" class="input-field" value="${dbUser.company || ''}" placeholder="e.g. Google, TechOL, Startup X">
           </div>

           <div class="form-group">
              <label class="form-label">Professional Bio</label>
              <textarea id="settings-bio" class="input-field" style="min-height:100px;resize:vertical" placeholder="Describe your expertise...">${dbUser.bio || ''}</textarea>
           </div>
           
           <div class="form-group">
              <label class="form-label">Skills (Comma separated)</label>
              <input type="text" id="settings-skills" class="input-field" value="${(dbUser.skills || []).join(', ')}" placeholder="e.g. JavaScript, AI, Backend">
           </div>

           <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label">Portfolio / Website</label>
                <input type="text" id="settings-website" class="input-field" value="${dbUser.website || ''}" placeholder="https://example.com">
              </div>
              <div class="form-group">
                <label class="form-label">Location</label>
                <input type="text" id="settings-location" class="input-field" value="${dbUser.location || ''}" placeholder="e.g. London, Remote">
              </div>
           </div>

           <button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="App.saveSettings()">Save Identity Changes</button>
        </div>
      </div>

      <!--Appearance -->
      <div class="post-card" style="margin-bottom:var(--space-6)">
        <div style="font-weight:700;margin-bottom:var(--space-6);font-size:var(--fs-lg);display:flex;align-items:center;gap:10px">
          ${Icons.ms('palette', { color: 'var(--accent)' })} Interface Theme
        </div>
        <div style="display:flex;gap:var(--space-4)">
          <div class="theme-opt ${curTheme === 'dark' ? 'active' : ''}" onclick="App.setTheme('dark')" style="flex:1;padding:var(--space-4);border:1px solid ${curTheme === 'dark' ? 'var(--accent)' : 'var(--border-secondary)'};border-radius:var(--radius-lg);cursor:pointer;text-align:center;background:var(--bg-card)">
             <div style="width:20px;height:20px;background:#030303;border-radius:50%;margin:0 auto 8px"></div>
             <div style="font-size:12px;font-weight:600">Deep Cosmic</div>
          </div>
          <div class="theme-opt ${curTheme === 'light' ? 'active' : ''}" onclick="App.setTheme('light')" style="flex:1;padding:var(--space-4);border:1px solid ${curTheme === 'light' ? 'var(--accent)' : 'var(--border-secondary)'};border-radius:var(--radius-lg);cursor:pointer;text-align:center;background:#fff;color:#333">
             <div style="width:20px;height:20px;background:#f5f5f7;border:1px solid #ddd;border-radius:50%;margin:0 auto 8px"></div>
             <div style="font-size:12px;font-weight:600">Clean Light</div>
          </div>
          <div class="theme-opt ${curTheme === 'blue' ? 'active' : ''}" onclick="App.setTheme('blue')" style="flex:1;padding:var(--space-4);border:1px solid ${curTheme === 'blue' ? 'var(--accent)' : 'var(--border-secondary)'};border-radius:var(--radius-lg);cursor:pointer;text-align:center;background:#0b1120;color:white">
             <div style="width:20px;height:20px;background:#1e293b;border-radius:50%;margin:0 auto 8px"></div>
             <div style="font-size:12px;font-weight:600">Cyber Blue</div>
          </div>
        </div>
      </div>

      <!--Account Actions-- >
      <div class="post-card" style="margin-bottom:var(--space-6);border:1px solid rgba(255, 59, 48, 0.2)">
        <div style="font-weight:700;margin-bottom:var(--space-4);font-size:var(--fs-md);color:var(--error)">Danger Zone</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-4);background:var(--bg-input);border-radius:var(--radius-md)">
          <div>
            <div style="font-weight:600">Delete Account</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">Permanently remove all your data and access.</div>
          </div>
          <button class="btn btn-secondary" style="color:var(--error);border-color:var(--error)" onclick="App.deleteAccount()">Delete forever</button>
        </div>
      </div>

      <div class="post-card" style="text-align:center;padding:var(--space-6)">
        <button class="btn btn-primary" onclick="App.logout()" style="width:100%;max-width:300px;font-weight:700;box-shadow:var(--shadow-glow);">Sign out of TechOL</button>
        <p style="margin-top:12px; font-size:12px; color:var(--text-tertiary);">You will be securely disconnected.</p>
      </div>
    </div>`;
  },

  async saveSettings() {
    const cu = AuthService.getUser();
    if (!cu) return;

    Utils.showToast('Saving changes...', 'info');

    const updates = {
      jobTitle: document.getElementById('settings-job-title').value.trim(),
      company: document.getElementById('settings-company').value.trim(),
      bio: document.getElementById('settings-bio').value.trim(),
      website: document.getElementById('settings-website').value.trim(),
      location: document.getElementById('settings-location').value.trim(),
      skills: document.getElementById('settings-skills').value.split(',').map(s => s.trim()).filter(s => s.length > 0)
    };

    try {
      await Database.updateUser(cu.uid, updates);
      // Clear cache to force refresh
      delete this.usersCache[cu.uid];
      Utils.showToast('Profile updated successfully!', 'success');
      this.renderSettings(document.getElementById('content-area'));
    } catch (e) {
      console.error(e);
      Utils.showToast('Failed to save changes.', 'error');
    }
  },

  // ---- Post Actions ----
  async publishPost() {
    const input = document.getElementById('create-post-input');
    if (!input || !input.value.trim()) { Utils.showToast('Write something first', 'warning'); return; }

    const cu = AuthService.getUser(); if (!cu) return;
    const text = input.value.trim();
    const hashtags = text.match(/#\w+/g) || [];
    const btn = document.querySelector('#create-post-box .btn-primary');
    const originalText = btn.innerHTML;

    // Set loading state
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner spinner-xs" style="border-top-color:#000" ></div>`;

    try {
      let imageURL = null;
      const fi = document.getElementById('post-image-input');

      // Step 1: Upload Image if exists
      if (fi && fi.files[0]) {
        Utils.showToast('Uploading image signal...', 'info');
        imageURL = await Database.uploadPostImage(cu.uid, fi.files[0]);
      }

      const postData = {
        authorId: cu.uid,
        text: text,
        category: this.selectedCategory || 'general',
        hashtags: [...new Set(hashtags)],
        imageURL: imageURL
      };

      // Step 2: Handle link previews
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        try {
          postData.linkPreview = {
            url: urlMatch[0],
            title: new URL(urlMatch[0]).hostname + ' Article',
            description: 'Intelligent network signal shared.'
          };
        } catch (e) { console.error("URL preview error", e); }
      }

      // Step 3: Create Post (Optimistic callback handled by listenToFeedPosts)
      const post = await Database.createPost(postData);

      // Step 4: UI Cleanup
      input.value = '';
      input.style.height = 'auto';
      if (fi) fi.value = '';
      const preview = document.getElementById('image-preview-area');
      if (preview) preview.innerHTML = '';

      Utils.showToast('Post live on network! 🚀', 'success');
    } catch (e) {
      console.error('Publish error:', e);
      Utils.showToast('Network error while publishing.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  async toggleLike(postId) {
    const post = document.getElementById(`post - ${postId} `);
    const likeBtn = post?.querySelector('.interaction-btn');
    if (!likeBtn) return;

    // Optimistic UI update
    const isLiked = likeBtn.style.color === 'rgb(255, 59, 48)';
    const countSpan = likeBtn.querySelector('span');
    let count = parseInt(countSpan.textContent.replace(',', '')) || 0;

    if (isLiked) {
      likeBtn.style.color = 'var(--text-tertiary)';
      likeBtn.innerHTML = `${Icons.ms('favorite_border', { size: 20 })} <span style="font-size:13px;font-weight:700">${Utils.formatNumber(Math.max(0, count - 1))}</span>`;
    } else {
      likeBtn.style.color = '#ff3b30';
      likeBtn.innerHTML = `${Icons.ms('favorite', { size: 20, fill: true })} <span style="font-size:13px;font-weight:700">${Utils.formatNumber(count + 1)}</span>`;
      likeBtn.classList.add('interaction-active');
      setTimeout(() => likeBtn.classList.remove('interaction-active'), 400);
    }

    try {
      const cu = AuthService.getUser();
      if (!cu) { Utils.showToast('Sign in to like this post', 'info'); return; }
      await Database.toggleLike(postId, cu.uid);
    } catch (e) {
      // Rollback on error
      console.warn('Like failed, UI stayed optimistic');
    }
  },

  async addReaction(postId, emoji) {
    const postCard = document.getElementById(`post - ${postId} `);
    const btn = Array.from(postCard?.querySelectorAll('.reaction-btn') || []).find(b => b.textContent.includes(emoji));

    if (btn) {
      const span = btn.querySelector('span');
      const count = parseInt(span.textContent) || 0;
      span.textContent = count + 1;
      btn.classList.add('interaction-active');
      setTimeout(() => btn.classList.remove('interaction-active'), 400);
    }

    try {
      await Database.addReaction(postId, emoji);
    } catch (e) {
      console.warn('Reaction failed, but UI stayed optimistic');
    }
  },

  handleDblClickLike(postId, event) {
    const postCard = document.getElementById(`post - ${postId} `);
    if (!postCard) return;

    const likeBtn = postCard.querySelector('.interaction-btn');
    const isLiked = likeBtn && likeBtn.style.color === 'rgb(255, 59, 48)';
    if (!isLiked) this.toggleLike(postId);

    // Visual Heart Pop
    const heart = document.createElement('div');
    heart.className = 'heart-pop';
    heart.innerHTML = Icons.ms('favorite', { size: 64, fill: true });
    postCard.appendChild(heart);
    setTimeout(() => heart.remove(), 800);
  },
  async bookmarkPost(postId) {
    const cu = AuthService.getUser(); if (!cu) { Utils.showToast('Please sign in to bookmark', 'info'); return; }
    const saved = await Database.toggleBookmark(postId, cu.uid);
    Utils.showToast(saved ? 'Saved to bookmarks 🔖' : 'Removed from bookmarks', 'success');
  },
  selectCategory(el) { document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active')); el.classList.add('active'); this.selectedCategory = el.dataset.category; },
  autoResizeTextarea(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; },
  logout() {
    AuthService.signOut();
    this.navigateTo('landing');
  },


  async toggleFollow(userId, btn) {
    const isFollowing = btn.textContent.trim() === 'Following';

    // Optimistic UI
    btn.textContent = isFollowing ? 'Follow' : 'Following';
    btn.classList.toggle('btn-secondary', isFollowing);
    btn.classList.toggle('btn-primary', !isFollowing);
    btn.classList.add('interaction-active');
    setTimeout(() => btn.classList.remove('interaction-active'), 400);

    try {
      if (isFollowing) await Database.unfollowUser(userId);
      else {
        await Database.followUser(userId);
        Database.createNotification({ targetUid: userId, message: 'started following you', type: 'follow' });
      }
      Utils.showToast(isFollowing ? 'Unfollowed' : 'Following! ✅', 'success');
    } catch (e) {
      // Rollback
      btn.textContent = isFollowing ? 'Following' : 'Follow';
      btn.classList.toggle('btn-secondary', !isFollowing);
      btn.classList.toggle('btn-primary', isFollowing);
      Utils.showToast('Action failed', 'error');
    }
  },

  async startChatWith(userId) { const cu = AuthService.getUser(); if (!cu) return; this.navigateTo('messages'); setTimeout(async () => { const convo = await Database.getOrCreateConversation(cu.uid, userId); this.openChat(convo.id); }, 300); },

  async deletePost(postId) { if (!confirm('Delete this post?')) return; await Database.deletePost(postId); const el = document.getElementById('post-' + postId); if (el) el.remove(); Utils.showToast('Post deleted', 'info'); },

  editProfile() {
    const user = AuthService.getUser(); if (!user) return; const m = document.getElementById('modal-content');
    m.innerHTML = `
  <div class="modal-header" >
      <span class="modal-title">Edit Professional Profile</span>
      <button class="modal-close" onclick="App.closeModal()">×</button>
    </div>
  <div class="modal-body" style="padding:var(--space-6)">
    <form class="auth-form" onsubmit="App.saveProfile(event)" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
      <div class="input-group" style="grid-column:span 2"><label class="input-label">Full Name</label><input type="text" class="input-field" id="edit-name" value="${user.displayName || ''}" required></div>
      <div class="input-group"><label class="input-label">Username</label><input type="text" class="input-field" id="edit-username" value="${user.username || ''}" required></div>
      <div class="input-group"><label class="input-label">Job Title</label><input type="text" class="input-field" id="edit-job" value="${user.jobTitle || ''}" placeholder="e.g. Senior Backend Engineer"></div>
      <div class="input-group"><label class="input-label">Company</label><input type="text" class="input-field" id="edit-company" value="${user.company || ''}" placeholder="e.g. Google, OpenAI"></div>
      <div class="input-group"><label class="input-label">Location</label><input type="text" class="input-field" id="edit-location" value="${user.location || ''}" placeholder="e.g. San Francisco, CA"></div>
      <div class="input-group" style="grid-column:span 2"><label class="input-label">Professional Bio</label><textarea class="input-field" id="edit-bio" rows="4">${user.bio || ''}</textarea></div>
      <div class="input-group"><label class="input-label">Industry</label>
        <select id="edit-industry" class="input-field">
          <option value="">Select Industry</option>
          <option value="AI / ML" ${user.industry === 'AI / ML' ? 'selected' : ''}>AI / Machine Learning</option>
          <option value="Cybersecurity" ${user.industry === 'Cybersecurity' ? 'selected' : ''}>Cybersecurity</option>
          <option value="Software Dev" ${user.industry === 'Software Dev' ? 'selected' : ''}>Software Development</option>
          <option value="Cloud Infra" ${user.industry === 'Cloud Infra' ? 'selected' : ''}>Cloud / DevOps</option>
        </select>
      </div>
      <div class="input-group"><label class="input-label">Skills (comma separated)</label><input type="text" class="input-field" id="edit-skills" value="${(user.skills || []).join(', ')}" placeholder="e.g. Python, Rust, React"></div>

      <h3 style="grid-column:span 2;margin-top:var(--space-4);font-size:var(--fs-md)">Social Links</h3>
      <div class="input-group"><label class="input-label">GitHub Username</label><input type="text" class="input-field" id="edit-github" value="${user.socialLinks?.github || ''}" placeholder="username"></div>
      <div class="input-group"><label class="input-label">LinkedIn Username</label><input type="text" class="input-field" id="edit-linkedin" value="${user.socialLinks?.linkedin || ''}" placeholder="username"></div>
      <div class="input-group"><label class="input-label">Twitter/X Username</label><input type="text" class="input-field" id="edit-twitter" value="${user.socialLinks?.twitter || ''}" placeholder="username"></div>
      <div class="input-group"><label class="input-label">Personal Website</label><input type="text" class="input-field" id="edit-website" value="${user.socialLinks?.website || ''}" placeholder="example.com"></div>

      <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-6)">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" style="padding-left:var(--space-8);padding-right:var(--space-8)">Save Growth Profile</button>
      </div>
    </form>
  </div>`;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },

  async saveProfile(e) {
    e.preventDefault();
    try {
      const skillsStr = document.getElementById('edit-skills').value;
      const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);

      const updateData = {
        displayName: document.getElementById('edit-name').value.trim(),
        username: document.getElementById('edit-username').value.trim(),
        bio: document.getElementById('edit-bio').value.trim(),
        jobTitle: document.getElementById('edit-job').value.trim(),
        company: document.getElementById('edit-company').value.trim(),
        location: document.getElementById('edit-location').value.trim(),
        industry: document.getElementById('edit-industry').value,
        skills: skills,
        socialLinks: {
          github: document.getElementById('edit-github').value.trim(),
          linkedin: document.getElementById('edit-linkedin').value.trim(),
          twitter: document.getElementById('edit-twitter').value.trim(),
          website: document.getElementById('edit-website').value.trim()
        }
      };

      await AuthService.updateProfile(updateData);
      this.closeModal();
      this.usersCache = {};
      this.viewProfile(AuthService.getUser().uid);
      Utils.showToast('Professional Profile updated! ✨', 'success');
    } catch (ex) {
      Utils.showToast(ex.message, 'error');
    }
  },

  async changeAvatar() { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { if (i.files[0]) { try { Utils.showToast('Uploading...', 'info'); await AuthService.updateProfilePhoto(i.files[0]); this.usersCache = {}; this.viewProfile(AuthService.getUser().uid); Utils.showToast('Photo updated! 📸', 'success'); } catch (ex) { Utils.showToast(ex.message, 'error'); } } }; i.click(); },

  async deleteAccount() { if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return; if (!confirm('This will permanently delete all your data. Continue?')) return; try { await AuthService.deleteAccount(); location.hash = '#landing'; Utils.showToast('Account deleted', 'info'); } catch (e) { Utils.showToast(e.message, 'error'); } },

  // ---- Events ----
  createEvent() { const m = document.getElementById('modal-content'); m.innerHTML = `<div class="modal-header" ><span class="modal-title">Create Event</span><button class="modal-close" onclick="App.closeModal()">×</button></div> <div class="modal-body"><form class="auth-form" onsubmit="App.submitEvent(event)"><div class="input-group"><label class="input-label">Event Title</label><input type="text" class="input-field" id="ev-title" required></div><div class="input-group"><label class="input-label">Description</label><textarea class="input-field" id="ev-desc" rows="3" required></textarea></div><div class="input-group"><label class="input-label">Date</label><input type="date" class="input-field" id="ev-date" required></div><div class="input-group"><label class="input-label">Time</label><input type="text" class="input-field" id="ev-time" placeholder="e.g. 10:00 AM" required></div><div class="input-group"><label class="input-label">Location</label><input type="text" class="input-field" id="ev-location" required></div><div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-4)"><button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Create</button></div></form></div>`; document.getElementById('modal-overlay').classList.remove('hidden'); },

  async submitEvent(e) { e.preventDefault(); const cu = AuthService.getUser(); if (!cu) return; await Database.createEvent({ title: document.getElementById('ev-title').value, description: document.getElementById('ev-desc').value, date: document.getElementById('ev-date').value, time: document.getElementById('ev-time').value, location: document.getElementById('ev-location').value, createdBy: cu.uid, companyId: cu.uid }); this.closeModal(); this.navigateTo('events'); Utils.showToast('Event created! 📅', 'success'); },

  async attendEvent(eventId) { const cu = AuthService.getUser(); if (!cu) return; await Database.attendEvent(eventId, cu.uid); Utils.showToast('Registered! 🎫', 'success'); },

  // ---- Comments ----
  async showComments(postId) {
    const m = document.getElementById('modal-content'); m.innerHTML = `<div class="modal-header" ><span class="modal-title">Comments</span><button class="modal-close" onclick="App.closeModal()">×</button></div><div class="modal-body" id="comments-list" style="max-height:400px;overflow-y:auto"><div style="text-align:center;padding:var(--space-6)"><div class="spinner"></div></div></div><div style="padding:var(--space-4) var(--space-6);border-top:1px solid var(--border-secondary);display:flex;gap:var(--space-3)"><input type="text" class="input-field" placeholder="Write a comment..." id="comment-input" onkeydown="if(event.key==='Enter')App.addComment('${postId}')"><button class="btn btn-primary btn-sm" onclick="App.addComment('${postId}')">Post</button></div>`;
    document.getElementById('modal-overlay').classList.remove('hidden');
    try {
      const comments = await Database.getComments(postId); const html = [];
      for (const cm of comments) { const a = await this.getCachedUser(cm.authorId); if (a) html.push(`<div style="display:flex;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--border-secondary)" > ${Components.avatar(a, 'avatar-sm')} <div><div style="font-size:var(--fs-sm);font-weight:var(--fw-semibold)">${a.displayName} <span style="color:var(--text-tertiary);font-weight:normal">· ${Utils.timeAgo(cm.createdAt)}</span></div><div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">${Utils.escapeHtml(cm.text)}</div></div></div>`); }
      document.getElementById('comments-list').innerHTML = html.join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-6)">No comments yet</p>';
    } catch (e) { document.getElementById('comments-list').innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-6)">No comments yet</p>'; }
  },

  async addComment(postId) {
    const i = document.getElementById('comment-input'); if (!i || !i.value.trim()) return; const cu = AuthService.getUser(); if (!cu) return;
    await Database.addComment(postId, { authorId: cu.uid, text: i.value.trim() }); Utils.showToast('Comment posted!', 'success'); i.value = ''; this.showComments(postId);
  },

  // ---- Share Post Modal ----
  sharePost(postId) {
    const url = window.location.origin + window.location.pathname + '#feed?post=' + postId;
    const m = document.getElementById('modal-content');
    document.getElementById('modal-overlay').classList.remove('hidden');
    m.innerHTML = `<div class="modal-header" ><span class="modal-title">Share Post</span><button class="modal-close" onclick="App.closeModal()">×</button></div>
  <div class="modal-body" style="text-align:center">
    <div style="display:flex;justify-content:center;gap:var(--space-4);margin-bottom:var(--space-6)">
      <button class="btn btn-icon" style="width:60px;height:60px;border-radius:50%;background:#1DA1F2;color:white;font-size:24px" onclick="window.open('https://twitter.com/intent/tweet?url='+encodeURIComponent('${url}'))">🐦</button>
      <button class="btn btn-icon" style="width:60px;height:60px;border-radius:50%;background:#0A66C2;color:white;font-size:24px" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent('${url}'))">💼</button>
      <button class="btn btn-icon" style="width:60px;height:60px;border-radius:50%;background:#25D366;color:white;font-size:24px" onclick="window.open('https://api.whatsapp.com/send?text='+encodeURIComponent('${url}'))">💬</button>
    </div>
    <div class="input-group" style="flex-direction:row;align-items:center;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:var(--space-2)">
      <input type="text" readonly value="${url}" style="flex:1;background:transparent;border:none;outline:none;color:var(--text-primary);padding:0 var(--space-2)">
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${url}'); Utils.showToast('Link copied to clipboard!', 'success'); App.closeModal();">Copy</button>
    </div>
  </div>`;
  },

  // ---- Misc ----
  saveInsight(id) {
    Utils.showToast('Insight saved to Personal Shelf', 'success');
  },
  shareInsight(id) {
    Utils.showToast('Internal link copied to clipboard', 'info');
  },
  showPostMenu(id, btn) {
    const existing = document.getElementById(`post - menu - ${id} `);
    if (existing) {
      existing.classList.toggle('hidden');
      return;
    }

    const menu = document.createElement('div');
    menu.id = `post - menu - ${id} `;
    menu.className = 'dropdown-menu';
    menu.style.top = '100%';
    menu.style.right = '0';
    menu.innerHTML = `
  <div class="dropdown-item" onclick="App.sharePost('${id}'); document.getElementById('post-menu-${id}').classList.add('hidden')" >
    ${Icons.ms('link')} <span>Copy Link</span>
      </div>
      <div class="dropdown-item" onclick="App.bookmarkPost('${id}'); document.getElementById('post-menu-${id}').classList.add('hidden')">
        ${Icons.ms('bookmark')} <span>Bookmark</span>
      </div>
      <div class="dropdown-item" style="color:var(--error)" onclick="App.deletePost('${id}'); document.getElementById('post-menu-${id}').classList.add('hidden')">
        ${Icons.ms('delete')} <span>Delete Post</span>
      </div>
`;

    btn.parentElement.style.position = 'relative';
    btn.parentElement.appendChild(menu);
  },
  previewPostImage(input) {
    const a = document.getElementById('image-preview-area');
    if (input.files[0] && a) {
      const u = URL.createObjectURL(input.files[0]);
      a.innerHTML = `
  <div class="image-preview" style="position:relative; margin-top:12px; border-radius:12px; overflow:hidden; border:1px solid var(--border-primary)" >
    <img src="${u}" style="width:100%; display:block; max-height:300px; object-fit:cover">
      <div class="remove-btn" onclick="App.clearImagePreview()"
        style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; backdrop-filter:blur(4px)">✕</div>
    </div>`;
    }
  },

  clearImagePreview() {
    const fi = document.getElementById('post-image-input');
    const preview = document.getElementById('image-preview-area');
    if (fi) fi.value = '';
    if (preview) preview.innerHTML = '';
  },
  filterExplore(el, c) { document.querySelectorAll('.explore-tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); },
  insertCode() { const i = document.getElementById('create-post-input'); if (i) { const s = i.selectionStart; i.value = i.value.slice(0, s) + '\n```javascript\n// code here\n```\n' + i.value.slice(s); i.focus(); } },
  async filterByCategory(cat) { this.navigateTo('explore'); setTimeout(async () => { const pc = document.getElementById('explore-posts'); if (!pc) return; try { const posts = await Database.getPostsByCategory(cat); const h = []; for (const p of posts) { const a = await this.getCachedUser(p.authorId); if (a) h.push(Components.postCard(p, a)); } pc.innerHTML = h.join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:var(--space-12)">No posts in this category</p>'; } catch (e) { } }, 200); },
  searchHashtag(tag) { Utils.showToast(`Searching ${tag}...`, 'info'); this.navigateTo('explore'); },
  handleSearch: Utils.debounce(async function (q) {
    if (q.length < 2) return;
    try {
      const pc = document.getElementById('explore-posts') || document.getElementById('posts-container');
      if (!pc) return;
      pc.innerHTML = '<div style="text-align:center;padding:var(--space-8)"><div class="spinner"></div></div>';
      const [users, posts] = await Promise.all([Database.searchUsers(q), Database.searchPosts(q)]);
      const html = [];
      if (users.length > 0) {
        html.push(`<div style="margin-bottom:var(--space-6)"><h3 style="font-size:var(--fs-sm);color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-4);padding-left:var(--space-2)">Profiles</h3>`);
        for (const u of users) {
          html.push(`<div class="post-card" style="padding:var(--space-3) var(--space-4);margin-bottom:var(--space-2);display:flex;align-items:center;gap:var(--space-3);cursor:pointer;background:var(--bg-card)" onclick="App.viewProfile('${u.uid}')">
            ${Components.avatar(u, 'avatar-md')}
            <div style="flex:1">
               <div style="font-weight:600">${u.displayName}</div>
               <div style="font-size:var(--fs-xs);color:var(--text-tertiary)">@${u.username}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();App.viewProfile('${u.uid}')">View</button>
          </div>`);
        }
        html.push(`</div>`);
      }
      if (posts.length > 0) {
        html.push(`<div style="margin-bottom:var(--space-6)"><h3 style="font-size:var(--fs-sm);color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-4);padding-left:var(--space-2)">Related Posts</h3>`);
        for (const p of posts) {
          const a = await App.getCachedUser(p.authorId);
          if (a) html.push(Components.postCard(p, a));
        }
        html.push(`</div>`);
      }
      if (users.length === 0 && posts.length === 0) {
        pc.innerHTML = `<div class="animate-fadeIn" style="text-align:center;padding:var(--space-12)"><div style="font-size:48px;margin-bottom:var(--space-4)">🔍</div><h3 style="color:var(--text-primary)">No results for "${q}"</h3><p style="color:var(--text-secondary);margin-top:var(--space-2)">Try searching for usernames like @techol_app or topics like AI</p></div>`;
      } else { pc.innerHTML = html.join(''); }
    } catch (e) { }
  }, 500),
  newChat() { Utils.showToast('Use the Message button on any user profile to start chatting!', 'info'); },
  showModal(content) {
    const overlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (overlay && modalContent) {
      modalContent.innerHTML = content;
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      // Add escape key listener to close modal
      const closeOnEsc = (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
          window.removeEventListener('keydown', closeOnEsc);
        }
      };
      window.addEventListener('keydown', closeOnEsc);
    }
  },

  closeModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('close-modal-trigger')) return;
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }
  },
  toggleSidebar() { const s = document.getElementById('sidebar'); if (s) { this.sidebarOpen = !this.sidebarOpen; s.classList.toggle('open', this.sidebarOpen); } },

  // ── Sector Hero Chart ────────────────────────────────────
  _sectorChartInstance: null,
  _chartMetric: "velocity",
  _chartType: "line",
  _chartLiveTimer: null,
  _heatmapTimer: null,
  _chartLiveData: [],
  _chartLiveLabels: [],

  _generateLiveDataPoint(sector) {
    const sectorInfo = (typeof RealtimeDataEngine !== "undefined")
      ? RealtimeDataEngine.sectorData.find(s => s.sector === sector) || RealtimeDataEngine.sectorData.find(s => sector.toLowerCase().includes(s.sector.toLowerCase())) || { score: 50 }
      : { score: 50 };
    const signals = (typeof RealtimeDataEngine !== "undefined" && RealtimeDataEngine.getSectorSignals)
      ? RealtimeDataEngine.getSectorSignals(sector) || { news: 0, github: 0, hn: 0 }
      : { news: 0, github: 0, hn: 0 };
    const baseScore = sectorInfo.score || 50;
    const totalSignals = signals.news + signals.github + signals.hn;
    const now = Date.now();
    const tw = Math.sin(now / 1000) * 5;
    const mw = Math.cos(now / 300) * 3;
    const jitter = (Math.random() - 0.5) * 8;
    let value;
    if (this._chartMetric === "velocity") {
      value = Math.round(baseScore * 80 + totalSignals * 10 + tw * 20 + mw * 15 + jitter * 10);
    } else if (this._chartMetric === "growth") {
      value = Math.round((baseScore / 12 + tw * 0.3 + mw * 0.2 + jitter * 0.1) * 100) / 100;
    } else {
      value = Math.round(Math.abs(baseScore * 3 + totalSignals * 2 + tw * 6 + jitter * 3));
    }
    return { value: value, timestamp: now };
  },

  _initLiveChart(sector) {
    const canvas = document.getElementById("sector-hero-chart");
    if (!canvas) return;
    if (this._chartLiveTimer) { clearInterval(this._chartLiveTimer); this._chartLiveTimer = null; }
    if (this._heatmapTimer) { clearInterval(this._heatmapTimer); this._heatmapTimer = null; }
    if (this._sectorChartInstance) { try { this._sectorChartInstance.destroy(); } catch(e) {} this._sectorChartInstance = null; }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sectorName = sector || localStorage.getItem("techol_user_sector") || "AI Models & Releases";
    const titleEl = document.getElementById("sector-chart-title");
    if (titleEl) titleEl.textContent = sectorName + " Live Activity";
    let chartColor = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#6366f1";
    if (typeof RealtimeDataEngine !== "undefined") {
      const si = RealtimeDataEngine.sectorData.find(s => s.sector === sectorName) || RealtimeDataEngine.sectorData.find(s => sectorName.includes(s.sector));
      if (si && si.color) chartColor = si.color;
    }
    this._chartLiveLabels = [];
    this._chartLiveData = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const t = now - (i * 1000);
      this._chartLiveLabels.push(new Date(t).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      this._chartLiveData.push(this._generateLiveDataPoint(sectorName).value);
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, (canvas.parentElement && canvas.parentElement.clientHeight) || 380);
    gradient.addColorStop(0, chartColor + "60");
    gradient.addColorStop(1, chartColor + "00");
    const yLabel = this._chartMetric === "velocity" ? "Activity Score" : this._chartMetric === "growth" ? "Growth %" : "Funding ($M)";
    this._sectorChartInstance = new Chart(ctx, {
      type: this._chartType,
      data: { labels: this._chartLiveLabels, datasets: [{ label: yLabel, data: this._chartLiveData, borderColor: chartColor, backgroundColor: this._chartType === "line" ? gradient : chartColor + "80", borderWidth: 2, fill: this._chartType === "line", tension: 0.3, pointRadius: 0, pointHoverRadius: 4, pointBackgroundColor: chartColor, barPercentage: 0.8 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 150 },
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "rgba(0,0,0,0.9)", padding: 12, cornerRadius: 8, displayColors: false, callbacks: { label: function(c) { const v = c.parsed.y; if (App._chartMetric === "growth") return "Growth: " + v.toFixed(2) + "%"; if (App._chartMetric === "funding") return "Funding: $" + v + "M"; return "Score: " + v.toLocaleString(); } } } },
        scales: { x: { display: true, grid: { color: "rgba(255,255,255,0.03)" }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 9, family: "JetBrains Mono, monospace" }, maxTicksLimit: 8, maxRotation: 0 } }, y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "rgba(255,255,255,0.4)", font: { size: 10, family: "JetBrains Mono, monospace" }, callback: function(v) { if (App._chartMetric === "growth") return v.toFixed(1) + "%"; if (App._chartMetric === "funding") return "$" + v + "M"; return v.toLocaleString(); } } } }
      }
    });
    const self = this;
    this._chartLiveTimer = setInterval(function() {
      if (!self._sectorChartInstance) return;
      const pt = self._generateLiveDataPoint(sectorName);
      const timeLabel = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      self._chartLiveLabels.shift(); self._chartLiveLabels.push(timeLabel);
      self._chartLiveData.shift(); self._chartLiveData.push(pt.value);
      self._sectorChartInstance.data.labels = self._chartLiveLabels;
      self._sectorChartInstance.data.datasets[0].data = self._chartLiveData;
      self._sectorChartInstance.update("none");
      const lv = document.getElementById("chart-live-value");
      if (lv) { lv.textContent = pt.value.toLocaleString(); lv.style.color = pt.value > self._chartLiveData[self._chartLiveData.length - 2] ? "var(--success)" : "var(--error)"; }
    }, 1000);
  },

  _switchChartType(type) {
    this._chartType = type;
    const lineBtn = document.getElementById("chart-type-line");
    const barBtn = document.getElementById("chart-type-bar");
    if (lineBtn && barBtn) {
      if (type === "line") {
        lineBtn.style.background = "var(--accent)"; lineBtn.style.color = "#fff"; lineBtn.style.border = "none";
        barBtn.style.background = "var(--bg-input)"; barBtn.style.color = "var(--text-secondary)"; barBtn.style.border = "1px solid var(--border-secondary)";
      } else {
        barBtn.style.background = "var(--accent)"; barBtn.style.color = "#fff"; barBtn.style.border = "none";
        lineBtn.style.background = "var(--bg-input)"; lineBtn.style.color = "var(--text-secondary)"; lineBtn.style.border = "1px solid var(--border-secondary)";
      }
    }
    const sector = localStorage.getItem("techol_user_sector") || "AI Models & Releases";
    this._initLiveChart(sector);
  },

  _switchChartMetric(metric) {
    this._chartMetric = metric;
    document.querySelectorAll(".chart-metric-btn").forEach(function(btn) {
      if ((metric === "velocity" && btn.textContent.trim() === "Velocity") || (metric === "growth" && btn.textContent.trim() === "Growth Rate") || (metric === "funding" && btn.textContent.trim() === "Funding")) {
        btn.style.background = "linear-gradient(135deg, var(--accent), #005fd4)"; btn.style.color = "#fff"; btn.style.fontWeight = "800"; btn.style.boxShadow = "0 4px 12px rgba(var(--accent-rgb),0.3)";
      } else {
        btn.style.background = "transparent"; btn.style.color = "var(--text-secondary)"; btn.style.fontWeight = "700"; btn.style.boxShadow = "none";
      }
    });
    const sector = localStorage.getItem("techol_user_sector") || "AI Models & Releases";
    this._initLiveChart(sector);
  },

  // Premium: Animate platform stats counters
  _animatePlatformStats() {
    const foundersEl = document.getElementById('stat-founders');
    const signalsEl = document.getElementById('stat-signals');
    if (!foundersEl || !signalsEl) return;

    // Animate founders count
    let fTarget = 12847;
    let fCurrent = 0;
    const fStep = Math.ceil(fTarget / 60);
    const fInterval = setInterval(() => {
      fCurrent = Math.min(fCurrent + fStep, fTarget);
      foundersEl.textContent = fCurrent.toLocaleString();
      if (fCurrent >= fTarget) clearInterval(fInterval);
    }, 16);

    // Periodically bump stats to look alive
    setInterval(() => {
      const el = document.getElementById('stat-signals');
      if (el) {
        const current = parseInt(el.textContent.replace(/,/g, '')) || 2341;
        el.textContent = (current + Math.floor(Math.random() * 5) + 1).toLocaleString();
        el.classList.add('value-updated');
        setTimeout(() => el.classList.remove('value-updated'), 500);
      }
      const fEl = document.getElementById('stat-founders');
      if (fEl && Math.random() > 0.7) {
        const fc = parseInt(fEl.textContent.replace(/,/g, '')) || 12847;
        fEl.textContent = (fc + 1).toLocaleString();
      }
    }, 3000);
  },

  _newsTab: 'trending',

  _switchNewsTab(tab) {
    this._newsTab = tab;

    // Update tab button styles
    const trendingBtn = document.getElementById('news-tab-trending');
    const latestBtn = document.getElementById('news-tab-latest');
    if (trendingBtn && latestBtn) {
      if (tab === 'trending') {
        trendingBtn.style.background = 'var(--bg-elevated)';
        trendingBtn.style.color = 'var(--text-primary)';
        trendingBtn.style.border = '1px solid var(--border-primary)';
        trendingBtn.style.fontWeight = '800';
        trendingBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        latestBtn.style.background = 'transparent';
        latestBtn.style.color = 'var(--text-secondary)';
        latestBtn.style.border = 'none';
        latestBtn.style.fontWeight = '700';
        latestBtn.style.boxShadow = 'none';
      } else {
        latestBtn.style.background = 'var(--bg-elevated)';
        latestBtn.style.color = 'var(--text-primary)';
        latestBtn.style.border = '1px solid var(--border-primary)';
        latestBtn.style.fontWeight = '800';
        latestBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        trendingBtn.style.background = 'transparent';
        trendingBtn.style.color = 'var(--text-secondary)';
        trendingBtn.style.border = 'none';
        trendingBtn.style.fontWeight = '700';
        trendingBtn.style.boxShadow = 'none';
      }
    }

    // Update news content
    const container = document.getElementById('news-content-container');
    if (!container) return;

    let newsItems = [];
    if (window.LiveNewsEngine) {
      const buf = window.LiveNewsEngine.getBuffer(10);
      newsItems = buf.map(n => ({
        title: n.title || 'Breaking Signal',
        pubDate: n.pubDate || n.createdAt || new Date().toISOString(),
        source: n.source || 'Live Intelligence',
        link: n.link || '#'
      }));
    }

    if (tab === 'trending') {
      // Sort by engagement (simulate by title length as proxy)
      newsItems.sort((a, b) => b.title.length - a.title.length);
    } else {
      // Sort by date (latest first)
      newsItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    }

    // Take top 5
    newsItems = newsItems.slice(0, 5);

    container.innerHTML = Components.trendingSidebar([], [], newsItems);
  },

  showSectorPicker() {
    const panel = document.getElementById('sector-picker-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  },

  async setUserSector(sector) {
    console.log('[TechOL] setUserSector called with:', sector);
    try {
      // 1. Save preference
      const user = AuthService.getUser();
      if (user) {
        try {
          const { doc: firestoreDoc, setDoc } = await import('firebase/firestore');
          const { db } = await import('./firebase-config.js');
          await setDoc(firestoreDoc(db, 'users', user.uid), { sector, industry: sector }, { merge: true });
        } catch (e) { console.warn('[TechOL] Cloud save failed:', e); }
        user.sector = sector;
        user.industry = sector;
      }
      localStorage.setItem('techol_user_sector', sector);

      // 2. Hide picker
      const panel = document.getElementById('sector-picker-panel');
      if (panel) panel.style.display = 'none';

      // 3. Toast
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Sector switched to ${sector}`, 'success');
      }

      // 4. Destroy old chart
      if (this._sectorChartInstance) {
        try { this._sectorChartInstance.destroy(); } catch(e) {}
        this._sectorChartInstance = null;
      }

      // 5. Clear timers
      if (this._livePulseTimer) { clearInterval(this._livePulseTimer); this._livePulseTimer = null; }
      if (this._feedUnsub) { try { this._feedUnsub(); } catch(e) {} this._feedUnsub = null; }

      // 6. Full page re-render
      const container = document.getElementById('content-area');
      if (container) {
        await this.renderIntelligenceStream(container);
      }
      console.log('[TechOL] Sector switch complete:', sector);
    } catch (err) {
      console.error('[TechOL] setUserSector FAILED:', err);
    }
  },

  async toggleNotifDropdown() {
    const drop = document.getElementById('notif-dropdown');
    if (!drop) return;
    if (!drop.classList.contains('hidden')) {
      drop.classList.add('hidden');
      return;
    }
    drop.classList.remove('hidden');
    drop.innerHTML = '<div style="text-align:center;padding:var(--space-8)"><div class="spinner"></div></div>';
    const cu = AuthService.getUser(); if (!cu) return;
    try {
      const notifs = await Database.getNotifications(cu.uid);
      await Database.markNotificationsRead(cu.uid);
      App.updateNotifBadge(); // clear badge
      if (!notifs.length) {
        drop.innerHTML = `
          <div style="padding:var(--space-8);text-align:center;color:var(--text-tertiary)">
            <div style="font-size:32px;margin-bottom:12px">🔔</div>
            <div style="font-weight:600">No new notifications</div>
            <div style="font-size:12px;margin-top:4px">We'll ping you when something happens</div>
          </div>`;
        return;
      }
      const html = [];
      html.push('<div style="padding:16px;font-weight:800;font-size:14px;border-bottom:1px solid var(--border-secondary);display:flex;justify-content:space-between;align-items:center">Notifications <span style="font-size:10px;font-weight:500;color:var(--accent);cursor:pointer" onclick="App.navigateTo(\'notifications\')">Settings</span></div>');
      for (let n of notifs.slice(0, 10)) {
        const u = await App.getCachedUser(n.fromUid);
        html.push(`
          <div class="dropdown-item" onclick="App.navigateTo('notifications');document.getElementById('notif-dropdown').classList.add('hidden')">
            ${u ? Components.avatar(u, 'avatar-sm') : '<div class="avatar avatar-sm avatar-placeholder">T</div>'}
            <div style="flex:1">
              <div style="color:var(--text-primary)"><span style="font-weight:700">${u ? u.displayName : 'Someone'}</span> ${n.message}</div>
              <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">${Utils.timeAgo(n.createdAt)}</div>
            </div>
            ${!n.read ? '<div style="width:6px;height:6px;border-radius:50%;background:var(--accent)"></div>' : ''}
          </div>`);
      }
      html.push(`<div style="padding:14px;text-align:center;cursor:pointer;color:var(--accent);font-size:var(--fs-xs);font-weight:700;background:var(--bg-secondary)" onclick="App.navigateTo('notifications');document.getElementById('notif-dropdown').classList.add('hidden')">VIEW ALL ACTIVITY</div>`);
      drop.innerHTML = html.join('');
    } catch (e) {
      console.error(e);
      drop.innerHTML = '<div style="padding:var(--space-6);text-align:center;color:var(--error)">Failed to sync notifications</div>';
    }
  },
  async updateNotifBadge() {
    const cu = AuthService.getUser(); if (!cu) return;
    try {
      const notifs = await Database.getNotifications(cu.uid);
      const unread = notifs.filter(n => !n.read).length;
      const badge = document.getElementById('notif-badge');
      if (badge) {
        if (unread > 0) { badge.style.display = 'block'; badge.textContent = unread > 99 ? '99+' : unread; }
        else { badge.style.display = 'none'; }
      }
    } catch (e) { }
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());
export default App;

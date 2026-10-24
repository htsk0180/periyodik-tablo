/* Three.js powered atom / orbital visualisations and hero scene */
(function () {
  const GLOBAL = window;
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const IS_MOBILE = () => window.matchMedia("(max-width: 720px)").matches;

  let glowTexture = null;
  function makeGlowTexture() {
    if (glowTexture) return glowTexture;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.15, "rgba(255,255,255,0.95)");
    g.addColorStop(0.4, "rgba(160,220,255,0.45)");
    g.addColorStop(1, "rgba(80,160,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    glowTexture = new THREE.CanvasTexture(c);
    glowTexture.needsUpdate = true;
    return glowTexture;
  }

  const CAT_COLORS = {
    "alkali-metal": 0xff7a59, "alkaline-earth-metal": 0xffb454,
    "transition-metal": 0x4cc9f0, "post-transition-metal": 0x7dd3a7,
    metalloid: 0xb8e986, nonmetal: 0x5eead4, halogen: 0xf9e76c,
    "noble-gas": 0xc084fc, lanthanide: 0xf472b6, actinide: 0xfb7185,
    unknown: 0x94a3b8
  };

  /* ---------------- orbital mathematics ---------------- */
  const SUP_MAP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
  function parseSubshells(element) {
    const cfg = (element.electronConfigFull || "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUP_MAP[c]);
    const out = [];
    const re = /(\d)([spdf])(\d+)/g;
    let m;
    while ((m = re.exec(cfg))) {
      out.push({ n: +m[1], l: "spdf".indexOf(m[2]), electrons: +m[3] });
    }
    return out;
  }

  function associatedLaguerre(k, alpha, x) {
    if (k === 0) return 1;
    let l0 = 1;
    let l1 = 1 + alpha - x;
    if (k === 1) return l1;
    for (let i = 1; i < k; i++) {
      const l2 = ((2 * i + 1 + alpha - x) * l1 - (i + alpha) * l0) / (i + 1);
      l0 = l1; l1 = l2;
    }
    return l1;
  }

  function radialR(n, l, r) {
    const rho = 2 * r / n;
    const lag = associatedLaguerre(n - l - 1, 2 * l + 1, rho);
    return Math.pow(rho, l) * Math.exp(-rho / 2) * lag;
  }

  function radialCDF(n, l, rMax, bins = 600) {
    const pdf = new Float64Array(bins + 1);
    const cdf = new Float64Array(bins + 1);
    let sum = 0;
    for (let i = 0; i <= bins; i++) {
      const r = (i / bins) * rMax;
      const R = radialR(n, l, r);
      const p = r * r * R * R;
      pdf[i] = Math.max(0, p);
      if (i > 0) sum += (pdf[i] + pdf[i - 1]) * 0.5;
      cdf[i] = sum;
    }
    for (let i = 0; i <= bins; i++) cdf[i] /= sum || 1;
    return { rMax, bins, cdf };
  }

  function sampleRadius(table) {
    const u = Math.random();
    let lo = 0, hi = table.bins;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (table.cdf[mid] < u) lo = mid + 1; else hi = mid;
    }
    const frac = (u - table.cdf[Math.max(0, lo - 1)]) / Math.max(1e-9, table.cdf[lo] - table.cdf[Math.max(0, lo - 1)]);
    return ((lo - 1 + frac) / table.bins) * table.rMax;
  }

  function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }

  function assocLegendre(l, m, x) {
    m = Math.abs(m);
    let pmm = 1;
    if (m > 0) {
      const somx2 = Math.sqrt(Math.max(0, 1 - x * x));
      let f = 1;
      for (let i = 1; i <= m; i++) { pmm *= -f * somx2; f += 2; }
    }
    if (l === m) return pmm;
    let pmmp1 = x * (2 * m + 1) * pmm;
    if (l === m + 1) return pmmp1;
    let pll = 0;
    for (let ll = m + 2; ll <= l; ll++) {
      pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
      pmm = pmmp1; pmmp1 = pll;
    }
    return pll;
  }

  function realY(l, m, theta, phi) {
    const am = Math.abs(m);
    const norm = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (fact(l - am) / fact(l + am)));
    const p = assocLegendre(l, am, Math.cos(theta));
    let trig = 1;
    if (m > 0) trig = Math.SQRT2 * Math.cos(am * phi);
    else if (m < 0) trig = Math.SQRT2 * Math.sin(am * phi);
    return norm * p * trig;
  }

  function orbitalName(l, m) {
    if (l === 0) return "s";
    if (l === 1) return m === 0 ? "p_z" : (m > 0 ? "p_x" : "p_y");
    if (l === 2) {
      if (m === 0) return "d_z²";
      if (m === 1) return "d_xz";
      if (m === -1) return "d_yz";
      if (m === 2) return "d_x²−y²";
      return "d_xy";
    }
    if (l === 3) {
      if (m === 0) return "f_z³";
      if (m === 1) return "f_xz²";
      if (m === -1) return "f_yz²";
      if (m === 2) return "f_z(x²−y²)";
      if (m === -2) return "f_xyz";
      if (m === 3) return "f_x(x²−3y²)";
      return "f_y(3x²−y²)";
    }
    return `m=${m}`;
  }

  function generateOrbitalPoints(n, l, m, count) {
    const rMax = 4 * n * n + 12 * n;
    const table = radialCDF(n, l, rMax);
    // estimate angular maximum
    let maxY = 0;
    for (let i = 0; i < 12000; i++) {
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const y = realY(l, m, Math.acos(u), phi);
      const a = y * y;
      if (a > maxY) maxY = a;
    }
    maxY = maxY || 1;
    const pts = [];
    const colors = [];
    const cPos = new THREE.Color(0x67e8f9);
    const cNeg = new THREE.Color(0xf472b6);
    let tries = 0;
    while (pts.length < count && tries < count * 600) {
      tries++;
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(u);
      const y = realY(l, m, theta, phi);
      if (Math.random() > (y * y) / maxY) continue;
      const r = sampleRadius(table);
      const sp = Math.sqrt(Math.max(0, 1 - u * u));
      pts.push(r * sp * Math.cos(phi), r * u, r * sp * Math.sin(phi));
      const c = y >= 0 ? cPos : cNeg;
      colors.push(c.r, c.g, c.b);
    }
    // normalise cloud to a pleasant size
    let maxR = 0.001;
    for (let i = 0; i < pts.length; i += 3) {
      maxR = Math.max(maxR, Math.hypot(pts[i], pts[i + 1], pts[i + 2]));
    }
    const scale = 6.4 / maxR;
    for (let i = 0; i < pts.length; i += 3) {
      pts[i] *= scale; pts[i + 1] *= scale; pts[i + 2] *= scale;
    }
    return { positions: new Float32Array(pts), colors: new Float32Array(colors), points: pts.length / 3, maxR: 6.4 };
  }

  /* ---------------- Atom viewer ---------------- */
  class AtomViewer {
    constructor(canvas, element) {
      this.canvas = canvas;
      this.element = element;
      this.mode = "bohr";
      this.subshells = parseSubshells(element);
      this.selected = this.pickSubshell();
      this.autoRotate = !REDUCED;
      this.speed = 1;
      this.electrons = [];
      this.disposed = false;
      this.init();
    }

    pickSubshell() {
      const withE = this.subshells.filter((s) => s.electrons > 0);
      if (!withE.length) return { n: 1, l: 0, electrons: 1 };
      const maxN = Math.max(...withE.map((s) => s.n));
      const atN = withE.filter((s) => s.n === maxN);
      const maxL = Math.max(...atN.map((s) => s.l));
      return atN.find((s) => s.l === maxL) || atN[0];
    }

    init() {
      const w = Math.max(280, this.canvas.clientWidth || 400);
      const h = Math.max(280, this.canvas.clientHeight || 380);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 300);
      this.camera.position.set(0, 0, 15.5);
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);
      if (this.renderer.outputEncoding !== undefined) this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.07;
      this.controls.enablePan = false;
      this.controls.minDistance = 4;
      this.controls.maxDistance = 42;
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 0.55;

      this.scene.add(new THREE.AmbientLight(0x8899ff, 0.8));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(5, 8, 10);
      this.scene.add(key);
      const rim = new THREE.PointLight(0x4cc9f0, 1.2, 60);
      rim.position.set(-8, -2, 6);
      this.scene.add(rim);

      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.clock = new THREE.Clock();
      this.build();
      this.animate = this.animate.bind(this);
      this.raf = requestAnimationFrame(this.animate);
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(this.canvas.parentElement || this.canvas);
      this.resize();
    }

    resize() {
      if (this.disposed) return;
      const parent = this.canvas.parentElement || this.canvas;
      const w = Math.max(240, parent.clientWidth);
      const h = Math.max(240, parent.clientHeight);
      if (!w || !h) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    }

    clearRoot() {
      while (this.root.children.length) {
        const obj = this.root.children.pop();
        obj.traverse?.((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => { if (m.map && m.map !== glowTexture) m.map.dispose(); m.dispose(); });
          }
        });
      }
      this.electrons = [];
    }

    build() {
      this.clearRoot();
      this.root.scale.setScalar(1);
      if (this.mode === "bohr") this.buildBohr();
      else this.buildOrbital();
    }

    makeNucleus(radius = 1) {
      const g = new THREE.Group();
      const A = Math.max(1, Math.round(this.element.mass || this.element.z * 2));
      const protons = this.element.z;
      const neutrons = Math.max(0, Math.min(220, A - protons));
      const visual = Math.max(1, Math.min(64, Math.ceil((protons + neutrons) / 3)));
      const pColor = 0xff5c7a, nColor = 0x7aa2ff;
      const nP = Math.max(1, Math.round((protons / (protons + neutrons || 1)) * visual));
      for (let i = 0; i < visual; i++) {
        const c = i < nP ? pColor : nColor;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.24, 12, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.15, emissive: c, emissiveIntensity: 0.22 }));
        const rr = radius * 0.55 * Math.cbrt(Math.random());
        const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
        const sp = Math.sqrt(1 - u * u);
        mesh.position.set(rr * sp * Math.cos(ph), rr * u, rr * sp * Math.sin(ph));
        g.add(mesh);
      }
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0x89d7ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.setScalar(radius * 3.4);
      g.add(glow);
      return g;
    }

    buildBohr() {
      this.controls.minDistance = 4;
      this.controls.maxDistance = 42;
      const shells = (this.element.shells || []).filter((x) => x > 0);
      const nShells = shells.length || 1;
      const nucleusR = 0.42 + Math.cbrt(this.element.z) * 0.07;
      const nucleus = this.makeNucleus(nucleusR);
      this.root.add(nucleus);

      const baseRadius = 1.55 + nucleusR;
      const gap = Math.min(1.2, 5.8 / nShells);
      const maxR = baseRadius + gap * (nShells - 1);
      const target = 7.4;
      const scale = target / maxR;
      this.root.scale.setScalar(Math.min(1.35, scale));

      const colors = [0x67e8f9, 0x7aa2ff, 0xc084fc, 0xf472b6, 0xf9e76c, 0x5eead4, 0xffb454];
      shells.forEach((count, i) => {
        const r = baseRadius + gap * i;
        const tilt = new THREE.Group();
        tilt.rotation.set(0.22 * (i % 3) - 0.2, 0.55 * i, 0.16 * (i + 1));
        this.root.add(tilt);

        const pts = [];
        const seg = 128;
        for (let j = 0; j <= seg; j++) {
          const a = (j / seg) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
        }
        const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.22 }));
        tilt.add(ring);

        const eCount = Math.min(count, 24);
        const eColor = colors[i % colors.length];
        for (let e = 0; e < eCount; e++) {
          const a0 = (e / eCount) * Math.PI * 2;
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), new THREE.MeshBasicMaterial({ color: eColor }));
          mesh.position.set(Math.cos(a0) * r, Math.sin(a0) * r, 0);
          const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: eColor, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
          glow.scale.setScalar(0.55);
          mesh.add(glow);
          tilt.add(mesh);
          this.electrons.push({ mesh, radius: r, angle: a0, speed: (0.55 / (i + 1)) * (i % 2 ? -1 : 1) });
        }
      });
    }

    buildOrbital() {
      const sub = this.selected;
      const nucleusR = 0.2;
      this.root.add(this.makeNucleus(nucleusR));
      const m = this.mValue ?? 0;
      const count = IS_MOBILE() ? 3600 : 6500;
      const data = generateOrbitalPoints(sub.n, sub.l, m, count);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
      const mat = new THREE.PointsMaterial({
        size: IS_MOBILE() ? 0.052 : 0.043,
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });
      const points = new THREE.Points(geo, mat);
      this.root.add(points);
      this.orbitalPoints = points;
      this.controls.minDistance = 3;
      this.controls.maxDistance = 28;
      this.camera.position.set(0, 0, 14.5);
      this.controls.update();
    }

    setMode(mode) {
      if (mode !== "bohr" && mode !== "orbital") return;
      this.mode = mode;
      this.build();
    }

    setSubshell(n, l) {
      this.selected = { n, l, electrons: this.subshells.find((s) => s.n === n && s.l === l)?.electrons || 0 };
      this.mValue = 0;
      if (this.mode === "orbital") this.build();
    }

    setM(m) {
      this.mValue = m;
      if (this.mode === "orbital") this.build();
    }

    setSpeed(v) {
      this.speed = v;
      this.controls.autoRotateSpeed = 0.55 * v;
    }

    toggleAutoRotate(force) {
      this.autoRotate = force === undefined ? !this.autoRotate : !!force;
      this.controls.autoRotate = this.autoRotate;
    }

    resetView() {
      this.camera.position.set(0, 0, this.mode === "bohr" ? 15.5 : 14.5);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    animate() {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.animate);
      const dt = Math.min(0.05, this.clock.getDelta());
      if (!REDUCED) {
        const t = this.clock.elapsedTime;
        if (this.mode === "bohr") {
          this.electrons.forEach((e) => {
            e.angle += e.speed * dt * this.speed;
            e.mesh.position.set(Math.cos(e.angle) * e.radius, Math.sin(e.angle) * e.radius, 0);
          });
        } else if (this.orbitalPoints) {
          this.orbitalPoints.rotation.y += dt * 0.1 * this.speed;
          this.orbitalPoints.rotation.x = Math.sin(t * 0.08) * 0.12;
        }
        this.root.rotation.y += dt * 0.03 * this.speed;
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.raf);
      this.resizeObs?.disconnect();
      this.controls?.dispose();
      this.clearRoot();
      this.renderer.dispose();
    }
  }

  /* ---------------- Hero scene ---------------- */
  class HeroScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.init();
    }
    init() {
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || 480;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
      this.camera.position.set(0, 0, 11);
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);

      this.group = new THREE.Group();
      this.scene.add(this.group);
      const c = CAT_COLORS["transition-metal"];
      const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 2), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, wireframe: true, transparent: true, opacity: 0.55 }));
      this.group.add(nucleus);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), new THREE.MeshBasicMaterial({ color: 0xd8f6ff }));
      this.group.add(core);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0x4cc9f0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.setScalar(5.2);
      this.group.add(glow);

      this.rings = [];
      const colors = [0x67e8f9, 0x7aa2ff, 0xc084fc];
      for (let i = 0; i < 3; i++) {
        const r = 1.75 + i * 0.72;
        const pts = [];
        for (let j = 0; j <= 160; j++) {
          const a = (j / 160) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
        }
        const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: colors[i], transparent: true, opacity: 0.3 - i * 0.04 }));
        const tilt = new THREE.Group();
        tilt.rotation.set(0.9 * i - 0.35, 0.6 * i, 0.5 * i);
        tilt.add(ring);
        const electron = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), new THREE.MeshBasicMaterial({ color: colors[i] }));
        const eg = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: colors[i], transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
        eg.scale.setScalar(0.7);
        electron.add(eg);
        electron.position.set(r, 0, 0);
        tilt.add(electron);
        this.group.add(tilt);
        this.rings.push({ tilt, electron, r, speed: 0.4 + i * 0.18, angle: Math.random() * 6 });
      }

      // surrounding particles
      const N = IS_MOBILE() ? 420 : 900;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      const palette = [new THREE.Color(0x67e8f9), new THREE.Color(0x7aa2ff), new THREE.Color(0xc084fc), new THREE.Color(0x5eead4)];
      for (let i = 0; i < N; i++) {
        const rr = 3.4 + Math.pow(Math.random(), 0.7) * 9;
        const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
        const sp = Math.sqrt(1 - u * u);
        pos[i * 3] = rr * sp * Math.cos(ph);
        pos[i * 3 + 1] = rr * u;
        pos[i * 3 + 2] = rr * sp * Math.sin(ph);
        const c2 = palette[i % palette.length];
        col[i * 3] = c2.r; col[i * 3 + 1] = c2.g; col[i * 3 + 2] = c2.b;
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
      this.stars = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.group.add(this.stars);

      this.clock = new THREE.Clock();
      this.layout();
      this.animate = this.animate.bind(this);
      this.raf = requestAnimationFrame(this.animate);
      this.onResize = () => this.resize();
      window.addEventListener("resize", this.onResize, { passive: true });
      this.visible = true;
      if ("IntersectionObserver" in window) {
        this.obs = new IntersectionObserver((entries) => { this.visible = entries[0].isIntersecting; }, { threshold: 0.02 });
        this.obs.observe(this.canvas.parentElement || this.canvas);
      }
    }
    layout() {
      const mobile = IS_MOBILE();
      this.group.position.set(mobile ? 1.2 : 3.6, mobile ? 1.0 : 0.1, 0);
      this.group.scale.setScalar(mobile ? 0.72 : 1.02);
      this.group.rotation.z = -0.15;
    }
    resize() {
      const el = this.canvas.parentElement || this.canvas;
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
      this.layout();
    }
    animate() {
      this.raf = requestAnimationFrame(this.animate);
      if (!this.visible || document.hidden) return;
      const dt = Math.min(0.05, this.clock.getDelta());
      if (!REDUCED) {
        this.group.rotation.y += dt * 0.12;
        this.group.rotation.x = Math.sin(this.clock.elapsedTime * 0.18) * 0.08;
        this.rings.forEach((r) => {
          r.angle += r.speed * dt;
          r.electron.position.set(Math.cos(r.angle) * r.r, Math.sin(r.angle) * r.r, 0);
        });
        this.stars.rotation.y -= dt * 0.012;
      }
      this.renderer.render(this.scene, this.camera);
    }
    dispose() {
      cancelAnimationFrame(this.raf);
      window.removeEventListener("resize", this.onResize);
      this.obs?.disconnect();
      this.renderer.dispose();
    }
  }

  GLOBAL.Atom3D = {
    AtomViewer,
    HeroScene,
    parseSubshells,
    orbitalName,
    makeGlowTexture,
    REDUCED
  };
})();

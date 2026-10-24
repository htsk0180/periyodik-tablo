/* =========================================================================
   LAB 118 — runtime, part 6
   Three.js laboratory scene, instrument effects, public API and boot.
   ========================================================================= */

  const FOCUS = {
    bench: { pos: [0, 4.4, 9.6], target: [0, 1.0, 0.5] },
    flame: { pos: [2.6, 3.6, 7.4], target: [2.4, 1.15, 0.2] },
    reaction: { pos: [1.8, 3.7, 7.6], target: [1.3, 0.9, 1.2] },
    thermal: { pos: [-1.8, 3.6, 7.5], target: [-1.3, 0.9, 1.2] }
  };

  function initScene() {
    if (state.scene) return state.scene;
    const canvas = $id("lab-canvas");
    if (!canvas || !window.THREE) { showSceneFallback(); return null; }
    try {
      const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x04070f);
      scene.fog = new THREE.FogExp2(0x04070f, 0.045);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
      camera.position.set(0, 4.4, 9.6);

      const controls = new THREE.OrbitControls(camera, canvas);
      controls.target.set(0, 1.0, 0.5);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.minDistance = 5.4;
      controls.maxDistance = 14;
      controls.minPolarAngle = 0.32;
      controls.maxPolarAngle = 1.43;
      controls.autoRotate = false;

      const clock = new THREE.Clock();
      const s = {
        renderer: renderer, scene: scene, camera: camera, controls: controls, clock: clock,
        running: false, raf: 0, time: 0, mode: "idle", progress: 0, sampleHidden: false,
        focus: { active: false, t: 0, pos: new THREE.Vector3(), target: new THREE.Vector3() },
        flameBase: 0, bubbles: [], dust: null, labelTexture: null, balanceTexture: null
      };

      scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x04070d, 0.58));
      const key = new THREE.DirectionalLight(0xc7ecff, 1.05);
      key.position.set(4.5, 8, 5.5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -7; key.shadow.camera.right = 7;
      key.shadow.camera.top = 6; key.shadow.camera.bottom = -4;
      key.shadow.bias = -0.0005;
      scene.add(key);
      const warm = new THREE.PointLight(0xffd2a1, 0.55, 14, 2);
      warm.position.set(-4.5, 4.4, 2.4);
      scene.add(warm);
      const rim = new THREE.PointLight(0x22d3ee, 0.7, 12, 2);
      rim.position.set(5.2, 2.6, -1.8);
      scene.add(rim);
      const spot = new THREE.SpotLight(0xbfefff, 0.9, 12, 0.42, 0.55, 1.4);
      spot.position.set(0, 6.5, 4.5);
      spot.target.position.set(0, 0.4, 0.4);
      scene.add(spot); scene.add(spot.target);

      const floorMat = new THREE.MeshStandardMaterial({ color: 0x050a12, roughness: 0.92, metalness: 0.25 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.25;
      floor.receiveShadow = true;
      scene.add(floor);
      const grid = new THREE.GridHelper(30, 30, 0x123047, 0x0a1826);
      grid.position.y = -2.24;
      grid.material.transparent = true;
      grid.material.opacity = 0.38;
      scene.add(grid);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0x07101d, roughness: 0.88, metalness: 0.2 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 0.35), wallMat);
      wall.position.set(0, 1.8, -5.1);
      wall.receiveShadow = true;
      scene.add(wall);
      const wallTrim = new THREE.Mesh(new THREE.BoxGeometry(22, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x16425a }));
      wallTrim.position.set(0, -2.05, -4.9);
      scene.add(wallTrim);

      const benchMat = new THREE.MeshStandardMaterial({ color: 0x0a1424, roughness: 0.48, metalness: 0.55 });
      const bench = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.36, 4.8), benchMat);
      bench.position.set(0, 0, 0.45);
      bench.receiveShadow = true;
      bench.castShadow = true;
      scene.add(bench);
      const benchEdge = new THREE.Mesh(new THREE.BoxGeometry(10.85, 0.035, 4.85), new THREE.MeshBasicMaterial({ color: 0x1d607a }));
      benchEdge.position.set(0, 0.2, 0.45);
      scene.add(benchEdge);
      const benchFront = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.9, 0.25), new THREE.MeshStandardMaterial({ color: 0x060d18, roughness: 0.6, metalness: 0.45 }));
      benchFront.position.set(0, -0.5, 2.75);
      scene.add(benchFront);

      buildShelves(scene);
      buildWallSign(scene);
      buildSample(scene, s);
      buildBalance(scene, s);
      buildBurner(scene, s);
      buildBeaker(scene, s);
      buildThermalStage(scene, s);
      buildDust(scene, s);

      controls.addEventListener("start", () => { s.focus.active = false; });
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        showSceneFallback();
      });
      canvas.addEventListener("webglcontextrestored", () => {
        hideSceneFallback();
        sceneResize();
        if (state.entered) sceneResume();
      });

      state.scene = s;
      hideSceneFallback();
      sceneSetSample(currentElement(), isBlind());
      sceneFocus(state.station, true);
      sceneResize();
      if (state.entered) sceneResume();
      return s;
    } catch (error) {
      showSceneFallback();
      return null;
    }
  }

  function buildShelves(scene) {
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x0b1727, roughness: 0.6, metalness: 0.4 });
    [2.35, 3.35].forEach((y, row) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.08, 0.55), shelfMat);
      shelf.position.set(0, y, -4.72);
      scene.add(shelf);
      for (let i = 0; i < 9; i += 1) {
        const color = [0x67e8f9, 0xa78bfa, 0xfbbf24, 0x34d399, 0xfb7185][(i + row) % 5];
        const vial = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.38, 12),
          new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, roughness: 0.35 })
        );
        vial.position.set(-3.6 + i * 0.9, y + 0.23, -4.7);
        scene.add(vial);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x1f3448, metalness: 0.8, roughness: 0.3 }));
        cap.position.set(vial.position.x, y + 0.45, -4.7);
        scene.add(cap);
      }
    });
    const glow = new THREE.PointLight(0x2dd4bf, 0.35, 6, 2);
    glow.position.set(0, 3.2, -3.6);
    scene.add(glow);
  }

  function buildWallSign(scene) {
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(4,10,20,0.86)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(103,232,249,0.45)";
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = "#67e8f9";
      ctx.font = "700 62px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("LAB 118", w / 2, 78);
      ctx.fillStyle = "#6b8aa8";
      ctx.font = "18px ui-monospace, Menlo, monospace";
      ctx.fillText("ANALYTICAL CHEMISTRY · 118", w / 2, 108);
    }, 512, 128);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
    sign.position.set(0, 3.42, -4.88);
    scene.add(sign);
  }

  function buildSample(scene, s) {
    const group = new THREE.Group();
    group.position.set(0, 0.2, 0.95);
    const glass = new THREE.MeshPhongMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.16, shininess: 90, side: THREE.DoubleSide, depthWrite: false });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 28, 1, true), glass);
    body.position.y = 0.5;
    group.add(body);
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.035, 28), new THREE.MeshStandardMaterial({ color: 0x102235, metalness: 0.7, roughness: 0.3 }));
    bottom.position.y = 0.02;
    group.add(bottom);
    const liquidMat = new THREE.MeshStandardMaterial({ color: 0xff7a59, emissive: 0xff7a59, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.1 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.52, 24), liquidMat);
    liquid.position.y = 0.3;
    group.add(liquid);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x1c3045, metalness: 0.85, roughness: 0.28 }));
    cap.position.y = 1.04;
    group.add(cap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.008, 8, 64), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.6 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.55;
    group.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.006, 8, 64), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.35 }));
    ring2.rotation.x = Math.PI / 2.4;
    ring2.position.y = 0.55;
    group.add(ring2);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xff7a59, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(1.8, 1.8, 1);
    glow.position.y = 0.5;
    group.add(glow);
    scene.add(group);
    s.sample = group; s.sampleLiquid = liquid; s.sampleRing = ring; s.sampleRing2 = ring2; s.sampleGlow = glow;
    s.sampleBaseY = group.position.y;
    s.labelSprite = makeTextSprite("Na", "#67e8f9", "Z=11");
    s.labelSprite.position.set(0, 1.72, 0.95);
    scene.add(s.labelSprite);
  }

  function buildBalance(scene, s) {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x122033, metalness: 0.7, roughness: 0.35 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.22, 0.95), baseMat);
    base.position.set(-2.7, 0.11, 0.55);
    base.castShadow = true;
    scene.add(base);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.035, 32), new THREE.MeshStandardMaterial({ color: 0x8fb3c9, metalness: 0.9, roughness: 0.2 }));
    pan.position.set(-2.7, 0.3, 0.55);
    scene.add(pan);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12), baseMat);
    post.position.set(-2.7, 0.2, 0.55);
    scene.add(post);
    s.balanceTexture = makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = "#041019"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#16425a"; ctx.lineWidth = 3; ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = "#67e8f9"; ctx.font = "700 30px ui-monospace, Menlo, monospace"; ctx.textAlign = "right";
      ctx.fillText("0.000 g", w - 14, 42);
      ctx.fillStyle = "#5f7895"; ctx.font = "12px ui-monospace, Menlo, monospace"; ctx.textAlign = "left";
      ctx.fillText("BALANCE · 0.001 g", 12, 60);
    }, 256, 72);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), new THREE.MeshBasicMaterial({ map: s.balanceTexture, transparent: true }));
    display.position.set(-2.7, 0.16, 1.035);
    scene.add(display);
    s.balanceDisplay = display;
  }

  function buildBurner(scene, s) {
    const metal = new THREE.MeshStandardMaterial({ color: 0x223448, metalness: 0.85, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.2, 24), metal);
    base.position.set(2.5, 0.1, 0.25);
    scene.add(base);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 16), metal);
    tube.position.set(2.5, 0.7, 0.25);
    scene.add(tube);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x3b5a70, metalness: 0.8, roughness: 0.3 }));
    collar.position.set(2.5, 1.14, 0.25);
    scene.add(collar);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.23, 1.0, 18, 1, true), flameMat);
    flame.position.set(2.5, 1.72, 0.25);
    flame.visible = false;
    scene.add(flame);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x93e7ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.55, 14, 1, true), innerMat);
    inner.position.set(2.5, 1.52, 0.25);
    inner.visible = false;
    scene.add(inner);
    const light = new THREE.PointLight(0xffa94d, 0, 5, 2);
    light.position.set(2.5, 1.65, 0.25);
    scene.add(light);
    s.flame = flame; s.flameInner = inner; s.flameLight = light; s.flameBase = 0;
  }

  function buildBeaker(scene, s) {
    const group = new THREE.Group();
    group.position.set(1.35, 0.2, 1.55);
    const glass = new THREE.MeshPhongMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.18, shininess: 90, side: THREE.DoubleSide, depthWrite: false });
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 28, 1, true), glass);
    beaker.position.y = 0.48;
    group.add(beaker);
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 28), glass);
    bottom.position.y = 0.01;
    group.add(bottom);
    const liquidMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x0f766e, emissiveIntensity: 0.4, transparent: true, opacity: 0.7, roughness: 0.25 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.42, 24), liquidMat);
    liquid.position.y = 0.24;
    group.add(liquid);
    const stirrer = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }));
    stirrer.position.set(0.12, 0.35, 0);
    group.add(stirrer);
    const bubbles = new THREE.Group();
    for (let i = 0; i < 14; i += 1) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.018 + Math.random() * 0.022, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xbdf7ff, transparent: true, opacity: 0.55 })
      );
      bubble.position.set((Math.random() - 0.5) * 0.45, 0.08 + Math.random() * 0.42, (Math.random() - 0.5) * 0.45);
      bubble.userData.speed = 0.18 + Math.random() * 0.35;
      bubbles.add(bubble);
    }
    bubbles.visible = false;
    group.add(bubbles);
    scene.add(group);
    s.beaker = group; s.beakerLiquid = liquid; s.bubblesGroup = bubbles;
    s.bubbles = bubbles.children.slice();
  }

  function buildThermalStage(scene, s) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.24, 0.95), new THREE.MeshStandardMaterial({ color: 0x111e2e, metalness: 0.65, roughness: 0.4 }));
    body.position.set(-1.35, 0.12, 1.55);
    scene.add(body);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x31465f, emissive: 0x0b2a3a, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.3 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.045, 0.7), plateMat);
    plate.position.set(-1.35, 0.27, 1.55);
    scene.add(plate);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(-1.35, 0.3, 1.55);
    scene.add(glow);
    const light = new THREE.PointLight(0x67e8f9, 0, 4, 2);
    light.position.set(-1.35, 0.55, 1.55);
    scene.add(light);
    s.stagePlate = plate; s.stageGlow = glow; s.stageLight = light;
  }

  function buildDust(scene, s) {
    const count = 110;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 6 - 1.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9 - 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.018, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    s.dust = points;
  }

  function makeGlowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.18, "rgba(255,255,255,0.6)");
    g.addColorStop(0.5, "rgba(120,220,255,0.18)");
    g.addColorStop(1, "rgba(80,160,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeCanvasTexture(draw, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function makeTextSprite(symbol, color, subtext) {
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(4,10,20,0.72)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundRect(ctx, 6, 6, w - 12, h - 12, 16);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "700 58px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(symbol, w / 2, 70);
      ctx.fillStyle = "#7f9ab5";
      ctx.font = "15px ui-monospace, Menlo, monospace";
      ctx.fillText(subtext || "", w / 2, 100);
    }, 256, 128);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.set(1.25, 0.62, 1);
    return sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function updateLabel(symbol, color, subtext) {
    const s = state.scene;
    if (!s || !s.labelSprite) return;
    const old = s.labelSprite.material.map;
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(4,10,20,0.74)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundRect(ctx, 6, 6, w - 12, h - 12, 16);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "700 58px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(symbol, w / 2, 70);
      ctx.fillStyle = "#7f9ab5";
      ctx.font = "15px ui-monospace, Menlo, monospace";
      ctx.fillText(subtext || "", w / 2, 100);
    }, 256, 128);
    s.labelSprite.material.map = texture;
    s.labelSprite.material.needsUpdate = true;
    if (old) old.dispose();
  }

  function sceneSetSample(el, hidden) {
    const s = state.scene;
    if (!s || !el) return;
    const color = hidden ? 0xfbbf24 : hexToInt(CAT_COLORS[el.category] || CAT_COLORS.unknown);
    s.sampleHidden = !!hidden;
    if (s.sampleLiquid) {
      s.sampleLiquid.material.color.setHex(color);
      s.sampleLiquid.material.emissive.setHex(color);
      s.sampleLiquid.material.emissiveIntensity = hidden ? 0.7 : 0.55;
      s.sampleLiquid.scale.y = el.phase === "gas" ? 0.15 : el.phase === "liquid" ? 0.65 : 1;
    }
    if (s.sampleGlow) s.sampleGlow.material.color.setHex(color);
    updateLabel(hidden ? "?" : el.symbol, hidden ? "#fbbf24" : (CAT_COLORS[el.category] || "#67e8f9"), hidden ? "A-01 · MASKED" : "Z=" + el.z + " · " + (el.phase || ""));
  }

  function hexToInt(hex) { return parseInt(String(hex).replace("#", ""), 16) || 0x67e8f9; }

  function sceneSetMode(mode) {
    const s = state.scene;
    if (!s) return;
    s.mode = mode;
    if (s.flame) s.flame.visible = mode === "flame";
    if (s.flameInner) s.flameInner.visible = mode === "flame";
    if (s.flameLight) s.flameLight.intensity = mode === "flame" ? 0.9 : 0;
    if (s.bubblesGroup) s.bubblesGroup.visible = mode === "reaction";
    if (s.stageGlow) s.stageGlow.material.opacity = mode === "thermal" ? 0.5 : 0;
    if (s.stageLight) s.stageLight.intensity = mode === "thermal" ? 0.8 : 0;
  }

  function sceneSetProgress(p) {
    const s = state.scene;
    if (!s) return;
    s.progress = p;
    if (s.sampleRing) s.sampleRing.material.opacity = 0.35 + p * 0.5;
    if (s.sampleRing2) s.sampleRing2.material.opacity = 0.2 + p * 0.4;
  }

  function sceneFocus(station, immediate) {
    const s = state.scene;
    if (!s) return;
    const focus = FOCUS[station] || FOCUS.bench;
    const pos = new THREE.Vector3(focus.pos[0], focus.pos[1], focus.pos[2]);
    const target = new THREE.Vector3(focus.target[0], focus.target[1], focus.target[2]);
    s.focus.pos.copy(pos);
    s.focus.target.copy(target);
    s.focus.t = 0;
    if (immediate) {
      s.camera.position.copy(pos);
      s.controls.target.copy(target);
      s.controls.update();
      s.focus.active = false;
    } else {
      s.focus.active = true;
    }
  }

  function sceneEffect(protocol, result, el) {
    const s = state.scene;
    if (!s) return;
    sceneSetMode(protocol === "flame" ? "flame" : protocol === "reaction" ? "reaction" : protocol === "thermal" ? "thermal" : "idle");
    if (protocol === "density") {
      const value = (result.measurements || []).find((m) => m.label && (m.label.indexOf("Yoğunluk") >= 0 || m.label.indexOf("Density") >= 0));
      updateBalance(value ? value.value : "—");
      if (s.sampleGlow) s.sampleGlow.material.opacity = 0.85;
    } else if (protocol === "inspect") {
      if (s.sampleRing) s.sampleRing.material.opacity = 0.9;
    } else if (protocol === "flame") {
      const color = hexToInt(result.spectrum ? result.spectrum.color : "#ffb347");
      if (s.flame) s.flame.material.color.setHex(color);
      if (s.flameLight) { s.flameLight.color.setHex(color); s.flameLight.intensity = 1.6; }
      if (s.flameInner) s.flameInner.material.color.setHex(0xdffbff);
    } else if (protocol === "reaction") {
      const reaction = result.reaction || {};
      const color = hexToInt(reaction.color || "#2dd4bf");
      if (s.beakerLiquid) { s.beakerLiquid.material.color.setHex(color); s.beakerLiquid.material.emissive.setHex(color); }
      if (s.bubblesGroup) s.bubblesGroup.visible = (reaction.phenomena || []).some((p) => p !== "none");
      if (s.flame && (reaction.phenomena || []).includes("flame")) {
        s.flame.visible = true; s.flame.material.color.setHex(color);
        if (s.flameLight) { s.flameLight.color.setHex(color); s.flameLight.intensity = 1.4; }
      }
    } else if (protocol === "thermal") {
      const temp = result.thermal ? result.thermal.temp : 25;
      const hot = clamp((temp + 200) / 1400, 0, 1);
      const color = hot > 0.55 ? 0xff7a59 : hot > 0.25 ? 0xfbbf24 : 0x67e8f9;
      if (s.stageGlow) { s.stageGlow.material.color.setHex(color); s.stageGlow.material.opacity = 0.35 + hot * 0.55; }
      if (s.stageLight) { s.stageLight.color.setHex(color); s.stageLight.intensity = 0.4 + hot * 1.4; }
      if (s.stagePlate) { s.stagePlate.material.emissive.setHex(color); s.stagePlate.material.emissiveIntensity = 0.2 + hot; }
    }
    if (s.sampleGlow) {
      setTimeout(() => { if (state.scene) state.scene.sampleGlow.material.opacity = 0.5; }, 900);
    }
  }

  function updateBalance(text) {
    const s = state.scene;
    if (!s || !s.balanceDisplay) return;
    const old = s.balanceDisplay.material.map;
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = "#041019"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#16425a"; ctx.lineWidth = 3; ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = "#67e8f9"; ctx.font = "700 26px ui-monospace, Menlo, monospace"; ctx.textAlign = "right";
      ctx.fillText(String(text).slice(0, 18), w - 14, 42);
      ctx.fillStyle = "#5f7895"; ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.textAlign = "left";
      ctx.fillText("BALANCE · 0.001 g", 12, 60);
    }, 256, 72);
    s.balanceDisplay.material.map = texture;
    s.balanceDisplay.material.needsUpdate = true;
    if (old) old.dispose();
  }

  function updateScene(s, dt) {
    s.time += dt;
    s.controls.update();
    if (s.focus.active) {
      s.focus.t += dt;
      const k = 1 - Math.exp(-dt * 4.8);
      s.camera.position.lerp(s.focus.pos, k);
      s.controls.target.lerp(s.focus.target, k);
      if (s.focus.t > 1.5) s.focus.active = false;
    }
    if (s.sample) s.sample.position.y = s.sampleBaseY + Math.sin(s.time * 1.3) * 0.018;
    if (s.sampleRing) s.sampleRing.rotation.z += dt * 0.35;
    if (s.sampleRing2) s.sampleRing2.rotation.z -= dt * 0.22;
    if (s.sampleGlow) s.sampleGlow.material.opacity = 0.38 + Math.sin(s.time * 2.1) * 0.12;
    if (s.flame && s.flame.visible) {
      const flicker = 0.86 + Math.sin(s.time * 19) * 0.07 + Math.sin(s.time * 7.3) * 0.05;
      s.flame.scale.set(1, flicker, 1);
      s.flame.rotation.y += dt * 0.8;
      if (s.flameInner) s.flameInner.scale.set(1, 0.9 + Math.sin(s.time * 23) * 0.08, 1);
      if (s.flameLight) s.flameLight.intensity = (s.mode === "flame" ? 1.2 : 0.6) * flicker;
    }
    if (s.bubblesGroup && s.bubblesGroup.visible) {
      s.bubbles.forEach((bubble) => {
        bubble.position.y += dt * bubble.userData.speed;
        if (bubble.position.y > 0.52) bubble.position.y = 0.08;
      });
    }
    if (s.stageGlow && s.stageGlow.material.opacity > 0) {
      s.stageGlow.material.opacity = clamp(s.stageGlow.material.opacity + Math.sin(s.time * 3.2) * 0.02, 0.2, 0.9);
    }
    if (s.dust) {
      s.dust.rotation.y += dt * 0.012;
      s.dust.position.y = Math.sin(s.time * 0.3) * 0.05;
    }
  }

  function animateScene() {
    const s = state.scene;
    if (!s || !s.running) return;
    s.raf = requestAnimationFrame(animateScene);
    const dt = Math.min(s.clock.getDelta(), 0.05);
    updateScene(s, dt);
    try {
      s.renderer.render(s.scene, s.camera);
    } catch (error) {
      showSceneFallback();
      scenePause();
    }
  }

  function sceneResume() {
    const s = state.scene;
    if (!s) return;
    if (s.running) return;
    s.running = true;
    s.clock.getDelta();
    animateScene();
  }

  function scenePause() {
    const s = state.scene;
    if (!s) return;
    s.running = false;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = 0;
  }

  function sceneResize() {
    const s = state.scene;
    if (!s) return;
    const canvas = $id("lab-canvas");
    if (!canvas) return;
    const shell = $id("lab-shell");
    let w = canvas.clientWidth || (shell ? shell.clientWidth : 0);
    let h = canvas.clientHeight || (shell ? shell.clientHeight : 0);
    if (!w || !h) return;
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    s.renderer.setSize(w, h, false);
    s.camera.aspect = w / h;
    s.camera.updateProjectionMatrix();
  }

  function showSceneFallback() {
    const fallback = $id("lab-fallback");
    if (fallback) fallback.classList.remove("hidden");
    const canvas = $id("lab-canvas");
    if (canvas) canvas.style.opacity = "0.25";
    if (state.scene) scenePause();
  }

  function hideSceneFallback() {
    const fallback = $id("lab-fallback");
    if (fallback) fallback.classList.add("hidden");
    const canvas = $id("lab-canvas");
    if (canvas) canvas.style.opacity = "1";
  }

  window.Lab118 = {
    enter: function () { ensureInit(); enter(); },
    leave: function () { leave(); },
    setLang: function (lang) { ensureInit(); setLang(lang); },
    sendElement: function (z) { ensureInit(); sendElement(z); },
    openMission: function () { ensureInit(); openMission(); },
    getState: function () { return { z: state.z, protocol: state.protocol, missionActive: state.missionActive, missionSolved: state.missionSolved, records: state.notebook.length }; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

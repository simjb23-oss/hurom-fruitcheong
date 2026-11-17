import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// 휴롬 과일청 메이커(가칭) · 구조 3D v1 첫판 (2026-11-17, 두팔 msg_936ec2ba·msg_4b56059b 지시 · 준보 「무조건 이뻐야 한다」)
//   유리 통(약 2L, 바닥 가운데 유리 돌기=핀) + 핀에 끼운 Ø6.5cm 날개 젓개(여러 극 희토류 자석 봉입) + 컵 가운데 Ø7cm 유리 창 아래 구동 자석 원판(간격 4mm) + 통 바깥(알루미늄 컵 둘레) 펠티어 + 뚜껑 한 방향 밸브. 받침은 낮고 얇게, 유리 통이 주인공. 받침 빛이 통을 아래서 비춤.
//   시안 3개: A 항아리형 유리 + 흰 무광 받침 · B 원통 유리 + 연회색 세라믹 받침 · C 넓적한 낮은 유리 + 베이지 받침. 나무 안: 뚜껑 손잡이·받침 윗테.
//   치수는 모두 가정(단위 10cm): A 받침 Ø20 × 6cm · 통 Ø16(배) × 16cm · 뚜껑 1.2cm.
//   쿼리: ?p=0~1 진행도 · ?v=a|b|c 시안 · ?c=yuja|maesil|omija|strawberry 청 색 · ?wood 나무 안 · ?night 저녁 장면 고정 · ?day 낮 고정 · ?ang=<도> · ?cy= · ?noairg ?noadapter ?nofruit
const sec = document.getElementById('structure');
const canvas = document.getElementById('xv-canvas');
const labelLayer = document.getElementById('xv-labels');
const stepEls = [...document.querySelectorAll('.xv-step')];
const Q = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const hemi = new THREE.HemisphereLight(0xffffff, 0xe6ddcf, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfffaf2, 1.5); sun.position.set(-2, 9, 5); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.55); fill.position.set(6, 2, 3); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 1.0); rim.position.set(1, 4, -7); scene.add(rim);
const glow = new THREE.PointLight(0xf29a2e, 2, 1.9, 2); scene.add(glow);          // 받침 빛 — 통을 아래서 비춤
const glowUp = new THREE.PointLight(0xf29a2e, 0.6, 3, 2); scene.add(glowUp);    // 통 속 은은한 빛(저녁)
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

/* ---------- 글자·나무결 텍스처 ---------- */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const logoTex = canvasTex(512, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = '#8b8e93'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 70px "Segoe UI", Helvetica, Arial, sans-serif'; g.fillText('Hurom', w / 2, h / 2 + 2);
});
const woodTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#c99a66'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(120,70,30,${0.08 + Math.random() * 0.12})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 8 * Math.sin(i), w * 0.6, y - 8 * Math.cos(i), w, y + 4); g.stroke(); }
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;

/* ---------- 재질 ---------- */
const M = {
  body: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f1, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4, transparent: true, opacity: 1 }),
  lid: new THREE.MeshPhysicalMaterial({ color: 0xf6f6f3, roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.4, transparent: true, opacity: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xeef4f6, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3, depthWrite: false, side: THREE.DoubleSide }),
  syrup: new THREE.MeshPhysicalMaterial({ color: 0xf29a2e, roughness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: 0xf29a2e, emissiveIntensity: 0.03, transparent: true, opacity: 0.82 }),
  fruit: new THREE.MeshStandardMaterial({ color: 0xd8831f, roughness: 0.7 }),
  silicone: new THREE.MeshPhysicalMaterial({ color: 0xf1f1ee, roughness: 0.55, transparent: true, opacity: 0.95, clearcoat: 0.1 }),
  valve: new THREE.MeshStandardMaterial({ color: 0x8e8f92, roughness: 0.6 }),
  logo: new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, depthWrite: false }),
  wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xc3c7cb, metalness: 0.65, roughness: 0.45, transparent: true, opacity: 1 }),
  ledRing: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf29a2e, emissiveIntensity: 1.2, transparent: true, opacity: 0.95 }),
  strip: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf29a2e, emissiveIntensity: 1.4 }),
  peltier: new THREE.MeshStandardMaterial({ color: 0xf3f3ef, roughness: 0.6 }),
  heatsink: new THREE.MeshStandardMaterial({ color: 0xb9bdc2, metalness: 0.8, roughness: 0.4 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.6 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.7 }),
  chip: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.5 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.75, roughness: 0.35 }),
  wireB: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 }),
  vent: new THREE.MeshStandardMaterial({ color: 0x55575c, roughness: 0.7 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.9 }),
  magnet: new THREE.MeshStandardMaterial({ color: 0x4a4f58, metalness: 0.6, roughness: 0.4 }),
  magnetS: new THREE.MeshStandardMaterial({ color: 0x9a3a3a, metalness: 0.55, roughness: 0.45 }),
  pp: new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.5 }),
  siliconeT: new THREE.MeshPhysicalMaterial({ color: 0xf6f6f2, roughness: 0.55, transparent: true, opacity: 0.38, depthWrite: false }),
  air: new THREE.MeshBasicMaterial({ color: 0xf0a050, transparent: true, opacity: 0 }),
  counter: new THREE.MeshStandardMaterial({ color: 0x2b251e, roughness: 0.55, metalness: 0.05, transparent: true, opacity: 0 }),
};

/* ---------- 시안 · 청 색 ---------- */
const VARIANTS = {
  a: { name: 'A 항아리형 · 흰 무광 받침', baseR: 0.95, baseH: 0.5, square: false, baseColor: 0xf4f4f1, baseRough: 0.45, baseClear: 0.3, jar: 'onggi', jarH: 1.6, mouthR: 0.58, cupR: 0.66 },
  b: { name: 'B 원통 · 연회색 세라믹 받침', baseR: 0.85, baseH: 0.5, square: true, baseColor: 0xc6c3bc, baseRough: 0.95, baseClear: 0.0, jar: 'cyl', jarH: 1.6, mouthR: 0.7, cupR: 0.74 },
  c: { name: 'C 넓적한 낮은 통 · 베이지 받침', baseR: 1.05, baseH: 0.42, square: false, baseColor: 0xd3c0a3, baseRough: 0.6, baseClear: 0.15, jar: 'wide', jarH: 1.1, mouthR: 0.86, cupR: 0.92 },
};
const COLORS = {
  yuja: { name: '유자', syrup: 0xe8841a, fruit: 0xf7b84a, light: 0xffa13a },
  maesil: { name: '매실', syrup: 0x86b332, fruit: 0xb9d85a, light: 0xb8e04a },
  omija: { name: '오미자', syrup: 0xb3122f, fruit: 0xe24a66, light: 0xff3b5c },
  strawberry: { name: '딸기', syrup: 0xe85a80, fruit: 0xff9ab6, light: 0xff7aa0 },
};
let variantKey = (Q.get('v') || 'a').toLowerCase(); if (!VARIANTS[variantKey]) variantKey = 'a';
let colorKey = Q.get('c') || 'yuja'; if (!COLORS[colorKey]) colorKey = 'yuja';
let wood = Q.has('wood');

/* ---------- 도우미 ---------- */
const product = new THREE.Group(); scene.add(product);
let parts = [];
let spinners = [];
function part(name, obj, offset, labelAnchor = new THREE.Vector3(), inner = false) {
  obj.userData.home = obj.position.clone();
  obj.userData.off = new THREE.Vector3(...offset);
  obj.userData.inner = inner;
  product.add(obj);
  const el = document.createElement('div'); el.className = 'xv-label'; el.textContent = name; labelLayer.appendChild(el);
  parts.push({ obj, el, anchor: labelAnchor });
  return obj;
}
function lathe(profile, mat, seg = 72) { return new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); }
function tube(points, r, mat, seg = 40) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg, r, 10, false), mat); }
// 통 바깥 옆모습(r, y) — y 는 통 바닥 기준 0~jarH
function jarProfile(kind, H) {
  if (kind === 'onggi') return [[0, 0], [0.5, 0], [0.56, 0.02], [0.63, 0.12], [0.74, 0.32], [0.8, 0.55], [0.8, 0.78], [0.76, 1.0], [0.68, 1.2], [0.6, 1.36], [0.58, 1.46], [0.62, 1.52], [0.62, H]];
  if (kind === 'cyl') return [[0, 0], [0.64, 0], [0.7, 0.06], [0.7, H - 0.02], [0.7, H]];
  return [[0, 0], [0.74, 0], [0.86, 0.1], [0.9, 0.3], [0.9, H - 0.02], [0.9, H]];   // wide 넓적
}
function inset(profile, d) { return profile.map(([r, y], i) => [Math.max(0, r - (i === 0 ? 0 : d)), y]); }
function syrupProfile(profile, fillY) {   // 안쪽 모양을 fillY 높이까지 잘라 윗면을 닫음
  const inner = inset(profile, 0.045);
  const out = [];
  for (let i = 0; i < inner.length; i++) {
    const [r, y] = inner[i];
    if (y <= fillY) out.push([r, y + 0.03]);
    else { const [r0, y0] = inner[i - 1]; const t = (fillY - y0) / (y - y0); out.push([r0 + (r - r0) * t, fillY + 0.03]); break; }
  }
  out.push([0, fillY + 0.03]);
  return out;
}

/* ---------- 만들기 (시안별로 다시 만듦) ---------- */
let airG = null, V = VARIANTS.a, jarGroup = null, fruitG = null, woodMeshes = [];
function build(vk) {
  V = VARIANTS[vk]; variantKey = vk;
  while (product.children.length) product.remove(product.children[0]);
  parts.forEach(p => p.el.remove()); parts = []; spinners = []; woodMeshes = [];
  const BH = V.baseH, CUP_D = 0.26, CUP_Y = BH - CUP_D;    // 컵 바닥 높이
  const JH = V.jarH, JY = CUP_Y + 0.02;                     // 통 바닥 높이
  const HR = 0.35, GT = 0.03, GAP = 0.01;                     // 컵 가운데 구멍 반지름(Ø7cm) · 유리 바닥 3mm · 틈 1mm → 자석 간격 4mm
  const VR = 0.325, PINR = 0.045, PINH = 0.12;                // 날개 Ø6.5cm · 유리 돌기(핀)
  M.body.color.set(V.baseColor); M.body.roughness = V.baseRough; M.body.clearcoat = V.baseClear;

  /* 1. 받침 몸통 — 낮고 얇게. 앞에는 버튼 1 + 빛 1줄만. 팬 구멍은 바닥·뒤 */
  {
    const g = new THREE.Group();
    let body;
    if (V.square) { body = new THREE.Mesh(new RoundedBoxGeometry(V.baseR * 2, BH, V.baseR * 2, 4, 0.12), M.body); body.position.y = BH / 2; }
    else body = lathe([[0, 0], [V.baseR - 0.04, 0], [V.baseR, 0.04], [V.baseR, BH - 0.05], [V.baseR - 0.05, BH], [V.cupR + 0.02, BH], [V.cupR + 0.02, CUP_Y], [0, CUP_Y]], M.body, 96);
    g.add(body);
    // 뒷면 배기 슬롯(뒤에서만 보임)
    for (let i = -2; i <= 2; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.03), M.vent); s.position.set(i * 0.17, BH * 0.45, -(V.square ? V.baseR : V.baseR - 0.01)); g.add(s); }
    const halo = new THREE.Mesh(new THREE.RingGeometry(V.cupR + 0.02, V.cupR + 0.07, 96), M.ledRing); halo.rotation.x = -Math.PI / 2; halo.position.y = BH + 0.002; g.add(halo);
    // 로고 — 앞 아래
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.09), M.logo); lg.position.set(0, BH * 0.3, V.baseR + 0.004); g.add(lg);
    if (wood && !V.square) { const ring = lathe([[V.cupR + 0.02, BH - 0.001], [V.baseR - 0.05, BH - 0.001], [V.baseR - 0.05, BH + 0.03], [V.cupR + 0.02, BH + 0.03]], M.wood, 96); g.add(ring); woodMeshes.push(ring); }
    if (wood && V.square) { const band = new THREE.Mesh(new RoundedBoxGeometry(V.baseR * 2 + 0.002, 0.04, V.baseR * 2 + 0.002, 2, 0.1), M.wood); band.position.y = BH + 0.02; g.add(band); woodMeshes.push(band); }
    part('받침 · 낮고 얇게 · 팬 구멍은 바닥·뒤', g, [0, 0, 0], new THREE.Vector3(-V.baseR * 0.8, BH * 0.5, V.baseR * 0.5));
  }
  /* 2. 알루미늄 컵 — 통 바닥·아래 옆면에 닿아 펠티어 열을 전함 */
  {
    const g = new THREE.Group();
    const cup = lathe([[HR, CUP_Y - 0.02], [V.cupR, CUP_Y - 0.02], [V.cupR, BH + 0.005], [V.cupR - 0.02, BH + 0.005], [V.cupR - 0.02, CUP_Y], [HR, CUP_Y]], M.alu, 72); g.add(cup);
    part('알루미늄 컵 · 가운데 Ø7cm 뚫림(유리 창) · 둘레로 열 전달', g, [0, 0.85, 0], new THREE.Vector3(V.cupR, BH, 0), true);
  }
  /* 3. 빛 링 — 컵 바닥의 RGB LED 링. 품목 색으로 통을 아래서 비추고, 숨쉬기·고정·깜빡임으로 단계를 알림 */
  {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(HR + 0.03, V.cupR - 0.06, 64), M.ledRing); ring.rotation.x = -Math.PI / 2; ring.position.y = CUP_Y + 0.006; g.add(ring);
    part('빛 링 · RGB LED · 통을 아래서 비춤 · 단계 표시', g, [0, 0.5, 0], new THREE.Vector3(-0.4, CUP_Y, 0.2), true);
  }
  /* 4. 유리 통 + 청 + 과일 */
  {
    const g = new THREE.Group(); jarGroup = g;
    const prof = jarProfile(V.jar, JH);
    const outer = lathe(prof, M.glass, 96);
    const innerP = inset(prof, 0.035); innerP[0] = [0, 0.035];
    const innerM = lathe(innerP, M.glass, 96); innerM.material = M.glass;
    g.add(outer, innerM);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(PINR, PINR + 0.015, PINH, 24), M.glass); pin.position.y = GT + PINH / 2; g.add(pin);   // 유리 성형 돌기 — 젓개를 끼우는 핀
    // 눈금 2줄(과일 · 설탕) — 가는 띠
    const fillY = JH * (V.jar === 'wide' ? 0.66 : 0.7);
    const syrup = lathe(syrupProfile(prof, fillY), M.syrup, 96); g.add(syrup);
    fruitG = new THREE.Group(); fruitG.name = 'fruit'; g.add(fruitG);
    const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    for (let i = 0; i < 16; i++) {
      const top = i < 9;
      const y = top ? fillY - 0.02 - rnd() * 0.1 : 0.08 + rnd() * (fillY - 0.3);
      const rAt = prof.reduce((acc, [r, py], k) => (k > 0 && prof[k - 1][1] <= y && py >= y) ? r : acc, 0.5) - 0.12;
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * Math.max(0.1, rAt - 0.05);
      const f = new THREE.Mesh(new RoundedBoxGeometry(0.1 + rnd() * 0.08, 0.05 + rnd() * 0.04, 0.1 + rnd() * 0.08, 2, 0.02), M.fruit);
      f.position.set(Math.cos(a) * rr, y + 0.03, Math.sin(a) * rr); f.rotation.set(rnd(), rnd() * 3, rnd()); fruitG.add(f);
    }
    g.position.y = JY;
    part(`유리 통 · 약 2L · ${V.jar === 'onggi' ? '항아리형(배 Ø16 · 입 Ø12)' : V.jar === 'cyl' ? '원통 Ø14' : '넓적 Ø18'} × ${Math.round(JH * 10)}cm · 구멍 없음 · 바닥 가운데 유리 돌기(핀)`, g, [0, 1.9, 0], new THREE.Vector3(V.mouthR + 0.1, JH * 0.75, 0));
  }
  /* 5. 젓개 — Ø6.5cm 날개 3 · 통 바닥 유리 돌기(핀)에 끼워 제자리에서만 돎 · 바닥 쪽에 여러 극 희토류 자석 원판을 PP로 막고 실리콘으로 덮음 */
  {
    const g = new THREE.Group();
    const body = lathe([[PINR + 0.012, 0], [VR, 0], [VR, 0.06], [VR - 0.03, 0.08], [PINR + 0.07, 0.08], [PINR + 0.05, 0.15], [PINR + 0.012, 0.15]], M.siliconeT, 64); g.add(body);   // 실리콘 겉몸(반투명으로 그림) + 핀 구멍
    for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(VR - 0.045, VR - 0.045, 0.028, 48, 1, false, i * Math.PI / 3, Math.PI / 3), i % 2 ? M.magnetS : M.magnet); seg.position.y = 0.026; g.add(seg); }   // 6극 자석 원판(N·S 번갈아) — 유리 바닥에 가장 가깝게
    const ppCap = new THREE.Mesh(new THREE.CylinderGeometry(VR - 0.04, VR - 0.04, 0.012, 48), M.pp); ppCap.position.y = 0.047; g.add(ppCap);   // PP 봉입 덮개
    const ppIn = new THREE.Mesh(new THREE.CylinderGeometry(PINR + 0.06, PINR + 0.06, 0.03, 32), M.pp); ppIn.position.y = 0.026; g.add(ppIn);
    for (let i = 0; i < 3; i++) { const h = new THREE.Group(); h.rotation.y = i * Math.PI * 2 / 3; const b = new THREE.Mesh(new RoundedBoxGeometry(VR - PINR - 0.06, 0.09, 0.06, 2, 0.02), M.silicone); b.position.set((VR + PINR) / 2 + 0.01, 0.12, 0); b.rotation.x = 0.4; h.add(b); g.add(h); }   // 날개 3 · 끝 둥글게
    g.position.y = JY + GT; g.userData.slow = true; spinners.push(g);
    part('젓개 · Ø6.5cm 날개 3 · 핀에 끼움(떠다니지 않음) · 바닥 쪽 여러 극 자석 봉입 · 뽑아서 씻음', g, [0, 1.35, 0], new THREE.Vector3(VR, 0.08, 0));
  }
  /* 6. 뚜껑 — 얹어 누르는 식 · 가운데 한 방향 밸브 · 손잡이(나무 안) */
  {
    const g = new THREE.Group();
    const r = V.mouthR + 0.07;
    const lid = lathe([[0, 0], [r, 0], [r, 0.06], [r - 0.03, 0.1], [0.16, 0.13], [0, 0.13]], M.lid, 72); g.add(lid);
    const skirt = lathe([[V.mouthR - 0.02, -0.08], [V.mouthR - 0.0, -0.08], [V.mouthR, 0], [V.mouthR - 0.02, 0]], M.silicone, 72); g.add(skirt);   // 실리콘 패킹
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.07, 32), wood ? M.wood : M.lid); knob.position.y = 0.165; g.add(knob); if (wood) woodMeshes.push(knob);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), M.valve); valve.position.y = 0.21; g.add(valve);
    g.position.y = JY + JH;
    part(`뚜껑 · 얹는 식 · 패킹 · 한 방향 밸브(김 빠짐)${wood ? ' · 나무 손잡이' : ''}`, g, [0, 2.9, 0], new THREE.Vector3(r, 0.08, 0));
  }
  /* 7. 구동 자석 원판 + 납작 모터 — 컵 가운데 유리 창 아래 · 유리 3mm + 틈 1mm = 자석 간격 4mm · 아주 느림 · 걸리면 역회전 */
  {
    const g = new THREE.Group();
    const DT = 0.03, dy = JY - GAP - DT / 2;
    const disc = new THREE.Group(); disc.position.y = dy;
    for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(VR - 0.05, VR - 0.05, DT, 48, 1, false, i * Math.PI / 3, Math.PI / 3), i % 2 ? M.magnet : M.magnetS); disc.add(seg); }
    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(VR - 0.04, VR - 0.04, 0.012, 48), M.heatsink); yoke.position.y = -DT / 2 - 0.006; disc.add(yoke);   // 철 백요크
    disc.userData.slow = true; spinners.push(disc); g.add(disc);
    const mh = Math.max(0.08, dy - DT / 2 - 0.012 - 0.1);
    const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, mh, 28), M.dark); mot.position.y = dy - DT / 2 - 0.012 - mh / 2; g.add(mot);   // 납작 기어드 모터(또는 코일판)
    part('구동 자석 원판 · 여러 극 · 유리 3mm + 틈 1mm = 간격 4mm · 납작 모터', g, [0, 0.3, 0], new THREE.Vector3(VR - 0.05, dy, 0), true);
  }
  /* 8. 펠티어 — 컵 바닥 뒤쪽에 1장 · 극 전환으로 데우기/식히기 (서늘고·해동기 공용) */
  const PZ = -(V.cupR * 0.72);   // 컵 가운데 Ø7cm는 뚫려 있어 펠티어는 둘레(뒤쪽)에
  {
    const g = new THREE.Group();
    const tec = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), M.peltier); tec.position.set(0, CUP_Y - 0.045, PZ); g.add(tec);
    [[-0.17], [0.17]].forEach(([x]) => { const w = tube([new THREE.Vector3(x, CUP_Y - 0.045, PZ - 0.2), new THREE.Vector3(x, CUP_Y - 0.06, PZ - 0.35), new THREE.Vector3(x * 0.5, 0.1, 0.5)], 0.004, M.wireB, 20); g.add(w); });
    part('펠티어 1장 · 극 바꿔 데우기·식히기 · 서늘고 공용', g, [0, -0.35, -0.9], new THREE.Vector3(0.2, CUP_Y - 0.045, PZ), true);
  }
  /* 9. 방열판 */
  {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), M.heatsink); base.position.set(0, CUP_Y - 0.075, PZ); g.add(base);
    for (let i = -5; i <= 5; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.5), M.heatsink); f.position.set(i * 0.045, CUP_Y - 0.125, PZ); g.add(f); }
    part('방열판', g, [0, -0.75, -1.3], new THREE.Vector3(0.25, CUP_Y - 0.125, PZ), true);
  }
  /* 10. 팬 — 방열판 아래, 바닥 슬롯에서 들이쉬어 뒤로 내보냄 */
  {
    const g = new THREE.Group();
    const fr = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.06, 0.42, 2, 0.02), M.dark); fr.position.set(0, 0.045, PZ); g.add(fr);
    const bl = new THREE.Group(); bl.position.set(0, 0.045, PZ);
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.05), M.vent); b.position.set(0.1, 0, 0); const h = new THREE.Group(); h.rotation.y = i / 7 * Math.PI * 2; b.rotation.x = 0.6; h.add(b); bl.add(h); }
    bl.userData.spin = true; spinners.push(bl); g.add(bl);
    part('팬 40mm · 바닥 흡기 → 뒤 배기', g, [0, -1.15, -1.7], new THREE.Vector3(0.21, 0.045, PZ), true);
  }
  /* 11. 제어 보드 — 앞 아래 · 펠티어 극 전환(H브리지) · 품목 일정표 · 젓개 걸림 감지 */
  {
    const g = new THREE.Group();
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.22), M.pcb); pcb.position.set(0, 0.1, V.cupR * 0.78); g.add(pcb);
    [[-0.12, 0.08], [0.1, 0.06], [0.18, 0.04]].forEach(([x, s]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(s, 0.02, s), M.chip); c.position.set(x, 0.118, V.cupR * 0.78); g.add(c); });
    part('제어 보드 · 극 전환 · 품목 일정표 · NTC', g, [-0.5, -0.5, 1.2], new THREE.Vector3(0.25, 0.1, V.cupR * 0.78), true);
  }
  /* 12. 버튼 1 + 빛 1줄 — 앞 윗면 */
  {
    const g = new THREE.Group();
    const bz = V.square ? V.baseR - 0.2 : V.baseR - 0.17;
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 32), M.lid); btn.position.set(0, BH + 0.008, bz); g.add(btn);
    const strip = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.012, 0.03, 1, 0.005), M.strip); strip.position.set(0, BH + 0.004, bz - 0.12); g.add(strip);
    part('버튼 1 + 빛 1줄 · 앞에서 보이는 전부', g, [0.9, 0.3, 0.5], new THREE.Vector3(0.1, BH, bz));
  }
  /* 13. 바닥판 — 흡기 슬롯 + 고무발 4 (앞에서 안 보임) */
  {
    const g = new THREE.Group();
    const r = V.square ? V.baseR - 0.1 : V.baseR - 0.08;
    const pl = V.square ? new THREE.Mesh(new RoundedBoxGeometry(r * 2, 0.02, r * 2, 2, 0.06), M.body) : new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 72), M.body); pl.position.y = 0.01; g.add(pl);
    for (let i = -3; i <= 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.3), M.vent); s.position.set(i * 0.08, -0.002, PZ); g.add(s); }
    [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([x, z]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 20), M.rubber); f.position.set(x * r, -0.012, z * r); g.add(f); });
    part('바닥판 · 흡기 슬롯 · 고무발 4', g, [0, -1.5, 0], new THREE.Vector3(-r * 0.7, 0, r * 0.7), true);
  }
  /* 14. 어댑터 — 12V 외장(서늘고·해동기 공용 후보 · W 추정 예정) · 선은 뒤 아래로 */
  {
    const g = new THREE.Group();
    const brick = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.24, 0.36, 2, 0.04), M.dark); brick.position.set(1.9, 0.12, -1.5); g.add(brick);
    g.add(tube([new THREE.Vector3(1.55, 0.12, -1.5), new THREE.Vector3(0.9, 0.08, -1.3), new THREE.Vector3(0.25, 0.1, -V.baseR - 0.01)], 0.006, M.wireB, 30));
    g.name = 'adapter';
    part('12V 어댑터 · 서늘고·해동기 공용 후보', g, [1.6, -1.0, -0.3], new THREE.Vector3(1.9, 0.26, -1.5));
  }
  /* 열 흐름(설명용) — 바닥 슬롯 → 팬 → 방열판 → 뒷면 슬롯 */
  airG = new THREE.Group(); airG.name = 'airg'; product.add(airG);
  [[-0.12], [0.12]].forEach(([sx]) => {
    const pts = [new THREE.Vector3(sx, -0.06, PZ), new THREE.Vector3(sx, 0.08, PZ), new THREE.Vector3(sx, CUP_Y - 0.12, PZ - 0.1), new THREE.Vector3(sx, BH * 0.45, -(V.baseR - 0.2)), new THREE.Vector3(sx * 1.5, BH * 0.5, -(V.baseR + 0.35))];
    const c = new THREE.CatmullRomCurve3(pts, false);
    airG.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.008, 6, false), M.air));
    for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), M.air); d.userData.t = i / 6; d.userData.c = c; airG.add(d); }
  });
  product.traverse(o => { if (o.name && Q.has('no' + o.name)) o.visible = false; });
  product.traverse(o => { if (o.isMesh && !NOSHADOW.has(o.material)) o.castShadow = true; else if (o.isMesh) o.castShadow = false; });
  glow.position.set(0, CUP_Y + 0.12, 0); glowUp.position.set(0, JY + JH * 0.5, 0);
  document.querySelectorAll('[data-xv-variant]').forEach(b => b.classList.toggle('on', b.dataset.xvVariant === vk));
  document.querySelectorAll('[data-xv-wood]').forEach(b => b.classList.toggle('on', wood));
}
const NOSHADOW = new Set([M.glass, M.syrup, M.air, M.logo, M.ledRing, M.strip]);

function setColor(k) {
  const c = COLORS[k] || COLORS.yuja; colorKey = k;
  M.syrup.color.set(c.syrup); M.syrup.emissive.set(c.syrup).multiplyScalar(0.85); M.fruit.color.set(c.fruit);
  M.ledRing.emissive.set(c.light); M.strip.emissive.set(c.light); glow.color.set(c.light); glowUp.color.set(c.light);
  document.querySelectorAll('[data-xv-color]').forEach(b => b.classList.toggle('on', b.dataset.xvColor === k));
}
window.xvSetColor = setColor;
window.xvSetVariant = k => build(k);
window.xvSetWood = w => { wood = w === undefined ? !wood : !!w; build(variantKey); };

/* 바닥 — 낮에는 그림자만, 저녁에는 어두운 조리대 */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({ opacity: 0.1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; scene.add(ground);
const counter = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), M.counter); counter.rotation.x = -Math.PI / 2; counter.position.y = -0.003; counter.receiveShadow = true; scene.add(counter);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 8;
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 6, bottom: -5, near: 1, far: 24 });
ground.receiveShadow = true;
build(variantKey); setColor(colorKey);
product.position.y = -0.9; ground.position.y = -0.9 - 0.001; counter.position.y = -0.9 - 0.003;

/* ---------- 스크롤 ---------- */
const CY = +(Q.get('cy') || 0);
const ZM = +(Q.get('z') || 1);            // 카메라 거리 배율(확대 캡처용)
const LY = +(Q.get('ly') || 0);           // 바라보는 점 높이 보정
const ANG = Q.has('ang') ? +Q.get('ang') * Math.PI / 180 : null;
const NIGHT = Q.has('night') ? 1 : Q.has('day') ? 0 : null;
const forced = Q.get('p');
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function progress() {
  if (forced !== null) return +forced;
  const r = sec.getBoundingClientRect();
  return clamp(-r.top / (r.height - innerHeight));
}
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const tmp = new THREE.Vector3();
const NIGHT_BG = new THREE.Color(0x151210);
let t0 = performance.now();
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - t0) / 1000)); t0 = now;
  const p = progress();
  // 0~.08 저녁 앞모습 · .08~.2 날이 밝으며 돌아 뒷모습 · .2~.36 몸체 투명 + 열 흐름 · .4~.58 분해 · .58~.76 유지 · .76~.95 조립 · .95~ 저녁으로
  const nt = NIGHT !== null ? NIGHT : p < 0.06 ? 1 : p < 0.2 ? 1 - ease((p - 0.06) / 0.14) : p < 0.95 ? 0 : ease((p - 0.95) / 0.05);
  const e = p < 0.4 ? 0 : p < 0.58 ? ease((p - 0.4) / 0.18) : p < 0.76 ? 1 : p < 0.95 ? 1 - ease((p - 0.76) / 0.19) : 0;
  parts.forEach(({ obj }) => obj.position.copy(obj.userData.home).addScaledVector(obj.userData.off, e));
  const ghost = p < 0.22 ? 0 : p < 0.32 ? (p - 0.22) / 0.1 : p < 0.82 ? 1 : p < 0.94 ? 1 - (p - 0.82) / 0.12 : 0;
  M.body.opacity = 1 - 0.86 * ghost; M.body.depthWrite = ghost < 0.01;
  M.logo.opacity = 1 - 0.7 * ghost;
  const jg = ghost * (1 - e);
  M.alu.opacity = 1 - 0.6 * jg; M.alu.depthWrite = jg < 0.01;
  parts.forEach(({ obj }) => { if (obj.userData.inner) obj.visible = ghost > 0.02; });

  // 저녁 ↔ 낮
  renderer.setClearColor(NIGHT_BG, nt); renderer.toneMappingExposure = 1.1 - 0.2 * nt;
  hemi.intensity = 1.0 * (1 - nt) + 0.1 * nt; sun.intensity = 1.5 * (1 - nt) + 0.05 * nt; fill.intensity = 0.55 * (1 - nt) + 0.08 * nt; rim.intensity = 1.0 * (1 - nt) + 0.5 * nt;
  scene.environmentIntensity = 1 - 0.8 * nt;
  const breath = 0.5 + 0.5 * Math.sin(now / 900);
  glow.intensity = (1.0 + 6.5 * nt) * (0.85 + 0.15 * breath) * (1 - e * 0.7);
  glowUp.intensity = (0.15 + 2.2 * nt) * (1 - e * 0.7);
  M.syrup.emissiveIntensity = 0.03 + 0.9 * nt;
  M.ledRing.emissiveIntensity = 0.9 + 3 * nt * (0.8 + 0.2 * breath);
  M.strip.emissiveIntensity = 1.4 + 1.5 * nt;
  M.counter.opacity = nt; ground.material.opacity = 0.1 * (1 - e) * (1 - nt);

  const FRONT = 0.5, BACK = Math.PI + 0.5, XA = 0.8, XB = 1.2;
  const ang = p < 0.08 ? FRONT
    : p < 0.22 ? FRONT + (BACK - FRONT) * ease((p - 0.08) / 0.14)
    : p < 0.4 ? BACK + (XA - BACK) * ease((p - 0.22) / 0.18)
    : p < 0.58 ? XA
    : p < 0.76 ? XA + (XB - XA) * ((p - 0.58) / 0.18)
    : p < 0.95 ? XB + (FRONT - XB) * ease((p - 0.76) / 0.19) : FRONT;
  const H = V.baseH + V.jarH + 0.2;
  const dist = (7.4 + H * 1.1 + e * 8.8) * ZM;
  const camY = (1.6 - 0.5 * nt) + (p < 0.22 ? 0 : p < 0.4 ? 1.8 * ease((p - 0.22) / 0.18) : 1.8);
  const angF = ANG === null ? ang : ANG;
  camera.position.set(Math.sin(angF) * dist, camY + CY + e * 1.4, Math.cos(angF) * dist);
  camera.lookAt(0, H * 0.42 - 0.9 + e * 0.5 + LY, 0);

  spinners.forEach(o => { if (o.userData.spin) o.rotation.y += dt * (2 + 10 * ghost) * (1 - e); if (o.userData.slow) o.rotation.y += dt * 0.5 * (1 - e); });
  const airOn = (p < 0.08 || p > 0.96) ? 0 : (ghost > 0.3 && e < 0.4) ? 0.85 * (1 - e / 0.4) : 0;
  M.air.opacity += (airOn - M.air.opacity) * 0.1;
  if (airG) airG.children.forEach(ch => { if (ch.userData.c) { ch.userData.t = (ch.userData.t + dt * 0.12) % 1; ch.position.copy(ch.userData.c.getPointAt(ch.userData.t)); } });

  renderer.render(scene, camera);

  // 이름표
  const w = canvas.clientWidth, h = canvas.clientHeight, lab = [];
  parts.forEach(({ obj, el, anchor }) => {
    tmp.copy(anchor); obj.localToWorld(tmp); tmp.project(camera);
    const sx = (tmp.x * 0.5 + 0.5) * w, sy = (-tmp.y * 0.5 + 0.5) * h;
    el.dataset.ax = sx.toFixed(1); el.dataset.ay = sy.toFixed(1); el.dataset.vis = obj.visible && tmp.z < 1 ? 1 : 0;   // 캡처용: 이름표 대신 번호를 찍을 원래 위치
    lab.push({ el, sx, sy, w: el.offsetWidth || 160, h: el.offsetHeight || 30 });
    el.style.opacity = clamp((e - 0.7) / 0.3) * (obj.visible ? 1 : 0);
  });
  lab.sort((a, b) => a.sy - b.sy);
  for (let i = 0; i < lab.length; i++) for (let j = 0; j < i; j++) {
    const a = lab[j], b = lab[i];
    if (Math.abs(a.sx - b.sx) < (a.w + b.w) / 2 + 6 && Math.abs(a.sy - b.sy) < (a.h + b.h) / 2 + 4) b.sy = a.sy + (a.h + b.h) / 2 + 4;
  }
  lab.forEach(({ el, sx, sy }) => { el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%)`; });

  const idx = p < 0.08 ? 0 : p < 0.22 ? 1 : p < 0.42 ? 2 : 3;
  stepEls.forEach((s, i) => s.classList.toggle('on', i === idx));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.querySelectorAll('[data-xv-color]').forEach(b => b.addEventListener('click', () => setColor(b.dataset.xvColor)));
document.querySelectorAll('[data-xv-variant]').forEach(b => b.addEventListener('click', () => build(b.dataset.xvVariant)));
document.querySelectorAll('[data-xv-wood]').forEach(b => b.addEventListener('click', () => window.xvSetWood()));
document.documentElement.classList.add('xv-ready');

// Perhitungan astronomi sederhana (akurasi kira-kira 1 menit busur untuk planet,
// beberapa menit busur untuk Bulan). Cukup untuk planetarium visual.
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const norm360 = (x) => ((x % 360) + 360) % 360;

const Astro = {
  julianDay(ms) { return ms / 86400000 + 2440587.5; },

  // Waktu bintang lokal (derajat).
  lst(jd, lonDeg) {
    const d = jd - 2451545.0;
    const T = d / 36525;
    return norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T + lonDeg);
  },

  obliquity(T) { return 23.439291 - 0.0130042 * T; },

  // RA/Dec (derajat) -> Alt/Az (derajat, azimut dari utara ke timur).
  toHorizontal(ra, dec, lst, lat) {
    const H = (lst - ra) * RAD, d = dec * RAD, p = lat * RAD;
    const sinAlt = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const az = Math.atan2(-Math.cos(d) * Math.sin(H),
      Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.sin(p) * Math.cos(H));
    return { alt: alt * DEG, az: norm360(az * DEG) };
  },

  // Koreksi refraksi atmosfer (derajat) untuk ketinggian semu.
  refraction(alt) {
    if (alt < -2) return 0;
    return 1.02 / Math.tan((alt + 10.3 / (alt + 5.11)) * RAD) / 60;
  },

  // Presesi sederhana dari J2000 ke tahun berjalan.
  precess(ra, dec, years) {
    const a = ra * RAD, d = dec * RAD;
    const dRa = (3.075 + 1.336 * Math.sin(a) * Math.tan(d)) * years * 15 / 3600;
    const dDec = 20.04 * Math.cos(a) * years / 3600;
    return [norm360(ra + dRa), dec + dDec];
  },

  eclipticToEquatorial(x, y, z, eps) {
    const e = eps * RAD;
    const xe = x, ye = y * Math.cos(e) - z * Math.sin(e), ze = y * Math.sin(e) + z * Math.cos(e);
    const ra = norm360(Math.atan2(ye, xe) * DEG);
    const dec = Math.atan2(ze, Math.hypot(xe, ye)) * DEG;
    return { ra, dec, dist: Math.hypot(xe, ye, ze) };
  },

  // Elemen orbit perkiraan JPL (berlaku 1800-2050): a, e, I, L, perihelion, node, lalu laju per abad.
  ELEMEN: {
    Merkurius: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593,
      0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081, -0.6],
    Venus: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255,
      0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418, -4.4],
    Bumi: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0,
      0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0, 0],
    Mars: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891,
      0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343, -1.5],
    Yupiter: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909,
      -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106, -9.4],
    Saturnus: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448,
      -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794, -8.9],
    Uranus: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503,
      -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589, -7.2],
    Neptunus: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574,
      0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664, -6.9],
  },

  heliocentric(el, T) {
    const a = el[0] + el[6] * T, e = el[1] + el[7] * T, I = (el[2] + el[8] * T) * RAD;
    const L = el[3] + el[9] * T, wbar = el[4] + el[10] * T, node = el[5] + el[11] * T;
    const w = (wbar - node) * RAD, O = node * RAD;
    const M = norm360(L - wbar) * RAD;
    let E = M + e * Math.sin(M);
    for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
    return [
      (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
      (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
      sw * sI * xp + cw * sI * yp,
    ];
  },

  // Matahari, Bulan, dan planet dalam RA/Dec.
  bodies(jd) {
    const T = (jd - 2451545.0) / 36525;
    const eps = this.obliquity(T);
    const earth = this.heliocentric(this.ELEMEN.Bumi, T);
    const out = [];
    const sun = this.eclipticToEquatorial(-earth[0], -earth[1], -earth[2], eps);
    out.push({ nama: 'Matahari', jenis: 'bintang', ra: sun.ra, dec: sun.dec, mag: -26.7, jarakAU: sun.dist, warna: '#fff4c2' });

    for (const [nama, el] of Object.entries(this.ELEMEN)) {
      if (nama === 'Bumi') continue;
      const h = this.heliocentric(el, T);
      const g = [h[0] - earth[0], h[1] - earth[1], h[2] - earth[2]];
      const eq = this.eclipticToEquatorial(g[0], g[1], g[2], eps);
      const r = Math.hypot(...h);
      const R = Math.hypot(...earth), D = eq.dist;
      const i = Math.acos(Math.max(-1, Math.min(1, (r * r + D * D - R * R) / (2 * r * D)))) * DEG;
      const mag = el[12] + 5 * Math.log10(r * D) + (KOEF_FASE[nama] || 0.005) * i;
      out.push({ nama, jenis: 'planet', ra: eq.ra, dec: eq.dec, mag, jarakAU: eq.dist, warna: WARNA_PLANET[nama] });
    }

    const moon = this.moon(T, eps);
    const elong = Math.acos(Math.sin(sun.dec * RAD) * Math.sin(moon.dec * RAD) +
      Math.cos(sun.dec * RAD) * Math.cos(moon.dec * RAD) * Math.cos((sun.ra - moon.ra) * RAD));
    const fase = (1 - Math.cos(elong)) / 2;
    out.push({ nama: 'Bulan', jenis: 'bulan', ra: moon.ra, dec: moon.dec, mag: -12.7 + 4 * (1 - fase),
      jarakKm: moon.km, paralaks: moon.parallax, fase, warna: '#e8e8e0' });
    return out;
  },

  // Bulan presisi rendah (Astronomical Almanac).
  moon(T, eps) {
    const s = (a, b) => Math.sin((a + b * T) * RAD), c = (a, b) => Math.cos((a + b * T) * RAD);
    const lam = 218.32 + 481267.881 * T + 6.29 * s(135.0, 477198.87) - 1.27 * s(259.3, -413335.36)
      + 0.66 * s(235.7, 890534.22) + 0.21 * s(269.9, 954397.74) - 0.19 * s(357.5, 35999.05) - 0.11 * s(186.5, 966404.03);
    const bet = 5.13 * s(93.3, 483202.02) + 0.28 * s(228.2, 960400.89) - 0.28 * s(318.3, 6003.15) - 0.17 * s(217.6, -407332.21);
    const par = 0.9508 + 0.0518 * c(135.0, 477198.87) + 0.0095 * c(259.3, -413335.36)
      + 0.0078 * c(235.7, 890534.22) + 0.0028 * c(269.9, 954397.74);
    const l = lam * RAD, b = bet * RAD;
    const eq = this.eclipticToEquatorial(Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b), eps);
    return { ra: eq.ra, dec: eq.dec, parallax: par, km: 6378.14 / Math.sin(par * RAD) };
  },

  // Warna kira-kira dari indeks B-V.
  warnaBintang(bv) {
    const t = [[-0.4, [155, 176, 255]], [0, [202, 215, 255]], [0.4, [248, 247, 255]],
      [0.8, [255, 244, 234]], [1.2, [255, 210, 161]], [1.6, [255, 190, 120]], [2.0, [255, 160, 90]]];
    if (bv <= t[0][0]) return t[0][1];
    for (let i = 1; i < t.length; i++) {
      if (bv <= t[i][0]) {
        const f = (bv - t[i - 1][0]) / (t[i][0] - t[i - 1][0]);
        return t[i][1].map((v, k) => Math.round(t[i - 1][1][k] + (v - t[i - 1][1][k]) * f));
      }
    }
    return t[t.length - 1][1];
  },
};

// Koreksi magnitudo per derajat sudut fase (perkiraan).
const KOEF_FASE = { Merkurius: 0.038, Venus: 0.013, Mars: 0.016 };

const WARNA_PLANET = {
  Merkurius: '#c9b8a6', Venus: '#fff6d8', Mars: '#ff8a5c', Yupiter: '#f3d9b1',
  Saturnus: '#ecd59a', Uranus: '#b5e6ee', Neptunus: '#8fb3ff',
};

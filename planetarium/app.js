// Langit Malam: planetarium sederhana berbasis canvas.
(() => {
  const canvas = document.getElementById('langit');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);

  // ---------- Status ----------
  const LAJU = [-604800, -86400, -3600, -300, -60, -10, 1, 10, 60, 300, 3600, 86400, 604800];
  const state = {
    view: { az: 180, alt: 28, fov: 100 },
    loc: { lat: -6.2, lon: 106.82, nama: 'Jakarta' },
    simMs: Date.now(),
    lajuIdx: LAJU.indexOf(1),
    jeda: false,
    opsi: { garisRasi: true, nama: true, messier: false, grid: false, atmosfer: true, tanah: true },
    pilih: null,
    anim: null,
  };

  function muat() {
    try {
      const s = JSON.parse(localStorage.getItem('langit-malam') || 'null');
      if (s && s.loc) state.loc = s.loc;
      if (s && s.opsi) Object.assign(state.opsi, s.opsi);
    } catch (e) { /* penyimpanan tidak tersedia */ }
  }
  function simpan() {
    try { localStorage.setItem('langit-malam', JSON.stringify({ loc: state.loc, opsi: state.opsi })); } catch (e) { /* abaikan */ }
  }

  // ---------- Data ----------
  const bintang = BINTANG.map(([ra, dec, mag, bv, nama, desig]) => {
    const c = Astro.warnaBintang(bv);
    return { ra0: ra, dec0: dec, ra, dec, mag, nama, desig, jenis: 'bintang', warna: `rgb(${c[0]},${c[1]},${c[2]})` };
  });
  const messier = MESSIER.map(([nama, alt, tipe, mag, ra, dec]) => ({ nama, alias: alt, tipe, mag, ra0: ra, dec0: dec, ra, dec, jenis: 'messier' }));
  const rasi = RASI.map(([id, nama, ra, dec]) => ({ id, nama, ra0: ra, dec0: dec, ra, dec, jenis: 'rasi' }));
  const garis = GARIS_RASI.map(([id, segs]) => segs.map((seg) => seg.map(([ra, dec]) => ({ ra0: ra, dec0: dec, ra, dec }))));
  let tahunPresesi = null;

  function terapkanPresesi(jd) {
    const th = (jd - 2451545.0) / 365.25;
    if (tahunPresesi !== null && Math.abs(th - tahunPresesi) < 0.25) return;
    tahunPresesi = th;
    const upd = (o) => { [o.ra, o.dec] = Astro.precess(o.ra0, o.dec0, th); };
    bintang.forEach(upd); messier.forEach(upd); rasi.forEach(upd);
    garis.forEach((segs) => segs.forEach((seg) => seg.forEach(upd)));
  }

  // ---------- Proyeksi stereografik ----------
  let W = 0, H = 0, dpr = 1, skala = 1, basis = null;

  function ukur() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function vektor(alt, az) {
    const a = alt * RAD, z = az * RAD;
    return [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)];
  }

  function siapkanKamera() {
    const { az, alt, fov } = state.view;
    const f = vektor(alt, az);
    const r = [Math.cos(az * RAD), -Math.sin(az * RAD), 0];
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    basis = { f, r, u };
    skala = (Math.max(W, H) / 2) / (2 * Math.tan((fov * RAD) / 4));
  }

  function proyeksi(alt, az) {
    const v = vektor(alt, az);
    const dz = v[0] * basis.f[0] + v[1] * basis.f[1] + v[2] * basis.f[2];
    if (dz < -0.6) return null;
    const dx = v[0] * basis.r[0] + v[1] * basis.r[1] + v[2] * basis.r[2];
    const dy = v[0] * basis.u[0] + v[1] * basis.u[1] + v[2] * basis.u[2];
    const k = 2 / (1 + dz);
    return { x: W / 2 + dx * k * skala, y: H / 2 - dy * k * skala, dz };
  }

  const diLayar = (p, m = 40) => p && p.x > -m && p.x < W + m && p.y > -m && p.y < H + m;

  // ---------- Bantuan tampilan ----------
  function horizontal(o, lst) {
    const h = Astro.toHorizontal(o.ra, o.dec, lst, state.loc.lat);
    if (o.paralaks) h.alt -= o.paralaks * Math.cos(h.alt * RAD);
    if (state.opsi.atmosfer) h.alt += Astro.refraction(h.alt);
    return h;
  }

  const campur = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function warnaLangit(sunAlt) {
    if (!state.opsi.atmosfer) return [5, 7, 15];
    const titik = [[-18, [5, 7, 15]], [-12, [10, 16, 38]], [-6, [28, 40, 80]], [0, [70, 100, 160]], [8, [90, 140, 210]], [90, [80, 140, 220]]];
    if (sunAlt <= titik[0][0]) return titik[0][1];
    for (let i = 1; i < titik.length; i++) {
      if (sunAlt <= titik[i][0]) return campur(titik[i - 1][1], titik[i][1], (sunAlt - titik[i - 1][0]) / (titik[i][0] - titik[i - 1][0]));
    }
    return titik[titik.length - 1][1];
  }

  function batasMagnitudo(sunAlt) {
    let lim = 6.2 + Math.log2(100 / state.view.fov) * 0.6;
    if (state.opsi.atmosfer && sunAlt > -18) lim -= Math.min(1, (sunAlt + 18) / 18) * 7.5;
    return lim;
  }

  // ---------- Gambar ----------
  let target = [];

  function gambar(jd) {
    terapkanPresesi(jd);
    siapkanKamera();
    const lst = Astro.lst(jd, state.loc.lon);
    const benda = Astro.bodies(jd);
    const matahari = benda.find((b) => b.nama === 'Matahari');
    const posMatahari = horizontal(matahari, lst);
    const sunAlt = posMatahari.alt;
    const lim = batasMagnitudo(sunAlt);
    const terang = state.opsi.atmosfer ? Math.max(0, Math.min(1, (sunAlt + 12) / 12)) : 0;
    target = [];

    const langit = warnaLangit(sunAlt);
    ctx.fillStyle = `rgb(${langit})`;
    ctx.fillRect(0, 0, W, H);

    if (state.opsi.grid) gambarGrid();
    if (state.opsi.garisRasi) gambarGarisRasi(lst, terang);
    if (state.opsi.messier) gambarMessier(lst, lim);
    gambarBintang(lst, lim);
    gambarBenda(benda, lst, lim, posMatahari);
    if (state.opsi.tanah) gambarTanah(sunAlt);
    gambarLabel(lst, lim, benda);
    gambarArah();
    gambarPilihan(lst);
  }

  function polyline(titik, warna, lebar) {
    ctx.strokeStyle = warna; ctx.lineWidth = lebar; ctx.beginPath();
    let turun = false;
    for (const [alt, az] of titik) {
      const p = proyeksi(alt, az);
      if (!p || p.dz < -0.3) { turun = false; continue; }
      if (turun) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
      turun = true;
    }
    ctx.stroke();
  }

  function gambarGrid() {
    for (let alt = -75; alt <= 75; alt += 15) {
      const t = []; for (let az = 0; az <= 360; az += 3) t.push([alt, az]);
      polyline(t, alt === 0 ? 'rgba(120,200,255,0.45)' : 'rgba(120,170,255,0.16)', 1);
    }
    for (let az = 0; az < 360; az += 30) {
      const t = []; for (let alt = -90; alt <= 90; alt += 3) t.push([alt, az]);
      polyline(t, 'rgba(120,170,255,0.16)', 1);
    }
  }

  function gambarGarisRasi(lst, terang) {
    ctx.strokeStyle = `rgba(110,150,230,${0.45 - terang * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const segs of garis) {
      for (const seg of segs) {
        let prev = null;
        for (const o of seg) {
          const h = horizontal(o, lst);
          const p = proyeksi(h.alt, h.az);
          if (p && p.dz > -0.3) {
            if (prev) { ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); }
            prev = p;
          } else prev = null;
        }
      }
    }
    ctx.stroke();
  }

  function gambarBintang(lst, lim) {
    for (const s of bintang) {
      if (s.mag > lim) break; // data sudah urut dari yang paling terang
      const h = horizontal(s, lst);
      const p = proyeksi(h.alt, h.az);
      if (!diLayar(p, 10)) continue;
      const b = lim - s.mag;
      const r = Math.min(6, 0.6 + b * 0.42);
      ctx.globalAlpha = Math.min(1, 0.3 + b * 0.25);
      if (s.mag < 1 && b > 3) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.5);
        g.addColorStop(0, s.warna); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = s.warna;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (h.alt > 0 || !state.opsi.tanah) target.push({ x: p.x, y: p.y, o: s });
    }
    ctx.globalAlpha = 1;
  }

  function gambarMessier(lst, lim) {
    ctx.strokeStyle = 'rgba(255,170,120,0.75)'; ctx.lineWidth = 1;
    for (const m of messier) {
      if (m.mag > lim + 3) continue;
      const h = horizontal(m, lst);
      const p = proyeksi(h.alt, h.az);
      if (!diLayar(p)) continue;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 3.5, 0.5, 0, Math.PI * 2); ctx.stroke();
      if (h.alt > 0 || !state.opsi.tanah) target.push({ x: p.x, y: p.y, o: m });
    }
  }

  function gambarBenda(benda, lst, lim, posMatahari) {
    const pxPerDeg = skala * RAD;
    for (const b of benda) {
      const h = horizontal(b, lst);
      b.h = h;
      const p = proyeksi(h.alt, h.az);
      if (!diLayar(p, 60)) continue;
      if (b.jenis === 'planet') {
        if (b.mag > lim + 1) continue;
        const r = Math.max(2, Math.min(7, 2 + (lim - b.mag) * 0.35));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        g.addColorStop(0, b.warna); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.warna; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      } else if (b.nama === 'Matahari') {
        const r = Math.max(8, 0.267 * pxPerDeg);
        const g = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r * 5);
        g.addColorStop(0, 'rgba(255,240,190,0.9)'); g.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.warna; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      } else if (b.jenis === 'bulan') {
        gambarBulan(b, p, Math.max(8, 0.259 * pxPerDeg), h, posMatahari);
      }
      if (h.alt > 0 || !state.opsi.tanah) target.push({ x: p.x, y: p.y, o: b });
    }
  }

  function gambarBulan(b, p, r, h, posMatahari) {
    // Arah sisi terang di layar: titik sedikit bergeser ke arah Matahari.
    const m = vektor(h.alt, h.az), s = vektor(posMatahari.alt, posMatahari.az);
    const d = m[0] * s[0] + m[1] * s[1] + m[2] * s[2];
    let t = [s[0] - m[0] * d, s[1] - m[1] * d, s[2] - m[2] * d];
    const n = Math.hypot(...t) || 1; t = t.map((v) => v / n);
    const q = [m[0] + t[0] * 0.01, m[1] + t[1] * 0.01, m[2] + t[2] * 0.01];
    const p2 = proyeksi(Math.asin(q[2] / Math.hypot(...q)) * DEG, Math.atan2(q[0], q[1]) * DEG);
    const sudut = p2 ? Math.atan2(p2.y - p.y, p2.x - p.x) : 0;

    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(sudut);
    ctx.fillStyle = 'rgba(40,42,50,0.9)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.warna; ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    for (let i = 0; i <= 32; i++) {
      const a = Math.PI / 2 - (Math.PI * i) / 32;
      ctx.lineTo(r * (1 - 2 * b.fase) * Math.cos(a), r * Math.sin(a));
    }
    ctx.fill();
    ctx.restore();
  }

  function gambarTanah(sunAlt) {
    const t = Math.max(0, Math.min(1, (sunAlt + 12) / 18));
    const warna = `rgb(${campur([8, 14, 10], [38, 58, 40], state.opsi.atmosfer ? t : 0)})`;
    ctx.fillStyle = warna; ctx.strokeStyle = warna; ctx.lineWidth = 1.5;
    const pita = [0, -8, -25, -50, -90];
    for (let az = 0; az < 360; az += 5) {
      for (let i = 0; i < pita.length - 1; i++) {
        const sudut = [[pita[i], az], [pita[i], az + 5], [pita[i + 1], az + 5], [pita[i + 1], az]];
        const ps = sudut.map(([a, z]) => proyeksi(a, z));
        if (ps.some((p) => !p)) continue;
        ctx.beginPath(); ctx.moveTo(ps[0].x, ps[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(ps[k].x, ps[k].y);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    const garisCakrawala = []; for (let az = 0; az <= 360; az += 2) garisCakrawala.push([0, az]);
    polyline(garisCakrawala, 'rgba(160,200,170,0.5)', 1.2);
  }

  function label(teks, x, y, warna, ukuran = 12, tebal = 400) {
    ctx.font = `${tebal} ${ukuran}px system-ui, sans-serif`;
    ctx.fillStyle = warna; ctx.fillText(teks, x, y);
  }

  function gambarLabel(lst, lim, benda) {
    if (!state.opsi.nama) return;
    ctx.textBaseline = 'middle';
    const tampil = (h) => h.alt > 0 || !state.opsi.tanah;
    const batasNama = Math.min(lim, 1.6 + Math.log2(100 / state.view.fov) * 1.2);

    if (state.opsi.garisRasi) {
      ctx.textAlign = 'center';
      for (const c of rasi) {
        const h = horizontal(c, lst);
        if (!tampil(h)) continue;
        const p = proyeksi(h.alt, h.az);
        if (diLayar(p, 0) && p.dz > 0) label(c.nama.toUpperCase(), p.x, p.y, 'rgba(140,170,235,0.55)', 11);
      }
    }
    ctx.textAlign = 'left';
    for (const s of bintang) {
      if (s.mag > batasNama) break;
      if (!s.nama) continue;
      const h = horizontal(s, lst);
      if (!tampil(h)) continue;
      const p = proyeksi(h.alt, h.az);
      if (diLayar(p, 0)) label(s.nama, p.x + 7, p.y, 'rgba(220,228,245,0.75)');
    }
    if (state.opsi.messier) {
      for (const m of messier) {
        if (m.mag > lim + 3) continue;
        const h = horizontal(m, lst);
        if (!tampil(h)) continue;
        const p = proyeksi(h.alt, h.az);
        if (diLayar(p, 0)) label(m.nama, p.x + 8, p.y, 'rgba(255,190,150,0.8)', 11);
      }
    }
    for (const b of benda) {
      if (!b.h || !tampil(b.h)) continue;
      if (b.jenis === 'planet' && b.mag > lim + 1) continue;
      const p = proyeksi(b.h.alt, b.h.az);
      if (diLayar(p, 0)) label(b.nama, p.x + 10, p.y - 10, '#ffe3a8', 13, 500);
    }
  }

  function gambarArah() {
    const arah = [['U', 0], ['TL', 45], ['T', 90], ['TG', 135], ['S', 180], ['BD', 225], ['B', 270], ['BL', 315]];
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [teks, az] of arah) {
      const p = proyeksi(0, az);
      if (!diLayar(p, 0) || p.dz < 0) continue;
      const utama = teks.length === 1;
      label(teks, p.x, p.y + 14, utama ? '#ff9b7a' : 'rgba(255,170,140,0.7)', utama ? 15 : 12, utama ? 600 : 400);
    }
  }

  function gambarPilihan(lst) {
    const o = state.pilih;
    if (!o) return;
    const h = o.h && (o.jenis === 'planet' || o.jenis === 'bulan' || o.nama === 'Matahari') ? o.h : horizontal(o, lst);
    const p = proyeksi(h.alt, h.az);
    if (diLayar(p, 0)) {
      ctx.strokeStyle = 'rgba(127,178,255,0.95)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.stroke();
    }
    isiInfo(o, h);
  }

  // ---------- Panel info ----------
  const jenisTeks = { bintang: 'Bintang', planet: 'Planet', bulan: 'Satelit alami Bumi', messier: 'Objek langit dalam', rasi: 'Rasi bintang' };
  const tipeMessier = { gg: 'Gugus bola', oc: 'Gugus terbuka', pn: 'Nebula planeter', en: 'Nebula emisi', rn: 'Nebula pantul', snr: 'Sisa supernova',
    sp: 'Galaksi spiral', el: 'Galaksi elips', ln: 'Galaksi lentikular', ir: 'Galaksi tak beraturan', s0: 'Galaksi lentikular', ds: 'Bintang ganda', as: 'Asterisma', bn: 'Nebula terang', sg: 'Galaksi spiral', ga: 'Galaksi' };

  function jamSudut(deg) {
    const t = ((deg / 15) % 24 + 24) % 24;
    const j = Math.floor(t), m = Math.floor((t - j) * 60), d = Math.round(((t - j) * 60 - m) * 60);
    return `${j}j ${m}m ${d}d`;
  }
  const sudut = (deg) => `${deg >= 0 ? '+' : '−'}${Math.abs(deg).toFixed(2)}°`;
  let infoTerakhir = '';

  function isiInfo(o, h) {
    let jenis = o.nama === 'Matahari' ? 'Bintang induk Tata Surya' : jenisTeks[o.jenis];
    if (o.jenis === 'messier') jenis = (tipeMessier[o.tipe] || jenis) + (o.alias ? ` · ${o.alias}` : '');
    if (o.jenis === 'bintang' && o.desig) jenis += ` · ${o.desig}`;
    const baris = [];
    if (o.mag !== undefined) baris.push(['Magnitudo', o.mag.toFixed(1)]);
    baris.push(['Asensio rekta', jamSudut(o.ra)], ['Deklinasi', sudut(o.dec)]);
    baris.push(['Ketinggian', sudut(h.alt) + (h.alt < 0 ? ' (di bawah cakrawala)' : '')], ['Azimut', `${h.az.toFixed(1)}°`]);
    if (o.jarakAU) {
      const jt = o.jarakAU * 149.6;
      baris.push(['Jarak', `${o.jarakAU.toFixed(3)} AU (${jt >= 1000 ? (jt / 1000).toFixed(2).replace('.', ',') + ' miliar' : Math.round(jt) + ' juta'} km)`]);
    }
    if (o.jarakKm) baris.push(['Jarak', `${Math.round(o.jarakKm).toLocaleString('id-ID')} km`]);
    if (o.fase !== undefined) baris.push(['Fase', `${Math.round(o.fase * 100)}% terang`]);
    const html = baris.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    const kunci = o.nama + jenis + html;
    if (kunci === infoTerakhir) return;
    infoTerakhir = kunci;
    $('infoNama').textContent = o.nama || o.desig || 'Bintang';
    $('infoJenis').textContent = jenis;
    $('infoData').innerHTML = html;
    $('info').style.display = 'block';
  }

  function tutupInfo() { state.pilih = null; infoTerakhir = ''; $('info').style.display = 'none'; }

  // ---------- Waktu ----------
  function teksLaju() {
    if (state.jeda) return 'dijeda';
    const v = LAJU[state.lajuIdx], a = Math.abs(v), arah = v < 0 ? 'mundur ' : '';
    if (v === 1) return 'waktu nyata';
    const nama = { 1: '1 detik', 10: '10 detik', 60: '1 menit', 300: '5 menit', 3600: '1 jam', 86400: '1 hari', 604800: '1 minggu' }[a];
    return `${arah}${nama}/detik`;
  }

  function perbaruiWaktu() {
    const d = new Date(state.simMs);
    $('jamTeks').textContent = d.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('lajuTeks').textContent = teksLaju();
    $('jeda').textContent = state.jeda ? '▶' : '⏸';
    $('jeda').setAttribute('aria-label', state.jeda ? 'Lanjut' : 'Jeda');
  }

  // ---------- Loop ----------
  let realTerakhir = performance.now();
  function frame(now) {
    const dt = now - realTerakhir; realTerakhir = now;
    if (!state.jeda) state.simMs += dt * LAJU[state.lajuIdx];
    if (state.anim) {
      const a = state.anim, t = Math.min(1, (now - a.t0) / 700), e = 1 - Math.pow(1 - t, 3);
      state.view.az = (a.az0 + a.dAz * e + 360) % 360;
      state.view.alt = a.alt0 + (a.alt1 - a.alt0) * e;
      if (t >= 1) state.anim = null;
    }
    gambar(Astro.julianDay(state.simMs));
    perbaruiWaktu();
    requestAnimationFrame(frame);
  }

  function arahkanKe(o) {
    const jd = Astro.julianDay(state.simMs);
    terapkanPresesi(jd);
    let h;
    if (o.jenis === 'planet' || o.jenis === 'bulan' || o.nama === 'Matahari') {
      const b = Astro.bodies(jd).find((x) => x.nama === o.nama);
      Object.assign(o, b);
      h = horizontal(o, Astro.lst(jd, state.loc.lon));
    } else h = horizontal(o, Astro.lst(jd, state.loc.lon));
    const dAz = ((h.az - state.view.az + 540) % 360) - 180;
    state.anim = { az0: state.view.az, dAz, alt0: state.view.alt, alt1: Math.max(-85, Math.min(85, h.alt)), t0: performance.now() };
    if (o.jenis !== 'rasi') state.pilih = o; else tutupInfo();
  }

  // ---------- Interaksi ----------
  const pointer = new Map();
  let gerak = 0, jarakAwal = 0, fovAwal = 0;

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointer.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gerak = 0; state.anim = null;
    if (pointer.size === 2) {
      const [a, b] = [...pointer.values()];
      jarakAwal = Math.hypot(a.x - b.x, a.y - b.y); fovAwal = state.view.fov;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointer.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    pointer.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gerak += Math.abs(dx) + Math.abs(dy);
    if (pointer.size === 1) {
      const k = state.view.fov / Math.max(W, H) * 1.1;
      state.view.az = (state.view.az - dx * k + 360) % 360;
      state.view.alt = Math.max(-89, Math.min(89, state.view.alt + dy * k));
    } else if (pointer.size === 2) {
      const [a, b] = [...pointer.values()];
      const j = Math.hypot(a.x - b.x, a.y - b.y);
      if (jarakAwal > 0) setFov(fovAwal * jarakAwal / j);
    }
  });
  const lepas = (e) => {
    if (pointer.size === 1 && gerak < 6) ketuk(e.clientX, e.clientY);
    pointer.delete(e.pointerId);
  };
  canvas.addEventListener('pointerup', lepas);
  canvas.addEventListener('pointercancel', (e) => pointer.delete(e.pointerId));
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); setFov(state.view.fov * Math.exp(e.deltaY * 0.0012)); }, { passive: false });

  function setFov(f) { state.view.fov = Math.max(3, Math.min(130, f)); }

  function ketuk(x, y) {
    let terbaik = null, jarak = 22;
    for (const t of target) {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < jarak) { jarak = d; terbaik = t.o; }
    }
    if (terbaik) { state.pilih = terbaik; infoTerakhir = ''; } else tutupInfo();
  }

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = state.view.fov / 20;
    if (e.key === 'ArrowLeft') state.view.az = (state.view.az - k + 360) % 360;
    else if (e.key === 'ArrowRight') state.view.az = (state.view.az + k) % 360;
    else if (e.key === 'ArrowUp') state.view.alt = Math.min(89, state.view.alt + k);
    else if (e.key === 'ArrowDown') state.view.alt = Math.max(-89, state.view.alt - k);
    else if (e.key === '+' || e.key === '=') setFov(state.view.fov / 1.2);
    else if (e.key === '-') setFov(state.view.fov * 1.2);
    else if (e.key === ' ') { state.jeda = !state.jeda; e.preventDefault(); }
    else if (e.key === 'Escape') tutupInfo();
  });

  $('jeda').onclick = () => { state.jeda = !state.jeda; };
  $('maju').onclick = () => { state.jeda = false; state.lajuIdx = Math.min(LAJU.length - 1, state.lajuIdx + 1); };
  $('mundur').onclick = () => { state.jeda = false; state.lajuIdx = Math.max(0, state.lajuIdx - 1); };
  $('sekarang').onclick = () => { state.simMs = Date.now(); state.lajuIdx = LAJU.indexOf(1); state.jeda = false; };
  $('tutupInfo').onclick = tutupInfo;

  document.querySelectorAll('[data-opsi]').forEach((btn) => {
    const k = btn.dataset.opsi;
    btn.setAttribute('aria-pressed', String(state.opsi[k]));
    btn.onclick = () => { state.opsi[k] = !state.opsi[k]; btn.setAttribute('aria-pressed', String(state.opsi[k])); simpan(); };
  });

  // Pengaturan lokasi dan waktu
  function pesanSingkat(t) { $('pesan').textContent = t; }
  function tampilLokasi() {
    const { lat, lon, nama } = state.loc;
    $('lokasiTeks').textContent = nama || `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'LU' : 'LS'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'BT' : 'BB'}`;
    $('lat').value = lat; $('lon').value = lon;
  }
  $('judul').onclick = () => {
    const buka = $('pengaturan').style.display !== 'block';
    $('pengaturan').style.display = buka ? 'block' : 'none';
    $('judul').setAttribute('aria-expanded', String(buka));
    if (buka) {
      const d = new Date(state.simMs - new Date(state.simMs).getTimezoneOffset() * 60000);
      $('tanggal').value = d.toISOString().slice(0, 16);
    }
  };
  $('simpanLokasi').onclick = () => {
    const lat = parseFloat($('lat').value), lon = parseFloat($('lon').value);
    if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) { pesanSingkat('Lintang harus -90..90 dan bujur -180..180.'); return; }
    state.loc = { lat, lon, nama: '' }; tampilLokasi(); simpan(); pesanSingkat('Lokasi disimpan.');
  };
  $('pakaiGps').onclick = () => {
    if (!navigator.geolocation) { pesanSingkat('Browser tidak mendukung lokasi.'); return; }
    pesanSingkat('Mencari lokasi…');
    navigator.geolocation.getCurrentPosition(
      (pos) => { state.loc = { lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4), nama: '' }; tampilLokasi(); simpan(); pesanSingkat('Lokasi diperbarui.'); },
      () => pesanSingkat('Lokasi tidak bisa diambil. Isi manual saja.'),
      { timeout: 10000 });
  };
  $('tanggal').onchange = () => {
    const t = new Date($('tanggal').value).getTime();
    if (!isNaN(t)) { state.simMs = t; pesanSingkat('Waktu diubah.'); }
  };

  // Pencarian
  const indeks = new Map();
  const tambah = (label, o) => { if (label && !indeks.has(label)) indeks.set(label, o); };
  ['Matahari', 'Bulan', ...Object.keys(Astro.ELEMEN).filter((n) => n !== 'Bumi')].forEach((n) =>
    tambah(n, { nama: n, jenis: n === 'Bulan' ? 'bulan' : n === 'Matahari' ? 'bintang' : 'planet' }));
  bintang.filter((s) => s.nama).forEach((s) => tambah(s.nama, s));
  rasi.forEach((c) => tambah(`${c.nama} (rasi)`, c));
  messier.forEach((m) => tambah(m.alias ? `${m.nama} – ${m.alias}` : m.nama, m));
  $('daftarObjek').innerHTML = [...indeks.keys()].map((k) => `<option value="${k.replace(/"/g, '&quot;')}">`).join('');
  $('cari').addEventListener('change', (e) => {
    const q = e.target.value.trim();
    if (!q) return;
    let o = indeks.get(q);
    if (!o) {
      const kecil = q.toLowerCase();
      const kunci = [...indeks.keys()].find((k) => k.toLowerCase().startsWith(kecil));
      o = kunci && indeks.get(kunci);
    }
    if (o) { arahkanKe(o); e.target.value = ''; e.target.blur(); }
  });

  // ---------- Mulai ----------
  muat();
  tampilLokasi();
  ukur();
  window.addEventListener('resize', ukur);
  requestAnimationFrame(frame);
})();

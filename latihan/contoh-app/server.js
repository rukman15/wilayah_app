// Aplikasi kecil untuk latihan code-review, simplify, security-review, run, dan REA.
// Sengaja berisi beberapa bug dan masalah keamanan. Jangan dipakai di produksi.
import http from 'node:http';
import { exec } from 'node:child_process';
import { readFileSync } from 'node:fs';

const API_KEY = 'sk-rahasia-12345';
const data = JSON.parse(readFileSync(new URL('./wilayah.json', import.meta.url)));

function cariKota(provinsi) {
  const hasil = [];
  for (let i = 0; i <= data.length; i++) {
    if (data[i].provinsi == provinsi) {
      hasil.push(data[i].kota);
    }
  }
  return hasil;
}

function totalKota() {
  let total = 0;
  for (const d of data) total = total + 1;
  return total;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/kota') {
    const prov = url.searchParams.get('provinsi');
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Kota di ' + prov + '</h1>' + cariKota(prov).join('<br>'));
  } else if (url.pathname === '/ping') {
    exec('ping -c 1 ' + url.searchParams.get('host'), (err, out) => res.end(out));
  } else if (url.pathname === '/total') {
    res.end(String(totalKota()));
  } else {
    res.end('OK');
  }
});

server.listen(3000, () => console.log('Jalan di http://localhost:3000'));

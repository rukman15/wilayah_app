"""Ubah data d3-celestial (BSD-3, (c) Olaf Frohn) menjadi planetarium/data.js.

Pakai: python3 buat_data.py <folder data d3-celestial> <file output data.js>
Data asal: npm pack d3-celestial@0.7.35, folder package/data.
"""
import json, sys, os

src, out = sys.argv[1], sys.argv[2]
load = lambda n: json.load(open(os.path.join(src, n), encoding='utf-8'))

names = load('starnames.json')
stars = []
for f in load('stars.6.json')['features']:
    ra, dec = f['geometry']['coordinates']
    p = f['properties']
    try:
        bv = round(float(p.get('bv') or 0.6), 2)
    except ValueError:
        bv = 0.6
    n = names.get(str(f['id']), {})
    label = n.get('name') or ''
    desig = (n.get('desig') or '') + (' ' + n['c'] if n.get('desig') and n.get('c') else '')
    stars.append([round(ra % 360, 3), round(dec, 3), p['mag'], bv, label, desig.strip()])
stars.sort(key=lambda s: s[2])

lines = []
for f in load('constellations.lines.json')['features']:
    lines.append([f['id'], [[[round(x % 360, 2), round(y, 2)] for x, y in seg]
                            for seg in f['geometry']['coordinates']]])

cons = [[f['id'], f['properties']['name'], round(f['geometry']['coordinates'][0] % 360, 2),
         round(f['geometry']['coordinates'][1], 2)] for f in load('constellations.json')['features']]

dso = []
for f in load('messier.json')['features']:
    p = f['properties']
    ra, dec = f['geometry']['coordinates']
    dso.append([p['name'], p.get('alt') or p.get('desig') or '', p['type'], p['mag'],
                round(ra % 360, 3), round(dec, 3)])

with open(out, 'w', encoding='utf-8') as o:
    o.write('// Dibuat oleh alat/buat_data.py dari d3-celestial (BSD-3-Clause, (c) 2015 Olaf Frohn).\n')
    for k, v in [('BINTANG', stars), ('GARIS_RASI', lines), ('RASI', cons), ('MESSIER', dso)]:
        o.write(f'const {k} = {json.dumps(v, ensure_ascii=False, separators=(",", ":"))};\n')
print(len(stars), 'bintang,', len(lines), 'garis rasi,', len(dso), 'objek Messier')

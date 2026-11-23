"""Convertit un CSV de tatouages publics en manifeste JSON pour la galerie 3D.
Usage: python csv_vers_json.py repertoire.csv repertoire.json
"""
import csv
import json
import sys
from pathlib import Path

def main():
    if len(sys.argv) != 3:
        raise SystemExit('Usage : python csv_vers_json.py entree.csv sortie.json')
    src, dst = map(Path, sys.argv[1:])
    with src.open('r', encoding='utf-8-sig', newline='') as handle:
        rows=list(csv.DictReader(handle))
    result=[]
    for i, r in enumerate(rows, 1):
        image=(r.get('image') or '').strip()
        if not image:
            print(f'ATTENTION : ligne {i} ignorée (image vide)')
            continue
        result.append({
            'id':(r.get('id') or f'oeuvre-{i:05d}').strip(),
            'title':(r.get('title') or f'Tatouage {i}').strip(),
            'category':(r.get('category') or 'Tatouage').strip(),
            'year':int(r['year']) if (r.get('year') or '').strip().isdigit() else None,
            'description':(r.get('description') or '').strip(),
            'image':image,
            'thumb':(r.get('thumb') or image).strip(),
            'source':(r.get('source') or '').strip(),
        })
    dst.write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf-8')
    print(f'{len(result)} œuvres exportées dans {dst}')

if __name__=='__main__':main()

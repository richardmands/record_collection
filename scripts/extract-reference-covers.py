"""Extract user-requested sleeve crops from originals. Requires Pillow and numpy.
Run from the repository root. Corner coordinates are TL, TR, BR, BL.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps, ImageDraw
root=Path(__file__).resolve().parents[1]
manifest_path=root/(sys.argv[1] if len(sys.argv)>1 else 'data/research/cover-crops.json')
manifest=json.loads(manifest_path.read_text(encoding='utf-8-sig'))
size=manifest.get('outputSize',1200)
(root/'.work').mkdir(exist_ok=True)
for c in manifest['covers']:
 im=ImageOps.exif_transpose(Image.open(root/'data/reference-photos'/c['photo'])).convert('RGB')
 if c.get('rotateCounterclockwise'): im=im.rotate(c['rotateCounterclockwise'],expand=True)
 pts=[(x*im.width/manifest['coordinateSpace'][0],y*im.height/manifest['coordinateSpace'][1]) for x,y in c['corners']]
 matrix=[];values=[]
 for (u,v),(x,y) in zip([(0,0),(size,0),(size,size),(0,size)],pts):
  matrix.extend([[u,v,1,0,0,0,-x*u,-x*v],[0,0,0,u,v,1,-y*u,-y*v]]);values.extend([x,y])
 coeffs=np.linalg.solve(np.array(matrix),np.array(values))
 out=im.transform((size,size),Image.Transform.PERSPECTIVE,coeffs,Image.Resampling.BICUBIC)
 out.save(root/f"public/covers/{c['id']}_reference_crop.jpg",quality=manifest.get('jpegQuality',92),optimize=True)
 print(c['id'],c['photo'])
# Contact sheet for visual QA only.
sheet=Image.new('RGB',(990,((len(manifest['covers'])+2)//3)*350),'#eee');draw=ImageDraw.Draw(sheet)
for i,c in enumerate(manifest['covers']):
 im=Image.open(root/f"public/covers/{c['id']}_reference_crop.jpg");im.thumbnail((320,320))
 x=(i%3)*330;y=(i//3)*350;sheet.paste(im,(x,y+25));draw.text((x+5,y+5),c['id']+' '+c['photo'],fill='black')
sheet.save(root/'.work/crop-review.jpg')

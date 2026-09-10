"""Render the original HALVETH research-room banner. Requires Pillow.

Usage: python scripts/build-research-banner.py --font-dir FONT_DIRECTORY
No external images, network requests, or embedded metadata.
The graph is a navigation illustration, not a scientific measurement.
"""
from pathlib import Path
import argparse
import math
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('--font-dir', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
width, height = 1600, 560
canvas = Image.new('RGB', (width, height))
pixels = canvas.load()
for y in range(height):
    for x in range(width):
        glow = max(0, 1 - math.hypot((x-1240)/750, (y-240)/500))
        pixels[x,y] = (int(9+glow*6), int(19+glow*20), int(31+glow*25))
draw = ImageDraw.Draw(canvas)
font = lambda name, size: ImageFont.truetype(str(args.font_dir/name), size)
regular = lambda size: font('segoeui.ttf', size)
bold = lambda size: font('segoeuib.ttf', size)
mint, white, soft = '#74e8cd', '#f3f6f8', '#adc3cf'
for x in range(900, 1580, 36):
    for y in range(36, 540, 36):
        draw.ellipse((x,y,x+2,y+2), fill='#29414d')
draw.rounded_rectangle((62,48,292,88), radius=20, fill='#173a3e', outline='#35655c')
draw.text((83,52), 'HALVETH  /  2026', font=bold(22), fill=mint)
draw.text((62,116), 'OPEN', font=bold(89), fill=white)
draw.text((62,209), 'RESEARCH', font=bold(89), fill=white)
draw.text((67,337), 'Wissen teilen. Fragen verfolgen.', font=regular(32), fill=soft)
draw.line((67,406,807,406), fill='#314554', width=2)
draw.text((67,435), 'CODE   /   THESEN   /   QUELLEN   /   DIALOG', font=bold(21), fill=mint)
cx,cy=1205,275
nodes=[]
for i in range(8):
    angle=(i*45-90)*math.pi/180
    nodes.append((cx+205*math.cos(angle),cy+205*math.sin(angle)))
for radius in (100,205):
    draw.ellipse((cx-radius,cy-radius,cx+radius,cy+radius), outline='#365460',width=2)
for i,(x,y) in enumerate(nodes):
    draw.line((cx,cy,x,y),fill='#3e6c70',width=2)
    if i%2==0:
        end=nodes[(i+3)%8]
        draw.line((x,y,*end),fill='#274652',width=2)
for i,(x,y) in enumerate(nodes):
    color=mint if i%2==0 else '#ffbd92'
    draw.ellipse((x-11,y-11,x+11,y+11),fill=color)
draw.ellipse((cx-57,cy-57,cx+57,cy+57),fill='#12393d',outline=mint,width=3)
draw.text((cx-29,cy-35),'H',font=bold(52),fill=white)
draw.text((1056,514),'EIN RAUM. VIELE PERSPEKTIVEN.',font=regular(18),fill=soft)
(root/'assets').mkdir(exist_ok=True)
target=root/'assets/research-room.png'
canvas.save(target, optimize=True)
print(f'{target.name}: {width}x{height}, {target.stat().st_size} bytes')

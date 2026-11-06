"""Run 8 glyph icons: line style matching Assets/Art/UI/Icons (128 px, round caps). Original art."""
from PIL import Image, ImageDraw
import math, os, sys
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
IVORY=(255,240,214,255); CYAN=(63,227,255,255); CORAL=(255,107,89,255); BRASS=(232,176,74,255)
S=4; W=128*S; LW=7*S
def canvas(): return Image.new("RGBA",(W,W),(0,0,0,0))
def save(im,name): im.resize((128,128),Image.LANCZOS).save(os.path.join(OUT,name))
def line(d,pts,c,w=LW):
    d.line([(x*S,y*S) for x,y in pts],fill=c,width=w,joint="curve")
    for x,y in (pts[0],pts[-1]): d.ellipse([x*S-w/2,y*S-w/2,x*S+w/2,y*S+w/2],fill=c)
def arc(d,box,a0,a1,c,w=LW): d.arc([v*S for v in box],a0,a1,fill=c,width=w)
# Name: head and shoulders bust
im=canvas();d=ImageDraw.Draw(im);arc(d,(44,18,84,58),0,360,IVORY);arc(d,(22,64,106,140),180,360,IVORY);line(d,[(22,102),(106,102)],IVORY);save(im,"GlyphName.png")
# Where: map pin with dot
im=canvas();d=ImageDraw.Draw(im)
pts=[];cx,cy,r=64,50,30
for i in range(0,241,6):
    a=math.radians(150+i);pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
line(d,[(64,112)]+pts+[(64,112)],CYAN);arc(d,(54,40,74,60),0,360,CYAN);save(im,"GlyphWhere.png")
# Lie (press): broken speech line / lightning bolt
im=canvas();d=ImageDraw.Draw(im);line(d,[(74,14),(44,66),(70,66),(52,114)],CORAL);save(im,"GlyphLie.png")
# Ask: speech bubble with question mark
im=canvas();d=ImageDraw.Draw(im);line(d,[(20,24),(108,24),(108,84),(56,84),(36,106),(38,84),(20,84),(20,24)],IVORY)
arc(d,(50,34,78,58),180,30,IVORY,6*S);line(d,[(75,52),(64,62),(64,66)],IVORY,6*S);d.ellipse([61*S,72*S,67*S,78*S],fill=IVORY);save(im,"GlyphAsk.png")
# Noted (believe): check inside notebook corner
im=canvas();d=ImageDraw.Draw(im);line(d,[(28,16),(100,16),(100,112),(28,112),(28,16)],BRASS);line(d,[(44,66),(60,82),(86,48)],BRASS);save(im,"GlyphNoted.png")
# Object: thread from card to pin
im=canvas();d=ImageDraw.Draw(im);line(d,[(16,40),(58,40),(58,92),(16,92),(16,40)],CYAN);line(d,[(58,66),(80,52),(98,74)],CORAL,5*S);arc(d,(92,62,112,82),0,360,CORAL);save(im,"GlyphObject.png")
# Seal: wax seal
im=canvas();d=ImageDraw.Draw(im)
pts=[(64+44*math.cos(math.radians(a))*(1 if (a//20)%2==0 else .88),64+44*math.sin(math.radians(a))*(1 if (a//20)%2==0 else .88)) for a in range(0,361,10)]
line(d,pts,CORAL);arc(d,(38,38,90,90),0,360,CORAL,5*S);save(im,"GlyphSeal.png")
# Notebook
im=canvas();d=ImageDraw.Draw(im);line(d,[(30,14),(102,14),(102,114),(30,114),(30,14)],IVORY);[line(d,[(46,y),(88,y)],IVORY,5*S) for y in (42,62,82)];[arc(d,(20,y-6,40,y+6),90,270,IVORY,5*S) for y in (34,64,94)];save(im,"GlyphNotebook.png")
# Evidence fan (photos)
im=canvas();d=ImageDraw.Draw(im)
for ang,c in ((-18,CYAN),(0,IVORY),(18,BRASS)):
    a=math.radians(ang);ca,sa=math.cos(a),math.sin(a);corn=[(-24,-34),(24,-34),(24,34),(-24,34),(-24,-34)]
    line(d,[(64+x*ca-y*sa,70+x*sa+y*ca) for x,y in corn],c,5*S)
save(im,"GlyphEvidence.png")
print("ok")

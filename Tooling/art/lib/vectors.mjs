// Original procedural engraving. No raster references, downloaded art, or browser required.
export const palette={ivory:'#FFF0D6',brass:'#E8B04A',yellow:'#FFD60A',coral:'#FF6B5A',cyan:'#3FE3FF',violet:'#8F7CFF'};
export const M=(x,y)=>['M',x,y],L=(x,y)=>['L',x,y],C=(...v)=>['C',...v],Z=()=>['Z'];
export function path(points,color=palette.ivory,width=2,extra={}){return {type:'path',path:points,color,width,...extra}}
export function ellipse(x,y,w,h,color=palette.ivory,width=2,extra={}){return {type:'ellipse',x,y,w,h,color,width,...extra}}
export function text(value,x,y,size=18,color=palette.ivory,extra={}){return {type:'text',text:value,x,y,size,color,font:'Courier New',...extra}}
export const line=(x,y,X,Y,color=palette.ivory,width=2,extra={})=>path([M(x,y),L(X,Y)],color,width,extra);
export function transform(items,dx,dy,rot=0){return items.map(i=>({...i,transform:[dx,dy,rot]}))}
export const POSES=['neutral','listening','rattled','broken','smug'];
export const CAST=[{id:'S2',key:'Vale',name:'MARGUERITE VALE',anchor:[340,440],role:'THE TRUSTEE'},
  {id:'S1',key:'Qadir',name:'IMRAN QADIR',anchor:[352,554],role:'THE DEBTOR'},
  {id:'S3',key:'Okafor',name:'DR. ADA OKAFOR',anchor:[256,229],role:'THE PHYSICIAN'},
  {id:'S4',key:'Pike',name:'JONAH PIKE',anchor:[160,578],role:'THE ART DEALER'}];
const hatch=(p,color=palette.ivory,spacing=13,slope=-0.75,alpha=.3)=>({type:'hatch',path:p,color,width:.8,spacing,slope,alpha});
export function hands(x,y,angle=0,glove=false){const col=glove?'#FFFFFF':palette.ivory;return transform([
  path([M(-18,18),L(-22,-1),C(-26,-17,-20,-25,-15,-14),L(-7,-3),L(-10,-33),C(-11,-42,-5,-43,-3,-34),L(2,-11),L(4,-37),C(5,-45,11,-44,12,-35),L(14,-10),L(18,-30),C(20,-36,25,-34,24,-25),L(26,-3),C(27,12,18,23,12,29),L(-10,26)],col,glove?2.6:1.6),
  path([M(-10,5),C(1,-3,12,-3,20,3)],col,1.2),line(-12,20,15,24,col,1.5)],x,y,angle)}
function face(key,pose){
  const P=palette,items=[],broken=pose==='broken',rattled=pose==='rattled',smug=pose==='smug',listening=pose==='listening';
  // Mouth and eyes stay in the actor shader's contract window. Head expression changes in place.
  const left=key==='Qadir'?173:key==='Pike'?215:190,right=key==='Pike'?302:key==='Qadir'?334:324;
  const chin=key==='Vale'?321:key==='Pike'?345:key==='Okafor'?323:328;
  const outline=key==='Pike'?[M(215,182),L(210,234),L(221,280),L(240,332),L(259,345),L(282,318),L(294,274),L(302,201)]
    :key==='Okafor'?[M(190,182),C(184,219,193,267,201,285),L(221,320),L(276,323),L(302,291),C(317,265,327,228,324,201)]
    :key==='Qadir'?[M(173,182),C(163,225,176,278,192,296),L(219,326),L(272,328),L(308,298),C(333,270,342,229,334,201)]
    :[M(190,182),C(181,220,197,268,219,293),C(235,316,258,326,278,312),C(300,290,328,244,324,201)];
  items.push(path(outline,P.ivory,2.6),path([M(left+7,260),L(218,284),L(224,304)],P.ivory,1.2),path([M(303,259),L(287,282),L(284,307)],P.ivory,1.5));
  // Narrow eyes, carved cheek planes and asymmetry replace the prototype's friendly circles.
  const eyeY=key==='Okafor'?229:233,tilt=rattled?-5:smug?5:key==='Pike'?-8:0;
  const eyeXs=key==='Pike'?[234,277]:key==='Qadir'?[215,286]:[218,282],eyeW=key==='Pike'?13:19;
  for(const [index,x] of eyeXs.entries()){
    const sg=index===0?1:-1;
    const opening=broken?1:key==='Vale'?2:key==='Pike'?3:5;
    items.push(path([M(x-eyeW,eyeY),C(x-8,eyeY-opening,x+7,eyeY-opening-1,x+eyeW,eyeY-1)],P.ivory,2.4));
    if(!broken)items.push(line(x+(rattled?7:0),eyeY-3,x+(rattled?7:0),eyeY+3,P.ivory,2.8));
    items.push(path([M(x-eyeW,eyeY-13+tilt*sg),C(x-6,eyeY-18,x+7,eyeY-15,x+eyeW,eyeY-11-tilt*sg)],P.ivory,key==='Pike'?4.6:key==='Vale'?2.6:3.1));
    items.push(line(x-14,eyeY+11,x+12,eyeY+14,P.ivory,1.1,{alpha:.6}));
  }
  const nose=key==='Okafor'?[M(254,234),L(249,259),C(252,264,261,264,267,259)]
    :key==='Pike'?[M(258,230),L(253,252),L(266,277),L(251,277),L(246,273)]
    :key==='Qadir'?[M(252,230),C(247,244,244,260,247,269),C(252,273,264,273,270,266)]
    :[M(254,231),C(251,249,247,260,249,266),L(262,268),L(267,263)];
  items.push(path(nose,P.ivory,1.9));
  const my=(key==='Vale'?283:key==='Okafor'?289:292)+(broken?8:0),s=smug?-6:rattled?4:0;
  const mouth=key==='Vale'?[M(236,my),C(246,my-1,263,my-1,275,my)]
    :key==='Pike'?[M(237,my+4),L(250,my-1),L(266,my+5)]
    :key==='Qadir'?[M(229,my+3+s),C(244,my+13,264,my+11,283,my-6-s)]
    :[M(235,my),L(253,my+1),L(276,my)];
  items.push(path(mouth,P.ivory,2.7));
  if(listening||rattled)items.push(path([M(239,my+5),C(250,my+10,265,my+8,272,my+4)],P.ivory,1.4));
  else items.push(path([M(244,my+7),C(251,my+8,262,my+8,268,my+6)],P.ivory,1.3));
  if(key==='Vale')items.push(ellipse(286,280,3,3,P.ivory,1,{fill:true}),path([M(206,227),L(198,224)],P.ivory,2));
  if(key==='Qadir')items.push(path([M(233,281),C(246,277,254,280,260,282),C(270,276,276,279,283,282)],P.brass,2.2));
  if(key==='Pike')for(let i=0;i<4;i++)items.push(line(278+i*4,274,276+i*4,281,P.ivory,.9,{alpha:.7}));
  if(rattled)items.push(path([M(313,242),C(319,253,322,259,317,261),C(312,261,312,254,313,242)],P.ivory,1.5));
  if(broken)items.push(path([M(210,255),L(216,270)],P.ivory,1),path([M(289,255),L(283,270)],P.ivory,1));
  // Hair defines four very different head silhouettes.
  if(key==='Vale'){
    items.push(path([M(188,216),C(161,182,174,144,199,139),C(173,115,203,83,241,111),C(266,70,312,88,317,126),C(355,144,346,183,322,217),L(313,182),C(280,190,258,169,246,150),C(234,177,205,175,188,216)],P.brass,3.1));
    for(let i=0;i<7;i++)items.push(path([M(185+i*4,179-i*5),C(207+i*2,136-i*3,218+i*5,173-i*4,246+i*2,125+i*3)],P.brass,1.3,{alpha:.7}));
    for(let i=0;i<5;i++)items.push(path([M(263+i*5,129),C(271+i*8,155,298+i*5,162,329-i*2,159+i*7)],P.brass,1.2));
  }else if(key==='Qadir'){
    items.push(path([M(179,226),L(168,200),C(153,168,177,139,197,144),C(214,106,259,109,279,125),C(312,109,339,132,337,165),L(322,217),L(308,177),C(276,159,249,177,222,153),C(214,180,195,177,184,201)],P.brass,2.8));
    for(let i=0;i<8;i++)items.push(path([M(182+i*9,157-i),C(191+i*9,130,202+i*8,130,218+i*9,143)],P.brass,1.2));
  }else if(key==='Okafor'){
    items.push(path([M(189,241),C(159,235,165,207,168,191),C(155,151,188,123,220,125),C(230,108,263,105,284,118),C(332,117,344,155,331,178),C(343,198,340,231,322,242),L(316,195),C(283,192,264,167,243,153),C(226,185,204,187,194,197),Z()],P.brass,2.7));
    for(let i=0;i<9;i++)items.push(path([M(174+i*16,164),C(171+i*15,147,192+i*11,131,202+i*12,130)],P.brass,1.4,{alpha:.8}));
  }else{
    items.push(path([M(215,216),L(204,180),C(203,148,223,136,250,139),C(277,132,307,145,310,171),L(302,217),L(296,178),C(277,173,253,161,229,172),L(218,197)],P.brass,2.7));
    for(let i=0;i<8;i++)items.push(path([M(205+i*8,173),C(225+i*5,143,252+i*4,145,274+i*6,159)],P.brass,1.2));
  }
  return items;
}
export function portrait(character,pose='neutral',mode='normal'){
  const key=character.key,P=palette,items=[],b=pose==='broken',r=pose==='rattled',l=pose==='listening',s=pose==='smug';
  const drop=b?22:r?10:0,lean=key==='Pike'?22:key==='Qadir'?-16:0;
  // Every torso is separately drawn: silhouette identity survives a tiny thumbnail.
  let body;
  if(key==='Vale'){
    body=[M(221,335),C(181,351,140,354,116,394),C(120,458,157,502,193,539),C(178,590,154,635,136,817),L(355,817),C(349,669,328,585,306,539),C(340,498,366,437,375,391),C(352,355,307,348,283,335)];
    items.push(hatch(body,P.ivory,16,-.7,.25),path(body,P.ivory,2.5));
    items.push(path([M(222,336),C(223,391,234,412,254,431),C(275,405,281,370,283,335)],P.ivory,2));
    // Wide fur stole: scalloped edge, curved engraving locks, no filled cloth.
    const fur=[M(222,347),C(186,351,139,349,113,388),C(104,410,116,432,138,443),C(173,446,207,422,235,394),M(286,346),C(329,350,369,365,383,402),C(385,428,364,451,341,452),C(317,442,296,416,279,394)];
    items.push(path(fur,P.ivory,3));
    for(let i=0;i<15;i++){let y=370+i*4;items.push(path([M(132+i*3,y+21),C(143+i*3,y+1,170+i*3,y-3,187+i*3,y-10)],P.ivory,1.2,{alpha:.65}))}
    for(let i=0;i<9;i++)items.push(path([M(299+i*5,362+i*6),C(306+i*5,380+i*6,319+i*4,388+i*5,344+i*3,392+i*6)],P.ivory,1.3,{alpha:.65}));
    items.push(path([M(193,539),C(232,552,274,549,306,539)],P.brass,2.4));
    for(let i=0;i<6;i++)items.push(path([M(207+i*17,565),C(201+i*18,646,185+i*24,723,179+i*25,808)],P.ivory,1.1,{alpha:.55}));
  }else if(key==='Qadir'){
    body=[M(218,337),C(176,364,117,385,113,429),L(129,586),L(112,802),L(235,817),L(257,712),L(279,819),L(369,792),L(351,527),L(375,389),C(347,344,304,339,281,337)];
    items.push(hatch(body,P.ivory,18,.7,.25),path(body,P.ivory,2.6));
    items.push(path([M(214,349),L(163,394),L(185,425),L(170,442),L(244,567),L(278,354),M(285,351),L(327,400),L(308,431),L(326,443),L(264,569)],P.ivory,2.2));
    items.push(path([M(218,338),L(206,373),L(226,402),L(246,378),L(263,405),L(282,373),L(282,337)],P.ivory,2.4));
    items.push(path([M(245,389),L(237,430),L(249,450)],P.ivory,1.4),line(292,474,330,465,P.ivory,2),path([M(264,589),L(265,650),L(247,693)],P.ivory,1.4));
    for(let i=0;i<3;i++)items.push(path([M(140,520+i*18),L(179,529+i*12)],P.ivory,1.2));
  }else if(key==='Okafor'){
    body=[M(218,334),L(177,349),C(145,357,127,377,126,411),L(133,610),L(144,803),L(366,803),L(363,587),L(380,407),C(366,371,318,349,285,334)];
    items.push(hatch(body,P.ivory,21,-.55,.22),path(body,P.ivory,2.6));
    items.push(path([M(219,340),L(190,386),L(214,407),L(201,432),L(246,542),L(245,793),M(282,340),L(313,386),L(290,408),L(303,431),L(264,539),L(263,793)],P.ivory,2.1));
    items.push(path([M(222,351),C(236,377,265,377,282,350)],P.ivory,2),path([M(297,448),L(340,448),L(336,484),L(300,484),Z()],P.ivory,1.7));
    items.push(line(309,438,311,461,P.brass,2),line(320,437,322,461,P.ivory,2));
    for(let i=0;i<3;i++)items.push(ellipse(253,553+i*51,5,5,P.ivory,1.7));
    // The doctor's bag is readable outside the straight coat silhouette.
    items.push(path([M(94,622),L(169,622),L(184,702),C(173,719,95,722,83,707),Z()],P.ivory,2.5),path([M(109,622),C(108,596,148,596,150,622)],P.brass,2.4),line(91,640,172,640,P.ivory,1.5));
  }else{
    body=[M(225,332),C(181,316,121,339,104,402),L(136,560),L(114,815),L(387,815),L(366,578),L(396,423),C(385,364,331,325,288,334)];
    items.push(hatch(body,P.ivory,13,.85,.22),path(body,P.ivory,2.7));
    items.push(path([M(224,332),L(196,314),L(159,379),L(214,436),L(248,548),M(287,332),L(311,320),L(351,389),L(291,439),L(248,548),L(264,806)],P.ivory,2.6));
    items.push(path([M(218,352),L(235,395),L(258,379),L(281,407),L(295,353)],P.brass,2));
    for(let i=0;i<3;i++){items.push(ellipse(229,557+i*54,6,6,P.brass,1.7),ellipse(286,555+i*54,6,6,P.brass,1.7))}
    items.push(path([M(305,660),L(359,643),L(358,659),L(306,677),Z()],P.ivory,1.5));
  }
  // Shoulder droop/lean move only clothing, preserving facial shader and tell anchors.
  let out=items.map(i=>({...i,transform:[lean,drop,0]}));
  const headAngle=(b?9:r?-6:l?-5:s?-8:0)+(key==='Pike'?14:key==='Qadir'?-9:key==='Vale'?-4:0);
  const angle=headAngle*Math.PI/180,cx=256,cy=229,dx=(key==='Pike'?17:key==='Qadir'?-7:0)+(key==='Okafor'?0:b?-7:r?5:0),dy=(key==='Pike'?13:key==='Vale'?-5:0)+(key==='Okafor'?0:b?14:s?-6:0);
  out.push(...face(key,pose).map(i=>({...i,transform:[cx-Math.cos(angle)*cx+Math.sin(angle)*cy+dx,cy-Math.sin(angle)*cx-Math.cos(angle)*cy+dy,headAngle]})));
  out.push(line(224,318,220,351,P.ivory,1.7),line(282,321,286,351,P.ivory,1.7));
  // One arm remains anchored to the tell; the free arm performs the emotional pose.
  const ax=key==='Pike'?160:key==='Qadir'?352:key==='Okafor'?126:226,ay=key==='Pike'?578:key==='Qadir'?574:key==='Okafor'?610:554;
  out.push(path([M(key==='Pike'?128:key==='Qadir'?355:key==='Okafor'?141:135,421+drop),C(ax-35,489,ax-30,ay-39,ax-12,ay-18)],P.ivory,2.4));
  if(key!=='Pike')out.push(...hands(ax,ay,key==='Qadir'?-18:8));
  const fx=key==='Qadir'?(l?154:r?219:b?173:s?213:169):key==='Pike'?(l?286:r?278:b?300:s?202:190):(l?347:r?294:b?326:s?201:300);
  const fy=key==='Qadir'?(l?442:r?355:b?686:s?493:633):key==='Pike'?(l?410:r?360:b?674:s?503:562):(l?406:r?351:b?674:s?503:574);
  const sh=key==='Qadir'?130:352;
  out.push(path([M(sh+lean,422+drop),C(key==='Qadir'?92:389,500,fx+43,fy+32,fx+15,fy+16),M(sh-21+lean,447+drop),C(key==='Qadir'?112:357,511,fx+22,fy+55,fx-4,fy+25)],P.ivory,2.1));
  out.push(...hands(fx,fy,l?28:r?-16:b?8:s?-60:-20));
  // Anchors are solved in image space, never shifted by pose or body transforms.
  if(key==='Vale'){
    out.push(ellipse(329,429,22,22,'#FFFFFF',3,{glow:true}),path([M(340,425),L(345,435),L(354,440),L(345,445),L(340,455),L(335,445),L(326,440),L(335,435),Z()],P.yellow,2.5,{glow:true}),ellipse(337,437,6,6,'#FFFFFF',1,{fill:true}));
  }else if(key==='Qadir'){
    out.push(path([M(343,540),L(361,540),L(361,568),L(343,568),Z()],P.yellow,3,{glow:true}),line(343,546,361,546,'#FFFFFF',3),line(347,536,357,536,'#FFFFFF',2),line(352,549,352,565,'#FFFFFF',3));
  }else if(key==='Okafor'){
    out.push(ellipse(203,215,40,27,'#FFFFFF',2.5),ellipse(270,215,40,27,'#FFFFFF',2.5),path([M(243,227),C(251,222,262,222,270,227)],'#FFFFFF',3.4,{glow:true}),line(195,220,204,223,'#FFFFFF',2),line(310,223,321,218,'#FFFFFF',2),line(239,228,273,228,'#FFFFFF',2.6,{glow:true}));
  }else{
    out.push(...hands(160,577,-5,true),line(146,595,174,597,'#FFFFFF',3));
    out.push(line(152,578,168,578,'#FFFFFF',3,{glow:true}));
  }
  if(mode!=='normal'){
    const color=mode==='claim'?P.cyan:mode==='truth'?P.coral:P.ivory;
    out=out.filter(i=>i.type!=='hatch').map(i=>({...i,color,alpha:mode==='suggestion'?.48:.8,dash:true,glow:false}));
  }
  return {width:512,height:1024,fade:[640,860],items:out,contract:mode==='normal'?{anchor:character.anchor}:undefined};
}

export function victim(pose='standing'){
  const P=palette,col=P.ivory,items=[];
  const coat=[M(206,337),C(151,351,104,388,112,441),L(133,594),L(121,819),L(389,819),L(374,582),L(400,424),C(381,373,327,349,296,336)];
  items.push(path(coat,col,2.5,{dash:true}),path([M(206,337),L(169,382),L(208,416),L(249,580),L(301,336),M(298,341),L(341,388),L(310,423),L(266,579),L(266,810)],col,2,{dash:true}));
  items.push(path([M(203,208),C(183,166,206,117,250,116),C(301,110,331,155,312,209),L(312,259),C(299,308,277,339,254,338),C(226,339,202,296,196,251),Z()],col,2.3,{dash:true}));
  // Receding temples, broad waistcoat, watch chain and old-fashioned spectacles identify the victim.
  items.push(path([M(197,204),C(180,175,194,148,209,143),L(214,177),M(313,203),C(330,173,318,147,301,141),L(297,177)],col,2));
  items.push(ellipse(207,216,35,30,col,1.8),ellipse(271,216,35,30,col,1.8),line(242,228,271,228,col,2));
  items.push(path([M(252,238),L(246,271),L(262,274)],col,1.8),path([M(225,285),C(243,278,262,282,284,283)],col,2),path([M(233,300),C(248,305,264,304,279,299)],col,1.5));
  items.push(path([M(223,338),L(248,362),L(225,379),Z()],col,2),path([M(289,338),L(260,361),L(284,379),Z()],col,2));
  for(let i=0;i<4;i++)items.push(ellipse(252,440+i*43,5,5,col,1.6));
  items.push(path([M(267,544),C(295,590,326,586,337,545)],col,1.6,{dash:true}),ellipse(324,530,22,28,col,1.8));
  for(let i=0;i<64;i++){const x=130+(i*53)%255,y=388+(i*77)%425;items.push(ellipse(x,y,1.6,1.6,col,1,{fill:true,alpha:.5}))}
  if(pose==='falling')return {width:512,height:1024,fade:[650,860],items:items.map(i=>({...i,transform:[-113,211,-23]}))};
  return {width:512,height:1024,fade:[640,860],items};
}

// Original monoline display alphabet. Rasterized hero words carry no external font dependency.
const GLYPHS={A:['0,1 0.5,0 1,1','0.2,0.6 0.8,0.6'],B:['0,1 0,0 0.65,0 1,0.2 0.65,0.5 0,0.5','0.65,0.5 1,0.75 0.7,1 0,1'],C:['1,0.1 0.7,0 0.2,0 0,0.2 0,0.8 0.2,1 0.8,1 1,0.9'],D:['0,1 0,0 0.6,0 1,0.25 1,0.75 0.6,1 0,1'],E:['1,0 0,0 0,1 1,1','0,0.5 0.8,0.5'],F:['1,0 0,0 0,1','0,0.5 0.8,0.5'],G:['1,0.2 0.8,0 0.2,0 0,0.2 0,0.8 0.2,1 1,1 1,0.55 0.55,0.55'],H:['0,0 0,1','1,0 1,1','0,0.5 1,0.5'],I:['0,0 1,0','0.5,0 0.5,1','0,1 1,1'],J:['0,0 1,0 1,0.8 0.75,1 0.2,1 0,0.8'],K:['0,0 0,1','1,0 0,0.55 1,1'],L:['0,0 0,1 1,1'],M:['0,1 0,0 0.5,0.45 1,0 1,1'],N:['0,1 0,0 1,1 1,0'],O:['0.2,0 0.8,0 1,0.2 1,0.8 0.8,1 0.2,1 0,0.8 0,0.2 0.2,0'],P:['0,1 0,0 0.75,0 1,0.2 1,0.4 0.75,0.55 0,0.55'],Q:['0.2,0 0.8,0 1,0.2 1,0.8 0.8,1 0.2,1 0,0.8 0,0.2 0.2,0','0.6,0.7 1.2,1.1'],R:['0,1 0,0 0.75,0 1,0.2 1,0.4 0.75,0.5 0,0.5','0.6,0.5 1,1'],S:['1,0.1 0.75,0 0.2,0 0,0.2 0.2,0.45 0.8,0.55 1,0.8 0.8,1 0.2,1 0,0.9'],T:['0,0 1,0','0.5,0 0.5,1'],U:['0,0 0,0.8 0.2,1 0.8,1 1,0.8 1,0'],V:['0,0 0.5,1 1,0'],W:['0,0 0.2,1 0.5,0.55 0.8,1 1,0'],X:['0,0 1,1','1,0 0,1'],Y:['0,0 0.5,0.5 1,0','0.5,0.5 0.5,1'],Z:['0,0 1,0 0,1 1,1'],'!':['0.5,0 0.5,0.7','0.5,0.93 0.5,1']};
export function heroWord(value,width=1024,height=256,color=palette.yellow){
  const unit=Math.min((width-80)/(value.length*1.35),height*.64),cw=unit*.76,h=unit*1.45,total=value.length*unit*1.03;
  const out=[];let x=(width-total)/2;
  for(const ch of value){for(const seg of GLYPHS[ch]||[]){const p=seg.split(' ').map(v=>v.split(',').map(Number)).map(([a,b],i)=>[i?'L':'M',x+a*cw,(height-h)/2+b*h]);out.push(path(p,color,Math.max(3,unit*.13),{glow:true}),path(p,palette.ivory,Math.max(1.1,unit*.025)))}x+=unit*1.03}
  return {width,height,items:out};
}

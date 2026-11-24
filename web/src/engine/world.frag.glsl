#version 300 es
precision highp float;precision highp int;
#define NO 26
#define TAU 6.2831853
uniform vec2 uRes;uniform float uScale,uZ,uMpp,uFade,uClouds;
uniform ivec2 uOI[NO];uniform vec2 uOF[NO];uniform float uOS[NO];uniform float uFq[NO];
uniform int uNO;uniform uint uSeed;uniform vec2 uCam;
uniform vec4 uTgt;uniform ivec2 uTgtCell;uniform float uTgtOn;
// uT1 cuerpo de Zum · uT2 pupila · uTR luz · uDecoyCrown pupila de los impostores casi iguales
uniform vec3 uT1,uT2,uTR,uDecoyCrown,uLandTint,uWaterTint;uniform float uTownP,uCloudCover;
out vec4 o;
const float WM=400000.;
const vec2 G16[16]=vec2[16](vec2(1,0),vec2(.92388,.38268),vec2(.70711,.70711),vec2(.38268,.92388),vec2(0,1),vec2(-.38268,.92388),vec2(-.70711,.70711),vec2(-.92388,.38268),vec2(-1,0),vec2(-.92388,-.38268),vec2(-.70711,-.70711),vec2(-.38268,-.92388),vec2(0,-1),vec2(.38268,-.92388),vec2(.70711,-.70711),vec2(.92388,-.38268));
const vec3 C1[14]=vec3[14](vec3(1.,.24,.55),vec3(1.,.24,.55),vec3(1.,.24,.55),vec3(1.,.24,.55),vec3(1.,.24,.55),vec3(.86,.16,.14),vec3(.16,.38,.86),vec3(.13,.6,.34),vec3(1.,.5,.12),vec3(.08,.68,.68),vec3(.15,.15,.18),vec3(.92,.92,.9),vec3(.58,.3,.86),vec3(1.,.82,.2));
const vec3 CROP[6]=vec3[6](vec3(.72,.66,.45),vec3(.45,.54,.29),vec3(.36,.45,.24),vec3(.52,.44,.34),vec3(.63,.56,.42),vec3(.55,.55,.36));
const vec3 CARC[6]=vec3[6](vec3(.92),vec3(.15),vec3(.6,.12,.1),vec3(.2,.3,.6),vec3(.55),vec3(.8,.78,.72));
const vec3 ROOF[5]=vec3[5](vec3(.62,.34,.24),vec3(.5,.5,.51),vec3(.34,.35,.37),vec3(.7,.68,.64),vec3(.55,.3,.22));

uint hsh(ivec2 c,uint s){uint h=(uint(c.x)*0x8da6b343u)^(uint(c.y)*0xd8163841u)^(s*0xcb1ab31fu);h^=h>>16;h*=0x7feb352du;h^=h>>15;h*=0x846ca68bu;h^=h>>16;return h;}
float h01(uint h){return float(h>>8)*(1./16777216.);}
vec3 nz(ivec2 c,vec2 f,uint s){
  vec2 u=f*f*f*(f*(f*6.-15.)+10.),du=30.*f*f*(f*(f-2.)+1.);
  vec2 ga=G16[int(hsh(c,s)&15u)],gb=G16[int(hsh(c+ivec2(1,0),s)&15u)],gc=G16[int(hsh(c+ivec2(0,1),s)&15u)],gd=G16[int(hsh(c+ivec2(1,1),s)&15u)];
  float va=dot(ga,f),vb=dot(gb,f-vec2(1,0)),vc=dot(gc,f-vec2(0,1)),vd=dot(gd,f-vec2(1,1)),k=va-vb-vc+vd;
  return vec3(va+u.x*(vb-va)+u.y*(vc-va)+u.x*u.y*k,ga+u.x*(gb-ga)+u.y*(gc-ga)+u.x*u.y*(ga-gb-gc+gd)+du*(u.yx*k+vec2(vb-va,vc-va)));}
void oc(int i,vec2 d,vec2 off,out ivec2 c,out vec2 f){vec2 q=uOF[i]+d*uOS[i]+off*uFq[i];vec2 fl=floor(q);c=uOI[i]+ivec2(fl);f=q-fl;}
vec3 N(int i,vec2 d,uint s){ivec2 c;vec2 f;oc(i,d,vec2(0),c,f);return nz(c,f,s);}
void voro(int i,vec2 d,vec2 off,uint s,out ivec2 id,out vec2 rel,out float d1,out float d2){
  ivec2 c;vec2 f;oc(i,d,off,c,f);d1=9.;d2=9.;id=c;rel=vec2(0);
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){ivec2 cc=c+ivec2(x,y);uint h=hsh(cc,s);vec2 jp=vec2(float(h&1023u),float((h>>10)&1023u))/1023.*.8+.1;vec2 r=vec2(x,y)+jp-f;float dd=dot(r,r);if(dd<d1){d2=d1;d1=dd;id=cc;rel=r;}else if(dd<d2)d2=dd;}
  d1=sqrt(d1);d2=sqrt(d2);}

float terrain(vec2 d,out vec2 gr,out float tex){
  vec2 w=.045*vec2(N(1,d,uSeed+90u).x,N(1,d,uSeed+91u).x)+.02*vec2(N(2,d,uSeed+92u).x,N(2,d,uSeed+93u).x);
  float M=.12+1.1*smoothstep(0.,.4,N(1,d,uSeed+70u).x);
  float h=0.;gr=vec2(0);tex=0.;vec2 ds=vec2(0);
  for(int i=0;i<NO;i++){if(i>=uNO)break;
    ivec2 c;vec2 f;oc(i,d,i<5?w:vec2(0),c,f);vec3 n=nz(c,f,uSeed+uint(i));
    float A;
    if(i<3){A=i==0?1100.:(i==1?650.:380.);}
    else{A=20000./exp2(float(i))*M/(1.+.25*dot(ds,ds));if(i>10)A*=pow(.6,float(i-10));ds+=n.yz;}
    if(i==uNO-1)A*=uFade;
    h+=A*n.x;gr+=A*n.yz*uFq[i];
    if(i>=uNO-4)tex+=n.x*(i==uNO-1?uFade:1.);
  }
  vec2 wp=uCam+d/uZ-.5;float dc=length(wp*vec2(1.,1.15));
  h+=520.-6500.*max(0.,dc-.2);
  if(dc>.2)gr-=6500.*wp*vec2(1.,1.3225)/max(dc,1e-4);
  return h;}

float cloud(vec2 d,vec2 off){float v=0.,a=.5;
  for(int i=3;i<9;i++){ivec2 c;vec2 f;oc(i,d,off,c,f);v+=a*nz(c,f,uSeed+300u+uint(i)).x;a*=.52;}
  return v;}

int variant(uint h){uint m=h%20u;if(m<3u)return 1;if(m<5u)return 2;if(m<7u)return 3;if(m<9u)return 4;return 5+int((h/20u)%9u);}

float sdSeg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
float sdRBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
// Variantes: 0 Zum · 1 pupila de otro color · 2 tres hélices · 3 antena · 4 luz roja · 5..13 otro cuerpo
void dpal(int v,out vec3 body,out vec3 pup,out vec3 led,out int arms,out bool ant){
  body=uT1;pup=uT2;led=uTR;arms=4;ant=false;
  if(v==1)pup=uDecoyCrown;else if(v==2)arms=3;else if(v==3)ant=true;else if(v==4)led=vec3(1.,.23,.19);else if(v>=5)body=C1[v];}
void drone(inout vec3 col,vec2 p,float r,vec2 so,int v,float rot,vec3 LS){
  vec3 body,pup,led;int arms;bool ant;dpal(v,body,pup,led,arms,ant);
  vec3 INK=vec3(.08,.07,.12);
  float sd=length(p-so)/r;col*=1.-.36*(1.-smoothstep(.5,1.05,sd));
  if(r<1.4){float rr=max(r,.55);float cv=clamp(r*r*1.4,0.,1.)*(1.-smoothstep(rr*.6,rr+.9,length(p)));col=mix(col,body,cv);return;}
  vec2 u=p/r;if(dot(u,u)>1.3)return;
  float aa=1.4/r,ca=cos(rot),sa=sin(rot);vec2 q=vec2(ca*u.x+sa*u.y,-sa*u.x+ca*u.y);
  vec3 dk=body*.55;
  for(int i=0;i<4;i++){if(i>=arms)break;
    float a=arms==4?.785398+float(i)*1.570796:1.570796+float(i)*2.094395;vec2 c=vec2(cos(a),sin(a))*.62;
    col=mix(col,dk,1.-smoothstep(-aa,aa,sdSeg(q,vec2(0),c)-.07));
    float dr=length(q-c);
    col=mix(col,mix(col,vec3(.86,.88,.92),.5),1.-smoothstep(.33-aa,.33+aa,dr));
    col=mix(col,INK,(1.-smoothstep(0.,aa*1.5,abs(dr-.33)-.012))*.9);
    col=mix(col,dk,1.-smoothstep(.07-aa,.07+aa,dr));}
  if(ant){col=mix(col,INK,1.-smoothstep(-aa,aa,sdSeg(q,vec2(.2,-.2),vec2(.42,-.5))-.02));col=mix(col,vec3(1.,.82,.25),1.-smoothstep(-aa,aa,length(q-vec2(.43,-.52))-.05));}
  float db=sdRBox(q,vec2(.36),.15);
  col=mix(col,INK,1.-smoothstep(-aa,aa,db-.025));
  col=mix(col,body*(1.+.2*(-u.x-u.y)),1.-smoothstep(-aa,aa,db));
  float de=length(u);
  col=mix(col,INK,1.-smoothstep(.235-aa,.235+aa,de));
  col=mix(col,vec3(.97),1.-smoothstep(.21-aa,.21+aa,de));
  col=mix(col,INK,1.-smoothstep(.145-aa,.145+aa,de));
  col=mix(col,pup,1.-smoothstep(.06-aa,.06+aa,length(u-vec2(.015,.02))));
  col=mix(col,vec3(1.),1.-smoothstep(.028-aa,.028+aa,length(u-vec2(-.05,-.06))));
  col=mix(col,led*1.2,1.-smoothstep(.045-aa,.045+aa,length(q-vec2(.24,.26))));}

void main(){
  vec2 d=vec2(gl_FragCoord.x-uRes.x*.5,uRes.y*.5-gl_FragCoord.y)/uScale;
  float mpp=uMpp;
  vec3 LS=normalize(vec3(-.55,-.55,.63));
  vec2 gr;float tex;float e=terrain(d,gr,tex);
  vec2 sl=gr/WM;float slope=length(sl);
  float moist=.5+.6*N(3,d,uSeed+60u).x+.3*N(5,d,uSeed+61u).x;
  vec3 col;
  if(e>0.){
    float fe=moist+.07*N(8,d,uSeed+67u).x+.035*N(10,d,uSeed+68u).x;
    float fd=smoothstep(.543,.587,fe)*(1.-smoothstep(1500.,1900.,e))*(1.-smoothstep(.55,.9,slope));
    vec3 base=mix(vec3(.63,.58,.40),vec3(.38,.47,.24),smoothstep(.25,.6,moist));
    base=mix(base,vec3(.47,.49,.33),smoothstep(900.,1600.,e));
    vec3 rock=mix(vec3(.43,.4,.36),vec3(.6,.57,.52),.5+.6*N(6,d,uSeed+62u).x);
    base=mix(base,rock,clamp(smoothstep(.45,.85,slope)+smoothstep(1700.,2400.,e)*.85,0.,1.));
    float can=mpp<60.?(.5*N(12,d,uSeed+69u).x+.35*N(13,d,uSeed+71u).x)*smoothstep(60.,20.,mpp)*smoothstep(1.,3.,mpp):0.;
    base=mix(base,vec3(.15,.24,.11)*(1.+.9*can),fd);
    float sand=(1.-smoothstep(1.5,4.5,e))*(1.-smoothstep(.06,.16,slope));
    base=mix(base,mix(vec3(.69,.61,.45),vec3(.87,.8,.63),smoothstep(.15,1.,e)),sand);
    float sn=smoothstep(2150.,2400.,e+180.*N(5,d,uSeed+63u).x)*(1.-smoothstep(.9,1.4,slope));
    base=mix(base,vec3(.93,.95,.98),sn);
    float urb=0.,tw=0.,R=0.;ivec2 tid;vec2 trl;uint th=0u;
    if(mpp<260.){float d1,d2;voro(7,d,vec2(0),uSeed+80u,tid,trl,d1,d2);th=hsh(tid,uSeed+81u);
      if(h01(th)<uTownP){R=110.+380.*h01(hsh(tid,uSeed+82u));
        float dist=length(trl*(WM/uFq[7]))+R*.35*N(10,d,uSeed+84u).x;
        tw=smoothstep(R,R*.7,dist)*smoothstep(2.,5.,e)*(1.-smoothstep(.1,.2,slope))*(1.-smoothstep(450.,650.,e));}}
    // roads between towns
    if(mpp<220.&&e>1.5&&e<1400.){
      vec3 rn=N(6,d,uSeed+85u);float rd=abs(rn.x)/max(length(rn.yz),.06)*(WM/uFq[6]);
      float hw=3.2/mpp,lw=rd/mpp;
      float a=(1.-smoothstep(hw,hw+1.,lw))*min(1.,hw*2.2+.12)*step(0.,N(4,d,uSeed+86u).x)*(1.-sand);
      base=mix(base,vec3(.31,.31,.32),a*(1.-sn));
    }
    // fields
    float fm=(1.-fd)*(1.-sand)*(1.-sn)*(1.-smoothstep(500.,700.,e))*(1.-smoothstep(.08,.16,slope))*smoothstep(-.2,.05,N(4,d,uSeed+64u).x);
    float hedge=0.;
    if(fm>.01&&mpp<160.){
      ivec2 id;vec2 rl;float d1,d2;vec2 fw=mpp<40.?vec2(N(12,d,uSeed+74u).x,N(12,d,uSeed+75u).x)*(9./WM):vec2(0);voro(9,d,fw,uSeed+65u,id,rl,d1,d2);
      uint ph=hsh(id,uSeed+66u);vec3 cc=CROP[int(ph%6u)]*(.93+.14*h01(hsh(id,uSeed+72u)))*(.95+.1*N(11,d,uSeed+73u).x);
      if(mpp<5.){float a=h01(ph)*3.14159;vec2 dir=vec2(cos(a),sin(a));cc*=1.+.08*sin(dot(rl*260.42+fw*WM,dir)*TAU/3.2)*smoothstep(5.,1.5,mpp);}
      float bm=(d2-d1)*.5*260.42;
      hedge=((ph>>20)&3u)!=0u?(1.-smoothstep(1.2,3.5,bm)):0.;
      vec3 fc=mix(cc,vec3(.22,.29,.14),hedge*.85);
      fc=mix(fc,vec3(.72,.66,.52),(1.-smoothstep(.6,1.6,bm))*(1.-hedge));
      base=mix(base,fc,fm*smoothstep(160.,60.,mpp));
      hedge*=fm;
    }
    // trees
    float tv=smoothstep(3.,1.2,mpp);
    float td=fd*.92+.02*(1.-fm)+hedge*.8+.2*tw;float tcov=0.;
    if(tv>0.){
      ivec2 c;vec2 f;oc(14,d,vec2(0),c,f);
      float best=-1.,shd=0.;vec3 tc=vec3(0);
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){ivec2 cc=c+ivec2(x,y);uint th=hsh(cc,uSeed+70u);if(h01(th)>td)continue;
        vec2 jp=vec2(float(th&255u),float((th>>8)&255u))/255.*.5+.25;vec2 r=vec2(x,y)+jp-f;float rr=.36+.26*float((th>>16)&255u)/255.;
        float dd=length(r)/rr;if(mpp<.6)dd+=.1*N(16,d,uSeed+76u).x*smoothstep(.6,.2,mpp);
        if(dd<1.&&1.-dd>best){best=1.-dd;vec3 nn=vec3(-r/rr,sqrt(max(0.,1.-dd*dd)));float df=max(dot(nn,LS),0.);
          tc=mix(vec3(.11,.2,.08),vec3(.22,.32,.12),float((th>>24)&255u)/255.)*(.42+.85*df)*(.82+.3*tex)*(mpp<.6?.85+.3*N(16,d,uSeed+77u).x+.2*N(18,d,uSeed+78u).x:1.);}
        if(length(r+vec2(.5)*rr)<rr*.95)shd=1.;}
      if(best>=0.){tcov=tv*smoothstep(0.,.1,best);base=mix(base,tc,tcov);}else base*=1.-.45*shd*tv*step(.03,td);
    }
    // towns
    if(tw>0.){
      {
        {
          float far=smoothstep(10.,22.,mpp);
          if(far>0.)base=mix(base,vec3(.6,.56,.5)*(.88+.25*tex),tw*far*.9*smoothstep(260.,120.,mpp));
          if(far<1.){
            vec2 lm=-trl*(WM/uFq[7]);float ang=h01(hsh(tid,uSeed+83u))*3.14159,ca=cos(ang),sa=sin(ang);
            vec2 g=vec2(ca*lm.x+sa*lm.y,-sa*lm.x+ca*lm.y);
            vec2 bi=floor(g/64.),bf=g-bi*64.;
            if(length((bi+.5)*64.)+R*.35*N(10,d,uSeed+84u).x<R){
              vec3 tcol;
              float ex=min(bf.x,64.-bf.x),ey=min(bf.y,64.-bf.y),ed=min(ex,ey);
              if(ed<4.5){tcol=ed>3.7?vec3(.63,.62,.59):vec3(.25,.26,.28);
                float along=ex<ey?bf.y:bf.x;
                if(ed<.14&&fract(along/6.)<.5)tcol=mix(tcol,vec3(.9),smoothstep(.8,.3,mpp));
                if(mpp<.9&&ed<3.4){bool vx=ex<ey;float ag=vx?g.y:g.x;float rid=vx?bi.x+(bf.x>32.?1.:0.):bi.y+(bf.y>32.?1.:0.);float sd=vx?(bf.x>32.?1.:-1.):(bf.y>32.?1.:-1.);
                  float sl2=floor(ag/13.);uint ch=hsh(ivec2(int(sl2)+100000,int(rid)+4096+(vx?0:20000)),th+31u);
                  if(h01(ch)<.33&&((ch>>4)&1u)==((sd>0.)?1u:0u)){float a0=fract(ag/13.)*13.-2.;float ac=abs(ed-1.7);
                    if(a0>0.&&a0<4.4&&ac<.9){vec3 kc=CARC[int((ch>>8)%6u)];float wnd=(a0>1.1&&a0<1.9)||(a0>3.3&&a0<3.9)?.35:1.;tcol=kc*wnd*(ac>.75?.7:1.);}
                    else if(a0>.5&&a0<5.&&ac<1.1&&ed>1.7)tcol*=.6;}}}
              else{
                vec2 lf=bf-4.5;ivec2 bI=ivec2(bi)+ivec2(4096);uint bh=hsh(bI,th);
                vec2 ls=vec2(55./(2.+float(bh&1u)),55./(2.+float((bh>>1)&1u)));vec2 li=floor(lf/ls),lo=lf-li*ls;
                uint lh=hsh(bI*4+ivec2(li),th+7u);
                float ins=1.2+float(lh&3u)*.7;bool bd=((lh>>4)&7u)!=0u;
                vec2 bmin=vec2(ins),bmax=ls-ins;
                bool inB=bd&&all(greaterThan(lo,bmin))&&all(lessThan(lo,bmax));
                float hb=5.+float((lh>>8)&7u)*1.6;vec2 sw=vec2(.75)*hb;vec2 sv=vec2(ca*sw.x+sa*sw.y,-sa*sw.x+ca*sw.y);vec2 lq=lo-sv;
                bool inS=bd&&!inB&&all(greaterThan(lq,bmin))&&all(lessThan(lq,bmax));
                vec3 gard=mix(vec3(.34,.42,.22),vec3(.47,.48,.32),h01(lh));
                if(inB){vec3 rc=ROOF[int((lh>>12)%5u)];vec2 bs=bmax-bmin,bl=lo-bmin;bool ax=bs.x>bs.y;
                  float t=ax?bl.y/bs.y:bl.x/bs.x;vec2 nr=ax?vec2(0.,t<.5?-1.:1.):vec2(t<.5?-1.:1.,0.);
                  vec2 nw=vec2(ca*nr.x-sa*nr.y,sa*nr.x+ca*nr.y);bool fl=((lh>>16)&3u)==0u;
                  vec3 rn=fl?vec3(0,0,1):normalize(vec3(nw*.65,1.));
                  tcol=rc*(.42+.88*max(dot(rn,LS),0.))*(.97+.05*tex);
                  float edg=min(min(bl.x,bs.x-bl.x),min(bl.y,bs.y-bl.y));
                  if(fl){if(edg<.55)tcol=rc*1.08;}else if(edg<.3)tcol*=.75;
                  if(!fl&&abs(t-.5)<.02)tcol*=1.08;}
                else tcol=tcov>0.?base:gard*(inS?.52:1.)*(.9+.2*tex);
              }
              base=mix(base,tcol,(1.-far)*smoothstep(.0,.25,tw));
              urb=1.;
            }
          }
        }
      }
    }
    col=base*(.94+.12*tex)*uLandTint;
    float ex=1.+2.6*smoothstep(15.,400.,mpp);
    vec3 n=normalize(vec3(-sl*ex,1.));
    col*=.42+.85*max(dot(n,LS),0.);
  }else{
    float dep=-e;
    vec3 wc=mix(vec3(.28,.7,.7),vec3(.09,.45,.58),smoothstep(1.,12.,dep));
    wc=mix(wc,vec3(.04,.24,.43),smoothstep(12.,90.,dep));
    wc=mix(wc,vec3(.02,.1,.24),smoothstep(90.,900.,dep));
    vec3 n=normalize(vec3(-sl*2.,1.));wc*=mix(1.,.62+.6*max(dot(n,LS),0.),exp(-dep/18.));
    if(mpp<10.){
      vec3 a=N(13,d,uSeed+200u);vec2 wg=a.yz*.16;
      if(mpp<3.){vec3 b=N(15,d,uSeed+201u);wg+=b.yz*.09*smoothstep(3.,1.,mpp);}
      vec3 wn=normalize(vec3(-wg,1.));float vis=smoothstep(10.,3.,mpp);
      wc*=1.+(.12*(wn.x+wn.y))*vis;
      wc+=vis*1.1*pow(max(dot(wn,normalize(LS+vec3(0,0,1))),0.),140.);
    }
    if(mpp<40.){
      float fn=N(12,d,uSeed+202u).x;
      float foam=1.-smoothstep(.2,1.1+fn*.9,dep);
      float surf=pow(.5+.5*sin(dep*2.1+fn*6.),16.)*(1.-smoothstep(1.5,6.,dep));
      wc=mix(wc,vec3(.9,.94,.95),clamp(foam*.85+surf*.5,0.,1.)*smoothstep(40.,8.,mpp));
    }
    col=wc*uWaterTint;
  }
  // drones (Zum y sus impostores)
  if(mpp<8.){
    ivec2 c;vec2 f;oc(9,d,vec2(0),c,f);float cpx=1./uOS[9];
    for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){ivec2 cc=c+ivec2(x,y);if(cc==uTgtCell)continue;
      uint b0=hsh(cc,uSeed+500u);if((b0&255u)>=115u)continue;
      uint b1=hsh(cc,uSeed+501u),b2=hsh(cc,uSeed+502u);
      vec2 jp=vec2(float(b1&1023u),float((b1>>10)&1023u))/1023.*.8+.1;
      vec2 rel=(vec2(x,y)+jp-f)*cpx;
      float rm=1.2+.6*float((b2>>8)&255u)/255.,alt=2.+14.*float((b2>>16)&255u)/255.;
      drone(col,-rel,rm/mpp,vec2(.8)*alt/mpp,variant(b2),float(b1>>20)/4096.*TAU,LS);}
    if(uTgtOn>0.)drone(col,d-uTgt.xy,uTgt.z,vec2(uTgt.w),0,.35,LS);
  }
  // clouds
  float cv=uClouds*smoothstep(25.,140.,mpp);
  if(cv>0.){
    float cd=smoothstep(.08,.42,cloud(d,vec2(0))-uCloudCover),cs=smoothstep(.08,.42,cloud(d,vec2(-.0055))-uCloudCover);
    col*=1.-.38*cs*cv;
    float cl=smoothstep(.08,.42,cloud(d,vec2(.0012))-uCloudCover);
    vec3 cc=vec3(.97,.98,1.)*(1.-.18*clamp(cl-cd,0.,1.)*4.);
    col=mix(col,cc,cd*cv*.95);
  }
  col=mix(col,vec3(.6,.72,.88),.17*smoothstep(60.,700.,mpp));
  vec2 uv=gl_FragCoord.xy/uRes-.5;col*=1.-.28*dot(uv,uv);
  col=pow(max(col,0.),vec3(.94))*1.03;
  o=vec4(col,1);
}

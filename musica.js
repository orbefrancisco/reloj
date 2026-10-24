// v33 · Música para entrenar: se compone y se sintetiza EN el teléfono (Web Audio), sin archivos, y reacciona al reloj:
// completa durante la serie, baja y se apaga en el descanso, sube con redoble y ruido en sus últimos 10 s y «cae» (drop) justo
// cuando empieza la serie siguiente. La voz del reloj la baja mientras habla. Desactivada por defecto (Ajustes → Música).
// Tres estilos; cada sesión elige su progresión y su arpegio a partir de su identificador (suena distinta y es reproducible).
'use strict';
/*MOTOR-INICIO*/
const MUS_ESTILOS={
  // acordes: [raíz del bajo (MIDI), notas del acorde]; pasos en semicorcheas (0–15) dentro del compás
  elec:{n:'Electrónica 128',d:'bombo a negras, bajo a contratiempo y arpegio',bpm:128,swing:0,
    progs:[[[45,[57,60,64]],[41,[53,57,60]],[48,[52,55,60]],[43,[55,59,62]]],
           [[45,[57,60,64]],[43,[55,59,62]],[41,[53,57,60]],[40,[52,56,59]]],
           [[45,[57,60,64]],[48,[55,60,64]],[43,[55,59,62]],[41,[57,60,65]]]],
    kick:[0,4,8,12],clap:[4,12],hat:[2,6,10,14],hatS:[1,3,5,7,9,11,13,15],bass:[2,6,10,14],bass2:[0,8],
    arp:'square',arpOct:12,pad:'sawtooth',padCut:2600,bassWave:'sawtooth',bassCut:900},
  intensa:{n:'Intensa 140',d:'más rápida y oscura: bajo rodante en semicorcheas',bpm:140,swing:0,
    progs:[[[38,[62,65,69]],[34,[58,62,65]],[36,[60,64,67]],[33,[57,61,64]]],
           [[38,[62,65,69]],[39,[63,67,70]],[36,[60,63,67]],[38,[62,65,69]]],
           [[38,[62,65,69]],[36,[60,64,67]],[34,[58,62,65]],[33,[57,61,64]]]],
    kick:[0,4,8,12],clap:[4,12],hat:[2,6,10,14],hatS:[0,1,3,5,7,8,9,11,13,15],bass:[1,2,3,5,6,7,9,10,11,13,14,15],bass2:[],
    arp:'sawtooth',arpOct:12,pad:'sawtooth',padCut:3200,bassWave:'sawtooth',bassCut:1300},
  lofi:{n:'Lo-fi 90',d:'tranquila, con swing y acordes de séptima',bpm:90,swing:.17,
    progs:[[[41,[57,60,64,65]],[40,[55,59,62,64]],[38,[53,57,60,62]],[36,[52,55,59,60]]],
           [[38,[53,57,60,62]],[43,[53,55,59,62]],[36,[52,55,59,60]],[45,[55,57,60,64]]],
           [[41,[57,60,64,65]],[43,[55,59,62,65]],[40,[55,59,62,64]],[45,[55,57,60,64]]]],
    kick:[0,7,10],clap:[4,12],hat:[0,2,4,6,8,10,12,14],hatS:[],bass:[0,10],bass2:[],
    arp:null,arpOct:12,pad:'triangle',padCut:1500,bassWave:'sine',bassCut:500},
  // v33 · suspense de película: violín (con vibrato, y trémolo en la subida), cuerdas en staccato, tambores graves, tic-tac y bordón;
  // re menor con disminuidos y la nota «un semitono por encima» que deja la tensión sin resolver
  misterio:{n:'Misterio 110',d:'violín, cuerdas en staccato, tambores graves y tic-tac de suspense',bpm:110,swing:0,
    progs:[[[38,[62,65,69]],[34,[58,62,65]],[31,[55,58,62]],[33,[57,61,64]]],     // Rem Sib Solm La
           [[38,[62,65,69]],[39,[63,67,70]],[38,[62,65,69]],[37,[61,64,67]]],     // Rem Mib Rem Do#dim
           [[33,[57,60,64]],[29,[57,60,65]],[35,[59,62,65]],[28,[56,59,64]]]],    // Lam Fa Sidim Mi
    kick:[0,3,8,10],clap:[],hat:[0,2,4,6,8,10,12,14],hatS:[],bass:[],bass2:[],tambor:true,tic:true,bordon:true,
    tamAlto:[6,12,14,15],   // en la serie, un tambor más agudo entre los graves (más ritmo, sin tapar el violín)
    arp:'cuerda',arpOct:0,violin:true,pad:'sawtooth',padCut:1300,bassWave:'sawtooth',bassCut:320}};
const MUS_ARPS=[[0,1,2,1,0,2,1,2,0,1,2,3,2,1,0,1],[0,2,1,2,0,2,3,2,0,2,1,2,3,2,1,2],[0,1,2,3,2,1,0,1,0,1,2,3,3,2,1,0]];
function crearMusica(){return (()=>{   // un motor por contexto de audio (la app usa uno; las pruebas, otro sin altavoz)
  let ctx=null,master,comp,bat,bus,busF,sc,ruido=null,E=MUS_ESTILOS.elec,est='elec',vol=.6,modo='off',paso=0,proxT=0,prog=E.progs[0],arpP=MUS_ARPS[0],
    finDesc=0,riser=null,ganObj=-1,semilla='',vivo=false;
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function inicia(c){if(ctx)return;ctx=c;
    master=ctx.createGain();master.gain.value=0;comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;comp.attack.value=.005;comp.release.value=.2;
    master.connect(comp);comp.connect(ctx.destination);
    bat=ctx.createGain();bat.gain.value=1;bat.connect(master);                       // batería y efectos
    bus=ctx.createGain();bus.gain.value=1;busF=ctx.createBiquadFilter();busF.type='lowpass';busF.frequency.value=600;busF.Q.value=.7;
    sc=ctx.createGain();sc.gain.value=1;bus.connect(busF);busF.connect(sc);sc.connect(master);   // bajo y acordes, con sidechain
    const n=ctx.sampleRate*2;ruido=ctx.createBuffer(1,n,ctx.sampleRate);const d=ruido.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}
  const env=(g,t,a,v,dec,fin)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0008,t+fin);void dec};
  function bombo(t,v){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(48,t+.07);
    env(g,t,.002,v,0,.38);o.connect(g);g.connect(bat);o.start(t);o.stop(t+.4);
    sc.gain.setValueAtTime(.28,t);sc.gain.linearRampToValueAtTime(1,t+.22)}            // el bus «respira» con el bombo
  function ruidoG(t,v,dur,tipo,f,q){const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=ruido;fl.type=tipo;fl.frequency.value=f;fl.Q.value=q||.8;
    env(g,t,.002,v,0,dur);s.connect(fl);fl.connect(g);g.connect(bat);s.start(t,Math.random()*1.5);s.stop(t+dur+.02)}
  const palmada=(t,v)=>{ruidoG(t,v,.18,'bandpass',1500,1.2);ruidoG(t+.011,v*.6,.12,'bandpass',1800,1.4)};
  const charles=(t,v,ab)=>ruidoG(t,v,ab?.16:.05,'highpass',7500,.7);
  const platillo=(t,v)=>ruidoG(t,v,1.6,'highpass',5000,.5);
  function nota(t,m,dur,v,forma,dest,cut,ataque){const o=ctx.createOscillator(),g=ctx.createGain();o.type=forma;o.frequency.setValueAtTime(hz(m),t);
    let x=o;if(cut){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;o.connect(f);x=f}
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(ataque||.005));g.gain.setTargetAtTime(v*.35,t+(ataque||.005),dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);
    x.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.02)}
  // violín: dos sierras ligeramente desafinadas, vibrato que entra poco a poco, resonancia del cuerpo (~2,6 kHz) y, si trem, trémolo de arco
  function violin(t,m,dur,v,trem,ataque){const f=hz(m),g=ctx.createGain(),fl=ctx.createBiquadFilter(),pk=ctx.createBiquadFilter(),lfo=ctx.createOscillator(),lg=ctx.createGain(),tg=ctx.createGain();
    fl.type='lowpass';fl.frequency.value=4200;pk.type='peaking';pk.frequency.value=2600;pk.Q.value=1.2;pk.gain.value=6;
    lfo.frequency.value=5.6;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.006,t+Math.min(.4,dur*.5));lfo.connect(lg);lfo.start(t);lfo.stop(t+dur+.4);
    for(const d of [-5,5]){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=d;lg.connect(o.frequency);o.connect(fl);o.start(t);o.stop(t+dur+.4)}
    if(trem){const l2=ctx.createOscillator(),l2g=ctx.createGain();l2.frequency.value=11;l2g.gain.value=.45;tg.gain.value=.55;l2.connect(l2g);l2g.connect(tg.gain);l2.start(t);l2.stop(t+dur+.4)}
    const a=ataque||.15;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+Math.max(a,dur-.05));g.gain.linearRampToValueAtTime(0,t+dur+.3);
    fl.connect(pk);pk.connect(tg);tg.connect(g);g.connect(bat)}
  // cuerdas en staccato (el «tic-tic» de las bandas sonoras de suspense)
  function cuerda(t,m,dur,v){const f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=2300;
    for(const d of [-8,8]){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=d;o.connect(f);o.start(t);o.stop(t+dur+.05)}
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+dur);f.connect(g);g.connect(bat)}
  // tambor grave (tipo taiko): cuerpo que cae de tono y algo de ruido del parche; también «respira» el bus
  function tambor(t,v,alto){const o=ctx.createOscillator(),g=ctx.createGain(),f0=alto?210:115,f1=alto?120:52,d=alto?.32:.55;
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+.09);
    env(g,t,.003,v,0,d);o.connect(g);g.connect(bat);o.start(t);o.stop(t+d+.05);ruidoG(t,v*(alto?.5:.35),alto?.08:.12,'lowpass',alto?1600:900,.7);
    if(!alto){sc.gain.setValueAtTime(.4,t);sc.gain.linearRampToValueAtTime(1,t+.25)}}
  const tic=(t,v)=>ruidoG(t,v,.025,'bandpass',5200,6);
  function acorde(t,notas,dur,v){for(const m of notas)for(const d of [-6,6]){const o=ctx.createOscillator(),g=ctx.createGain();o.type=E.pad;o.frequency.value=hz(m);o.detune.value=d;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v/notas.length,t+.08);g.gain.setValueAtTime(v/notas.length,t+dur-.2);g.gain.linearRampToValueAtTime(0,t+dur);
    o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.02)}}
  // (tt: tiempo explícito del contexto de audio; solo lo usan las pruebas con OfflineAudioContext, donde el reloj no avanza)
  function subida(fin,tt){paraSubida(tt);const t=tt??ctx.currentTime,dur=Math.max(.5,fin-t),s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=ruido;s.loop=true;fl.type='bandpass';fl.Q.value=.6;fl.frequency.setValueAtTime(350,t);fl.frequency.exponentialRampToValueAtTime(7000,fin);
    // banda ancha y fuerte: tiene que oírse crecer
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,fin);g.gain.linearRampToValueAtTime(0,fin+.06);s.connect(fl);fl.connect(g);g.connect(bat);s.start(t);s.stop(fin+.1);
    busF.frequency.cancelScheduledValues(t);busF.frequency.setValueAtTime(busF.frequency.value,t);busF.frequency.exponentialRampToValueAtTime(E.padCut,fin);
    riser={s,g,fin};void dur}
  // corta la subida desde t conservando lo que suena hasta entonces (cancelScheduledValues borraría la rampa ya en curso y la dejaría muda)
  function paraSubida(tt){if(!riser)return;try{const t=tt??ctx.currentTime,G=riser.g.gain;if(G.cancelAndHoldAtTime)G.cancelAndHoldAtTime(t);else G.cancelScheduledValues(t);G.linearRampToValueAtTime(0,t+.08);riser.s.stop(t+.3)}catch(e){}riser=null}
  // un paso (semicorchea) según el modo: full (serie), medio (calentamiento, reporte, isometría), calma (descanso), build (fin del descanso)
  function programa(p,t){const s=p%16,b=Math.floor(p/16),[raiz,notas]=prog[b%prog.length],sp=60/E.bpm/4,barra=16*sp;
    const alto=[...notas].sort((a,b)=>a-b),top=alto[alto.length-1];
    if(modo==='full'||modo==='medio'){
      if(E.kick.includes(s)){if(E.tambor)tambor(t,modo==='full'?1:.7);else bombo(t,.95)}
      if(modo==='full'&&E.tamAlto&&E.tamAlto.includes(s))tambor(t,s===15?.45:.6,true);
      if(E.clap.includes(s))palmada(t,modo==='full'?.5:.35);
      if(E.hat.includes(s)){if(E.tic)tic(t,s%4===0?.22:.13);else charles(t,est==='lofi'?.18:.28,est!=='lofi'&&modo==='full')}
      if(modo==='full'&&E.hatS.includes(s))charles(t,.1,false);
      if(E.bass.includes(s))nota(t,raiz,sp*(est==='lofi'?5:1.8),.42,E.bassWave,bus,E.bassCut);
      if(modo==='full'&&E.bass2.includes(s))nota(t,raiz,sp*1.8,.3,E.bassWave,bus,E.bassCut);
      if(E.bordon&&s===0)nota(t,raiz,barra,.5,E.bassWave,bus,E.bassCut,.05);    // bordón grave sostenido
      if(s===0)acorde(t,notas,barra,modo==='full'?.32:.26);
      if(modo==='full'&&E.arp){const tonos=alto.slice(0,3);tonos.push(tonos[0]+12);const m=tonos[arpP[s]]+E.arpOct;
        if(E.arp==='cuerda')cuerda(t,m,sp*.85,s%4===0?.2:.13);else nota(t,m,sp*.9,.13,E.arp,bat,est==='intensa'?2600:3400)}
      if(modo==='full'&&est==='lofi'&&(s===2||s===10))nota(t,notas[(b+s)%notas.length]+12,sp*3,.1,'triangle',bat,1800,.01)
      // violín: frase de un compás sobre el acorde que acaba en la nota un semitono por encima (tensión sin resolver)
      if(modo==='full'&&E.violin){if(s===0)violin(t,top+12,sp*6,.2);if(s===6)violin(t,alto[1]+12,sp*2,.17,false,.06);
        if(s===8)violin(t,alto[0]+12,sp*4,.18,false,.08);if(s===12)violin(t,top+13,sp*4,.19,false,.1)}}
    else if(modo==='calma'){if(s===0)acorde(t,notas,barra,.3);if(s%4===0){if(E.tic)tic(t,.08);else charles(t,.07,false)}
      if(E.violin&&s===0)violin(t,alto[1]+12,barra,.1,false,.8);if(E.bordon&&s===0)nota(t,raiz,barra,.35,E.bassWave,bus,E.bassCut,.3)}   // violín lejano y bordón
    else if(modo==='build'){if(s===0)acorde(t,notas,barra,.32);const r=finDesc-t,div=r>6?4:r>3?2:1,cre=1-Math.max(0,r)/10;
      if(s%div===0&&r>.05){if(E.tambor)tambor(t,Math.min(.6,.25+.35*cre));else palmada(t,Math.min(.55,.18+.4*cre))}
      if(s%4===0&&r>4){if(E.tic)tic(t,.14);else charles(t,.12,false)}
      if(E.violin&&s%8===0&&r>.3)violin(t,top+12+Math.round(cre*5),Math.min(sp*8,r),.06+.1*cre,true,.05)}}   // trémolo que sube
  // modo pedido por la app (o la prueba); r = segundos que faltan del descanso
  function fija(m,r,id,tt){if(!ctx)return;const t=tt??ctx.currentTime;
    if(id&&id!==semilla){semilla=id;let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;prog=E.progs[h%E.progs.length];arpP=MUS_ARPS[(h>>>4)%MUS_ARPS.length]}   // >>> (sin signo): con >> salía un índice negativo
    if(m==='build'){finDesc=t+Math.max(0,r);if(!riser||Math.abs(riser.fin-finDesc)>.4)subida(finDesc,tt)}
    else if(riser&&m!=='full')paraSubida(tt);
    if(m===modo){if(m!=='off')vivo=true;return}
    const antes=modo;modo=m;
    if((m==='full'||m==='medio')&&(antes==='build'||antes==='calma'||antes==='off'||antes==='fin')){   // drop: el compás empieza AHORA
      paraSubida(tt);paso=0;proxT=t+.03;if(antes==='build')platillo(proxT,.35);vivo=true}
    if(m==='off'||m==='fin'){paraSubida(tt);if(m==='fin'){const [,n]=prog[0];acorde(t+.05,n,2.4,.3);platillo(t+.05,.25)}}
    if(m==='calma')busF.frequency.setTargetAtTime(520,t,.6);
    else if(m==='full')busF.frequency.setTargetAtTime(E.padCut,t,.05);
    else if(m==='medio')busF.frequency.setTargetAtTime(Math.min(E.padCut,1700),t,.2);
    if(m!=='off')vivo=true}
  // planificador: pocos pasos por delante (más con la pantalla oculta, donde el navegador espacia los temporizadores)
  function ciclo(tt,hasta){if(!ctx||!vivo)return;const t=tt??ctx.currentTime,sp=60/E.bpm/4,la=hasta!=null?hasta-t:document.hidden?1.6:.16;
    const g=modo==='off'||modo==='fin'?0:vol*.42*(modo==='calma'?.6:modo==='build'?.9:1)*(window.speechSynthesis&&speechSynthesis.speaking?.3:1);
    if(Math.abs(g-ganObj)>.001){ganObj=g;master.gain.cancelScheduledValues(t);master.gain.setTargetAtTime(g,t,modo==='fin'?1.2:.08)}
    if(modo==='off'||modo==='fin'){if(t>proxT+3)vivo=false;return}
    if(hasta==null&&proxT<t-.2)proxT=t+.03;   // tras una pausa del navegador, se retoma sin acumular
    while(proxT<t+la){programa(paso,proxT);const imp=paso%2===1;paso++;proxT+=sp*(E.swing?(imp?1-E.swing:1+E.swing):1)}}
  return {inicia,fija,ciclo,estilo:e=>{if(MUS_ESTILOS[e]&&e!==est){est=e;E=MUS_ESTILOS[e];semilla='';prog=E.progs[0]}},vol:v=>{vol=Math.max(0,Math.min(1,v));ganObj=-1},
    get modo(){return modo},get activo(){return !!ctx}}})()}
const MUSICA=crearMusica();
/*MOTOR-FIN*/

/* ---------- en el reloj: qué toca según el estado de la sesión ---------- */
const musCfg=()=>({on:false,estilo:'elec',vol:.6,...(CFG.musica||{})});
let musPrueba=null;   // prueba desde Ajustes: [{modo, hasta, r}] con tiempos del reloj de audio
function musModo(){
  if(musPrueba){const t=audio.currentTime,x=musPrueba.find(p=>t<p.hasta);if(!x){musPrueba=null;return ['off',0]}return [x.m,x.m==='build'?x.hasta-t:0]}
  if(!musCfg().on)return ['off',0];
  if(S.st==='idle')return ['off',0];
  if(S.st==='done')return ['fin',0];
  if(S.st==='work')return [S.phase==='hold'||S.phase==='vac'?'medio':'full',0];
  if(S.st==='cal'||S.st==='report')return ['medio',0];
  if(['rest','shift','trans'].includes(S.st)){const r=S.restDur-(now()-S.t0);return r<=Math.min(10,S.restDur*.6)?['build',r]:['calma',r]}
  return ['off',0]}
setInterval(()=>{if(!audio||(!musCfg().on&&!musPrueba&&!MUSICA.activo))return;if(!musCfg().on&&!musPrueba&&MUSICA.modo==='off'){MUSICA.ciclo();return}
  try{MUSICA.inicia(audio);MUSICA.estilo(musCfg().estilo);MUSICA.vol(musCfg().vol);const [m,r]=musModo();MUSICA.fija(m,r,S.id||'reposo');MUSICA.ciclo()}catch(e){}},50);
// Ajustes → Música para entrenar
function renderMusica(){const el=$('cMus');if(!el)return;const c=musCfg();
  el.innerHTML=`<div class="tog"><button type="button" data-mus="on" aria-pressed="${c.on}">Música: ${c.on?'sí':'no'}</button><button type="button" data-mus="probar">${musPrueba?'Probando…':'Probar 30 s'}</button></div>
    <div class="tog" role="group" aria-label="Estilo">${Object.entries(MUS_ESTILOS).map(([k,e])=>`<button type="button" data-musest="${k}" aria-pressed="${c.estilo===k}">${esc(e.n)}</button>`).join('')}</div>
    <p class="hint">${esc(MUS_ESTILOS[c.estilo].d)}.</p>
    <label class="musv"><span class="lbl">Volumen de la música</span><input type="range" min="0" max="100" step="5" value="${Math.round(c.vol*100)}" data-musvol="1" aria-label="Volumen de la música"></label>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-mus],[data-musest]');if(!b)return;const c=musCfg();
  if(b.dataset.musest){CFG.musica={...c,estilo:b.dataset.musest};guardarCfg();renderMusica();return}
  if(b.dataset.mus==='on'){CFG.musica={...c,on:!c.on};guardarCfg();renderMusica();return}
  if(b.dataset.mus==='probar'){activarAudio();if(!audio)return;MUSICA.inicia(audio);const t=audio.currentTime;
    // una serie (8 s), su descanso (calma 6 s y subida de 8 s) y el drop de la serie siguiente (8 s)
    musPrueba=[{m:'full',hasta:t+8},{m:'calma',hasta:t+14},{m:'build',hasta:t+22},{m:'full',hasta:t+30}];renderMusica();setTimeout(renderMusica,30500)}});
document.addEventListener('input',e=>{const s=e.target;if(!s.matches||!s.matches('[data-musvol]'))return;CFG.musica={...musCfg(),vol:(+s.value)/100};MUSICA.vol(CFG.musica.vol);
  clearTimeout(renderMusica.t);renderMusica.t=setTimeout(guardarCfg,300)});
renderMusica();

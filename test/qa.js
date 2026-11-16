/* Exploration qualité : clique chaque bouton de chaque écran, en patron puis en vendeur,
   valide chaque formulaire avec ses valeurs proposées, descend d'un niveau dans les panneaux,
   et vérifie après chaque action :
   - aucune erreur JavaScript ;
   - aucun texte cassé à l'écran (undefined, NaN, [object, date invalide) ;
   - les règles des données (stock jamais négatif, rien payé au-delà du dû, numéros de ticket et
     de facture uniques et continus, dates valides, vendeur sans prix d'achat à l'écran).
   Sans compte : tout se passe dans le téléphone, sur le magasin d'exemple.

     node test/qa.js            # tout
     node test/qa.js vendeur    # le mode vendeur seulement */
const path=require('path');
const {chromium}=require('playwright');
const ONLY=process.argv[2];
const TABS=['accueil','reglages','vente','tickets','stock','catalogue','fournisseurs','analyse','inventaire','credit','demandes','livraisons','garantie','journal','factures'];
/* outside the app (camera, files, network, account) or wiping everything: covered elsewhere */
const SKIP=new Set(['clear','reseed','logo','pic','pick','scan','fiche','go-online','login','signup','logout','sync-now','team','team-add','team-rm','open-shop','print','copy','copy-scan']);
const BAD=/undefined|NaN|\[object |Invalid Date|null DH/;
const isDay=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'');

function invariants(s,role){const p=[];
  if(!s)return [];
  s.stock.forEach(r=>{if(r.qty<0)p.push('stock négatif : '+r.name);if(!(r.price>0))p.push('prix de vente nul : '+r.name)});
  s.credits.forEach(c=>{if(c.paid>c.total)p.push('crédit payé au-delà du dû : '+c.name);if(c.paid<0)p.push('crédit négatif')});
  s.buys.forEach(b=>{if(b.paid>b.amount)p.push('achat payé au-delà du dû : '+b.label);if(!isDay(b.d))p.push('date de réception invalide : '+b.d)});
  s.ops.forEach(o=>{if(!isDay(o.d))p.push('date au journal invalide : '+o.d);if(typeof o.amt!=='number'||Number.isNaN(o.amt))p.push('montant au journal invalide')});
  const nos=s.tickets.map(t=>t.no);if(new Set(nos).size!==nos.length)p.push('numéro de ticket en double');
  const seq=l=>l.map(x=>+x.no.split('-').pop()).sort((a,b)=>a-b).every((n,i)=>n===i+1);
  if(!seq(s.tickets))p.push('numérotation des tickets avec un trou');
  if(!seq(s.invoices.filter(f=>f.type!=='avoir')))p.push('numérotation des factures avec un trou');
  if(!seq(s.invoices.filter(f=>f.type==='avoir')))p.push('numérotation des avoirs avec un trou');
  s.units.forEach(u=>{if(!['stock','vendu','atelier','manquant'].includes(u.status))p.push('unité dans un état inconnu : '+u.status);
    if(u.status==='vendu'&&!s.tickets.some(t=>t.no===u.ticket))p.push('unité vendue sans ticket : '+u.serial)});
  s.tickets.forEach(t=>t.lines.forEach(l=>{if(!s.stock.some(r=>r.id===l.ref)&&t.status==='ok')p.push('ticket '+t.no+' : article disparu')}));
  return p}

(async()=>{
  let browser;
  try{browser=await chromium.launch({args:['--no-sandbox']})}catch(e){console.log('NO_BROWSER');process.exit(0)}
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  let errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.dismiss());
  const findings=new Map();let actions=0;
  const note=(where,what)=>{const k=what;if(!findings.has(k))findings.set(k,new Set());findings.get(k).add(where)};
  const URL='file://'+path.resolve(__dirname,'..','index.html');

  async function fresh(role,tab){
    await page.goto(URL+'#reglages');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(100);
    if(role==='vendeur'){await page.click('[data-act="to-seller"]');await page.waitForTimeout(80)}
    await page.evaluate(t=>{location.hash='#'+t},tab);await page.waitForTimeout(150);
    errs=[]}
  async function check(role,where){actions++;
    const txt=await page.evaluate(()=>(document.querySelector('#view').innerText||'')+' '+(document.querySelector('#sheet').hidden?'':document.querySelector('#sheet').innerText));
    const m=BAD.exec(txt);if(m)note(where,'texte cassé à l’écran : « '+txt.slice(Math.max(0,m.index-40),m.index+30).replace(/\s+/g,' ')+' »');
    errs.forEach(e=>note(where,'erreur JavaScript : '+e));errs=[];
    const s=await page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('daftar-v3'))}catch(e){return null}});
    invariants(s,role).forEach(p=>note(where,p));
    if(role==='vendeur'&&/achat \d|marge/i.test(txt))note(where,'prix d’achat ou marge visible en mode vendeur')}
  /* the buttons reachable now, as [selector-index, act, id] */
  const buttons=scope=>page.evaluate(sc=>[...document.querySelectorAll(sc+' [data-act]')].filter(b=>b.offsetParent!==null).map((b,i)=>({i,act:b.dataset.act,id:b.dataset.id||'',t:(b.textContent||'').trim().slice(0,30)})),scope);
  async function press(scope,b){const els=await page.$$(scope+' [data-act]');const vis=[];for(const e of els)if(await e.isVisible())vis.push(e);
    const el=vis[b.i];if(!el)return false;try{await el.click({timeout:2000})}catch(e){return false}await page.waitForTimeout(120);return true}
  async function submitIfForm(role,where){
    const isForm=await page.evaluate(()=>!document.querySelector('#sheet').hidden&&!!document.querySelector('#form button[type=submit]'));
    if(!isForm)return;
    /* fill required empty fields with a plausible value, as a user would */
    await page.evaluate(()=>{document.querySelectorAll('#form input[required]').forEach(i=>{if(i.value)return;
      i.value=i.type==='number'?'100':i.type==='tel'?'0612345678':i.type==='date'?new Date().toISOString().slice(0,10):'Essai'})});
    await page.click('#form button[type=submit]').catch(()=>{});await page.waitForTimeout(150);
    await check(role,where+' › valider');
    const err=await page.evaluate(()=>{const e=document.querySelector('#err');return e&&!e.hidden?e.textContent:''});
    if(err)note(where+' › valider','(information) formulaire refusé avec les valeurs proposées : « '+err+' »')}

  for(const role of ['patron','vendeur']){if(ONLY&&ONLY!==role)continue;
    for(const tab of TABS){
      await fresh(role,tab);
      const cur=await page.evaluate(()=>location.hash.slice(1));if(cur!==tab&&role==='vendeur')continue;
      /* without a PIN, going back to boss mode is open by design: the local lock is only a display lock */
      const top=(await buttons('#view')).filter(b=>!SKIP.has(b.act)&&!(role==='vendeur'&&b.act==='to-boss'));const done=new Set();
      /* each kind of button on at most two examples (two articles, two tickets…) */
      const seen=new Map();
      for(const b of top){const n=seen.get(b.act)||0;if(n>=2)continue;seen.set(b.act,n+1);
        await fresh(role,tab);const where=role+' · '+tab+' · '+b.act+(b.t?' « '+b.t+' »':'');
        if(!await press('#view',b))continue;await check(role,where);await submitIfForm(role,where);
        /* one level down, inside the sheet that opened */
        const sub=(await buttons('#sheet')).filter(x=>!SKIP.has(x.act)&&x.act!=='close');
        const seen2=new Set();
        for(const c of sub){if(seen2.has(c.act)||done.has(b.act+'>'+c.act))continue;seen2.add(c.act);done.add(b.act+'>'+c.act);
          await fresh(role,tab);if(!await press('#view',b))continue;
          const w2=where+' › '+c.act+(c.t?' « '+c.t+' »':'');
          if(!await press('#sheet',c))continue;await check(role,w2);await submitIfForm(role,w2)}}
      process.stdout.write('.')}}
  console.log('\n'+actions+' actions vérifiées.');
  const real=[...findings].filter(([k])=>!k.startsWith('(information)')),info=[...findings].filter(([k])=>k.startsWith('(information)'));
  for(const [k,w] of real)console.log('\nPROBLÈME '+k+'\n   où : '+[...w].slice(0,4).join('\n        ')+(w.size>4?'\n        … et '+(w.size-4)+' autres':''));
  if(process.env.QA_INFO)for(const [k,w] of info)console.log('\n'+k+'\n   où : '+[...w].slice(0,2).join(' | '));
  console.log('\n'+(real.length?real.length+' problème(s).':'Aucun problème trouvé.')+(info.length?' '+info.length+' formulaire(s) refusé(s) avec les valeurs proposées (QA_INFO=1 pour les voir).':''));
  await browser.close();process.exit(real.length?1:0)})();

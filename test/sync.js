/* Test de bout en bout de la synchronisation, contre la vraie base Supabase.
   Trois téléphones simulés : le patron (A), le vendeur (B), un nouveau téléphone du patron (C).

   Il faut deux comptes déjà confirmés et sans magasin :
     DAFTAR_TEST_PATRON=adresse  DAFTAR_TEST_VENDEUR=adresse  DAFTAR_TEST_MDP=motdepasse  node test/sync.js
   Sans ces variables, le script le dit et sort sans échouer.
   Le magasin créé par le test reste en ligne : à supprimer ensuite depuis Supabase. */
const http=require('http'),fs=require('fs'),path=require('path');
const P=process.env.DAFTAR_TEST_PATRON,V=process.env.DAFTAR_TEST_VENDEUR,PW=process.env.DAFTAR_TEST_MDP;
if(!P||!V||!PW){console.log('SANS_COMPTES : définir DAFTAR_TEST_PATRON, DAFTAR_TEST_VENDEUR et DAFTAR_TEST_MDP.');process.exit(0)}
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]).replace(/\/$/,'/index.html'));
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}
  r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
let fails=0;const ok=(cond,msg)=>{console.log((cond?'OK   ':'ÉCHEC ')+msg);if(!cond)fails++};

(async()=>{
  await new Promise(res=>server.listen(0,res));const URL='http://localhost:'+server.address().port+'/';
  let browser;
  try{browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']})}
  catch(e){try{browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']})}catch(e2){console.log('NO_BROWSER');server.close();process.exit(0)}}
  const errors=[];
  async function phone(name){const ctx=await browser.newContext(),page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(name+' pageerror: '+e.message));
    page.on('dialog',d=>d.dismiss());
    await page.goto(URL+'#reglages');await page.waitForTimeout(400);return {ctx,page,name}}
  const state=p=>p.page.evaluate(()=>JSON.parse(localStorage.getItem('daftar-v3')));
  const sheetText=p=>p.page.evaluate(()=>document.querySelector('#sheet').hidden?'':document.querySelector('#sheet').textContent);
  async function click(p,act,id){const sel='[data-act="'+act+'"]'+(id?'[data-id="'+id+'"]':'');
    await p.page.waitForSelector(sel,{timeout:15000});await p.page.click(sel)}
  async function login(p,email){await click(p,'login');await p.page.fill('#f-email',email);await p.page.fill('#f-pw',PW);
    await p.page.click('#form button[type=submit]');await p.page.waitForFunction(e=>document.body.textContent.includes(e),email,{timeout:15000})}
  async function synced(p){await p.page.evaluate(()=>{location.hash='#reglages'});
    await p.page.waitForSelector('#sync-st');await p.page.evaluate(()=>{document.querySelector('#sync-st').textContent='…'});await click(p,'sync-now');
    await p.page.waitForFunction(()=>/À jour/.test((document.querySelector('#sync-st')||{}).textContent||''),null,{timeout:20000})
      .catch(async e=>{console.log('   état '+p.name+' : '+await p.page.evaluate(()=>document.querySelector('#view').textContent.slice(0,400)));throw e})}
  /* the till: open the article's category, touch the article, open the cart, cash in */
  async function sell(p,ref,name){await p.page.evaluate(()=>{location.hash='#vente'});
    const k=await p.page.evaluate(id=>(JSON.parse(localStorage.getItem('daftar-v3')).stock.find(r=>r.id===id)||{}).kind,ref);
    await click(p,'vcat',k);await click(p,'add-cart',ref);await p.page.click('.pos-cart');await click(p,'checkout');
    await p.page.fill('#f-name',name);await p.page.click('#form button[type=submit]');await p.page.waitForTimeout(300);await click(p,'close')}
  const hasCost=s=>s.stock.some(r=>'cost' in r)||s.units.some(u=>'cost' in u);

  try{
    /* A : le patron met le magasin d'exemple en ligne et ajoute son vendeur */
    const A=await phone('A');await login(A,P);
    await click(A,'go-online');
    if(await A.page.evaluate(()=>/confirmer/i.test((document.querySelector('[data-act="go-online"]')||{}).textContent||'')))await click(A,'go-online');
    await A.page.waitForFunction(()=>/est en ligne/.test(document.querySelector('#sheet').textContent),null,{timeout:30000});
    ok(true,'A : magasin mis en ligne');await click(A,'close');
    await click(A,'team');await click(A,'team-add');await A.page.fill('#f-email',V);await A.page.selectOption('#f-role','vendeur');
    await A.page.click('#form button[type=submit]');
    await A.page.waitForFunction(v=>document.querySelector('#sheet').textContent.includes(v),V,{timeout:15000});
    ok(/Vendeur/.test(await sheetText(A)),'A : le vendeur apparaît dans l’équipe');await click(A,'close');
    const a0=await state(A);

    /* B : le vendeur ouvre le magasin sur son téléphone */
    const B=await phone('B');await login(B,V);
    await B.page.waitForSelector('[data-act="open-shop"]',{timeout:15000});await B.page.locator('[data-act="open-shop"]').last().click();
    await B.page.waitForFunction(()=>/À jour/.test((document.querySelector('#sync-st')||{}).textContent||''),null,{timeout:30000});
    const b0=await state(B);
    ok(b0.stock.length===a0.stock.length&&b0.tickets.length===a0.tickets.length,'B : même stock et mêmes tickets que A ('+b0.stock.length+' articles, '+b0.tickets.length+' tickets)');
    ok(!hasCost(b0),'B : aucun prix d’achat reçu par le vendeur');
    ok(b0.ops.length===0&&b0.buys.length===0&&b0.pays.length===0,'B : ni journal, ni achats, ni paiements fournisseurs reçus');
    ok(b0.role==='vendeur','B : le téléphone est en mode vendeur');
    ok(!(await B.page.textContent('#nav')).includes('Compta'),'B : pas d’onglet Compta');

    /* B vend une trottinette ; A la voit, avec son coût calculé chez le patron */
    await sell(B,'a2','Karim test');await synced(B);
    await synced(A);const a1=await state(A);
    const t=a1.tickets.find(x=>x.name==='Karim test');
    ok(!!t,'A : la vente du vendeur est arrivée ('+(t&&t.no)+')');
    ok(t&&t.cost>0,'A : son coût a été calculé sur le téléphone du patron ('+(t&&t.cost)+' DH)');
    ok(a1.ops.some(o=>o.ticket===(t&&t.no)),'A : l’encaissement est au journal');

    /* deux ventes hors ligne avec le même numéro : la seconde est renumérotée */
    await B.ctx.setOffline(true);await sell(B,'p1','Hors ligne B');
    await sell(A,'p2','En ligne A');await synced(A);
    await B.ctx.setOffline(false);await synced(B);await synced(B);await synced(A);
    const a2=await state(A),b2=await state(B);
    const nos=a2.tickets.map(x=>x.no);
    ok(new Set(nos).size===nos.length,'A : aucun numéro de ticket en double ('+nos.slice(-3).join(', ')+')');
    const tb=a2.tickets.find(x=>x.name==='Hors ligne B'),ta=a2.tickets.find(x=>x.name==='En ligne A');
    ok(tb&&ta&&tb.no!==ta.no,'A : la vente hors ligne de B a pris le numéro suivant ('+(ta&&ta.no)+' puis '+(tb&&tb.no)+')');
    ok(b2.tickets.find(x=>x.name==='Hors ligne B').no===(tb&&tb.no),'B : il voit le même nouveau numéro');
    ok(!hasCost(b2),'B : toujours aucun prix d’achat chez le vendeur');

    /* C : le patron perd son téléphone et se reconnecte sur un autre */
    const C=await phone('C');await login(C,P);
    await C.page.waitForSelector('[data-act="open-shop"]',{timeout:15000});await C.page.locator('[data-act="open-shop"]').last().click();
    await C.page.waitForFunction(()=>/À jour/.test((document.querySelector('#sync-st')||{}).textContent||''),null,{timeout:30000});
    await synced(A);const a3=await state(A),c3=await state(C);
    const same=k=>JSON.stringify(a3[k].map(x=>x.id).sort())===JSON.stringify(c3[k].map(x=>x.id).sort());
    ok(['stock','units','tickets','invoices','credits','ops','buys','sups'].every(same),'C : nouveau téléphone, tout est revenu (tickets, stock, journal, achats, factures)');
    ok(hasCost(c3),'C : le patron retrouve ses prix d’achat');
    const q=s=>s.units.filter(u=>u.status==='stock').length;
    ok(q(a3)===q(c3)&&q(c3)===q(await state(B)),'A, B, C : même nombre de trottinettes en stock ('+q(c3)+')');
  }catch(e){ok(false,'exception : '+e.message.split('\n')[0]);console.log(e.stack.split('\n').slice(0,4).join('\n'))}
  ok(errors.length===0,'aucune erreur de page'+(errors.length?' : '+errors.join(' | '):''));
  await browser.close();server.close();
  console.log(fails?fails+' échec(s)':'Tout est bon.');process.exit(fails?1:0)})();

/* Test de bout en bout : réception par photo du bon d'achat, lu par l'IA.
   Contre la vraie base et le vrai service d'analyse : chaque passage coûte environ 0,4 DH.

     DAFTAR_TEST_PATRON=adresse DAFTAR_TEST_MDP=motdepasse DAFTAR_TEST_BON=chemin/bon.jpg node test/bon.js

   Le bon doit venir d'un fournisseur absent du magasin d'exemple, pour un article absent aussi.
   Masquez les coordonnées du client avant de l'utiliser. Le magasin créé reste en ligne : à
   supprimer ensuite depuis Supabase. */
const http=require('http'),fs=require('fs'),path=require('path');
const P=process.env.DAFTAR_TEST_PATRON,PW=process.env.DAFTAR_TEST_MDP,IMG=process.env.DAFTAR_TEST_BON;
if(!P||!PW||!IMG){console.log('SANS_COMPTES : définir DAFTAR_TEST_PATRON, DAFTAR_TEST_MDP et DAFTAR_TEST_BON.');process.exit(0)}
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const server=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]).replace(/\/$/,'/index.html'));
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}
  r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});fs.createReadStream(f).pipe(r)});
let fails=0;const ok=(c,m)=>{console.log((c?'OK   ':'ÉCHEC ')+m);if(!c)fails++};

(async()=>{
  await new Promise(res=>server.listen(0,res));const URL='http://localhost:'+server.address().port+'/';
  const browser=await chromium.launch({args:['--no-sandbox']});
  const page=await (await browser.newContext()).newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const click=async(act,id,scope)=>{const s=(scope?scope+' ':'')+'[data-act="'+act+'"]'+(id!==undefined&&id!==''?'[data-id="'+id+'"]':'');await page.waitForSelector(s,{timeout:15000});await page.click(s)};
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('daftar-v3')));
  const sheet=()=>page.evaluate(()=>document.querySelector('#sheet').textContent);
  const submit=async()=>{await page.click('#form button[type=submit]');await page.waitForTimeout(300)};
  const readIt=async()=>{await page.evaluate(()=>{location.hash='#stock'});await click('new-recv');
    const [ch]=await Promise.all([page.waitForEvent('filechooser'),click('bon','cam','#sheet')]);const t0=Date.now();await ch.setFiles(IMG);
    await page.waitForFunction(()=>/Bon d’achat lu|Lecture impossible|Bon illisible/.test(document.querySelector('#sheet').textContent),null,{timeout:60000});
    return ((Date.now()-t0)/1000).toFixed(1)};
  try{
    await page.goto(URL+'#reglages');await page.waitForTimeout(400);
    await click('login');await page.fill('#f-email',P);await page.fill('#f-pw',PW);await submit();
    await page.waitForSelector('[data-act="go-online"]',{timeout:15000});await click('go-online');
    if(await page.evaluate(()=>/confirmer/i.test((document.querySelector('[data-act="go-online"]')||{}).textContent||'')))await click('go-online');
    await page.waitForFunction(()=>/est en ligne/.test(document.querySelector('#sheet').textContent),null,{timeout:30000});await click('close','','#sheet');
    const before=await state();

    /* 1. le bon devient un résumé : fournisseur, date, lignes */
    const secs=await readIt();const t=await sheet();
    ok(/Bon d’achat lu/.test(t),'bon lu par l’IA en '+secs+' s');
    console.log('     '+t.replace(/\s+/g,' ').slice(0,260));
    ok(/Nouveau fournisseur/.test(t),'fournisseur inconnu du magasin signalé comme nouveau');

    /* 2. première ligne : fournisseur créé d'après le bon, puis l'article, puis la réception */
    await click('bon-ligne','0','#sheet');
    const sup=await page.evaluate(()=>({n:document.querySelector('#f-name').value,p:document.querySelector('#f-phone').value,c:document.querySelector('#f-city').value}));
    ok(sup.n&&sup.p,'fiche fournisseur pré-remplie : '+sup.n+' · '+sup.p+' · '+sup.c);await submit();
    ok(/Nouvel article/.test(await page.textContent('#form h2')),'fiche du nouvel article ouverte ensuite');
    const art=await page.evaluate(()=>document.querySelector('#f-name').value);ok(!!art,'modèle pré-rempli : '+art);
    await page.fill('#f-price','6500');await submit();
    const rv=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#form input,#form select')].map(i=>[i.name,i.value])));
    ok(/réception/i.test(await page.textContent('#form h2')),'réception pré-remplie : '+rv.qty+' × '+rv.cost+' DH, '+rv.etat+', le '+rv.d);
    await submit();
    const s1=await state(),b=s1.buys[s1.buys.length-1],f=s1.sups.find(x=>x.name===sup.n),r=s1.stock.find(x=>x.name===art);
    ok(!!f&&!!r,'fournisseur et article créés');
    ok(b&&b.sup===f.id&&b.ref===r.id,'la réception porte le fournisseur du bon');
    ok(b&&b.bon&&b.d===rv.d,'la réception garde le numéro du bon ('+(b&&b.bon)+') et sa date ('+(b&&b.d)+')');
    ok(r&&r.sup===f.id,'le fournisseur devient le fournisseur habituel de l’article');
    const op=s1.ops.find(o=>o.d===b.d&&o.amt===-b.amount);
    ok(b.paid===b.amount?!!op:!op,b.paid===b.amount?'payé : la sortie d’argent est au journal à la date du bon':'à payer : rien au journal avant le paiement');

    /* 3. le même bon relu : rien ne se reçoit deux fois */
    await click('close','','#sheet');await readIt();
    ok(/Reçu/.test(await sheet())&&!(await page.$('#sheet [data-act="bon-ligne"]')),'bon relu : la ligne est déjà marquée « Reçu »');
    ok((await state()).buys.length===s1.buys.length,'aucune réception en double');

    /* 4. rien du client n'est gardé, et le serveur accepte tout */
    const all=JSON.stringify(await state());
    ok(!/KB\d{5}|DINAR|0673/i.test(all),'aucune donnée du client enregistrée');
    await click('close','','#sheet');await page.evaluate(()=>{location.hash='#reglages'});
    await page.waitForSelector('#sync-st');await page.evaluate(()=>{document.querySelector('#sync-st').textContent='…'});await click('sync-now');
    await page.waitForFunction(()=>/À jour/.test(document.querySelector('#sync-st').textContent),null,{timeout:30000});
    ok(!/existait déjà|Choisissez|refus|Erreur/i.test(await page.textContent('#view')),'synchronisé, rien de refusé par le serveur');
    ok(before.sups.length+1===s1.sups.length,'un seul fournisseur ajouté');
  }catch(e){ok(false,'exception : '+e.message.split('\n')[0])}
  ok(!errors.length,'aucune erreur de page'+(errors.length?' : '+errors.join(' | '):''));
  await browser.close();server.close();console.log(fails?fails+' échec(s)':'Tout est bon.');process.exit(fails?1:0)})();

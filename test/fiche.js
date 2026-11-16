/* Test de bout en bout : nouvel article par photo de la fiche, lue par l'IA, puis réception.
   Contre la vraie base et le vrai service d'analyse : chaque passage coûte environ un centime.

     DAFTAR_TEST_PATRON=adresse DAFTAR_TEST_MDP=motdepasse DAFTAR_TEST_FICHE=chemin/photo.jpg node test/fiche.js

   La photo doit montrer une fiche technique lisible. Sans ces variables, le script le dit et sort.
   Le magasin créé par le test reste en ligne : à supprimer ensuite depuis Supabase. */
const http=require('http'),fs=require('fs'),path=require('path');
const P=process.env.DAFTAR_TEST_PATRON,PW=process.env.DAFTAR_TEST_MDP,IMG=process.env.DAFTAR_TEST_FICHE;
if(!P||!PW||!IMG){console.log('SANS_COMPTES : définir DAFTAR_TEST_PATRON, DAFTAR_TEST_MDP et DAFTAR_TEST_FICHE.');process.exit(0)}
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
  const click=async(act,id,scope)=>{const s=(scope?scope+' ':'')+'[data-act="'+act+'"]'+(id?'[data-id="'+id+'"]':'');await page.waitForSelector(s,{timeout:15000});await page.click(s)};
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('daftar-v3')));
  const sheet=()=>page.evaluate(()=>document.querySelector('#sheet').textContent);
  try{
    await page.goto(URL+'#reglages');await page.waitForTimeout(400);
    await click('login');await page.fill('#f-email',P);await page.fill('#f-pw',PW);await page.click('#form button[type=submit]');
    await page.waitForSelector('[data-act="go-online"]',{timeout:15000});await click('go-online');
    if(await page.evaluate(()=>/confirmer/i.test((document.querySelector('[data-act="go-online"]')||{}).textContent||'')))await click('go-online');
    await page.waitForFunction(()=>/est en ligne/.test(document.querySelector('#sheet').textContent),null,{timeout:30000});await click('close');

    /* 1. la photo de la fiche devient une fiche pré-remplie */
    await page.evaluate(()=>{location.hash='#stock'});await click('add-stock');
    const [chooser]=await Promise.all([page.waitForEvent('filechooser'),click('fiche','cam')]);
    const t0=Date.now();await chooser.setFiles(IMG);
    await page.waitForFunction(()=>/Vérifiez la fiche|Lecture impossible|Fiche illisible|Déjà dans/.test(document.querySelector('#sheet').textContent),null,{timeout:60000});
    const secs=((Date.now()-t0)/1000).toFixed(1);
    ok(/Vérifiez la fiche/.test(await sheet()),'fiche lue par l’IA en '+secs+' s');
    const v=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#form input,#form select')].map(i=>[i.name,i.value])));
    console.log('     lu : '+[v.brand,v.name,v.ref,v.moteur,v.batterie,v.autonomie,v.vitesse].join(' · '));
    ok(v.name&&v.moteur&&v.batterie,'modèle, moteur et batterie remplis');
    ok(v.sup==='','fournisseur habituel laissé libre à la création');

    /* 2. le prix est demandé, puis l'article est créé avec sa photo et sa source */
    await page.click('#form button[type=submit]');
    ok(await page.evaluate(()=>document.querySelector('#f-price').validity.valueMissing&&!document.querySelector('#sheet').hidden),'sans prix de vente, l’enregistrement est refusé');
    await page.fill('#f-price','9900');await page.click('#form button[type=submit]');await page.waitForTimeout(400);
    const s1=await state(),r=s1.stock.find(x=>x.name===v.name);
    ok(!!r,'article créé : '+(r&&((r.brand?r.brand+' ':'')+r.name)));
    ok(r&&r.src&&r.src.type==='ia'&&r.src.img.startsWith('data:image/jpeg'),'la photo de la fiche est gardée avec l’article');
    ok(r&&Object.keys(r.spec||{}).length>=4,'fiche technique : '+(r?Object.keys(r.spec).length:0)+' caractéristiques');
    console.log('     photo du produit découpée : '+(r&&r.img?'oui':'non'));
    ok(/à renseigner/.test(await sheet()),'la fiche affiche « Fournisseur habituel : à renseigner »');

    /* 3. pas de réception sans fournisseur */
    await page.evaluate(id=>{document.querySelector('[data-act="art-tab"][data-t="stock"]').click()},r.id);
    await click('recv',r.id,'#sheet');await page.fill('#f-qty','2');
    await page.selectOption('#f-sup','');await page.click('#form button[type=submit]');
    ok(/fournisseur/i.test(await page.textContent('#err')),'réception sans fournisseur refusée');
    const opts=await page.evaluate(()=>[...document.querySelectorAll('#f-sup option')].map(o=>o.value));
    ok(opts.includes('initial'),'« Stock déjà en magasin » proposé pour un article jamais reçu');
    const supId=opts.find(x=>x&&x!=='initial'&&x!=='new');
    await page.selectOption('#f-sup',supId);await page.fill('#f-cost','8000');await page.selectOption('#f-etat','du');
    await page.click('#form button[type=submit]');await page.waitForTimeout(400);
    const s2=await state(),b=s2.buys.filter(x=>x.ref===r.id).at(-1)||{};
    ok(s2.units.filter(u=>u.ref===r.id).length===2,'réception acceptée avec un fournisseur : 2 unités en stock');
    ok(b.sup===supId&&/^\d{4}-\d{2}-\d{2}$/.test(b.d),'la réception garde son fournisseur ('+b.sup+') et sa date ('+b.d+')');
    ok(b.paid===0&&b.amount===16000,'« À payer plus tard » respecté : 16 000 DH dus au fournisseur');
    await click('close','','#sheet');await page.evaluate(id=>showArt(id,'stock'),r.id);await click('recv',r.id,'#sheet');
    const o2=await page.evaluate(()=>[...document.querySelectorAll('#f-sup option')].map(o=>o.value));
    ok(!o2.includes('initial'),'après un fournisseur, le stock de départ n’est plus proposé');
    ok(await page.inputValue('#f-sup')===supId,'le fournisseur de la dernière réception est pré-rempli');

    /* 4. le serveur accepte l'article lu par l'IA, sa photo et la réception */
    await click('close','','#sheet');await page.evaluate(()=>{location.hash='#reglages'});
    await page.waitForSelector('#sync-st');await page.evaluate(()=>{document.querySelector('#sync-st').textContent='…'});await click('sync-now');
    await page.waitForFunction(()=>/À jour/.test(document.querySelector('#sync-st').textContent),null,{timeout:30000});
    const view=await page.textContent('#view');
    ok(!/existait déjà|Choisissez|refus|Erreur/i.test(view),'synchronisé, rien de refusé par le serveur')
  }catch(e){ok(false,'exception : '+e.message.split('\n')[0])}
  ok(!errors.length,'aucune erreur de page'+(errors.length?' : '+errors.join(' | '):''));
  await browser.close();server.close();console.log(fails?fails+' échec(s)':'Tout est bon.');process.exit(fails?1:0)})();

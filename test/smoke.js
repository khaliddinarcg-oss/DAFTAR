/* real runtime test: load the built page in a browser and drive it */
const path=require('path');
const pwRoot='playwright';
const {chromium}=require(pwRoot);
const EXE='/usr/bin/google-chrome';
(async()=>{
  let browser;
  try{browser=await chromium.launch({executablePath:EXE,args:['--no-sandbox','--disable-dev-shm-usage']})}catch(e){console.log('NO_BROWSER: '+e.message.split('\n')[0]);process.exit(0)}
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.goto('file://'+path.resolve('index.html'));
  await page.waitForTimeout(600);
  const r=await page.evaluate(()=>{
    const out={};
    out.nav=document.querySelector('#nav').textContent;
    out.defs={resolveCode:typeof resolveCode,handleCode:typeof handleCode,showArt:typeof showArt,liveScan:typeof liveScan,runCode:typeof runCode,addCart:typeof addCart};
    return out});
  console.log('nav:',r.nav);
  console.log('defs:',JSON.stringify(r.defs));
  // 1. scan an article code the way a real scan does
  const scan=await page.evaluate(()=>{try{runCode('DAFTAR:A:a1|Xiaomi 4 Lite|XM-4LITE');
    const s=document.querySelector('#sheet');return{hidden:s.hidden,txt:(s.textContent||'').slice(0,120)}}catch(e){return{err:String(e)}}});
  console.log('scan article:',JSON.stringify(scan));
  // 2. the same code as a link, the way the printed label carries it
  const scan2=await page.evaluate(()=>{try{runCode('https://x.github.io/DAFTAR/#qr-a2');
    const s=document.querySelector('#sheet');return{hidden:s.hidden,txt:(s.textContent||'').slice(0,80)}}catch(e){return{err:String(e)}}});
  console.log('scan lien:',JSON.stringify(scan2));
  // 3. a supplier code
  const scan3=await page.evaluate(()=>{try{runCode('DAFTAR:F:f1|Import Casa Mobility');
    const s=document.querySelector('#sheet');return{hidden:s.hidden,txt:(s.textContent||'').slice(0,80)}}catch(e){return{err:String(e)}}});
  console.log('scan fournisseur:',JSON.stringify(scan3));
  // 4. an unknown code must explain itself, not fail silently
  const scan4=await page.evaluate(()=>{try{runCode('DAFTAR:A:zzz|Rien');
    const s=document.querySelector('#sheet');return{hidden:s.hidden,txt:(s.textContent||'').slice(0,90)}}catch(e){return{err:String(e)}}});
  console.log('scan inconnu:',JSON.stringify(scan4));
  // 5. walk every tab
  const tabs=['accueil','reglages','vente','tickets','stock','catalogue','fournisseurs','analyse','inventaire','credit','demandes','livraisons','garantie','journal','factures'];
  for(const t of tabs){
    const res=await page.evaluate(async t=>{location.hash='#'+t;await new Promise(r=>setTimeout(r,120));
      const v=document.querySelector('#view');return{len:(v.textContent||'').length,head:(v.textContent||'').slice(0,40)}},t);
    console.log('onglet',t,'->',res.len,JSON.stringify(res.head));
  }
  console.log(errors.length?'ERREURS:\n'+errors.join('\n'):'aucune erreur de page');
  await browser.close();
})();

/* Test de la logique métier au hasard : des milliers d'opérations enchaînées (ventes comptant,
   crédit, livraison, encaissements, retours, échanges, factures, réceptions, paiements
   fournisseurs), et les règles vérifiées après chacune. Sans navigateur.

     node test/logique.js [nombre de parties, 200 par défaut] */
const fs=require('fs'),path=require('path');
const code=[...fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n');
const L=new Function(code+';return {seed,sell,refund,exchange,payCredit,payBuy,receive,invoice,setDel,journal,supErr,repairReceptions,unitsOf,qtyOf,plus,INITIAL,R}')();

let seedN=1;const rnd=()=>{seedN=(seedN*1103515245+12345)&0x7fffffff;return seedN/0x7fffffff};
const pick=l=>l[Math.floor(rnd()*l.length)];
const isDay=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'');
const problems=new Map();
const note=(k,ctx)=>{if(!problems.has(k))problems.set(k,ctx)};

function check(s,last){
  s.stock.forEach(r=>{if(r.qty<0)note('stock négatif',last)});
  s.credits.forEach(c=>{if(c.paid>c.total)note('crédit encaissé au-delà du dû',last);if(c.paid<0)note('crédit négatif',last)});
  s.buys.forEach(b=>{if(b.paid>b.amount)note('fournisseur payé au-delà du dû',last);if(!isDay(b.d))note('réception sans date valide',last)});
  s.ops.forEach(o=>{if(!isDay(o.d))note('écriture au journal sans date valide',last);if(!Number.isFinite(o.amt))note('montant invalide au journal',last)});
  const nos=s.tickets.map(t=>t.no);if(new Set(nos).size!==nos.length)note('numéro de ticket en double',last);
  const seq=l=>l.map(x=>+x.no.split('-').pop()).sort((a,b)=>a-b).every((n,i)=>n===i+1);
  if(!seq(s.tickets))note('trou dans les tickets',last);
  if(!seq(s.invoices.filter(f=>f.type!=='avoir')))note('trou dans les factures',last);
  if(!seq(s.invoices.filter(f=>f.type==='avoir')))note('trou dans les avoirs',last);
  const inv=new Set(s.invoices.map(f=>f.no));if(inv.size!==s.invoices.length)note('numéro de facture en double',last);
  s.tickets.forEach(t=>{
    t.lines.forEach(l=>{if(l.unit){const u=s.units.find(x=>x.id===l.unit);
      if(t.status==='ok'&&(!u||u.status!=='vendu'||u.ticket!==t.no))note('ticket valide mais trottinette pas marquée vendue',last);
      if(t.status!=='ok'&&u&&u.status==='vendu'&&u.ticket===t.no)note('ticket retourné mais trottinette encore vendue',last)}});
    if(t.status!=='ok'&&t.facture&&!t.avoir)note('ticket facturé retourné sans avoir',last);
    if(Math.abs(t.lines.reduce((a,l)=>a+l.total,0)-t.total)>0)note('total du ticket faux',last);
    if(t.status!=='ok'&&s.credits.some(c=>c.ticket===t.no))note('crédit restant sur un ticket retourné',last)});
  s.units.forEach(u=>{if(u.status==='vendu'&&!s.tickets.some(t=>t.no===u.ticket&&t.status==='ok'))note('trottinette vendue sans ticket valide',last)});
  s.invoices.filter(f=>f.type==='avoir').forEach(a=>{if(!s.invoices.some(f=>f.no===a.of&&f.type==='facture'))note('avoir sans facture d’origine',last)});
}

const N=+process.argv[2]||200;let ops=0;
for(let g=0;g<N;g++){seedN=g+1;const s=L.seed();const hist=[];
  for(let k=0;k<60;k++){const what=pick(['sell','sell','sell','pay','refund','exch','inv','recv','paybuy','del','over']);let r;
    try{
      if(what==='sell'){const avail=s.stock.filter(x=>L.qtyOf(s,x)>0);if(!avail.length)continue;const a=pick(avail);
        const line=a.kind==='t'?{unit:L.unitsOf(s,a.id)[0].id}:{ref:a.id,qty:1+Math.floor(rnd()*Math.min(3,a.qty))};
        const pay=pick(['comptant','credit','livraison']);
        r=L.sell(s,{lines:[line],name:'C'+k,phone:'',pay,credit:{paid:Math.floor(rnd()*500),inst:100,due:L.plus(30)},del:{city:'Tanger',status:pick(['expedie','encaisse'])}});
        hist.push('vente '+pay+' '+a.name)}
      if(what==='pay'){const c=s.credits.filter(x=>x.total>x.paid);if(!c.length)continue;const x=pick(c);const rest=x.total-x.paid;
        r=L.payCredit(s,x.id,1+Math.floor(rnd()*rest));hist.push('tranche')}
      if(what==='over'){const c=s.credits.filter(x=>x.total>x.paid);if(!c.length)continue;const x=pick(c);
        r=L.payCredit(s,x.id,x.total-x.paid+1);if(!r.err)note('encaissement au-delà du reste accepté','tranche trop forte');hist.push('tranche trop forte (refusée)')}
      if(what==='refund'){const t=s.tickets.filter(x=>x.status==='ok');if(!t.length)continue;const x=pick(t);
        r=L.refund(s,x.no,{reason:'Essai',cond:pick(['stock','atelier']),date:L.plus(0)});hist.push('retour '+x.no+(x.facture?' facturé':''))}
      if(what==='exch'){const t=s.tickets.filter(x=>x.status==='ok');const avail=s.stock.filter(x=>x.kind==='p'&&x.qty>0);if(!t.length||!avail.length)continue;
        const x=pick(t),a=pick(avail);r=L.exchange(s,x.no,{reason:'Échange',cond:'stock',date:L.plus(0)},{lines:[{ref:a.id,qty:1}]});hist.push('échange '+x.no)}
      if(what==='inv'){const t=s.tickets.filter(x=>x.status==='ok'&&!x.facture);if(!t.length)continue;r=L.invoice(s,pick(t).no,{kind:'b2c'});hist.push('facture')}
      if(what==='recv'){const a=pick(s.stock);const sup=pick(s.sups).id;
        if(L.supErr(s,a.id,sup))note('fournisseur valide refusé','réception');
        r=L.receive(s,a.id,1+Math.floor(rnd()*3),Math.max(1,a.price-500),null,null,sup,rnd()<.5);hist.push('réception '+a.name)}
      if(what==='paybuy'){const b=s.buys.filter(x=>x.amount>x.paid);if(!b.length)continue;const x=pick(b);r=L.payBuy(s,x.id,x.amount-x.paid);
        if(L.payBuy(s,x.id,1).ok)note('fournisseur payé deux fois','paiement fournisseur');hist.push('paiement fournisseur')}
      if(what==='del'){if(!s.dels.length)continue;const d=pick(s.dels);L.setDel(s,d.id,pick(['expedie','livre','encaisse','retour']));hist.push('livraison')}
      ops++;check(s,hist.slice(-4).join(' → '));
    }catch(e){note('erreur : '+e.message,hist.slice(-4).join(' → '))}}
  /* the journal must balance with what the shop says came in and went out */
  const j=L.journal(s);if(j.net!==j.inn-j.out)note('journal déséquilibré','fin de partie');
}
console.log(N+' parties, '+ops+' opérations vérifiées.');
for(const [k,ctx] of problems)console.log('PROBLÈME '+k+'\n   après : '+ctx);
console.log(problems.size?problems.size+' problème(s).':'Aucun problème trouvé.');
process.exit(problems.size?1:0);

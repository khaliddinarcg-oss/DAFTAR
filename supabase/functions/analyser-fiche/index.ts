// Daftar : lit avec l'IA la photo
// - d'une fiche technique, d'un carton ou d'une page de catalogue (mode « fiche ») : renvoie la
//   fiche d'identité de l'article, prête à vérifier ;
// - d'un bon d'achat ou d'une facture fournisseur (mode « achat ») : renvoie le fournisseur, la
//   date, le paiement et les lignes, pour pré-remplir la réception. Les coordonnées du client
//   (nom, pièce d'identité, téléphone) n'ont aucune case dans la réponse : elles ne sortent pas.
//
// Appelée par l'application avec le jeton de la personne connectée.
// La clé de l'IA (secret ANTHROPIC_API_KEY) ne quitte jamais le serveur.
// Plafond : 60 analyses par magasin et par jour, journalisées dans `analyses`.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODELE = "claude-opus-5-5";
const PLAFOND_JOUR = 60;
const TAILLE_MAX = 6_000_000; // caractères base64, environ 4,5 Mo d'image

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const refus = (message: string, status = 400) => json({ ok: false, message }, status);

// Les clés sont celles du formulaire « Nouvel article » de l'application.
const texte = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["lisible", "kind", "brand", "name", "ref", "war", "moteur", "batterie", "autonomie",
    "vitesse", "roues", "poids", "charge", "incertain", "deduit", "photo", "remarque"],
  properties: {
    lisible: { type: "boolean" },
    kind: { type: "string", enum: ["t", "v", "s", "m", "p", "a"] },
    brand: texte, name: texte, ref: texte,
    war: { anyOf: [{ type: "integer" }, { type: "null" }] },
    moteur: texte, batterie: texte, autonomie: texte, vitesse: texte,
    roues: texte, poids: texte, charge: texte,
    incertain: { type: "array", items: { type: "string", enum: ["brand", "name", "ref", "kind", "war",
      "moteur", "batterie", "autonomie", "vitesse", "roues", "poids", "charge"] } },
    deduit: { type: "array", items: { type: "string", enum: ["moteur", "batterie", "autonomie",
      "vitesse", "roues", "poids", "charge"] } },
    photo: {
      type: "object", additionalProperties: false, required: ["presente", "x", "y", "l", "h"],
      properties: { presente: { type: "boolean" }, x: { type: "number" }, y: { type: "number" },
        l: { type: "number" }, h: { type: "number" } },
    },
    remarque: texte,
  },
};

const nombre = { type: "integer" };
const SCHEMA_ACHAT = {
  type: "object",
  additionalProperties: false,
  required: ["lisible", "fournisseur", "date", "numero", "paiement", "lignes", "garantie_mois", "incertain", "remarque"],
  properties: {
    lisible: { type: "boolean" },
    fournisseur: {
      type: "object", additionalProperties: false, required: ["nom", "telephone", "ville"],
      properties: { nom: texte, telephone: texte, ville: texte },
    },
    date: texte, numero: texte,
    paiement: { type: "string", enum: ["paye", "du", ""] },
    lignes: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["designation", "marque", "modele", "kind", "quantite", "prix_unitaire", "total"],
        properties: { designation: texte, marque: texte, modele: texte, kind: { type: "string", enum: ["t", "v", "s", "m", "p", "a"] },
          quantite: nombre, prix_unitaire: nombre, total: nombre },
      },
    },
    garantie_mois: { anyOf: [{ type: "integer" }, { type: "null" }] },
    incertain: { type: "array", items: { type: "string", enum: ["fournisseur", "date", "numero", "paiement", "lignes", "prix"] } },
    remarque: texte,
  },
};

const CONSIGNE_ACHAT = `Tu lis la photo d'un bon d'achat, d'un bon de livraison ou d'une facture qu'un
FOURNISSEUR a remis à un magasin de trottinettes, vélos, scooters et motos électriques au Maroc.
Le magasin veut enregistrer la réception de cette marchandise.

Règles :
- Le document contient aussi les coordonnées du client (nom, CIN ou pièce d'identité, téléphone,
  adresse) : ignore-les entièrement. Ne les recopie nulle part, pas même dans la remarque.
- fournisseur : le vendeur qui a émis le document (en-tête, cachet, pied de page) : son nom
  commercial, son téléphone, sa ville. Jamais le client.
- date : la date du document au format AAAA-MM-JJ. Les dates marocaines s'écrivent jour/mois/année
  (07-09-26 = 2026-09-07). "" si illisible.
- numero : le numéro du bon ou de la facture.
- paiement : "paye" si le document indique un règlement fait (cash, espèces, payé, virement reçu),
  "du" s'il reste à payer (crédit, à payer, reste dû, échéance), "" si rien n'est indiqué.
- lignes : une ligne par article acheté, en ignorant les lignes vides, les lignes de texte
  (conditions, garantie) et les totaux. designation : le texte tel qu'écrit. marque et modele :
  séparés si possible (« Trottinette électrique XTREME F1 » → marque "", modele "Xtreme F1" ; une
  marque connue comme Xiaomi va dans marque). kind : "t" trottinette, "v" vélo électrique,
  "s" scooter électrique, "m" moto électrique, "p" pièce détachée (chambre à air, pneu, frein,
  batterie de rechange…), "a" accessoire (casque, antivol, chargeur, sacoche, gants…).
  quantite : entier. prix_unitaire et total : en dirhams entiers, le montant que le magasin paie
  (si le document donne HT et TTC, prends le TTC ; s'il ne donne que HT, prends le HT et mets
  "prix" dans incertain).
- garantie_mois : la garantie du fournisseur en mois si elle est écrite, sinon null.
- lisible=false si ce n'est pas un document d'achat lisible.
- incertain : ce que tu as lu sans être sûr.
- remarque : une phrase courte en français pour le commerçant (sans aucune donnée du client).`;

const CONSIGNE = `Tu lis la photo d'une fiche technique, d'un carton, d'une page ou d'une couverture
de catalogue d'un magasin de trottinettes, vélos, scooters et motos électriques au Maroc, et tu
remplis la fiche d'identité de l'article.

Règles :
- Lis d'abord ce qui est écrit sur la photo : c'est la source qui compte.
- Une caractéristique absente de la photo : si la marque et le modèle exact sont identifiés sans
  ambiguïté et que tu connais les caractéristiques publiées par le constructeur pour ce modèle,
  donne la valeur et mets le nom du champ dans deduit. Si tu hésites entre deux versions du
  modèle (Pro, Max, Plus, année…), ou si tu ne connais pas le modèle, laisse "" : une case vide
  vaut mieux qu'une valeur fausse. Ne déduis jamais ref ni war.
- Marque et modèle reconnus seulement à l'apparence du produit (forme, couleurs, logo sans le nom
  du modèle écrit) : mets brand et name dans incertain, et dis-le dans la remarque (« reconnu à
  l'apparence, pas lu »). Si plusieurs modèles ou générations se ressemblent, laisse name vide.
- kind : "t" trottinette, "v" vélo électrique, "s" scooter électrique, "m" moto électrique,
  "p" pièce détachée (chambre à air, pneu, frein, batterie de rechange…), "a" accessoire (casque,
  antivol, chargeur, sacoche, gants…).
- brand : la marque (Xiaomi, Segway-Ninebot, Kukirin, Kugoo, Dualtron, Niu, Yadea, Super Soco…).
  name : le modèle seul, sans la marque (« 4 Lite », « Max G2 », « G2 Master »).
  ref : la référence ou le code produit s'il est imprimé, sinon "".
- war : la garantie en mois si elle est écrite, sinon null.
- Formats, en français, virgule décimale, comme ces exemples :
  moteur "350 W" ou "2 × 1000 W" ; batterie "36 V · 10,4 Ah" ; autonomie "30 km" ;
  vitesse "25 km/h" ; roues "10 pouces" ; poids "15,5 kg" ; charge "120 kg".
  Convertis les unités anglo-saxonnes (mph, lbs, miles) et signale-les dans incertain.
- incertain : les champs que tu as remplis sans être sûr (texte flou, deux valeurs possibles,
  conversion d'unité).
- photo : si l'image montre le produit lui-même (dessin ou photo du véhicule ou de
  l'accessoire), donne le cadre qui l'entoure en fractions de l'image, x et y du coin haut gauche,
  l et h la largeur et la hauteur, entre 0 et 1. Sinon presente=false et des 0.
- lisible=true dès que la marque et le modèle sont identifiables (fiche, carton, couverture de
  catalogue, photo du véhicule avec son nom). lisible=false sinon.
- remarque : une phrase courte en français pour le commerçant : ce qui a été lu, ce qui a été
  déduit du modèle, ce qui manque.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return refus("Méthode non prise en charge.", 405);

  const cle = Deno.env.get("ANTHROPIC_API_KEY");
  if (!cle) return refus("Le service d'analyse n'est pas configuré. Saisissez la fiche à la main.", 503);

  const jeton = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const commeUtilisateur = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jeton}` } } });
  const admin = createClient(url, service);

  let corps: { magasin?: string; image?: string; type?: string; mode?: string };
  try { corps = await req.json(); } catch { return refus("Requête illisible."); }
  const { magasin, image, type } = corps;
  const achat = corps.mode === "achat";
  if (!magasin || !image) return refus("Photo ou magasin manquant.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(type || "")) return refus("Format d'image non pris en charge.");
  if (image.length > TAILLE_MAX) return refus("Photo trop lourde.");

  // La personne doit pouvoir écrire dans ce magasin (patron ou vendeur).
  const { data: user } = await commeUtilisateur.auth.getUser(jeton);
  const { data: magasins, error: e1 } = await commeUtilisateur.rpc("mes_magasins");
  if (e1 || !user?.user) return refus("Connectez-vous d'abord.", 401);
  const m = (magasins || []).find((x: { id: string; role: string }) => x.id === magasin);
  if (!m || !["patron", "vendeur"].includes(m.role)) return refus("Vous ne faites pas partie de ce magasin.", 403);

  const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin.from("analyses").select("id", { count: "exact", head: true })
    .eq("magasin_id", magasin).gte("cree_le", depuis);
  if ((count || 0) >= PLAFOND_JOUR) {
    return refus(`Limite de ${PLAFOND_JOUR} analyses par jour atteinte pour ce magasin. Saisissez la fiche à la main.`, 429);
  }

  const trace = { magasin_id: magasin, user_id: user.user.id, modele: MODELE, mode: achat ? "achat" : "fiche" } as Record<string, unknown>;
  try {
    const client = new Anthropic({ apiKey: cle });
    // deno-lint-ignore no-explicit-any
    const reponse: any = await client.beta.messages.create({
      model: MODELE,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: achat ? SCHEMA_ACHAT : SCHEMA } },
      system: achat ? CONSIGNE_ACHAT : CONSIGNE,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: type, data: image } },
          { type: "text", text: achat ? "Lis ce document d'achat." : "Remplis la fiche de cet article." },
        ],
      // deno-lint-ignore no-explicit-any
      }] as any,
    // deno-lint-ignore no-explicit-any
    } as any);
    trace.modele = reponse.model || MODELE;
    trace.jetons_entree = reponse.usage?.input_tokens || 0;
    trace.jetons_sortie = reponse.usage?.output_tokens || 0;
    if (reponse.stop_reason === "refusal") throw new Error("L'analyse a été refusée pour cette image.");
    if (reponse.stop_reason === "max_tokens") throw new Error("Réponse incomplète.");
    const bloc = (reponse.content || []).find((b: { type: string }) => b.type === "text");
    const fiche = JSON.parse(bloc?.text || "{}");
    await admin.from("analyses").insert({ ...trace, ok: true });
    return json({ ok: true, fiche });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("analyses").insert({ ...trace, ok: false, erreur: message.slice(0, 300) });
    const pourLeCommercant = /refusée|incomplète/.test(message) ? message
      : /401|authentication|api.key/i.test(message) ? "La clé du service d'analyse est refusée. Prévenez le patron."
      : /credit|billing|402/i.test(message) ? "Le crédit du service d'analyse est épuisé. Prévenez le patron."
      : "L'analyse n'a pas abouti. Réessayez, ou saisissez la fiche à la main.";
    return refus(pourLeCommercant, 502);
  }
});

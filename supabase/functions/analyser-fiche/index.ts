// Daftar : lit la photo d'une fiche technique, d'un carton ou d'une page de
// catalogue, et renvoie la fiche d'identité de l'article, prête à vérifier.
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
    "vitesse", "roues", "poids", "charge", "incertain", "photo", "remarque"],
  properties: {
    lisible: { type: "boolean" },
    kind: { type: "string", enum: ["t", "p"] },
    brand: texte, name: texte, ref: texte,
    war: { anyOf: [{ type: "integer" }, { type: "null" }] },
    moteur: texte, batterie: texte, autonomie: texte, vitesse: texte,
    roues: texte, poids: texte, charge: texte,
    incertain: { type: "array", items: { type: "string", enum: ["brand", "name", "ref", "kind", "war",
      "moteur", "batterie", "autonomie", "vitesse", "roues", "poids", "charge"] } },
    photo: {
      type: "object", additionalProperties: false, required: ["presente", "x", "y", "l", "h"],
      properties: { presente: { type: "boolean" }, x: { type: "number" }, y: { type: "number" },
        l: { type: "number" }, h: { type: "number" } },
    },
    remarque: texte,
  },
};

const CONSIGNE = `Tu lis la photo d'une fiche technique, d'un carton ou d'une page de catalogue
d'un magasin de trottinettes électriques au Maroc, et tu remplis la fiche d'identité de l'article.

Règles :
- N'écris que ce qui est lisible sur la photo. Si une information n'y est pas, laisse "".
  N'invente jamais une caractéristique d'après le nom du modèle.
- kind : "t" pour une trottinette, "p" pour une pièce ou un accessoire.
- brand : la marque (Xiaomi, Segway-Ninebot, Kukirin, Kugoo, Dualtron…). name : le modèle seul,
  sans la marque (« 4 Lite », « Max G2 », « G2 Master »). ref : la référence ou le code produit s'il
  est imprimé, sinon "".
- war : la garantie en mois si elle est écrite, sinon null.
- Formats, en français, virgule décimale, comme ces exemples :
  moteur "350 W" ou "2 × 1000 W" ; batterie "36 V · 10,4 Ah" ; autonomie "30 km" ;
  vitesse "25 km/h" ; roues "10 pouces" ; poids "15,5 kg" ; charge "120 kg".
  Convertis les unités anglo-saxonnes (mph, lbs, miles) et signale-les dans incertain.
- incertain : les champs que tu as remplis sans être sûr (texte flou, deux valeurs possibles,
  conversion d'unité).
- photo : si l'image montre le produit lui-même (dessin ou photo de la trottinette ou de
  l'accessoire), donne le cadre qui l'entoure en fractions de l'image, x et y du coin haut gauche,
  l et h la largeur et la hauteur, entre 0 et 1. Sinon presente=false et des 0.
- lisible=false si l'image ne montre pas de fiche produit exploitable.
- remarque : une phrase courte en français pour le commerçant, par exemple ce qui manque.`;

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

  let corps: { magasin?: string; image?: string; type?: string };
  try { corps = await req.json(); } catch { return refus("Requête illisible."); }
  const { magasin, image, type } = corps;
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

  const trace = { magasin_id: magasin, user_id: user.user.id, modele: MODELE } as Record<string, unknown>;
  try {
    const client = new Anthropic({ apiKey: cle });
    // deno-lint-ignore no-explicit-any
    const reponse: any = await client.beta.messages.create({
      model: MODELE,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: CONSIGNE,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: type, data: image } },
          { type: "text", text: "Remplis la fiche de cet article." },
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

#!/usr/bin/env python3
"""Feuille de QR de test, pour essayer le scan en vente et la creation d'article.

Page 1, VENTE : les articles et les unites du magasin d'exemple (Tanja Trott),
plus les cas qui doivent etre refuses ou rediriges.
Page 2, CREATION : des articles qui n'existent pas encore. Scannes, ils
ouvrent « Nouvel article » ; scannes une deuxieme fois, « Reception ».

Toujours scanner depuis le bouton Scanner de l'application, et partir du
magasin d'exemple : Reglages > Remettre les exemples.

    python3 tools/qr-test.py --out docs/acces/qr-de-test.pdf
"""
import argparse
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing, Group
from reportlab.graphics import renderPDF
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

# (contenu du QR, titre, ce qui doit se passer). Les identifiants sont ceux de seed() dans index.html.
VENTE = [
    ("#qr-a1", "Xiaomi 4 Lite", "Article : entre au panier (3 200 DH)"),
    ("#qr-a2", "Ninebot Max G2", "Article : entre au panier (6 100 DH)"),
    ("#qr-a3", "KuKirin G2 Master", "Article : entre au panier (11 000 DH)"),
    ("#qr-p1", "Chambre a air 10 pouces", "Piece : au panier ; rescanner = 2"),
    ("#qr-p2", "Chargeur 42 V", "Accessoire : entre au panier (250 DH)"),
    ("#qr-u4", "Xiaomi n. 4LIT-00004", "Cette serie au panier (panier vide)"),
    ("#qr-u8", "KuKirin n. G2MA-00008", "Vendre, puis rescanner : son ticket"),
    ("#qr-u7", "KuKirin n. G2MA-00007", "Deja vendue : ouvre son ticket T-0005"),
    ("#qr-T-0002", "Ticket T-0002", "Ouvre le ticket (Yassine, a credit)"),
    ("#qr-f1", "Import Casa Mobility", "Fournisseur : ouvre sa fiche"),
    ("DAFTAR:A:zz99|Article inconnu", "Code inconnu", "Doit afficher « non reconnue »"),
]

# DAFTAR:A:1|nom|type|prix de vente|prix d'achat|numero de serie (sans accents dans le QR)
CREATION = [
    ("DAFTAR:A:1|Fiido D11 essai|v|9500|7800|FD11-ESSAI-01", "Velo Fiido D11", "Velo, 9 500 DH, serie FD11-ESSAI-01"),
    ("DAFTAR:A:1|Yadea G5 essai|s|18000|15000|YDG5-ESSAI-01", "Scooter Yadea G5", "Scooter, 18 000 DH, avec serie"),
    ("DAFTAR:A:1|Super Soco TC essai|m|32000|27000|", "Moto Super Soco TC", "Moto, 32 000 DH, serie a saisir"),
    ("DAFTAR:A:1|Xiaomi 4 Pro essai|t|5200|4300|", "Trottinette Xiaomi 4 Pro", "Trottinette, 5 200 DH"),
    ("DAFTAR:A:1|Pneu 10x2.5 essai|p|120|70|", "Pneu 10 x 2,5", "Piece, 120 DH"),
    ("DAFTAR:A:1|Casque essai|a|350|200|", "Casque", "Accessoire, 350 DH"),
]


def draw_qr(c, data, x, y, size):
    d = Drawing(size, size)
    w = qr.QrCodeWidget(data, barLevel="M")
    b = w.getBounds()
    s = size / (b[2] - b[0])
    g = Group(w)
    g.transform = (s, 0, 0, s, -b[0] * s, -b[1] * s)
    d.add(g)
    renderPDF.draw(d, c, x, y)


def page(c, title, lines, items, url, foot):
    W, H = A4
    c.setFont("Helvetica-Bold", 16)
    c.drawString(14 * mm, H - 16 * mm, title)
    c.setFont("Helvetica", 9)
    for i, l in enumerate(lines):
        c.drawString(14 * mm, H - 22 * mm - i * 4.6 * mm, l)
    cols, cw, ch, q = 3, 61 * mm, 60 * mm, 38 * mm
    x0, y0 = 14 * mm, H - 24 * mm - len(lines) * 4.6 * mm
    for i, (data, name, sub) in enumerate(items):
        cx = x0 + (i % cols) * cw
        cy = y0 - (i // cols) * ch
        c.setStrokeColorRGB(.8, .8, .8)
        c.setDash(2, 2)
        c.rect(cx, cy - ch + 2 * mm, cw - 3 * mm, ch - 3 * mm)
        c.setDash()
        full = url + data if data.startswith("#") else data
        draw_qr(c, full, cx + (cw - 3 * mm - q) / 2, cy - q - 3 * mm, q)
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(cx + (cw - 3 * mm) / 2, cy - q - 7 * mm, name)
        c.setFont("Helvetica", 8)
        c.drawCentredString(cx + (cw - 3 * mm) / 2, cy - q - 11 * mm, sub)
        c.setFillColorRGB(.5, .5, .5)
        c.setFont("Helvetica", 6.5)
        c.drawCentredString(cx + (cw - 3 * mm) / 2, cy - q - 14.5 * mm, data[:48])
    c.setFillColorRGB(.45, .45, .45)
    c.setFont("Helvetica", 8)
    c.drawString(14 * mm, 8 * mm, foot)
    c.setFillColorRGB(0, 0, 0)
    c.showPage()


def build(url, out):
    url = url.rstrip("/") + "/"
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle("Daftar - QR de test")
    page(c, "QR de test - 1. Vente", [
        "Avant : Reglages > Remettre les exemples (magasin Tanja Trott, sans compte connecte).",
        "Ouvrir l'onglet Vente, toucher Scanner, photographier un QR : l'article entre au panier.",
        "Hors de l'onglet Vente, le meme QR ouvre la fiche de l'article.",
        "Une seule trottinette de chaque modele en stock : apres Xiaomi 4 Lite, la serie 4LIT-00004 dit",
        "« pas disponible », c'est normal (elle est deja au panier). Vider le panier pour la tester seule.",
    ], VENTE, url, "Un telephone ne peut pas scanner son propre ecran : imprimer, ou afficher sur un autre ecran.")
    page(c, "QR de test - 2. Creation d'article", [
        "Toucher Scanner (n'importe quel onglet) : l'article n'existe pas, « Nouvel article » s'ouvre,",
        "rempli avec le nom, le type, les prix et la serie. Choisir le fournisseur, valider : il est en stock.",
        "Scanner le meme QR une 2e fois : « Reception », l'article existe deja. Avec une serie dans le QR,",
        "la 2e fois est refusee (serie deja connue) : effacer la serie ou en mettre une autre.",
    ], CREATION, url, "Format : DAFTAR:A:1|nom|type (t v s m p a)|prix de vente|prix d'achat|numero de serie")
    c.save()
    print("ecrit :", out)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="https://khaliddinarcg-oss.github.io/DAFTAR/")
    p.add_argument("--out", default="qr-de-test.pdf")
    a = p.parse_args()
    build(a.url, a.out)

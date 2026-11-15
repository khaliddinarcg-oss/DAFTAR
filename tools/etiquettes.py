#!/usr/bin/env python3
"""Feuille d'etiquettes QR a imprimer, une par article et par fournisseur.

Chaque QR contient l'adresse du site suivie de #qr-<identifiant> : vise avec
l'appareil photo du telephone, il ouvre l'application sur la bonne fiche.

    pip install reportlab
    python3 tools/etiquettes.py --url https://khaliddinarcg-oss.github.io/DAFTAR/

Les articles sont ceux des donnees d'exemple. Pour un vrai magasin, remplacer
ITEMS, ou mieux : imprimer depuis l'application, fiche de l'article, onglet QR.
"""
import argparse
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing, Group
from reportlab.graphics import renderPDF
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ITEMS = [
    ("a1", "Xiaomi 4 Lite", "Trottinette - 3 200 DH"),
    ("a2", "Ninebot Max G2", "Trottinette - 6 100 DH"),
    ("a3", "KuKirin G2 Master", "Trottinette - 11 000 DH"),
    ("p1", "Chambre a air 10 pouces", "Piece - 80 DH"),
    ("p2", "Chargeur 42 V", "Piece - 250 DH"),
    ("f1", "Import Casa Mobility", "Fournisseur - Casablanca"),
    ("f2", "Pieces Gzenaya", "Fournisseur - Tanger"),
]

def sheet(url, out, shop):
    url = url.rstrip("/") + "/"
    W, H = A4
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle("Etiquettes QR - " + shop)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(18 * mm, H - 20 * mm, "Etiquettes QR - " + shop)
    c.setFont("Helvetica", 9.5)
    c.drawString(18 * mm, H - 26 * mm,
                 "Visez une etiquette avec l'appareil photo, ou le bouton Scanner dans l'application.")
    cols, cw, ch = 2, 86 * mm, 57 * mm
    x0, y0 = 18 * mm, H - 40 * mm
    for i, (key, name, sub) in enumerate(ITEMS):
        cx = x0 + (i % cols) * cw
        cy = y0 - (i // cols) * ch
        c.setStrokeColorRGB(.8, .8, .8)
        c.setDash(2, 2)
        c.rect(cx, cy - ch + 6 * mm, cw - 6 * mm, ch - 8 * mm)
        c.setDash()
        d = Drawing(34 * mm, 34 * mm)
        w = qr.QrCodeWidget(url + "#qr-" + key, barLevel="M")
        b = w.getBounds()
        s = 34 * mm / (b[2] - b[0])
        g = Group(w)
        g.transform = (s, 0, 0, s, -b[0] * s, -b[1] * s)
        d.add(g)
        renderPDF.draw(d, c, cx + (cw - 6 * mm - 34 * mm) / 2, cy - ch + 24 * mm)
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(cx + (cw - 6 * mm) / 2, cy - ch + 17 * mm, name)
        c.setFont("Helvetica", 9.5)
        c.drawCentredString(cx + (cw - 6 * mm) / 2, cy - ch + 12.5 * mm, sub)
    c.setFont("Helvetica", 8)
    c.setFillColorRGB(.45, .45, .45)
    c.drawString(18 * mm, 9 * mm,
                 "Un telephone ne peut pas scanner son propre ecran : gardez cette feuille sur papier.")
    c.showPage()
    c.save()
    print("ecrit :", out)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="https://khaliddinarcg-oss.github.io/DAFTAR/")
    p.add_argument("--out", default="etiquettes-qr.pdf")
    p.add_argument("--shop", default="Tanja Trott")
    a = p.parse_args()
    sheet(a.url, a.out, a.shop)

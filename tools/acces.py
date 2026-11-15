#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""QR code d'acces a l'application, pour ne jamais taper l'adresse.

Produit deux fichiers dans docs/acces/ :
  - daftar-qr.png      : le QR seul, a envoyer sur WhatsApp ou garder dans la galerie ;
  - daftar-affiche.pdf : une affiche A4 a imprimer et coller au comptoir.

Vise avec l'appareil photo du telephone, le QR ouvre l'application. On
l'ajoute ensuite a l'ecran d'accueil : l'icone suffit pour toutes les fois
suivantes.

    pip install reportlab pillow
    python3 tools/acces.py [--url https://khaliddinarcg-oss.github.io/DAFTAR/]
"""
import argparse
import os
from PIL import Image, ImageDraw
from reportlab.graphics.barcode import qr
from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

URL = "https://khaliddinarcg-oss.github.io/DAFTAR/"
OUT = os.path.join(os.path.dirname(__file__), "..", "docs", "acces")


def png(url, path, box=16, border=4):
    q = QRCode(4, QRErrorCorrectLevel.M)  # version 4 : jusqu'a 62 caracteres, assez pour une adresse
    q.addData(url)
    q.make()
    n = q.getModuleCount()
    side = (n + 2 * border) * box
    img = Image.new("RGB", (side, side + 6 * box), "white")
    d = ImageDraw.Draw(img)
    for r in range(n):
        for c in range(n):
            if q.isDark(r, c):
                x, y = (c + border) * box, (r + border) * box
                d.rectangle([x, y, x + box - 1, y + box - 1], fill="black")
    d.text((border * box, side + box), "Daftar · scannez pour ouvrir", fill="black", font_size=int(2.4 * box))
    img.save(path)


def affiche(url, path):
    w, h = A4
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle("Daftar · accès à l'application")
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(w / 2, h - 45 * mm, "Daftar")
    c.setFont("Helvetica", 16)
    c.drawCentredString(w / 2, h - 57 * mm, "Caisse et stock du magasin")
    size = 120 * mm
    code = qr.QrCodeWidget(url, barLevel="M")
    x0, y0, x1, y1 = code.getBounds()
    dr = Drawing(size, size, transform=[size / (x1 - x0), 0, 0, size / (y1 - y0), 0, 0])
    dr.add(code)
    renderPDF.draw(dr, c, (w - size) / 2, h - 75 * mm - size)
    y = h - 85 * mm - size
    c.setFont("Helvetica-Bold", 15)
    for line in [
        "1. Ouvrez l'appareil photo et visez le carré.",
        "2. Touchez le lien qui apparaît.",
        "3. Ajoutez Daftar à l'écran d'accueil :",
    ]:
        c.drawString(30 * mm, y, line)
        y -= 9 * mm
    c.setFont("Helvetica", 13)
    for line in [
        "Android : menu (trois points), Ajouter à l'écran d'accueil",
        "iPhone : Partager, Sur l'écran d'accueil",
    ]:
        c.drawString(38 * mm, y, line)
        y -= 7 * mm
    y -= 4 * mm
    c.setFont("Helvetica-Oblique", 13)
    c.drawString(30 * mm, y, "Scani had l'carré b l'camera, w zid Daftar l'écran dyal telephone.")
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, 15 * mm, url)
    c.showPage()
    c.save()


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--url", default=URL)
    url = a.parse_args().url
    os.makedirs(OUT, exist_ok=True)
    png(url, os.path.join(OUT, "daftar-qr.png"))
    affiche(url, os.path.join(OUT, "daftar-affiche.pdf"))
    print("docs/acces/daftar-qr.png et docs/acces/daftar-affiche.pdf")

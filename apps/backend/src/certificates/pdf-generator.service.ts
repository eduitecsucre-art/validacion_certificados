import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, PDFFont, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';

interface TemplateField {
  id: string;
  type: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  size?: number;
}

interface CertificateData {
  studentName: string;
  courseName: string;
  instructor: string;
  startDate: string;
  endDate?: string;
  hours: number;
  code: string;
  verifyUrl: string;
}

@Injectable()
export class PdfGeneratorService {
  private async resolveFont(pdfDoc: PDFDocument, field: TemplateField): Promise<PDFFont> {
    const family = field.fontFamily ?? 'Helvetica';
    const bold = !!field.bold;
    const italic = !!field.italic;

    let fontName: StandardFonts;
    if (family === 'Times-Roman') {
      fontName = bold && italic ? StandardFonts.TimesRomanBoldItalic
        : bold ? StandardFonts.TimesRomanBold
        : italic ? StandardFonts.TimesRomanItalic
        : StandardFonts.TimesRoman;
    } else if (family === 'Courier') {
      fontName = bold && italic ? StandardFonts.CourierBoldOblique
        : bold ? StandardFonts.CourierBold
        : italic ? StandardFonts.CourierOblique
        : StandardFonts.Courier;
    } else {
      fontName = bold && italic ? StandardFonts.HelveticaBoldOblique
        : bold ? StandardFonts.HelveticaBold
        : italic ? StandardFonts.HelveticaOblique
        : StandardFonts.Helvetica;
    }
    return pdfDoc.embedFont(fontName);
  }

  private hexToRgb(hex: string) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }

  private fieldText(field: TemplateField, data: CertificateData): string {
    switch (field.type) {
      case 'studentName': return data.studentName;
      case 'courseName': return data.courseName;
      case 'instructor': return data.instructor;
      case 'startDate': return this.formatDate(data.startDate);
      case 'endDate': return data.endDate ? this.formatDate(data.endDate) : '';
      case 'hours': return `${data.hours}h`;
      case 'code': return data.code;
      default: return '';
    }
  }

  async generate(
    templateImageBytes: Buffer,
    templateImageMime: string,
    fields: TemplateField[],
    data: CertificateData,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    const image = templateImageMime.includes('png')
      ? await pdfDoc.embedPng(templateImageBytes)
      : await pdfDoc.embedJpg(templateImageBytes);

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });

    // Cache para no re-embeber la misma fuente por cada campo que la use
    const fontCache = new Map<string, PDFFont>();

    for (const field of fields) {
      // El editor guarda posiciones en % con origen arriba-izquierda (como el navegador).
      // El PDF usa origen abajo-izquierda, así que invertimos el eje Y.
      const xPos = (field.x / 100) * width;
      const yPos = height - (field.y / 100) * height;

      if (field.type === 'qr') {
        const qrDataUrl = await QRCode.toDataURL(data.verifyUrl);
        const qrBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrBytes);
        const qrSize = ((field.size ?? 15) / 100) * width;
        page.drawImage(qrImage, {
          x: xPos - qrSize / 2,
          y: yPos - qrSize / 2,
          width: qrSize,
          height: qrSize,
        });
        continue;
      }

      const cacheKey = `${field.fontFamily}-${field.bold}-${field.italic}`;
      if (!fontCache.has(cacheKey)) {
        fontCache.set(cacheKey, await this.resolveFont(pdfDoc, field));
      }
      const font = fontCache.get(cacheKey)!;

      const text = this.fieldText(field, data);
      const fontSize = field.fontSize ?? 24;
      const color = this.hexToRgb(field.color ?? '#1f2937');
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let drawX = xPos;
      if (field.align === 'center') drawX = xPos - textWidth / 2;
      else if (field.align === 'right') drawX = xPos - textWidth;

      page.drawText(text, {
        x: drawX,
        y: yPos - fontSize / 2,
        size: fontSize,
        font,
        color,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
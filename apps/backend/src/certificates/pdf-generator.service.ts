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
  text?: string;
  hoursSuffix?: string;
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

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Todos los tamaños de letra se guardan relativos a este ancho de referencia.
// Un fontSize de 24 significa "24pt si la plantilla midiera 1000px de ancho";
// para plantillas más grandes o chicas, se escala proporcionalmente. Esto es
// lo que hace que el tamaño se vea IGUAL en el editor y en el PDF final,
// sin importar la resolución real de la imagen subida.
const REFERENCE_WIDTH = 1000;

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

  // Parsea "YYYY-MM-DD" manualmente, sin pasar por new Date(), para evitar
  // que la conversión de zona horaria corra el día hacia atrás (bug clásico
  // de JS: new Date("2026-06-30") puede dar 29 de junio según el huso horario
  // del servidor).
  private parseDateParts(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month, day }; // month es 1-12 aquí, no 0-11
  }

  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private formatDate(dateStr: string): string {
    const { day, month, year } = this.parseDateParts(dateStr);
    return `${day}/${month}/${year}`;
  }

  private fieldText(field: TemplateField, data: CertificateData): string {
    switch (field.type) {
      case 'studentName': return data.studentName;
      case 'courseName': return data.courseName;
      case 'instructor': return data.instructor;
      case 'startDate': return this.formatDate(data.startDate);
      case 'endDate': return data.endDate ? this.formatDate(data.endDate) : '';
      case 'startDay': return this.parseDateParts(data.startDate).day.toString();
      case 'endDay': return data.endDate ? this.parseDateParts(data.endDate).day.toString() : '';
      case 'month': {
        const { month } = this.parseDateParts(data.startDate);
        return this.capitalize(MONTH_NAMES[month - 1]);
      }
      case 'year': return this.parseDateParts(data.startDate).year.toString();
      case 'hours': return `${data.hours}${field.hoursSuffix ?? ' horas'}`;
      case 'code': return data.code;
      case 'customText': return field.text ?? '';
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

    const fontCache = new Map<string, PDFFont>();
    const scale = width / REFERENCE_WIDTH;

    for (const field of fields) {
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

      const text = this.fieldText(field, data);
      if (!text) continue; // ej: endDay sin endDate, o customText vacío

      const cacheKey = `${field.fontFamily}-${field.bold}-${field.italic}`;
      if (!fontCache.has(cacheKey)) {
        fontCache.set(cacheKey, await this.resolveFont(pdfDoc, field));
      }
      const font = fontCache.get(cacheKey)!;

      // Aquí está el fix: el tamaño configurado se escala según qué tan
      // grande es la imagen real respecto al ancho de referencia (1000px).
      const fontSize = ((field.fontSize ?? 24) * scale);
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
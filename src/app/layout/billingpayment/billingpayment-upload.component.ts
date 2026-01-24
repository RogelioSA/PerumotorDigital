import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

export interface VehiculoPdfInfo {
  archivo: string;
  rucProveedor: string | null;
  serie: string | null;
  numero: string | null;
}

@Component({
  selector: 'app-billingpayment-upload',
  standalone: true,
  template: `
    <input
      #fileInput
      type="file"
      accept="application/pdf"
      multiple
      hidden
      (change)="onFilesSelected($event)"
    />
  `
})
export class BillingpaymentUploadComponent {
  @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;
  @Output() parsed = new EventEmitter<VehiculoPdfInfo[]>();
  @Output() parseError = new EventEmitter<string>();

  constructor() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  }

  openDialog(): void {
    this.fileInput.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) {
      return;
    }

    try {
      const results = await Promise.all(files.map((file) => this.parsePdf(file)));
      this.parsed.emit(results);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al leer los PDFs.';
      this.parseError.emit(message);
    } finally {
      input.value = '';
    }
  }

  private async parsePdf(file: File): Promise<VehiculoPdfInfo> {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');

    const rucMatch = text.match(/\b\d{11}\b/);
    const facturaMatch = text.match(
      /FACTURA\s+ELECTRONICA[\s\S]*?N[°º]\s*([A-Z0-9]{2,4})\s*-\s*(\d{1,8})/i
    );
    const numeroMatch = text.match(/\bN[°º]\s*([A-Z0-9]{2,4})\s*-\s*(\d{1,8})\b/i);
    const serieNumeroMatch = text.match(/\b[A-Z0-9]{2,4}\s*-\s*\d{1,8}\b/);
    let serie = facturaMatch?.[1] ?? numeroMatch?.[1] ?? serieNumeroMatch?.[0]?.split('-')[0] ?? null;
    let numero = facturaMatch?.[2] ?? numeroMatch?.[2] ?? serieNumeroMatch?.[0]?.split('-')[1] ?? null;
    const serieNumeroFromFactura = this.extractSerieNumeroBelowFactura(textContent.items);
    if (serieNumeroFromFactura) {
      serie = serie ?? serieNumeroFromFactura.serie;
      numero = numero ?? serieNumeroFromFactura.numero;
    }

    return {
      archivo: file.name,
      rucProveedor: rucMatch?.[0] ?? null,
      serie: serie ? serie.trim() : null,
      numero: numero ? numero.trim() : null
    };
  }

  private extractSerieNumeroBelowFactura(
    items: pdfjsLib.TextContent['items']
  ): { serie: string; numero: string } | null {
    const normalized = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const textItems = items
      .filter(
        (item): item is pdfjsLib.TextItem =>
          'str' in item && typeof item.str === 'string' && 'transform' in item
      )
      .map((item) => ({
        text: item.str,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0
      }))
      .filter((item) => item.text.trim().length > 0);

    const lines = this.groupItemsByLine(textItems);
    const facturaLine = lines.find((line) => {
      const lineText = normalized(line.text);
      return lineText.includes('factura') && lineText.includes('electronica');
    });

    if (!facturaLine) {
      return null;
    }

    const candidateLines = lines
      .filter((line) => line.y < facturaLine.y && Math.abs(line.x - facturaLine.x) <= 30)
      .sort((a, b) => b.y - a.y);

    for (const line of candidateLines) {
      const match = line.text.match(/([A-Z0-9]{2,4})\s*-?\s*(\d{1,8})/);
      if (match) {
        return { serie: match[1], numero: match[2] };
      }
    }

    return null;
  }

  private groupItemsByLine(items: Array<{ text: string; x: number; y: number }>): Array<{
    text: string;
    x: number;
    y: number;
  }> {
    const tolerance = 2;
    const lines: Array<{ y: number; items: Array<{ text: string; x: number; y: number }> }> =
      [];

    for (const item of items) {
      const line = lines.find((entry) => Math.abs(entry.y - item.y) <= tolerance);
      if (line) {
        line.items.push(item);
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    }

    return lines
      .map((line) => {
        const sorted = [...line.items].sort((a, b) => a.x - b.x);
        const text = sorted.map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim();
        const x = Math.min(...sorted.map((item) => item.x));
        return { text, x, y: line.y };
      })
      .filter((line) => line.text.length > 0)
      .sort((a, b) => b.y - a.y);
  }
}

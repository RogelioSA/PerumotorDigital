import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

export interface VehiculoPdfInfo {
  archivo: string;
  rucProveedor: string | null;
  serie: string | null;
  numero: string | null;
  vin: string | null;
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
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
    const facturaMatch = text.match(
      /FACTURA\s+ELECTRONICA[\s\S]*?N[°º]\s*([A-Z0-9]{2,4})\s*-\s*(\d{1,8})/i
    );
    const numeroMatch = text.match(/\bN[°º]\s*([A-Z0-9]{2,4})\s*-\s*(\d{1,8})\b/i);
    const serieNumeroMatch = text.match(/\b[A-Z0-9]{2,4}\s*-\s*\d{1,8}\b/);
    const rucProveedor = rucMatch?.[0] ?? null;
    let serie = facturaMatch?.[1] ?? numeroMatch?.[1] ?? serieNumeroMatch?.[0]?.split('-')[0] ?? null;
    let numero = facturaMatch?.[2] ?? numeroMatch?.[2] ?? serieNumeroMatch?.[0]?.split('-')[1] ?? null;
    if (rucProveedor === '20168544252' && !serie && !numero) {
      const getItemText = (items: typeof textContent.items, index: number): string | null => {
        const item = items[index];
        if (!item || !('str' in item)) {
          return null;
        }
        const value = item.str?.trim();
        return value ? value : null;
      };
      serie = getItemText(textContent.items, 7);
      numero = getItemText(textContent.items, 12);
    }
    if (rucProveedor === '20430500521') {
      const serieNumeroSplitMatch = text.match(/\b([A-Z0-9]{2,4})\s*N[°º]\s*(\d{1,8})\b/i);
      serie = serieNumeroSplitMatch?.[1] ?? serie;
      numero = serieNumeroSplitMatch?.[2] ?? numero;
    }
    const vin = vinMatch?.[0] ?? null;
    console.log('VIN detectado', { archivo: file.name, vin });

    return {
      archivo: file.name,
      rucProveedor: rucMatch?.[0] ?? null,
      serie: serie ? serie.trim() : null,
      numero: numero ? numero.trim() : null,
      vin
    };
  }
}

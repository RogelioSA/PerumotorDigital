import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import * as pdfjsLib from 'pdfjs-dist';

export interface VehiculoPdfInfo {
  archivo: string;
  rucProveedor: string | null;
  serie: string | null;
  numero: string | null;
  vin: string | null;
  importeTotal: string | null;
}

@Component({
  selector: 'app-billingpayment-upload',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <input
      #fileInput
      type="file"
      accept="application/pdf"
      multiple
      hidden
      (change)="onFilesSelected($event)"
    />

    <p-dialog header="Resumen de factura" [(visible)]="mostrarResumen" [modal]="true" [style]="{ width: '520px' }">
      <ng-container *ngIf="vehiculosPdfInfo.length; else sinDatos">
        <div class="p-fluid" *ngFor="let info of vehiculosPdfInfo; let last = last">
          <div class="field">
            <label>RUC</label>
            <div>{{ info.rucProveedor ?? '-' }}</div>
          </div>
          <div class="field">
            <label>Serie</label>
            <div>{{ info.serie ?? '-' }}</div>
          </div>
          <div class="field">
            <label>Número</label>
            <div>{{ info.numero ?? '-' }}</div>
          </div>
          <div class="field">
            <label>VIN</label>
            <div>{{ info.vin ?? '-' }}</div>
          </div>
          <div class="field">
            <label>Importe total</label>
            <div>{{ info.importeTotal ?? '-' }}</div>
          </div>
          <hr *ngIf="!last" />
        </div>
      </ng-container>
      <ng-template #sinDatos>
        <p>No se encontraron datos para mostrar.</p>
      </ng-template>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="PROCESAR" (click)="onProcesar()"></button>
      </ng-template>
    </p-dialog>
  `
})
export class BillingpaymentUploadComponent {
  @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;
  @Output() parsed = new EventEmitter<VehiculoPdfInfo[]>();
  @Output() parseError = new EventEmitter<string>();
  vehiculosPdfInfo: VehiculoPdfInfo[] = [];
  mostrarResumen = false;

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
      this.vehiculosPdfInfo = results;
      this.mostrarResumen = true;
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
    const importeTotal = this.obtenerImporteTotal(text);

    return {
      archivo: file.name,
      rucProveedor: rucMatch?.[0] ?? null,
      serie: serie ? serie.trim() : null,
      numero: numero ? numero.trim() : null,
      vin,
      importeTotal
    };
  }

  private obtenerImporteTotal(texto: string): string | null {
    const matches = [...texto.matchAll(/(\d[\d.,]*)\s*\$/g)];
    if (!matches.length) {
      return null;
    }
    const valores = matches
      .map((match) => match[1])
      .map((valor) => ({ valor, numero: this.normalizarNumero(valor) }))
      .filter((item) => Number.isFinite(item.numero));
    if (!valores.length) {
      return null;
    }
    const mayor = valores.reduce((acc, item) => (item.numero > acc.numero ? item : acc));
    return `${mayor.valor} $`;
  }

  private normalizarNumero(valor: string): number {
    const limpio = valor.trim();
    if (!limpio) {
      return Number.NaN;
    }
    const tienePunto = limpio.includes('.');
    const tieneComa = limpio.includes(',');
    let normalizado = limpio;
    if (tienePunto && tieneComa) {
      const ultimoSeparador = Math.max(limpio.lastIndexOf('.'), limpio.lastIndexOf(','));
      const separadorDecimal = limpio[ultimoSeparador];
      normalizado = limpio
        .split('')
        .filter((char, index) => {
          if (char === '.' || char === ',') {
            return index === ultimoSeparador;
          }
          return true;
        })
        .join('');
      if (separadorDecimal === ',') {
        normalizado = normalizado.replace(',', '.');
      }
    } else if (tieneComa) {
      const partes = limpio.split(',');
      if (partes[1]?.length === 2) {
        normalizado = `${partes[0].replace(/\./g, '')}.${partes[1]}`;
      } else {
        normalizado = limpio.replace(/,/g, '');
      }
    } else if (tienePunto) {
      const partes = limpio.split('.');
      if (partes[1]?.length === 2) {
        normalizado = `${partes[0].replace(/,/g, '')}.${partes[1]}`;
      } else {
        normalizado = limpio.replace(/\./g, '');
      }
    }
    return Number.parseFloat(normalizado.replace(/,/g, ''));
  }

  onProcesar(): void {
    // TODO: agregar lógica de procesamiento
  }
}

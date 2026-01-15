import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DxDataGridModule } from 'devextreme-angular';
import * as XLSX from 'xlsx';
import { ApiService } from '../../core/api.service';
import { TopbarComponent } from '../../component/topbar/topbar.component';
import { TitleComponent } from '../../component/title/title.component';

interface Columna {
  field: string;
  header: string;
}

interface Proceso {
  nombre: string;
  columnas: Columna[];
}

@Component({
  selector: 'app-controlstock',
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectModule,
    ButtonModule,
    ProgressSpinnerModule,
    DxDataGridModule,
    TopbarComponent,
    TitleComponent
  ],
  templateUrl: './controlstock.component.html',
  styleUrl: './controlstock.component.css'
})
export class ControlstockComponent implements OnInit {
  procesosDisponibles: Proceso[] = [
    {
      nombre: 'PDI',
      columnas: [
        { field: 'IngresoConcesionario', header: 'INGRESO A CONCESIONARIO' },
        { field: 'Ubicacion', header: 'UBICACION' },
        { field: 'FechaRecojoCiclonHuapaya', header: 'FECHA DE RECOJO CICLON / HUAPAYA' },
        { field: 'DestinoProgramado', header: 'DESTINO PROGRAMADO' },
        { field: 'Transportista', header: 'TRANSPORTISTA' },
        { field: 'EstadoTransportista', header: 'ESTADO TRANSPORTISTA' }
      ]
    },
    {
      nombre: 'COMERCIAL Y TRAMITES',
      columnas: [
        { field: 'Sucursal', header: 'Sucursal' },
        { field: 'Vendedor', header: 'Solicitante' },
        { field: 'Ant', header: 'Ant.' },
        { field: 'Tef', header: 'TEF' },
        { field: 'Marca', header: 'Marca' },
        { field: 'ModeloVersion', header: 'ModeloVersion' },
        { field: 'Color', header: 'Color' },
        { field: 'Vin', header: 'VIN' },
        { field: 'NumeroMotor', header: 'Número Motor' },
        { field: 'Costo', header: 'COSTO' },
        { field: 'NumeroFacturaImportador', header: 'N° FACT. IMP.' },
        { field: 'FechaFacturaImportador', header: 'F. FACT. IMP.' },
        { field: 'FechaCancelacionImportador', header: 'FEC.CANC.IMP.' },
        { field: 'Anio', header: 'Año' },
        { field: 'Dua', header: 'DUA' },
        { field: 'FechaDua', header: 'Fecha DUA' },
        { field: 'FechaIngreso', header: 'Fec. Ingr' },
        { field: 'Estado', header: 'Estado' },
        { field: 'PorcentajeReserva', header: '%Res.' },
        { field: 'FechaFactura', header: 'Fec. Factura' },
        { field: 'Cancelacion', header: 'Cancelacion' },
        { field: 'Saldo', header: 'SALDO' },
        { field: 'DocVenta', header: 'DocVenta' },
        { field: 'Depositos', header: 'DEPOSITOS' },
        { field: 'AccesoriosJunto', header: 'ACCESORIOS' },
        { field: 'Rrpp', header: 'RRPP' },
        { field: 'Flete', header: 'FLETE' },
        { field: 'GastosAdministrativos', header: 'G.ADMIN.' },
        { field: 'Fletes', header: 'FLETES' },
        { field: 'DescripcionRuta', header: 'DESCRIPCION RUTA' },
        { field: 'FechasFacturaTransporte', header: 'FEC.FAC.TRANSPORT' },
        // { field: 'Transportistas', header: 'TRANSPORTISTAS' },
        { field: 'Facturas', header: 'FACTURAS' },
        //{ field: 'Doc', header: 'DOC' },
        { field: 'Cliente', header: 'CLIENTE' },
        { field: 'Vendedor', header: 'VENDEDOR' },
        { field: 'Evh', header: 'EVH' },
        { field: 'FechaEvh', header: 'FEC.ENTREGA' },
        { field: 'NroTitulo', header: 'TITULO' },
        { field: 'Placa', header: 'PLACA' }
      ]
    },
    {
      nombre: 'CONTROL COMERCIAL',
      columnas: [
        { field: 'GastosAdministrativosExtra', header: 'GASTOS ADMINISTRATIVOS' },
        { field: 'PvpNisiraSinAccesorios', header: 'PVP NISIRA SIN ACCESORIOS' },
        { field: 'CostoDealer', header: 'COSTO DEALER' },
        { field: 'FleteExtra', header: 'FLETE' },
        { field: 'FinanciamientoBono', header: 'FINANCIAMIENTO(BONO)' },
        { field: 'BonosTotales', header: 'BONOS TOTALES' },
        { field: 'TotalBonos', header: 'TOTAL BONOS' },
        { field: 'Margen', header: 'MARGEN' },
        { field: 'Utilidad', header: 'UTILIDAD' },
        { field: 'UtilidadPorcentaje', header: 'UTILIDAD %' },
        { field: 'PorcentajeUtilidadListaPrecios', header: '% UTILIDAD LISTA DE PRECIOS' },
        { field: 'SobreBajoMargen', header: 'SOBRE/BAJO MARGEN' }
      ]
    }
  ];

  procesosSeleccionados: Proceso[] = [];
  columnasVisibles: { proceso: string; columnas: Columna[] }[] = [];

  data: any[] = [];
  loadingVehiculos = true;

  constructor(private service: ApiService) {}

  ngOnInit(): void {
    this.cargarVehiculos();
  }

  cargarVehiculos() {
    this.loadingVehiculos = true;
    this.service.ListarVehiculosProcesos().subscribe({
      next: (res: any) => {
        this.data = this.normalizarVehiculos(res?.data ?? []);
        this.loadingVehiculos = false;
      },
      error: (err) => {
        console.error('Error al listar vehículos:', err);
        this.loadingVehiculos = false;
      }
    });
  }

  actualizarColumnas() {
    this.columnasVisibles = this.procesosSeleccionados.map((proceso) => ({
      proceso: proceso.nombre,
      columnas: proceso.columnas
    }));
  }

  exportarExcel() {
    const headers: string[] = [
      'EXISTENCIA',
      'SERIE',
      ...this.columnasVisibles.flatMap((grupo) => grupo.columnas.map((col) => col.header ?? col.field))
    ];

    const rows: any[][] = this.data.map((row) => {
      const fila: any[] = [];
      fila.push(row?.Existencia ?? '');
      fila.push(row?.IdSerie ?? '');
      this.columnasVisibles.forEach((grupo) => {
        grupo.columnas.forEach((col) => {
          fila.push(row?.[col.field] ?? '');
        });
      });
      return fila;
    });

    const aoa = [headers, ...rows];

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    XLSX.writeFile(wb, 'control-stock.xlsx');
  }

  private normalizarVehiculos(vehiculos: any[]): any[] {
    const camposEsperados = new Set<string>([
      'Existencia',
      'IdSerie',
      ...this.procesosDisponibles.flatMap((proceso) =>
        proceso.columnas.map((columna) => columna.field)
      )
    ]);

    return vehiculos.map((vehiculo) => {
      const resultado: Record<string, any> = {};
      const mapaNormalizado = new Map<string, any>();

      Object.entries(vehiculo ?? {}).forEach(([clave, valor]) => {
        mapaNormalizado.set(this.normalizarClave(clave), valor);
      });

      camposEsperados.forEach((campo) => {
        const claveNormalizada = this.normalizarClave(campo);
        resultado[campo] = mapaNormalizado.get(claveNormalizada);
      });

      return resultado;
    });
  }

  private normalizarClave(valor: string): string {
    return valor.toLowerCase().replace(/[\s._-]+/g, '');
  }
}

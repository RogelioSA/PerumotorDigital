import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../component/topbar/topbar.component';
import { TitleComponent } from '../../component/title/title.component';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AfterViewInit,ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { FileUpload } from 'primeng/fileupload';
import { ApiService } from '../../core/api.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';

import { DxDataGridModule } from 'devextreme-angular';
import { DxButtonModule } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';

import * as XLSX from 'xlsx';
import { HttpParams } from '@angular/common/http';
import { saveAs } from 'file-saver';
import * as FileSaver from 'file-saver';
import { forkJoin } from 'rxjs';
import { DrawerModule } from 'primeng/drawer';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeResourceUrl } from '@angular/platform-browser';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { CookieService } from 'ngx-cookie-service';
import MsgReader from '@kenjiuno/msgreader';
import { BillingpaymentUploadComponent, VehiculoPdfInfo } from './billingpayment-upload.component';
interface Product {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  price: number;
  quantity?: number;
  inventoryStatus?: string;
  category?: string;
  image?: string;
  rating?: number;
}
interface Carpeta {
  nombre: string;
  archivos: string[];
  files: File[]; // Para subir
  idArea?: string;
  srIgv?: number;
  regimen?: string;
  moneda?: string;
  idDocumento?: string;
  vin?: string | null;
}
@Component({
  selector: 'app-billingpayment',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    TitleComponent,
    CalendarModule,
    FormsModule,
    TableModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
    SelectModule,CardModule,FileUploadModule,DialogModule,
    FileUpload,ToastModule,
    ContextMenuModule,
    DxDataGridModule,
    DxButtonModule,DrawerModule,ProgressSpinnerModule,DropdownModule,ConfirmDialogModule,
    BillingpaymentUploadComponent
  ],
  providers: [MessageService,ConfirmationService],
  templateUrl: './billingpayment.component.html',
  styleUrl: './billingpayment.component.css'
})
export class BillingpaymentComponent implements AfterViewInit{
loadingDialog: boolean = false;
cuentasDisponibles: any[] = [];
sucursal: any[] = [];
mostrarSelectorCuentas: boolean = false;
cuentaSeleccionada: any = null;
filaEditandoCuenta: number | undefined;

centrosCostoDisponibles: any[] = [];
mostrarSelectorCentroCosto: boolean = false;
filaEditandoCentroCosto: number | undefined;
centroCostoSeleccionado: any = null;

validar = false;

  @ViewChild('dt') table!: Table;
  @ViewChild('fileUploader') fileUploader!: FileUpload;
  @ViewChild('vehiculosUpload') vehiculosUpload!: BillingpaymentUploadComponent;

  menuItems: MenuItem[] = [];

  vehiculosPdfInfo: VehiculoPdfInfo[] = [];


  seleccionados: any[] = [];

  mostrarCardCrear = false;


  mostrarCardSubir = false;
  mostrarTablaArchivos: boolean = false;
  mostrarTablaCarpetas: boolean = false;

  archivosCarpeta: any[] = [];

  estructuraCarpetas: any[] = [];
  carpetaSeleccionada: string = '';
  vehiculoSeleccionado: string | null = null;
  readonly stockSharepointUrl = 'https://perumotorsac.sharepoint.com/sites/COMERCIALPM/Documentos%20compartidos/Forms/AllItems.aspx?id=%2Fsites%2FCOMERCIALPM%2FDocumentos%20compartidos%2FFILES%20STOCK%202026%2FP26%2D009%2DGG%2FCOMPRA&viewid=b7b45ec2%2Dfaa4%2D4397%2Dadfa%2D5f15c082ea1e&newTargetListUrl=%2Fsites%2FCOMERCIALPM%2FDocumentos%20compartidos&viewpath=%2Fsites%2FCOMERCIALPM%2FDocumentos%20compartidos%2FForms%2FAllItems%2Easpx';
  dropActive = false;

  products: any[] = [];
  selectedProduct: any;
  selectedRows: any[] = [];
  bulkApprove: boolean = false;
  bulkSrIgv: string | null = null;
  bulkRegimen: string | null = null;
  bulkImpuestos: string | null = null;
  bulkDocumento: string | null = null;
  bulkMoneda: string | null = null;
  bulkRevCtb: string | null = null;
  bulkTipoMovimiento: string | null = null;
  bulkClasificacionLE: string | null = null;

  estructuraCarpeta: Carpeta[] = [];
  idEmpresa = '001';

  carpetasRaiz: any[] = [];
  cargandoArchivos: boolean = false;

  cargando: boolean = false;

  cargandoc: boolean = false;

  carpetaActual = { idCarpetaPadre: null, final: false, idCarpeta: null };
  regimen = [
    { idRegimen: '01', descripcion: 'Afecto' },
    { idRegimen: '02', descripcion: 'Afecto/Inafecto' },
    { idRegimen: '03', descripcion: 'Inafecto' }
  ];
  regimenSeleccionado: string = '';

  moneda = [
    { idMoneda: '01', descripcion: 'S/' },
    { idMoneda: '02', descripcion: '$' },
    { idMoneda: '03', descripcion: 'E' }
  ];

  docs = [
    { iddoc: 'FAC', descripcion: 'FAC', codigosunat: '01' },
    { iddoc: 'BOL', descripcion: 'BOL', codigosunat: '03' },
    { iddoc: 'NCR', descripcion: 'NCR', codigosunat: '07' },
    { iddoc: 'RHN', descripcion: 'RHN', codigosunat: 'R1' },
    { iddoc: 'BLA', descripcion: 'BLA', codigosunat: '' },
    { iddoc: 'CPA', descripcion: 'CPA', codigosunat: '' },
    { iddoc: 'INV', descripcion: 'INV', codigosunat: '' },
    { iddoc: 'ODC', descripcion: 'ODC', codigosunat: '' },
    { iddoc: 'RPA', descripcion: 'RPA', codigosunat: '' },
    { iddoc: 'SPB', descripcion: 'SPB', codigosunat: '' },
    { iddoc: 'TKT', descripcion: 'TKT', codigosunat: '' },
    { iddoc: 'FAT', descripcion: 'FAT', codigosunat: '' }
  ];
  monedaSeleccionado: string = '';

  impuestos = [
    { idImpuestos: '999', descripcion: '0', valor: 0 },
    { idImpuestos: '027', descripcion: '10%', valor: 10 },
    { idImpuestos: '003', descripcion: '18%', valor: 18 }
  ];
  impuestosSeleccionado: string = '';

  obs = [
    { idObs: '00', descripcion: '  ' },
    { idObs: '01', descripcion: 'APL.NRC' },
    { idObs: '02', descripcion: 'PEND SUSTENTO' },
    { idObs: '03', descripcion: 'PUB.ASUM' },
    { idObs: '04', descripcion: 'PUB.REFAC' },
    { idObs: '05', descripcion: 'PUB.GAR' }
  ];
  obsSeleccionado: string = '';

  rev = [
    { idRev: '01', descripcion: 'CONFORME' },
    { idRev: '02', descripcion: 'PEND FAC' },
    { idRev: '03', descripcion: 'OBSERVADO' }
  ];
  revSeleccionado: string = '';

  igv = [
    { idigv: '1', descripcion: 'NA' },
    { idigv: '2', descripcion: 'DET' },
    { idigv: '3', descripcion: 'RET' },
    { idigv: '4', descripcion: 'RE4TA' }
  ];
  igvSeleccionado: string = '';

  ctb = [
    { idCtb: '', descripcion: '' },
    { idCtb: '01', descripcion: 'PROV CTB' },
    { idCtb: '02', descripcion: 'RECHAZADO' },
    { idCtb: '03', descripcion: 'CERRADO' },
    { idCtb: '04', descripcion: 'PROV CAJA CHICA' },
    { idCtb: '05', descripcion: 'PROV EAR VARIOS' },
    { idCtb: '06', descripcion: 'PROV EAR VIATICOS' },
    { idCtb: '07', descripcion: 'PROV ERT' },
    { idCtb: '08', descripcion: 'PROV TARJETA CREDITO' },
    { idCtb: '09', descripcion: 'PROV APR' }
  ];
  ctbSeleccionado: string = '';

  area: any[] = [];
  tipoDet: any[] = [];
  tipoMovimiento: any[] = [];
  clasificacionLE: any[] = [];

  areaSeleccionado: string = '';
  tipoDetSeleccionado: string = '';
  tipoMovimientoSeleccionado: string = '';
  clasificacionLESeleccionado: string = '';

  mostrarVisor: boolean = false;
  archivoSeleccionadoUrl: string = '';
  archivoSeleccionadoNombre: string = '';
  safeUrl: SafeResourceUrl | null = null;
  indiceArchivoActual: number = 0;
  msgPreviewUrl: string | null = null;


  mostrarDialogAprovisionar: boolean = false;
  ordenesCompra: any[] = [];
  ordenSeleccionada: string | null = null;
  datosTabla: any[] = [];
  dialogoVisible: boolean = false;
  tipoSeleccionado: string = '';
  tituloDialogo: string = '';
  seleccionadosTabla1: any[] = [];
  seleccionadosTabla2: any[] = [];
  documentosPendientes: any[] = [];
  detallesTabla2: any[] = [];

  previousSeleccionados: any[] = [];
  productosSeleccionados: any[] = [];
  mostrarTablaSeleccionados: boolean = false;
  documentosConfirmados: any[] = [];

  mostrarCardCrearCarpeta: boolean = false;

  mostrarAyudaFinal: boolean = false;

  productoSeleccionadoResumen: any = null;
  cargandoArchivo: boolean = false;
  mostrarHistorial: boolean = false;
  historialCambios: any[] = [];

  constructor(private apiService: ApiService,
              private messageService: MessageService,
              private route: ActivatedRoute,
              private sanitizer: DomSanitizer,
              private router: Router,
              private confirmationService: ConfirmationService,
              private cookieService: CookieService) {

    }

  nuevoDocumento = {
    ruc: '',
    serie: '',
    numero: ''
  };


  statuses!: any[];

  clonedProducts: { [s: string]: Product } = {};

  productoEditando: Product | null = null; // Añadido para controlar la edición
  tituloDialogAprovisionar: string = '';
  idCarpeta: string = '';
  generarDeshabilitado: boolean = false;
  generarEnProceso: boolean = false;

  nombreCarpeta: string = '';
  final: boolean = false;
  carpetaRaiz: boolean = true;

  // Variables ocultas (obtenidas automáticamente)
  idCarpetaPadre: number = 0;
  usuarioCreador: string = '';



  ngAfterViewInit() {
    // Esperamos un poco a que se renderice el input interno
    setTimeout(() => {
      const input = this.fileUploader.el.nativeElement.querySelector('input[type="file"]');
      if (input) {
        input.setAttribute('webkitdirectory', '');
        input.setAttribute('directory', '');
      }
    }, 100);
  }

  ngOnInit() {
    const usuario = this.cookieService.get('usuario');
    if (!usuario) {
      this.router.navigate(['']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      this.idCarpetaPadre = +params['idcarpeta'];

      const idCarpeta = params['idcarpeta'] || params['idCarpeta'];
      const idDocumento = params['iddocumento'] || params['idDocumento'];

      if (idCarpeta && idDocumento) {
        this.mostrarTablaArchivos = true;
        this.mostrarTablaCarpetas = true;
        this.carpetaSeleccionada = idDocumento;
        this.apiService.listarArchivosCarpeta(idDocumento.trim()).subscribe({
          next: (response) => {
            this.archivosCarpeta = Array.isArray(response) ? response : [response];
            this.mostrarTablaArchivos = true;
            this.mostrarTablaCarpetas = true;
           // this.seleccionarArchivoInicial();
          },
          error: (err) => {
            console.error('Error al obtener archivos desde la URL:', err);
          }
        });
        return;
      }

      // Lógica anterior si solo hay idCarpeta
      if (idCarpeta) {
        this.apiService.listarCarpeta(idCarpeta).subscribe((res) => {
          // Verifico si carpetasRaiz está vacío antes de asignar
          const estabaVacio = !this.carpetasRaiz || this.carpetasRaiz.length === 0;

          this.carpetasRaiz = res.data;

          if (estabaVacio && this.carpetasRaiz.length > 0) {
            this.verDetalle(this.carpetasRaiz[0].idCarpeta);
          }
        });
      } else {
        this.cargarCarpetas();
      }

    });
    this.usuarioCreador = usuario;

    this.setupLicenseObserver();

    this.apiService.opcionArea().subscribe(res => {
    this.area = res.data;
  });

  this.apiService.opciontipoDet().subscribe(res => {
    this.tipoDet = res.data;
  });

  this.apiService.opcionTipoMovimiento().subscribe(res => {
    this.tipoMovimiento = res.data;
  });

  this.apiService.opcionClasificacionLE().subscribe(res => {
    this.clasificacionLE = res.data;
  });

  this.apiService.listarSucursales().subscribe(res => {
    this.sucursal = res.data;
  });
  }

  abrirSubidaVehiculos(): void {
    this.vehiculosUpload?.openDialog();
  }

  onVehiculosParsed(vehiculos: VehiculoPdfInfo[]): void {
    this.vehiculosPdfInfo = vehiculos;
    vehiculos.forEach((vehiculo) => {
      console.log('RUC:', vehiculo.rucProveedor, 'Serie:', vehiculo.serie, 'Número:', vehiculo.numero);
    });
  }

  procesarVehiculos(vehiculos: VehiculoPdfInfo[]): void {
    const estructura = vehiculos
      .map((vehiculo): Carpeta | null => {
        const idCarpeta = this.buildVehiculoFolderId(vehiculo);
        if (!idCarpeta) {
          return null;
        }
        return {
          nombre: idCarpeta,
          archivos: [vehiculo.archivo],
          files: [vehiculo.file],
          idArea: '012',
          srIgv: 1,
          regimen: '01',
          moneda: '02',
          idDocumento: 'FAC',
          vin: vehiculo.vin
        };
      })
      .filter((carpeta): carpeta is Carpeta => carpeta !== null);

    if (!estructura.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos completos',
        detail: 'No se encontraron vehículos con RUC, serie y número válidos.'
      });
      return;
    }

    this.estructuraCarpeta = estructura;
    this.estructuraCarpetas = estructura;
    this.subirCarpetas();
  }

  private buildDocumentoMetadata(carpeta: Partial<Carpeta>): {
    idArea?: string;
    srIgv?: number;
    regimen?: string;
    moneda?: string;
    idDocumento?: string;
    vin?: string | null;
  } | undefined {
    const metadata: {
      idArea?: string;
      srIgv?: number;
      regimen?: string;
      moneda?: string;
      idDocumento?: string;
      vin?: string | null;
    } = {};

    if (carpeta.idArea) {
      metadata.idArea = carpeta.idArea;
    }
    if (carpeta.srIgv !== undefined && carpeta.srIgv !== null) {
      metadata.srIgv = carpeta.srIgv;
    }
    if (carpeta.regimen) {
      metadata.regimen = carpeta.regimen;
    }
    if (carpeta.moneda) {
      metadata.moneda = carpeta.moneda;
    }
    if (carpeta.idDocumento) {
      metadata.idDocumento = carpeta.idDocumento;
    }
    if (carpeta.vin) {
      metadata.vin = carpeta.vin;
    }

    return Object.keys(metadata).length ? metadata : undefined;
  }

  onVehiculosParseError(message: string): void {
    console.error('Error al leer PDFs:', message);
  }

  private buildVehiculoFolderId(vehiculo: VehiculoPdfInfo): string | null {
    const ruc = vehiculo.rucProveedor?.trim();
    const serie = vehiculo.serie?.trim();
    const numero = vehiculo.numero?.trim();
    if (!ruc || !serie || !numero) {
      return null;
    }
    return `${ruc}_${serie}-${numero}`.replace(/\s+/g, '');
  }

  cargarCarpetas() {
    this.apiService.listarCarpeta('').subscribe((res) => {
      this.carpetasRaiz = res.data;
    });
  }

  setupLicenseObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'DX-LICENSE') {
            (node as HTMLElement).remove();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  onRightClick(event: MouseEvent, idCarpeta: any, contextMenu: any) {
    event.preventDefault();
    event.stopPropagation(); // Evita que el evento se propague

    this.menuItems = [
      {
        label: 'Ver detalles',
        icon: 'pi pi-search',
        command: () => this.verArchivos(idCarpeta)
      },
            {
        label: 'Aprobar',
        icon: 'pi pi-check',
        command: () => {
          // Suponiendo que tienes el idCarpeta del documento a aprobar (ejemplo: this.selectedIdCarpeta)
          const documento = this.products.find(p => p.idCarpeta === idCarpeta);

          if (!documento) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Aviso',
              detail: 'Debe seleccionar un documento para aprobar.'
            });
            return;
          }

          // Puedes incluir confirmación si quieres
          this.confirmationService.confirm({
            message: '¿Estás seguro que deseas aprobar este documento?',
            header: 'Confirmar aprobación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
              this.aprobarDocumento(documento);
            }
          });
        }
      },
      {
        label: 'Provisionar',
        icon: 'pi pi-file',
        command: () => {

        this.idCarpeta = idCarpeta;

        const carpeta = this.products.find(p => p.idCarpeta === idCarpeta);
        const doc = carpeta?.idCobrarPagarDoc;
        if (doc && doc !== 'null' && doc !== 'undefined' && doc.trim() !== '') {
          this.generarDeshabilitado = true;
          this.mostrarDialogAprovisionar = false;

          this.messageService.add({
            severity: 'error',
            summary: 'No permitido',
            detail: 'Este documento ya esta provisionado, revisar el ERP.'
          });

          return;
        }

        if (!this.validarCamposAprovisionar(carpeta)) {
          return;
        }

        // Si no tiene ID, permite abrir el diálogo
        this.generarDeshabilitado = false;
        this.tituloDialogAprovisionar = `ID Carpeta: ${idCarpeta}`;
        this.cargarResumenProducto(idCarpeta);
        this.listarDigitalesProvision(idCarpeta);
        this.mostrarDialogAprovisionar = true;
        this.mostrarVisor = false;
        }
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-eraser',
        command: () => {
          const documento = this.products.find(p => p.idCarpeta === idCarpeta);

          if (documento?.idCobrarPagarDoc) {
            this.messageService.add({
              severity: 'warn',
              summary: 'No se puede eliminar',
              detail: 'Este documento está vinculado a Cobrar/Pagar y no puede eliminarse.'
            });
            return;
          }

          this.confirmationService.confirm({
            message: '¿Estás segura de que deseas eliminar este documento?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
              this.apiService.eliminarDocumento(this.idEmpresa, idCarpeta).subscribe({
                next: () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Eliminado correctamente.'
                  });
                  // Refrescar tabla según condición
                  if (!this.idCarpetaPadre || this.idCarpetaPadre === 0) {
                    this.apiService.listarCarpeta('').subscribe((res) => {
                      this.carpetasRaiz = res.data;
                    });
                  } else {
                    this.verDetalle(this.idCarpetaPadre);
                  }
                },
                error: (err) => {
                  console.error('Error al eliminar documento', err);
                }
              });
            }
          });
        }
      },

      {
        label: 'Ver historial',
        icon: 'pi pi-bars',
        command: () => this.mostrarHistorialDialog(idCarpeta)
      },
      {
        label: 'Validación SUNAT',
        icon: 'pi pi-search',
        command: () => {
          const idCarpetaLimpia = String(idCarpeta ?? '').replace(/\s+/g, '');
          const partes = idCarpetaLimpia.split('_');
          const ruc_emisor = partes[0];
          const parteSerieNumero = partes[1] ?? '';
          const [serie_documento, numero_documentoRaw] = parteSerieNumero.split('-') ?? [];

          const rucValido = /^\d{11}$/.test(ruc_emisor ?? '');
          const serieValida = /^[A-Za-z0-9]{1,4}$/.test(serie_documento ?? '');
          const numeroValido = /^\d+$/.test(numero_documentoRaw ?? '');

          if (!rucValido || !serieValida || !numeroValido) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error en formato',
              detail: 'formato de carpeta inválido'
            });
            return;
          }

          const numero_documento = numero_documentoRaw.trim();
          const letraSerie = serie_documento[0];
          let codigo_tipo_documento = '';

          // if (letraSerie ==='F') {
          //   codigo_tipo_documento = '01';
          // } else if (letraSerie === 'B' ) {
          //   codigo_tipo_documento = '03';
          // } else {
          //   this.messageService.add({
          //     severity: 'error',
          //     summary: 'Tipo desconocido',
          //     detail: `Letra de serie no reconocida: ${letraSerie}`
          //   });
          //   return;
          // }

          const documento = this.products.find(p => String(p.idCarpeta) === String(idCarpeta));

          if (!documento) {
            this.messageService.add({
              severity: 'error',
              summary: 'No encontrado',
              detail: `No se encontró el documento con idCarpeta: ${idCarpeta}`
            });
            return;
          }

          const documentoSeleccionado = this.docs.find(d => d.iddoc === documento.idDocumento);

          if (!documentoSeleccionado) {
            this.messageService.add({
              severity: 'error',
              summary: 'Tipo desconocido',
              detail: `Se debe especificar T.DOC`
            });
            return;
          }
          const fecha_emision_original = documento.fechaEmision;
          const total = documento.importeBruto;

          if (!fecha_emision_original || !total) {
            const faltan = [];
            if (!fecha_emision_original) faltan.push('fecha de emisión');
            if (!total) faltan.push('importe bruto');
            this.messageService.add({
              severity: 'warn',
              summary: 'Campos faltantes',
              detail: `Faltan ${faltan.join(', ')} para enviar el documento ${idCarpeta}`
            });
            return;
          }

          const fechaObj = new Date(fecha_emision_original);
          const fecha_emision = `${fechaObj.getDate().toString().padStart(2, '0')}/${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}/${fechaObj.getFullYear()}`;
          const totalFormateado = Number(total).toFixed(2);
          codigo_tipo_documento = (documentoSeleccionado.codigosunat || '').trim();

          const payload = {
            ruc_emisor,
            codigo_tipo_documento,
            serie_documento,
            numero_documento,
            fecha_emision,
            total: totalFormateado
          };

          this.apiService.enviarAFactiliza(payload).subscribe({
            next: (res) => {
              const estado = res?.data?.comprobante_estado_codigo;
              const validado = estado === '1';

              if (validado) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'SUNAT',
                  detail: `Documento ${idCarpeta} validado por SUNAT.`
                });
              } else {
                this.messageService.add({
                  severity: 'warn',
                  summary: 'No validado',
                  detail: `Documento ${idCarpeta} NO está validado por SUNAT`
                });
              }
              const datosParaEditar = {
                ...documento,
                idEmpresa: this.idEmpresa,
                idCarpeta: idCarpeta,
                validado: validado
              };
              // Actualizar backend
              this.apiService.editarDocumento(datosParaEditar).subscribe({
                next: () => {
                  // También actualizar localmente en this.products
                  const index = this.products.findIndex(p => String(p.idCarpeta) === String(idCarpeta));
                  if (index !== -1) {
                    this.products[index].validado = validado;
                  }
                  console.log('Documento actualizado correctamente');
                },
                error: (err) => {
                  console.error('Error al actualizar el documento', err);
                }
              });

              console.log('ID carpeta validado:', idCarpeta);
            },
            error: (err) => {
              console.error('Error al enviar a verificar:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error de envío',
                detail: `No se pudo enviar el documento ${idCarpeta} a verificar.`
              });
            }
          });
        }
      }


    ];

    // Usamos el componente directamente pasado como parámetro
    contextMenu.show(event);

    // Opcional: prevenir el scroll
    const container = event.currentTarget as HTMLElement;
    container.addEventListener('scroll', this.preventScroll, { passive: false });
    setTimeout(() => {
      container.removeEventListener('scroll', this.preventScroll);
    }, 100);
  }

  private preventScroll(e: Event) {
      e.preventDefault();
      e.stopPropagation();
  }

  onSelectionChanged(event: any) {
    this.selectedRows = event?.selectedRowsData ?? [];
  }

  aplicarAccionesMasivas() {
    if (!this.selectedRows.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Debe seleccionar al menos un documento.'
      });
      return;
    }

    const hayAcciones = this.bulkApprove || this.bulkSrIgv || this.bulkRegimen || this.bulkImpuestos || this.bulkDocumento || this.bulkMoneda || this.bulkRevCtb || this.bulkTipoMovimiento || this.bulkClasificacionLE;
    if (!hayAcciones) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Debe seleccionar al menos una acción masiva.'
      });
      return;
    }

    const totalSeleccionados = this.selectedRows.length;
    this.confirmationService.confirm({
      message: `Confirme que realiza la modificación de ${totalSeleccionados} documentos seleccionados`,
      header: 'Confirmar acciones masivas',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        const estadoAprobado = this.bulkApprove ? this.obtenerEstadoAprobado() : null;
        const actualizaciones = this.selectedRows
          .map((documento) => this.construirActualizacionMasiva(documento, estadoAprobado))
          .filter((resultado) => resultado.changed)
          .map((resultado) => resultado.updated);

        if (!actualizaciones.length) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'No hay cambios para aplicar.'
          });
          return;
        }

        this.cargandoc = true;
        forkJoin(actualizaciones.map((documento) => this.apiService.editarDocumento(documento))).subscribe({
          next: () => {
            this.cargandoc = false;
            actualizaciones.forEach((documento) => {
              const index = this.products.findIndex(
                (producto) => String(producto.idCarpeta) === String(documento.idCarpeta)
              );
              if (index !== -1) {
                this.products[index] = {
                  ...this.products[index],
                  ...documento
                };
              }
            });
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Operaciones masivas aplicadas correctamente.'
            });
          },
          error: (err) => {
            this.cargandoc = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron aplicar las operaciones masivas.'
            });
            console.error('Error al aplicar acciones masivas:', err);
          }
        });
      }
    });
  }

  private construirActualizacionMasiva(documento: any, estadoAprobado: string | null) {
    const actualizado = { ...documento };
    let changed = false;

    if (this.bulkSrIgv) {
      actualizado.srIgv = this.bulkSrIgv;
      changed = true;
    }
    if (this.bulkRegimen) {
      actualizado.regimen = this.bulkRegimen;
      changed = true;
    }
    if (this.bulkImpuestos) {
      actualizado.impuestos = this.bulkImpuestos;
      changed = true;
    }
    if (this.bulkDocumento) {
      actualizado.idDocumento = this.bulkDocumento;
      changed = true;
    }
    if (this.bulkMoneda) {
      actualizado.moneda = this.bulkMoneda;
      changed = true;
    }
    if (this.bulkRevCtb) {
      actualizado.revCtb = this.bulkRevCtb;
      changed = true;
    }
    if (this.bulkTipoMovimiento) {
      actualizado.tipoMovimiento = this.bulkTipoMovimiento;
      changed = true;
    }
    if (this.bulkClasificacionLE) {
      actualizado.clasificacionLe = this.bulkClasificacionLE;
      changed = true;
    }
    if (estadoAprobado) {
      actualizado.estado = estadoAprobado;
      changed = true;
    }

    return { updated: actualizado, changed };
  }

  private obtenerEstadoAprobado(): string {
    const usuario = this.cookieService.get('usuario') || 'Usuario';
    return `APROBADO ${usuario}`;
  }

  private aprobarDocumento(documento: any) {
    const estadoAprobado = this.obtenerEstadoAprobado();
    const datosParaEditar = {
      ...documento,
      estado: estadoAprobado
    };

    this.cargandoc = true;
    this.apiService.editarDocumento(datosParaEditar).subscribe({
      next: () => {
        this.cargandoc = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento aprobado correctamente.'
        });

        const index = this.products.findIndex(
          (producto) => String(producto.idCarpeta) === String(documento.idCarpeta)
        );
        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            estado: estadoAprobado
          };
        }
      },
      error: (err) => {
        this.cargandoc = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aprobar el documento.'
        });
        console.error('Error al aprobar documento:', err);
      }
    });
  }
  onRowEditInit(product: Product) {
    // Si ya hay una fila editándose, cancela la anterior
    if (this.productoEditando && this.productoEditando.id !== product.id) {
      const index = this.products.findIndex(p => p.id === this.productoEditando?.id);
      this.onRowEditCancel(this.productoEditando, index);
    }

    // Guardas copia por si cancela
    this.clonedProducts[product.id as string] = { ...product };
    this.productoEditando = product;
  }


  onRowEditSave(product: Product) {
    if (product.price > 0) {
      delete this.clonedProducts[product.id as string];
      this.productoEditando = null;
    }
  }

  onRowEditCancel(product: Product, index: number) {
    this.products[index] = this.clonedProducts[product.id as string];
    delete this.clonedProducts[product.id as string];
    this.productoEditando = null;
  }

  aplicarFormatoNumero() {
    this.nuevoDocumento.numero = this.obtenerNumeroFormateado(this.nuevoDocumento.numero);
  }

  obtenerNumeroFormateado(numero: string): string {
    const numeroLimpio = (numero || '').trim();

    if (!numeroLimpio) {
      return '';
    }

    if (numeroLimpio.length < 7) {
      return numeroLimpio.padStart(7, '0');
    }

    return numeroLimpio;
  }

  crearDocumento() {
    const numeroFormateado = this.obtenerNumeroFormateado(this.nuevoDocumento.numero);

    // Crear idCarpeta (ej. RUC_SERIE-NUMERO)
    const idCarpeta = `${this.nuevoDocumento.ruc.trim()}_${this.nuevoDocumento.serie.trim()}-${numeroFormateado}`;

    // Obtener periodo actual (ej. 202505)
    const now = new Date();
    const periodo = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // Carpeta padre
    const idCarpetaPadre: number = this.carpetaActual.idCarpeta!;
    const usuarioCreacion: string = this.cookieService.get('usuario') || 'Usuario';

    // Verificar si ya existe
    this.apiService.existeDocumento(this.idEmpresa, idCarpeta).subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Ya existe, no se crea
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Ya existe un documento con esta carpeta'
          });
        } else {
          // No existe, se crea
          this.apiService.crearDocumento(this.idEmpresa, idCarpeta, periodo, idCarpetaPadre,usuarioCreacion).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Documento creado correctamente'
              });
              this.cargando = true;
              this.mostrarCardCrear = false;
              this.nuevoDocumento = { ruc: '', serie: '', numero: '' };
              const idCarpetaDesdeUrl = this.route.snapshot.queryParamMap.get('idcarpeta') || this.route.snapshot.queryParamMap.get('idCarpeta');

            if (idCarpetaDesdeUrl) {
              this.apiService.filtrarDocumentos(idCarpetaDesdeUrl).subscribe({

                next: (res) => {
                  this.products = res.data;
                  this.mostrarTablaCarpetas = true;
                  this.cargando = false;
                },
                error: (err) => {
                  console.error('Error al filtrar documentos:', err);
                }
              });
            }
            },
            error: (err) => {
              console.error('Error al crear documento:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo crear el documento'
              });
              this.cargando = false;
            }
          });
        }
      },
      error: (err) => {
        console.error('Error al verificar existencia del documento:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo verificar si el documento ya existe'
        });
      }
    });
  }


  cerrarCardCrear() {
    this.mostrarCardCrear = false;
  }

  subirArchivos(event: any) {
    this.messageService.add({
      severity: 'success',
      summary: 'Subida exitosa',
      detail: 'Archivos subidos correctamente'
    });
    this.cerrarCardSubir();
  }

  cerrarCardSubir() {
    this.mostrarCardSubir = false;
    this.estructuraCarpetas = [];
  }


  descargarExcel() {
    const idCarpeta = this.route.snapshot.queryParamMap.get('idcarpeta') || '';

    forkJoin({
      documentos: this.apiService.filtrarDocumentos(idCarpeta),
      areas: this.apiService.opcionArea(),
      tipoDet: this.apiService.opciontipoDet(),
      tipoMov: this.apiService.opcionTipoMovimiento(),
      clasificacion: this.apiService.opcionClasificacionLE()
    }).subscribe(({ documentos, areas, tipoDet, tipoMov, clasificacion }) => {
      const data = documentos.data.map((doc: any) => {
        const areaId = String(doc.idArea ?? '').trim();
        //const areaDesc = areas.data.find((a: any) => String(a.idArea ?? '').trim() === areaId)?.descripcion || areaId;
        const areaDesc = areas.data.find((a: any) => {
        const areaValue = String(a.id ?? a.idArea ?? a.codigo ?? '').trim();
        return areaValue === areaId;
        })?.descripcion || areaId;
        const revDesc = this.rev.find(r => r.idRev === doc.revControl)?.descripcion || '';
        const igvDesc = this.igv.find(i => i.idigv === String(doc.srIgv))?.descripcion || '';
        const tipoDetDesc = tipoDet.data.find((t: any) => t.idTipoDet === doc.tipoDet)?.descripcion || '';
        const obsDesc = this.obs.find(o => o.idObs === doc.onsContable)?.descripcion || '';
        const regimenDesc = this.regimen.find(r => r.idRegimen === doc.regimen)?.descripcion || '';
        const impDesc = this.impuestos.find(i => i.idImpuestos === String(doc.impuestos))?.descripcion || '';
        const monedaDesc = this.moneda.find(m => m.idMoneda === doc.moneda?.trim())?.descripcion || '';
        const tipoMovDesc = tipoMov.data.find((t: any) => t.idTipoMov === doc.tipoMovimiento)?.descripcion || '';
        const clasDesc = clasificacion.data.find((c: any) => c.idClasificacionLE === doc.clasificacionLe?.trim())?.descripcion || '';

        const enlace = `${window.location.origin}/billingpayment?idCarpeta=${doc.idCarpetaPadre}&idDocumento=${doc.idCarpeta?.trim()}`;
        const fechaEmisionSource = doc.fechaEmision ?? doc.FechaEmision;
        const fechaVencimientoSource = doc.fechaVencimiento ?? doc.fechaVcto;
        const fechaPagoSource = doc.fechaPago ?? doc.FechaPago;
        const fechaProgSource = doc.fechaProg ?? doc.FechaProg;
        const fechaEmisionExcel = this.coerceExcelDate(fechaEmisionSource);
        const fechaVencimientoExcel = this.coerceExcelDate(fechaVencimientoSource);
        const fechaPagoExcel = this.coerceExcelDate(fechaPagoSource);
        const fechaProgExcel = this.coerceExcelDate(fechaProgSource);
        return {
          ...doc,
          idArea: areaDesc,
          revControl: revDesc,
          srIgv: igvDesc,
          tipoDet: tipoDetDesc,
          onsContable: obsDesc,
          regimen: regimenDesc,
          impuestos: impDesc,
          moneda: monedaDesc,
          tipoMovimiento: tipoMovDesc,
          clasificacionLe: clasDesc,
          enlace,
          fechaEmision: doc.fechaEmision ? fechaEmisionExcel : doc.fechaEmision,
          FechaEmision: doc.FechaEmision ? fechaEmisionExcel : doc.FechaEmision,
          fechaVencimiento: doc.fechaVencimiento ? fechaVencimientoExcel : doc.fechaVencimiento,
          fechaVcto: doc.fechaVcto ? fechaVencimientoExcel : doc.fechaVcto,
          fechaPago: doc.fechaPago ? fechaPagoExcel : doc.fechaPago,
          FechaPago: doc.FechaPago ? fechaPagoExcel : doc.FechaPago,
          fechaProg: doc.fechaProg ? fechaProgExcel : doc.fechaProg,
          FechaProg: doc.FechaProg ? fechaProgExcel : doc.FechaProg
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data, { cellDates: true });
      const worksheetRange = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
      if (worksheetRange) {
        const headerRow = worksheetRange.s.r;
        const dateHeaders = [
          'fechaEmision',
          'FechaEmision',
          'fechaVencimiento',
          'fechaVcto',
          'fechaPago',
          'FechaPago',
          'fechaProg',
          'FechaProg'
        ];
        const dateColumnIndexes = dateHeaders
          .map(header => this.getWorksheetColumnIndex(worksheet, headerRow, header))
          .filter((index): index is number => index !== null);
        if (dateColumnIndexes.length > 0) {
          for (let r = headerRow + 1; r <= worksheetRange.e.r; r += 1) {
            dateColumnIndexes.forEach(c => {
              const cellAddress = XLSX.utils.encode_cell({ r, c });
              const cell = worksheet[cellAddress];
              if (!cell) {
                return;
              }
              if (cell.v instanceof Date) {
                worksheet[cellAddress] = {
                  t: 'd',
                  v: cell.v,
                  z: 'yyyy-mm-dd'
                };
                return;
              }
              if (typeof cell.v === 'number') {
                worksheet[cellAddress] = {
                  t: 'n',
                  v: cell.v,
                  z: 'yyyy-mm-dd'
                };
              }
            });
          }
        }
        const enlaceColumnIndex = this.getWorksheetColumnIndex(worksheet, headerRow, 'enlace');
        if (enlaceColumnIndex !== null) {
          for (let r = headerRow + 1; r <= worksheetRange.e.r; r += 1) {
            const cellAddress = XLSX.utils.encode_cell({ r, c: enlaceColumnIndex });
            const cell = worksheet[cellAddress];
            if (cell?.v) {
              worksheet[cellAddress] = {
                t: 's',
                v: cell.v,
                l: { Target: String(cell.v), Tooltip: String(cell.v) }
              };
            }
          }
        }
      }
      const workbook = { Sheets: { 'Documentos': worksheet }, SheetNames: ['Documentos'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'documentos.xlsx');
    });
  }

  private coerceExcelDate(value: unknown): number | string {
    if (!value) {
      return '';
    }
    const dateParts = this.extractDateParts(value);
    if (!dateParts) {
      return String(value).trim();
    }
    return this.toExcelSerial(dateParts.year, dateParts.month, dateParts.day);
  }

  private extractDateParts(
    value: unknown
  ): { year: number; month: number; day: number } | null {
    if (value instanceof Date) {
      return {
        year: value.getFullYear(),
        month: value.getMonth(),
        day: value.getDate()
      };
    }
    const valueString = String(value).trim();
    const dateOnlyMatch = valueString.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (dateOnlyMatch) {
      return {
        year: Number(dateOnlyMatch[1]),
        month: Number(dateOnlyMatch[2]) - 1,
        day: Number(dateOnlyMatch[3])
      };
    }
    const dateTimeMatch = valueString.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[T\s].*)?$/);
    if (dateTimeMatch) {
      return {
        year: Number(dateTimeMatch[1]),
        month: Number(dateTimeMatch[2]) - 1,
        day: Number(dateTimeMatch[3])
      };
    }
    const dateValue = new Date(valueString);
    if (!Number.isNaN(dateValue.getTime())) {
      return {
        year: dateValue.getFullYear(),
        month: dateValue.getMonth(),
        day: dateValue.getDate()
      };
    }
    return null;
  }

  private toExcelSerial(year: number, month: number, day: number): number {
    const utcDate = Date.UTC(year, month, day);
    const excelEpoch = Date.UTC(1899, 11, 30);
    return (utcDate - excelEpoch) / 86400000;
  }

  private getWorksheetColumnIndex(
    worksheet: XLSX.WorkSheet,
    headerRow: number,
    headerName: string
  ): number | null {
    const worksheetRange = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
    if (!worksheetRange) {
      return null;
    }
    for (let c = worksheetRange.s.c; c <= worksheetRange.e.c; c += 1) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c })];
      if (headerCell?.v === headerName) {
        return c;
      }
    }
    return null;
  }



  manejarArchivos(event: any) {
    const archivos: FileList = event.target.files;
    const archivosArray: File[] = Array.from(archivos);

    archivosArray.forEach(archivo => {
      console.log('Archivo:', archivo.webkitRelativePath || archivo.name, 'Tipo:', archivo.type);
      // Aquí puedes hacer lo que desees con los archivos, como subirlos a un backend
    });
  }

  leerCarpetas(event: any) {
    const archivos = event.files;
    const nuevasCarpetas: { [key: string]: string[] } = {};

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      const ruta = archivo.webkitRelativePath || archivo.name;
      const partes = ruta.split('/');
      const nombreCarpeta = partes[0];

      if (!nuevasCarpetas[nombreCarpeta]) {
        nuevasCarpetas[nombreCarpeta] = [];
      }

      nuevasCarpetas[nombreCarpeta].push(partes.slice(1).join('/'));
    }

    const carpetasConvertidas = Object.keys(nuevasCarpetas).map(nombre => ({
      nombre,
      archivos: nuevasCarpetas[nombre]
    }));

    this.estructuraCarpetas = [...this.estructuraCarpetas, ...carpetasConvertidas];
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    const items = event.dataTransfer?.items;

    if (items) {
      const nuevasCarpetas: { [key: string]: { archivos: string[], files: File[] } } = {};

      const promesas = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry?.();
        if (item && item.isDirectory) {
          promesas.push(this.readDirectory(item, nuevasCarpetas));
        }
      }

      Promise.all(promesas).then(() => {
        const estructura = Object.keys(nuevasCarpetas).map(nombre => ({
          nombre,
          archivos: nuevasCarpetas[nombre].archivos,
          files: nuevasCarpetas[nombre].files
        }));

        this.estructuraCarpetas = estructura;
        this.estructuraCarpeta = estructura; // 🛠️ Aquí sí se llena para el upload
      });
    }
  }


  readDirectory(item: any, carpetaMap: { [key: string]: { archivos: string[], files: File[] } }): Promise<void> {
    return new Promise((resolve) => {
      const reader = item.createReader();
      reader.readEntries((entries: any[]) => {
        const promises = entries.map(entry => {
          if (entry.isFile) {
            return new Promise<void>((res) => {
              entry.file((file: File) => {
                const carpetaNombre = item.name;
                if (!carpetaMap[carpetaNombre]) {
                  carpetaMap[carpetaNombre] = { archivos: [], files: [] };
                }
                carpetaMap[carpetaNombre].archivos.push(file.name);
                carpetaMap[carpetaNombre].files.push(file);
                res();
              });
            });
          } else if (entry.isDirectory) {
            return this.readDirectory(entry, carpetaMap);
          } else {
            return Promise.resolve();
          }
        });

        Promise.all(promises).then(() => resolve());
      });
    });
  }

  subirCarpetas(): void {
    this.estructuraCarpeta.forEach(carpeta => {
      const idCarpeta = carpeta.nombre;
      const now = new Date();
      const periodo = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const idCarpetaPadre: number = this.carpetaActual.idCarpeta!;
      const usuarioCreacion: string = this.cookieService.get('usuario') || 'Usuario';
      const metadata = this.buildDocumentoMetadata(carpeta);
      this.apiService.existeDocumento(this.idEmpresa, idCarpeta).subscribe({
        next: (res) => {
          if (res.success === false) {
            // Crear carpeta si no existe
            this.apiService.crearDocumento(
              this.idEmpresa,
              idCarpeta,
              periodo,
              idCarpetaPadre,
              usuarioCreacion,
              metadata
            ).subscribe({
              next: () => {
                // Subir todos los archivos
                carpeta.files.forEach(file => {
                  const nombreArchivo = file.name.split('.').slice(0, -1).join('.') || file.name;
                  const tipoArchivo = file.type;

                  this.apiService.subirArchivoCarpeta(idCarpeta, nombreArchivo, tipoArchivo, file).subscribe({
                    next: () => {
                      this.messageService.add({
                        severity: 'info',
                        summary: 'Archivo subido',
                        detail: `${file.name} subido correctamente`
                      });
                    },
                    error: (err) => {
                      this.messageService.add({
                        severity: 'error',
                        summary: 'Error de subida',
                        detail: `No se pudo subir ${file.name}`
                      });
                    }
                  });
                });
              },
              error: (err) => {
                console.error(`Error al crear la carpeta ${idCarpeta}:`, err);
              }
            });
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Carpeta duplicada',
              detail: `La carpeta "${idCarpeta}" ya fue registrada`
            });
          }
        },
        error: (err) => {
          console.error(`Error verificando existencia de carpeta ${idCarpeta}:`, err);
        }
      });
    });

    this.mostrarCardSubir = false; // Cierra el diálogo
  }


  cancelarSubida() {
    this.estructuraCarpetas = [];
    this.mostrarCardSubir = false; // Cierra el diálogo
  }

  onCheckboxChange(product: any) {
    if (this.selectedProduct === product) {
      this.selectedProduct = null; // deselecciona si se vuelve a hacer clic
    } else {
      this.selectedProduct = product;
    }
  }

  onVerClick(e: any): void {
    this.verArchivos(e.data?.idCarpeta);
  }

  formatValidado = (data: any): string => {
    if (data.validado === true) {
      return '✔️'; // Aspa
    } else if (data.validado === false) {
      return '❌'; // X
    } else {
      return '';
    }
  };

  verDetalle(idCarpeta: any, idDocumento?: any) {

    const carpeta = this.carpetasRaiz.find(c => c.idCarpeta === idCarpeta);
    this.carpetaActual = carpeta? carpeta: { idCarpetaPadre: null, final: false };

    if (!carpeta) {
      this.carpetaActual.final = false;
    }
    if (this.carpetaActual.final === true) {
      this.cargando = true;

      this.apiService.filtrarDocumentos(idCarpeta).subscribe({
        next: (res) => {
          this.products = res.data;
          this.mostrarTablaCarpetas= true;
          this.cargando = false;

          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { idcarpeta: idCarpeta, iddocumento: idDocumento },
            replaceUrl: true
          });
        },
        error: (err) => {
          console.error('Error al filtrar documentos:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo filtrar documentos'
          });
          this.cargando = false;
        }
      });

    } else {
      this.cargandoc = true;
      // Si no es final, usamos listarCarpeta
      this.apiService.listarCarpeta(idCarpeta===null?'':idCarpeta).subscribe({

        next: (res) => {
          this.carpetasRaiz = res.data;
          this.mostrarTablaCarpetas = false;
          this.cargandoc = false;
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { idcarpeta: idCarpeta, iddocumento: idDocumento },
            replaceUrl: true
          });
        },
        error: (err) => {
          console.error('Error al listar carpeta:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo listar la carpeta'
          });
          this.cargandoc = false;
        }
      });

    }

  }


  filtrarPorCarpeta(idCarpeta: string): void {
    this.apiService.filtrarDocumentos(idCarpeta).subscribe({
      next: (response) => {
        this.archivosCarpeta = response;
        //this.seleccionarArchivoInicial();
      },
      error: (error) => {
        console.error('Error al filtrar documentos:', error);
      }
    });
  }

  onEditarDocumento(e: any) {
    // Combinar datos antiguos y nuevos
    const mergedData = { ...e.oldData, ...e.newData };

    // Filtrar campos vacíos, null o undefined
    const cleanedData: any = {};
    for (const key in mergedData) {
      const value = mergedData[key];
      if (value !== '' && value !== null && value !== undefined) {
        cleanedData[key] = value;
      }
    }

    // ✅ Solo validar el campo "periodo" si fue modificado
    if ('periodo' in e.newData) {
      const periodo = cleanedData['periodo'];
      const esPeriodoValido = /^\d{6}$/.test(periodo);
      const anio = parseInt(periodo?.substring(0, 4), 10);
      const mes = parseInt(periodo?.substring(4, 6), 10);

      if (!esPeriodoValido || anio < 2000 || anio > 2100 || mes < 1 || mes > 12) {
        this.messageService.add({
          severity: 'error',
          summary: 'Periodo inválido',
          detail: 'El periodo debe tener 6 dígitos: AAAAMM (año entre 2000 y 2100, mes entre 01 y 12).'
        });

        e.cancel = true;
        return;
      }
    }

    // Normalizar valores antes de comparar
    const oldIgv = e.oldData['srIgv'];
    const newIgv = 'srIgv' in e.newData ? e.newData['srIgv'] : e.oldData['srIgv'];
    const oldImporteB = e.oldData['importeBruto'];
    const newImporteB = 'importeBruto' in e.newData ? e.newData['importeBruto'] : e.oldData['importeBruto'];
    const oldTipoDet = e.oldData['tipoDet'];
    const newTipoDet = 'tipoDet' in e.newData ? e.newData['tipoDet'] : e.oldData['tipoDet'];
    const oldMoneda = e.oldData['moneda'];
    const newMoneda = 'moneda' in e.newData ? e.newData['moneda'] : e.oldData['moneda'];
    const oldFechaPago = e.oldData['fechaPago'];
    const newFechaPago = 'fechaPago' in e.newData ? e.newData['fechaPago'] : e.oldData['fechaPago'];
    const oldLca = e.oldData['lca'];
    const newLca = 'lca' in e.newData ? e.newData['lca'] : e.oldData['lca'];

    const normalizedOldIgv = oldIgv ?? '';
    const normalizedNewIgv = newIgv ?? '';
    const normalizedOldImporteB = oldImporteB ?? '';
    const normalizedNewImporteB = newImporteB ?? '';
    const normalizedOldTipoDet = oldTipoDet ?? '';
    const normalizedNewTipoDet = newTipoDet ?? '';
    const normalizedOldMoneda = oldMoneda ?? '';
    const normalizedNewMoneda = newMoneda ?? '';
    const normalizedOldLca = oldLca ?? '';
    const normalizedNewLca = newLca ?? '';
    const normalizeFechaPago = (value: any) => {
      if (!value) {
        return '';
      }
      const dateValue = value instanceof Date ? value : new Date(value);
      return Number.isNaN(dateValue.getTime()) ? String(value) : dateValue.toISOString();
    };
    const normalizedOldFechaPago = normalizeFechaPago(oldFechaPago);
    const normalizedNewFechaPago = normalizeFechaPago(newFechaPago);

    // Solo si cambió el srIgv o cambiaron importes
    if (
      normalizedOldIgv !== normalizedNewIgv
      || normalizedOldImporteB !== normalizedNewImporteB
      || normalizedOldTipoDet !== normalizedNewTipoDet
      || normalizedOldMoneda !== normalizedNewMoneda
    ) {
      const tipoIgv = (cleanedData['srIgv'] ?? newIgv ?? '').toString();
      const tipoDetId = cleanedData['tipoDet'] ?? newTipoDet;
      const monedaSeleccionada = (cleanedData['moneda'] ?? newMoneda ?? '').toString();
      const tipoDetSeleccionado = this.tipoDet.find(det => det.id === tipoDetId);
      const porcentajeDet = tipoDetSeleccionado ? parseFloat(String(tipoDetSeleccionado.valor)) / 100 : 0;
      const importeBruto = parseFloat(String(cleanedData['importeBruto'] ?? newImporteB));

      if (!isNaN(importeBruto)) {
        let nuevoImporteNeto = importeBruto;

        if (tipoIgv === '2') {
          const det = importeBruto * (isNaN(porcentajeDet) ? 0 : porcentajeDet);

          if (!monedaSeleccionada || monedaSeleccionada === '01') {
            const detFloor = Math.round(det);
            nuevoImporteNeto = importeBruto - detFloor;
          } else {
            nuevoImporteNeto = parseFloat((importeBruto - det).toFixed(2));
          }
        } else if (tipoIgv === '3') {
          const ret = parseFloat((importeBruto * 0.03).toFixed(2));
          nuevoImporteNeto = importeBruto - ret;
        }

        cleanedData['importeNeto'] = nuevoImporteNeto;

        // Actualizar producto en products
     const index = this.products.findIndex(p => p.idCarpeta?.trim() === cleanedData.idCarpeta?.trim());
    if (index !== -1) {
      this.products[index] = {
        ...this.products[index],
        importeNeto: nuevoImporteNeto,
        srIgv: tipoIgv,
        tipoDet: tipoDetId,
        moneda: monedaSeleccionada
      };
    }
      }
    }

    if (normalizedOldFechaPago !== normalizedNewFechaPago || normalizedOldLca !== normalizedNewLca) {
      const idCarpetaDocumento = (cleanedData.idCarpeta ?? e.oldData.idCarpeta ?? e.newData.idCarpeta)?.trim();
      if (idCarpetaDocumento) {
        const index = this.products.findIndex(p => p.idCarpeta?.trim() === idCarpetaDocumento);
        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            fechaPago: newFechaPago,
            lca: newLca
          };
        }
      }
    }
    cleanedData['usuarioModificacion'] = this.cookieService.get('usuario') || 'Usuario';;
    this.cargandoc = true;
    this.apiService.editarDocumento(cleanedData).subscribe({
      next: () => {
        this.cargandoc = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento actualizado correctamente.'
        });

        const idCarpeta = this.route.snapshot.queryParamMap.get('idcarpeta') || this.route.snapshot.queryParamMap.get('idCarpeta');
        if (idCarpeta) {
          this.apiService.filtrarDocumentos(idCarpeta).subscribe({
            next: (res) => {
              this.products = res.data;
              this.mostrarTablaCarpetas = true;
              this.cargando = false;
            },
            error: (err) => {
              console.error('Error al filtrar documentos:', err);
            }
          });
        }
      },
      error: (err) => {
        this.cargandoc = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el documento'
        });
        e.cancel = true;
      }
    });

  }


  cerrarVistaArchivos() {
    this.mostrarTablaArchivos = false;
    this.cargandoArchivos = false;
    this.archivosCarpeta = [];
    this.carpetaSeleccionada = '';
    this.vehiculoSeleccionado = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { idDocumento: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    if(this.products.length === 0){
      this.verDetalle(this.route.snapshot.queryParamMap.get('idcarpeta') || this.route.snapshot.queryParamMap.get('idCarpeta'))
    }
  }

  abrirArchivo(e: any): void {
    const url = e?.data?.url;
    if (url) {
      window.open(url, '_blank');
    }
  }

  formatSize(rowData: any): string {
    const size = rowData.size;
    if (size == null || isNaN(size)) return '0 bytes';

    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      const kb = size / 1024;
      return `${kb.toFixed(2)} KB`;
    } else {
      const mb = size / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dropActive = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dropActive = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.dropActive = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const archivo = files[0];
      const nombreSinExtension = archivo.name.replace(/\.[^/.]+$/, "");
      const tipo = this.obtenerTipoArchivo(archivo);

      this.apiService.subirArchivoCarpeta(this.carpetaSeleccionada.trim().replace(/\s+/g, '_'), nombreSinExtension, tipo, archivo).subscribe({
        next: () => {
          this.verArchivos(this.carpetaSeleccionada.trim().replace(/\s+/g, '_'));
        },
        error: err => {
          console.error('Error al subir:', err);
        }
      });

    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      const nombreSinExtension = archivo.name.replace(/\.[^/.]+$/, "");
      const tipo = this.obtenerTipoArchivo(archivo);

      this.apiService.subirArchivoCarpeta(
        this.carpetaSeleccionada.trim().replace(/\s+/g, '_'),
        nombreSinExtension,
        tipo,
        archivo
      ).subscribe({
        next: () => {
          this.verArchivos(this.carpetaSeleccionada.trim().replace(/\s+/g, '_'));
        },
        error: err => {
          console.error('Error al subir:', err);
        }
      });
    }
  }


  verArchivos(idDocumento: string) {
    const documento = this.products.find(c => c.idCarpeta === idDocumento);
    this.carpetaSeleccionada = idDocumento;
    this.vehiculoSeleccionado = documento?.idSerie ?? null;

    // this.router.navigate([], {
    //   relativeTo: this.route,
    //   queryParams: { idCarpeta: idCarpeta, idDocumento: idDocumento },
    //   replaceUrl: true
    // });

    this.cargandoArchivos = true;
    this.archivosCarpeta = []; // Limpiar archivos anteriores mientras se cargan los nuevos
    this.mostrarTablaArchivos = true;

    this.apiService.listarArchivosCarpeta(idDocumento.trim()).subscribe({
      next: (response) => {
        this.archivosCarpeta = Array.isArray(response) ? response : [response];
        this.cargandoArchivos = false;
        this.mostrarTablaArchivos = true;
        // this.seleccionarArchivoInicial();

      },
      error: (err) => {
        console.error('Error al obtener archivos:', err);
        this.cargandoArchivos = false;
      }
    });
    //this.mostrarTablaArchivos = true;
  }

  listarDigitalesProvision(idDocumento: string) {
    this.cargandoArchivos = true;
    this.archivosCarpeta = [];

    this.apiService.listarArchivosCarpeta(idDocumento.trim()).subscribe({
      next: (response) => {
        this.archivosCarpeta = Array.isArray(response) ? response : [response];
        this.cargandoArchivos = false;
        this.seleccionarArchivoInicial();
      },
      error: (err) => {
        console.error('Error al obtener archivos digitales:', err);
        this.cargandoArchivos = false;
      }
    });
  }


  cerrarVistaCarpeta() {
    const idCarpeta = this.route.snapshot.queryParamMap.get('idcarpeta') || this.route.snapshot.queryParamMap.get('idCarpeta');

    if (idCarpeta) {
      this.apiService.listarCarpeta(idCarpeta).subscribe((res) => {
        if (
          res.data.length === 1 &&
          res.data[0].final === true &&
          res.data[0].esOrigen === true
        ) {
          this.carpetasRaiz = res.data;
          this.verDetalle(res.data[0].idCarpetaPadre);
        }
      });
    }
  }


  seleccionarArchivoInicial() {
    if (!this.archivosCarpeta || this.archivosCarpeta.length === 0) {
      this.archivoSeleccionadoUrl = '';
      this.archivoSeleccionadoNombre = '';
      this.safeUrl = null;
      this.indiceArchivoActual = 0;
      return;
    }

    const indicePdf = this.archivosCarpeta.findIndex((archivo) =>
      this.esPDF(archivo?.url ?? '')
    );
    const indiceSeleccionado = indicePdf === -1 ? 0 : indicePdf;
    const archivoSeleccionado = this.archivosCarpeta[indiceSeleccionado];

    if (archivoSeleccionado?.url) {
      this.verArchivo(
        archivoSeleccionado.url,
        archivoSeleccionado.name ?? 'Archivo',
        indiceSeleccionado,
        false
      );
    }
  }

  verArchivo(url: string, name: string, index: number, abrirVisor: boolean = true) {
    this.cargandoArchivo = true;
    this.indiceArchivoActual = index;
    this.archivoSeleccionadoNombre = name;
    this.archivoSeleccionadoUrl = url;
    this.revokeMsgPreviewUrl();

    if (abrirVisor ) {
      this.mostrarVisor = true;
    }
    if (this.esPDF(url) || this.esImagen(url)) {
      this.safeUrl = this.getSafeUrl(url);
    } else if (this.esExcel(url) ||this.esWord(url)) {
       const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);

    } else if (this.esMensajeOutlook(url)) {
      this.safeUrl = null;
      this.cargarMensajeOutlook(url);
      return;
    } else {
      this.safeUrl = null;
    }
    setTimeout(() => {
      this.cargandoArchivo = false;
      if ( !this.mostrarDialogAprovisionar){this.mostrarVisor = true;}
    }, 500);
  }

  verSiguiente() {
    if (this.indiceArchivoActual < this.archivosCarpeta.length - 1) {
      const nuevo = this.archivosCarpeta[this.indiceArchivoActual + 1];
      console.log(nuevo)
      this.verArchivo(nuevo.url, nuevo.name, this.indiceArchivoActual + 1, false);
    }
  }

  verAnterior() {
    if (this.indiceArchivoActual > 0) {
      const nuevo = this.archivosCarpeta[this.indiceArchivoActual - 1];
      this.verArchivo(nuevo.url, nuevo.name, this.indiceArchivoActual - 1, false);
    }
  }

  esImagen(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  esPDF(url: string): boolean {
    return url.toLowerCase().endsWith('.pdf');
  }

  esWord(url: string): boolean {
    return /\.(doc|docx)$/i.test(url);
  }

  esExcel(url: string): boolean {
    return url.endsWith('.xls') || url.endsWith('.xlsx');
  }

  esMensajeOutlook(url: string): boolean {
    return url.toLowerCase().endsWith('.msg');
  }

  private revokeMsgPreviewUrl(): void {
    if (this.msgPreviewUrl) {
      URL.revokeObjectURL(this.msgPreviewUrl);
      this.msgPreviewUrl = null;
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private construirHtmlMensaje(data: Record<string, any>): string {
    const subjectValue = data['subject'];
    const senderNameValue = data['senderName'];
    const senderEmailValue = data['senderEmail'];
    const recipientsValue = data['recipients'];
    const submitTimeValue = data['clientSubmitTime'];
    const bodyHtmlValue = data['bodyHTML'];
    const bodyValue = data['body'];
    const subject = subjectValue ? this.escapeHtml(String(subjectValue)) : 'Sin asunto';
    const senderName = senderNameValue ? this.escapeHtml(String(senderNameValue)) : '';
    const senderEmail = senderEmailValue ? this.escapeHtml(String(senderEmailValue)) : '';
    const sender = senderName || senderEmail ? `${senderName}${senderName && senderEmail ? ' ' : ''}${senderEmail ? `&lt;${senderEmail}&gt;` : ''}` : 'Remitente desconocido';
    const recipients = Array.isArray(recipientsValue)
      ? recipientsValue
          .map((recipient: Record<string, any>) => recipient?.['email'] || recipient?.['name'])
          .filter(Boolean)
          .map((value: string) => this.escapeHtml(String(value)))
          .join(', ')
      : '';
    const submitTime = submitTimeValue ? this.escapeHtml(String(submitTimeValue)) : '';

    const bodyHtml = bodyHtmlValue
      ? String(bodyHtmlValue)
      : `<pre style="white-space: pre-wrap; font-family: inherit;">${this.escapeHtml(String(bodyValue ?? ''))}</pre>`;

    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
      .meta { margin-bottom: 16px; font-size: 14px; line-height: 1.5; }
      .meta div { margin: 2px 0; }
      .label { font-weight: 600; color: #374151; }
      .body { border-top: 1px solid #e5e7eb; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="meta">
      <div><span class="label">Asunto:</span> ${subject}</div>
      <div><span class="label">De:</span> ${sender}</div>
      ${recipients ? `<div><span class="label">Para:</span> ${recipients}</div>` : ''}
      ${submitTime ? `<div><span class="label">Fecha:</span> ${submitTime}</div>` : ''}
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
  </body>
</html>`;
  }

  private async cargarMensajeOutlook(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('No se pudo descargar el mensaje de Outlook.');
      }
      const arrayBuffer = await response.arrayBuffer();
      const msgReader = new MsgReader(arrayBuffer);
      const data = msgReader.getFileData();
      const html = this.construirHtmlMensaje(data ?? {});
      const blob = new Blob([html], { type: 'text/html' });
      this.msgPreviewUrl = URL.createObjectURL(blob);
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.msgPreviewUrl);
    } catch (error) {
      console.error('Error al transformar mensaje Outlook:', error);
      this.safeUrl = null;
    } finally {
      this.cargandoArchivo = false;
      if (!this.mostrarDialogAprovisionar) {
        this.mostrarVisor = true;
      }
    }
  }

  obtenerTipoArchivo(archivo: File): string {
    const extension = archivo.name.split('.').pop()?.toLowerCase();

    if (archivo.type) {
      return archivo.type;
    }

    switch (extension) {
      case 'msg':
        return 'application/vnd.ms-outlook';
      default:
        return 'application/octet-stream';
    }
  }
  getSafeUrl(url: string): SafeResourceUrl {
      const lowerUrl = url.toLowerCase();

      if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx') ||
          lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx') ||
          lowerUrl.endsWith('.ppt') || lowerUrl.endsWith('.pptx')) {

        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(officeViewerUrl);
      }

  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  encodeURI(url: string): string {
    return encodeURIComponent(url);
  }

  descargarArchivo() {
    const esImagen = (url: string): boolean => {
      return /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(url);
    };

    if (esImagen(this.archivoSeleccionadoUrl)) {
      // CORS impide descarga directa, así que abrimos en nueva pestaña
      window.open(this.archivoSeleccionadoUrl, '_blank');
    } else {
      // Para archivos no-imagen, usamos blob
      fetch(this.archivoSeleccionadoUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al descargar archivo');
          }
          return response.blob();
        })
        .then(blob => {
          const urlBlob = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = urlBlob;
          link.download = this.archivoSeleccionadoNombre || 'archivo';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(urlBlob);
        })
        .catch(err => {
          console.error('Error al descargar archivo:', err);
        });
    }
  }

  abrirDialogo(tipo: string): void {

    if (!this.idCarpeta) {
      console.error('No se ha definido idCarpeta.');
      return;
    }
    this.loadingDialog = true;
    const ruc = this.idCarpeta.split('_')[0];
    const idDocumento = tipo.toUpperCase();

    this.apiService.listarDocumentosPendientes(this.idEmpresa, ruc, idDocumento).subscribe({
      next: (respuesta) => {
        this.tipoSeleccionado = tipo;
        this.documentosPendientes = (respuesta?.data || []).map((doc: any) => ({
          ...doc,
          tipo: this.tipoSeleccionado,
          id: `${doc.serie}-${doc.numero}`
        }));
        this.tituloDialogo = `Detalles de ${tipo}`;
        this.dialogoVisible = true;
        this.loadingDialog = false;
      },
      error: (error) => {
        console.error('Error al listar documentos pendientes:', error);
      }
    });
  }


  cerrarDialogo(): void {
    this.dialogoVisible = false;
    this.seleccionadosTabla1 = [];
    this.detallesTabla2 = [];
    this.previousSeleccionados = [];
    this.seleccionadosTabla2 = [];
    this.productosSeleccionados = [];
    this.documentosConfirmados = [];
  }

  cerrarDialogos(): void {
    this.dialogoVisible = false;
    this.seleccionadosTabla1 = [];
    this.detallesTabla2 = [];
    this.previousSeleccionados = [];
    this.seleccionadosTabla2 = [];

  }

  toggleFila(row: any): void {
    const index = this.seleccionadosTabla1.findIndex(item => item.id === row.id);
    if (index > -1) {
      this.seleccionadosTabla1.splice(index, 1); // Deselecciona
    } else {
      this.seleccionadosTabla1.push(row); // Selecciona
    }
    this.onSeleccionarFila([...this.seleccionadosTabla1]);
  }

  filaSeleccionada(row: any): boolean {
    return this.seleccionadosTabla1.some(item => item.id === row.id);
  }

  onSeleccionarFila(nuevaSeleccion: any[]): void {
    const agregados = nuevaSeleccion.filter(x => !this.previousSeleccionados.includes(x));
    const removidos = this.previousSeleccionados.filter(x => !nuevaSeleccion.includes(x));

    if (!this.idCarpeta) {
      console.error('No se ha definido idCarpeta.');
      return;
    }

    const ruc = this.idCarpeta.split('_')[0];

    agregados.forEach((documento: any) => {
      const idDocumento = documento.tipoDocumento || this.tipoSeleccionado;
      const serie = documento.serie;
      const numero = documento.numero;

      // Llamar API detalle
      this.apiService.detalleDocumentosPendientes(this.idEmpresa, ruc, idDocumento, serie, numero).subscribe({
        next: (detalle) => {
          const detalles = detalle?.data || [];
          const detallesConId = detalles.map((item: any, index: number) => ({
            ...item,
            id: `${serie}-${numero}-${index}`
          }));
          this.detallesTabla2 = [...this.detallesTabla2, ...detallesConId];
        },
        error: (err) => {
          console.error('Error al obtener detalle:', err);
        }
      });

      // Si el tipo es GRP, llamar a ConsultarRefGuia
      if (idDocumento === 'GRP') {
        this.apiService.ConsultarRefGuia(idDocumento, serie, numero).subscribe({
          next: (res) => {
            const documentoConfirmado = {
              tipo: idDocumento,
              serie,
              numero,
              fecha: documento.fecha || new Date().toISOString().split('T')[0]
            };
            this.documentosConfirmados.push(documentoConfirmado);
          },
          error: (err) => {
            console.error('Error al obtener referencia GRP:', err);
          }
        });
      }
    });

    removidos.forEach((documento: any) => {
      const serie = documento.serie;
      const numero = documento.numero;
      const clave = `${serie}-${numero}`;
      this.detallesTabla2 = this.detallesTabla2.filter(item => !item.id.startsWith(clave));
    });

    this.previousSeleccionados = [...nuevaSeleccion];
  }



  toggleFila2(rowData: any) {
    const index = this.seleccionadosTabla2.findIndex(item => item.id === rowData.id);
    if (index !== -1) {
      this.seleccionadosTabla2.splice(index, 1);
    } else {
      this.seleccionadosTabla2.push(rowData);
    }
  }

  filaSeleccionada2(rowData: any): boolean {
    return this.seleccionadosTabla2.some(item => item.id === rowData.id);
  }

  mostrarDatosEnGrid() {
    console.log(this.productosSeleccionados)
    console.log(this.seleccionadosTabla2)
    const productoRelacionado = this.products.find(
      (prod: any) => prod.idCarpeta === this.idCarpeta
    );

    const observacion = productoRelacionado?.observacionesGlosa || '';

    this.productosSeleccionados = [
      ...this.productosSeleccionados,
      ...this.seleccionadosTabla2.map((item, index) => {
        const regimen = this.productoSeleccionadoResumen.regimen;
        const destino =
          regimen === '01' ? '001' :
          regimen === '02' ? '' :
          regimen === '03' ? '004' :
          '';

        return {
          idCarpeta: this.productosSeleccionados.length + index + 1, // continúa la numeración
          item: item.item,
          cuenta: '',
          observaciones: '',
          costos: '',
          descripcioncc: '',
          destino: destino,
          importe: item.monto,
          descripcionp: item.descripcion,
          cantidad: item.Cantidad || item.cantidad,
          producto: item.idProducto,
          referencia: item.referencia,
          idVehiculo: item.idVehiculo,
        };
      })
    ];


    this.mostrarTablaSeleccionados = true;
    this.documentosConfirmados = [...this.seleccionadosTabla1];
    this.dialogoVisible = false;
  }


  editar(e: any) {
    const updatedData = e.newData;
    const oldData = e.oldData;

    const index = this.productosSeleccionados.findIndex(item => item === oldData);

    const aplicarCambios = () => {
      if (index !== -1) {
        this.productosSeleccionados[index] = {
          ...this.productosSeleccionados[index],
          ...updatedData
        };

        this.messageService.add({
          severity: 'success',
          summary: 'Cambios guardados',
          detail: 'Los datos fueron actualizados correctamente'
        });
      }
    };

    // Validar cuenta
    if (updatedData?.cuenta && updatedData.cuenta !== oldData.cuenta) {
      this.apiService.validarCuenta(this.idEmpresa, updatedData.cuenta).subscribe(res => {
        if (res?.data?.[0] === false) {
          this.messageService.add({
            severity: 'error',
            summary: 'Cuenta inválida',
            detail: 'Esa cuenta no existe, ingrese una correcta'
          });

          if (index !== -1) this.productosSeleccionados[index].cuenta = '';
          e.cancel = true;
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Cuenta válida',
            detail: 'La cuenta fue validada correctamente'
          });

          aplicarCambios();
        }
      });
    }

    // Validar destino
    else if (updatedData?.destino && updatedData.destino !== oldData.destino) {
      this.apiService.validarDestino(updatedData.destino).subscribe(res => {
        if (res?.data?.[0] === false) {
          this.messageService.add({
            severity: 'error',
            summary: 'Destino inválido',
            detail: 'Ese destino no existe, ingrese uno correcto'
          });

          if (index !== -1) this.productosSeleccionados[index].destino = '';
          e.cancel = true;
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Destino válido',
            detail: 'El destino fue validado correctamente'
          });

          aplicarCambios();
        }
      });
    }

    // ✅ Validar centro de costos (campo 'costos')
    else if (updatedData?.costos && updatedData.costos !== oldData.costos) {
      this.apiService.validarCentroCosto(this.idEmpresa, updatedData.costos).subscribe(res => {
        if (res?.success && res.data?.[0]) {
          // ✅ Asignar descripción al campo 'descripcioncc'
          updatedData.descripcioncc = res.data[0];

          this.messageService.add({
            severity: 'success',
            summary: 'Centro de costos válido',
            detail: `Centro de costos: ${res.data[0]}`
          });

          aplicarCambios();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Centro de costos inválido',
            detail: 'No se encontró el centro de costos ingresado'
          });

          if (index !== -1) {
            this.productosSeleccionados[index].costos = '';
            this.productosSeleccionados[index].descripcioncc = '';
          }

          e.cancel = true;
        }
      });
    }
  }

  generar() {
    if (this.generarEnProceso) {
      return;
    }

    const carpeta = this.products.find(p => p.idCarpeta === this.idCarpeta);
    if (!this.validarCamposAprovisionar(carpeta)) {
      return;
    }

    this.generarEnProceso = true;
    this.confirmationService.confirm({
      message: '¿Estás seguro que deseas generar la provisión?',
      header: 'Confirmar generación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.grabar();
      },
      reject: () => {
        this.finalizarGeneracion();
      }
    });
  }

  private tieneValor(valor: unknown): boolean {
    if (valor === null || valor === undefined) {
      return false;
    }

    if (typeof valor === 'string') {
      return valor.trim() !== '';
    }

    return true;
  }

  private validarCamposAprovisionar(carpeta: any): boolean {
    if (!carpeta) {
      this.messageService.add({
        severity: 'error',
        summary: 'Documento no encontrado',
        detail: 'No se encontró el documento a provisionar.'
      });
      return false;
    }

    const faltantes: string[] = [];
    const importeBruto = Number(carpeta.importeBruto);
    const idDocumento = carpeta.idDocumento ?? carpeta.iddocumento;
    const srIgvValue = carpeta.srIgv ?? carpeta.srigv;
    const validadoValue = carpeta.validado;
    const validadoOk = validadoValue === true || validadoValue === 1 || String(validadoValue) === '1';

    if (!validadoOk) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Documento no validado',
        detail: 'Debe validar el documento antes de continuar con la provisión.'
      });
      return false;
    }

    if (!this.tieneValor(carpeta.regimen)) faltantes.push('Régimen');
    if (!this.tieneValor(carpeta.importeBruto) || Number.isNaN(importeBruto) || importeBruto <= 0) {
      faltantes.push('Importe Bruto');
    }
   // if (!this.tieneValor(carpeta.impuestos) && idDocumento !='RHN'&& idDocumento !='ODC') faltantes.push('Impuestos');
      const impuestosTieneValor = this.tieneValor(carpeta.impuestos) || carpeta.impuestos === '';
    if (!impuestosTieneValor && idDocumento !='RHN'&& idDocumento !='ODC') faltantes.push('Impuestos');
    if (!this.tieneValor(carpeta.moneda)) faltantes.push('Moneda');
    if (!this.tieneValor(idDocumento)) faltantes.push('T.DOC');
    if (!this.tieneValor(carpeta.fechaEmision)) faltantes.push('Fecha Emisión');
    if (!this.tieneValor(carpeta.sucursal)) faltantes.push('Sucursal');
    if (!this.tieneValor(carpeta.periodo)) faltantes.push('Periodo');
    if (!this.tieneValor(carpeta.tipoMovimiento)) faltantes.push('Tipo Movimiento');
    if (!this.tieneValor(carpeta.clasificacionLe)) faltantes.push('Clasificación LE');

    if (this.tieneValor(srIgvValue) && String(srIgvValue) === '2' && !this.tieneValor(carpeta.tipoDet)) {
      faltantes.push('Tipo Det.');
    }

    if (faltantes.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obligatorios',
        detail: `Complete los campos: ${faltantes.join(', ')}.`
      });
      return false;
    }

    return true;
  }

  private getImpuestoValor(id?: string): number {
    const impuestoItem = this.impuestos.find(i => i.idImpuestos === id);
    return impuestoItem ? Number(impuestoItem.valor) : 0;
  }

  private formatPimpuesto(valor: number): string {
    return Number(valor).toFixed(4);
  }

  calcularImpuesto(carpeta: any): number {
    const porcentaje = this.getImpuestoValor(carpeta?.impuestos) / 100;
    if (!porcentaje) return 0;

    const importeBruto = Number(carpeta?.importeBruto) || 0;
    const impuesto = importeBruto * (porcentaje / (1 + porcentaje));

    return +impuesto.toFixed(2);
  }
  //puede usarse para evita &
  private xmlEscape(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')   // SIEMPRE primero &
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
 //revisar funcionamiento
  private xmlCData(value: any): string {
  if (value === null || value === undefined) return '<![CDATA[]]>';
  // Evita cerrar CDATA accidentalmente
  const safe = String(value).replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${safe}]]>`;
  }
  grabar() {

    if (!this.idCarpeta) {
      console.error('No se ha definido idCarpeta.');
      this.finalizarGeneracion();
      return;
    }
    const carpeta = this.products.find(p => p.idCarpeta === this.idCarpeta);
    const ruc = this.idCarpeta?.split('_')[0] ?? '';
    const serie = this.idCarpeta?.split('_')[1]?.split('-')[0] ?? '';
    const numero = this.idCarpeta?.split('-')[1] ?? '';
    const tipoTabla =
  this.tipoSeleccionado === 'GRP' ? 'INGRESOSALIDAALM' :
  this.tipoSeleccionado === 'OCO' ? 'ORDENCOMPRA' :
  this.tipoSeleccionado === 'OSR' ? 'ORDENSERVICIO' :
  this.tipoSeleccionado === 'OPA' ? 'ORDENPAGO' :
  this.tipoSeleccionado === 'FAC' ? 'COBRARPAGARDOC' :
  '';
  let totalAfecto = 0;
  let totalInafecto = 0;

  for (const fila of this.productosSeleccionados) {
       const importe = Number(fila.importe) || 0;

        if (fila.destino === '001') {
          totalAfecto += importe;
        } else if (fila.destino === '004') {
          totalInafecto += importe;
        }
  }

  const detalledet = this.tipoDet.find(t => t.id === carpeta?.tipoDet);
 const detret = this.tipoDet.find(t => t.id === carpeta?.srIGV);
    if((carpeta?.srIgv).toString()==='2' && !detalledet)
    {
        this.messageService.add({
                severity: 'error',
                summary: 'Error en producto',
                detail: `LA PROVISIÓN CUENTA CON DETRACCIÓN, SE DEBE ESPECIFICAR EL TIPO DE DETRACCIÓN`
              });
              this.finalizarGeneracion();
              return;
    }
  this.productosSeleccionados.forEach(item => {
  const idSeleccionado = item.tipoDet;
  const descripcion = this.tipoDet.find(x => x.id === idSeleccionado)?.descripcion || '';

  //console.log('Fila:', item, ' -> Tipo Det:', descripcion);
  });

  const tipo = this.tipoSeleccionado?.toUpperCase() || '';
    this.apiService.generarIdCobrarPagarDoc(this.idEmpresa, this.idCarpeta).subscribe({
      next: (response) => {
        this.generarDeshabilitado = true;
        // Validación de productos del detalle antes de continuar
        for (const [i, p] of this.productosSeleccionados.entries()) {
          if (p.importe === null || isNaN(Number(p.importe))||p.importe === '') {
            this.messageService.add({
              severity: 'error',
              summary: 'Error en producto',
              detail: `El detalle item ${i + 1} no tiene un importe válido.`
            });
            this.finalizarGeneracion();
            return;
          }

        }
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignado con éxito'
        });
        const impuestoCalculado = this.calcularImpuesto(carpeta);
        const impuestoValor = this.getImpuestoValor(response.data[0]?.impuestos);
        const body = {

          lcEmpresa: this.idEmpresa,
          lcId: response.data[0]?.idCobrarPagarDoc,
          idCarpeta: this.idCarpeta,
          xmlData: `<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?>
          <VFPData>
            <cobrarpagardoc>
              <idempresa>${this.idEmpresa}</idempresa>
              <idcobrarpagardoc>${response.data[0]?.idCobrarPagarDoc}</idcobrarpagardoc>
              <idemisor>${this.idEmpresa}</idemisor>
              <periodo>${carpeta?.periodo}</periodo>
              <idoperacion>PPFC</idoperacion>
              <numoperacion>9999900660</numoperacion>
              <idsubdiario/>
              <voucher/>
              <fecharegistro>${carpeta?.fechaEmision}</fecharegistro>
              <idsucursal>${carpeta?.sucursal}</idsucursal>
              <idalmacen/>
              <idcaja/>
              <idcontrol/>
              <idpedidopv/>
              <origen>P</origen>
              <iddocumento>${carpeta?.idDocumento}</iddocumento>
              <serie>${serie}</serie>
              <numero>${numero}</numero>
              <fecha>${carpeta?.fechaEmision}</fecha>
              <dias>0</dias>
              <vencimiento>${carpeta?.fechaVcto ? carpeta?.fechaVcto  : carpeta?.fechaEmision}</vencimiento>
              <tcambio>3.662000</tcambio>
              <idclieprov>${ruc}</idclieprov>
              <direccion/>
              <ruc>${ruc}</ruc>
              <razonsocial>${this.xmlCData(carpeta?.razonSocial)}</razonsocial>
              <idclieprov2/>
              <lugargiro/>
              <idvendedor/>
              <idproyecto/>
              <idregimen>${carpeta?.regimen}</idregimen>
              <idmoneda>${carpeta?.moneda}</idmoneda>
              <tcmoneda>1.000000</tcmoneda>
              <idestadoletra/>
              <idtipoventa/>
              <idtipomov>${carpeta?.tipoMovimiento}</idtipomov>
              <idmotivo/>
              <idfpago>004</idfpago>
              <idarea>${carpeta?.idArea}</idarea>
              <glosa>${this.xmlCData(carpeta?.observacionesGlosa)}</glosa>
              <ocompra/>
              <vventa>${carpeta?.importeBruto-impuestoCalculado-totalInafecto}</vventa>
              <inafecto>${totalInafecto}</inafecto>
              <otros>0</otros>
              <impuesto>${impuestoCalculado}</impuesto>
              <pimpuesto>${this.formatPimpuesto(impuestoValor)}</pimpuesto>
              <descuento>0.00</descuento>
              <pdescuento>0.0000</pdescuento>
              <descuentodoc>0.00</descuentodoc>
              <redondeo>0.000000</redondeo>
              <importe>${carpeta?.importeBruto}</importe>
              <importemof>0</importemof>
              <importemex>0</importemex>
              <iddocdetrac/>
              <seriedetrac/>
              <numerodetrac/>
              <fechadetrac/>
              <regagricola>0</regagricola>
              <exportacion>0</exportacion>
              <importacion>0</importacion>
              <es_apertura>0</es_apertura>
              <afecta_almacen>0</afecta_almacen>
              <muevekardex>0</muevekardex>
              <gastoaduana>0</gastoaduana>
              <multivendedores>0</multivendedores>
              <idcontabilizado/>
              <idajuste/>
              <idestado>PE</idestado>
              <sincroniza>N</sincroniza>
              <precioigv>0</precioigv>
              <igv>0</igv>
              <contabilizado>0</contabilizado>
              <idusuario>MCUEVA</idusuario>
              <ventana>EDT_PROVISION</ventana>
              <fechacreacion>${carpeta?.fechaCreacion}</fechacreacion>
              <comision>0</comision>
              <aplicar_anticipo>0</aplicar_anticipo>
              <impreso>0</impreso>
              <marcas/>
              <ptoorigen/>
              <ptodestino/>
              <embarcadoen/>
              <nrobultos/>
              <pesobruto/>
              <pesoneto/>
              <fechaocc/>
              <fecharecepocc/>
              <numeroocc/>
              <idflete/>
              <fechaembarque/>
              <nroembarque/>
              <idtipocontenedor/>
              <idtipoprecio/>
              <idmovplanilla/>
              <es_detraccion>${carpeta?.srIgv === 2? 1 : 0}</es_detraccion>
              <indicadorventa/>
              <con_retencion>0</con_retencion>
              <idplanilla/>
              <fecha_desde/>
              <fecha_hasta/>
              <idingresoegresocaba/>
              <detgeneral>0</detgeneral>
              <detalle1/>
              <totaldetalle1>0</totaldetalle1>
              <detalle2/>
              <totaldetalle2>0</totaldetalle2>
              <detalle3/>
              <totaldetalle3>0</totaldetalle3>
              <idretencion/>
              <idmediopago/>
              <fecha_entrega>${carpeta?.fechaEmision}</fecha_entrega>
              <feci_4ta5ta/>
              <fecf_4ta5ta/>
              <dua/>
              <idlineaaerea/>
              <idtransportista/>
              <awb/>
              <exonerado>0</exonerado>
              <con_declimportacion>0</con_declimportacion>
              <idviajet/>
              <imp_costo>0</imp_costo>
              <idcontacto/>
              <idcontrata/>
              <imp_presupuesto>0</imp_presupuesto>
              <numero_rcompras>0135269</numero_rcompras>
              <certiftransporte/>
              <certiftransporte1/>
              <idvehiculo/>
              <placa/>
              <placa1/>
              <marca/>
              <marca1/>
              <idchofer/>
              <chofer/>
              <brevete/>
              <fechatraslado/>
              <razonsocial2/>
              <iddocpretencion/>
              <docpretencion/>
              <iddocdrawback/>
              <docdrawback/>
              <iddocrliqcompra/>
              <docrliqcompra/>
              <itemptodestino/>
              <itemptoembarque/>
              <itemagente_aduana/>
              <idreserva>0</idreserva>
              <item>0</item>
              <idvia_embarque/>
              <idcontabilizado2/>
              <iddocdetraccion/>
              <idunidadnegocio/>
              <idsubunidadnegocio/>
              <area_ha>0</area_ha>
              <idcontrato/>
              <idhabilitacion/>
              <con_entregarendir>0</con_entregarendir>
              <doc_entregarendir/>
              <importado_externo>0</importado_externo>
              <idreclamo/>
              <idreferencia_externo/>
              <exonerado_isc>0</exonerado_isc>
              <iddocumento_alm/>
              <serie_alm/>
              <numero_alm/>
              <fecha_alm/>
              <estadosunat>ACTIVO</estadosunat>
              <condicionsunat>HABIDO</condicionsunat>
              <es_gasto_vinculado>0</es_gasto_vinculado>
              <flete_awb>0</flete_awb>
              <cantidad>0</cantidad>
              <idmoneda_prt/>
              <iddocumento_prt/>
              <serie_prt/>
              <numero_prt/>
              <fecha_prt/>
              <importe_prt>0</importe_prt>
              <tcambio_emision>0</tcambio_emision>
              <nro_contenedor/>
              <fechaawb/>
              <referencia_cliente/>
              <isc>0</isc>
              <idsucursal2_o/>
              <idalmacen2_o/>
              <idsucursal2_d/>
              <idalmacen2_d/>
              <idresponsable/>
              <con_percepcion>0</con_percepcion>
              <idpercepcion/>
              <docpercepcion/>
              <genera_docalmacen>0</genera_docalmacen>
              <idnotificante/>
              <fdistribucion>0</fdistribucion>
              <idingresosalidaactivo/>
              <ventanaref/>
              <idreferencia1/>
              <flete_acuerdo>0</flete_acuerdo>
              <idrecepdocumentos/>
              <idactividad/>
              <idestructura/>
              <idmotivo_an/>
              <motivo_an/>
              <idresponsable_an/>
              <observacion_an/>
              <archivo_ce/>
              <transferido_ce>0</transferido_ce>
              <situacion_ce>ACEPTADO</situacion_ce>
              <idanulacion_ws/>
              <idclieprov3/>
              <transferido_ws>0</transferido_ws>
              <ruta_archivo_ce/>
              <ruta_archivo_signed_ws/>
              <archivo_signed_ce/>
              <estado_ce>0</estado_ce>
              <idestadosunat/>
              <idclasificacion_bs_sunat>${carpeta?.clasificacionLe}</idclasificacion_bs_sunat>
              <nro_autsunat/>
              <estado_autsunat/>
              <periodo_correccion/>
              <identificador_correccion/>
              <validado_ce>0</validado_ce>
              <idmotivo_emision/>
              <idtipo_impresion_omt/>
              <idopebanco/>
              <idpremotivo_emision/>
              <serie_bak/>
              <idmotivo_andv/>
              <fecharecep/>
              <serie_grande>${serie}</serie_grande>
              <vgratuita>0</vgratuita>
              <vexonerada>0</vexonerada>
              <vinafecta>0</vinafecta>
              <vgravada>0</vgravada>
              <idruta/>
              <numversion>1</numversion>
              <idbanco/>
              <idpuntoventa/>
              <idtarjeta/>
              <ncuentachaque/>
              <ntarjetacheque/>
              <numaperturacierre/>
              <numpedido/>
              <vventa_importacion>0</vventa_importacion>
              <autodetraccion>0</autodetraccion>
              <idvehiculo_origen/>
              <idcampana/>
              <esletradescuento>0</esletradescuento>
              <nro_rem_carga/>
              <nro_rem_trans/>
              <esgdeducible>0</esgdeducible>
            </cobrarpagardoc>
          </VFPData>`,
          xmlDeta: `<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?>
          <VFPData>
          ${this.productosSeleccionados.map((p, index) => `
            <dcobrarpagardoc>
              <idempresa>${this.idEmpresa}</idempresa>
              <idcobrarpagardoc>${response.data[0]?.idCobrarPagarDoc}</idcobrarpagardoc>
              <item>${p.item}</item>
              <itemliquidacion/>
              <idclieprov/>
              <idcuenta>${p.cuenta}</idcuenta>
              <idccosto>${p.costos} </idccosto>
              <idconsumidor>${p.costos} </idconsumidor>
              <iddestino>${p.destino}</iddestino>
              <idtipotransaccion/>
              <idproducto>${p.producto}</idproducto>
              <idmedida>UNID</idmedida>
              <descripcion>${this.xmlCData(p.descripcionp)}</descripcion>
              <idestadoproducto>0</idestadoproducto>
              <idlote/>
              <idserie>${response.data[0]?.idSerie}</idserie>
              <idreferencia>${p.referencia}</idreferencia>
              <origen/>
              <idmovrefer/>
              <iddocrefer/>
              <serierefer/>
              <numerorefer/>
              <fecharefer/>
              <vencerefer/>
              <es_nuevo>0</es_nuevo>
              <cantidad>${p.cantidad}</cantidad>
              <precio>${p.importe}</precio>
              <preciolista>0</preciolista>
              <precio_cif>0</precio_cif>
              <impuesto_i>0</impuesto_i>
              <impuesto>0</impuesto>
              <vventa>${p.importe}</vventa>
              <descuento_i>0</descuento_i>
              <descuento>0</descuento>
              <importe>0</importe>
              <fechadocventa/>
              <seriedocventa/>
              <numerodocventa/>
              <idref/>
              <itemref>${p.item}</itemref>
              <tablaref>${tipoTabla}</tablaref>
              <idubicacion/>
              <observaciones>DESDE PERUMOTOR DIGITAL</observaciones>
              <idactividad/>
              <idlabor/>
              <anniofabricacion/>
              <idcolor/>
              <idot/>
              <dsc_ot/>
              <iddoc_venta/>
              <dsc_docventa/>
              <itemot/>
              <nromotor/>
              <nrochasis/>
              <pcosto_mof>0</pcosto_mof>
              <pcosto_mex>0</pcosto_mex>
              <tcosto_mof>0</tcosto_mof>
              <tcosto_mex>0</tcosto_mex>
              <doc_pret/>
              <ser_pret/>
              <nro_pret/>
              <nofacturar>0</nofacturar>
              <idactivo/>
              <flete>0</flete>
              <seguro>0</seguro>
              <otros>0</otros>
              <valorexport>0</valorexport>
              <idcampana/>
              <idloteproduccion/>
              <idordenproduccion/>
              <idsiembra/>
              <docordenproduccion/>
              <vin/>
              <importe_isc>0</importe_isc>
              <idpartidaarancel/>
              <saldoocc>0</saldoocc>
              <idparteproduccion/>
              <docparteproduccion/>
              <precio_fob>0</precio_fob>
              <factor>0</factor>
              <gratuito>0</gratuito>
              <idingresosalidaalm/>
              <documentoalmacen/>
              <itemalmacen/>
              <ventana/>
              <distribucion/>
              <liberado>0</liberado>
              <idvehiculo/>
              <es_docne>0</es_docne>
              <anticipo>0</anticipo>
              <idmedida2/>
              <cantidad2>0</cantidad2>
              <idmedida_fac/>
              <cantidad_fac>0</cantidad_fac>
              <precio_fac>0</precio_fac>
              <idmedida3/>
              <cantidad3>0</cantidad3>
              <precio3>0</precio3>
              <importe3>0</importe3>
              <iddoc_almacen/>
              <doc_almacen/>
              <idtipoafectacion/>
              <vventa_origen>${p.importe}</vventa_origen>
              <es_acobrarpagardoc>0</es_acobrarpagardoc>
              <estructura/>
              <con_fise>0</con_fise>
              <fise>0</fise>
              <automatico>0</automatico>
              <es_exonerado>0</es_exonerado>
              <fecha_provision/>
              <importe_provision>0</importe_provision>
              <idpromocion/>
              <itempromocion/>
              <es_inafecto>0</es_inafecto>
              <idkit/>
              <es_kit>0</es_kit>
              <columnabutaca>0</columnabutaca>
              <etiquetabutaca/>
              <idcategoria/>
              <idbloque/>
              <filabutaca>0</filabutaca>
              <idtarifa/>
              <categoria/>
              <tarifa/>
              <es_cortesia>0</es_cortesia>
              <es_costoexp>0</es_costoexp>
              <idtipo_costoexp/>
              <numversionref>0</numversionref>
              <idreferencia2/>
              <itemref2/>
              <tablaref2/>
              <cma30eqpid/>
              <idruta/>
              <idlugar_o/>
              <idlugar_d/>
              <descuento_i1>0</descuento_i1>
              <descuento1>0</descuento1>
              <descuento_i2>0</descuento_i2>
              <descuento2>0</descuento2>
              <descuento_i3>0</descuento_i3>
              <descuento3>0</descuento3>
              <idconcepto/>
              <sinbutaca>false</sinbutaca>
              <idcondicion/>
              <idetiqueta/>
              <tasaret>0</tasaret>
              <tiporet/>
              <ajuste>0</ajuste>
              <idorigen/>
              <lote_ref/>
              <idloteinmobiliaria/>
            </dcobrarpagardoc>
            `).join('')}
          </VFPData>`,
          xmlImp: impuestoValor > 0 ? `<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?>
          <VFPData>
          ${this.productosSeleccionados.map((p, index) => {
            const porcentaje = impuestoValor / 100;
            return `
            <icobrarpagardoc>
              <idempresa>${this.idEmpresa}</idempresa>
              <idcobrarpagardoc>${response.data[0]?.idCobrarPagarDoc}</idcobrarpagardoc>
              <item>${p.item}</item>
              <idimpuesto>${response.data[0]?.impuestos}</idimpuesto>
              <subitem/>
              <valor>${impuestoValor.toFixed(2)}</valor>
              <baseimponible>${
                Number(p.importe).toFixed(2)
              }</baseimponible>
              <impuesto>${(Number(p.importe) * porcentaje).toFixed(2)}</impuesto>
              <idcuenta/>
              <idccosto/>
              <orden>0</orden>
              <porcentual>0</porcentual>
              <aplicaianterior>0</aplicaianterior>
              <idproducto/>
              <porcentaje>0</porcentaje>
              <impto_de_catalogo>0</impto_de_catalogo>
              <calculo_especifico>0</calculo_especifico>
              <baseimponible_ant>0</baseimponible_ant>
              <impuesto_ant>0</impuesto_ant>
            </icobrarpagardoc>`;
          }).join('')}
          </VFPData>` : `<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?><VFPData/>`,
          xmlRef: `<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?>
          <VFPData>
           ${this.documentosConfirmados.map((p: any) => `
            <docreferencia_cp>
              <idempresa>${this.idEmpresa}</idempresa>
              <idorigen>${response.data[0]?.idCobrarPagarDoc}</idorigen>
              <tabla>${tipoTabla}</tabla>
              <idreferencia>${p.referencia}</idreferencia>
              <iddocumento>${tipo}</iddocumento>
              <serie>${p.serie}</serie>
              <numero>${p.numero}</numero>
              <fecha>${p.fecha}</fecha>
              <glosa/>
              <aplicar_ncr>0</aplicar_ncr>
              <documento2/>
              <exonerado>0</exonerado>
              <documento3/>
              <origen/>
            </docreferencia_cp>
            `).join('')}
          </VFPData>`,
          c_xml_ddet:carpeta?.srIgv === 2?`<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?>
          <VFPData>
            <det_detraccion>
                <idempresa>001</idempresa>
                <idcobrarpagardoc>${response.data[0]?.idCobrarPagarDoc}</idcobrarpagardoc>
                <item>001</item>
                <numerodetrac>000000000000000</numerodetrac>
                <fechadetrac>${carpeta?.fechaCreacion}</fechadetrac>
                <idtipodetra>${carpeta?.tipoDet}</idtipodetra>
                <tipodetra/>
                <tasadet>${detalledet.valor}</tasadet>
                <valorrefe_mof>0.00</valorrefe_mof>
                <valor_refe>0.00</valor_refe>
                <idoperacion/>
            </det_detraccion>
          </VFPData>`: `<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?><VFPData/>`,
          c_xml_da: `<?xml version = "1.0" encoding="Windows-1252" standalone="yes"?>
          <VFPData>
            <dcobrarpagardoc_a>
              <idempresa>${this.idEmpresa}</idempresa>
              <idcobrarpagardoc>${response.data[0]?.idCobrarPagarDoc}</idcobrarpagardoc>
              <semana>${
                (() => {
                  const fecha = new Date(carpeta?.fechaCreacion);
                  const inicioAno = new Date(fecha.getFullYear(), 0, 1);
                  const diasTranscurridos = Math.floor((fecha.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24));
                  return Math.ceil((diasTranscurridos + inicioAno.getDay() + 1) / 7);
                })()
              }
              </semana>
            </dcobrarpagardoc_a>
          </VFPData>`
        };
        console.log(body);
        this.apiService.grabarCobrarPagarDoc(body).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Provisión registrada correctamente.'
            });
            this.finalizarGeneracion();
          },
          error: (err) => {
            console.error('Error al grabar Provision:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo registrar el Provisión.'
            });
            this.finalizarGeneracion();
          }
        });
      },
      error: (err) => {
        console.error('Error al generar:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el documento'
        });
        this.finalizarGeneracion();
      }

    });
  }

  private finalizarGeneracion(): void {
    this.generarEnProceso = false;
  }

  crearCarpeta() {
    const carpetaRaiz = !this.idCarpetaPadre || this.idCarpetaPadre === 0;

    const body = {
      nombreCarpeta: this.nombreCarpeta,
      idCarpetaPadre: this.idCarpetaPadre,
      carpetaRaiz: carpetaRaiz,
      usuarioCreador: this.usuarioCreador,
      final: this.final
    };

    this.apiService.crearCarpeta(body).subscribe({
      next: () => {
        this.mostrarCardCrearCarpeta = false;
        this.nombreCarpeta = '';
        this.final = false;

        if (!this.idCarpetaPadre) {
          // idCarpetaPadre es null, undefined, 0 o falsy
          this.apiService.listarCarpeta('').subscribe((res) => {
            this.carpetasRaiz = res.data;
          });
        } else {
          this.verDetalle(this.idCarpetaPadre);
        }
      },
      error: (err) => {
        console.error('Error al crear carpeta', err);
      }
    });
  }



  mensajeAyudaFinal() {
    alert('Si marcas esta opción, la carpeta se creará como definitiva (Final).');
  }


  eliminarArchivo(event: MouseEvent, idCarpeta: string, nombreArchivo: string) {
    event.stopPropagation(); // Previene que se ejecute verArchivo

    this.confirmationService.confirm({
      message: `¿Deseas eliminar el archivo "${nombreArchivo}"?`,
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.apiService.eliminarArchivoDocumento(this.carpetaSeleccionada, nombreArchivo).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Archivo eliminado' });
            // Vuelve a cargar archivos (o simplemente los filtras si ya están en memoria)
            this.archivosCarpeta = this.archivosCarpeta.filter(a => a.name !== nombreArchivo);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error al eliminar archivo' });
            console.error(err);
          }
        });
      }
    });
  }

  getDescripcionMoneda(id: string): string {
    const monedaEncontrada = this.moneda.find(m => m.idMoneda === id);
    return monedaEncontrada ? monedaEncontrada.descripcion : 'Desconocida';
  }

  getDescripcionRegimen(id: string): string {
    const regimenEncontrado = this.regimen.find(r => r.idRegimen === id);
    return regimenEncontrado ? regimenEncontrado.descripcion : 'Desconocido';
  }

  getDescripcionImpuestos(id: string): string {
    const impuestoEncontrado = this.impuestos.find(r => r.idImpuestos === id);
    return impuestoEncontrado ? impuestoEncontrado.descripcion : 'Desconocido';
  }

  getMontoImpuesto(): number {
    const id = this.productoSeleccionadoResumen?.impuestos?.trim();
    const total = this.productoSeleccionadoResumen?.baseImponible || 0;

    const porcentaje = this.getImpuestoValor(id) / 100;
    return total * porcentaje;
  }

  cargarResumenProducto(idCarpeta: string) {

    const productoRelacionado = this.products.find(
      (prod: any) => prod.idCarpeta === idCarpeta
    );

    if (!productoRelacionado) {
      console.warn('No se encontró producto con idCarpeta:', idCarpeta);
      return;
    }
    console.log(productoRelacionado);
    const moneda = productoRelacionado.moneda || '';
    const regimen = productoRelacionado.regimen || '';
    const porcentaje = this.getImpuestoValor(productoRelacionado.impuestos) / 100;
    const importeBruto = Number(productoRelacionado.importeBruto) || 0;
    const baseImponible = porcentaje > 0
      ? importeBruto / (1 + porcentaje)
      : importeBruto;
    const totalProvisionado = productoRelacionado.importeBruto || '';
    const total = productoRelacionado.total || '';
    const impuestos = productoRelacionado.impuestos || '';

    this.productoSeleccionadoResumen = {
      moneda,
      regimen,
      baseImponible,
      impuestos,
      total,
      totalProvisionado
    };

    this.mostrarTablaSeleccionados = true;
    this.documentosConfirmados = [...this.seleccionadosTabla1];
    this.dialogoVisible = false;
  }

  mostrarHistorialDialog(id: string) {
    this.idCarpeta = id;
    this.mostrarHistorial = true;

    this.apiService.historialDocumento(id).subscribe({
      next: (response) => {
        this.historialCambios = response.data ?? [];
        console.log(response.data)
      },
      error: (err) => {
        console.error('Error al obtener historial', err);
        this.historialCambios = [];
      }
    });
  }

  onEditorPreparing(e: any): void {
    if (e.parentType === 'dataRow') {
      if (e.dataField === 'cuenta') {
        e.editorOptions.onKeyDown = (args: any) => {
          if (args?.event?.key === 'F2') {
            args.event.preventDefault();
            this.abrirSelectorCuenta(e);
          }
        };
      }

      if (e.dataField === 'costos') {
        e.editorOptions.onKeyDown = (args: any) => {
          if (args?.event?.key === 'F2') {
            args.event.preventDefault();
            this.abrirSelectorCentroCosto(e);
          }
        };
      }
    }
  }


  abrirSelectorCuenta(e: any): void {
    this.apiService.listaCuentas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cuentasDisponibles = res.data;

          // Puedes usar un DialogService, un PrimeNG DynamicDialog o simplemente un flag
          this.mostrarSelectorCuentas = true;
          this.filaEditandoCuenta = e.row?.rowIndex; // Guarda qué fila está editando
        }
      },
      error: (err) => {
        console.error('Error al listar cuentas:', err);
      }
    });
  }

  seleccionarCuenta(cuenta: any): void {
    if (this.filaEditandoCuenta !== undefined) {
      this.productosSeleccionados[this.filaEditandoCuenta].cuenta = cuenta.id.trim();
      this.mostrarSelectorCuentas = false;
      this.cuentaSeleccionada = null;
      this.filaEditandoCuenta = undefined;
    }
  }

  abrirSelectorCentroCosto(e: any): void {
    this.apiService.listaCentrosCosto().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.centrosCostoDisponibles = res.data;
          this.filaEditandoCentroCosto = e.row?.rowIndex;
          this.mostrarSelectorCentroCosto = true;
          this.centroCostoSeleccionado = null;
        }
      },
      error: (err) => {
        console.error('Error al listar centros de costo:', err);
      }
    });
  }

  seleccionarCentroCosto(costo: any): void {
    if (this.filaEditandoCentroCosto !== undefined) {
      const fila = this.productosSeleccionados[this.filaEditandoCentroCosto];
      fila.costos = costo.id.trim();
      fila.descripcioncc = costo.descripcion;
      this.mostrarSelectorCentroCosto = false;
      this.centroCostoSeleccionado = null;
      this.filaEditandoCentroCosto = undefined;
    }
  }

  inicializarNuevaFila(e: any): void {
    //     const productoRelacionado = this.products.find(
    //   (prod: any) => prod.idCarpeta === this.idCarpeta
    // );

    const observacion = this.productoSeleccionadoResumen?.observacionesGlosa || '';
    const regimen = this.productoSeleccionadoResumen.regimen;
    const destinocl =
      regimen === '01' ? '001' :
      regimen === '02' ? '' :
      regimen === '03' ? '004' :
      '';
      // Calcular el siguiente valor para la columna ITEM (001, 002, 003...)
      const itemsActuales = this.productosSeleccionados || [];

      let siguienteItem = '001';
      if (itemsActuales.length > 0) {
        const itemsNumericos = itemsActuales
          .map(x => x.item)
          .filter(i => /^[0-9]+$/.test(i))
          .map(i => parseInt(i, 10));

        const maxItem = itemsNumericos.length > 0 ? Math.max(...itemsNumericos) : 0;
        siguienteItem = (maxItem + 1).toString().padStart(3, '0');
      }
  // Aquí defines los valores por defecto para una nueva fila
    e.data = {
      item:siguienteItem,
      destino: destinocl, // ejemplo: valor por defecto
      importe: 0,
      cantidad: 1,
      descripcionp: observacion,
      producto: ''
    // puedes inicializar otros campos si deseas
  };
}

}

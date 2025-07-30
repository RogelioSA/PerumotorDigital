import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { throwError,Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  //private readonly apiUrl = 'https://localhost:8085/api';
  private readonly apiUrl = 'http://161.132.222.124:9697/api';
  constructor(private https: HttpClient) { }

  iniciarSesion(usuario: string, clave: string): Observable<any> {
    const params = new HttpParams()
      .set('usuario', usuario)
      .set('clave', clave);

    return this.https.get(`${this.apiUrl}/AuthReport/IniciarSesion`, { params });
  }


  crearDocumento(idEmpresa: string, idCarpeta: string, periodo: string, idCarpetaPadre:number, usuarioCreacion:string): Observable<any> {
    const body = {
      idEmpresa,
      idCarpeta,
      periodo,
      idCarpetaPadre,
      usuarioCreacion
    };

    return this.https.post(`${this.apiUrl}/BillingPayment/crearDocumento`, body);
  }

  listarArchivosCarpeta(Carpeta: string): Observable<any> {
    const params = new HttpParams()
      .set('Carpeta', Carpeta);

    return this.https.get(`${this.apiUrl}/BillingPayment/listarArchivosDocumento`, { params });
  }


  existeDocumento(idEmpresa: string, idCarpeta: string): Observable<any> {
    const params = new HttpParams()
      .set('idEmpresa', idEmpresa)
      .set('idCarpeta', idCarpeta);
    return this.https.post(`${this.apiUrl}/BillingPayment/existeDocumento?idEmpresa=${idEmpresa}&idCarpeta=${idCarpeta}`, null);
  }

  subirArchivoCarpeta(Carpeta: string, nombreArchivo: string, tipoArchivo: string, archivo: File | null): Observable<any> {
    if (!archivo) {
      return throwError(() => new Error('El archivo es nulo'));
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (archivo.size > MAX_SIZE) {
      return throwError(() => new Error('El archivo excede el tamaño máximo permitido de 10 MB.'));
    }

    const extension = archivo.name.split('.').pop();
    const archivoNombreCompleto = `${nombreArchivo}.${extension}`;

    const params = new HttpParams()
      .set('Carpeta', Carpeta)
      .set('nombreArchivo', archivoNombreCompleto)
      .set('tipoArchivo', archivo.type);

    return this.https.get<{ url: string }>(`${this.apiUrl}/BillingPayment/subirArchivoDocumento`, { params }).pipe(
      switchMap(response => {
        const uploadUrl = response.url;
        return this.https.put(uploadUrl, archivo, {
          headers: { 'Content-Type': archivo.type }
        });
      }),
      catchError(error => {
        console.error('Error al subir el archivo:', error);
        return throwError(() => error);
      })
    );
  }

  editarDocumento(body: {
    idEmpresa: string;
    idCarpeta: string;
    idCobrarPagarDoc: string;
    idArea: string;
    estado: string;
    revCtb: string;
    fechaVcto: string;
    fechaPago: string;
    comentario: string;
    revControl: string;
    lca: string;
    documento: string;
    razonSocial: string;
    srIgv: number;
    tipoDet: string;
    onsContable: string;
    regimen: string;
    importeBruto: number;
    impuestos: string;
    importeNeto: number;
    moneda: string;
    fechaProg: string;
    fechaEmision: string;
    periodo: string;
    tipoMovimiento: string;
    clasificacionLe: string;
    observacionesGlosa: string;
    fechaCreacion: string;
    fechaModificacion: string;
    usuarioModificacion: string;
    idCarpetaPadre: number;
    validado: boolean
  }): Observable<any> {
    return this.https.post(`${this.apiUrl}/BillingPayment/editarDocumento`, body);
  }

  listarCarpeta(idCarpeta: string): Observable<any> {
    const params = new HttpParams().set('idCarpeta', idCarpeta);
    return this.https.get(`${this.apiUrl}/BillingPayment/listarCarpetas`, { params });
  }

  filtrarDocumentos(idCarpeta: string): Observable<any> {
    const params = new HttpParams().set('idCarpeta', idCarpeta);
    return this.https.get(`${this.apiUrl}/BillingPayment/filtrarDocumentos`, { params });
  }

  opcionArea(): Observable<any> {
    return this.https.post(`${this.apiUrl}/BillingPayment/opcionArea`,{});
  }

  opciontipoDet(): Observable<any>{
    return this.https.post(`${this.apiUrl}/BillingPayment/opciontipoDet`,{});
  }

  opcionTipoMovimiento(): Observable<any>{
    return this.https.post(`${this.apiUrl}/BillingPayment/opcionTipoMovimiento`,{});
  }

  opcionClasificacionLE(): Observable<any>{
    return this.https.post(`${this.apiUrl}/BillingPayment/opcionClasificacionLE`,{});
  }

  listarDocumentosPendientes(idEmpresa: string, ruc: string, idDocumento:string): Observable<any> {
    const params = new HttpParams()
      .set('idEmpresa', idEmpresa)
      .set('ruc', ruc)
      .set('idDocumento', idDocumento)

    return this.https.get(`${this.apiUrl}/BillingPayment/listarDocumentosPendientes`, { params });
  }

  detalleDocumentosPendientes(idEmpresa: string, ruc: string, idDocumento:string, serie: string, numero:string): Observable<any> {
    const params = new HttpParams()
      .set('idEmpresa', idEmpresa)
      .set('ruc', ruc)
      .set('idDocumento', idDocumento)
      .set('serie', serie)
      .set('numero', numero)

    return this.https.get(`${this.apiUrl}/BillingPayment/detalleDocumentosPendientes`, { params });
  }

  generarIdCobrarPagarDoc(idEmpresa: string, idCarpeta:string): Observable<any> {
    const params = new HttpParams()
      .set('idEmpresa', idEmpresa)
      .set('idCarpeta', idCarpeta)

    return this.https.get(`${this.apiUrl}/BillingPayment/generarIdCobrarPagarDoc`, { params });
  }

  grabarCobrarPagarDoc(body: {
    lcEmpresa: string;
    lcId: string;
    idCarpeta: string;
    xmlData: string;
    xmlDeta: string;
    xmlImp: string;
    xmlRef: string;
    c_xml_da: string;

  }): Observable<any> {
    return this.https.post(`${this.apiUrl}/BillingPayment/grabarCobrarPagarDoc`, body);
  }

  ConsultarRefGuia(idDocumento: string, serie:string, numero:string): Observable<any> {
    const params = new HttpParams()
      .set('idDocumento', idDocumento)
      .set('serie', serie)
      .set('numero', numero)

    return this.https.get(`${this.apiUrl}/BillingPayment/ConsultarRefGuia`, { params });
  }

  crearCarpeta(body: {
    nombreCarpeta: string;
    idCarpetaPadre: number;
    carpetaRaiz: boolean;
    usuarioCreador: string;
    final: boolean;
  }): Observable<any> {
    return this.https.post(`${this.apiUrl}/BillingPayment/crearCarpeta`, body);
  }


  eliminarDocumento(idEmpresa: string, idCarpeta:string): Observable<any> {

    return this.https.post(`${this.apiUrl}/BillingPayment/eliminarDocumento?idEmpresa=${idEmpresa}&idCarpeta=${idCarpeta}`, null);
  }

  eliminarArchivoDocumento(carpeta: string, nombreArchivo:string): Observable<any> {
    carpeta = carpeta.trim();
    nombreArchivo = nombreArchivo.trim();
    return this.https.post(`${this.apiUrl}/BillingPayment/eliminarArchivoDocumento?carpeta=${carpeta}&nombreArchivo=${nombreArchivo}`, null);
  }

  validarCuenta(idEmpresa: string, idCuenta:string): Observable<any> {
    const params = new HttpParams()
      .set('idEmpresa', idEmpresa)
      .set('idCuenta', idCuenta)

    return this.https.get(`${this.apiUrl}/BillingPayment/ValidarCuenta`, { params });
  }

  validarDestino(idDestino: string): Observable<any> {
    const params = new HttpParams()
      .set('idDestino', idDestino)

    return this.https.get(`${this.apiUrl}/BillingPayment/ValidarDestino`, { params });
  }

  validarCentroCosto(idEmpresa: string, idCentroCosto:string): Observable<any> {
    const params = new HttpParams()
      .set('idEmpresa', idEmpresa)
      .set('idCentroCosto', idCentroCosto)

    return this.https.get(`${this.apiUrl}/BillingPayment/ValidarCentroCosto`, { params });
  }

  historialDocumento(idDocumento: string): Observable<any> {
    const params = new HttpParams()
      .set('idDocumento', idDocumento)

    return this.https.get(`${this.apiUrl}/BillingPayment/HistorialDocumento`, { params });
  }

  enviarAFactiliza(data: {
    ruc_emisor: string;
    codigo_tipo_documento: string;
    serie_documento: string;
    numero_documento: string;
    fecha_emision: string;
    total: string;
  }): Observable<any> {
    const url = 'https://api.factiliza.com/v1/sunat/cpe';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzODg5NyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.1nvg8UKFQFIc2JNZkD5lmzCZsR4-_PH7aIHiRvPhkU0'; // ← Reemplaza por tu token real

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.https.post(url, data, { headers });
  }

  listaCuentas(): Observable<any>{
    return this.https.get(`${this.apiUrl}/BillingPayment/listaCuentas`,{});
  }

  listaCentrosCosto(): Observable<any>{
    return this.https.get(`${this.apiUrl}/BillingPayment/listaCentrosCosto`,{});
  }

  listarSucursales(): Observable<any>{
    return this.https.get(`${this.apiUrl}/ResumeBySeller/GetSucursal`,{});
  }
}

import Cotizacion from '../models/Cotizacion';
import type { DatosFormulario } from '../views/FormView';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- NUEVO IMPORT DEL PLUGIN

// Cached logo base64 strings
let logoCache: Record<string, string> = {};

async function loadImageAsBase64(url: string): Promise<string> {
    if (logoCache[url]) return logoCache[url];
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                logoCache[url] = result;
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return '';
    }
}

// Función auxiliar para convertir números a letras (Soles)
function numeroALetras(num: number): string {
    const entero = Math.floor(num);
    if (entero === 0) return 'CERO';

    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = { 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE', 16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE', 21: 'VEINTIUNO', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO', 25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE' };
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertirGrupo(n: number): string {
        if (n === 100) return 'CIEN';
        let res = '';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;

        res += centenas[c] + ' ';

        const du = n % 100;
        if (du > 0) {
            if (du < 10) res += unidades[du];
            else if (du >= 11 && du <= 29 && du !== 20) res += especiales[du as keyof typeof especiales];
            else {
                res += decenas[d];
                if (u > 0) res += ' Y ' + unidades[u];
            }
        }
        return res.trim();
    }

    if (entero < 1000) return convertirGrupo(entero);
    if (entero < 1000000) {
        const miles = Math.floor(entero / 1000);
        const resto = entero % 1000;
        const strMiles = miles === 1 ? 'MIL' : convertirGrupo(miles) + ' MIL';
        return (strMiles + ' ' + convertirGrupo(resto)).trim();
    }
    const millones = Math.floor(entero / 1000000);
    const restoMillones = entero % 1000000;
    const strMillones = millones === 1 ? 'UN MILLÓN' : convertirGrupo(millones) + ' MILLONES';
    if (restoMillones === 0) return strMillones;

    const miles = Math.floor(restoMillones / 1000);
    const resto = restoMillones % 1000;
    const strMiles = miles === 0 ? '' : (miles === 1 ? 'MIL' : convertirGrupo(miles) + ' MIL');

    return (strMillones + ' ' + strMiles + ' ' + convertirGrupo(resto)).trim().replace(/\s+/g, ' ');
}

export default class ExportService {
    static async exportarPDF(cotizacion: Cotizacion, formData: DatosFormulario): Promise<void> {
        try {
            // Load logos
            const [logoSoiltest, logoIso, logoLean] = await Promise.all([
                loadImageAsBase64('/assets/logos/soiltest.png'),
                loadImageAsBase64('/assets/logos/iso-9001.png'),
                loadImageAsBase64('/assets/logos/lean-bim.png'),
            ]);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageW = 210;
            const pageH = 297;
            const m = 5; // Margen reducido a 0.5 cm (5 mm)
            const w = pageW - 2 * m; // Ancho utilizable = 200
            
            const totalCotizacion = cotizacion.calcularTotal();

            // === HOJA 1: Cotización ===
            let y = this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData, 'COTIZACIÓN');
            y = this.dibujarDatosAsesorYCotizacion(pdf, m, w, y, formData);
            y = this.dibujarDatosCliente(pdf, m, w, y, formData);
            y = this.dibujarOpciones(pdf, m, w, y, formData);
            y = this.dibujarProyecto(pdf, m, w, y, formData);
            y = this.dibujarTablaItems(pdf, m, w, y, cotizacion, formData, logoSoiltest, logoIso, logoLean, pageH, totalCotizacion);
            this.dibujarFooterConFirma(pdf, m, w, pageH, totalCotizacion);

            // === HOJA 2: Términos y condiciones ===
            pdf.addPage();
            let yTerms = this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData, 'TÉRMINOS Y CONDICIONES');
            this.dibujarTerminos(pdf, m, w, yTerms, pageH);

            // Save
            const nombre = formData.cliente.nombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').trim().replace(/ /g, '_') || 'Cliente';
            const archivo = `Cotizacion_${nombre}_${formData.cotizacionNro || '001'}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(archivo);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF. Revise la consola para más detalles.');
        }
    }

    // ==================== HEADER (Reutilizable) ====================
    private static dibujarHeader(pdf: jsPDF, m: number, w: number, logoSoiltest: string, logoIso: string, logoLean: string, formData: DatosFormulario, titulo: string): number {
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];
        const gris: [number, number, number] = [100, 100, 100];

        // Logo SoilTest (Esquina superior izquierda)
        if (logoSoiltest) {
            try { pdf.addImage(logoSoiltest, 'PNG', m, m, 15, 10); } catch { /* skip */ }
        }

        // Título Empresa y Eslogan (Pegado al logo izquierdo)
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('SOILTEST PERÚ', m + 17, m + 4);

        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...gris);
        pdf.text('LABORATORIO DE MECÁNICA DE SUELOS,', m + 17, m + 7);
        pdf.text('CONCRETO Y PAVIMENTOS', m + 17, m + 9.5);

        // TÍTULO CENTRAL (COTIZACIÓN o TÉRMINOS Y CONDICIONES)
        const cx = m + w / 2;
        pdf.setFontSize(titulo === 'COTIZACIÓN' ? 14 : 12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text(titulo, cx, m + 7, { align: 'center' });

        // Logos ISO y BIM (Extremo superior derecho)
        if (logoLean) {
            try { pdf.addImage(logoLean, 'PNG', m + w - 25, m, 25, 12); } catch { /* skip */ }
        }
        if (logoIso) {
            try { pdf.addImage(logoIso, 'PNG', m + w - 40, m, 12, 12); } catch { /* skip */ }
        }

        // METADATOS: Apilados verticalmente, a una distancia segura de los logos
        const labelX = m + w - 62.5;
        const valueX = m + w - 52;
        let metY = m + 2;
        
        const codigo = formData.codigo || 'ADM-CO-001';
        const version = formData.version || '01';
        const fecha = formData.fecha || new Date().toISOString().slice(0, 10);
        const pagina = `${formData.pagina || '1'} de 2`;

        pdf.setFontSize(6);

        // Código
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...rojo);
        pdf.text('CÓDIGO:', labelX, metY);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...negro);
        pdf.text(codigo, valueX, metY);
        metY += 3;

        // Versión
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...rojo);
        pdf.text('VERSIÓN:', labelX, metY);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...negro);
        pdf.text(version, valueX, metY);
        metY += 3;

        // Fecha
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...rojo);
        pdf.text('FECHA:', labelX, metY);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...negro);
        pdf.text(fecha, valueX, metY);
        metY += 3;

        // Página
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...rojo);
        pdf.text('PÁGINA:', labelX, metY);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...negro);
        pdf.text(pagina, valueX, metY);

        // Retorna la posición Y donde terminará este bloque
        return m + 16; 
    }

    // ==================== ASESOR + FECHAS ====================
    private static dibujarDatosAsesorYCotizacion(pdf: jsPDF, m: number, w: number, startY: number, formData: DatosFormulario): number {
        const y = startY;
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];

        pdf.setFontSize(7);

        // Columna 1: Asesor info (Izquierda)
        const labels = [
            ['Asesor Técnico:', formData.asesor.nombre],
            ['Oficina:', formData.asesor.oficina],
            ['Referencia:', formData.asesor.referencia],
            ['Celular:', formData.asesor.celular],
        ];
        labels.forEach((pair, i) => {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...rojo);
            pdf.text(pair[0], m + 2, y + i * 4.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...negro);
            pdf.text(pair[1] || '', m + 25, y + i * 4.5);
        });

        // Columna 2: Fechas y Cotización (Derecha)
        const rightX = m + w - 60;
        const rightLabels = [
            ['COTIZACIÓN N°:', formData.cotizacionNro || ''],
            ['CLIENTE ID:', formData.clienteId || '-'],
            ['VÁLIDO HASTA:', formData.validoHasta || ''],
        ];
        rightLabels.forEach((pair, i) => {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...rojo);
            pdf.text(pair[0], rightX, y + i * 4.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...negro);
            pdf.text(pair[1], rightX + 26, y + i * 4.5);
        });

        // Separador
        const endY = y + 15;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(m, endY, m + w, endY);

        return endY + 2;
    }

    // ==================== CLIENTE ====================
    private static dibujarDatosCliente(pdf: jsPDF, m: number, w: number, startY: number, formData: DatosFormulario): number {
        const y = startY;
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];

        // Yellow background
        pdf.setFillColor(255, 252, 220);
        pdf.rect(m, y, w, 5, 'F');

        // "CLIENTE:" label
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('CLIENTE:', m + 2, y + 3.5);

        const dataY = y + 7;
        pdf.setFontSize(7);

        // Row 1: Nombre + RUC
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('Nombre:', m + 2, dataY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.cliente.nombre || '', m + 22, dataY);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('RUC:', m + w - 50, dataY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.cliente.ruc || '', m + w - 40, dataY);

        // Row 2: Referencia
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('Referencia:', m + 2, dataY + 4.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.cliente.referencia || '', m + 22, dataY + 4.5);

        // Row 3: Dirección
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('Dirección:', m + 2, dataY + 9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.cliente.direccion || '', m + 22, dataY + 9);

        const endY = dataY + 11.5;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(m, endY, m + w, endY);

        return endY + 2;
    }

    // ==================== OPCIONES ====================
    private static dibujarOpciones(pdf: jsPDF, m: number, w: number, startY: number, formData: DatosFormulario): number {
        let y = startY;
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];

        pdf.setFontSize(6.5);

        // --- FILA 1 ---
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('ORIGEN:', m + 2, y + 3);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        this.dibujarCheckbox(pdf, m + 16, y + 0.5, formData.origen === 'publico');
        pdf.text('PÚBLICO', m + 21, y + 3);
        this.dibujarCheckbox(pdf, m + 36, y + 0.5, formData.origen === 'privado');
        pdf.text('PRIVADO', m + 41, y + 3);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('TIPO DE PROYECTO:', m + 60, y + 3);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.tipoProyecto || '', m + 93, y + 3);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('SITUACIÓN DE PROYECTO:', m + 135, y + 3);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.situacionProyecto || '', m + 172, y + 3);

        y += 7;

        // --- FILA 2 ---
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('CONTENIDO MÍNIMO:', m + 2, y + 3);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.contenidoMinimo || '', m + 33, y + 3);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('SALIDA A CAMPO:', m + 135, y + 3);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        this.dibujarCheckbox(pdf, m + 162, y + 0.5, formData.salidaCampo === 'si');
        pdf.text('SÍ', m + 166, y + 3);
        this.dibujarCheckbox(pdf, m + 175, y + 0.5, formData.salidaCampo === 'no');
        pdf.text('NO', m + 179, y + 3);

        y += 8;

        // --- FILA 3: Tipo de Servicio ---
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('TIPO DE SERVICIO:', m + 2, y + 3);

        const servicios = [
            'ESTUDIO DE CONTROL DE CALIDAD EN OBRAS',
            'ESTUDIO DE VERIFICACIÓN DE INGENIERÍA',
            'ESTUDIO DE PERITAJE',
            'ESTUDIO ESPECIALIZADO DE INGENIERÍA',
            'ALQUILER DE EQUIPO',
        ];

        y += 4;
        pdf.setFontSize(5.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);

        const col1 = m + 5;
        const col2 = m + 100;

        // Fila 1 de servicios
        this.dibujarCheckbox(pdf, col1, y + 0.5, formData.tiposServicio.includes(servicios[0]));
        pdf.text(servicios[0], col1 + 4, y + 3);
        this.dibujarCheckbox(pdf, col2, y + 0.5, formData.tiposServicio.includes(servicios[1]));
        pdf.text(servicios[1], col2 + 4, y + 3);

        y += 4.5;
        // Fila 2 de servicios
        this.dibujarCheckbox(pdf, col1, y + 0.5, formData.tiposServicio.includes(servicios[2]));
        pdf.text(servicios[2], col1 + 4, y + 3);
        this.dibujarCheckbox(pdf, col2, y + 0.5, formData.tiposServicio.includes(servicios[3]));
        pdf.text(servicios[3], col2 + 4, y + 3);

        y += 4.5;
        // Fila 3 de servicios
        this.dibujarCheckbox(pdf, col1, y + 0.5, formData.tiposServicio.includes(servicios[4]));
        pdf.text(servicios[4], col1 + 4, y + 3);

        const endY = y + 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(m, endY, m + w, endY);

        return endY + 2;
    }

    // ==================== PROYECTO ====================
    private static dibujarProyecto(pdf: jsPDF, m: number, w: number, startY: number, formData: DatosFormulario): number {
        const y = startY;
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('Proyecto:', m + 2, y + 3);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        const proyectoLines = this.splitText(pdf, formData.proyecto || '', w - 25);
        proyectoLines.forEach((line, i) => {
            pdf.text(line, m + 22, y + 3 + i * 4);
        });

        const endY = y + 5 + Math.max(proyectoLines.length - 1, 0) * 4;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(m, endY, m + w, endY);

        return endY + 4; // Espacio extra de separación antes de la Tabla de Ítems
    }

    // ==================== TABLA DE ITEMS (Inteligente con jspdf-autotable) ====================
    private static dibujarTablaItems(
        pdf: jsPDF, m: number, w: number, startY: number,
        cotizacion: Cotizacion, formData: DatosFormulario,
        logoSoiltest: string, logoIso: string, logoLean: string,
        pageH: number, totalCotizacion: number
    ): number {
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];

        const items = cotizacion.obtenerItems();
        
        // Mapeamos los datos de la cotización a un formato Array de Arrays para el plugin
        const tableBody = items.map((item, idx) => [
            String(idx + 1),
            item.codigo,
            item.descripcion,
            item.unidad,
            String(item.cantidad),
            `S/ ${item.precioUnitario.toFixed(2)}`,
            `S/ ${(item.cantidad * item.precioUnitario).toFixed(2)}`,
        ]);

        // Ejecución de la tabla inteligente
        autoTable(pdf, {
            startY: startY,
            head: [['ITEM', 'CÓDIGO', 'DESCRIPCIÓN DEL ENSAYO', 'UND', 'CANT.', 'P. UNIT.', 'TOTAL']],
            body: tableBody,
            theme: 'plain',
            styles: {
                font: 'helvetica',
                fontSize: 6.5,
                textColor: negro,
                cellPadding: 1.5,
                lineColor: [220, 220, 220],
                lineWidth: { bottom: 0.1 } // Líneas tenues separando filas
            },
            headStyles: {
                fillColor: rojo,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 12, halign: 'left' },
                1: { cellWidth: 20, halign: 'left' },
                2: { cellWidth: 86, halign: 'left' }, // Textos largos harán salto de línea automático aquí
                3: { cellWidth: 14, halign: 'left' },
                4: { cellWidth: 14, halign: 'right' },
                5: { cellWidth: 27, halign: 'right' },
                6: { cellWidth: 27, halign: 'right' },
            },
            alternateRowStyles: {
                fillColor: [252, 248, 248] // Filas intercaladas gris claro
            },
            // Margin top reservado para que cuando salte a una nueva hoja, no pise el encabezado
            margin: { left: m, right: m, top: 25, bottom: 20 },
            didDrawPage: (data) => {
                // Si la tabla es muy larga y crea una nueva página, volvemos a dibujar el encabezado
                if (data.pageNumber > 1) {
                    this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData, 'COTIZACIÓN');
                }
            }
        });

        // Obtener la posición Y exacta donde el plugin terminó de dibujar la tabla
        let finalY = (pdf as any).lastAutoTable.finalY + 4;

        // Línea roja de cierre visual de tabla
        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(0.3);
        pdf.line(m, finalY - 4, m + w, finalY - 4);

        // --- VERIFICACIÓN CRÍTICA DE ESPACIO PARA TOTALES Y FOOTER ---
        // Si no queda espacio en la hoja actual (al menos 11 cm) para las cuentas y firma, forzamos hoja nueva.
        const espacioRequeridoFooter = 110; 
        if (finalY > pageH - espacioRequeridoFooter) {
            pdf.addPage();
            finalY = this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData, 'COTIZACIÓN');
            finalY += 5; // Un pequeño margen antes de imprimir los totales
        }

        // ==================== DIBUJAR TOTALES ====================
        const subtotal = cotizacion.calcularSubtotal();
        const igv = cotizacion.calcularIGV();
        const total = totalCotizacion;

        const totalsX = m + w - 60;

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        
        pdf.text('SUBTOTAL S/.', totalsX, finalY);
        pdf.text(`${subtotal.toFixed(2)}`, m + w - 2, finalY, { align: 'right' });
        finalY += 4.5;

        // Descuento estático (Para futuro: conectarlo al modelo Cotizacion)
        const descuento = typeof (cotizacion as any).calcularDescuento === 'function' ? (cotizacion as any).calcularDescuento() : 0;
        pdf.text('DESCUENTO', totalsX, finalY);
        pdf.text(`${descuento.toFixed(2)}`, m + w - 2, finalY, { align: 'right' });
        finalY += 4.5;

        pdf.text('IGV (18%)', totalsX, finalY);
        pdf.text(`${igv.toFixed(2)}`, m + w - 2, finalY, { align: 'right' });
        finalY += 5;

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.setFontSize(9);
        pdf.text('TOTAL S/.', totalsX, finalY);
        pdf.text(`${total.toFixed(2)}`, m + w - 2, finalY, { align: 'right' });

        return finalY + 5;
    }

    // ==================== FOOTER (Firma y Términos Breves) ====================
    private static dibujarFooterConFirma(pdf: jsPDF, m: number, w: number, pageH: number, total: number): void {
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];
        const gris: [number, number, number] = [100, 100, 100];

        // BLOQUE SUPERIOR DEL FOOTER: Textos y términos
        let y = pageH - 74; 

        // MONTO EN LETRAS
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...negro);
        const centavos = Math.round((total % 1) * 100).toString().padStart(2, '0');
        const totalTexto = numeroALetras(total);
        pdf.text(`SON: ${totalTexto} Y CON ${centavos}/100 SOLES`, m + 2, y);

        // BREVES TÉRMINOS
        y += 4.5;
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text('1. Los precios incluyen los impuestos de ley (IGV).', m + 2, y); y += 3.5;
        pdf.text('2. La forma de pago es 50% al inicio y 50% a la entrega del informe final.', m + 2, y); y += 3.5;
        pdf.setFont('helvetica', 'italic');
        pdf.text('Nota: Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros.', m + 2, y); y += 5.5;

        // IMPORTANTE
        pdf.setFont('helvetica', 'bold');
        pdf.text('IMPORTANTE:', m + 2, y); y += 3.5;
        pdf.setFont('helvetica', 'normal');
        pdf.text('SE AVANZARÁ CON EL INFORME DEL PROYECTO UNA VEZ BRINDADA LA INFORMACIÓN SOLICITADA DENTRO', m + 4, y); y += 3.5;
        pdf.text('DE LA FECHA DETERMINADA CASO CONTRARIO SE PARALIZARÁ EL PROYECTO.', m + 4, y); y += 3.5;
        pdf.text('TODA SOLICITUD DE AVANCE DEL PROYECTO FUERA DE PLAZO DE EJECUCIÓN DE SERVICIO SERÁ CON', m + 4, y); y += 3.5;
        pdf.text('LA CANCELACIÓN DEL 100%.', m + 4, y); y += 5;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Tiempo de entrega: 10 días hábiles', m + 2, y); y += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.text('A continuación se detallan los números de cuenta:', m + 2, y);

        // BLOQUE INFERIOR DEL FOOTER: Bancario y Contacto (Izquierda)
        const bottomY = pageH - 22; // Posicionamiento en el límite inferior de la página
        const leftX = m + 2;
        
        // Datos Bancarios
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('DATOS BANCARIOS:', leftX, bottomY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text('Banco: INTERBANK', leftX, bottomY + 4);
        pdf.text('Cta: 4403002914544', leftX, bottomY + 7.5);
        pdf.text('CCI: 00344000300291454455', leftX, bottomY + 11);

        // Contacto
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('CONTACTO:', leftX + 60, bottomY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text('soiltestperu.srl@gmail.com', leftX + 60, bottomY + 4);
        
        // Nueva dirección extendida (Debajo de bancos y contacto)
        pdf.text('Dirección: AA. HH. COVADONGA MZ "T2" LT 04 - Distrito de Ayacucho - Huamanga - Ayacucho', leftX, bottomY + 16);

        // Agradecimiento en letras muy pequeñas
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(6);
        pdf.setTextColor(...gris);
        pdf.text('Gracias por hacer negocios con nosotros', leftX, bottomY + 20);

        // ==================== FIRMA FLOTANTE ENCIMA DEL FOOTER ====================
        const rightX = m + w - 60; // Área de firma alineada a la derecha
        const firmaW = 50;
        
        // La firma se eleva por encima del nivel de los Datos Bancarios
        const firmaLineY = bottomY - 13; 
        
        pdf.setDrawColor(...negro);
        pdf.setLineWidth(0.3);
        pdf.line(rightX, firmaLineY, rightX + firmaW, firmaLineY);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(...rojo);
        // FIRMA se coloca justo por debajo de la línea
        pdf.text('FIRMA', rightX + firmaW / 2, firmaLineY + 4, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...gris);
        pdf.setFontSize(6);
        pdf.text('Representante Legal', rightX + firmaW / 2, firmaLineY + 7.5, { align: 'center' });
    }

    // ==================== TÉRMINOS (Arriba en Hoja 2) ====================
    private static dibujarTerminos(pdf: jsPDF, m: number, w: number, startY: number, pageH: number): void {
        const negro: [number, number, number] = [0, 0, 0];
        const rojo: [number, number, number] = [200, 0, 0];
        let y = startY + 5; 

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);

        const terminos = [
            ['1. Principal:', 'Al aceptar la presente cotización, el cliente reconoce y asume plenamente el conocimiento de los requisitos indispensables para la adecuada realización de los servicios especificados. En caso de omisión o desconocimiento de dichos requisitos, la responsabilidad recaerá exclusivamente sobre el cliente. Únicamente tendrán validez las cotizaciones y precios que estén debidamente estipulados por escrito. Cualquier acuerdo, ya sea verbal o telefónico, deberá ser ratificado mediante un documento escrito para su confirmación y validez contractual.'],
            ['2. Precio:', 'Todos nuestros precios se encuentran expresados en soles, a menos que se especifique explícitamente otra moneda. Los servicios están sujetos a detracción, mientras que los bienes no lo están. Para el proceso de detracciones, nos regimos por el Sistema de Pago de Obligaciones Tributarias con el Gobierno Central (SPOT), según lo dispuesto por el Decreto Legislativo 940.'],
            ['3. Tiempo de entrega:', 'Debido a la disponibilidad de recursos humanos, equipos, partes, consumibles y accesorios en nuestras instalaciones, el plazo de entrega de nuestros servicios se contará a partir de la recepción de su muestra o anticipo económico. La aprobación se considerará otorgada en el momento en que todos los aspectos técnicos y comerciales hayan sido acordados y toda la documentación haya sido procesada. Es importante señalar que este plazo puede variar en función de la mencionada disponibilidad, por lo que se emitirá la confirmación de la entrega final a través de medios de comunicación como llamada telefónica, correo electrónico o aplicación de mensajería instantánea como WhatsApp.'],
            ['4. Vigencia:', 'Los precios indicados en nuestras cotizaciones tienen una vigencia de 15 días a partir de la fecha de recepción por parte del cliente. Le solicitamos amablemente que verifique el precio actual en caso de que haya transcurrido dicho periodo. Mantenemos un compromiso con la transparencia y la actualización constante de nuestros precios para brindarle un servicio de calidad y una experiencia satisfactoria. Por lo tanto, le recomendamos encarecidamente que consulte con nosotros para obtener la información más precisa y actualizada.'],
            ['5. Confidencialidad:', 'Ninguna de las partes podrá divulgar a terceros cualquier información perteneciente a la otra parte, salvo aquella que sea de dominio público o de conocimiento general, tomando ambas partes las medidas necesarias para evitar el acceso no autorizado a dicha información. La entrega de los resultados físicos se llevará a cabo en nuestras instalaciones, a menos que el cliente especifique expresamente lo contrario.'],
            ['6. Garantía:', 'Nuestros equipos están sujetos a una calibración vigente, además de someterse a verificaciones internas permanentes para garantizar su precisión y fiabilidad. Los ensayos que llevamos a cabo se realizan siguiendo los procedimientos establecidos por las normativas pertinentes, tales como las normas del Ministerio de Transportes y Comunicaciones (MTC), Normas Técnicas Peruanas (NTP), American Society for Testing and Materials (ASTM), American Association of State Highway and Transportation Officials (AASHTO). Además, nuestros procesos están respaldados por un sistema de gestión de calidad en proceso de implementación, lo que garantiza un enfoque metódico y consistente en la ejecución de nuestros servicios, asegurando altos estándares de calidad y satisfacción del cliente.'],
            ['7. Muestras:', 'Al finalizar los ensayos, cualquier cantidad de muestra sobrante permanecerá bajo custodia en el Laboratorio por un periodo de 14 días calendario, contados a partir de la emisión y entrega del informe de resultados. Es responsabilidad exclusiva del cliente recoger sus contra muestras durante el período de custodia en el laboratorio. Durante la realización de los ensayos, en caso de que las muestras se vean afectadas por algún motivo inesperado, como contaminación o pérdida de identificación, entre otras causas, se notificará inmediatamente al Cliente para que pueda proporcionar muestras adicionales necesarias para la culminación de los ensayos. Es importante destacar que cuando el Cliente proporciona muestras a la organización, este asume total responsabilidad por la toma de datos correctos, identificación adecuada, así como el muestreo y transporte de las muestras al laboratorio. Los resultados entregados serán emitidos de acuerdo con las muestras proporcionadas por el Cliente.'],
            ['8. Ensayos:', 'Los ensayos, tanto de campo como de laboratorio, serán realizados siguiendo estrictamente las normativas establecidas por el Ministerio de Transportes y Comunicaciones (MTC), las Normas Técnicas Peruanas (NTP) y las normas de la American Society for Testing and Materials (ASTM). El cumplimiento de estas normativas garantiza la integridad, precisión y fiabilidad de los ensayos realizados, así como la conformidad con los estándares nacionales e internacionales reconocidos en el ámbito de la ingeniería y la construcción.'],
            ['9. Datos:', 'El cliente asume la responsabilidad de proporcionar datos precisos y completos para la elaboración de informes y/o reportes. Los datos obligatorios requeridos incluyen el nombre del proyecto, ubicación, fotografías, nombre del solicitante, identificación de la muestra y dirección de correo electrónico. En caso de que los datos proporcionados sean incorrectos, la empresa no se hará responsable y el cliente deberá cubrir los gastos necesarios para la corrección de los informes. Además, el cliente deberá suministrar los datos correctos del Registro Único de Contribuyentes (RUC) para fines de facturación y cumplimiento fiscal. Para cualquier queja o sugerencia, solicitamos amablemente que se ponga en contacto con nosotros a través del correo electrónico: soiltestperu.srl@gmail.com'],
        ];

        terminos.forEach(([titulo, contenido]) => {
            if (y > pageH - 20) { 
                pdf.addPage();
                y = m + 15;
            }

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...rojo);
            pdf.text(titulo, m + 2, y);
            y += 4;

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...negro);
            const lines = this.splitText(pdf, contenido, w - 4);
            lines.forEach(line => {
                pdf.text(line, m + 2, y);
                y += 3.5;
            });
            y += 3;
        });
    }

    // ==================== HELPERS ====================
    private static dibujarCheckbox(pdf: jsPDF, x: number, y: number, checked: boolean): void {
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.3);
        pdf.rect(x, y, 3.5, 3.5);

        if (checked) {
            pdf.setFillColor(200, 0, 0);
            pdf.rect(x + 0.7, y + 0.7, 2.1, 2.1, 'F');
        }
    }

    private static splitText(pdf: jsPDF, text: string, maxWidth: number): string[] {
        if (!text) return [''];
        const words = text.split(' ');
        const lines: string[] = [];
        let current = '';

        words.forEach(word => {
            const test = current ? current + ' ' + word : word;
            if (pdf.getTextWidth(test) < maxWidth) {
                current = test;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        });
        if (current) lines.push(current);
        return lines;
    }
}
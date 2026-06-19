import Cotizacion from '../models/Cotizacion';
import type { DatosFormulario } from '../views/FormView';
import jsPDF from 'jspdf';

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
            const m = 10; // margin
            const w = pageW - 2 * m; // usable width = 190

            // === HOJA 1: Cotización ===
            this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData);
            let y = this.dibujarDatosAsesorYCotizacion(pdf, m, w, formData);
            y = this.dibujarDatosCliente(pdf, m, w, y, formData);
            y = this.dibujarProyecto(pdf, m, w, y, formData);
            y = this.dibujarOpciones(pdf, m, w, y, formData);
            y = this.dibujarTablaItems(pdf, m, w, y, cotizacion, formData, logoSoiltest, logoIso, logoLean, pageH);
            this.dibujarFooterConFirma(pdf, m, w, pageH);

            // === HOJA 2: Términos y condiciones ===
            pdf.addPage();
            //this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData);
            this.dibujarTerminos(pdf, m, w, pageH);

            // Save
            const nombre = formData.cliente.nombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').trim().replace(/ /g, '_') || 'Cliente';
            const archivo = `Cotizacion_${nombre}_${formData.cotizacionNro || '001'}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(archivo);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF. Revise la consola para más detalles.');
        }
    }

    // ==================== HEADER ====================
    private static dibujarHeader(pdf: jsPDF, m: number, w: number, logoSoiltest: string, logoIso: string, logoLean: string, formData: DatosFormulario): void {
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];
        const gris: [number, number, number] = [100, 100, 100];

        // Top border line
        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(1);
        pdf.line(m, m, m + w, m);

        // ISO and LEAN logos (top right)
        if (logoIso) {
            try { pdf.addImage(logoIso, 'PNG', m + w - 55, m + 2, 10, 10); } catch { /* skip */ }
        }
        if (logoLean) {
            try { pdf.addImage(logoLean, 'PNG', m + w - 30, m + 2, 15, 10); } catch { /* skip */ }
        }

        // SoilTest logo (left)
        if (logoSoiltest) {
            try { pdf.addImage(logoSoiltest, 'PNG', m + 10, m + 10, 15, 10); } catch { /* skip */ }
        }

        // Company name next to logo
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('SOILTEST PERÚ', m + 27, m + 18);

        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...gris);
        pdf.text('LABORATORIO DE MECÁNICA DE SUELOS,', m + 27, m + 22);
        pdf.text('CONCRETO Y PAVIMENTOS', m + 27, m + 25);

        // "COTIZACIÓN" title - centered
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('COTIZACIÓN', m + w / 2 - 10, m + 20, { align: 'center' });

        // Metadata box (right side, below logos)
        const metaX = m + w - 55;
        const metaY = m + 25;
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('Código:', metaX, metaY);
        pdf.text('Versión:', metaX, metaY + 4);
        pdf.text('Fecha:', metaX, metaY + 8);
        pdf.text('Página:', metaX, metaY + 12);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.codigo || 'ADM-CO-001', metaX + 18, metaY);
        pdf.text(formData.version || '01', metaX + 18, metaY + 4);
        pdf.text(formData.fecha || new Date().toISOString().slice(0, 10), metaX + 18, metaY + 8);
        pdf.text(`${formData.pagina || '1'} de 2`, metaX + 18, metaY + 12);

        // Bottom border of header
        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(0.5);
        pdf.line(m, m + 40, m + w, m + 40);
    }

    // ==================== ASESOR + FECHAS ====================
    private static dibujarDatosAsesorYCotizacion(pdf: jsPDF, m: number, w: number, formData: DatosFormulario): number {
        const y = m + 43;
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];

        pdf.setFontSize(7);

        // Left column: Asesor info
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
            pdf.text(pair[1] || '', m + 30, y + i * 4.5);
        });

        // Right column: Dates
        const rightX = m + w - 55;
        const rightLabels = [
            ['FECHA:', formData.fecha || new Date().toLocaleDateString('es-PE')],
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
            pdf.text(pair[1], rightX + 28, y + i * 4.5);
        });

        // Separator
        const endY = y + 20;
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

        const endY = dataY + 13;
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

        const endY = y + 5 + Math.max(proyectoLines.length, 1) * 4;
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

        // Row 1: Origen + Tipo de Proyecto + Tipo de Servicio
        // ORIGEN
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('ORIGEN:', m + 2, y + 3);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        this.dibujarCheckbox(pdf, m + 22, y + 0.5, formData.origen === 'publico');
        pdf.text('PROYECTO PÚBLICO', m + 27, y + 3);
        this.dibujarCheckbox(pdf, m + 22, y + 5, formData.origen === 'privado');
        pdf.text('PROYECTO PRIVADO', m + 27, y + 7.5);

        // TIPO DE PROYECTO
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('TIPO DE', m + 60, y + 1.5);
        pdf.text('PROYECTO:', m + 60, y + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.tipoProyecto || '', m + 80, y + 3);

        // TIPO DE SERVICIO
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('TIPO DE', m + 120, y + 1.5);
        pdf.text('SERVICIO:', m + 120, y + 5);

        const servicios = [
            'ESTUDIO DE CONTROL DE CALIDAD EN OBRAS',
            'ESTUDIO DE VERIFICACIÓN DE INGENIERÍA',
            'ESTUDIO DE PERITAJE',
            'ESTUDIO ESPECIALIZADO DE INGENIERÍA',
            'ALQUILER DE EQUIPO',
        ];

        pdf.setFontSize(5.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);

        // First column of services
        this.dibujarCheckbox(pdf, m + 138, y + 0.5, formData.tiposServicio.includes(servicios[0]));
        pdf.text(servicios[0], m + 143, y + 3);
        this.dibujarCheckbox(pdf, m + 138, y + 5, formData.tiposServicio.includes(servicios[2]));
        pdf.text(servicios[2], m + 143, y + 7.5);
        this.dibujarCheckbox(pdf, m + 138, y + 9.5, formData.tiposServicio.includes(servicios[4]));
        pdf.text(servicios[4], m + 143, y + 12);

        // Right side services
        this.dibujarCheckbox(pdf, m + w - 45, y + 0.5, formData.tiposServicio.includes(servicios[1]));
        pdf.text(servicios[1], m + w - 40, y + 3);
        this.dibujarCheckbox(pdf, m + w - 45, y + 5, formData.tiposServicio.includes(servicios[3]));
        pdf.text(servicios[3], m + w - 40, y + 7.5);

        y += 14;
        pdf.setFontSize(6.5);

        // Row 2: Situación + Contenido Mínimo + Salida a campo
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('SITUACIÓN', m + 60, y + 1.5);
        pdf.text('DE PROYECTO:', m + 60, y + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.situacionProyecto || '', m + 80, y + 3);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('CONTENIDO', m + 120, y + 1.5);
        pdf.text('MÍNIMO:', m + 120, y + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text(formData.contenidoMinimo || '', m + 140, y + 3);

        // Salida a campo
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.setFontSize(7);
        pdf.text('Salida a campo:', m + 2, y + 3);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        this.dibujarCheckbox(pdf, m + 30, y + 0.5, formData.salidaCampo === 'si');
        pdf.text('SÍ', m + 35, y + 3);
        this.dibujarCheckbox(pdf, m + 42, y + 0.5, formData.salidaCampo === 'no');
        pdf.text('NO', m + 47, y + 3);

        const endY = y + 9;
        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(0.5);
        pdf.line(m, endY, m + w, endY);

        return endY + 3;
    }

    // ==================== TABLA DE ITEMS ====================
    private static dibujarTablaItems(
        pdf: jsPDF, m: number, w: number, startY: number,
        cotizacion: Cotizacion, formData: DatosFormulario,
        logoSoiltest: string, logoIso: string, logoLean: string,
        pageH: number
    ): number {
        let y = startY;
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];
        const footerSpace = 55; // space for footer
        const maxY = pageH - footerSpace;

        // Column widths: Item, Código, Descripción, Und, Cant, P.Unit, Total
        const cols = [12, 20, 76, 14, 14, 27, 27];

        const dibujarEncabezadoTabla = (yy: number): number => {
            pdf.setFillColor(200, 0, 0);
            pdf.rect(m, yy, w, 6, 'F');

            pdf.setFontSize(6.5);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);

            const headers = ['ITEM', 'CÓDIGO', 'DESCRIPCIÓN DEL ENSAYO', 'UND', 'CANT.', 'P. UNIT.', 'TOTAL'];
            let xPos = m;
            headers.forEach((h, i) => {
                const align = i >= 4 ? 'right' : 'left';
                const tx = align === 'right' ? xPos + cols[i] - 2 : xPos + 2;
                pdf.text(h, tx, yy + 4, { align: align === 'right' ? 'right' : 'left' });
                xPos += cols[i];
            });

            return yy + 7;
        };

        y = dibujarEncabezadoTabla(y);

        // Rows
        const items = cotizacion.obtenerItems();
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);

        items.forEach((item, idx) => {
            if (y > maxY) {
                // Footer on current page
                this.dibujarFooterConFirma(pdf, m, w, pageH);
                pdf.addPage();
                this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData);
                y = m + 43;
                y = dibujarEncabezadoTabla(y);
                pdf.setFontSize(6.5);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...negro);
            }

            // Alternate row background
            if (idx % 2 === 0) {
                pdf.setFillColor(252, 248, 248);
                pdf.rect(m, y - 1, w, 5.5, 'F');
            }

            let xPos = m;
            const totalItem = (item.cantidad * item.precioUnitario).toFixed(2);
            const rowData = [
                String(idx + 1),
                item.codigo,
                item.descripcion,
                item.unidad,
                String(item.cantidad),
                `S/ ${item.precioUnitario.toFixed(2)}`,
                `S/ ${totalItem}`,
            ];

            pdf.setTextColor(...negro);
            rowData.forEach((val, i) => {
                const align = i >= 4 ? 'right' : 'left';
                const tx = align === 'right' ? xPos + cols[i] - 2 : xPos + 2;
                // Truncate description if too long
                let text = val;
                if (i === 2) {
                    const maxW = cols[i] - 4;
                    while (pdf.getTextWidth(text) > maxW && text.length > 3) {
                        text = text.slice(0, -4) + '...';
                    }
                }
                pdf.text(text, tx, y + 3, { align: align === 'right' ? 'right' : 'left' });
                xPos += cols[i];
            });

            // Row border
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.1);
            pdf.line(m, y + 4.5, m + w, y + 4.5);
            y += 5.5;
        });

        // Bottom border of table
        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(0.3);
        pdf.line(m, y, m + w, y);
        y += 4;

        // TOTALS
        const subtotal = cotizacion.calcularSubtotal();
        const igv = cotizacion.calcularIGV();
        const total = cotizacion.calcularTotal();

        const totalsX = m + w - 60;

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.text('SUBTOTAL:', totalsX, y);
        pdf.text(`S/ ${subtotal.toFixed(2)}`, m + w - 2, y, { align: 'right' });
        y += 4.5;

        pdf.text('IGV (18%):', totalsX, y);
        pdf.text(`S/ ${igv.toFixed(2)}`, m + w - 2, y, { align: 'right' });
        y += 5;

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.setFontSize(9);
        pdf.text('TOTAL:', totalsX, y);
        pdf.text(`S/ ${total.toFixed(2)}`, m + w - 2, y, { align: 'right' });

        return y + 5;
    }

    // ==================== FOOTER ====================
    private static dibujarFooterConFirma(pdf: jsPDF, m: number, w: number, pageH: number): void {
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];
        const gris: [number, number, number] = [100, 100, 100];

        // Firma section
        const firmaY = pageH - 50;

        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(0.3);
        pdf.line(m, firmaY, m + w, firmaY);

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('FIRMA Y SELLO:', m + 2, firmaY + 5);

        pdf.setDrawColor(...negro);
        pdf.setLineWidth(0.5);
        pdf.line(m + 35, firmaY + 12, m + 85, firmaY + 12);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...gris);
        pdf.setFontSize(6);
        pdf.text('Representante Legal', m + 45, firmaY + 16);
        pdf.text('Huamanga, ' + new Date().toLocaleDateString('es-PE'), m + 45, firmaY + 19);

        // Datos bancarios
        const bancoY = firmaY + 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.setFontSize(7);
        pdf.text('DATOS BANCARIOS:', m + w / 2 + 10, bancoY);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.setFontSize(6);
        pdf.text('Banco: BCP', m + w / 2 + 10, bancoY + 4);
        pdf.text('Cta. Cte.: 191-12345678-0-99', m + w / 2 + 10, bancoY + 7.5);
        pdf.text('CCI: 00219100123456780099', m + w / 2 + 10, bancoY + 11);

        // Contact
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.setFontSize(7);
        pdf.text('CONTACTO:', m + w - 40, bancoY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.setFontSize(6);
        pdf.text('soiltestperu.srl@gmail.com', m + w - 40, bancoY + 4);
        pdf.text('Ayacucho, Perú', m + w - 40, bancoY + 7.5);

        // Bottom line + copyright
        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(0.5);
        pdf.line(m, pageH - 12, m + w, pageH - 12);

        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(5.5);
        pdf.setTextColor(...gris);
        pdf.text(`© ${new Date().getFullYear()} SOILTEST PERÚ S.R.L. - Todos los derechos reservados`, m + 2, pageH - 8);
        pdf.text('"La calidad, nuestra experiencia"', m + w - 2, pageH - 8, { align: 'right' });
    }

    // ==================== TÉRMINOS ====================
    private static dibujarTerminos(pdf: jsPDF, m: number, w: number, pageH: number): void {
        const negro: [number, number, number] = [0, 0, 0];
        const rojo: [number, number, number] = [200, 0, 0];
        let y = m + 44;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('TÉRMINOS Y CONDICIONES', m + w / 2, y, { align: 'center' });
        y += 8;

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
            if (y > pageH - 60) {
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
            y += 2;
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
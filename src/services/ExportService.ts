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
            const m = 5; // Margen reducido a 0.5 cm (5 mm)
            const w = pageW - 2 * m; // Ancho utilizable = 200

            // === HOJA 1: Cotización ===
            let y = this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData);
            y = this.dibujarDatosAsesorYCotizacion(pdf, m, w, y, formData);
            y = this.dibujarDatosCliente(pdf, m, w, y, formData);
            y = this.dibujarOpciones(pdf, m, w, y, formData);
            y = this.dibujarProyecto(pdf, m, w, y, formData);
            y = this.dibujarTablaItems(pdf, m, w, y, cotizacion, formData, logoSoiltest, logoIso, logoLean, pageH);
            this.dibujarFooterConFirma(pdf, m, w, pageH);

            // === HOJA 2: Términos y condiciones ===
            pdf.addPage();
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

    // ==================== HEADER (Sin líneas, optimizado) ====================
    private static dibujarHeader(pdf: jsPDF, m: number, w: number, logoSoiltest: string, logoIso: string, logoLean: string, _formData: DatosFormulario): number {
        const rojo: [number, number, number] = [200, 0, 0];
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

        // "COTIZACIÓN" (Centro superior, paralelo a los logos)
        const cx = m + w / 2;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.text('COTIZACIÓN', cx, m + 5, { align: 'center' });

        // Logos ISO y BIM (Extremo superior derecho)
        // BIM pegado a la derecha, ISO a la izquierda de BIM
        if (logoLean) {
            try { pdf.addImage(logoLean, 'PNG', m + w - 25, m, 25, 12); } catch { /* skip */ }
        }
        if (logoIso) {
            try { pdf.addImage(logoIso, 'PNG', m + w - 40, m, 12, 12); } catch { /* skip */ }
        }

        // Retorna la posición Y donde terminará este bloque para que el resto se dibuje pegado arriba
        return m + 15; 
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

        // Columna 2: Metadatos (Centro)
        const midX = m + 75;
        const metaLabels = [
            ['CÓDIGO:', formData.codigo || 'ADM-CO-001'],
            ['VERSIÓN:', formData.version || '01'],
            ['PÁGINA:', `${formData.pagina || '1'} de 2`],
        ];
        metaLabels.forEach((pair, i) => {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...rojo);
            pdf.text(pair[0], midX, y + i * 4.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...negro);
            pdf.text(pair[1], midX + 18, y + i * 4.5);
        });

        // Columna 3: Fechas (Derecha)
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
            pdf.text(pair[1], rightX + 26, y + i * 4.5);
        });

        // Separador
        const endY = y + 17;
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

    // ==================== OPCIONES (Cruce corregido) ====================
    private static dibujarOpciones(pdf: jsPDF, m: number, w: number, startY: number, formData: DatosFormulario): number {
        let y = startY;
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];

        pdf.setFontSize(6.5);

        // --- FILA 1: Origen, Tipo de Proyecto, Situación ---
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

        // --- FILA 2: Contenido Mínimo, Salida a Campo ---
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

        // --- FILA 3: Tipo de Servicio (Desplegado en 2 columnas amplias) ---
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
        const footerSpace = 45; // Espacio libre requerido para que no choque con la firma
        const maxY = pageH - footerSpace;

        // Anchos de columna ajustados a w = 200
        const cols = [12, 20, 86, 14, 14, 27, 27];

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

        // Filas
        const items = cotizacion.obtenerItems();
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);

        items.forEach((item, idx) => {
            if (y > maxY) {
                // Generar nueva página si la tabla supera el límite inferior
                this.dibujarFooterConFirma(pdf, m, w, pageH);
                pdf.addPage();
                y = this.dibujarHeader(pdf, m, w, logoSoiltest, logoIso, logoLean, formData);
                y = dibujarEncabezadoTabla(y);
                pdf.setFontSize(6.5);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...negro);
            }

            // Fondo alternado para filas
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

            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.1);
            pdf.line(m, y + 4.5, m + w, y + 4.5);
            y += 5.5;
        });

        // Cierre de tabla
        pdf.setDrawColor(...rojo);
        pdf.setLineWidth(0.3);
        pdf.line(m, y, m + w, y);
        y += 4;

        // TOTALES
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

    // ==================== FOOTER (Flotante) ====================
    private static dibujarFooterConFirma(pdf: jsPDF, m: number, w: number, pageH: number): void {
        const rojo: [number, number, number] = [200, 0, 0];
        const negro: [number, number, number] = [0, 0, 0];
        const gris: [number, number, number] = [100, 100, 100];

        // Se ubica flotante en la parte inferior de la hoja (No hay líneas de separación del header)
        const firmaY = pageH - 40;

        // Firma y sello
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

        // Contacto
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...rojo);
        pdf.setFontSize(7);
        pdf.text('CONTACTO:', m + w - 40, bancoY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...negro);
        pdf.setFontSize(6);
        pdf.text('soiltestperu.srl@gmail.com', m + w - 40, bancoY + 4);
        pdf.text('Ayacucho, Perú', m + w - 40, bancoY + 7.5);
    }

    // ==================== TÉRMINOS (Arriba en Hoja 2) ====================
    private static dibujarTerminos(pdf: jsPDF, m: number, w: number, pageH: number): void {
        const negro: [number, number, number] = [0, 0, 0];
        const rojo: [number, number, number] = [200, 0, 0];
        let y = m + 10; // Inicio arriba de todo en la hoja 2

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
            if (y > pageH - 20) { // Si llega al fondo, crea otra hoja
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
export interface DatosFormulario {
    // Datos del Asesor / Empresa
    asesor: { nombre: string; oficina: string; referencia: string; celular: string };
    // Datos de la Cotización (metadata)
    codigo: string;
    version: string;
    fecha: string;
    pagina: string;
    cotizacionNro: string;
    clienteId: string;
    validoHasta: string;
    // Datos del Cliente
    cliente: { nombre: string; ruc: string; referencia: string; direccion: string };
    // Proyecto
    proyecto: string;
    // Opciones
    origen: string;
    salidaCampo: string;
    tipoProyecto: string;
    situacionProyecto: string;
    tiposServicio: string[];
    contenidoMinimo: string;
}

export default class FormView {
    private containerId: string;
    public onChange: ((datos: DatosFormulario) => void) | null = null;

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    private getContainer(): HTMLElement {
        const elem = document.getElementById(this.containerId);
        if (!elem) throw new Error(`Container ${this.containerId} not found`);
        return elem;
    }

    render(): void {
        const container = this.getContainer();
        const hoy = new Date().toISOString().slice(0, 10);
        const validez = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

        container.innerHTML = `
            <div class="animate-fade-in-up stagger-1 mb-4">
                <h1 class="font-headline-lg text-headline-lg font-bold text-on-surface uppercase tracking-tight">Cotización Técnica</h1>
            </div>

            <!-- SECCIÓN: Asesor + Metadata Cotización -->
            <section class="bg-white/90 backdrop-blur-sm border border-on-surface p-5 relative animate-fade-in-up stagger-2 shadow-sm mb-5">
                <div class="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Columna Izquierda: Asesor -->
                    <div class="flex-1">
                        <h3 class="font-headline-md text-sm uppercase tracking-wider text-primary border-b border-outline-variant pb-1 mb-4">Datos del Asesor / Oficina</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1 md:col-span-2">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Asesor Técnico</label>
                                <input id="asesor_nombre" class="form-input" type="text" placeholder="Ing. Nombre Completo">
                            </div>
                            <div class="flex flex-col gap-1 md:col-span-2">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Oficina</label>
                                <input id="asesor_oficina" class="form-input" type="text" placeholder="GEOTECNIA, GEOLOGÍA Y GEOFÍSICA">
                            </div>
                            <div class="flex flex-col gap-1 md:col-span-2">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Referencia</label>
                                <input id="asesor_referencia" class="form-input" type="text" placeholder="Manual de Ensayo de Materiales del MTC...">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Celular</label>
                                <input id="asesor_celular" class="form-input" type="text" placeholder="974 414 640">
                            </div>
                        </div>
                    </div>
                    <!-- Columna Derecha: Metadata Cotización -->
                    <div class="w-full lg:w-72 flex-shrink-0">
                        <h3 class="font-headline-md text-sm uppercase tracking-wider text-primary border-b border-outline-variant pb-1 mb-4">Datos de la Cotización</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Código</label>
                                <input id="cot_codigo" class="form-input" type="text" placeholder="ADM-CO-001">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Versión</label>
                                <input id="cot_version" class="form-input" type="text" placeholder="01" value="01">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Fecha</label>
                                <input id="cot_fecha" class="form-input" type="date" value="${hoy}">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Cotización N°</label>
                                <input id="cot_nro" class="form-input" type="text" placeholder="001">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Cliente ID</label>
                                <input id="cot_cliente_id" class="form-input" type="text" placeholder="-">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Válido Hasta</label>
                                <input id="cot_valido_hasta" class="form-input" type="date" value="${validez}">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Página</label>
                                <input id="cot_pagina" class="form-input" type="number" value="1" min="1">
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SECCIÓN: Datos del Cliente -->
            <section class="bg-amber-50/80 backdrop-blur-sm border border-amber-300 p-5 relative animate-fade-in-up stagger-3 shadow-sm mb-5">
                <div class="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <h3 class="font-headline-md text-sm uppercase tracking-wider text-amber-800 border-b border-amber-200 pb-1 mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">person</span> Cliente
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="flex flex-col gap-1 lg:col-span-2">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Nombre / Razón Social</label>
                        <input id="cliente_nombre" class="form-input" type="text" placeholder="Nombre o razón social del cliente">
                    </div>
                    <div class="flex flex-col gap-1 lg:col-span-2">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">RUC / DNI</label>
                        <input id="cliente_ruc" class="form-input" type="text" placeholder="20XXXXXXXXX">
                    </div>
                    <div class="flex flex-col gap-1 lg:col-span-2">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Referencia / Teléfono</label>
                        <input id="cliente_referencia" class="form-input" type="text" placeholder="989 840 286">
                    </div>
                    <div class="flex flex-col gap-1 lg:col-span-2">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">Dirección</label>
                        <input id="cliente_direccion" class="form-input" type="text" placeholder="Dirección fiscal del cliente">
                    </div>
                </div>
            </section>

            <!-- SECCIÓN: Proyecto -->
            <section class="bg-white/90 backdrop-blur-sm border border-on-surface p-5 relative animate-fade-in-up stagger-3 shadow-sm mb-5">
                <div class="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
                <h3 class="font-headline-md text-sm uppercase tracking-wider text-primary border-b border-outline-variant pb-1 mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">engineering</span> Proyecto
                </h3>
                <textarea id="proyecto" class="form-input w-full min-h-[60px] resize-y" placeholder="Nombre completo del proyecto (ej: MEJORAMIENTO DE VIVIENDA RURAL EN LOS CENTROS POBLADOS...)"></textarea>
            </section>

            <!-- SECCIÓN: Opciones del Servicio -->
            <section class="bg-white/90 backdrop-blur-sm border border-on-surface p-5 relative animate-fade-in-up stagger-4 shadow-sm mb-5">
                <div class="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
                <h3 class="font-headline-md text-sm uppercase tracking-wider text-primary border-b border-outline-variant pb-1 mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">tune</span> Opciones del Servicio
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Origen -->
                    <div class="flex flex-col gap-2">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Origen</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md">
                                <input type="radio" name="origen" value="publico" class="accent-primary w-4 h-4"> Proyecto Público
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md">
                                <input type="radio" name="origen" value="privado" class="accent-primary w-4 h-4"> Proyecto Privado
                            </label>
                        </div>
                    </div>

                    <!-- Salida a Campo -->
                    <div class="flex flex-col gap-2">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Salida a Campo</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md">
                                <input type="radio" name="salida_campo" value="si" class="accent-primary w-4 h-4"> Sí
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md">
                                <input type="radio" name="salida_campo" value="no" class="accent-primary w-4 h-4"> No
                            </label>
                        </div>
                    </div>

                    <!-- Contenido Mínimo -->
                    <div class="flex flex-col gap-1">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Contenido Mínimo</label>
                        <input id="contenido_minimo" class="form-input" type="text" placeholder="EMS - EDIFICACIONES">
                    </div>

                    <!-- Tipo de Proyecto -->
                    <div class="flex flex-col gap-1">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Tipo de Proyecto</label>
                        <select id="tipo_proyecto" class="form-input">
                            <option value="">-- Seleccione --</option>
                            <option value="1. HABILITACIONES URBANAS">1. HABILITACIONES URBANAS</option>
                            <option value="2. CARRETERAS Y PAVIMENTOS">2. CARRETERAS Y PAVIMENTOS</option>
                            <option value="3. EDIFICACIONES">3. EDIFICACIONES</option>
                            <option value="4. PUENTES Y OBRAS DE ARTE">4. PUENTES Y OBRAS DE ARTE</option>
                            <option value="5. SANEAMIENTO">5. SANEAMIENTO</option>
                            <option value="6. REPRESAS Y EMBALSES">6. REPRESAS Y EMBALSES</option>
                            <option value="7. OTROS">7. OTROS</option>
                        </select>
                    </div>

                    <!-- Situación de Proyecto -->
                    <div class="flex flex-col gap-1">
                        <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Situación de Proyecto</label>
                        <select id="situacion_proyecto" class="form-input">
                            <option value="">-- Seleccione --</option>
                            <option value="1. PROYECTO NUEVO">1. PROYECTO NUEVO</option>
                            <option value="2. EN EJECUCIÓN">2. EN EJECUCIÓN</option>
                            <option value="3. LIQUIDACIÓN">3. LIQUIDACIÓN</option>
                        </select>
                    </div>
                </div>

                <!-- Tipo de Servicio (checkboxes múltiples) -->
                <div class="mt-5 pt-4 border-t border-outline-variant">
                    <label class="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-bold mb-3 block">Tipo de Servicio</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md bg-surface-container-lowest px-3 py-2 border border-outline-variant rounded hover:bg-surface-variant/30 transition-colors">
                            <input type="checkbox" name="tipo_servicio" value="ESTUDIO DE CONTROL DE CALIDAD EN OBRAS" class="accent-primary w-4 h-4">
                            Estudio de Control de Calidad en Obras
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md bg-surface-container-lowest px-3 py-2 border border-outline-variant rounded hover:bg-surface-variant/30 transition-colors">
                            <input type="checkbox" name="tipo_servicio" value="ESTUDIO DE VERIFICACIÓN DE INGENIERÍA" class="accent-primary w-4 h-4">
                            Estudio de Verificación de Ingeniería
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md bg-surface-container-lowest px-3 py-2 border border-outline-variant rounded hover:bg-surface-variant/30 transition-colors">
                            <input type="checkbox" name="tipo_servicio" value="ESTUDIO DE PERITAJE" class="accent-primary w-4 h-4">
                            Estudio de Peritaje
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md bg-surface-container-lowest px-3 py-2 border border-outline-variant rounded hover:bg-surface-variant/30 transition-colors">
                            <input type="checkbox" name="tipo_servicio" value="ESTUDIO ESPECIALIZADO DE INGENIERÍA" class="accent-primary w-4 h-4">
                            Estudio Especializado de Ingeniería
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer text-sm font-body-md bg-surface-container-lowest px-3 py-2 border border-outline-variant rounded hover:bg-surface-variant/30 transition-colors">
                            <input type="checkbox" name="tipo_servicio" value="ALQUILER DE EQUIPO" class="accent-primary w-4 h-4">
                            Alquiler de Equipo
                        </label>
                    </div>
                </div>
            </section>
        `;
        this.attachEvents();
    }

    private attachEvents(): void {
        const container = this.getContainer();
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.onChange?.(this.obtenerDatos()));
            input.addEventListener('input', () => this.onChange?.(this.obtenerDatos()));
        });
    }

    obtenerDatos(): DatosFormulario {
        const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
        const getRadio = (name: string) => (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value || '';
        const getChecked = (name: string): string[] => {
            const checks: string[] = [];
            document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`).forEach(cb => checks.push(cb.value));
            return checks;
        };

        return {
            asesor: {
                nombre: getVal('asesor_nombre'),
                oficina: getVal('asesor_oficina'),
                referencia: getVal('asesor_referencia'),
                celular: getVal('asesor_celular'),
            },
            codigo: getVal('cot_codigo'),
            version: getVal('cot_version'),
            fecha: getVal('cot_fecha'),
            pagina: getVal('cot_pagina'),
            cotizacionNro: getVal('cot_nro'),
            clienteId: getVal('cot_cliente_id'),
            validoHasta: getVal('cot_valido_hasta'),
            cliente: {
                nombre: getVal('cliente_nombre'),
                ruc: getVal('cliente_ruc'),
                referencia: getVal('cliente_referencia'),
                direccion: getVal('cliente_direccion'),
            },
            proyecto: getVal('proyecto'),
            origen: getRadio('origen'),
            salidaCampo: getRadio('salida_campo'),
            tipoProyecto: getVal('tipo_proyecto'),
            situacionProyecto: getVal('situacion_proyecto'),
            tiposServicio: getChecked('tipo_servicio'),
            contenidoMinimo: getVal('contenido_minimo'),
        };
    }

    cargarDatos(datos: Partial<DatosFormulario>): void {
        const setVal = (id: string, val: string | undefined) => {
            if (val) { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = val; }
        };
        const setRadio = (name: string, val: string | undefined) => {
            if (val) { const el = document.querySelector(`input[name="${name}"][value="${val}"]`) as HTMLInputElement; if (el) el.checked = true; }
        };
        const setChecks = (name: string, vals: string[] | undefined) => {
            if (vals) vals.forEach(v => {
                const el = document.querySelector(`input[name="${name}"][value="${v}"]`) as HTMLInputElement;
                if (el) el.checked = true;
            });
        };

        if (datos.asesor) {
            setVal('asesor_nombre', datos.asesor.nombre);
            setVal('asesor_oficina', datos.asesor.oficina);
            setVal('asesor_referencia', datos.asesor.referencia);
            setVal('asesor_celular', datos.asesor.celular);
        }
        setVal('cot_codigo', datos.codigo);
        setVal('cot_version', datos.version);
        setVal('cot_fecha', datos.fecha);
        setVal('cot_pagina', datos.pagina);
        setVal('cot_nro', datos.cotizacionNro);
        setVal('cot_cliente_id', datos.clienteId);
        setVal('cot_valido_hasta', datos.validoHasta);
        if (datos.cliente) {
            setVal('cliente_nombre', datos.cliente.nombre);
            setVal('cliente_ruc', datos.cliente.ruc);
            setVal('cliente_referencia', datos.cliente.referencia);
            setVal('cliente_direccion', datos.cliente.direccion);
        }
        setVal('proyecto', datos.proyecto);
        setRadio('origen', datos.origen);
        setRadio('salida_campo', datos.salidaCampo);
        setVal('tipo_proyecto', datos.tipoProyecto);
        setVal('situacion_proyecto', datos.situacionProyecto);
        setChecks('tipo_servicio', datos.tiposServicio);
        setVal('contenido_minimo', datos.contenidoMinimo);
    }
}

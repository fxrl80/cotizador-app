import type { ItemPresupuesto } from '../models/EstructuraCotizacion';

export default class ItemsEditView {
    private containerId: string;
    public onAgregarCotizacion: ((items: ItemPresupuesto[]) => void) | null = null;
    private currentItems: ItemPresupuesto[] = [];

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    private getContainer(): HTMLElement {
        const elem = document.getElementById(this.containerId);
        if (!elem) throw new Error(`Container ${this.containerId} not found`);
        return elem;
    }

    render(items: ItemPresupuesto[]): void {
        this.currentItems = items;
        const container = this.getContainer();

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="empty-hint">Seleccione una subseccion para ver los ensayos disponibles.</p>';
            return;
        }

        container.innerHTML = `
            <div class="bg-white/90 backdrop-blur-sm border border-on-surface shadow-sm overflow-hidden">
                <div class="bg-surface-variant/60 px-6 py-3 flex justify-between items-center border-b border-outline-variant">
                    <h3 class="font-headline-md text-on-surface uppercase tracking-wider text-base font-bold">Ensayos de la base seleccionada</h3>
                    <button id="btn-agregar-items" class="px-5 py-2 bg-primary text-on-primary font-bold rounded-md hover:bg-surface-tint hover:scale-105 transition-all">
                        Agregar a Items Seleccionados
                    </button>
                </div>
                <table class="w-full text-left border-collapse font-data-table text-data-table">
                    <thead>
                        <tr class="border-b border-on-surface text-on-surface bg-surface-variant/50">
                            <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider w-20">Codigo</th>
                            <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider">Descripcion</th>
                            <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-center w-20">Unidad</th>
                            <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-center w-20">Cant.</th>
                            <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-right w-28">P. Unitario</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant">
                        ${items.map(item => this.renderFila(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.attachEvents();
    }

    private renderFila(item: ItemPresupuesto): string {
        return `
            <tr class="hover:bg-surface-variant/40 transition-colors">
                <td class="p-table-cell-padding"><span class="bg-surface-variant px-2 py-0.5 text-primary font-bold border border-outline-variant">${item.codigo}</span></td>
                <td class="p-table-cell-padding text-on-surface">${item.descripcion}</td>
                <td class="p-table-cell-padding text-center text-on-surface-variant">${item.unidad}</td>
                <td class="p-table-cell-padding text-center text-on-surface-variant">${item.cantidad}</td>
                <td class="p-table-cell-padding text-right text-on-surface-variant">S/ ${item.precioUnitario.toFixed(2)}</td>
            </tr>
        `;
    }

    private attachEvents(): void {
        const btnAgregar = this.getContainer().querySelector('#btn-agregar-items');
        btnAgregar?.addEventListener('click', () => {
            if (this.onAgregarCotizacion) {
                this.onAgregarCotizacion(this.currentItems.map(item => ({ ...item })));
            }
        });
    }

    refresh(items: ItemPresupuesto[]): void {
        this.render(items);
    }
}

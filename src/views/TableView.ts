import Catalogo from '../models/Catalogo';
import type { Servicio } from '../models/Catalogo';
import Cotizacion from '../models/Cotizacion';
import type { ItemCotizacion } from '../models/Cotizacion';

type EditCallback = (itemId: number, campo: keyof ItemCotizacion, valor: any) => void;
type DeleteCallback = (itemId: number) => void;
type AddFromSearchCallback = (servicio: Servicio) => void;

export default class TableView {
    private containerId: string;
    private catalogo: Catalogo | null = null;
    public onEditItem: EditCallback | null = null;
    public onDeleteItem: DeleteCallback | null = null;
    public onAddFromSearch: AddFromSearchCallback | null = null;

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    private getContainer(): HTMLElement {
        const elem = document.getElementById(this.containerId);
        if (!elem) throw new Error(`Container ${this.containerId} not found`);
        return elem;
    }

    setCatalogo(catalogo: Catalogo): void {
        this.catalogo = catalogo;
    }

    render(cotizacion: Cotizacion, catalogo: Catalogo): void {
        this.catalogo = catalogo;
        const container = this.getContainer();
        const items = cotizacion.obtenerItems();
        const opcionesBase = catalogo.obtenerTodos();
        const tbodyRows = items.map((item, idx) => this.renderFila(item, opcionesBase, idx + 1)).join('');

        container.innerHTML = '<div class="bg-white/90 backdrop-blur-sm border border-on-surface shadow-sm overflow-hidden">'
            + '<div class="bg-primary-container px-6 py-3 flex justify-between items-center border-b-2 border-on-surface">'
            + '<h3 class="font-headline-md text-on-primary uppercase tracking-wider text-lg font-bold flex items-center gap-2">'
            + '<span class="material-symbols-outlined fill-icon text-[20px]">science</span>'
            + ' Items de Ensayo</h3>'
            + '</div>'

            // Search bar
            + '<div class="px-4 py-3 bg-surface-variant/50 border-b border-outline-variant">'
            + '<div class="relative" id="search-wrapper">'
            + '<div class="flex gap-2">'
            + '<div class="flex-1 relative">'
            + '<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>'
            + '<input id="quick-search-input" class="w-full pl-10 pr-4 py-2 bg-white border border-on-surface text-on-surface font-body-md text-sm focus:outline-none focus:border-primary-container transition-all" type="text" placeholder="Buscar por código o descripción para agregar rápido..." autocomplete="off">'
            + '<div id="search-dropdown" class="search-dropdown hidden"></div>'
            + '</div>'
            + '</div>'
            + '</div>'
            + '</div>'

            // Table
            + '<table class="w-full text-left border-collapse font-data-table text-data-table"><thead>'
            + '<tr class="border-b border-on-surface text-on-surface bg-surface-variant/50">'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider w-12 text-center">Item</th>'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider w-20">Código</th>'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider">Descripción del Ensayo</th>'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-center w-16">Und</th>'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-center w-16">Cant.</th>'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-right w-28">P.Unit. (S/)</th>'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-right w-28">Total (S/)</th>'
            + '<th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-wider text-center w-12"></th>'
            + '</tr></thead>'
            + '<tbody id="tbody-cotizacion" class="divide-y divide-outline-variant">'
            + tbodyRows
            + '</tbody></table></div>';

        this.attachEvents();
    }

    private renderFila(item: ItemCotizacion, opcionesBase: Servicio[], itemNum: number): string {
        const total = (item.cantidad * item.precioUnitario).toFixed(2);
        const servicioActual = opcionesBase.find(s => s.codigo === item.codigo);
        const desc = servicioActual?.descripcion || item.descripcion || 'Sin descripción';
        const codigo = item.codigo || '...';

        return '<tr data-id="' + item.itemId + '" class="hover:bg-surface-variant/40 transition-colors">'
            + '<td class="p-table-cell-padding text-center text-on-surface-variant text-xs">' + itemNum + '</td>'
            + '<td class="p-table-cell-padding"><span class="bg-surface-variant px-2 py-0.5 text-primary font-bold border border-outline-variant text-xs">' + codigo + '</span></td>'
            + '<td class="p-table-cell-padding text-on-surface text-xs">' + desc + '</td>'
            + '<td class="p-table-cell-padding text-center text-on-surface-variant text-xs">' + item.unidad + '</td>'
            + '<td class="p-table-cell-padding text-center">'
            + '<input type="number" class="cantidad-input w-14 text-center bg-white border border-on-surface px-1 py-1 font-data-table text-xs focus:border-primary-container focus:outline-none transition-all" value="' + item.cantidad + '" step="1" min="1">'
            + '</td>'
            + '<td class="p-table-cell-padding text-right">'
            + '<input type="number" class="precio-input w-20 text-right bg-white border border-on-surface px-1 py-1 font-data-table text-xs focus:border-primary-container focus:outline-none transition-all" value="' + item.precioUnitario.toFixed(2) + '" step="0.01" min="0">'
            + '</td>'
            + '<td class="p-table-cell-padding text-right font-bold text-on-surface text-xs"><span class="total-fila">' + total + '</span></td>'
            + '<td class="p-table-cell-padding text-center">'
            + '<button class="eliminar-btn text-on-surface-variant hover:text-error transition-colors"><span class="material-symbols-outlined text-[18px]">close</span></button>'
            + '</td></tr>';
    }

    private attachEvents(): void {
        const container = this.getContainer();
        const tbody = container.querySelector('#tbody-cotizacion');
        if (!tbody) return;

        // Table row editing
        tbody.addEventListener('input', (e) => {
            const target = e.target as HTMLElement;
            const row = target.closest('tr');
            if (!row) return;
            const itemId = parseInt(row.dataset.id!);
            if (target.classList.contains('cantidad-input')) {
                const nuevaCant = parseFloat((target as HTMLInputElement).value) || 0;
                if (this.onEditItem) this.onEditItem(itemId, 'cantidad', nuevaCant);
                this.actualizarTotalFila(row);
            } else if (target.classList.contains('precio-input')) {
                const nuevoPrecio = parseFloat((target as HTMLInputElement).value) || 0;
                if (this.onEditItem) this.onEditItem(itemId, 'precioUnitario', nuevoPrecio);
                this.actualizarTotalFila(row);
            }
        });

        // Delete row
        tbody.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('.eliminar-btn');
            if (btn) {
                const row = btn.closest('tr');
                if (row && this.onDeleteItem) {
                    const itemId = parseInt(row.dataset.id!);
                    this.onDeleteItem(itemId);
                }
            }
        });

        // Quick search
        this.attachSearchEvents();
    }

    private attachSearchEvents(): void {
        const searchInput = document.getElementById('quick-search-input') as HTMLInputElement | null;
        const dropdown = document.getElementById('search-dropdown');
        if (!searchInput || !dropdown || !this.catalogo) return;

        const catalogo = this.catalogo;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 1) {
                dropdown.classList.add('hidden');
                dropdown.innerHTML = '';
                return;
            }

            const todos = catalogo.obtenerTodos();
            const matches = todos.filter(s =>
                s.codigo.toLowerCase().includes(query) ||
                s.descripcion.toLowerCase().includes(query)
            ).slice(0, 8);

            if (matches.length === 0) {
                dropdown.innerHTML = '<div class="search-dropdown-item" style="cursor:default;color:#8d706f;font-style:italic;">No se encontraron resultados</div>';
                dropdown.classList.remove('hidden');
                return;
            }

            dropdown.innerHTML = matches.map(s =>
                `<div class="search-dropdown-item" data-codigo="${s.codigo}">
                    <span class="search-dropdown-code">${s.codigo}</span>
                    <span class="search-dropdown-desc">${s.descripcion}</span>
                    <span class="search-dropdown-price">S/ ${s.costo.toFixed(2)}</span>
                </div>`
            ).join('');
            dropdown.classList.remove('hidden');
        });

        // Click on dropdown item to add
        dropdown.addEventListener('click', (e) => {
            const item = (e.target as HTMLElement).closest('.search-dropdown-item') as HTMLElement | null;
            if (!item || !item.dataset.codigo) return;

            const servicio = catalogo.obtenerTodos().find(s => s.codigo === item.dataset.codigo);
            if (servicio && this.onAddFromSearch) {
                this.onAddFromSearch(servicio);
                searchInput.value = '';
                dropdown.classList.add('hidden');
                dropdown.innerHTML = '';
            }
        });

        // Enter key to add first match
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const firstItem = dropdown.querySelector('.search-dropdown-item[data-codigo]') as HTMLElement | null;
                if (firstItem) {
                    firstItem.click();
                }
            }
        });

        // Hide dropdown on click outside
        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('search-wrapper');
            if (wrapper && !wrapper.contains(e.target as Node)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    private actualizarTotalFila(row: Element): void {
        const cantidad = parseFloat((row.querySelector('.cantidad-input') as HTMLInputElement)?.value) || 0;
        const precio = parseFloat((row.querySelector('.precio-input') as HTMLInputElement)?.value) || 0;
        const totalSpan = row.querySelector('.total-fila');
        if (totalSpan) totalSpan.textContent = (cantidad * precio).toFixed(2);
    }

    refresh(cotizacion: Cotizacion, catalogo: Catalogo): void {
        this.render(cotizacion, catalogo);
    }
}

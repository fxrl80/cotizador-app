import type { CategoriaPrincipal } from '../models/EstructuraCotizacion';

export default class CategoriaSelectorView {
    private containerId: string;
    public onCategoriaChange: ((categoriaId: string) => void) | null = null;

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    private getContainer(): HTMLElement {
        const elem = document.getElementById(this.containerId);
        if (!elem) throw new Error(`Container ${this.containerId} not found`);
        return elem;
    }

    render(categorias: CategoriaPrincipal[], selectedId?: string): void {
        const container = this.getContainer();
        const options = categorias.map(c =>
            `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.nombre}</option>`
        ).join('');
        container.innerHTML = `
            <div class="selector-group">
                <label for="categoriaSelect">📁 Categoría principal:</label>
                <select id="categoriaSelect">
                    <option value="">-- Seleccione categoría --</option>
                    ${options}
                </select>
            </div>
        `;
        const select = document.getElementById('categoriaSelect') as HTMLSelectElement;
        select.addEventListener('change', () => this.onCategoriaChange?.(select.value));
    }
}

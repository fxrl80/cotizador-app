import type { Subseccion } from '../models/EstructuraCotizacion';

export default class SubseccionSelectorView {
    private containerId: string;
    public onSubseccionChange: ((rutaIds: string[]) => void) | null = null;

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    private getContainer(): HTMLElement {
        const elem = document.getElementById(this.containerId);
        if (!elem) throw new Error(`Container ${this.containerId} not found`);
        return elem;
    }

    render(primerNivel: Subseccion[], rutaActual: string[] = []): void {
        const container = this.getContainer();
        container.innerHTML = '';

        if (!primerNivel || primerNivel.length === 0) {
            container.innerHTML = '<p class="empty-hint">Seleccione una categoría para ver subsecciones.</p>';
            return;
        }

        this.crearSelectNivel(primerNivel, 0, rutaActual);
    }

    private crearSelectNivel(nivel: Subseccion[], nivelIdx: number, rutaPrevia: string[]): void {
        const container = this.getContainer();
        const selectId = `subselect_${nivelIdx}`;
        const div = document.createElement('div');
        div.className = 'selector-group subseccion-nivel';
        div.dataset.nivel = String(nivelIdx);
        div.innerHTML = `
            <label for="${selectId}">📂 Nivel ${nivelIdx + 1}:</label>
            <select id="${selectId}">
                <option value="">-- Seleccione --</option>
                ${nivel.map(sub => `<option value="${sub.id}">${sub.nombre}</option>`).join('')}
            </select>
        `;
        container.appendChild(div);

        const select = document.getElementById(selectId) as HTMLSelectElement;
        select.addEventListener('change', () => {
            const selectedId = select.value;
            // Remove all levels after current one
            this.eliminarNivelesPosteriores(nivelIdx);

            if (!selectedId) return;

            const nuevaRuta = [...rutaPrevia, selectedId];
            const subSeleccionada = nivel.find(s => s.id === selectedId);

            if (subSeleccionada?.subsecciones && subSeleccionada.subsecciones.length > 0) {
                // Has children → create next level select
                this.crearSelectNivel(subSeleccionada.subsecciones, nivelIdx + 1, nuevaRuta);
            } else {
                // Leaf node → notify with the route to load items
                if (this.onSubseccionChange) this.onSubseccionChange(nuevaRuta);
            }
        });
    }

    private eliminarNivelesPosteriores(desdeIdx: number): void {
        const container = this.getContainer();
        // Collect elements to remove first, then remove them (avoids mutation during iteration)
        const toRemove: Element[] = [];
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i] as HTMLElement;
            const nivel = parseInt(child.dataset.nivel || '-1');
            if (nivel > desdeIdx) {
                toRemove.push(child);
            }
        }
        toRemove.forEach(el => container.removeChild(el));
    }
}

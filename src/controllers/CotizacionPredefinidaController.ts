import EstructuraCotizacionesService from '../services/EstructuraCotizacionesService';
import CategoriaSelectorView from '../views/CategoriaSelectorView';
import SubseccionSelectorView from '../views/SubseccionSelectorView';
import ItemsEditView from '../views/ItemsEditView';
import type { ItemPresupuesto } from '../models/EstructuraCotizacion';

export default class CotizacionPredefinidaController {
    private service: EstructuraCotizacionesService;
    private categoriaView: CategoriaSelectorView;
    private subseccionView: SubseccionSelectorView;
    private itemsView: ItemsEditView;
    private currentItems: ItemPresupuesto[] = [];

    public onAgregarItems: ((items: ItemPresupuesto[]) => void) | null = null;

    constructor() {
        this.service = new EstructuraCotizacionesService();
        this.categoriaView = new CategoriaSelectorView('categoria-container');
        this.subseccionView = new SubseccionSelectorView('subseccion-container');
        this.itemsView = new ItemsEditView('items-edit-container');

        this.categoriaView.onCategoriaChange = (categoriaId) => this.onCategoriaSeleccionada(categoriaId);
        this.subseccionView.onSubseccionChange = (rutaIds) => this.onRutaSeleccionada(rutaIds);
        this.itemsView.onAgregarCotizacion = (items) => {
            if (this.onAgregarItems) {
                this.onAgregarItems(items);
            }
        };
    }

    init(): void {
        const categorias = this.service.obtenerCategorias();
        this.categoriaView.render(categorias);
        this.subseccionView.render([]);
        this.itemsView.render([]);
    }

    private onCategoriaSeleccionada(categoriaId: string): void {
        if (!categoriaId) {
            this.subseccionView.render([]);
            this.itemsView.render([]);
            return;
        }
        const subsecciones = this.service.obtenerSubsecciones(categoriaId);
        if (subsecciones && subsecciones.length > 0) {
            // Check if category subsections have items directly (leaf at level 1)
            this.subseccionView.render(subsecciones, [categoriaId]);
        } else {
            this.subseccionView.render([]);
        }
        this.itemsView.render([]);
    }

    private onRutaSeleccionada(rutaIds: string[]): void {
        const items = this.service.obtenerItemsPorRuta(rutaIds);
        if (items) {
            this.currentItems = items.map(i => ({ ...i }));
            this.itemsView.render(this.currentItems);
        } else {
            this.itemsView.render([]);
        }
    }

}

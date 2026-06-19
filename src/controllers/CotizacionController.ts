import Catalogo from '../models/Catalogo';
import Cotizacion from '../models/Cotizacion';
import type { ItemCotizacion } from '../models/Cotizacion';
import TableView from '../views/TableView';
import TotalsView from '../views/TotalsView';
import FormView from '../views/FormView';
import type { DatosFormulario } from '../views/FormView';
import DataService from '../services/DataService';

export default class CotizacionController {
    private catalogo: Catalogo;
    private dataService: DataService;
    public cotizacion: Cotizacion;
    public tableView: TableView;
    public totalsView: TotalsView;
    public formView: FormView;

    constructor(catalogo: Catalogo, dataService: DataService) {
        this.catalogo = catalogo;
        this.dataService = dataService;
        this.cotizacion = new Cotizacion();
        this.tableView = new TableView('tabla-container');
        this.totalsView = new TotalsView('totals-container');
        this.formView = new FormView('form-container');

        this.tableView.onEditItem = (itemId, campo, valor) => this.handleEditItem(itemId, campo, valor);
        this.tableView.onDeleteItem = (itemId) => this.handleDeleteItem(itemId);
        this.tableView.onAddFromSearch = (servicio) => {
            this.cotizacion.agregarItem(servicio.codigo, servicio.descripcion, servicio.unidad, servicio.costo, 1);
            this.renderAll();
        };
        this.formView.onChange = (datos) => this.handleFormChange(datos);
    }

    async init(): Promise<void> {
        // Render form first
        this.formView.render();

        const savedCot = this.dataService.cargarCotizacionLocal();
        if (savedCot) this.cotizacion.fromJSON(savedCot);
        this.renderAll();

        const formData = this.dataService.cargarFormularioLocal();
        if (formData) this.formView.cargarDatos(formData);
    }

    private renderAll(): void {
        this.tableView.render(this.cotizacion, this.catalogo);
        const subtotal = this.cotizacion.calcularSubtotal();
        const igv = this.cotizacion.calcularIGV();
        const total = this.cotizacion.calcularTotal();
        this.totalsView.render(subtotal, igv, total);
        this.dataService.guardarCotizacionLocal(this.cotizacion.toJSON());
    }

    // Método público para actualizar la vista desde fuera de la clase
    public actualizarVista(): void {
        this.renderAll();
    }

    private handleEditItem(itemId: number, campo: keyof ItemCotizacion, valor: any): void {
        this.cotizacion.actualizarItem(itemId, campo, valor);
        this.renderAll();
    }

    private handleDeleteItem(itemId: number): void {
        this.cotizacion.eliminarItem(itemId);
        this.renderAll();
    }

    private handleFormChange(datos: DatosFormulario): void {
        this.dataService.guardarFormularioLocal(datos);
    }
}

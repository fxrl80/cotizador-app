import type { Servicio } from '../models/Catalogo';
import type { ItemCotizacion } from '../models/Cotizacion';
import type { DatosFormulario } from '../views/FormView';

export default class DataService {
    static async cargarCatalogoDesdeJson(url: string): Promise<Servicio[]> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error loading catalog: ${response.statusText}`);
        const data = await response.json();
        return data as Servicio[];
    }

    guardarCotizacionLocal(cotizacionJSON: { items: ItemCotizacion[]; nextId: number }): void {
        localStorage.setItem('cotizacion_actual', JSON.stringify(cotizacionJSON));
    }

    cargarCotizacionLocal(): { items: ItemCotizacion[]; nextId: number } | null {
        const saved = localStorage.getItem('cotizacion_actual');
        return saved ? JSON.parse(saved) : null;
    }

    guardarFormularioLocal(formData: DatosFormulario): void {
        localStorage.setItem('formulario_cotizacion', JSON.stringify(formData));
    }

    cargarFormularioLocal(): DatosFormulario | null {
        const saved = localStorage.getItem('formulario_cotizacion');
        return saved ? JSON.parse(saved) : null;
    }
}
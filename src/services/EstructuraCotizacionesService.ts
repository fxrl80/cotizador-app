import data from '../data/cotizaciones_predefinidas.json';
import type { CategoriaPrincipal, Subseccion, ItemPresupuesto } from '../models/EstructuraCotizacion';

export default class EstructuraCotizacionesService {
    private categorias: CategoriaPrincipal[] = (data as any).categorias;

    obtenerCategorias(): CategoriaPrincipal[] {
        return this.categorias;
    }

    obtenerSubsecciones(categoriaId: string): Subseccion[] | null {
        const cat = this.categorias.find(c => c.id === categoriaId);
        return cat ? cat.subsecciones : null;
    }

    obtenerItemsPorRuta(rutaIds: string[]): ItemPresupuesto[] | null {
        let nivel: any = this.categorias.find(c => c.id === rutaIds[0]);
        if (!nivel) return null;
        for (let i = 1; i < rutaIds.length; i++) {
            if (nivel.subsecciones) {
                nivel = nivel.subsecciones.find((sub: any) => sub.id === rutaIds[i]);
                if (!nivel) return null;
            } else {
                return null;
            }
        }
        return nivel.items || null;
    }
}
export interface ItemPresupuesto {
    item: string;
    codigo: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precioUnitario: number;
}

export interface Subseccion {
    id: string;
    nombre: string;
    subsecciones?: Subseccion[];
    items?: ItemPresupuesto[];
}

export interface CategoriaPrincipal {
    id: string;
    nombre: string;
    subsecciones: Subseccion[];
}

// Alias for backward compatibility
export type ItemPredefinido = ItemPresupuesto;
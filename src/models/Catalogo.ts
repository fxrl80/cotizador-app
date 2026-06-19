export interface Servicio {
    codigo: string;
    descripcion: string;
    unidad: string;
    costo: number;
}

export default class Catalogo {
    private servicios: Servicio[];

    constructor(servicios: Servicio[]) {
        this.servicios = servicios;
    }

    buscarPorCodigo(codigo: string): Servicio | undefined {
        return this.servicios.find(s => s.codigo === codigo);
    }

    obtenerTodos(): Servicio[] {
        return [...this.servicios];
    }
}
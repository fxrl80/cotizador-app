export interface ItemCotizacion {
    itemId: number;
    codigo: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precioUnitario: number;
}
export default class Cotizacion {
    private items: ItemCotizacion[];
    private nextId: number;
    constructor() {
        this.items = [];
        this.nextId = 1;
    }
    agregarItem(codigo: string, descripcion: string, unidad: string, precioUnitario: number, cantidad: number = 1): ItemCotizacion {
        const item: ItemCotizacion = {
            itemId: this.nextId++,
            codigo,
            descripcion,
            unidad,
            cantidad,
            precioUnitario
        };
        this.items.push(item);
        return item;
    }
    actualizarItem(itemId: number, campo: keyof ItemCotizacion, valor: any): void {
        const item = this.items.find(i => i.itemId === itemId);
        if (item) {
            (item[campo] as any) = valor;
        }
    }
    eliminarItem(itemId: number): void {
        this.items = this.items.filter(i => i.itemId !== itemId);
    }
    obtenerItems(): ItemCotizacion[] {
        return [...this.items];
    }
    calcularSubtotal(): number {
        return this.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
    }
    calcularIGV(): number {
        return this.calcularSubtotal() * 0.18;
    }
    calcularTotal(): number {
        return this.calcularSubtotal() + this.calcularIGV();
    }
    toJSON() {
        return {
            items: this.items,
            nextId: this.nextId
        };
    }
    fromJSON(data: { items: ItemCotizacion[]; nextId: number }): void {
        this.items = data.items || [];
        this.nextId = data.nextId || 1;
    }
}
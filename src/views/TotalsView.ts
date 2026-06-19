export default class TotalsView {
    private containerId: string;

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    private getContainer(): HTMLElement {
        const elem = document.getElementById(this.containerId);
        if (!elem) throw new Error(`Container ${this.containerId} not found`);
        return elem;
    }

    render(subtotal: number, igv: number, total: number): void {
        const container = this.getContainer();
        const formatMoney = (amount: number) => `S/ ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;

        container.innerHTML = `
            <div class="bg-white/90 border border-on-surface p-4 flex flex-col gap-3 shadow-sm">
                <div class="flex justify-between items-center font-data-table text-data-table text-on-surface">
                    <span>Subtotal de Ensayos</span>
                    <span>${formatMoney(subtotal)}</span>
                </div>
                <div class="flex justify-between items-center font-data-table text-data-table text-on-surface">
                    <span>Descuento Comercial (0%)</span>
                    <span>S/ 0.00</span>
                </div>
                <div class="flex justify-between items-center font-data-table text-data-table text-on-surface border-t border-dashed border-outline-variant pt-3">
                    <span>Base Imponible</span>
                    <span>${formatMoney(subtotal)}</span>
                </div>
                <div class="flex justify-between items-center font-data-table text-data-table text-on-surface-variant">
                    <span>IGV (18%)</span>
                    <span>${formatMoney(igv)}</span>
                </div>
                <div class="mt-2 pt-3 border-t-2 border-on-surface flex justify-between items-end">
                    <span class="font-headline-md text-sm uppercase font-bold text-on-surface">Total Final</span>
                    <span class="font-data-table text-lg font-bold text-primary-container">${formatMoney(total)}</span>
                </div>
            </div>
            
            <div class="mt-4">
                <button id="generate-pdf-btn" class="w-full py-3 bg-primary-container text-on-primary font-headline-md text-sm uppercase tracking-wider border-b-2 border-primary hover:bg-surface-tint hover:scale-105 transition-all duration-200 ease-out animate-pulse-glow flex justify-center items-center gap-2 rounded-sm shadow-sm">
                    <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span> Generar Cotización PDF
                </button>
            </div>
        `;
    }
}

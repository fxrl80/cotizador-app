import type { User } from '../services/AuthService';

export default class AppLayoutView {
    private container: HTMLElement;
    public onLogout: (() => void) | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    render(usuario: User): void {
        // 1. Inyectar los contenedores principales limpios y estructurados
        this.container.innerHTML = `
            <div id="cotizador-view" class="w-full flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto">
                <!-- Contenedor Datos Cliente -->
                <div id="form-container"></div>

                <!-- Contenedor Selección Ensayos -->
                <section class="bg-surface border border-outline-variant rounded-lg p-6 shadow-sm">
                    <h2 class="text-xl font-headline-md text-primary mb-2">Cotización Predefinida</h2>
                    <p class="text-sm text-on-surface-variant mb-6">Seleccione una base de ensayos para agregarla a los items seleccionados.</p>
                    <div class="flex flex-col md:flex-row gap-4 mb-6">
                        <div id="categoria-container" class="flex-1"></div>
                        <div id="subseccion-container" class="flex-1"></div>
                    </div>
                    <div id="items-edit-container"></div>
                </section>

                <!-- Contenedor Tabla y Resultados -->
                <div id="tabla-container"></div>
                
                <!-- Resumen Financiero -->
                <aside class="bg-surface-container-low border border-outline-variant rounded-lg p-6 mt-4">
                    <h3 class="text-lg font-headline-md text-primary mb-4 border-b border-outline-variant pb-2">Resumen Financiero</h3>
                    <div id="totals-container"></div>
                </aside>
            </div>
        `;

        // 2. Inyectar Perfil en el Header Superior
        const headerActions = document.getElementById('header-actions');
        if (headerActions) {
            headerActions.innerHTML = `
                <div class="flex items-center gap-3 pr-4">
                    <div class="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center border border-primary/20">
                        <span class="material-symbols-outlined text-lg">person</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-on-surface leading-none capitalize">${usuario.username}</span>
                        <span class="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">
                            ${usuario.role === 'admin' ? 'Administrador' : 'Vendedor'}
                        </span>
                    </div>
                </div>
                <button id="logout-btn" class="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant text-error hover:bg-error hover:text-on-error hover:border-error font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm rounded">
                    <span class="material-symbols-outlined text-sm">logout</span>
                    Salir
                </button>
            `;
        }

        // 3. Activar el botón de salida
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (this.onLogout) this.onLogout();
        });
    }
}

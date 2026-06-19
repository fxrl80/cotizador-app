import './styles.css';
import Catalogo from './models/Catalogo';
import DataService from './services/DataService';
import CotizacionController from './controllers/CotizacionController';
import CotizacionPredefinidaController from './controllers/CotizacionPredefinidaController';
import ExportService from './services/ExportService';
import AuthService, { type User } from './services/AuthService';
import AuthView from './views/AuthView';
import AppLayoutView from './views/AppLayoutView';

(async function main() {
    AuthService.init(); // Inicializar usuarios por defecto si no existen en localStorage

    const servicios = await DataService.cargarCatalogoDesdeJson('/data/catalogo.json');
    const catalogo = new Catalogo(servicios);
    const dataService = new DataService();

    const app = document.querySelector('#app') as HTMLElement | null;
    if (!app) return;

    const appLayout = document.getElementById('app-layout');

    const renderApp = async (usuario: User) => {
        // Mostrar la aplicación principal una vez logueado
        if (appLayout) {
            appLayout.classList.remove('hidden');
            appLayout.classList.add('flex');
        }

        const layout = new AppLayoutView(app);
        layout.onLogout = () => {
            AuthService.logout();
            window.location.reload(); // Recargar la página para volver al login limpiamente
        };
        layout.render(usuario);

        const cotizadorController = new CotizacionController(catalogo, dataService);
        await cotizadorController.init();

        const cotizacionPredefinidaController = new CotizacionPredefinidaController();
        cotizacionPredefinidaController.init();

        cotizacionPredefinidaController.onAgregarItems = (items) => {
            items.forEach(item => {
                cotizadorController.cotizacion.agregarItem(
                    item.codigo,
                    item.descripcion,
                    item.unidad,
                    item.precioUnitario,
                    item.cantidad
                );
            });

            cotizadorController.actualizarVista();
            alert(`${items.length} items agregados a Items de Ensayo Seleccionados.`);
        };

        const onExport = () => {
            const formData = cotizadorController.formView.obtenerDatos();
            void ExportService.exportarPDF(cotizadorController.cotizacion, formData);
        };

        // Event delegation: survives TotalsView re-renders that replace DOM elements
        app.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('#generate-pdf-btn')) {
                onExport();
            }
        });
    };

    const renderLogin = () => {
        const authView = new AuthView();
        authView.onLoginSuccess = (usuario) => {
            authView.hide(); // Ocultamos el login form cuando tiene éxito
            void renderApp(usuario);
        };
        authView.show();
    };

    const sesion = AuthService.getCurrentUser();
    if (sesion) {
        const authView = new AuthView();
        authView.hide(); // Asegurarnos de que el login esté oculto si ya hay sesión
        await renderApp(sesion);
    } else {
        renderLogin();
    }
})();

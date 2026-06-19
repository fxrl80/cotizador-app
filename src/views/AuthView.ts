import AuthService, { type User } from '../services/AuthService';

export default class AuthView {
    private container: HTMLElement | null;
    private form: HTMLFormElement | null;
    private usernameInput: HTMLInputElement | null;
    private passwordInput: HTMLInputElement | null;
    private errorMsg: HTMLElement | null;

    // Evento que se disparará cuando el login sea exitoso
    public onLoginSuccess?: (user: User) => void;

    constructor() {
        this.container = document.getElementById('login-view');
        this.form = document.getElementById('login-form') as HTMLFormElement | null;
        this.usernameInput = document.getElementById('login-username') as HTMLInputElement | null;
        this.passwordInput = document.getElementById('login-password') as HTMLInputElement | null;
        this.errorMsg = document.getElementById('login-error');

        this.bindEvents();
    }

    private bindEvents(): void {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    private handleSubmit(e: Event): void {
        e.preventDefault();
        if (!this.usernameInput || !this.passwordInput) return;

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        const user = AuthService.login(username, password);

        if (user) {
            this.errorMsg?.classList.add('hidden');
            if (this.onLoginSuccess) {
                this.onLoginSuccess(user);
            }
        } else {
            this.errorMsg?.classList.remove('hidden');
        }
    }

    public hide(): void {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }

    public show(): void {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
}
export interface User {
    username: string;
    password?: string;
    role: 'admin' | 'user';
}

export default class AuthService {
    private static readonly USERS_KEY = 'cot_usuarios';
    private static readonly CURRENT_USER_KEY = 'cot_current_user';

    /**
     * Inicializa la "base de datos" local de usuarios si está vacía.
     */
    static init(): void {
        const users = localStorage.getItem(this.USERS_KEY);
        if (!users) {
            const defaultUsers: User[] = [
                { username: 'admin', password: '1234', role: 'admin' },
                { username: 'vendedor', password: '1234', role: 'user' }
            ];
            localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
        }
    }

    /**
     * Intenta iniciar sesión con las credenciales dadas.
     */
    static login(username: string, password: string): User | null {
        const usersJson = localStorage.getItem(this.USERS_KEY);
        if (!usersJson) return null;

        const users: User[] = JSON.parse(usersJson);
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

        if (user) {
            // Guardamos la sesión sin exponer la contraseña
            const { password: _, ...userSession } = user;
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userSession));
            return userSession as User;
        }

        return null;
    }

    static logout(): void {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    static getCurrentUser(): User | null {
        const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }

    static isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    }
}
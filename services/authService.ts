const USERS_KEY = 'docusort_users_v2';
const SESSION_KEY = 'docusort_session_v2';

export interface UserProfile {
  username: string;
  passwordHash: string; // Simple hash for local privacy
  createdAt: number;
}

export const authService = {
  // Simple hash function
  async hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  getAllUsers(): Record<string, UserProfile> {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  },

  async register(username: string, pin: string): Promise<boolean> {
    const users = this.getAllUsers();
    
    // Check if user already exists
    if (users[username]) return false;
    
    const hash = await this.hashPassword(pin);
    const newUser: UserProfile = {
      username,
      passwordHash: hash,
      createdAt: Date.now()
    };
    
    users[username] = newUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    this.startSession(username);
    return true;
  },

  async login(username: string, pin: string): Promise<boolean> {
    const users = this.getAllUsers();
    const user = users[username];
    
    if (!user) return false;

    const hash = await this.hashPassword(pin);
    if (user.passwordHash === hash) {
      this.startSession(user.username);
      return true;
    }
    return false;
  },

  startSession(username: string) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username, active: true }));
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getUser(): { username: string } | null {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  }
};
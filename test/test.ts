// Test-Datei für TypeScript-Import in @aufbau/import

export interface UserProfile {
  id: number;
  username: string;
  role: 'admin' | 'user' | 'developer';
  active: boolean;
}

export class TestService {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public getGreeting(user: UserProfile): string {
    return `Hallo ${user.username} (${user.role}), willkommen bei ${this.name}!`;
  }

  public calculateStats(numbers: number[]): number {
    return numbers.reduce((acc, curr) => acc + curr, 0);
  }
}

export const defaultUser: UserProfile = {
  id: 42,
  username: "aufbau_dev",
  role: "developer",
  active: true
};

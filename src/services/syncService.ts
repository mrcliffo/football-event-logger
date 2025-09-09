export class SyncService {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async syncPendingData(): Promise<void> {
    // Simple sync service - in real app would sync with backend
    console.log('Sync service initialized');
  }

  getConnectionStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: false
    };
  }
}

export const syncService = new SyncService();
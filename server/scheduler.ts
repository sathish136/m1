import { leaveBalanceService } from './leaveBalanceService';

export class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the daily scheduler that runs automatic leave balance updates
   * Runs every 24 hours at midnight
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting automatic leave balance scheduler...');
    
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set initial timeout to run at midnight
    setTimeout(() => {
      this.runDailyUpdate();
      
      // Then set interval to run every 24 hours
      this.intervalId = setInterval(() => {
        this.runDailyUpdate();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, timeUntilMidnight);

    this.isRunning = true;
    console.log(`Scheduler will run first time at midnight (in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes)`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Automatic leave balance scheduler stopped');
  }

  /**
   * Run daily update manually
   */
  async runDailyUpdate(): Promise<void> {
    try {
      console.log('=== DAILY LEAVE BALANCE UPDATE ===');
      console.log(`Starting at: ${new Date().toISOString()}`);
      
      await leaveBalanceService.runDailyLeaveBalanceUpdate();
      
      console.log(`Completed at: ${new Date().toISOString()}`);
      console.log('=== UPDATE FINISHED ===');
    } catch (error) {
      console.error('Error in daily leave balance update:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextRun: string | null } {
    if (!this.isRunning) {
      return { isRunning: false, nextRun: null };
    }

    // Calculate next midnight
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);

    return {
      isRunning: true,
      nextRun: nextRun.toISOString()
    };
  }
}

export const scheduler = new SchedulerService();
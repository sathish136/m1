import { db } from './db';
import { storage } from './storage';
import { employees, attendance, holidays, leaveBalances } from '../shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface LeaveBalanceCalculation {
  employeeId: string;
  fullName: string;
  totalEligible: number;
  absentDays: number;
  leaveBalance: number;
  year: number;
}

export class LeaveBalanceService {
  /**
   * Calculate leave balances for all employees for a given year
   * This function applies from January 1, 2025 onwards
   */
  async calculateLeaveBalances(year: number = new Date().getFullYear()): Promise<LeaveBalanceCalculation[]> {
    // Only apply this from 2025 onwards
    if (year < 2025) {
      throw new Error('Leave balance calculation applies from 2025 onwards');
    }

    // Get all active employees
    const allEmployees = await db.select({
      id: employees.id,
      employeeId: employees.employeeId,
      fullName: employees.fullName,
      employeeGroup: employees.employeeGroup,
      status: employees.status
    }).from(employees).where(eq(employees.status, 'active'));

    const results: LeaveBalanceCalculation[] = [];

    // Get holidays for the year to exclude from absence calculation
    const yearHolidays = await this.getHolidaysForYear(year);
    const holidayDates = yearHolidays.map(h => h.date.toISOString().split('T')[0]);

    for (const employee of allEmployees) {
      // Calculate absent days for the year (excluding holidays and weekends)
      const absentDays = await this.calculateAbsentDays(employee.id, year, holidayDates);
      
      // All employees have 45 days eligible leave per year
      const totalEligible = 45;
      const leaveBalance = totalEligible - absentDays;

      // Update or create leave balance record
      await this.updateEmployeeLeaveBalance(employee.id, year, totalEligible, absentDays, leaveBalance);

      results.push({
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        totalEligible,
        absentDays,
        leaveBalance: Math.max(0, leaveBalance), // Ensure balance doesn't go negative
        year
      });
    }

    return results;
  }

  /**
   * Calculate absent days for an employee in a given year
   * Excludes holidays and weekends from the calculation
   */
  private async calculateAbsentDays(employeeId: string, year: number, holidayDates: string[]): Promise<number> {
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st

    // Get all attendance records for the employee in the year
    const attendanceRecords = await db.select({
      date: attendance.date,
      status: attendance.status
    }).from(attendance)
      .where(and(
        eq(attendance.employeeId, employeeId),
        gte(attendance.date, startDate),
        lte(attendance.date, endDate)
      ));

    // Count absent days (excluding holidays and weekends)
    let absentDays = 0;
    
    for (const record of attendanceRecords) {
      const recordDate = new Date(record.date);
      const dateString = recordDate.toISOString().split('T')[0];
      
      // Skip if it's a holiday
      if (holidayDates.includes(dateString)) {
        continue;
      }
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = recordDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      
      // Count as absent if status is 'absent'
      if (record.status === 'absent') {
        absentDays++;
      }
    }

    return absentDays;
  }

  /**
   * Get holidays for a specific year
   */
  private async getHolidaysForYear(year: number) {
    return await db.select({
      id: holidays.id,
      name: holidays.name,
      date: holidays.date,
      type: holidays.type
    }).from(holidays)
      .where(and(
        eq(holidays.year, year),
        eq(holidays.isActive, true)
      ));
  }

  /**
   * Update or create leave balance record for an employee
   */
  private async updateEmployeeLeaveBalance(
    employeeId: string, 
    year: number, 
    totalEligible: number, 
    absentDays: number, 
    leaveBalance: number
  ): Promise<void> {
    // Check if leave balance record exists
    const existingBalance = await storage.getLeaveBalance(employeeId, year);

    if (existingBalance) {
      // Update existing record
      await storage.updateLeaveBalance(existingBalance.id, {
        totalDays: totalEligible,
        usedDays: absentDays,
        remainingDays: Math.max(0, leaveBalance),
        updatedAt: new Date()
      });
    } else {
      // Create new record
      await storage.createLeaveBalance({
        employeeId,
        year,
        totalDays: totalEligible,
        annualDays: 21, // Standard annual days
        specialDays: 24, // Standard special days
        usedDays: absentDays,
        remainingDays: Math.max(0, leaveBalance)
      });
    }
  }

  /**
   * Daily automatic update - should be called once per day
   * Updates leave balances for the current year
   */
  async runDailyLeaveBalanceUpdate(): Promise<void> {
    const currentYear = new Date().getFullYear();
    
    // Only run for 2025 onwards
    if (currentYear >= 2025) {
      console.log(`Running daily leave balance update for year ${currentYear}`);
      await this.calculateLeaveBalances(currentYear);
      console.log(`Leave balance update completed for ${currentYear}`);
    }
  }

  /**
   * Get leave balance summary for all employees
   */
  async getLeaveBalanceSummary(year: number = new Date().getFullYear()): Promise<LeaveBalanceCalculation[]> {
    if (year < 2025) {
      return [];
    }

    // Get all employees with their leave balances
    const result = await db.select({
      employeeId: employees.employeeId,
      fullName: employees.fullName,
      annualEntitlement: leaveBalances.annualEntitlement,
      usedDays: leaveBalances.usedDays,
      remainingDays: leaveBalances.remainingDays,
      year: leaveBalances.year
    }).from(employees)
      .leftJoin(leaveBalances, and(
        eq(employees.id, leaveBalances.employeeId),
        eq(leaveBalances.year, year)
      ))
      .where(eq(employees.status, 'active'));

    return result.map(row => ({
      employeeId: row.employeeId,
      fullName: row.fullName,
      totalEligible: row.annualEntitlement || 45,
      absentDays: row.usedDays || 0,
      leaveBalance: row.remainingDays || 45,
      year: row.year || year
    }));
  }
}

export const leaveBalanceService = new LeaveBalanceService();
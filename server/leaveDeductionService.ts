import { db } from "./db.js";
import { sql } from "drizzle-orm";

export class LeaveDeductionService {
  /**
   * Automatically calculate and update leave balances based on attendance data
   * Effective from January 1, 2025
   */
  async processLeaveDeductions(year: number = new Date().getFullYear()): Promise<{
    employeesProcessed: number;
    totalLeaveDeducted: number;
    summary: { totalEmployees: number; totalAbsentDays: number; totalRemainingDays: number; }
  }> {
    if (year < 2025) {
      throw new Error('Leave deduction processing applies from 2025 onwards');
    }

    try {
      // Use raw SQL to calculate absent days and update leave balances
      const result = await db.execute(sql`
        WITH absent_counts AS (
          SELECT 
            a.employee_id,
            COUNT(*) as total_absent_days
          FROM attendance a
          WHERE a.status = 'absent' 
            AND a.date >= ${year + '-01-01'}
            AND a.date <= ${year + '-12-31'}
          GROUP BY a.employee_id
        ),
        updated_balances AS (
          UPDATE leave_balances lb
          SET 
            used_days = COALESCE(ac.total_absent_days, 0),
            remaining_days = GREATEST(0, 45 - COALESCE(ac.total_absent_days, 0)),
            updated_at = CURRENT_TIMESTAMP
          FROM absent_counts ac
          WHERE lb.employee_id = ac.employee_id
            AND lb.year = ${year}
          RETURNING lb.employee_id, lb.used_days, lb.remaining_days
        )
        SELECT 
          COUNT(*) as employees_processed,
          SUM(used_days) as total_leave_deducted,
          SUM(remaining_days) as total_remaining_days
        FROM updated_balances
      `);

      const stats = result.rows?.[0] || result[0] || {};

      // Also update employees with no attendance (set to 0 used days, 45 remaining)
      await db.execute(sql`
        UPDATE leave_balances 
        SET 
          used_days = 0,
          remaining_days = 45,
          updated_at = CURRENT_TIMESTAMP
        WHERE year = ${year}
          AND employee_id NOT IN (
            SELECT DISTINCT employee_id 
            FROM attendance 
            WHERE status = 'absent' 
              AND date >= ${year + '-01-01'}
              AND date <= ${year + '-12-31'}
          )
      `);

      // Get final summary statistics
      const summaryResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_employees,
          SUM(used_days) as total_absent_days,
          SUM(remaining_days) as total_remaining_days
        FROM leave_balances 
        WHERE year = ${year}
      `);

      const summary = summaryResult.rows?.[0] || summaryResult[0] || {};

      return {
        employeesProcessed: parseInt(stats.employees_processed) || 0,
        totalLeaveDeducted: parseInt(stats.total_leave_deducted) || 0,
        summary: {
          totalEmployees: parseInt(summary.total_employees) || 0,
          totalAbsentDays: parseInt(summary.total_absent_days) || 0,
          totalRemainingDays: parseInt(summary.total_remaining_days) || 0
        }
      };
    } catch (error) {
      console.error('Error processing leave deductions:', error);
      throw error;
    }
  }

  /**
   * Get current leave balance summary
   */
  async getLeaveBalanceSummary(year: number = new Date().getFullYear()): Promise<any> {
    if (year < 2025) {
      return { summary: { totalEmployees: 0, totalEligibleDays: 0, totalAbsentDays: 0, totalRemainingDays: 0 } };
    }

    try {
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_employees,
          SUM(total_eligible) as total_eligible_days,
          SUM(used_days) as total_absent_days,
          SUM(remaining_days) as total_remaining_days
        FROM leave_balances 
        WHERE year = ${year}
      `);

      const stats = result.rows?.[0] || result[0] || {};

      return {
        summary: {
          totalEmployees: parseInt(stats.total_employees) || 0,
          totalEligibleDays: parseInt(stats.total_eligible_days) || 0,
          totalAbsentDays: parseInt(stats.total_absent_days) || 0,
          totalRemainingDays: parseInt(stats.total_remaining_days) || 0
        }
      };
    } catch (error) {
      console.error('Error fetching leave balance summary:', error);
      return { summary: { totalEmployees: 0, totalEligibleDays: 0, totalAbsentDays: 0, totalRemainingDays: 0 } };
    }
  }
}

export const leaveDeductionService = new LeaveDeductionService();
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
      // First ensure all active employees have leave balance records
      await db.execute(sql`
        INSERT INTO leave_balances (employee_id, year, total_eligible, used_days, remaining_days, created_at, updated_at)
        SELECT 
          e.id,
          ${year},
          45,
          0,
          45,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM employees e
        WHERE e.status = 'active'
          AND e.id NOT IN (
            SELECT lb.employee_id 
            FROM leave_balances lb 
            WHERE lb.year = ${year}
          )
        ON CONFLICT (employee_id, year) DO NOTHING
      `);

      // Calculate comprehensive leave balance using a simpler direct approach
      const result = await db.execute(sql`
        UPDATE leave_balances
        SET 
          used_days = (
            SELECT 
              GREATEST(0, 117 - COALESCE(present_count, 0)) as calculated_absent_days
            FROM (
              SELECT 
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count
              FROM attendance a
              WHERE a.employee_id = leave_balances.employee_id
                AND a.date >= '2025-01-01'
                AND a.date <= CURRENT_DATE
            ) attendance_summary
          ),
          remaining_days = (
            SELECT 
              GREATEST(0, 45 - GREATEST(0, 117 - COALESCE(present_count, 0))) as calculated_remaining
            FROM (
              SELECT 
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count
              FROM attendance a
              WHERE a.employee_id = leave_balances.employee_id
                AND a.date >= '2025-01-01'
                AND a.date <= CURRENT_DATE
            ) attendance_summary
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE year = ${year}
        RETURNING employee_id, used_days, remaining_days
      `);

      const updatedRows = result.rows || result || [];

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
        employeesProcessed: updatedRows.length || 0,
        totalLeaveDeducted: parseInt(summary.total_absent_days) || 0,
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
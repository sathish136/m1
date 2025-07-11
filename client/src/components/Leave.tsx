import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, Clock, TrendingDown, Users, FileText } from "lucide-react";

interface LeaveBalanceData {
  employee_id: string;
  full_name: string;
  department: string;
  employee_group: string;
  annual_entitlement: number;
  used_days: number;
  remaining_days: number;
  utilization_percentage: string;
  usage_category: string;
}

interface LeaveSummary {
  totalEmployees: number;
  totalEligibleDays: number;
  totalAbsentDays: number;
  totalRemainingDays: number;
}

export default function Leave() {
  const currentYear = new Date().getFullYear();
  
  // Automatically fetch leave balance data for 2025+
  const { data: leaveBalances, isLoading: balancesLoading } = useQuery<LeaveBalanceData[]>({
    queryKey: ['/api/leave-balances/report', currentYear],
    enabled: currentYear >= 2025,
  });

  const { data: leaveSummary, isLoading: summaryLoading } = useQuery<{ summary: LeaveSummary }>({
    queryKey: ['/api/leave-balances/summary', currentYear],
    enabled: currentYear >= 2025,
  });

  // Auto-calculate leave balances on page load for 2025+
  useEffect(() => {
    if (currentYear >= 2025) {
      const autoCalculate = async () => {
        try {
          await fetch('/api/leave-balances/auto-calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: currentYear })
          });
        } catch (error) {
          console.log('Auto-calculation in progress');
        }
      };
      autoCalculate();
    }
  }, [currentYear]);

  if (currentYear < 2025) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leave</h1>
            <p className="text-muted-foreground mt-2">Leave management system</p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-xl font-semibold">Leave System Available from 2025</h3>
              <p className="text-muted-foreground mt-2">
                The automatic leave balance system will be available from January 1, 2025 onwards.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const summary = leaveSummary?.summary;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Balance Report {currentYear}</h1>
          <p className="text-muted-foreground mt-2">
            Automatic leave balance calculation effective from January 1, 2025
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Clock className="h-4 w-4 mr-2" />
          Auto-Updated Daily
        </Badge>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{summary.totalEmployees}</div>
              <p className="text-xs text-blue-600">Active employees</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Eligible Leave</CardTitle>
              <CalendarDays className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{summary.totalEligibleDays}</div>
              <p className="text-xs text-green-600">45 days per employee</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Leave Taken</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{summary.totalAbsentDays}</div>
              <p className="text-xs text-orange-600">Total absent days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Leave Balance</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{summary.totalRemainingDays}</div>
              <p className="text-xs text-purple-600">Remaining leave days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Policy Information */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Leave Policy (Effective January 1, 2025)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Entitlement</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• All Group A & B employees: 45 days per year</li>
                <li>• Calendar year basis (January - December)</li>
                <li>• No manual intervention required</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Deduction Logic</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• 1 day deducted per absent day</li>
                <li>• Holidays and weekends excluded</li>
                <li>• Daily automatic calculation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Leave Balance Table */}
      {leaveBalances && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Leave Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 font-medium">S.No</th>
                    <th className="text-left p-3 font-medium">Employee ID</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Group</th>
                    <th className="text-center p-3 font-medium">Eligible Leave</th>
                    <th className="text-center p-3 font-medium">Leave Taken</th>
                    <th className="text-center p-3 font-medium">Leave Balance</th>
                    <th className="text-center p-3 font-medium">Usage %</th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveBalances.map((employee, index) => (
                    <tr key={employee.employee_id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="p-3 text-center font-medium">{index + 1}</td>
                      <td className="p-3 font-mono text-xs">{employee.employee_id}</td>
                      <td className="p-3">{employee.full_name}</td>
                      <td className="p-3">
                        <Badge variant={employee.employee_group === 'group_a' ? 'default' : 'secondary'} className="text-xs">
                          Group {employee.employee_group === 'group_a' ? 'A' : 'B'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-semibold text-green-700">45</td>
                      <td className="p-3 text-center font-semibold text-orange-700">{employee.used_days}</td>
                      <td className="p-3 text-center font-semibold text-purple-700">{employee.remaining_days}</td>
                      <td className="p-3 text-center text-xs">{employee.utilization_percentage}%</td>
                      <td className="p-3 text-center">
                        <Badge 
                          variant={
                            employee.usage_category === 'No Leave Taken' ? 'outline' :
                            employee.usage_category === 'Low Usage' ? 'secondary' :
                            employee.usage_category === 'Moderate Usage' ? 'default' :
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {employee.usage_category.replace(' Usage', '')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 text-center text-sm text-muted-foreground">
                Showing all {leaveBalances.length} employees
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(balancesLoading || summaryLoading) && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Clock className="mx-auto h-8 w-8 animate-spin text-blue-500" />
              <p className="text-muted-foreground">Loading leave balance data...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
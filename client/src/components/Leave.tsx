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



      {/* Employee Leave Balance Table */}
      {leaveBalances && (
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Individual Leave Balances</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">S.No</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Employee ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Group</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Eligible Leave</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Leave Taken</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Leave Balance</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Usage %</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveBalances.map((employee, index) => (
                    <tr key={employee.employee_id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="py-3 px-4 text-center font-medium text-gray-700">{index + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-600 font-medium">{employee.employee_id}</td>
                      <td className="py-3 px-4 text-gray-900 font-medium">{employee.full_name}</td>
                      <td className="py-3 px-4">
                        <Badge variant={employee.employee_group === 'group_a' ? 'default' : 'secondary'} className="text-xs font-medium">
                          Group {employee.employee_group === 'group_a' ? 'A' : 'B'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-green-600">45</td>
                      <td className="py-3 px-4 text-center font-semibold text-orange-600">{employee.used_days}</td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-600">{employee.remaining_days}</td>
                      <td className="py-3 px-4 text-center text-sm font-medium text-gray-600">{employee.utilization_percentage}%</td>
                      <td className="py-3 px-4 text-center">
                        <Badge 
                          variant={
                            employee.usage_category === 'No Leave Taken' ? 'outline' :
                            employee.usage_category === 'Low Usage' ? 'secondary' :
                            employee.usage_category === 'Moderate Usage' ? 'default' :
                            'destructive'
                          }
                          className="text-xs font-medium"
                        >
                          {employee.usage_category.replace(' Usage', '')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t text-center text-sm text-gray-600">
              Showing all <span className="font-semibold">{leaveBalances.length}</span> employees
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
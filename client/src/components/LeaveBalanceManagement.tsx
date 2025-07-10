import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

export default function LeaveBalanceManagement() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch leave balance report with automatic deduction calculations
  const { data: leaveReport = [], isLoading: isReportLoading } = useQuery({
    queryKey: ['/api/leave-balances/report', selectedYear],
    queryFn: () => apiRequest('GET', `/api/leave-balances/report?year=${selectedYear}`),
  });

  // Fetch leave balance statistics
  const { data: leaveStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/leave-balances/stats', selectedYear],
    queryFn: () => apiRequest('GET', `/api/leave-balances/stats?year=${selectedYear}`),
  });

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Leave Balance Report</h1>
        <p className="text-gray-600">
          Every employee receives 45 days annual leave entitlement. Deductions are automatically calculated from absences.
        </p>
      </div>

      {/* Year Selection */}
      <div className="mb-6">
        <Label htmlFor="year-select" className="text-sm font-medium">Select Year</Label>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isReportLoading || isStatsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Statistics */}
          {leaveStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{leaveStats.total_employees}</div>
                  <div className="text-sm text-gray-600">Total Employees</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{leaveStats.total_holiday_entitlement}</div>
                  <div className="text-sm text-gray-600">Days per Employee</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{leaveStats.total_used}</div>
                  <div className="text-sm text-gray-600">Total Days Used</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{leaveStats.fully_available}</div>
                  <div className="text-sm text-gray-600">Fully Available</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Leave Policy Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leave Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xl font-bold text-blue-700">21 Days</div>
                  <div className="text-sm text-blue-600">Annual Holidays</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-xl font-bold text-green-700">24 Days</div>
                  <div className="text-sm text-green-600">Special Holidays</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-xl font-bold text-purple-700">45 Days</div>
                  <div className="text-sm text-purple-600">Total Entitlement</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Leave Balance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Leave Balance Report - {selectedYear}</CardTitle>
              <CardDescription>
                Automatic deductions from 45-day entitlement based on recorded absences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">Employee ID</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">Name</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">Department</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">Group</th>
                      <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium">Entitlement</th>
                      <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium">Used Days</th>
                      <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium">Remaining</th>
                      <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium">Eligibility Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(leaveReport) && leaveReport.map((employee: any, index: number) => (
                      <tr key={employee.employee_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-200 px-4 py-2 text-sm">{employee.employee_id}</td>
                        <td className="border border-gray-200 px-4 py-2 text-sm font-medium">{employee.full_name}</td>
                        <td className="border border-gray-200 px-4 py-2 text-sm">{employee.department}</td>
                        <td className="border border-gray-200 px-4 py-2 text-sm">
                          <Badge variant={employee.employee_group === 'group_a' ? 'default' : 'secondary'}>
                            {employee.employee_group === 'group_a' ? 'Group A' : 'Group B'}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-green-600">
                          {employee.total_entitlement}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-red-600">
                          {employee.used_days}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-blue-600">
                          {employee.remaining_days}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center text-sm">
                          <Badge 
                            variant={
                              employee.eligibility_status === 'Fully Available' ? 'default' :
                              employee.eligibility_status === 'High Available' ? 'secondary' :
                              employee.eligibility_status === 'Medium Available' ? 'outline' : 'destructive'
                            }
                          >
                            {employee.eligibility_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!Array.isArray(leaveReport) || leaveReport.length === 0) && (
                      <tr>
                        <td colSpan={8} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                          No leave balance data available for {selectedYear}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
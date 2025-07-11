import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, Filter, FileText, TrendingUp, Award, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OvertimeDisplay() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  const { data: overtimeEmployees = [], isLoading: isOvertimeLoading } = useQuery({
    queryKey: ["/api/overtime-eligible", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/overtime-eligible?date=${selectedDate}`);
      if (!response.ok) throw new Error("Failed to fetch overtime employees");
      return response.json();
    },
  });

  // Filter employees based on search and group
  const filteredEmployees = overtimeEmployees.filter((employee: any) => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === "all" || employee.employeeGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // Calculate statistics
  const totalEmployees = filteredEmployees.length;
  const totalOvertimeHours = filteredEmployees.reduce((sum: number, emp: any) => sum + parseFloat(emp.otHours || 0), 0);
  const weekendEmployees = filteredEmployees.filter((emp: any) => emp.isWeekend).length;
  const holidayEmployees = filteredEmployees.filter((emp: any) => emp.isHoliday).length;
  const regularEmployees = filteredEmployees.filter((emp: any) => !emp.isWeekend && !emp.isHoliday).length;

  const getOvertimeTypeColor = (type: string) => {
    switch (type) {
      case 'Weekend': return 'bg-blue-100 text-blue-800';
      case 'Holiday': return 'bg-red-100 text-red-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Overtime Hours Display
          </h1>
          <p className="text-sm text-gray-600">
            View overtime hours for all employees - Weekend and Holiday hours count as full overtime
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalEmployees}</div>
            <p className="text-xs text-blue-600">with overtime hours</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total OT Hours</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalOvertimeHours.toFixed(1)}</div>
            <p className="text-xs text-green-600">hours worked</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Weekend OT</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{weekendEmployees}</div>
            <p className="text-xs text-purple-600">employees</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Holiday OT</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{holidayEmployees}</div>
            <p className="text-xs text-orange-600">employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="group_a">Group A</SelectItem>
                  <SelectItem value="group_b">Group B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Table */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Overtime Hours - {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          {isOvertimeLoading ? (
            <div className="text-center py-8">Loading overtime data...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No overtime hours found for the selected date
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>OT Hours</TableHead>
                    <TableHead>OT Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee: any, index: number) => (
                    <TableRow key={employee.employeeId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>{employee.fullName}</TableCell>
                      <TableCell>
                        <Badge variant={employee.employeeGroup === 'group_a' ? 'default' : 'secondary'}>
                          {employee.employeeGroup === 'group_a' ? 'Group A' : 'Group B'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTime(employee.checkIn)}</TableCell>
                      <TableCell>{formatTime(employee.checkOut)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {employee.otHours} hours
                      </TableCell>
                      <TableCell>
                        <Badge className={getOvertimeTypeColor(employee.otType)}>
                          {employee.otType}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
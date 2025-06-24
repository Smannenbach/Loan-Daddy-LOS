import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  User, 
  UserCheck,
  Crown,
  Shield,
  FileText,
  Gavel,
  DollarSign,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
  Award,
  Briefcase
} from "lucide-react";

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  title?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiration?: string;
  nmlsId?: string;
  branchId?: string;
  managerId?: number;
  hireDate?: string;
  status: string;
  permissions?: string[];
  maxLoanAmount?: number;
  territories?: string[];
  commissionRate?: number;
  baseSalary?: number;
  notes?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

const roleTypes = [
  { value: "branch_manager", label: "Branch Manager", icon: Crown, color: "bg-purple-100 text-purple-800" },
  { value: "owner", label: "Owner", icon: Crown, color: "bg-gold-100 text-gold-800" },
  { value: "admin", label: "Admin", icon: Shield, color: "bg-blue-100 text-blue-800" },
  { value: "processor", label: "Processor", icon: FileText, color: "bg-green-100 text-green-800" },
  { value: "real_estate_agent", label: "Real Estate Agent", icon: Building2, color: "bg-orange-100 text-orange-800" },
  { value: "loan_officer", label: "Loan Officer", icon: UserCheck, color: "bg-indigo-100 text-indigo-800" },
  { value: "loa", label: "Loan Officer Assistant (LOA)", icon: User, color: "bg-teal-100 text-teal-800" },
  { value: "underwriter", label: "Underwriter", icon: Gavel, color: "bg-red-100 text-red-800" },
  { value: "closer", label: "Closer", icon: Award, color: "bg-yellow-100 text-yellow-800" },
  { value: "funder", label: "Funder", icon: DollarSign, color: "bg-emerald-100 text-emerald-800" }
];

const departments = [
  "Operations",
  "Sales", 
  "Underwriting",
  "Closing",
  "Funding",
  "Administration"
];

const permissions = [
  { value: "view_loans", label: "View Loans" },
  { value: "edit_loans", label: "Edit Loans" },
  { value: "approve_loans", label: "Approve Loans" },
  { value: "manage_team", label: "Manage Team" },
  { value: "view_reports", label: "View Reports" },
  { value: "manage_settings", label: "Manage Settings" },
  { value: "export_data", label: "Export Data" }
];

export default function TeamManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['/api/team-members'],
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: (memberData: any) => apiRequest('/api/team-members', 'POST', memberData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      setShowAddDialog(false);
      toast({
        title: "Team Member Added",
        description: "New team member has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive"
      });
    }
  });

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    title: '',
    licenseNumber: '',
    licenseState: '',
    nmlsId: '',
    maxLoanAmount: '',
    baseSalary: '',
    commissionRate: '',
    territories: [],
    permissions: [],
    notes: ''
  });

  const handleAddMember = () => {
    if (!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in first name, last name, email, and role.",
        variant: "destructive"
      });
      return;
    }

    const memberData = {
      ...newMember,
      maxLoanAmount: newMember.maxLoanAmount ? parseInt(newMember.maxLoanAmount) : null,
      baseSalary: newMember.baseSalary ? parseInt(newMember.baseSalary) : null,
      commissionRate: newMember.commissionRate ? parseFloat(newMember.commissionRate) : null,
      hireDate: new Date().toISOString(),
      status: 'active'
    };

    addMemberMutation.mutate(memberData);
  };

  const filteredMembers = teamMembers.filter((member: TeamMember) => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || member.role === filterRole;
    const matchesDepartment = filterDepartment === "all" || member.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const getRoleInfo = (role: string) => {
    return roleTypes.find(rt => rt.value === role) || roleTypes[roleTypes.length - 1];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "on_leave": return "bg-yellow-100 text-yellow-800";
      case "terminated": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Team Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your loan origination team members, roles, and permissions
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roleTypes.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept.toLowerCase()}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Team Member</DialogTitle>
                <DialogDescription>
                  Add a new team member to your loan origination system
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="role">Role & Permissions</TabsTrigger>
                  <TabsTrigger value="compensation">Licensing & Compensation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                        placeholder="john.smith@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newMember.phone}
                        onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={newMember.title}
                      onChange={(e) => setNewMember({...newMember, title: e.target.value})}
                      placeholder="Senior Loan Officer"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="role" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select value={newMember.role} onValueChange={(value) => setNewMember({...newMember, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleTypes.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center gap-2">
                                <role.icon className="w-4 h-4" />
                                {role.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select value={newMember.department} onValueChange={(value) => setNewMember({...newMember, department: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept.toLowerCase()}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {permissions.map(permission => (
                        <div key={permission.value} className="flex items-center space-x-2">
                          <Switch
                            id={permission.value}
                            checked={newMember.permissions.includes(permission.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewMember({
                                  ...newMember,
                                  permissions: [...newMember.permissions, permission.value]
                                });
                              } else {
                                setNewMember({
                                  ...newMember,
                                  permissions: newMember.permissions.filter(p => p !== permission.value)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={permission.value} className="text-sm">
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compensation" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={newMember.licenseNumber}
                        onChange={(e) => setNewMember({...newMember, licenseNumber: e.target.value})}
                        placeholder="License #"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nmlsId">NMLS ID</Label>
                      <Input
                        id="nmlsId"
                        value={newMember.nmlsId}
                        onChange={(e) => setNewMember({...newMember, nmlsId: e.target.value})}
                        placeholder="NMLS #"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxLoanAmount">Max Loan Amount</Label>
                      <Input
                        id="maxLoanAmount"
                        type="number"
                        value={newMember.maxLoanAmount}
                        onChange={(e) => setNewMember({...newMember, maxLoanAmount: e.target.value})}
                        placeholder="1000000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseSalary">Base Salary</Label>
                      <Input
                        id="baseSalary"
                        type="number"
                        value={newMember.baseSalary}
                        onChange={(e) => setNewMember({...newMember, baseSalary: e.target.value})}
                        placeholder="65000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      value={newMember.commissionRate}
                      onChange={(e) => setNewMember({...newMember, commissionRate: e.target.value})}
                      placeholder="0.50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newMember.notes}
                      onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                      placeholder="Additional notes about this team member..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
                  {addMemberMutation.isPending ? "Adding..." : "Add Team Member"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Members Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Team Members Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterRole !== "all" || filterDepartment !== "all"
                  ? "No team members match your search criteria."
                  : "Get started by adding your first team member."
                }
              </p>
              {!searchTerm && filterRole === "all" && filterDepartment === "all" && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member: TeamMember) => {
              const roleInfo = getRoleInfo(member.role);
              const IconComponent = roleInfo.icon;
              
              return (
                <Card 
                  key={member.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedMember(member);
                    setShowMemberDetail(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleInfo.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {member.firstName} {member.lastName}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {member.title || roleInfo.label}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(member.status)}`}>
                        {member.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </div>
                      
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {member.phone}
                        </div>
                      )}

                      {member.department && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          {member.department.charAt(0).toUpperCase() + member.department.slice(1)}
                        </div>
                      )}

                      {member.nmlsId && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Award className="w-4 h-4" />
                          NMLS: {member.nmlsId}
                        </div>
                      )}

                      {member.maxLoanAmount && (
                        <div className="text-xs text-green-600 font-medium">
                          Max Approval: ${member.maxLoanAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Team Member Detail Dialog */}
        <Dialog open={showMemberDetail} onOpenChange={setShowMemberDetail}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            {selectedMember && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {(() => {
                      const roleInfo = getRoleInfo(selectedMember.role);
                      const IconComponent = roleInfo.icon;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                    {selectedMember.firstName} {selectedMember.lastName}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedMember.title || getRoleInfo(selectedMember.role).label}
                    {selectedMember.department && ` • ${selectedMember.department.charAt(0).toUpperCase() + selectedMember.department.slice(1)} Department`}
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="licensing">Licensing</TabsTrigger>
                    <TabsTrigger value="compensation">Compensation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{selectedMember.email}</span>
                        </div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedMember.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Hire Date</Label>
                        <p className="mt-1 text-sm">
                          {selectedMember.hireDate ? new Date(selectedMember.hireDate).toLocaleDateString() : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Badge className={`mt-1 ${getStatusColor(selectedMember.status)}`}>
                          {selectedMember.status}
                        </Badge>
                      </div>
                    </div>

                    {selectedMember.notes && (
                      <div>
                        <Label>Notes</Label>
                        <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{selectedMember.notes}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="permissions">
                    <div className="space-y-4">
                      <div>
                        <Label>Current Permissions</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedMember.permissions?.map((permission, index) => (
                            <Badge key={index} variant="outline">
                              {permissions.find(p => p.value === permission)?.label || permission}
                            </Badge>
                          )) || <span className="text-gray-500">No permissions assigned</span>}
                        </div>
                      </div>
                      
                      {selectedMember.maxLoanAmount && (
                        <div>
                          <Label>Loan Approval Limit</Label>
                          <p className="mt-1 text-lg font-semibold text-green-600">
                            ${selectedMember.maxLoanAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="licensing">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMember.licenseNumber && (
                          <div>
                            <Label>License Number</Label>
                            <p className="mt-1 text-sm font-mono">{selectedMember.licenseNumber}</p>
                          </div>
                        )}
                        {selectedMember.nmlsId && (
                          <div>
                            <Label>NMLS ID</Label>
                            <p className="mt-1 text-sm font-mono">{selectedMember.nmlsId}</p>
                          </div>
                        )}
                      </div>
                      
                      {selectedMember.territories && selectedMember.territories.length > 0 && (
                        <div>
                          <Label>Licensed Territories</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedMember.territories.map((territory, index) => (
                              <Badge key={index} variant="outline">{territory}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="compensation">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMember.baseSalary && (
                          <div>
                            <Label>Base Salary</Label>
                            <p className="mt-1 text-lg font-semibold">
                              ${selectedMember.baseSalary.toLocaleString()}/year
                            </p>
                          </div>
                        )}
                        {selectedMember.commissionRate && (
                          <div>
                            <Label>Commission Rate</Label>
                            <p className="mt-1 text-lg font-semibold">
                              {(selectedMember.commissionRate * 100).toFixed(2)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
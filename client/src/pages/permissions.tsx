import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Plus, 
  Search, 
  Users, 
  Settings, 
  Lock, 
  Unlock,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  FileText,
  DollarSign,
  Database,
  BarChart3,
  MessageSquare,
  Calendar,
  Globe,
  Upload,
  Download
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  userCount?: number;
  createdAt: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

const allPermissions: Permission[] = [
  // Loan Management
  { id: "loans.view", name: "View Loans", description: "View loan applications and details", category: "Loans", icon: FileText },
  { id: "loans.create", name: "Create Loans", description: "Create new loan applications", category: "Loans", icon: FileText },
  { id: "loans.edit", name: "Edit Loans", description: "Modify loan application details", category: "Loans", icon: Edit },
  { id: "loans.delete", name: "Delete Loans", description: "Delete loan applications", category: "Loans", icon: Trash2 },
  { id: "loans.approve", name: "Approve Loans", description: "Approve or deny loan applications", category: "Loans", icon: UserCheck },
  { id: "loans.assign", name: "Assign Loans", description: "Assign loans to team members", category: "Loans", icon: Users },

  // Financial
  { id: "pricing.view", name: "View Pricing", description: "View loan pricing and rates", category: "Financial", icon: DollarSign },
  { id: "pricing.edit", name: "Edit Pricing", description: "Modify pricing and commission rates", category: "Financial", icon: DollarSign },
  { id: "commissions.view", name: "View Commissions", description: "View commission reports", category: "Financial", icon: BarChart3 },

  // Contacts & CRM
  { id: "contacts.view", name: "View Contacts", description: "View contact database", category: "CRM", icon: Users },
  { id: "contacts.create", name: "Create Contacts", description: "Add new contacts", category: "CRM", icon: Plus },
  { id: "contacts.edit", name: "Edit Contacts", description: "Modify contact information", category: "CRM", icon: Edit },
  { id: "contacts.delete", name: "Delete Contacts", description: "Remove contacts", category: "CRM", icon: Trash2 },

  // Communications
  { id: "communications.view", name: "View Communications", description: "View communication history", category: "Communications", icon: MessageSquare },
  { id: "communications.send", name: "Send Communications", description: "Send emails, SMS, and make calls", category: "Communications", icon: MessageSquare },
  { id: "calendar.view", name: "View Calendar", description: "View calendar and appointments", category: "Communications", icon: Calendar },
  { id: "calendar.manage", name: "Manage Calendar", description: "Create and manage appointments", category: "Communications", icon: Calendar },

  // Reports & Analytics
  { id: "reports.view", name: "View Reports", description: "Access standard reports", category: "Reports", icon: BarChart3 },
  { id: "reports.advanced", name: "Advanced Reports", description: "Access detailed analytics", category: "Reports", icon: BarChart3 },
  { id: "data.export", name: "Export Data", description: "Export data to files", category: "Reports", icon: Download },

  // Team Management
  { id: "team.view", name: "View Team", description: "View team member list", category: "Team", icon: Users },
  { id: "team.manage", name: "Manage Team", description: "Add, edit, and remove team members", category: "Team", icon: Users },
  { id: "roles.manage", name: "Manage Roles", description: "Create and modify user roles", category: "Team", icon: Shield },

  // System Administration
  { id: "settings.view", name: "View Settings", description: "View system settings", category: "System", icon: Settings },
  { id: "settings.edit", name: "Edit Settings", description: "Modify system configuration", category: "System", icon: Settings },
  { id: "audit.view", name: "View Audit Logs", description: "Access system audit trails", category: "System", icon: Eye },
  { id: "system.backup", name: "System Backup", description: "Create and restore backups", category: "System", icon: Database },
];

const permissionCategories = [...new Set(allPermissions.map(p => p.category))];

const systemRoles = [
  {
    name: "owner",
    displayName: "Owner",
    description: "Full system access with all permissions",
    permissions: allPermissions.map(p => p.id)
  },
  {
    name: "branch_manager", 
    displayName: "Branch Manager",
    description: "Manage branch operations and team",
    permissions: [
      "loans.view", "loans.create", "loans.edit", "loans.approve", "loans.assign",
      "contacts.view", "contacts.create", "contacts.edit",
      "communications.view", "communications.send", "calendar.view", "calendar.manage",
      "reports.view", "reports.advanced", "data.export",
      "team.view", "team.manage", "pricing.view"
    ]
  },
  {
    name: "loan_officer",
    displayName: "Loan Officer", 
    description: "Process loans and manage client relationships",
    permissions: [
      "loans.view", "loans.create", "loans.edit",
      "contacts.view", "contacts.create", "contacts.edit",
      "communications.view", "communications.send", "calendar.view", "calendar.manage",
      "reports.view", "pricing.view"
    ]
  },
  {
    name: "processor",
    displayName: "Processor",
    description: "Process and review loan applications",
    permissions: [
      "loans.view", "loans.edit",
      "contacts.view",
      "communications.view", "communications.send",
      "reports.view"
    ]
  }
];

export default function Permissions() {
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDetail, setShowRoleDetail] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (roleData: any) => apiRequest('/api/roles', 'POST', roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setShowAddRoleDialog(false);
      toast({
        title: "Role Created",
        description: "New role has been successfully created.",
      });
    }
  });

  // Update user permissions mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number, data: any }) => 
      apiRequest(`/api/users/${userId}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Permissions Updated",
        description: "User permissions have been updated.",
      });
    }
  });

  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  });

  const handleCreateRole = () => {
    if (!newRole.name || !newRole.displayName) {
      toast({
        title: "Missing Information",
        description: "Please provide role name and display name.",
        variant: "destructive"
      });
      return;
    }

    createRoleMutation.mutate(newRole);
  };

  const getPermissionsByCategory = () => {
    return permissionCategories.reduce((acc, category) => {
      acc[category] = allPermissions.filter(p => p.category === category);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const filteredRoles = roles.filter((role: Role) =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter((user: User) =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Permissions & Roles
          </h1>
          <p className="text-gray-600 mt-2">
            Manage user roles and permissions for your loan origination system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="users">User Permissions</TabsTrigger>
            <TabsTrigger value="permissions">All Permissions</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="roles" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
                
                <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>
                        Define a new role with specific permissions for your team
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="roleName">Role Name</Label>
                          <Input
                            id="roleName"
                            value={newRole.name}
                            onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                            placeholder="custom_role"
                          />
                        </div>
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={newRole.displayName}
                            onChange={(e) => setNewRole({...newRole, displayName: e.target.value})}
                            placeholder="Custom Role"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newRole.description}
                          onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                          placeholder="Describe what this role can do..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Permissions</Label>
                        <div className="space-y-4 mt-2">
                          {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                            <div key={category} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-3">{category}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {permissions.map((permission) => (
                                  <div key={permission.id} className="flex items-center space-x-2">
                                    <Switch
                                      id={permission.id}
                                      checked={newRole.permissions.includes(permission.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setNewRole({
                                            ...newRole,
                                            permissions: [...newRole.permissions, permission.id]
                                          });
                                        } else {
                                          setNewRole({
                                            ...newRole,
                                            permissions: newRole.permissions.filter(p => p !== permission.id)
                                          });
                                        }
                                      }}
                                    />
                                    <Label htmlFor={permission.id} className="text-sm">
                                      {permission.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
                          {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {rolesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading roles...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRoles.map((role: Role) => (
                    <Card 
                      key={role.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRoleDetail(true);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{role.displayName}</span>
                          {role.isSystemRole && (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield className="w-4 h-4" />
                            {role.permissions.length} permissions
                          </div>
                          {role.userCount !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              {role.userCount} users
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user: User) => (
                    <Card key={user.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {user.firstName} {user.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Select
                              value={user.role}
                              onValueChange={(value) => {
                                updateUserMutation.mutate({
                                  userId: user.id,
                                  data: { role: value }
                                });
                              }}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role: Role) => (
                                  <SelectItem key={role.name} value={role.name}>
                                    {role.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              <div className="space-y-6">
                {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle>{category} Permissions</CardTitle>
                      <CardDescription>
                        Permissions related to {category.toLowerCase()} functionality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permissions.map((permission) => {
                          const IconComponent = permission.icon;
                          return (
                            <div key={permission.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <IconComponent className="w-5 h-5 text-blue-600" />
                              <div>
                                <h4 className="font-medium">{permission.name}</h4>
                                <p className="text-sm text-gray-600">{permission.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Role Detail Dialog */}
        <Dialog open={showRoleDetail} onOpenChange={setShowRoleDetail}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedRole && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {selectedRole.displayName}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedRole.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Permissions ({selectedRole.permissions.length})</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => {
                        const rolePermissions = permissions.filter(p => 
                          selectedRole.permissions.includes(p.id)
                        );
                        
                        if (rolePermissions.length === 0) return null;
                        
                        return (
                          <div key={category}>
                            <h4 className="font-medium text-sm text-gray-700 mb-1">{category}</h4>
                            <div className="flex flex-wrap gap-1">
                              {rolePermissions.map(permission => (
                                <Badge key={permission.id} variant="outline" className="text-xs">
                                  {permission.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
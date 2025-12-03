"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Keyboard,
  User,
  Bell,
  Palette,
  Globe,
  Save,
  RotateCcw,
  Lock,
  Shield,
} from "lucide-react"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import { defaultShortcuts, formatShortcut, type ShortcutConfig } from "@/lib/shortcuts"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { PasswordInput } from "@/components/ui/password-input"

export default function SettingsPage() {
  const { theme } = useTheme()
  const { data: session, status } = useSession()
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(defaultShortcuts)
  const [saved, setSaved] = useState(false)
  const [accountPassword, setAccountPassword] = useState("")
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
  })
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountMessage, setAccountMessage] = useState("")
  const [accountError, setAccountError] = useState("")

  useEffect(() => {
    // Load saved shortcuts from localStorage
    const saved = localStorage.getItem("shortcuts")
    if (saved) {
      try {
        setShortcuts(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load shortcuts", e)
      }
    }
  }, [])

  useEffect(() => {
    // Initialize account data when session loads
    if (session?.user && status === "authenticated") {
      setAccountData({
        name: session.user.name || "",
        email: session.user.email || "",
      })
    }
  }, [session, status])

  const handleShortcutChange = (key: string, value: string) => {
    setShortcuts((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    localStorage.setItem("shortcuts", JSON.stringify(shortcuts))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setShortcuts(defaultShortcuts)
    localStorage.setItem("shortcuts", JSON.stringify(defaultShortcuts))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAccountSave = async () => {
    setAccountError("")
    setAccountMessage("")
    setAccountLoading(true)

    try {
      const updateData: any = {}
      
      // Add name and email if changed
      if (accountData.name !== session?.user?.name) {
        updateData.name = accountData.name
      }
      if (accountData.email !== session?.user?.email) {
        updateData.email = accountData.email
      }
      
      // Add password if provided
      if (accountPassword) {
        updateData.password = accountPassword
      }

      if (Object.keys(updateData).length === 0) {
        setAccountMessage("No changes to save")
        setAccountLoading(false)
        return
      }

      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await res.json()

      if (res.ok) {
        setAccountMessage("Account updated successfully!")
        setAccountPassword("") // Clear password field
        setTimeout(() => setAccountMessage(""), 3000)
      } else {
        setAccountError(data.error || "Failed to update account")
      }
    } catch (err) {
      setAccountError("Failed to update account")
    } finally {
      setAccountLoading(false)
    }
  }

  const shortcutKeys = [
    { key: "commandPalette", label: "Open Command Palette", default: defaultShortcuts.commandPalette },
    { key: "newProject", label: "Create New Project", default: defaultShortcuts.newProject },
    { key: "newTask", label: "Create New Task", default: defaultShortcuts.newTask },
    { key: "newSecret", label: "Create New Secret", default: defaultShortcuts.newSecret },
    { key: "newNote", label: "Create New Note", default: defaultShortcuts.newNote },
    { key: "toggleTheme", label: "Toggle Theme", default: defaultShortcuts.toggleTheme },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and app customizations
        </p>
      </div>

      <Tabs defaultValue="general" className="max-w-4xl">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Shortcuts
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="UTC"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                  <CardDescription>
                    Customize keyboard shortcuts for quick actions
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    {saved ? "Saved!" : "Save"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {shortcutKeys.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <Label className="font-medium">{item.label}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Default: <Badge variant="outline" className="font-mono text-xs">
                          {formatShortcut(item.default)}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={shortcuts[item.key] || ""}
                        onChange={(e) => handleShortcutChange(item.key, e.target.value)}
                        placeholder={item.default}
                        className="w-32 font-mono text-sm"
                      />
                      {shortcuts[item.key] && (
                        <Badge variant="secondary" className="font-mono">
                          {formatShortcut(shortcuts[item.key])}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Use &quot;mod&quot; for Cmd on Mac or Ctrl on Windows/Linux.
                  Format: mod+k, mod+shift+p, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <select
                  id="font-size"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
                  defaultValue="medium"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <Label htmlFor="density">UI Density</Label>
                <select
                  id="density"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
                  defaultValue="comfortable"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  placeholder="Your name"
                  className="mt-2"
                />
              </div>
              <PasswordInput
                id="password"
                label="Change Password"
                value={accountPassword}
                onChange={setAccountPassword}
                placeholder="Enter new password"
                showGenerator={true}
              />

              {accountError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {accountError}
                </div>
              )}

              {accountMessage && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {accountMessage}
                </div>
              )}

              <Button onClick={handleAccountSave} disabled={accountLoading}>
                {accountLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <VaultPasswordSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for due tasks
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Deployment Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify on deployment status changes
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Server Health Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert on server issues
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6 mt-6">
          <PermissionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Users Management Component
function UsersManagement() {
  const { data: session } = useSession()
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    enabled: session?.user?.role === "admin",
  })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  if (session?.user?.role !== "admin") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You don&apos;t have permission to manage users.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Create and manage user accounts
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <div className="space-y-2">
            {users?.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{user.name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Created {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </Card>
  )
}

// Permissions Management Component
function PermissionsManagement() {
  const { data: session } = useSession()
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    enabled: session?.user?.role === "admin",
  })

  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetch("/api/permissions")
      if (!res.ok) throw new Error("Failed to fetch permissions")
      return res.json()
    },
    enabled: session?.user?.role === "admin",
  })

  const [selectedRole, setSelectedRole] = useState<string>("admin")

  const resources = ["projects", "tasks", "secrets", "servers", "notes", "integrations", "deployments", "users"]
  const actions = ["read", "write", "delete", "manage"]
  const roles = ["admin", "client"]

  const queryClient = useQueryClient()

  const handleTogglePermission = async (role: string, resource: string, action: string) => {
    const existing = permissions?.[role]?.find(
      (p: any) => p.role === role && p.resource === resource && p.action === action
    )

    try {
      if (existing) {
        await fetch(`/api/permissions?id=${existing.id}`, { method: "DELETE" })
      } else {
        await fetch("/api/permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, resource, action }),
        })
      }
      // Refetch permissions
      queryClient.invalidateQueries({ queryKey: ["permissions"] })
    } catch (error) {
      console.error("Failed to toggle permission:", error)
    }
  }

  if (session?.user?.role !== "admin") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You don&apos;t have permission to manage permissions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role-Based Permissions</CardTitle>
        <CardDescription>
          Configure permissions for Admin and Client roles. Users inherit permissions based on their role.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-semibold">Select Role to Configure</Label>
          <div className="grid grid-cols-2 gap-4 mt-3">
            {roles.map((role) => (
              <Card 
                key={role} 
                className={`cursor-pointer transition-all border-2 ${
                  selectedRole === role 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">
                    {role === 'admin' ? '👑' : '👤'}
                  </div>
                  <div className="font-semibold capitalize">{role}</div>
                  <div className="text-sm text-muted-foreground">
                    {role === 'admin' ? 'Full system access' : 'Limited access'}
                  </div>
                  {permissions?.[role] && (
                    <div className="text-xs text-primary mt-1">
                      {permissions[role].length} permissions set
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold capitalize">{selectedRole} Permissions</h3>
            <Badge variant="outline">
              {permissions?.[selectedRole]?.length || 0} active permissions
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {resources.map((resource) => (
              <Card key={resource} className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {resource}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {actions.map((action) => {
                      const hasPermission = permissions?.[selectedRole]?.some(
                        (p: any) => p.resource === resource && p.action === action
                      )
                      return (
                        <label
                          key={action}
                          className="flex items-center space-x-3 cursor-pointer group p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={() =>
                              handleTogglePermission(selectedRole, resource, action)
                            }
                            className="h-4 w-4 rounded border-2 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium capitalize group-hover:text-primary transition-colors">
                            {action}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Vault Password Settings Component
function VaultPasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [hasVaultPassword, setHasVaultPassword] = useState(false)

  useEffect(() => {
    // Check if user already has a vault password
    const checkVaultPassword = async () => {
      try {
        const res = await fetch("/api/auth/vault-password")
        const data = await res.json()
        setHasVaultPassword(data.hasVaultPassword)
      } catch (err) {
        console.error("Failed to check vault password status:", err)
      }
    }
    checkVaultPassword()
  }, [])

  const handleSetVaultPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/vault-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, action: "set" }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("Vault password set successfully!")
        setHasVaultPassword(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setError(data.error || "Failed to set vault password")
      }
    } catch (err) {
      setError("Failed to set vault password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateVaultPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!currentPassword) {
      setError("Current password is required")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      // First verify current password
      const verifyRes = await fetch("/api/auth/vault-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: currentPassword, action: "verify" }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyData.valid) {
        setError("Current password is incorrect")
        setIsLoading(false)
        return
      }

      // Set new password
      const setRes = await fetch("/api/auth/vault-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, action: "set" }),
      })

      const setData = await setRes.json()

      if (setRes.ok) {
        setMessage("Vault password updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setError(setData.error || "Failed to update vault password")
      }
    } catch (err) {
      setError("Failed to update vault password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Vault Security</CardTitle>
        </div>
        <CardDescription>
          {hasVaultPassword
            ? "Update your secrets vault password"
            : "Set a separate password for your secrets vault"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!hasVaultPassword && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Currently, your secrets vault uses your login password. 
                Set a separate vault password for enhanced security.
              </p>
            </div>
          )}

          <form onSubmit={hasVaultPassword ? handleUpdateVaultPassword : handleSetVaultPassword} className="space-y-4">
            {hasVaultPassword && (
              <PasswordInput
                id="current-vault-password"
                label="Current Vault Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current vault password"
                required
                minLength={6}
              />
            )}

            <PasswordInput
              id="new-vault-password"
              label={hasVaultPassword ? "New Vault Password" : "Vault Password"}
              value={newPassword}
              onChange={setNewPassword}
              placeholder={hasVaultPassword ? "Enter new vault password" : "Enter vault password"}
              required
              minLength={6}
              showGenerator={true}
            />

            <PasswordInput
              id="confirm-vault-password"
              label={hasVaultPassword ? "Confirm New Password" : "Confirm Password"}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm password"
              required
              minLength={6}
            />

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {message}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                "Processing..."
              ) : hasVaultPassword ? (
                "Update Vault Password"
              ) : (
                "Set Vault Password"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Security Note:</strong> Your vault password encrypts access to your secrets. 
              Choose a strong, unique password that you don&apos;t use elsewhere.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

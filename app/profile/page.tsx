"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, User, Mail, Calendar, Key, Eye, EyeOff, Copy, Check } from "lucide-react"
import { generateStrongPassword } from "@/lib/password-generator"
import { formatDate } from "@/lib/utils"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [copied, setCopied] = useState({
    new: false,
    generated: false,
  })

  const copyToClipboard = async (text: string, type: "new" | "generated") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied({ ...copied, [type]: true })
      setTimeout(() => setCopied({ ...copied, [type]: false }), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to change password")
      }
      return res.json()
    },
    onSuccess: () => {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      alert("Password changed successfully!")
    },
  })

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
  }

  const generatePassword = () => {
    const password = generateStrongPassword(12)
    setGeneratedPassword(password)
    setPasswordForm((prev) => ({ ...prev, newPassword: password, confirmPassword: password }))
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and password
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{session?.user?.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <p className="font-medium">{session?.user?.name || "Not set"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <div className="mt-1">
                    <Badge variant={session?.user?.role === "admin" ? "default" : "secondary"}>
                      {session?.user?.role || "client"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Enter new password"
                      required
                      minLength={6}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                        }
                        title={showPasswords.new ? "Hide password" : "Show password"}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      {passwordForm.newPassword && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(passwordForm.newPassword, "new")}
                          title="Copy password"
                        >
                          {copied.new ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordGenerator(!showPasswordGenerator)
                      if (!showPasswordGenerator) {
                        generatePassword()
                      }
                    }}
                    title="Generate strong password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {showPasswordGenerator && generatedPassword && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      Generated password (click to use):
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <code className="block p-2 bg-background rounded font-mono text-sm pr-20">
                          {generatedPassword}
                        </code>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => copyToClipboard(generatedPassword, "generated")}
                            title="Copy password"
                          >
                            {copied.generated ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: generatedPassword,
                            confirmPassword: generatedPassword,
                          })
                        }}
                      >
                        Use
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 6 characters. Click the refresh icon to generate a strong password.
                </p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }
                    title={showPasswords.confirm ? "Hide password" : "Show password"}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordForm.newPassword &&
                  passwordForm.confirmPassword &&
                  passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    })
                    setShowPasswordGenerator(false)
                    setGeneratedPassword("")
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                </Button>
              </div>
              {changePasswordMutation.isError && (
                <p className="text-sm text-destructive">
                  {changePasswordMutation.error instanceof Error
                    ? changePasswordMutation.error.message
                    : "Failed to change password"}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


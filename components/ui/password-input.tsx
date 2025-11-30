"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Copy, RefreshCw, Check } from "lucide-react"
import { generateSecurePassword, generateStrongPassword } from "@/lib/password-generator"

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  showGenerator?: boolean
  className?: string
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  minLength = 6,
  showGenerator = false,
  className
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword()
    onChange(newPassword)
  }

  const handleCopyPassword = async () => {
    if (value) {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {showGenerator && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGeneratePassword}
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Generate
          </Button>
        )}
      </div>
      <div className="relative mt-2">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopyPassword}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
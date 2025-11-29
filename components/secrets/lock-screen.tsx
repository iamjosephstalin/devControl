"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

interface LockScreenProps {
    onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })

            const data = await res.json()

            if (data.valid) {
                onUnlock()
            } else {
                setError("Incorrect password")
            }
        } catch (err) {
            setError("Failed to verify password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full w-fit">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Locked Vault</CardTitle>
                    <CardDescription>
                        Enter your login password to access your secrets
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading || !password}>
                            {isLoading ? "Unlocking..." : "Unlock Vault"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

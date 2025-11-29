import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { ProjectHeader } from "@/components/projects/project-header"
import { EnvManager } from "@/components/env/env-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default async function EnvironmentPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return redirect("/login")

    const project = await prisma.project.findUnique({
        where: {
            id: params.id,
            userId: session.user.id
        },
    })

    if (!project) {
        notFound()
    }

    return (
        <div className="p-8 space-y-8">
            <ProjectHeader project={project} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Environment Variables
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <EnvManager projectId={project.id} />
                </CardContent>
            </Card>
        </div>
    )
}

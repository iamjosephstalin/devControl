"use client"

import { useEffect, useRef } from "react"

interface DeploymentLogsProps {
    logs: string
}

export function DeploymentLogs({ logs }: DeploymentLogsProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    return (
        <div className="bg-black/90 text-green-500 font-mono text-sm p-4 rounded-md h-[400px] overflow-auto" ref={scrollRef}>
            <pre className="whitespace-pre-wrap">{logs}</pre>
        </div>
    )
}

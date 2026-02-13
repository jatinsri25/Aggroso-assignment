'use client'

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BookTemplate, Code, Briefcase } from "lucide-react"

const TEMPLATES = [
    {
        id: 'mobile-app',
        label: 'Mobile App Feature',
        icon: <Code className="h-4 w-4 mr-2" />,
        data: {
            goal: "Add biometric authentication (FaceID/TouchID)",
            users: "Mobile App Users (iOS & Android)",
            constraints: "React Native, Secure Storage, Fallback to PIN"
        }
    },
    {
        id: 'dashboard',
        label: 'Admin Dashboard',
        icon: <Briefcase className="h-4 w-4 mr-2" />,
        data: {
            goal: "Create a user management table with filtering and export",
            users: "System Administrators",
            constraints: "Pagination, Search, CSV Export, Role-based access"
        }
    },
    {
        id: 'landing-page',
        label: 'SaaS Landing Page',
        icon: <BookTemplate className="h-4 w-4 mr-2" />,
        data: {
            goal: "Design a high-converting landing page for a new AI product",
            users: "Potential Customers",
            constraints: "SEO optimized, Fast load time, Email capture form"
        }
    }
]

export function Templates({ onSelect }: { onSelect: (data: any) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {TEMPLATES.map(t => (
                <Button
                    key={t.id}
                    variant="outline"
                    className="h-auto py-3 justify-start"
                    onClick={() => onSelect(t.data)}
                >
                    {t.icon}
                    <div className="flex flex-col items-start">
                        <span className="font-semibold">{t.label}</span>
                    </div>
                </Button>
            ))}
        </div>
    )
}

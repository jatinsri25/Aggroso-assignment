'use client'

import { useState, useTransition } from "react"
import { generateSpecAction } from "@/app/actions"
import { Templates } from "@/components/templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2, ArrowUp, ArrowDown, Copy, Download, Trash2, Plus } from "lucide-react"

type Task = {
    id: string
    title: string
    description: string
    type: 'feature' | 'bug' | 'chore' | 'story'
    estimate?: string
}

type UserStory = {
    id: string
    asA: string
    iWant: string
    soThat: string
}

type Spec = {
    userStories: UserStory[]
    tasks: Task[]
    riskAnalysis?: string
}

export default function GeneratorForm() {
    const [isPending, startTransition] = useTransition()
    const [spec, setSpec] = useState<Spec | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [goal, setGoal] = useState("")
    const [users, setUsers] = useState("")
    const [constraints, setConstraints] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        startTransition(async () => {
            const formData = new FormData()
            formData.append("goal", goal)
            formData.append("users", users)
            formData.append("constraints", constraints)

            const result = await generateSpecAction(null, formData)

            if (result?.success && result.data) {
                setSpec(result.data as Spec)
            } else {
                setError(result?.message || "Something went wrong")
            }
        })
    }

    // Editing Functions
    const moveTask = (index: number, direction: 'up' | 'down') => {
        if (!spec) return
        const newTasks = [...spec.tasks]
        if (direction === 'up' && index > 0) {
            [newTasks[index], newTasks[index - 1]] = [newTasks[index - 1], newTasks[index]]
        } else if (direction === 'down' && index < newTasks.length - 1) {
            [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]]
        }
        setSpec({ ...spec, tasks: newTasks })
    }

    const updateTask = (id: string, field: keyof Task, value: string) => {
        if (!spec) return
        const newTasks = spec.tasks.map(t => t.id === id ? { ...t, [field]: value } : t)
        setSpec({ ...spec, tasks: newTasks })
    }

    const deleteTask = (id: string) => {
        if (!spec) return
        const newTasks = spec.tasks.filter(t => t.id !== id)
        setSpec({ ...spec, tasks: newTasks })
    }

    const addTask = () => {
        if (!spec) return
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: "New Task",
            description: "Description",
            type: "feature",
            estimate: "1h"
        }
        setSpec({ ...spec, tasks: [...spec.tasks, newTask] })
    }

    const copyToClipboard = () => {
        if (!spec) return
        const text = `
# Project Goal: ${goal}

## User Stories
${spec.userStories.map(s => `- As a ${s.asA}, I want ${s.iWant}, so that ${s.soThat}`).join('\n')}

## Tasks
${spec.tasks.map(t => `- [ ] ${t.title} (${t.estimate || '?'}): ${t.description}`).join('\n')}

## Risk Analysis
${spec.riskAnalysis || 'None provided'}
    `
        navigator.clipboard.writeText(text)
        alert("Copied to clipboard!")
    }

    const downloadMarkdown = () => {
        if (!spec) return
        const text = `
# Project Goal: ${goal}
... (same content as clipboard)
    ` // In real app, reuse logic
        const content = `
# Project Goal: ${goal}

## User Stories
${spec.userStories.map(s => `- As a ${s.asA}, I want ${s.iWant}, so that ${s.soThat}`).join('\n')}

## Tasks
${spec.tasks.map(t => `- [ ] ${t.title} (${t.estimate || '?'}): ${t.description}`).join('\n')}

## Risk Analysis
${spec.riskAnalysis || 'None provided'}
    `
        const blob = new Blob([content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'project-spec.md'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleTemplateSelect = (data: any) => {
        setGoal(data.goal)
        setUsers(data.users)
        setConstraints(data.constraints)
        // Optionally auto-submit or just fill
    }

    return (
        <div className="space-y-8">
            <Templates onSelect={handleTemplateSelect} />

            <Card>
                <CardHeader>
                    <CardTitle>Describe Your Feature</CardTitle>
                    <CardDescription>Tell us what you want to build, who it is for, and any constraints.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Goal</label>
                            <Input
                                placeholder="e.g. Build a notification system for users"
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Users</label>
                            <Input
                                placeholder="e.g. Mobile users, Admins"
                                value={users}
                                onChange={e => setUsers(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Constraints</label>
                            <Textarea
                                placeholder="e.g. Must use React, fast performance, dark mode"
                                value={constraints}
                                onChange={e => setConstraints(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Tasks"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {spec && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Generated Specification</h2>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={copyToClipboard}>
                                <Copy className="mr-2 h-4 w-4" /> Copy
                            </Button>
                            <Button size="sm" variant="outline" onClick={downloadMarkdown}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                        </div>
                    </div>

                    {spec.riskAnalysis && (
                        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm text-amber-800 dark:text-amber-200 uppercase tracking-wider">Risk Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-amber-900 dark:text-amber-100 pb-4">
                                {spec.riskAnalysis}
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">User Stories</h3>
                        <div className="grid gap-4">
                            {spec.userStories.map((story) => (
                                <Card key={story.id}>
                                    <CardContent className="pt-6">
                                        <p><strong>As a</strong> {story.asA}, <strong>I want</strong> {story.iWant}, <strong>so that</strong> {story.soThat}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold">Engineering Tasks</h3>
                            <Button size="sm" onClick={addTask}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
                        </div>

                        <div className="space-y-3">
                            {spec.tasks.map((task, index) => (
                                <Card key={task.id} className="relative group">
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={() => moveTask(index, 'up')} className="p-1 hover:bg-muted rounded" disabled={index === 0}>
                                            <ArrowUp className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                        <button onClick={() => moveTask(index, 'down')} className="p-1 hover:bg-muted rounded" disabled={index === spec.tasks.length - 1}>
                                            <ArrowDown className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                        <button onClick={() => deleteTask(task.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <CardContent className="pt-4 pb-4 pl-4 pr-12">
                                        <div className="flex gap-2 items-start">
                                            <div className="font-mono text-xs text-muted-foreground mt-1 w-6">{index + 1}.</div>
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    value={task.title}
                                                    onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                                                    className="font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:underline decoration-dashed"
                                                />
                                                <Textarea
                                                    value={task.description}
                                                    onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                                    className="text-sm text-muted-foreground border-none shadow-none p-0 min-h-[40px] focus-visible:ring-0 resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <span className="text-xs bg-secondary px-2 py-1 rounded text-secondary-foreground">
                                                        {task.type}
                                                    </span>
                                                    <Input
                                                        value={task.estimate || ''}
                                                        onChange={(e) => updateTask(task.id, 'estimate', e.target.value)}
                                                        placeholder="Estimate"
                                                        className="w-20 text-xs h-6 px-1 py-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

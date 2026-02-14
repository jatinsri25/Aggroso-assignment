'use client'

import { useState, useTransition } from "react"
import { generateSpecAction } from "@/app/actions"
import { Templates } from "@/components/templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2, ArrowUp, ArrowDown, Copy, Download, Trash2, Plus, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ... types remain the same ...
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

    // ... helper functions (moveTask, updateTask, deleteTask, addTask, copy, download) remain same ...
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

## User Stories
${spec.userStories.map(s => `- As a ${s.asA}, I want ${s.iWant}, so that ${s.soThat}`).join('\n')}

## Tasks
${spec.tasks.map(t => `- [ ] ${t.title} (${t.estimate || '?'}): ${t.description}`).join('\n')}

## Risk Analysis
${spec.riskAnalysis || 'None provided'}
    `
        const blob = new Blob([text], { type: 'text/markdown' })
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
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
                <Templates onSelect={handleTemplateSelect} />
            </section>

            <Card className="border-2 shadow-lg dark:border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        Define Your Vision
                    </CardTitle>
                    <CardDescription>Tell the AI what you want to build. Be specific for better results.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Goal</label>
                            <Input
                                placeholder="e.g. Build a notification system for users"
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                required
                                className="h-12 text-base transition-all focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Users</label>
                            <Input
                                placeholder="e.g. Mobile users, Admins"
                                value={users}
                                onChange={e => setUsers(e.target.value)}
                                required
                                className="h-12 text-base transition-all focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Constraints</label>
                            <Textarea
                                placeholder="e.g. Must use React, fast performance, dark mode"
                                value={constraints}
                                onChange={e => setConstraints(e.target.value)}
                                className="min-h-[100px] text-base transition-all focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded">{error}</p>}
                        <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-md hover:shadow-lg transition-all" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Generate Plan"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {spec && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm sticky top-4 z-10 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                            Generated Specification
                        </h2>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={copyToClipboard} className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                <Copy className="mr-2 h-4 w-4" /> Copy
                            </Button>
                            <Button size="sm" variant="outline" onClick={downloadMarkdown} className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                        </div>
                    </div>

                    {spec.riskAnalysis && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-sm text-amber-800 dark:text-amber-200 uppercase tracking-wider font-bold">Risk Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-amber-900 dark:text-amber-100 pb-4 leading-relaxed">
                                    {spec.riskAnalysis}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2">User Stories</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {spec.userStories.map((story, i) => (
                                <motion.div
                                    key={story.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                >
                                    <Card className="h-full hover:border-primary/50 transition-colors">
                                        <CardContent className="pt-6">
                                            <p className="leading-relaxed"><strong className="text-primary">As a</strong> {story.asA}, <strong className="text-primary">I want</strong> {story.iWant}, <strong className="text-primary">so that</strong> {story.soThat}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="text-xl font-semibold">Engineering Tasks</h3>
                            <Button size="sm" onClick={addTask} variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {spec.tasks.map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className="relative group hover:shadow-md transition-shadow">
                                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-card/80 p-1 rounded">
                                                <button onClick={() => moveTask(index, 'up')} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" disabled={index === 0}>
                                                    <ArrowUp className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => moveTask(index, 'down')} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" disabled={index === spec.tasks.length - 1}>
                                                    <ArrowDown className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => deleteTask(task.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive hover:bg-destructive hover:text-white transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <CardContent className="pt-4 pb-4 pl-4 pr-12">
                                                <div className="flex gap-4 items-start">
                                                    <div className="font-mono text-sm text-muted-foreground mt-2 w-6 text-right tabular-nums">{index + 1}.</div>
                                                    <div className="flex-1 space-y-3">
                                                        <Input
                                                            value={task.title}
                                                            onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                                                            className="text-lg font-semibold border-transparent hover:border-input focus:border-input px-2 -ml-2 h-auto"
                                                        />
                                                        <Textarea
                                                            value={task.description}
                                                            onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                                            className="text-sm text-muted-foreground border-transparent hover:border-input focus:border-input px-2 -ml-2 min-h-[40px] resize-none"
                                                        />
                                                        <div className="flex gap-3">
                                                            <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded text-xs text-secondary-foreground font-medium uppercase tracking-wider">
                                                                {task.type}
                                                            </div>
                                                            <Input
                                                                value={task.estimate || ''}
                                                                onChange={(e) => updateTask(task.id, 'estimate', e.target.value)}
                                                                placeholder="Est."
                                                                className="w-20 text-xs h-7 px-2 text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

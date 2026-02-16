'use client'

import { useState, useTransition } from "react"
import { generateSpecAction } from "@/app/actions"
import { Templates } from "@/components/templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowUp, ArrowDown, Copy, Download, Trash2, Plus, Sparkles, BrainCircuit } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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

type Strategy = {
    analysis: string
    architecture: string
    edgeCases: string[]
}

type Spec = {
    userStories: UserStory[]
    tasks: Task[]
    riskAnalysis?: string
    strategy?: Strategy
}

type GenerateSpecResult = {
    success?: boolean
    data?: Spec
    strategy?: Strategy
    message?: string
}

type TemplateSelection = {
    goal: string
    users: string
    constraints: string
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
            formData.append("model", "gemini")

            const result = await generateSpecAction(null, formData) as GenerateSpecResult

            if (result?.success && result.data) {
                // Merge strategy if available
                setSpec({ ...result.data, strategy: result.strategy } as Spec)
            } else {
                setError(result?.message || "Something went wrong")
            }
        })
    }

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

## Strategy
${spec.strategy ? `
Analysis: ${spec.strategy.analysis}
Architecture: ${spec.strategy.architecture}
Edge Cases: ${spec.strategy.edgeCases.join(', ')}
` : ''}

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

## Strategy
${spec.strategy ? `
Analysis: ${spec.strategy.analysis}
Architecture: ${spec.strategy.architecture}
Edge Cases: ${spec.strategy.edgeCases.join(', ')}
` : ''}

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

    const handleTemplateSelect = (data: TemplateSelection) => {
        setGoal(data.goal)
        setUsers(data.users)
        setConstraints(data.constraints)
    }

    return (
        <div className="space-y-7">
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick Start Templates</h2>
                <Templates onSelect={handleTemplateSelect} />
            </section>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-cyan-500" />
                        Define Your Vision
                    </CardTitle>
                    <CardDescription>Describe what you want to ship, who it helps, and the technical boundaries.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/90">Goal</label>
                            <Input
                                placeholder="e.g. Build a notification system for users"
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                required
                                className="h-12 text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/90">Target Users</label>
                            <Input
                                placeholder="e.g. Mobile users, Admins"
                                value={users}
                                onChange={e => setUsers(e.target.value)}
                                required
                                className="h-12 text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/90">Constraints</label>
                            <Textarea
                                placeholder="e.g. Must use React, fast performance, dark mode"
                                value={constraints}
                                onChange={e => setConstraints(e.target.value)}
                                className="min-h-[100px] resize-none text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/90">AI Model Provider</label>
                            <div className="glow-chip inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                                Google Gemini
                            </div>
                        </div>

                        {error && <p className="rounded-lg border border-red-300/40 bg-red-100/60 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
                        <Button type="submit" className="h-12 w-full text-lg font-semibold" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Generate Plan (Step-by-Step)"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {spec && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-7"
                >
                    <div className="glow-card sticky top-4 z-10 flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
                        <h2 className="hero-gradient text-2xl font-bold">
                            Generated Specification
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={copyToClipboard}>
                                <Copy className="mr-2 h-4 w-4" /> Copy
                            </Button>
                            <Button size="sm" variant="outline" onClick={downloadMarkdown}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                        </div>
                    </div>

                    {spec.strategy && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="border-cyan-300/35 bg-cyan-300/10">
                                <CardHeader className="py-4 flex flex-row items-center gap-2">
                                    <BrainCircuit className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                                    <CardTitle className="text-sm font-bold uppercase tracking-[0.12em] text-cyan-900 dark:text-cyan-100">AI Strategy & Architecture</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pb-4 text-sm leading-relaxed text-cyan-950 dark:text-cyan-50">
                                    <div>
                                        <p className="mb-1 font-semibold">Analysis</p>
                                        <p>{spec.strategy.analysis}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 font-semibold">Architecture</p>
                                        <p>{spec.strategy.architecture}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 font-semibold">Edge Cases</p>
                                        <ul className="list-disc ml-4">
                                            {spec.strategy.edgeCases.map((ec, i) => (
                                                <li key={i}>{ec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {spec.riskAnalysis && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-teal-300/35 bg-teal-300/10">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-sm font-bold uppercase tracking-[0.12em] text-teal-900 dark:text-teal-100">Risk Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4 text-sm leading-relaxed text-teal-950 dark:text-teal-50">
                                    {spec.riskAnalysis}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    <div className="space-y-4">
                        <h3 className="panel-separator pb-2 text-xl font-semibold">User Stories</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {spec.userStories.map((story, i) => (
                                <motion.div
                                    key={story.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                >
                                    <Card className="h-full hover:border-cyan-300/65">
                                        <CardContent className="pt-6">
                                            <p className="leading-relaxed"><strong className="text-cyan-700 dark:text-cyan-300">As a</strong> {story.asA}, <strong className="text-cyan-700 dark:text-cyan-300">I want</strong> {story.iWant}, <strong className="text-cyan-700 dark:text-cyan-300">so that</strong> {story.soThat}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="panel-separator flex items-center justify-between pb-2">
                            <h3 className="text-xl font-semibold">Engineering Tasks</h3>
                            <Button size="sm" onClick={addTask} variant="outline"><Plus className="mr-1 h-4 w-4" /> Add Task</Button>
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
                                        <Card className="group relative hover:border-cyan-300/60">
                                            <div className="absolute right-2 top-2 z-10 flex gap-1 rounded bg-card/80 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button onClick={() => moveTask(index, 'up')} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" disabled={index === 0}>
                                                    <ArrowUp className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => moveTask(index, 'down')} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" disabled={index === spec.tasks.length - 1}>
                                                    <ArrowDown className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => deleteTask(task.id)} className="rounded p-1 text-destructive transition-colors hover:bg-destructive hover:text-white">
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
                                                            className="-ml-2 h-auto border-transparent px-2 text-lg font-semibold hover:border-input focus:border-input"
                                                        />
                                                        <Textarea
                                                            value={task.description}
                                                            onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                                            className="-ml-2 min-h-[40px] resize-none border-transparent px-2 text-sm text-muted-foreground hover:border-input focus:border-input"
                                                        />
                                                        <div className="flex gap-3">
                                                            <div className="glow-chip flex items-center gap-2 rounded px-2 py-1 text-xs font-medium uppercase tracking-[0.12em] text-cyan-900 dark:text-cyan-100">
                                                                {task.type}
                                                            </div>
                                                            <Input
                                                                value={task.estimate || ''}
                                                                onChange={(e) => updateTask(task.id, 'estimate', e.target.value)}
                                                                placeholder="Est."
                                                                className="h-7 w-20 px-2 text-center text-xs"
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

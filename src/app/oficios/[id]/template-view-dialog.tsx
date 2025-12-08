'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Copy, CheckCheck, User, MessageSquare, Send } from 'lucide-react'
import { OficioTemplate } from '@/types/database'

export function TemplateViewDialog({ template }: { template: OficioTemplate }) {
    const [open, setOpen] = useState(false)
    const [copiedContent, setCopiedContent] = useState(false)
    const [copiedSubject, setCopiedSubject] = useState(false)
    const [copiedRecipient, setCopiedRecipient] = useState(false)

    // Editable content state
    const [editableContent, setEditableContent] = useState(template.content)

    // State to manage displayed recipient
    const [selectedRecipientIndex, setSelectedRecipientIndex] = useState<string>("default")

    // Determine current recipient text
    const currentRecipientText = selectedRecipientIndex === "default"
        ? (template.recipient || "")
        : (template.recipients?.[parseInt(selectedRecipientIndex)]?.content || "")

    const handleCopyContent = async () => {
        try {
            await navigator.clipboard.writeText(editableContent)
            setCopiedContent(true)
            setTimeout(() => setCopiedContent(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const handleCopySubject = async () => {
        if (!template.subject) return
        try {
            await navigator.clipboard.writeText(template.subject)
            setCopiedSubject(true)
            setTimeout(() => setCopiedSubject(false), 2000)
        } catch (err) {
            console.error('Failed to copy subject: ', err)
        }
    }

    const handleCopyRecipient = async () => {
        if (!currentRecipientText) return
        try {
            await navigator.clipboard.writeText(currentRecipientText)
            setCopiedRecipient(true)
            setTimeout(() => setCopiedRecipient(false), 2000)
        } catch (err) {
            console.error('Failed to copy recipient: ', err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all hover:shadow-md border-transparent hover:border-blue-200 dark:hover:border-blue-800 bg-white dark:bg-gray-900 h-full group">
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                            {template.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-2 pl-12">
                            {template.subject ? template.subject : "Clique para visualizar..."}
                        </p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{template.title}</DialogTitle>
                            <DialogDescription>
                                Minuta de ofício pronta a utilizar.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-1 space-y-6 py-4">

                    {/* Recipient Section */}
                    {(template.recipient || (template.recipients && template.recipients.length > 0)) && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                        <Send className="h-3 w-3" /> Destinatário
                                    </span>
                                    {/* Dropdown for multiple recipients */}
                                    {template.recipients && template.recipients.length > 0 && (
                                        <select
                                            className="h-7 text-xs border rounded bg-white dark:bg-slate-900 px-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedRecipientIndex}
                                            onChange={(e) => setSelectedRecipientIndex(e.target.value)}
                                        >
                                            <option value="default">Padrão</option>
                                            {template.recipients.map((item, idx) => (
                                                <option key={idx} value={idx.toString()}>
                                                    {item.label || `Destino ${idx + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <Button onClick={handleCopyRecipient} variant="outline" size="sm" className="h-7 text-xs hover:bg-blue-50 dark:hover:bg-blue-950">
                                    {copiedRecipient ? (
                                        <span className="text-green-600 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> Copiado</span>
                                    ) : (
                                        <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copiar</span>
                                    )}
                                </Button>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono min-h-[50px]">
                                {currentRecipientText}
                            </div>
                        </div>
                    )}

                    {/* Subject Section */}
                    {template.subject && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> Assunto
                                </span>
                                <Button onClick={handleCopySubject} variant="outline" size="sm" className="h-7 text-xs hover:bg-blue-50 dark:hover:bg-blue-950">
                                    {copiedSubject ? (
                                        <span className="text-green-600 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> Copiado</span>
                                    ) : (
                                        <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copiar</span>
                                    )}
                                </Button>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200">
                                {template.subject}
                            </div>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Corpo do Texto (Editável)
                            </span>
                            <Button onClick={handleCopyContent} variant="outline" size="sm" className="h-7 text-xs hover:bg-blue-50 dark:hover:bg-blue-950">
                                {copiedContent ? (
                                    <span className="text-green-600 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> Copiado</span>
                                ) : (
                                    <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copiar</span>
                                )}
                            </Button>
                        </div>
                        <Textarea
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
                            className="min-h-[300px] font-mono text-sm bg-white dark:bg-black border-slate-200 dark:border-slate-800 focus:ring-blue-500"
                            placeholder="Edite o texto aqui antes de copiar..."
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center mt-2 border-t pt-4">
                    <div className="text-xs text-muted-foreground hidden sm:block">
                        {editableContent.length} caracteres
                    </div>
                    <Button onClick={handleCopyContent} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                        {copiedContent ? (
                            <>
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Copiado (Texto)
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar Texto Completo
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

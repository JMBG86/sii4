'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Search, Plus, Phone, Trash2, Loader2, Mail, Building2, Smartphone, Pencil, ChevronLeft, ChevronRight, Copy, CheckCheck } from 'lucide-react'
import { getContacts, addContact, updateContact, deleteContact, getDepartments } from './actions'

// Simple type for Contact
type Contact = {
    id: string
    name: string
    department: string | null
    phone: string | null
    mobile: string | null
    email: string | null
    created_at: string
}

const ITEMS_PER_PAGE = 50

export default function PhonebookPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)

    // Dialogs
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        phone: '',
        mobile: '',
        email: ''
    })
    const [editingId, setEditingId] = useState<string | null>(null)

    // View State
    const [viewingContact, setViewingContact] = useState<Contact | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    // Departments Logic
    const [departments, setDepartments] = useState<string[]>([])

    useEffect(() => {
        fetchData()
        fetchDepartments()
    }, [searchTerm])

    const fetchData = async () => {
        setLoading(true)
        const data = await getContacts(searchTerm)
        setContacts(data || [])
        setCurrentPage(1) // Reset to first page on search
        setLoading(false)
    }

    const fetchDepartments = async () => {
        const deps = await getDepartments()
        if (deps) setDepartments(deps)
    }

    const handleRowClick = (contact: Contact) => {
        setViewingContact(contact)
        setIsViewDialogOpen(true)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const data = new FormData()
        Object.entries(formData).forEach(([key, value]) => data.append(key, value))

        try {
            const res = await addContact(data)
            if (res.error) {
                alert(res.error)
            } else {
                setIsAddDialogOpen(false)
                setFormData({ name: '', department: '', phone: '', mobile: '', email: '' })
                fetchData() // Refresh list
                fetchDepartments() // Refresh departments list in case a new one was added
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditClick = (e: React.MouseEvent, contact: Contact) => {
        e.stopPropagation()
        setEditingId(contact.id)
        setFormData({
            name: contact.name,
            department: contact.department || '',
            phone: contact.phone || '',
            mobile: contact.mobile || '',
            email: contact.email || ''
        })
        setIsEditDialogOpen(true)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingId) return

        setIsSubmitting(true)
        const data = new FormData()
        Object.entries(formData).forEach(([key, value]) => data.append(key, value))

        try {
            const res = await updateContact(editingId, data)
            if (res.error) {
                alert(res.error)
            } else {
                setIsEditDialogOpen(false)
                setEditingId(null)
                setFormData({ name: '', department: '', phone: '', mobile: '', email: '' })
                fetchData()
                fetchDepartments()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('Tem a certeza que deseja eliminar este contacto?')) return

        const res = await deleteContact(id)
        if (res.error) {
            alert(`Erro ao eliminar: ${res.error}`)
        } else {
            fetchData()
            fetchDepartments()
        }
    }

    // Pagination Logic
    const totalPages = Math.ceil(contacts.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const displayedContacts = contacts.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Lista Telefónica</h2>
                <div className="flex items-center space-x-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Contacto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Novo Contacto</DialogTitle>
                                <DialogDescription>
                                    Adicione um novo contacto à lista geral.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddSubmit}>
                                <ContactFormFields formData={formData} setFormData={setFormData} departments={departments} />
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Updates Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Editar Contacto</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEditSubmit}>
                                <ContactFormFields formData={formData} setFormData={setFormData} departments={departments} />
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* View Details Dialog */}
                    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Detalhes do Contacto</DialogTitle>
                            </DialogHeader>
                            {viewingContact && (
                                <div className="grid gap-4 py-4">
                                    <CopyField label="Nome" value={viewingContact.name} />
                                    <CopyField label="Departamento" value={viewingContact.department} icon={<Building2 className="h-4 w-4" />} />
                                    <CopyField label="Telefone" value={viewingContact.phone} icon={<Phone className="h-4 w-4" />} />
                                    <CopyField label="Telemóvel" value={viewingContact.mobile} icon={<Smartphone className="h-4 w-4" />} />
                                    <CopyField label="Email" value={viewingContact.email} icon={<Mail className="h-4 w-4" />} />
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contactos</CardTitle>
                    <CardDescription>
                        Pesquise e consulte contactos da organização ({contacts.length} total).
                    </CardDescription>
                    <div className="relative w-full max-w-sm pt-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground translate-y-2" />
                        <Input
                            placeholder="Pesquisar por nome, departamento ou telefone..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Departamento</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Telemóvel</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedContacts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                Sem resultados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        displayedContacts.map((contact) => (
                                            <TableRow
                                                key={contact.id}
                                                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                                onClick={() => handleRowClick(contact)}
                                            >
                                                <TableCell className="font-medium">{contact.name}</TableCell>
                                                <TableCell>
                                                    {contact.department && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                            <Building2 className="h-3 w-3" />
                                                            {contact.department}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {contact.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            {contact.phone}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {contact.mobile && (
                                                        <div className="flex items-center gap-2">
                                                            <Smartphone className="h-3 w-3 text-muted-foreground" />
                                                            {contact.mobile}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {contact.email && (
                                                        <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 hover:underline text-blue-600">
                                                            <Mail className="h-3 w-3" />
                                                            {contact.email}
                                                        </a>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => handleEditClick(e, contact)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(e, contact.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination Controls */}
                            {contacts.length > ITEMS_PER_PAGE && (
                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Anterior
                                    </Button>
                                    <div className="text-sm font-medium">
                                        Página {currentPage} de {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Próximo
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function ContactFormFields({ formData, setFormData, departments }: { formData: any, setFormData: any, departments: string[] }) {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">Departamento</Label>
                <div className="col-span-3">
                    <Input
                        id="department"
                        list="departments-list"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Selecione ou escreva..."
                    />
                    <datalist id="departments-list">
                        {departments.map((dep, i) => (
                            <option key={i} value={dep} />
                        ))}
                    </datalist>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile" className="text-right">Telemóvel</Label>
                <Input id="mobile" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="col-span-3" />
            </div>
        </div>
    )
}

function CopyField({ label, value, icon }: { label: string, value: string | null, icon?: React.ReactNode }) {
    const [copied, setCopied] = useState(false)

    if (!value) return null

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    {icon}
                    {label}
                </span>
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{value}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8" onClick={handleCopy}>
                {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
            </Button>
        </div>
    )
}

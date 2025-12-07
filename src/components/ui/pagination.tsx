'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    totalItems: number
    itemsPerPage?: number
    currentPage: number
    onPageChange: (page: number) => void
}

export function Pagination({ totalItems, itemsPerPage = 10, currentPage, onPageChange }: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between border-t pt-3 mt-3">
            <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

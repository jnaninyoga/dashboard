
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, Edit, MoreHorizontal, Plus, Trash, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "./category-dialog";
import { archiveClientCategory, deleteClientCategory, restoreClientCategory } from "@/actions/settings"; // Assume these exist now

interface Category {
    id: string;
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: string;
    isArchived: boolean;
}

export function CategoryList({ initialCategories }: { initialCategories: Category[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const activeCategories = initialCategories.filter((c) => !c.isArchived);
    const archivedCategories = initialCategories.filter((c) => c.isArchived);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            await deleteClientCategory(id);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleArchive = async (id: string) => {
        if (!confirm("Are you sure you want to archive this category? It won't be selectable for new clients.")) return;
        await archiveClientCategory(id);
    };
    
    const handleRestore = async (id: string) => {
        await restoreClientCategory(id);
    };

    return (
        <div className="space-y-8">

            <div className="rounded-md border bg-white p-2">
                <Table className="[&_tr]:border-secondary-foreground/10">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Discount Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No active categories.
                                </TableCell>
                            </TableRow>
                        ) : (
                            activeCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="capitalize">{category.discountType}</TableCell>
                                    <TableCell>
                                        {category.discountType === 'percentage' ? `${category.discountValue}%` : `${category.discountValue} MAD`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleArchive(category.id)}>
                                                    <Archive className="mr-2 h-4 w-4" />
                                                    Archive
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(category.id)} className="text-destructive focus:text-destructive">
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {archivedCategories.length > 0 && (
                <div className="opacity-70">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Archived Categories</h3>
                    <div className="rounded-md border bg-white p-2">
                        <Table className="[&_tr]:border-secondary-foreground/10">
                            <TableBody>
                                {archivedCategories.map((category) => (
                                    <TableRow key={category.id} className="bg-muted/50">
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="capitalize">{category.discountType}</TableCell>
                                        <TableCell>
                                            {category.discountType === 'percentage' ? `${category.discountValue}%` : `${category.discountValue} MAD`}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleRestore(category.id)}>
                                                <Undo2 className="mr-2 h-4 w-4" /> Restore
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <CategoryDialog 
                open={isCreateOpen} 
                onOpenChange={setIsCreateOpen} 
            />
            
            {editingCategory && (
                <CategoryDialog 
                    open={!!editingCategory} 
                    onOpenChange={(open) => !open && setEditingCategory(null)}
                    category={editingCategory}
                />
            )}
        </div>
    );
}

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLotSchema, type CreateLotInput } from "@/validators/manufacturing";
import { useCreateLot } from "@/features/manufacturing/hooks/use-manufacturing";

interface CreateLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLotDialog({ open, onOpenChange }: CreateLotDialogProps) {
  const createLot = useCreateLot();

  const form = useForm<CreateLotInput>({
    resolver: zodResolver(createLotSchema),
    mode: "onSubmit",
    defaultValues: { lotNumber: "", remarks: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ lotNumber: "", remarks: "" });
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await createLot.mutateAsync(data);
    form.reset();
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Manufacturing Lot</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lotNumber" required>Lot Number</Label>
            <Input id="lotNumber" {...form.register("lotNumber")} placeholder="e.g. 102" />
            {form.formState.errors.lotNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.lotNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <Textarea id="remarks" {...form.register("remarks")} placeholder="Optional notes" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLot.isPending}>
              {createLot.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

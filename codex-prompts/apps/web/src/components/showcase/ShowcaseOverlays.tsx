'use client';

import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';

export interface OverlayLabels {
  openDialog: string;
  dialogTitle: string;
  dialogBody: string;
  openSheet: string;
  showToast: string;
  toastMessage: string;
  close: string;
}

/** Dialog, sheet and toast triggers (interactive, so a client island). */
export function ShowcaseOverlays({ labels }: { labels: OverlayLabels }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">{labels.openDialog}</Button>
        </DialogTrigger>
        <DialogContent closeLabel={labels.close}>
          <DialogTitle>{labels.dialogTitle}</DialogTitle>
          <DialogDescription>{labels.dialogBody}</DialogDescription>
        </DialogContent>
      </Dialog>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">{labels.openSheet}</Button>
        </SheetTrigger>
        <SheetContent closeLabel={labels.close}>
          <SheetTitle className="text-2xl">{labels.dialogTitle}</SheetTitle>
          <SheetDescription className="text-muted">{labels.dialogBody}</SheetDescription>
        </SheetContent>
      </Sheet>
      <Button
        variant="ghost"
        onClick={() => {
          toast.success(labels.toastMessage);
        }}
      >
        {labels.showToast}
      </Button>
    </div>
  );
}

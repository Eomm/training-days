// frontend/src/components/QuoteModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog.js";
import { Button } from "./ui/button.js";

interface QuoteModalProps {
  quote: string | null;
  onClose: () => void;
}

export function QuoteModal({ quote, onClose }: QuoteModalProps) {
  return (
    <Dialog
      open={quote !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Complete! 🎉</DialogTitle>
          <DialogDescription className="sr-only">
            Motivational quote
          </DialogDescription>
        </DialogHeader>
        <p className="text-lg italic text-center py-4">"{quote}"</p>
        <DialogFooter>
          <Button onClick={onClose}>Keep going!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

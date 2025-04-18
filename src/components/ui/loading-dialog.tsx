import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface LoadingDialogProps {
  open: boolean;
  title?: string;
  description?: string;
}

export function LoadingDialog({ 
  open, 
  title = "Processing", 
  description = "Please wait while we process your request..." 
}: LoadingDialogProps) {
  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className="sm:max-w-[425px] flex flex-col items-center justify-center p-6"
        // Hapus properti hideClose karena tidak didukung
        onInteractOutside={(e) => {
          // Mencegah dialog ditutup saat klik di luar
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Mencegah dialog ditutup saat tekan Escape
          e.preventDefault();
        }}
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-center text-muted-foreground">{description}</p>
      </DialogContent>
    </Dialog>
  );
}
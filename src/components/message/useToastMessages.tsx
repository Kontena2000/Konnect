import { useToast } from "@/hooks/use-toast";

export const useToastMessages = () => {
    const { toast } = useToast();

    const notifyWarn = (message: string) =>
        toast({
            variant: "default",
            title: "Warning",
            description: message,
            duration: 5000,
        });

    const notifySuccess = (message: string) =>
        toast({
            variant: "default",
            title: "Success",
            description: message,
            duration: 5000,
        });

    const notifyInfo = (message: string) =>
        toast({
            variant: "default",
            title: "Info",
            description: message,
            duration: 5000,
        });

    const notifyError = (message: string) =>
        toast({
            variant: "destructive",
            title: "Error",
            description: message,
            duration: 5000,
        });

    return {
        Success: notifySuccess,
        Warn: notifyWarn,
        Info: notifyInfo,
        Errors: notifyError,
    };
};

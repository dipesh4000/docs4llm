import SuccessfulDialog from "@/components/shadcn-studio/blocks/dashboard-dialog-21/dialog-successful";
import { Button } from "@/components/ui/button";

const DialogPage = () => {
  return (
    <div className="flex h-dvh items-start justify-center p-8">
      <SuccessfulDialog
        defaultOpen
        trigger={
          <Button variant="outline">
            <span>Payment </span>
          </Button>
        }
      />
    </div>
  );
};

export default DialogPage;

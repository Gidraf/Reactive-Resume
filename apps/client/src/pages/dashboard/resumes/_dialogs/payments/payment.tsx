import { t } from "@lingui/macro";
import { createResumeSchema, OrderDto } from "@reactive-resume/dto";
import { idSchema } from "@reactive-resume/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@reactive-resume/ui";
import { z } from "zod";

import { openInNewTab } from "@/client/pages/builder/layout";
import { usePrintResumePreview } from "@/client/services/resume";
import { useImportResume } from "@/client/services/resume/import";
import { useDialog } from "@/client/stores/dialog";
import { useResumeStore } from "@/client/stores/resume";

const formSchema = createResumeSchema.extend({ id: idSchema.optional() });

type FormValues = z.infer<typeof formSchema>;

export const PaymentDialog = () => {
  const { printResumePreview, loading } = usePrintResumePreview();
  const { close, isOpen } = useDialog<OrderDto>("payment");
  const { resume } = useResumeStore.getState();

  const { importResume: duplicateResume, loading: duplicateLoading } = useImportResume();

  const onSubmit = async (status: string) => {
    if (status === "sample") {
      const { url } = await printResumePreview({ id: resume.id });
      const result = JSON.parse(url);
      // if (result.url) {
      //   openInNewTab(url);
      //   return;
      // }
      // open("payment");
      if (result.url !== null) {
        openInNewTab(result.url);
      }
    }

    // close();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={close}>
      <AlertDialogContent>
        <form>
          <AlertDialogHeader>
            <AlertDialogTitle>{t`Download Pdf`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t`You are currently using Free Version, Your resume will contain our watermark. Do you want to continue?`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
            <br />
            <AlertDialogAction
              variant="error"
              onClick={async () => {
                await onSubmit("sample");
              }}
            >
              <span>{t`Download Sample`}</span>
            </AlertDialogAction>
            <br />
            <AlertDialogAction
              variant="primary"
              onClick={async () => {
                await onSubmit("checkout");
              }}
            >
              <span>{t`Remove Watermark`}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

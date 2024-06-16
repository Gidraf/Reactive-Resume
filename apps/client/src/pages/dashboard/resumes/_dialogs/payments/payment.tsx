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
  Button,
} from "@reactive-resume/ui";
import { useState } from "react";
import { z } from "zod";

import { openInNewTab } from "@/client/pages/builder/layout";
import { usePrintResumePaid, usePrintResumePreview } from "@/client/services/resume";
import { useDialog } from "@/client/stores/dialog";
import { useResumeStore } from "@/client/stores/resume";

const formSchema = createResumeSchema.extend({ id: idSchema.optional() });

type FormValues = z.infer<typeof formSchema>;

export const getAmount = (template: string): string => {
  const templates = [
    { name: "azurill", price: "240" },
    { name: "bronzor", price: "210" },
    { name: "chikorita", price: "290" },
    { name: "ditto", price: "270" },
    { name: "gengar", price: "230" },
    { name: "glalie", price: "200" },
    { name: "kakuna", price: "200" },
    { name: "leafish", price: "260" },
    { name: "nosepass", price: "300" },
    { name: "onyx", price: "195" },
    { name: "pikachu", price: "205" },
    { name: "rhyhorn", price: "200" },
  ];

  const amount = templates.find((item) => item.name === template);
  return amount?.price ?? "200";
};

export const PaymentDialog = () => {
  const { printResumePreview, loading } = usePrintResumePreview();
  const { printResumePaid } = usePrintResumePaid();
  const { close, isOpen } = useDialog<OrderDto>("payment");
  const { resume } = useResumeStore.getState();
  const [Ispayment, setIsPayment] = useState<boolean>(false);
  const [phonenumber, setPhonenumber] = useState<string>(resume.data.basics.phone);
  const [phonenumberErrors, setPhonenumberErrors] = useState<string>("");
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);

  const amount = getAmount(resume.data.metadata.template);

  const onSubmit = async (status: string) => {
    setLoadingPayment(true);
    if (status === "sample") {
      const { url } = await printResumePreview({ id: resume.id });
      const result = JSON.parse(url);
      // if (result.url) {
      //   openInNewTab(url);
      //   return;
      // }
      // open("payment");
      setLoadingPayment(false);
      if (result.url !== null) {
        openInNewTab(result.url);
      }
    }

    if (status === "checkout") {
      const { data } = await printResumePaid({ id: resume.id, phonenumber: phonenumber });
      setLoadingPayment(false);
      if (data.message) {
        setIsPayment(false);
        close()
      }
    }
    setLoadingPayment(false);

    // close();
  };

  const validateAndFormatSafaricomNumber = (phoneNumber: string) => {
    const safaricomPrefixes = [
      "0112",
      "0113",
      "0114",
      "0115",
      "0701",
      "0702",
      "0703",
      "0704",
      "0705",
      "0706",
      "0707",
      "0708",
      "0709",
      "0710",
      "0711",
      "0712",
      "0713",
      "0714",
      "0715",
      "0716",
      "0717",
      "0718",
      "0719",
      "0720",
      "0721",
      "0722",
      "0723",
      "0724",
      "0725",
      "0726",
      "0727",
      "0728",
      "0729",
      "0741",
      "0742",
      "0743",
      "0745",
      "0746",
      "0748",
      "0757",
      "0758",
      "0759",
      "0768",
      "0769",
      "0790",
      "0791",
      "0792",
      "0793",
      "0794",
      "0795",
      "0796",
      "0797",
      "0798",
      "0799",
    ];

    setPhonenumber(phoneNumber);

    // Check if the phone number contains only digits
    if (!/^\d+$/.test(phoneNumber)) {
      setPhonenumberErrors(t`Phone number should contain only digits`);
      return;
    }

    // Check if the phone number starts with '0' or '254'
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.slice(1);
      setPhonenumber(phoneNumber);
      setPhonenumberErrors("");
    }

    if (phoneNumber.startsWith("2540")) {
      setPhonenumber(phoneNumber);
      phoneNumber = "254" + phoneNumber.slice(4);
      setPhonenumber(phoneNumber);
      setPhonenumberErrors("");
      return;
    }

    // Check if the phone number starts with the country code '254'
    if (!phoneNumber.startsWith("254")) {
      setPhonenumberErrors(t`Phone number should start with '0' or '254'`);
      return;
    }

    // Check if the length of the phone number is 12 digits after formatting
    if (phoneNumber.length !== 12) {
      setPhonenumberErrors(t`Phone number should be 12 digits long`);
      return;
    }

    // Extract the prefix after '254'
    const prefix = phoneNumber.slice(3, 6);

    console.log(prefix);

    // Check if the prefix is in the list of valid Safaricom prefixes
    if (!safaricomPrefixes.includes(`0${prefix}`)) {
      setPhonenumberErrors(t`Invalid M-Pesa number`);
      return;
    }

    setPhonenumberErrors("");
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <form>
          <AlertDialogHeader>
            <AlertDialogTitle>{t`Download Pdf`}</AlertDialogTitle>
            <AlertDialogDescription
              className={Ispayment && phonenumberErrors ? "text-red-500" : ""}
            >
              {Ispayment &&
                !phonenumberErrors &&
                t`Enter your Mpesa Number and click Checkout to Purchase this Resume`}
              {!Ispayment &&
                t`You are currently using Free Version, Your resume will contain our watermark. Do you want to continue?`}
              {Ispayment && phonenumberErrors && phonenumberErrors}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {Ispayment && (
            <div className="flex">
              <input
                className={`mr-1 w-full text-[black] ${phonenumberErrors ? "border border-red-500" : ""}`}
                type="tel"
                placeholder={t`Enter Your Mpesa Number`}
                value={phonenumber}
                onChange={(e) => {
                  validateAndFormatSafaricomNumber(e.target.value);
                }}
              />
              <Button
                variant={"success"}
                disabled={loadingPayment}
                className="pointer-cursor p-6"
                onClick={async (e) => {
                  e.preventDefault();
                  await onSubmit("checkout");
                }}
              >
                {loadingPayment ? t`Loading` : t`Checkout`}
              </Button>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsPayment(false);
                close();
              }}
            >{t`Cancel`}</AlertDialogCancel>
            <br />
            <AlertDialogAction
              variant="error"
              onClick={async () => {
                await onSubmit("sample");
                setIsPayment(false);
                close();
              }}
            >
              <span>{t`Download Sample`}</span>
            </AlertDialogAction>
            <br />
            {!Ispayment && (
              <AlertDialogAction
                variant="primary"
                onClick={() => {
                  setIsPayment(true);
                  // await onSubmit("checkout");
                }}
              >
                <span>{t`Remove Watermark Kes ${amount}`}</span>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

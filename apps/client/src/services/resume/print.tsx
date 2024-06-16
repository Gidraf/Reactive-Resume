import { t } from "@lingui/macro";
import { UrlDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";

import { toast } from "@/client/hooks/use-toast";
import { axios } from "@/client/libs/axios";

export const printResume = async (data: { id: string }) => {
  const response = await axios.get<UrlDto>(`/resume/print/${data.id}`);

  return response.data;
};

export const printResumePreview = async (data: { id: string }) => {
  const response = await axios.get<UrlDto>(`/resume/print/${data.id}?preview=true`);

  return response.data;
};

export const printResumePaid = async (data: { id: string; phonenumber: string }) => {
  const response = await axios.post<{ data: { message: string } }>(
    `/resume/print/checkout/${data.id}`,
    {
      phonenumber: data.phonenumber,
    },
  );
  return response.data;
};

export const usePrintResume = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: printResumeFn,
  } = useMutation({
    mutationFn: printResume,
    onError: (error) => {
      const message = error.message;

      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description: message,
      });
    },
  });

  return { printResume: printResumeFn, loading, error };
};

export const usePrintResumePreview = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: printResumePreviewFn,
  } = useMutation({
    mutationFn: printResumePreview,
    onError: (error) => {
      const message = error.message;

      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description: message,
      });
    },
  });

  return { printResumePreview, printResumePreviewFn, loading, error };
};

export const usePrintResumePaid = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: printResumePaidFn,
  } = useMutation({
    mutationFn: printResumePaid,
    onError: (error) => {
      const message = error.message;

      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description: message,
      });
    },
  });

  return { printResumePaid, printResumePaidFn, loading, error };
};

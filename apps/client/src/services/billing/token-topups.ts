/* eslint-disable lingui/text-restrictions */

import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { axios } from "@/client/libs/axios";

export const tokenTopup = async ({
  amount,
  phoneNumber,
}: {
  amount: string;
  phoneNumber: string;
}) => {
  const response = await axios.post<string, AxiosResponse<string>, unknown>(
    "/billing/token-top-up",
    { amount, phoneNumber },
  );

  return response.data;
};

export const useTokenTopup = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: tokenTopupFn,
  } = useMutation({
    mutationFn: tokenTopup,
    onSuccess: (data) => {
      return data;
    },
  });

  return { tokenTopup: tokenTopupFn, loading, error };
};

export const getTokenTopups = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await axios.get<string, AxiosResponse, unknown>(`/billing/token-top-ups`);

  return response.data;
};

export const useGetTokenTopups = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: getTokenTopupsFn,
  } = useMutation({
    mutationFn: getTokenTopups,
    onSuccess: (data) => {
      return data;
    },
  });

  return { getTokenTopups: getTokenTopupsFn, loading, error };
};

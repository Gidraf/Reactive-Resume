/* eslint-disable lingui/text-restrictions */

import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { axios } from "@/client/libs/axios";

export const getTokenTopupUsages = async (topupId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await axios.get<string, AxiosResponse<any>, unknown>(
    `/billing/token-top-ups/usages/${topupId}`,
  );

  return response.data;
};

export const useGetTokenTopupUsages = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: getTokenTopupUsagesFn,
  } = useMutation({
    mutationFn: getTokenTopupUsages,
    onSuccess: (data) => {
      return data;
    },
  });

  return { getTokenTopupUsages: getTokenTopupUsagesFn, loading, error };
};

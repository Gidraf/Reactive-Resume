/* eslint-disable lingui/text-restrictions */

import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { axios } from "@/client/libs/axios";

export const improveWriting = async ({
  text,
  item_id,
  item_type,
}: {
  text: string;
  item_id: string;
  item_type: string;
}) => {
  const response = await axios.post<string, AxiosResponse<string>, unknown>(
    "/agent/improve-writing",
    { text, item_id, item_type },
  );

  return response.data;
};

export const useImproveWriting = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: improveWritingFn,
  } = useMutation({
    mutationFn: improveWriting,
    onSuccess: (data) => {
      return data;
    },
  });

  return { improveWriting: improveWritingFn, loading, error };
};

export const getAccountBalance = async () => {
  const response = await axios.get<
    { text: string; resumeId: string },
    AxiosResponse<string>,
    unknown
  >(`/billing/account-balance`);

  return response.data;
};

export const useGetAccountBalance = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: getAccountBalanceFn,
  } = useMutation({
    mutationFn: getAccountBalance,
    onSuccess: (data) => {
      return data;
    },
  });

  return { getAccountBalance: getAccountBalanceFn, loading, error };
};

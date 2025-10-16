/* eslint-disable lingui/text-restrictions */

import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { axios } from "@/client/libs/axios";

export const revampToInfographic = async ({
  text,
  item_id,
  item_type,
}: {
  text: string;
  item_id: string;
  item_type: string;
}) => {
  const response = await axios.post<string, AxiosResponse<string>, unknown>("/agent/infographics", {
    text,
    item_id,
    item_type,
  });

  return response.data;
};

export const useRevampToInfographic = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: revampToInfographicFn,
  } = useMutation({
    mutationFn: revampToInfographic,
    onSuccess: (data) => {
      return data;
    },
  });

  return { revampToInfographic: revampToInfographicFn, loading, error };
};

export const matchJobDescription = async ({
  text,
  resumeId,
  item_id,
  item_type,
}: {
  text: string;
  resumeId: string;
  item_id: string;
  item_type: string;
}) => {
  const response = await axios.post<
    { text: string; resumeId: string },
    AxiosResponse<string>,
    unknown
  >(`/agent/match-jd?resumeId=${resumeId}`, { text, item_id, item_type });

  return response.data;
};

export const useMatchJobDescription = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: matchJobDescriptionFn,
  } = useMutation({
    mutationFn: matchJobDescription,
    onSuccess: (data) => {
      return data;
    },
  });

  return { matchJobDescription: matchJobDescriptionFn, loading, error };
};

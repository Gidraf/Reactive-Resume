import { AuthResponseDto, LoginDto, WaLoginDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useNavigate } from "react-router-dom";

import { axios } from "@/client/libs/axios";
import { queryClient } from "@/client/libs/query-client";
import { useAuthStore } from "@/client/stores/auth";

export const loginWa = async (data: WaLoginDto) => {
  const response = await axios.post<AuthResponseDto, AxiosResponse<AuthResponseDto>, WaLoginDto>(
    "/auth/loginwa",
    data,
  );

  return response.data;
};

export const useLoginWa = () => {
  const setUser = useAuthStore((state) => state.setUser);

  const {
    error,
    isPending: loading,
    mutateAsync: loginFnWa,
  } = useMutation({
    mutationFn: loginWa,
    onSuccess: (data) => {

      setUser(data.user);
      queryClient.setQueryData(["user"], data.user);
    },
  });

  return { loginWa: loginFnWa, loading, error };
};

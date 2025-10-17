import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { ArrowRight } from "@phosphor-icons/react";
import { loginSchema } from "@reactive-resume/dto";
import { usePasswordToggle } from "@reactive-resume/hooks";
import { Button } from "@reactive-resume/ui";
import { useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import type { z } from "zod";

import { useLogin } from "@/client/services/auth";
import { useFeatureFlags } from "@/client/services/feature";

type FormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login, loading } = useLogin();
  const { flags } = useFeatureFlags();

  const formRef = useRef<HTMLFormElement>(null);
  usePasswordToggle(formRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data);
    } catch {
      form.reset();
    }
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>
          {t`Sign in to your account`} - {t`CVpap`}
        </title>
      </Helmet>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">{t`Sign in to your account`}</h2>
        <h6>
          <span className="opacity-75">{t`You have been logout?`}</span>
          <Button asChild variant="link" className="px-1.5">
            <Link to="/auth/register">
              {t({
                message: "Use The link we sent to you on your Whatsapp or Email to Login Again",
              })}{" "}
              <ArrowRight className="ml-1" />
            </Link>
          </Button>
        </h6>
      </div>
    </div>
  );
};

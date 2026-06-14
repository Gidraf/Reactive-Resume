import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { ArrowRight } from "@phosphor-icons/react";
import { loginSchema } from "@reactive-resume/dto";
import { usePasswordToggle } from "@reactive-resume/hooks";
import { Button } from "@reactive-resume/ui";
import { useRef, useState } from "react";
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

  const [phone, setPhone] = useState(() => {
    const match = document.cookie.match(/(?:^|; )demo_whatsapp_number=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : "";
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    document.cookie = `demo_whatsapp_number=${encodeURIComponent(value)}; path=/; max-age=31536000`;
  };

  const handleDemoLogin = async (email: string) => {
    try {
      await login({
        identifier: email,
        password: "DemoPass123!",
      });
    } catch (err) {
      console.error("Demo login failed:", err);
    }
  };

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
            <Link to="">
              {t({
                message: "Use The link we sent to you on your Whatsapp or Email to Login",
              })}{" "}
              <ArrowRight className="ml-1" />
            </Link>
          </Button>
        </h6>
      </div>

      <hr className="opacity-20 my-6" />

      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-md transition-all duration-300 hover:shadow-lg">
        <div className="space-y-1">
          <h3 className="text-lg font-medium tracking-tight text-card-foreground">{t`Demo workspaces`}</h3>
          <p className="text-sm text-muted-foreground opacity-80">
            {t`Select a pre-configured demo account to test automation workflows.`}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-90 block">
            {t`Your WhatsApp Number (For receiving replies)`}
          </label>
          <input
            type="text"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="e.g. 254712345678"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDemoLogin("housing@demo.com")}
            className="flex items-center justify-start gap-2 h-12 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            <span className="text-lg">🏠</span>
            <span className="text-sm font-medium">{t`Housing Demo`}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleDemoLogin("church@demo.com")}
            className="flex items-center justify-start gap-2 h-12 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            <span className="text-lg">⛪</span>
            <span className="text-sm font-medium">{t`Church Demo`}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleDemoLogin("school@demo.com")}
            className="flex items-center justify-start gap-2 h-12 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            <span className="text-lg">🏫</span>
            <span className="text-sm font-medium">{t`School Demo`}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleDemoLogin("arcade@demo.com")}
            className="flex items-center justify-start gap-2 h-12 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            <span className="text-lg">🎮</span>
            <span className="text-sm font-medium">{t`Arcade Demo`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router";

import { useLogin } from "@/client/services/auth";

import { ContributorsSection } from "./sections/contributors";
import { FAQSection } from "./sections/faq";
import { FeaturesSection } from "./sections/features";
import { HeroSection } from "./sections/hero";
import { LogoCloudSection } from "./sections/logo-cloud";
import { SupportSection } from "./sections/support";
import { TemplatesSection } from "./sections/templates";
import { TestimonialsSection } from "./sections/testimonials";

export const HomePage = () => {
  const { i18n } = useLingui();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useLogin();

  useEffect(() => {
    const loginUser = async () => {
      const params = new URLSearchParams(location.search);
      const creds = params.get("creds");

      if (creds) {
        try {
          const decoded = atob(creds);
          const credentials = JSON.parse(decoded);
          if (credentials.username && credentials.passkey) {
            // Submit form automatically
            await login({
              identifier: credentials.username,
              password: credentials.passkey,
            });
            console.log(credentials);
            void navigate(`/builder/${credentials.slug}`);
          }
        } catch (error) {
          console.error("Failed to decode creds:", error);
        }
      }
    };
    void loginUser();
  }, [location.search]);

  return (
    <main className="relative isolate bg-background">
      <Helmet prioritizeSeoTags>
        <html lang={i18n.locale} />

        <title>
          {t`Reactive Resume`} - {t`A free and open-source resume builder`}
        </title>

        <meta
          name="description"
          content="A free and open-source resume builder that simplifies the process of creating, updating, and sharing your resume."
        />
      </Helmet>

      <HeroSection />
      <LogoCloudSection />
      <FeaturesSection />
      <TemplatesSection />
      <TestimonialsSection />
      <SupportSection />
      <FAQSection />
      <ContributorsSection />
    </main>
  );
};

import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { useLoginWa } from "@/client/services/auth/waLogin";

import { ContributorsSection } from "./sections/contributors";
import { FAQSection } from "./sections/faq";
import { FeaturesSection } from "./sections/features";
import { HeroSection } from "./sections/hero";
import { LogoCloudSection } from "./sections/logo-cloud";
import { StatisticsSection } from "./sections/statistics";
import { SupportSection } from "./sections/support";
import { TemplatesSection } from "./sections/templates";
import { TestimonialsSection } from "./sections/testimonials";

export const HomePage = () => {
  const { i18n } = useLingui();
  const { loginWa, loading } = useLoginWa();

  useEffect(() => {
    const login = async () => {
      await loginWa({
        identifier: "254791186712@s.whatsapp.net",
        password: "kk",
        userId: "clwnu9nhi0000usulyicrl989",
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    login().then().catch();
  }, []);

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
      <StatisticsSection />
      <FeaturesSection />
      <TemplatesSection />
      <TestimonialsSection />
      <SupportSection />
      <FAQSection />
      <ContributorsSection />
    </main>
  );
};

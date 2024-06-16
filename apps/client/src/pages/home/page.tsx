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
    
  }, []);

  return (
    <main className="relative isolate bg-background">
      <Helmet prioritizeSeoTags>
        <html lang={i18n.locale} />

        <title>
          {t`CVpap`} - {t`Transform Your CV instantly`}
        </title>

        <meta name={t`description`} content={t`Transform Your CV/Resume Instantly`} />
      </Helmet>

      <HeroSection />
    
      <TemplatesSection />
   
    
    </main>
  );
};

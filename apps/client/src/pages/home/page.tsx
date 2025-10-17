import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router";

import { useLogin } from "@/client/services/auth";

import { HeroSection } from "./sections/hero";

export const HomePage = () => {
  const { i18n } = useLingui();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useLogin();
  const [showHero, setShowHero] = useState(false);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loginUser = async () => {
      const params = new URLSearchParams(location.search);
      const creds = params.get("creds");
       const step = params.get("step");
      if (creds) {
        try {
          const decoded = atob(creds);
          const credentials = JSON.parse(decoded);
          if (credentials.username && credentials.passkey) {
            await login({
              identifier: credentials.username,
              password: credentials.passkey,
            });
            if (step === "build") {
              void navigate(`/builder/${credentials.slug}`);
            }
            if (step === "topup") {
              void navigate(`/dashboard/billing`);
            }
          }
        } catch (error) {
          console.error("Failed to decode creds:", error);
        }
      }
    };
    void loginUser();
  }, [location.search]);

  useEffect(() => {
    // GSAP intro animation
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        setShowHero(true);
      },
    });

    tl.fromTo(
      welcomeRef.current,
      { opacity: 0, scale: 0.8, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 1.2 },
    ).to(welcomeRef.current, { opacity: 0, y: -40, duration: 0.8, delay: 1.5 });

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    if (showHero && heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" },
      );
    }
  }, [showHero]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background">
      <Helmet prioritizeSeoTags>
        <html lang={i18n.locale} />
        <title>
          {t`CVpap`} - {t`Upgrade your CV/Resume for Free`}
        </title>
        <meta name="description" content="Upgrade Your CV/Resume for Free" />
      </Helmet>

      {/* Welcome Screen */}
      <div
        ref={welcomeRef}
        className="absolute inset-0 z-50 flex items-center justify-center bg-background text-4xl font-bold text-primary"
      >
        <span className="tracking-wide">{t`Welcome to CVPAP`}</span>
      </div>

      {/* Hero Section (appears after animation) */}
      {showHero && (
        <div ref={heroRef}>
          <HeroSection />
        </div>
      )}
    </main>
  );
};

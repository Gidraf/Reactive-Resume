import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import { patchNestJsSwagger } from "nestjs-zod";
import puppeteer, { type Browser } from "puppeteer"; // 👈 Puppeteer import

import { AppModule } from "./app.module";
import type { Config } from "./config/schema";
// 👇 Export global browser instance
export let browser: Browser;

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === "development" ? ["debug"] : ["error", "warn", "log"],
  });

  const configService = app.get(ConfigService<Config>);

  const accessTokenSecret = configService.getOrThrow("ACCESS_TOKEN_SECRET");
  const publicUrl = configService.getOrThrow("PUBLIC_URL");
  const isHTTPS = publicUrl.startsWith("https://") ?? false;

  // Cookie Parser
  app.use(cookieParser());

  // Session
  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: accessTokenSecret,
      cookie: { httpOnly: true, secure: isHTTPS },
    }),
  );

  // CORS
  app.enableCors({ credentials: true, origin: isHTTPS });

  // Helmet - enabled only in production
  if (isHTTPS) app.use(helmet({ contentSecurityPolicy: false }));

  // Global Prefix
  const globalPrefix = "api";
  app.setGlobalPrefix(globalPrefix);

  // Enable Shutdown Hooks
  app.enableShutdownHooks();

  // Swagger (OpenAPI Docs)
  const config = new DocumentBuilder()
    .setTitle("Reactive Resume")
    .setDescription(
      "Reactive Resume is a free and open source resume builder that's built to make the mundane tasks of creating, updating and sharing your resume as easy as 1, 2, 3.",
    )
    .addCookieAuth("Authentication", { type: "http", in: "cookie", scheme: "Bearer" })
    .setVersion("4.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  // Port
  const port = configService.get<number>("PORT") ?? 3000;

  // 👇 Start Puppeteer browser
  Logger.log("🚀 Launching Puppeteer browser instance...", "Bootstrap");
  browser = await puppeteer.launch({
    headless: true, // Use headless "new" mode for Puppeteer >=19
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for Docker/root
  });
  Logger.log("🎭 Puppeteer browser launched successfully", "Bootstrap");

  // Close browser gracefully on shutdown
  app.getHttpAdapter().getInstance().on("close", async () => {
    Logger.log("🛑 Closing Puppeteer browser...", "Bootstrap");
    await browser.close();
    Logger.log("✅ Puppeteer browser closed", "Bootstrap");
  });

  await app.listen(port);

  Logger.log(`🚀 Server is up and running on port ${port}`, "Bootstrap");
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void bootstrap();

import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ResumeDto } from "@reactive-resume/dto";
import { ErrorMessage } from "@reactive-resume/utils";
import retry from "async-retry";
import { PDFDocument } from "pdf-lib";
import { connect } from "puppeteer";

import { Config } from "../config/schema";
import { StorageService } from "../storage/storage.service";
import {browser} from "apps/server/src/main"
import { PrismaService } from "nestjs-prisma";

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);

  private readonly browserURL: string;

  private readonly ignoreHTTPSErrors: boolean;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly storageService: StorageService,
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
  ) {
    const chromeUrl = this.configService.getOrThrow<string>("CHROME_URL");
    const chromeToken = this.configService.getOrThrow<string>("CHROME_TOKEN");

    this.browserURL = `${chromeUrl}?token=${chromeToken}`;
    this.ignoreHTTPSErrors = this.configService.getOrThrow<boolean>("CHROME_IGNORE_HTTPS_ERRORS");
  }

  private async getBrowser() {
    try {
      return await connect({
        browserWSEndpoint: this.browserURL,
        acceptInsecureCerts: this.ignoreHTTPSErrors,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        ErrorMessage.InvalidBrowserConnection,
        (error as Error).message,
      );
    }
  }

  async getVersion() {
    // const browser = await this.getBrowser();
    const version = await browser.version();
    await browser.disconnect();
    return version;
  }

  async printResume(resume: ResumeDto, isDraft: boolean) {
    const start = performance.now();

    const url = await retry<string | undefined>(() => this.generateResume(resume, isDraft), {
      retries: 3,
      randomize: true,
      onRetry: (_, attempt) => {
        this.logger.log(`Retrying to print resume #${resume.id}, attempt #${attempt}`);
      },
    });

    const duration = Number(performance.now() - start).toFixed(0);
    const numberPages = resume.data.metadata.layout.length;

    this.logger.debug(`Chrome took ${duration}ms to print ${numberPages} page(s)`);

    return url;
  }

  async printPreview(resume: ResumeDto) {
    const start = performance.now();

    const url = await retry(() => this.generatePreview(resume), {
      retries: 3,
      randomize: true,
      onRetry: (_, attempt) => {
        this.logger.log(
          `Retrying to generate preview of resume #${resume.id}, attempt #${attempt}`,
        );
      },
    });

    const duration = Number(performance.now() - start).toFixed(0);

    this.logger.debug(`Chrome took ${duration}ms to generate preview`);

    return url;
  }

async generateResume(resume: ResumeDto, isDraft: boolean) {
  try {
    const page = await browser.newPage();
    const whatsappUser = await this.prismaService.whatsappUser.findFirst({
      where: { id: resume.user?.whatsappUserId },
    });

    const partner = whatsappUser
      ? await this.prismaService.partner.findFirst({
          where: { partner_id: whatsappUser.partner_id! },
        })
      : null;

      const settings = whatsappUser
      ? await this.prismaService.settings.findFirst({
          where: { partner_id: whatsappUser.partner_id! },
        })
      : null;

    const business_name = settings?.business_name ?? "Ajiriwa";
    const business_phone = partner?.phone ?? "+254735143282";
    const business_email = partner?.email ?? "user@ajiriwa.com";

    const publicUrl = this.configService.getOrThrow<string>("PUBLIC_URL");
    const url = publicUrl;

    const numberPages = resume.data.metadata.layout.length;

    await page.evaluateOnNewDocument((data) => {
      window.localStorage.setItem("resume", JSON.stringify(data));
    }, resume.data);

    await page.goto(`${url}/artboard/preview`, { waitUntil: "networkidle0" });

    const pagesBuffer: Buffer[] = [];

    const processPage = async (index: number) => {
      const pageElement = await page.$(`[data-page="${index}"]`);
      if (!pageElement) {
        throw new Error(`Page element with data-page="${index}" not found`);
      }

      const width = await page.evaluate((el) => el.scrollWidth, pageElement);
      const height = await page.evaluate((el) => el.scrollHeight, pageElement);

      // ✅ One evaluate handles everything
      const temporaryHtml = await page.evaluate(
        (element: HTMLDivElement, css: { visible: boolean; value: string }, draft: boolean, info: { business_name: string; business_phone: string; business_email: string }) => {
          const clonedElement = element.cloneNode(true) as HTMLDivElement;
          const previousHtml = document.body;
          document.body.innerHTML = clonedElement.outerHTML;

          // apply CSS if visible
          if (css.visible) {
            const styleTag = document.createElement("style");
            styleTag.textContent = css.value;
            document.head.append(styleTag);
          }

          // add watermark if draft
          if (draft) {
            const watermark = document.createElement("div");
            watermark.innerHTML = `
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-25deg);
                font-size: 6rem;
                font-weight: 700;
                opacity: 0.3; /* 30% visibility */
                color: #444;
                white-space: pre-line;
                text-align: center;
                border-radius: 1rem;
                padding: 2rem 4rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                pointer-events: none; 
              ">
                📇 ${info.business_name}\n
                📱 ${info.business_phone}\n
                📧 ${info.business_email}
              </div>
            `;
            previousHtml.appendChild(watermark);
          }

          return previousHtml.innerHTML;
        },
        pageElement,
        resume.data.metadata.css,
        isDraft,
        { business_name, business_phone, business_email },
      );

      const pdfBuffer = await page.pdf({
        width,
        height,
        printBackground: true,
      });

      pagesBuffer.push(pdfBuffer as Buffer);

      // ✅ Restore original HTML in one call
      await page.evaluate((previousHtml: string) => {
        document.body.innerHTML = previousHtml;
      }, temporaryHtml);
    };

    for (let index = 1; index <= numberPages; index++) {
      await processPage(index);
    }

    // ✅ Merge into final PDF
    const pdf = await PDFDocument.create();
    for (const pageBuffer of pagesBuffer) {
      const loadedPdf = await PDFDocument.load(pageBuffer);
      const [copiedPage] = await pdf.copyPages(loadedPdf, [0]);
      pdf.addPage(copiedPage);
    }

    const finalPdfBuffer = Buffer.from(await pdf.save());

    // ✅ Upload
    const resumeUrl = await this.storageService.uploadObject(
      resume.userId,
      "resumes",
      finalPdfBuffer,
      resume.title,
    );

    await page.close();
    return resumeUrl;
  } catch (error) {
    this.logger.error(error);
    throw new InternalServerErrorException(
      ErrorMessage.ResumePrinterError,
      (error as Error).message,
    );
  }
}

  async generatePreview(resume: ResumeDto) {
    // const browser = await this.getBrowser();
    const page = await browser.newPage();

    const publicUrl = this.configService.getOrThrow<string>("PUBLIC_URL");
    const storageUrl = this.configService.getOrThrow<string>("STORAGE_URL");
    let url = publicUrl;

    if ([publicUrl, storageUrl].some((url) => /https?:\/\/localhost(:\d+)?/.test(url))) {
      // Switch client URL from `http[s]://localhost[:port]` to `http[s]://host.docker.internal[:port]` in development
      // This is required because the browser is running in a container and the client is running on the host machine.
      url = url.replace(/localhost(:\d+)?/, (_match, port) => `host.docker.internal${port ?? ""}`);

      await page.setRequestInterception(true);

      // Intercept requests of `localhost` to `host.docker.internal` in development
      // page.on("request", (request) => {
      //   if (request.url().startsWith(storageUrl)) {
      //     const modifiedUrl = request
      //       .url()
      //       .replace(/localhost(:\d+)?/, (_match, port) => `host.docker.internal${port ?? ""}`);

      //     void request.continue({ url: modifiedUrl });
      //   } else {
      //     void request.continue();
      //   }
      // });
    }

    // Set the data of the resume to be printed in the browser's session storage
    await page.evaluateOnNewDocument((data) => {
      window.localStorage.setItem("resume", JSON.stringify(data));
    }, resume.data);

    await page.setViewport({ width: 794, height: 1123 });

    await page.goto(`${url}/artboard/preview`, { waitUntil: "networkidle0" });

    // Save the JPEG to storage and return the URL
    // Store the URL in cache for future requests, under the previously generated hash digest
    const uint8array = await page.screenshot({ quality: 80, type: "jpeg" });
    const buffer = Buffer.from(uint8array);

    // Generate a hash digest of the resume data, this hash will be used to check if the resume has been updated
    const previewUrl = await this.storageService.uploadObject(
      resume.userId,
      "previews",
      buffer,
      resume.id,
    );

    // Close all the pages and disconnect from the browser
    await page.close();
    await browser.disconnect();

    return previewUrl;
  }
}

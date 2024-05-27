import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import fontkit from "@pdf-lib/fontkit";
import { ResumeDto } from "@reactive-resume/dto";
import { ErrorMessage, getFontUrls } from "@reactive-resume/utils";
import retry from "async-retry";
import { PDFDocument } from "pdf-lib";
import { connect } from "puppeteer";

import { Config } from "../config/schema";
import { OrderService } from "../order/order.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);

  private readonly browserURL: string;

  private readonly ignoreHTTPSErrors: boolean;

  private readonly webUrl: string;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly storageService: StorageService,
    private readonly httpService: HttpService,
    private readonly orderService: OrderService,
  ) {
    const chromeUrl = this.configService.getOrThrow<string>("CHROME_URL");
    const _webUrl = process.env.WEB_URL ?? "";
    const chromeToken = this.configService.getOrThrow<string>("CHROME_TOKEN");

    this.webUrl = _webUrl;

    this.browserURL = `${chromeUrl}?token=${chromeToken}`;
    this.ignoreHTTPSErrors = this.configService.getOrThrow<boolean>("CHROME_IGNORE_HTTPS_ERRORS");
  }

  private async getBrowser() {
    try {
      return await connect({
        browserWSEndpoint: this.browserURL,
        ignoreHTTPSErrors: this.ignoreHTTPSErrors,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        ErrorMessage.InvalidBrowserConnection,
        (error as Error).message,
      );
    }
  }

  async getVersion() {
    const browser = await this.getBrowser();
    const version = await browser.version();
    await browser.disconnect();
    return version;
  }

  async printResume(resume: ResumeDto, preview?: boolean) {
    const start = performance.now();
    const order = await this.orderService.findOne(resume.id);
    console.log(preview);
    if (!order && !preview) {
      const publicUrl = JSON.stringify({
        message: "No payment found for this resume,kindly pay KSh 50 in order to buy your resume.",
        status: "412",
        url: null,
      });
      return publicUrl;
    }
    const url = await retry<string | undefined>(() => this.generateResume(resume, order === null), {
      retries: 3,
      randomize: true,
      onRetry: (_, attempt) => {
        this.logger.log(`Retrying to print resume #${resume.id}, attempt #${attempt}`);
      },
    });

    const duration = Number(performance.now() - start).toFixed(0);
    const numberPages = resume.data.metadata.layout.length;

    this.logger.debug(`Chrome took ${duration}ms to print ${numberPages} page(s)`);

    const publicUrl = JSON.stringify({
      message: "Your Request is Successfully",
      status: "200",
      url: url,
    });
    return publicUrl;
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

  async generateResume(resume: ResumeDto, preview: unknown) {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      const publicUrl = this.configService.getOrThrow<string>("PUBLIC_URL");
      const storageUrl = this.configService.getOrThrow<string>("STORAGE_URL");

      let url = publicUrl;

      if ([publicUrl, storageUrl].some((url) => url.includes("localhost"))) {
        // Switch client URL from `localhost` to `host.docker.internal` in development
        // This is required because the browser is running in a container and the client is running on the host machine.
        url = url.replace("localhost", "host.docker.internal");

        await page.setRequestInterception(true);

        // Intercept requests of `localhost` to `host.docker.internal` in development
        page.on("request", (request) => {
          if (request.url().startsWith(storageUrl)) {
            const modifiedUrl = request.url().replace("localhost", `host.docker.internal`);

            void request.continue({ url: modifiedUrl });
          } else {
            void request.continue();
          }
        });
      }

      console.log(preview);

      const checkoutUrl = `${this.webUrl}/checkout?userId=${resume.userId}&resumeId=${resume.id}&phone=`;
      const amount = "50";
      // Set the data of the resume to be printed in the browser's session storage
      const numberPages = resume.data.metadata.layout.length;

      await page.evaluateOnNewDocument((data) => {
        window.localStorage.setItem("resume", JSON.stringify(data));
      }, resume.data);

      await page.goto(`${url}/artboard/preview`, { waitUntil: "networkidle0" });

      const pagesBuffer: Buffer[] = [];

      const processPage = async (index: number) => {
        const pageElement = await page.$(`[data-page="${index}"]`);
        // eslint-disable-next-line unicorn/no-await-expression-member
        const width = (await (await pageElement?.getProperty("scrollWidth"))?.jsonValue()) ?? 0;
        // eslint-disable-next-line unicorn/no-await-expression-member
        const height = (await (await pageElement?.getProperty("scrollHeight"))?.jsonValue()) ?? 0;

        const temporaryHtml = await page.evaluate((element: HTMLDivElement) => {
          const clonedElement = element.cloneNode(true) as HTMLDivElement;
          const temporaryHtml_ = document.body.innerHTML;
          document.body.innerHTML = clonedElement.outerHTML;
          return temporaryHtml_;
        }, pageElement);

        pagesBuffer.push(await page.pdf({ width, height, printBackground: true }));

        await page.evaluate(
          (temporaryHtml_: string, preview: boolean, checkoutUrl: string, amount: string) => {
            document.body.innerHTML = temporaryHtml_;
            if (preview) {
              const use = "username";
              // Logger.log(use);
              const selector = "body";
              const newDiv = document.createElement("div");
              // const newStart = document.createElement('div');
              // const newEnd = document.createElement('div');
              newDiv.innerHTML = `<div style='
                  background: #fffffff3;
                  color: #064c04cf;
                  border-radius: 5px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-direction: column;
                  text-align: center;
                  font-size: 50px;
                  z-index: 99999999;
                  pointer-events: all;
                  position: fixed;
                  width: 800px;
                  height: 60vh;
                  left: 50%;  /* Horizontally center the div */
                  top: 50%;   /* Vertically center the div */
                  transform: translate(-50%, -50%); /* Move the div back by half its width and height */
              '>
               <h3>CVPAP Free Sample</h3><hr/>
               <br/>
               <br/>
               <a href="${checkoutUrl}"><h5 style="text-decoration: underline;">Click Here To Purchase</h5></a>
               <br/><br/>
               <a href="${checkoutUrl}"><h5>Remove This Watermark</h5></a>
               <br/>
               <a href="${checkoutUrl}"><h5>@ Kes ${amount}/=</h5></a>
                 <small style="font-size: 10px;">
                     Glab Tech Services
                 </small>
               </div>
               `;

              const currentDiv = document.querySelector(selector);
              if (currentDiv) {
                currentDiv.prepend(newDiv);
              }
              // currentDiv.prepend(newStart);
              // currentDiv.prepend(newEnd);
            }
          },
          temporaryHtml,
          preview,
          checkoutUrl,
          amount,
        );
      };

      // Loop through all the pages and print them, by first displaying them, printing the PDF and then hiding them back
      for (let index = 1; index <= numberPages; index++) {
        await processPage(index);
      }

      // Using 'pdf-lib', merge all the pages from their buffers into a single PDF
      const pdf = await PDFDocument.create();
      pdf.registerFontkit(fontkit);

      // Get information about fonts used in the resume from the metadata
      const fontData = resume.data.metadata.typography.font;
      const fontUrls = getFontUrls(fontData.family, fontData.variants);

      // Load all the fonts from the URLs using HttpService
      const responses = await Promise.all(
        fontUrls.map((url) =>
          this.httpService.axiosRef.get(url, {
            responseType: "arraybuffer",
          }),
        ),
      );
      const fontsBuffer = responses.map((response) => response.data as ArrayBuffer);

      // Embed all the fonts in the PDF
      await Promise.all(fontsBuffer.map((buffer) => pdf.embedFont(buffer)));

      for (const element of pagesBuffer) {
        const page = await PDFDocument.load(element);
        const [copiedPage] = await pdf.copyPages(page, [0]);
        pdf.addPage(copiedPage);
      }

      // Save the PDF to storage and return the URL to download the resume
      // Store the URL in cache for future requests, under the previously generated hash digest
      const buffer = Buffer.from(await pdf.save());

      // This step will also save the resume URL in cache
      const resumeUrl = await this.storageService.uploadObject(
        resume.userId,
        "resumes",
        buffer,
        resume.title,
      );

      // Close all the pages and disconnect from the browser
      await page.close();
      await browser.disconnect();

      return resumeUrl;
    } catch (error) {
      console.trace(error);
    }
  }

  async generatePreview(resume: ResumeDto) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const publicUrl = this.configService.getOrThrow<string>("PUBLIC_URL");
    const storageUrl = this.configService.getOrThrow<string>("STORAGE_URL");

    let url = publicUrl;

    if ([publicUrl, storageUrl].some((url) => url.includes("localhost"))) {
      // Switch client URL from `localhost` to `host.docker.internal` in development
      // This is required because the browser is running in a container and the client is running on the host machine.
      url = url.replace("localhost", "host.docker.internal");

      await page.setRequestInterception(true);

      // Intercept requests of `localhost` to `host.docker.internal` in development
      page.on("request", (request) => {
        if (request.url().startsWith(storageUrl)) {
          const modifiedUrl = request.url().replace("localhost", `host.docker.internal`);

          void request.continue({ url: modifiedUrl });
        } else {
          void request.continue();
        }
      });
    }

    // Set the data of the resume to be printed in the browser's session storage
    await page.evaluateOnNewDocument((data) => {
      window.localStorage.setItem("resume", JSON.stringify(data));
    }, resume.data);

    await page.setViewport({ width: 794, height: 1123 });

    await page.goto(`${url}/artboard/preview`, { waitUntil: "networkidle0" });

    // Save the JPEG to storage and return the URL
    // Store the URL in cache for future requests, under the previously generated hash digest
    const buffer = await page.screenshot({ quality: 80, type: "jpeg" });

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

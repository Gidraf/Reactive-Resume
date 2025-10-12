import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User } from "@prisma/client";
import { AIServices } from "@reactive-resume/utils";
import { Langfuse } from "langfuse";
import { PrismaService } from "nestjs-prisma";
import { OpenAI } from "openai";

import { BillingService } from "../billing/billing.service";

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly openai = new OpenAI();
  private readonly langfuse: Langfuse;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {
    this.langfuse = new Langfuse({
      publicKey: this.configService.get<string>("LANGFUSE_PUBLIC_KEY"),
      secretKey: this.configService.get<string>("LANGFUSE_SECRET_KEY"),
      baseUrl: this.configService.get<string>("LANGFUSE_HOST"),
    });
  }

  extractText(obj: unknown): string {
    let text = "";

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Add both key and value if they are strings
      if (typeof key === "string") text += key + "\n";
      if (typeof value === "string") text += value + "\n";

      // If the value is another object, recurse
      if (typeof value === "object" && value !== null) {
        text += this.extractText(value);
      }
    }

    return text.trim();
  }

  async improveWriting(
    text: string,
    user: User,
    item_type: string,
    item_id: string,
  ): Promise<string | undefined> {
    try {
      const balance = await this.billingService.getAccountBalance(user.id);
      let aiItem = null;
      if (item_type === "ats") {
        aiItem = AIServices.ats.find((item) => item.id === item_id);
      }
      if (
        balance &&
        typeof balance.balance?.toNumber === "function" &&
        typeof aiItem?.token_price === "number" &&
        balance.balance.toNumber() >= aiItem.token_price
      ) {
        const whatsappUser = await this.prisma.whatsappUser.findFirst({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          where: { id: user.whatsappUserId! },
        });
        // 🔹 Fetch prompt from Langfuse
        const trace = this.langfuse.trace({
          name: item_id,
          input: this.extractText(text),
          sessionId: user.id,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          userId: whatsappUser?.partner_id!,
          metadata: { inputLength: text.length },
        });
        const promptSpan = trace.span({ name: "fetchPrompt" });
        const promptTemplate = await this.langfuse.getPrompt(aiItem.prompt_name, undefined, {
          label: "latest",
        });
        const prompt = promptTemplate.compile({ input: text });
        promptSpan.end();

        // 🔹 Generate using OpenAI
        const result = await this.openai.chat.completions.create({
          model: "gpt-4o-mini", // or "gpt-4-turbo" / "gpt-3.5-turbo" if needed
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: this.extractText(text) },
          ],
          temperature: 0,
          max_tokens: 1024,
          stop: ['"""'],
        });

        const output = result.choices[0]?.message?.content ?? text;
        trace.update({ input: prompt, output });
        // await generationSpan.end();

        // 🔹 Compute score (your metric logic)
        const score = this.computeScore(text, output);
        trace.score({ name: aiItem.name, value: score });

        // 🔹 Record generation details
        trace.update({
          name: `${aiItem.name}Output`,
          input: prompt,
          output,
          sessionId: user.id,
          userId: whatsappUser?.partner_id,
          metadata: { inputLength: text.length, outputLength: output.length, score },
        });

        await this.billingService.createUsageRecord({ user_id: user.id, item_id, item_type });

        // await trace.end();
        return output;
      }
    } catch (error) {
      // await trace.end({ error });
      this.logger.error("improveWriting failed", error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async matchJobDescription(
    text: string,
    user: User,
    resumeId: string,
    item_type: string,
    item_id: string,
  ): Promise<string | undefined> {
    try {
      const balance = await this.billingService.getAccountBalance(user.id);
      let aiItem = null;
      if (item_type === "ats") {
        aiItem = AIServices.ats.find((item) => item.id === item_id);
      }
      if (
        balance &&
        typeof balance.balance?.toNumber === "function" &&
        typeof aiItem?.token_price === "number" &&
        balance.balance.toNumber() >= aiItem.token_price
      ) {
        const whatsappUser = await this.prisma.whatsappUser.findFirst({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          where: { id: user.whatsappUserId! },
        });
        // 🔹 Fetch prompt from Langfuse
        const trace = this.langfuse.trace({
          name: aiItem.name,
          input: this.extractText(text),
          sessionId: user.id,
          userId: whatsappUser?.partner_id,
          metadata: { inputLength: text.length },
        });
        const promptSpan = trace.span({ name: "fetchPrompt" });
        const promptTemplate = await this.langfuse.getPrompt(aiItem.prompt_name, undefined, {
          label: "latest",
        });
        const jd = await this.prisma.cVJDTextData.findFirst({ where: { resumeId: resumeId } });
        const prompt = promptTemplate.compile({
          input: this.extractText(text),
          jd: jd?.jd_text ?? "",
        });
        promptSpan.end();

        // 🔹 Generate using OpenAI
        const result = await this.openai.chat.completions.create({
          model: "gpt-4o-mini", // or "gpt-4-turbo" / "gpt-3.5-turbo" if needed
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: this.extractText(text) },
          ],
          temperature: 0,
          max_tokens: 1024,
          stop: ['"""'],
        });

        const output = result.choices[0]?.message?.content ?? text;
        trace.update({ input: prompt, output });
        // await generationSpan.end();

        // 🔹 Compute score (your metric logic)
        const score = this.computeScore(text, output);
        trace.score({ name: aiItem.name, value: score });

        // 🔹 Record generation details
        trace.update({
          name: `${aiItem.name}Output`,
          input: prompt,
          output,
          sessionId: user.id,
          userId: whatsappUser?.partner_id,
          metadata: { inputLength: text.length, outputLength: output.length, score },
        });
        await this.billingService.createUsageRecord({ user_id: user.id, item_id, item_type });
        // await trace.end();
        return output;
      }
    } catch (error) {
      // await trace.end({ error });
      this.logger.error("matchJobDescription failed", error);
      throw new InternalServerErrorException(error.message);
    }
  }

  private computeScore(input: string, output: string): number {
    const inLen = input.length || 1;
    const outLen = output.length;
    return Math.min(1, outLen / inLen); // simple ratio example
  }
}

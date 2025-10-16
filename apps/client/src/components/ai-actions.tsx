/* eslint-disable @typescript-eslint/no-explicit-any */
import { t } from "@lingui/macro";
import {
  CashRegister,
  // CaretDown,
  // ChatTeardropText,
  CircleNotch,
  Exam,
  MagicWand,
  PenNib,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  // DropdownMenu,
  // DropdownMenuContent,
  // DropdownMenuItem,
  // DropdownMenuTrigger,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { useCallback, useEffect, useState } from "react";

import { toast } from "../hooks/use-toast";
import { useGetAccountBalance } from "../services/billing/account-balance";
import { useImproveWriting, useMatchJobDescription } from "../services/openai/improve-writing";
import { useResumeStore } from "../stores/resume";

type Action = "improve/fix" | "visualize" | "matchjd";
export type Mood = "bargraph" | "progressbar" | "piechart" | "image";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export const AiActions = ({ value, onChange, className }: Props) => {
  const [loading, setLoading] = useState<Action | false>(false);
  const { improveWriting, loading: improveLoading } = useImproveWriting();
  const { matchJobDescription, loading: matchJobLoading } = useMatchJobDescription();
  const resume = useResumeStore((state) => state.resume);
  const [balance, setBalance] = useState<any>({ balance: 0 });
  const { getAccountBalance } = useGetAccountBalance();
  // const aiEnabled =  true //useOpenAiStore((state) => !!state.apiKey);

  // if (!aiEnabled) return null;
  const fetchBalance = useCallback(async () => {
    const data = await getAccountBalance();
    setBalance((data as any).balance ?? 0);
  }, [getAccountBalance]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const onClick = async (action: Action) => {
    try {
      setLoading(action);

      let result = value;

      if (action === "improve/fix")
        result = await improveWriting({ text: value, item_id: "improve/fix", item_type: "ats" });
      // if (action === "visualize") result = await fixGrammar(value);
      if (action === "matchjd")
        result = await matchJobDescription({
          text: value,
          resumeId: resume.id,
          item_id: "matchjd",
          item_type: "ats",
        });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (result !== undefined && result !== "") {
        onChange(result);
        await fetchBalance();
      }
    } catch (error) {
      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative mt-4 rounded bg-secondary-accent/50 p-3 outline outline-secondary-accent",
        "flex flex-wrap items-center justify-center gap-2",
        className,
      )}
    >
      <div className="absolute -left-5 z-10">
        <Badge
          outline
          variant="primary"
          className="-rotate-90 bg-background px-2 text-[10px] leading-[10px]"
        >
          <MagicWand size={10} className="mr-1" />
          {t`AI`}
        </Badge>
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        onClick={() => onClick("improve/fix")}
      >
        {loading === "improve/fix" ? <CircleNotch className="animate-spin" /> : <PenNib />}
        <span className="ml-2 text-xs">{t`Improve & Fix Writing`}</span>
        <small className="ml-2">{t`5 tokens`}</small>
      </Button>

      <Button size="sm" variant="outline" disabled={!!loading} onClick={() => onClick("matchjd")}>
        {loading === "matchjd" ? <CircleNotch className="animate-spin" /> : <Exam />}
        <span className="ml-2 text-xs">{t`Match Job Description`}</span>{" "}
        <small className="ml-2">{t`15 tokens`}</small>
      </Button>
      {/* TODO  Add visualization in future*/}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={!!loading}>
            {loading === "visualize" ? (
              <CircleNotch className="animate-spin" />
            ) : (
              <ChatTeardropText />
            )}
            <span className="mx-2 text-xs">{t`Visualize`}</span>
            <CaretDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onClick("visualize", "bargraph")}>
            <span role="img" aria-label={t`Add Bar Graph`}>
              📊
            </span>
            <span className="ml-2">{t`Bar Graph`}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onClick("visualize", "progressbar")}>
            <span role="img" aria-label={t`Progress Bar`}>
              ⭕
            </span>
            <span className="ml-2">{t`Progress Bar`}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onClick("visualize", "piechart")}>
            <span role="img" aria-label={t`Pie Chart`}>
              ◔
            </span>
            <span className="ml-2">{t`Pie Chart`}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onClick("visualize", "image")}>
            <span role="img" aria-label={t`Add Image`}>
              🖼️
            </span>
            <span className="ml-2">{t`Add Image`}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
      <div className="absolute -right-5 z-10">
        <Badge
          outline
          variant="primary"
          className="-rotate-90 bg-background px-2 text-[10px] leading-[10px]"
        >
          <CashRegister size={10} className="mr-1" />
          {t`Balance ${balance}`}
        </Badge>
      </div>
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import { t } from "@lingui/macro";
import { CaretDown, CashRegister, CircleNotch, Hurricane, MagicWand } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@reactive-resume/ui";
import { AIServices, cn } from "@reactive-resume/utils";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { toast } from "../hooks/use-toast";
import { useGetAccountBalance } from "../services/billing/account-balance";
import { useRevampToInfographic } from "../services/openai/fix-grammar";
import { useImproveWriting, useMatchJobDescription } from "../services/openai/improve-writing";
import { useResumeStore } from "../stores/resume";

export type RevampType = "visualize" | "ats";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export const AiActions = ({ value, onChange, className }: Props) => {
  const [loading, setLoading] = useState<string | false>(false);
  const { improveWriting, loading: improveLoading } = useImproveWriting();
  const { matchJobDescription, loading: matchJobLoading } = useMatchJobDescription();
  const { revampToInfographic, loading: infographicLoading } = useRevampToInfographic();
  const resume = useResumeStore((state) => state.resume);
  const [balanceError, setBalanceError] = useState(false);
  const [balance, setBalance] = useState<any>(0);
  const { getAccountBalance } = useGetAccountBalance();
  const navigate = useNavigate();
  // const aiEnabled =  true //useOpenAiStore((state) => !!state.apiKey);

  // if (!aiEnabled) return null;
  const fetchBalance = useCallback(async () => {
    const data = await getAccountBalance();
    setBalance((data as any).balance ?? 0);
  }, [getAccountBalance]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const onClick = async (
    action: string,
    revampType: RevampType,
    item: {
      name: string;
      id: string;
      description: string;
      token_price: number;
      prompt_name: string;
    },
  ) => {
    try {
      setLoading(action);

      let result = value;
      if (balance >= item.token_price) {
        if (revampType === "ats") {
          if (action === "improve/fix")
            result = await improveWriting({ text: value, item_id: item.id, item_type: "ats" });

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
        }
        if (revampType === "visualize") {
          result = await revampToInfographic({
            text: value,
            item_id: item.id,
            item_type: "visualize",
          });
        }
      } else {
        setBalanceError(true);
        toast({
          variant: "error",
          title: t`Insufficient Balance`,
          description: t`You don't have enough tokens to use this feature. Click the Top Up button to recharge your account.`,
        });
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={!!loading}>
            {loading === "improve/fix" || loading === "matchjd" ? (
              <CircleNotch className="animate-spin" />
            ) : (
              <MagicWand color="green" />
            )}
            <span className="mx-2 text-xs">{t`ATS Compliant Options`}</span>
            <CaretDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {AIServices.ats.map((ats) => (
            <DropdownMenuItem key={ats.id} onClick={() => onClick(ats.id, "ats", ats)}>
              <Hurricane size={12} />
              <span className="ml-2">
                {ats.name}
                <small>
                  ({ats.token_price}
                  {t`Tokens`})
                </small>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* TODO  Add visualization in future*/}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={!!loading}>
            {loading === "bargraph" || loading === "progressbar" || loading === "piechart" ? (
              <CircleNotch className="animate-spin" />
            ) : (
              <PresentationChart size={12} />
            )}
            <span className="mx-2 text-xs">{t`Add Infographics`}</span>
            <CaretDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {AIServices.visualize.map((vis) => (
            <DropdownMenuItem key={vis.id} onClick={() => onClick("bargraph", "visualize", vis)}>
              {vis.id === "bargraph" ? <ChartBar size={12} /> : null}
              {vis.id === "progressbar" ? <SpinnerBall size={12} /> : null}
              {vis.id === "piechart" ? <ChartPieSlice size={12} /> : null}
              <span className="ml-2">{t`Bar Graph `}</span>{" "}
              <small>
                {vis.token_price}
                {t` token`}
              </small>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu> */}
      <div className="absolute -right-5 z-10">
        <Badge
          outline
          variant={balanceError ? "warning" : "primary"}
          className="-rotate-90 cursor-pointer bg-background px-2 text-[10px] leading-[10px]"
          onClick={() => {
            void navigate("/dashboard/billing");
          }}
        >
          <CashRegister size={10} className="mr-1" />
          {balanceError ? t`Top Up` : t`Balance ${balance}`}
        </Badge>
      </div>
    </div>
  );
};

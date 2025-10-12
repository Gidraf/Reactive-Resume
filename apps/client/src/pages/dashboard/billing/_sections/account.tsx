/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-nested-ternary */
/* eslint-disable tailwindcss/no-custom-classname */
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import type { UpdateUserDto } from "@reactive-resume/dto";
import { updateUserSchema } from "@reactive-resume/dto";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@reactive-resume/ui";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useToast } from "@/client/hooks/use-toast";
import { useGetAccountBalance } from "@/client/services/billing/account-balance";
import { useGetTokenTopups, useTokenTopup } from "@/client/services/billing/token-topups";
import { useGetTokenTopupUsages } from "@/client/services/billing/usages-records";
import { useUploadImage } from "@/client/services/storage";
import { useUpdateUser, useUser } from "@/client/services/user";

const formatKES = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Math.max(0, value));

type TopUp = {
  id: string;
  token_value?: number;
  tokenValue?: number;
  new_balance?: number;
  top_up_type?: string;
  topUpType?: string;
  description?: string;
  desc?: string;
  timestamp?: string;
  created_at?: string;
  date?: string;
  amount?: number;
  currency?: string;
};

type Usage = {
  id: string;
  item_name?: string;
  name?: string;
  usage_type?: string;
  type?: string;
  token_quantity?: number;
  previous_balance?: number | string;
  new_balance?: number | string;
  timestamp?: string;
};

export const AccountSettings = (): React.JSX.Element => {
  const { user } = useUser();
  const { toast } = useToast();
  const { updateUser } = useUpdateUser();
  const [balance, setBalance] = useState<any>({ balance: "0" });
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const { uploadImage } = useUploadImage();
  const { getAccountBalance } = useGetAccountBalance();
  const { getTokenTopups } = useGetTokenTopups();
  const { getTokenTopupUsages } = useGetTokenTopupUsages();
  const { tokenTopup, loading: tokenTopupLoading } = useTokenTopup();

  // usages cache and loading state per topup
  const [usagesMap, setUsagesMap] = useState<Record<string, Usage[]>>({});
  const [usagesLoadingMap, setUsagesLoadingMap] = useState<Record<string, boolean>>({});
  const [expandedTopUpId, setExpandedTopUpId] = useState<string | null>(null);

  // Main account form
  const form = useForm<UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      picture: "",
      name: "",
      username: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        picture: user.picture,
        name: user.name,
        username: user.username,
        email: user.email,
      });
    }
    // only run on user change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const loadBalance = async (): Promise<void> => {
      try {
        const resp = await getAccountBalance();
        setBalance(resp);
      } catch {
        // silent or toast if preferred
      }
    };
    void loadBalance();
  }, [getAccountBalance]);

  useEffect(() => {
    const loadTopups = async (): Promise<void> => {
      try {
        const resp = await getTokenTopups();
        const list =
          resp?.top_ups ?? resp?.topUps ?? (Array.isArray(resp) ? resp : (resp?.data ?? []));
        setTopUps(list ?? []);
      } catch (error: unknown) {
        const message = (error as Error).message;
        toast({ variant: "error", title: t`Failed to fetch top ups`, description: message });
      }
    };
    void loadTopups();
  }, [getTokenTopups, toast]);

  const fetchTokenTopupUsages = async (tokenTopUpId: string): Promise<void> => {
    // if (usagesMap[tokenTopUpId]) return;

    try {
      setUsagesLoadingMap((s) => ({ ...s, [tokenTopUpId]: true }));
      const resp = await getTokenTopupUsages(tokenTopUpId);
      const usages =
        resp?.usages ?? resp?.data?.usages ?? (Array.isArray(resp) ? resp : (resp?.data ?? []));
      setUsagesMap((s) => ({ ...s, [tokenTopUpId]: usages ?? [] }));
    } catch (error: unknown) {
      const message = (error as Error).message;
      toast({ variant: "error", title: t`Failed to fetch usages`, description: message });
      setUsagesMap((s) => ({ ...s, [tokenTopUpId]: [] }));
    } finally {
      setUsagesLoadingMap((s) => ({ ...s, [tokenTopUpId]: false }));
    }
  };

  const onSelectImage = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const response = await uploadImage(file);
    const url = response.data;
    await updateUser({ picture: url });
  };

  // --- Token balance and top-up logic ---
  const KES_PER_TOKEN = 2;

  // Single top-up form with amount and phone number
  const topUpForm = useForm<{ amount: number; phonenumber: string }>({
    defaultValues: { amount: 5, phonenumber: "" },
  });

  const { watch, setError, clearErrors } = topUpForm;
  const watchedAmount = watch("amount");
  const watchedPhone = watch("phonenumber");

  const conversionText = useMemo(() => {
    const amountVal = Number(watchedAmount) || 0;
    const kesValue = amountVal * KES_PER_TOKEN;
    const _formatKES = formatKES(kesValue);
    return t`${amountVal} = ${_formatKES} (1 Kes = ${KES_PER_TOKEN} token)`;
  }, [watchedAmount]);

  const handleTopUpSubmit = async (values: { amount: number; phonenumber: string }) => {
    const amount = Number(values.amount || 0);
    const phone = (values.phonenumber || "").trim();

    if (!amount || amount < 5) {
      setError("amount", { type: "min", message: t`Top up must be at least Kes 5.` });
      return;
    }

    if (amount % 5 !== 0) {
      setError("amount", {
        type: "multiple",
        message: t`Please enter a value that's a multiple of 5.`,
      });
      return;
    }

    if (!phone) {
      setError("phonenumber", { type: "required", message: t`Phone number is required.` });
      return;
    }

    // basic phone validation: at least 6 characters (adjust to your validation rules)
    if (phone.length < 6) {
      setError("phonenumber", { type: "pattern", message: t`Enter a valid phone number.` });
      return;
    }

    clearErrors("amount");
    clearErrors("phonenumber");

    try {
      // call the hook-provided topup function
      // tokenTopup is expected to be an async function: tokenTopup({ amount, phoneNumber })
      if (typeof tokenTopup !== "function") {
        throw new TypeError(t`Topup function not available`);
      }

      await tokenTopup({ amount: amount.toString(), phoneNumber: phone });

      toast({
        variant: "success",
        title: t`Top up requested`,
        description: t`Your top-up request was submitted. Check your phone to complete the payment.`,
      });

      topUpForm.reset({ amount: 5, phonenumber: "" });
    } catch (error: unknown) {
      const message = (error as Error).message;
      toast({
        variant: "error",
        title: t`Top up failed`,
        description: t`Something went wrong while topping up.`,
      });
    }
  };

  const toggleExpand = async (topUpId: string): Promise<void> => {
    const isExpanding = expandedTopUpId !== topUpId;
    setExpandedTopUpId(isExpanding ? topUpId : null);
    if (isExpanding) {
      await fetchTokenTopupUsages(topUpId);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold leading-relaxed tracking-tight">{t`Account`}</h3>
        <p className="leading-relaxed opacity-75">
          {t`Here is the update of your usage information and account balance`}
        </p>
      </div>

      {/* Token Balance Card */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-background p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium opacity-75">{t`Token balance`}</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {Number.parseInt(balance.balance ?? "0", 10).toLocaleString()} {t`tokens`}
              </p>
              <p className="mt-1 text-xs opacity-70">
                {t`Use tokens to improve your resume content and also to make it ats compliant.`}
              </p>
            </div>

            <div className="w-full text-right sm:w-auto">
              <div className="inline-flex items-center gap-2 rounded-md border border-dashed px-3 py-1.5">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-80"
                >
                  <path
                    d="M12 1v22"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div className="text-right">
                  <div className="text-xs opacity-70">{t`Estimated value`}</div>
                  <div className="text-sm font-medium">
                    {Number.parseInt(balance.balance ?? "0", 10) / KES_PER_TOKEN} {t`Requests`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top-up Form */}
        <div className="sm:col-span-2">
          <Form {...topUpForm}>
            <form
              className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3"
              onSubmit={topUpForm.handleSubmit(handleTopUpSubmit)}
            >
              <div className="space-y-2 sm:col-span-2">
                <FormField
                  name="amount"
                  control={topUpForm.control}
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel>{t`Top up amount`}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={5}
                          step={5}
                          value={field.value ?? ""}
                          placeholder="5"
                          className="w-full"
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            field.onChange(e.target.value ? v : "");
                          }}
                        />
                      </FormControl>
                      <FormDescription className="mt-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-xs opacity-80">{t`Amount must be a multiple of 5`}</div>
                          <div className="text-xs font-medium">{conversionText}</div>
                        </div>
                      </FormDescription>
                      <FormMessage />
                      {error?.message && (
                        <div className="text-destructive mt-1 text-xs">{error.message}</div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  name="phonenumber"
                  control={topUpForm.control}
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel>{t`Mpesa Number`}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          value={field.value}
                          placeholder="2547xxxxxxxx"
                          className="w-full"
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\s+/g, "");
                            // Debounce logic
                            // clearTimeout((window as any)._phoneDebounce);
                            // (window as any)._phoneDebounce = setTimeout(() => {
                            // Only digits allowed
                            if (!/^\d*$/.test(raw)) {
                              topUpForm.setError("phonenumber", {
                                type: "pattern",
                                message: t`Only digits are allowed.`,
                              });
                              field.onChange(raw);
                              return;
                            }

                            let value = raw;
                            if (value.startsWith("0")) {
                              value = "254" + value.slice(1);
                            }
                            if (!value.startsWith("254")) {
                              topUpForm.setError("phonenumber", {
                                type: "pattern",
                                message: t`Phone number must start with 254.`,
                              });
                            } else if (value.length === 12) {
                              topUpForm.clearErrors("phonenumber");
                            } else {
                              topUpForm.setError("phonenumber", {
                                type: "length",
                                message: t`Phone number must be 12 digits.`,
                              });
                            }
                            field.onChange(value);
                            // }, 300);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="mt-1">
                        <div className="text-xs opacity-80">{t`We'll send a prompt to this number to complete the payment.`}</div>
                      </FormDescription>
                      <FormMessage />
                      {error?.message && (
                        <div className="text-destructive mt-1 text-xs">{error.message}</div>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button className="-mt-2" type="submit" disabled={tokenTopupLoading}>
                  {tokenTopupLoading ? t`Processing...` : t`Top up`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    topUpForm.reset({ amount: 5, phonenumber: "" });
                  }}
                >
                  {t`Reset`}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Expandable Top-ups List */}
        <div className="mt-2 sm:col-span-2">
          <div className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">{t`Top-ups`}</h4>
              <div className="text-xs opacity-70">
                {topUps.length} {t`records`}
              </div>
            </div>

            {topUps.length === 0 ? (
              <div className="py-6 text-center text-xs opacity-70">{t`No top-ups yet.`}</div>
            ) : (
              <div className="divide-y">
                {topUps.map((topUp) => {
                  const id = topUp.id;
                  const isExpanded = expandedTopUpId === id;
                  const usages = usagesMap[id] ?? [];
                  const isLoading = usagesLoadingMap[id] ?? false;

                  return (
                    <div key={id} className="py-3">
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3">
                            <div className="text-sm font-medium">
                              {topUp.token_value ?? topUp.tokenValue ?? topUp.new_balance ?? t`-`}{" "}
                              {t`tokens`}
                            </div>
                            <div className="text-xs opacity-60">
                              • {topUp.top_up_type ?? topUp.topUpType ?? t`-`}
                            </div>
                          </div>
                          <div className="mt-1 text-xs opacity-70">
                            {topUp.description ?? topUp.desc ?? ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs opacity-80">
                            <div>
                              {formatDate(topUp.timestamp ?? topUp.created_at ?? topUp.date)}
                            </div>
                            <div className="font-medium">
                              {formatKES(Number(topUp.amount ?? 0))} {topUp.currency ?? "KES"}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="hover:bg-muted inline-flex items-center gap-1 rounded px-2 py-1"
                            onClick={() => void toggleExpand(id)}
                          >
                            {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                            <span className="text-xs">{isExpanded ? t`Hide` : t`Show usages`}</span>
                          </button>
                        </div>
                      </div>

                      {/* expanded content */}
                      {isExpanded && (
                        <div className="mt-3 pl-0 sm:pl-4">
                          {isLoading ? (
                            <div className="text-xs opacity-70">{t`Loading usages...`}</div>
                          ) : usages.length === 0 ? (
                            <div className="text-xs opacity-70">{t`No usages for this top-up.`}</div>
                          ) : (
                            <div className="space-y-2">
                              {usages.map((u) => (
                                <div key={u.id} className="bg-muted/40 rounded border px-3 py-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-medium">
                                        {u.item_name ?? u.name ?? t`-`}
                                      </div>
                                      <div className="text-xs opacity-70">
                                        {u.usage_type ?? u.type ?? "—"} · {u.token_quantity}{" "}
                                        {t`tokens`}
                                      </div>
                                    </div>
                                    <div className="text-right text-xs opacity-80">
                                      <div>
                                        {u.previous_balance} →{" "}
                                        <span className="font-medium">{u.new_balance}</span>
                                      </div>
                                      <div className="mt-1">{formatDate(u.timestamp)}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

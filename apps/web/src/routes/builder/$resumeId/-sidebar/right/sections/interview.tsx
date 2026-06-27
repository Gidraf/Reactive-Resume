import { ChatCircleTextIcon, CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { Route } from "../../../../route";
import { SectionBase as RightSectionBase } from "../shared/section-base";

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

type InterviewQuestion = {
	question: string;
	category: string;
	difficulty?: string;
};

type InterviewQuestionsResponse = {
	questions: InterviewQuestion[];
	generated_at?: string;
};

function groupByCategory(questions: InterviewQuestion[]): Record<string, InterviewQuestion[]> {
	return questions.reduce<Record<string, InterviewQuestion[]>>((acc, q) => {
		const cat = q.category ?? "General";
		if (!acc[cat]) acc[cat] = [];
		acc[cat].push(q);
		return acc;
	}, {});
}

export function InterviewSectionBuilder() {
	const { resumeId } = Route.useParams();
	const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fetched, setFetched] = useState(false);

	const fetchQuestions = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${CVPAP_API}/api/v1/resumes/${resumeId}/interview-questions`);
			if (!res.ok) throw new Error(`Server ${res.status}`);
			const data = (await res.json()) as InterviewQuestionsResponse;
			setQuestions(data.questions ?? []);
			setFetched(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load questions");
		} finally {
			setLoading(false);
		}
	}, [resumeId]);

	useEffect(() => {
		void fetchQuestions();
	}, [fetchQuestions]);

	const grouped = groupByCategory(questions);

	return (
		<RightSectionBase type="interview">
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-xs">
						{questions.length > 0
							? `${questions.length} questions generated for this CV`
							: fetched
								? "No questions yet — generate after your CV is revamped."
								: "Load interview questions for this CV."}
					</p>
					<Button
						size="sm"
						variant="outline"
						className="h-6 gap-1 px-2 text-xs"
						disabled={loading}
						onClick={fetchQuestions}
					>
						{loading ? <CircleNotchIcon className="size-3 animate-spin" /> : <ChatCircleTextIcon className="size-3" />}
						{loading ? "Loading…" : "Refresh"}
					</Button>
				</div>

				{error && (
					<div className="flex items-center gap-1.5 text-destructive text-xs">
						<WarningCircleIcon className="size-3.5 shrink-0" />
						{error}
					</div>
				)}

				{questions.length > 0 && (
					<ScrollArea className="max-h-[400px]">
						<div className="space-y-4 pr-1">
							{Object.entries(grouped).map(([category, qs]) => (
								<div key={category} className="space-y-1.5">
									<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">{category}</h3>
									<ol className="list-none space-y-2">
										{qs.map((q, i) => (
											<li key={i} className="rounded-md border bg-card p-2.5 text-sm leading-snug">
												<span className="mr-1.5 font-medium text-muted-foreground text-xs">{i + 1}.</span>
												{q.question}
												{q.difficulty && (
													<span
														className={`ml-2 rounded-full px-1.5 py-0.5 font-medium text-xs ${
															q.difficulty === "hard"
																? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
																: q.difficulty === "medium"
																	? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
																	: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
														}`}
													>
														{q.difficulty}
													</span>
												)}
											</li>
										))}
									</ol>
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</div>
		</RightSectionBase>
	);
}

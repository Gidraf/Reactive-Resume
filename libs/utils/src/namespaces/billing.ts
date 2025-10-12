export const AIServices = {
  ats: [
    {
      name: "Improve Writing",
      id: "improve/fix",
      description:
        "Improve and fix grammar, spelling, and overall writing quality. making it ats-friendly.",
      token_price: 5, // 1 token per request
      prompt_name: "ImproveWritingsPrompt",
    },
    {
      name: "match Job Description",
      id: "matchjd",
      description:
        "Match your resume to a specific job description, highlighting relevant skills and experiences. Optimize your resume for ATS and increase your chances of getting noticed.",
      token_price: 15, // 3 tokens per request,
      prompt_name: "MatchJDPrompt",
    },
  ],
};

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
      name: "Match JD (ATS)",
      id: "matchjd",
      description:
        "Match your resume to a specific job description, highlighting relevant skills and experiences. Optimize your resume for ATS and increase your chances of getting noticed.",
      token_price: 15, // 3 tokens per request,
      prompt_name: "MatchJDPrompt",
    },
  ],

  visualize: [
    {
      name: "Bar graph",
      id: "bargraph",
      description:
        "Upgrade your resume from a standard ATS format to a visually stunning infographic by adding bar graph visualizations. It's the perfect way to highlight your achievements and skills with data-driven visuals — especially effective when you're giving your resume directly to a recruiter or during in-person interviews",
      token_price: 30, // 1 token per request
      prompt_name: "InfographicBarGraphPrompt",
    },
    {
      name: "Progress Bar",
      id: "progressbar",
      description:
        "Add progress bar visualizations to your resume to showcase your skills with clarity and style. Transform your traditional ATS resume into an engaging infographic that highlights your strengths and expertise levels at a glance — ideal when sharing your resume directly with a recruiter or during in-person presentations.",
      token_price: 25, // 3 tokens per request,
      prompt_name: "InfographicPieChartPrompt",
    },
    {
      name: "Pie Chart",
      id: "piechart",
      description:
        "Add progress bar visualizations to your resume to showcase your skills with clarity and style. Transform your traditional ATS resume into an engaging infographic that highlights your strengths and expertise levels at a glance — ideal when sharing your resume directly with a recruiter or during in-person presentations.",
      token_price: 25, // 3 tokens per request,
      prompt_name: "InfographicPieChartPrompt",
    }
  ],
};

import CompareUILib from "@/components/shadcn-studio/blocks/compare-07/compare-07";

const comparisonData = {
  column1Header: {
    icon: {
      light:
        "https://cdn.shadcnstudio.com/ss-assets/brand-logo/notion-icon.png",
      dark: "https://cdn.shadcnstudio.com/ss-assets/brand-logo/notion-white.png",
    },
    title: "Notion ai",
  },
  column2Header: {
    icon: "https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/compare/image-11.png",
    title: "Jasper",
  },
  column3Header: "What this means for you",
  features: [
    {
      name: "Pricing",
      column1: "Included inside Notion workspace, affordable add-on",
      column2: "Subscription-based, higher pricing tiers",
      column3: "Choose based on your budget and team size",
    },
    {
      name: "Best for",
      column1: "Best for writers who want AI inside their workspace",
      column2: "Best for marketing teams & brand-heavy content",
      column3: "Pick the tool that matches your workflow and goals",
    },
    {
      name: "Writing Quality",
      column1: "Clean, structured writing suited for notes & documents",
      column2: "Persuasive, creative marketing-style writing",
      column3: "Notion = clarity; Jasper = persuasion & creativity",
    },
    {
      name: "Templates",
      column1: "Minimal templates, utility-focused",
      column2: "50+ templates for ads, blogs, and social posts",
      column3: "If templates matter, Jasper gives more flexibility",
    },
    {
      name: "Long-form Writing",
      column1: "Strong for drafting & expanding text",
      column2: "Strong guided workflows for long-form content",
      column3: "Jasper is better for blogs & long-form content",
    },
    {
      name: "SEO Tools",
      column1: "Limited SEO optimization",
      column2: "SEO features + SurferSEO integration",
      column3: "Choose Jasper for SEO-driven content creation",
    },
    {
      name: "Multilingual Support",
      column1: "Basic multilingual support",
      column2: "30+ languages with tone controls",
      column3: "Jasper is ideal for global or multilingual teams",
    },
    {
      name: "Brand Voice",
      column1: "No dedicated brand-voice training",
      column2: "Custom brand voice & style training",
      column3: "Jasper helps maintain brand consistency",
    },
    {
      name: "Integrations",
      column1: "Deep integration inside Notion ecosystem",
      column2: "Integrates with Google Docs, CMS tools, Surfer, Hubspot",
      column3: "Use Jasper for cross-team, multi-platform workflows",
    },
    {
      name: "Publishing",
      column1: "Export or publish within Notion pages",
      column2: "Supports publishing workflows to multiple platforms",
      column3: "Jasper is better for marketing publishing needs",
    },
  ],
};

const CompareUILibPage = () => {
  return <CompareUILib data={comparisonData} />;
};

export default CompareUILibPage;

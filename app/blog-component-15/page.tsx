import Blog from "@/components/shadcn-studio/blocks/blog-component-15/blog-component-15";

const blogPosts = [
  {
    title: "Design Smarter: How User Behavior Shapes Winning Products",
    description:
      "Learn how to discover what users truly want and build with confidence.",
    imageUrl:
      "https://cdn.shadcnstudio.com/ss-assets/template/landing-page/ink/image-04.png",
    imageAlt: "Design workspace with color swatches",
    date: "March 12, 2025",
    category: "Product",
    author: "Phillip Palmer",
    authorLink: "#",
    blogLink: "#",
    categoryLink: "#",
  },
  {
    title: "Nail Your First Launch: A Checklist for Product Debut Success",
    description:
      "Avoid common launch traps and create excitement from day one.",
    imageUrl:
      "https://cdn.shadcnstudio.com/ss-assets/template/landing-page/ink/image-05.png",
    imageAlt: "Product launch analytics",
    date: "January 20, 2025",
    category: "Startup Growth",
    author: "Michael Brown",
    authorLink: "#",
    blogLink: "#",
    categoryLink: "#",
  },
  {
    title: "Why Fast Apps Win: The Blueprint for Lightning-Quick Experiences",
    description:
      "Explore proven strategies to boost speed and delight users every time.",
    imageUrl:
      "https://cdn.shadcnstudio.com/ss-assets/template/landing-page/ink/image-06.png",
    imageAlt: "Mobile app development",
    date: "February 28, 2025",
    category: "Product",
    author: "Jane Smith",
    authorLink: "#",
    blogLink: "#",
    categoryLink: "#",
  },
  {
    title: "Scaling Design the Right Way with a Solid Component System",
    description:
      "Build consistency, save time, and ship optimized UI every release.",
    imageUrl:
      "https://cdn.shadcnstudio.com/ss-assets/template/landing-page/ink/image-07.png",
    imageAlt: "Component design system",
    date: "March 05, 2025",
    category: "Design",
    author: "Dylan Field",
    authorLink: "#",
    blogLink: "#",
    categoryLink: "#",
  },
  {
    title: "Product KPIs That Actually Matter And How to Track Them",
    description:
      "Measure progress the right way to build momentum and stay focused.",
    imageUrl:
      "https://cdn.shadcnstudio.com/ss-assets/template/landing-page/ink/image-08.png",
    imageAlt: "Team analyzing KPIs",
    date: "January 09, 2025",
    category: "Design",
    author: "Nina Rich",
    authorLink: "#",
    blogLink: "#",
    categoryLink: "#",
  },
  {
    title: "How AI-Driven Workflows Are Transforming Product Development",
    description:
      "Discover smarter ways to ideate, design, and build using AI tools.",
    imageUrl:
      "https://cdn.shadcnstudio.com/ss-assets/template/landing-page/ink/image-09.png",
    imageAlt: "AI in product development",
    date: "March 05, 2025",
    category: "Startup Growth",
    author: "Startup Growth",
    authorLink: "#",
    blogLink: "#",
    categoryLink: "#",
  },
];

const BlogSection = () => {
  return <Blog blogPosts={blogPosts} />;
};

export default BlogSection;

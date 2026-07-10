"use client";

import { ArrowRightIcon, CalendarDaysIcon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type BlogPost = {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  date: string;
  category: string;
  author: string;
  authorLink: string;
  blogLink: string;
  categoryLink: string;
};

type BlogProps = {
  blogPosts: BlogPost[];
};

const BlogGrid = ({ posts }: { posts: BlogPost[] }) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <Card
          className="group h-full transition-all duration-300"
          key={post.title}
        >
          <CardHeader>
            <a className="overflow-hidden rounded-lg" href={post.blogLink}>
              {/* biome-ignore lint/performance/noImgElement: shadcn block uses raw img */}
              <img
                alt={post.imageAlt}
                className="h-59.5 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                src={post.imageUrl}
              />
            </a>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDaysIcon className="size-6" />
                <span className="text-base">{post.date}</span>
              </div>
              <a href={post.categoryLink}>
                <Badge className="h-auto border-0 bg-primary/10 text-primary text-sm">
                  {post.category}
                </Badge>
              </a>
            </div>
            <h3 className="line-clamp-2 font-medium text-lg md:text-xl">
              <a href={post.blogLink}>{post.title}</a>
            </h3>
            <p className="line-clamp-2 text-base text-muted-foreground">
              {post.description}
            </p>
            <div className="flex items-center justify-between">
              <a className="font-medium text-sm" href={post.authorLink}>
                {post.author}
              </a>
              <Button
                asChild
                className="group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground dark:group-hover:bg-primary dark:hover:bg-primary"
                size="icon"
                variant="outline"
              >
                <a href={post.blogLink}>
                  <ArrowRightIcon className="-rotate-45 size-4" />
                  <span className="sr-only">Read more: {post.title}</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const Blog = ({ blogPosts }: BlogProps) => {
  const categories = ["All", "Product", "Design", "Startup Growth"] as const;

  return (
    <section className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-16 lg:px-8">
        <div className="space-y-4">
          <p className="text-sm">Blogs</p>

          <h2 className="font-semibold text-2xl md:text-3xl lg:text-4xl">
            Build Better Products with Insights & Inspiration.
          </h2>

          <p className="text-lg text-muted-foreground md:text-xl">
            Practical insights and real stories to guide your product from
            vision to reality.
          </p>
        </div>

        <Tabs className="gap-8 lg:gap-16" defaultValue="All">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <ScrollArea className="w-full rounded-lg max-md:bg-muted sm:w-auto">
              <TabsList className="gap-1 group-data-horizontal/tabs:h-auto">
                {categories.map((category) => (
                  <TabsTrigger
                    className="cursor-pointer px-3 text-base hover:bg-primary/10 group-data-horizontal/tabs:after:h-0"
                    key={category}
                    value={category}
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className="relative max-md:w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-muted-foreground peer-disabled:opacity-50">
                <SearchIcon className="size-4" />
                <span className="sr-only">Search</span>
              </div>
              <Input
                className="peer input-lg px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
                placeholder="Search"
                type="search"
              />
            </div>
          </div>

          <TabsContent value="All">
            <BlogGrid posts={blogPosts} />
          </TabsContent>

          {categories.slice(1).map((category) => (
            <TabsContent key={category} value={category}>
              <BlogGrid
                posts={blogPosts.filter((post) => post.category === category)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default Blog;

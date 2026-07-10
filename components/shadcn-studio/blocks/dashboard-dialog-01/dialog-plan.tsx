"use client";

import {
  CircleCheckIcon,
  DollarSignIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type Props = {
  trigger: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  data: {
    id: string;
    title: string;
    price: number;
    description: string;
    features: string[];
  }[];
};

const PlanDialog = ({
  defaultOpen = false,
  trigger,
  data,
  className,
}: Props) => {
  const [open, setOpen] = useState(defaultOpen);
  const [plan, setPlan] = useState("1");

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "sm:max-w-155 [&>[data-slot=dialog-close]>svg]:size-5",
          className
        )}
      >
        <DialogHeader className="flex-row items-center gap-4">
          <Avatar className="size-11 rounded-md after:rounded-md">
            <AvatarFallback className="shrink-0 rounded-md border bg-transparent">
              <DollarSignIcon className="size-6" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <DialogTitle className="m-0 text-lg">Select Plan</DialogTitle>
            <DialogDescription>
              Simple and flexible per-user pricing
            </DialogDescription>
          </div>
        </DialogHeader>

        <RadioGroup
          className="w-full gap-6 sm:grid-cols-2"
          defaultValue={plan}
          onValueChange={setPlan}
        >
          {data.map((planData) => (
            <div
              className="relative flex w-full flex-col gap-4 rounded-md border border-input px-5 py-6 outline-none has-data-checked:border-primary"
              key={planData.id}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    className="text-base after:absolute after:inset-0"
                    htmlFor={planData.id}
                  >
                    {planData.title}
                  </Label>
                  <RadioGroupItem
                    aria-label={`plan-radio-${planData.title.toLowerCase().replace(/\s+/g, "-")}`}
                    className="size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5"
                    id={planData.id}
                    value={planData.id}
                  />
                </div>
                <p>
                  <span className="font-medium text-2xl">
                    ${planData.price}
                  </span>
                  <span className="text-muted-foreground text-xl">/user</span>
                </p>
                <p className="text-muted-foreground text-sm">
                  {planData.description}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {planData.features.map((feature) => (
                  <div className="flex items-center gap-2" key={feature}>
                    <CircleCheckIcon className="size-5 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </RadioGroup>

        <div className="flex flex-col-reverse gap-4 max-sm:flex-col sm:flex-row sm:justify-between">
          <Button
            className="bg-primary/10 text-primary hover:bg-primary/20"
            size="lg"
          >
            <MessageSquareTextIcon />
            Chat with us
          </Button>
          <div className="flex justify-between gap-4">
            <DialogClose asChild>
              <Button size="lg" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button size="lg">Purchase now</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDialog;

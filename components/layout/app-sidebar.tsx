"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FileText, Lightbulb, ListOrdered, Map, Send } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { usePrompt } from "@/components/providers/prompt-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const QUICK_ACTIONS = [
  {
    label: "Synthesize Research",
    prompt: "Synthesize the user research from my uploaded documents into key themes, quotes, and insights.",
    icon: Lightbulb,
  },
  {
    label: "Prioritize Features",
    prompt: "Take my feature list and apply RICE/ICE prioritization. Give me a scored table with rationale.",
    icon: ListOrdered,
  },
  {
    label: "Build Roadmap",
    prompt: "Create a Now/Next/Later or quarterly roadmap based on my context. Include a Mermaid timeline.",
    icon: Map,
  },
  {
    label: "Draft PRD",
    prompt: "Draft a PRD with standard sections: Problem, Goals, Scope, User Stories, and Metrics.",
    icon: FileText,
  },
  {
    label: "Stakeholder Update",
    prompt: "Write a stakeholder update (email/Slack/1-pager) summarizing key decisions and progress.",
    icon: Send,
  },
] as const;

type AppSidebarProps = {
  files?: { id: string; name: string }[];
};

export function AppSidebar({ files = [] }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { setPrompt } = usePrompt();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            C
          </div>
          <span className="font-semibold">Compass</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {QUICK_ACTIONS.map((action) => (
                <SidebarMenuItem key={action.label}>
                  <SidebarMenuButton
                    onClick={() => setPrompt(action.prompt)}
                    className="cursor-pointer"
                  >
                    <action.icon className="h-4 w-4" />
                    <span className="truncate">{action.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Uploaded Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[200px]">
              <SidebarMenu>
                {files.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No files yet. Upload PDFs, MD, TXT, or CSV.
                  </div>
                ) : (
                  files.map((file) => (
                    <SidebarMenuItem key={file.id}>
                      <SidebarMenuButton>
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {user?.email?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{user?.email ?? "User"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

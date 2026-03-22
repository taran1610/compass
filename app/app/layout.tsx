import { PromptProvider } from "@/components/providers/prompt-provider";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PromptProvider>
      <WorkspaceProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </WorkspaceProvider>
    </PromptProvider>
  );
}

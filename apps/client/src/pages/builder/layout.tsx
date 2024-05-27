import { t } from "@lingui/macro";
import { useBreakpoint } from "@reactive-resume/hooks";
import {
  Button,
  Panel,
  PanelGroup,
  PanelResizeHandle,
  Sheet,
  SheetContent,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { Outlet } from "react-router-dom";

import { usePrintResume } from "@/client/services/resume";
import { useBuilderStore } from "@/client/stores/builder";
import { useDialog } from "@/client/stores/dialog";
import { useResumeStore } from "@/client/stores/resume";

import { BuilderHeader } from "./_components/header";
import { BuilderToolbar } from "./_components/toolbar";
import { LeftSidebar } from "./sidebars/left";
import { RightSidebar } from "./sidebars/right";

const onOpenAutoFocus = (event: Event) => {
  event.preventDefault();
};

export const openInNewTab = (url: string) => {
  const win = window.open(url, "_blank");
  if (win) win.focus();
};

const OutletSlot = () => {
  const { printResume, loading } = usePrintResume();
  const { isOpen, open } = useDialog("payment");

  const onPdfExport = async () => {
    const { resume } = useResumeStore.getState();
    const { url } = await printResume({ id: resume.id });
    const result = JSON.parse(url);
    if (result.url) {
      openInNewTab(result.url);
      return;
    }
    open("payment");
    // console.log(result);
    // openInNewTab(url);
  };

  return (
    <>
      <BuilderHeader />
      <Button
        size={"lg"}
        variant="secondary"
        className="absolute left-1/2 z-50 mt-20 -translate-x-1/2 cursor-pointer gap-x-2 rounded-full bg-[#008000bd]"
        onClick={onPdfExport}
      >
        <span>{t`Download PDF`}</span>
      </Button>
      <div className="absolute inset-0">
        <Outlet />
      </div>

      <BuilderToolbar />
    </>
  );
};

export const BuilderLayout = () => {
  const { isDesktop } = useBreakpoint();

  const sheet = useBuilderStore((state) => state.sheet);

  const leftSetSize = useBuilderStore((state) => state.panel.left.setSize);
  const rightSetSize = useBuilderStore((state) => state.panel.right.setSize);

  const leftHandle = useBuilderStore((state) => state.panel.left.handle);
  const rightHandle = useBuilderStore((state) => state.panel.right.handle);

  if (isDesktop) {
    return (
      <div className="relative size-full overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel
            minSize={25}
            maxSize={45}
            defaultSize={30}
            className={cn("z-10 bg-background", !leftHandle.isDragging && "transition-[flex]")}
            onResize={leftSetSize}
          >
            <LeftSidebar />
          </Panel>
          <PanelResizeHandle
            isDragging={leftHandle.isDragging}
            onDragging={leftHandle.setDragging}
          />
          <Panel>
            <OutletSlot />
          </Panel>
          <PanelResizeHandle
            isDragging={rightHandle.isDragging}
            onDragging={rightHandle.setDragging}
          />
          <Panel
            minSize={25}
            maxSize={45}
            defaultSize={30}
            className={cn("z-10 bg-background", !rightHandle.isDragging && "transition-[flex]")}
            onResize={rightSetSize}
          >
            <RightSidebar />
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  return (
    <div className="relative">
      <Sheet open={sheet.left.open} onOpenChange={sheet.left.setOpen}>
        <SheetContent
          side="left"
          showClose={false}
          className="top-16 p-0 sm:max-w-xl"
          onOpenAutoFocus={onOpenAutoFocus}
        >
          <LeftSidebar />
        </SheetContent>
      </Sheet>

      <OutletSlot />

      <Sheet open={sheet.right.open} onOpenChange={sheet.right.setOpen}>
        <SheetContent
          side="right"
          showClose={false}
          className="top-16 p-0 sm:max-w-xl"
          onOpenAutoFocus={onOpenAutoFocus}
        >
          <RightSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
};

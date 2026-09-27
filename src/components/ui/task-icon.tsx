import {
  Clapperboard,
  Image as ImageIcon,
  ImagePlus,
  Music,
  Scissors,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TaskIconName } from "@/types/task";

const ICONS: Record<TaskIconName, LucideIcon> = {
  image: ImageIcon,
  video: Video,
  scissors: Scissors,
  music: Music,
  clapperboard: Clapperboard,
  "image-plus": ImagePlus,
};

export const TASK_ICON_SIZE = 18;

export interface TaskIconProps {
  name: TaskIconName;
  /** Defaults to TASK_ICON_SIZE (18) so nav items stay consistent. */
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function TaskIcon({
  name,
  size = TASK_ICON_SIZE,
  className,
  strokeWidth = 2,
}: TaskIconProps) {
  const Icon = ICONS[name] ?? ImageIcon;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    />
  );
}

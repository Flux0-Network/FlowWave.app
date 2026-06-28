export type ComponentType =
  | "container"
  | "section"
  | "text-display"
  | "button"
  | "separator"
  | "thumbnail"
  | "media-gallery"
  | "action-row";

export type ButtonStyle = "primary" | "secondary" | "success" | "danger" | "link";

export interface BuilderComponent {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  children?: BuilderComponent[];
}

export interface ContainerProps {
  accent_color?: string;
  spoiler?: boolean;
}

export interface SectionProps {
  accessory?: BuilderComponent;
}

export interface TextDisplayProps {
  content: string;
}

export interface ButtonProps {
  label: string;
  style: ButtonStyle;
  custom_id?: string;
  url?: string;
  emoji?: string;
  disabled?: boolean;
}

export interface SeparatorProps {
  divider?: boolean;
  spacing: "small" | "large";
}

export interface ThumbnailProps {
  url: string;
  description?: string;
  spoiler?: boolean;
}

export interface MediaGalleryProps {
  items: { url: string; description?: string; spoiler?: boolean }[];
}

export interface ActionRowProps {
  // action rows only hold children (buttons, selects)
}

export interface BuilderState {
  components: BuilderComponent[];
  selectedId: string | null;
}

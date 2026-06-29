import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { botToken, channelId, components } = await request.json();

    if (!botToken || !channelId || !components) {
      return NextResponse.json(
        { error: "botToken, channelId und components sind erforderlich" },
        { status: 400 }
      );
    }

    const discordPayload = {
      content: "",
      components: transformToDiscordPayload(components),
      flags: 32768, // IS_COMPONENTS_V2
    };

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordPayload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: `Discord API Error: ${JSON.stringify(error)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, messageId: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: `Server Error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

interface BuilderComp {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: BuilderComp[];
}

function transformToDiscordPayload(components: BuilderComp[]): unknown[] {
  return components.map((comp) => transformComponent(comp));
}

function transformComponent(comp: BuilderComp): unknown {
  switch (comp.type) {
    case "container": {
      const container: Record<string, unknown> = {
        type: 17, // Container
        components: (comp.children || []).map(transformComponent),
      };
      if (comp.props.accent_color) {
        container.accent_color = parseInt(
          (comp.props.accent_color as string).replace("#", ""),
          16
        );
      }
      if (comp.props.spoiler) container.spoiler = true;
      return container;
    }

    case "section":
      return {
        type: 9, // Section
        components: (comp.children || []).map(transformComponent),
      };

    case "text-display":
      return {
        type: 10, // TextDisplay
        content: (comp.props.content as string) || "",
      };

    case "button": {
      const styleMap: Record<string, number> = {
        primary: 1,
        secondary: 2,
        success: 3,
        danger: 4,
        link: 5,
      };
      const btn: Record<string, unknown> = {
        type: 2, // Button
        style: styleMap[(comp.props.style as string) || "primary"],
        label: (comp.props.label as string) || "Button",
      };
      if (comp.props.custom_id) btn.custom_id = comp.props.custom_id;
      if (comp.props.url && comp.props.style === "link") btn.url = comp.props.url;
      if (comp.props.disabled) btn.disabled = true;
      return btn;
    }

    case "separator":
      return {
        type: 14, // Separator
        divider: comp.props.divider !== false,
        spacing: (comp.props.spacing as string) === "large" ? 2 : 1,
      };

    case "thumbnail":
      return {
        type: 11, // Thumbnail
        media: { url: (comp.props.url as string) || "" },
      };

    case "media-gallery":
      return {
        type: 12, // MediaGallery
        items: [
          { media: { url: "https://example.com/image.png" } },
        ],
      };

    case "action-row":
      return {
        type: 1, // ActionRow
        components: (comp.children || []).map(transformComponent),
      };

    case "select-menu": {
      const selectTypeMap: Record<string, number> = {
        string: 3,
        user: 5,
        role: 6,
        mentionable: 7,
        channel: 8,
      };
      const select: Record<string, unknown> = {
        type: selectTypeMap[(comp.props.select_type as string) || "string"],
        custom_id: (comp.props.custom_id as string) || "select",
      };
      if (comp.props.placeholder) select.placeholder = comp.props.placeholder;
      if (comp.props.min_values) select.min_values = comp.props.min_values;
      if (comp.props.max_values) select.max_values = comp.props.max_values;
      if (
        (comp.props.select_type as string) === "string" &&
        Array.isArray(comp.props.options)
      ) {
        select.options = (
          comp.props.options as Array<Record<string, string>>
        ).map((opt) => ({
          label: opt.label,
          value: opt.value,
          ...(opt.description ? { description: opt.description } : {}),
        }));
      }
      return select;
    }

    default:
      return { type: 10, content: `[Unknown: ${comp.type}]` };
  }
}

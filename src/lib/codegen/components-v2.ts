import type { BuilderComponent } from "@/types/builder";

export function generateComponentsV2Code(components: BuilderComponent[]): string {
  const lines: string[] = [
    "import discord",
    "from discord.ext import commands",
    "",
    "",
    "class ComponentsView(discord.ui.View):",
    "    def __init__(self):",
    "        super().__init__()",
    "",
  ];

  const callbacks: string[] = [];
  collectCallbacks(components, callbacks);

  if (callbacks.length > 0) {
    lines.push(...callbacks);
    lines.push("");
  }

  lines.push("");
  lines.push("def build_message_components():");
  lines.push('    """Baut die Components-V2-Nachricht."""');
  lines.push("    components = []");
  lines.push("");

  for (const comp of components) {
    const compLines = generateComponent(comp, "    ");
    lines.push(...compLines);
    lines.push("");
  }

  lines.push("    return components");
  lines.push("");
  lines.push("");
  lines.push("# Beispiel: Nachricht senden");
  lines.push("# await ctx.respond(components=build_message_components())");

  return lines.join("\n");
}

function generateComponent(comp: BuilderComponent, indent: string): string[] {
  const lines: string[] = [];
  const varName = `comp_${comp.id.replace(/-/g, "_").slice(0, 8)}`;

  switch (comp.type) {
    case "container": {
      const color = comp.props.accent_color
        ? `discord.Color.from_str("${comp.props.accent_color}")`
        : "None";
      lines.push(`${indent}# Container`);
      lines.push(`${indent}${varName}_children = []`);
      if (comp.children) {
        for (const child of comp.children) {
          const childLines = generateComponent(child, indent);
          lines.push(...childLines);
          lines.push(
            `${indent}${varName}_children.append(comp_${child.id.replace(/-/g, "_").slice(0, 8)})`
          );
        }
      }
      lines.push(
        `${indent}${varName} = discord.Container(*${varName}_children, accent_colour=${color}${comp.props.spoiler ? ", spoiler=True" : ""})`
      );
      lines.push(`${indent}components.append(${varName})`);
      break;
    }

    case "section": {
      lines.push(`${indent}# Section`);
      const sectionChildren: string[] = [];
      if (comp.children) {
        for (const child of comp.children) {
          const childLines = generateComponent(child, indent);
          lines.push(...childLines);
          sectionChildren.push(
            `comp_${child.id.replace(/-/g, "_").slice(0, 8)}`
          );
        }
      }
      lines.push(
        `${indent}${varName} = discord.Section(${sectionChildren.join(", ")})`
      );
      break;
    }

    case "text-display": {
      const content = (comp.props.content as string) || "Text";
      lines.push(
        `${indent}${varName} = discord.TextDisplay(${JSON.stringify(content)})`
      );
      break;
    }

    case "button": {
      const label = (comp.props.label as string) || "Button";
      const style = (comp.props.style as string) || "primary";
      const styleMap: Record<string, string> = {
        primary: "discord.ButtonStyle.primary",
        secondary: "discord.ButtonStyle.secondary",
        success: "discord.ButtonStyle.success",
        danger: "discord.ButtonStyle.danger",
        link: "discord.ButtonStyle.link",
      };
      const customId = comp.props.custom_id as string;
      const url = comp.props.url as string;
      const emoji = comp.props.emoji as string;

      let args = `label=${JSON.stringify(label)}, style=${styleMap[style]}`;
      if (customId) args += `, custom_id=${JSON.stringify(customId)}`;
      if (url && style === "link") args += `, url=${JSON.stringify(url)}`;
      if (emoji) args += `, emoji=${JSON.stringify(emoji)}`;
      if (comp.props.disabled) args += `, disabled=True`;

      lines.push(`${indent}${varName} = discord.Button(${args})`);
      break;
    }

    case "separator": {
      const divider = comp.props.divider !== false;
      const spacing = (comp.props.spacing as string) === "large"
        ? "discord.SeparatorSpacing.large"
        : "discord.SeparatorSpacing.small";
      lines.push(
        `${indent}${varName} = discord.Separator(divider=${divider ? "True" : "False"}, spacing=${spacing})`
      );
      break;
    }

    case "thumbnail": {
      const url = (comp.props.url as string) || "https://example.com/image.png";
      let args = `url=${JSON.stringify(url)}`;
      if (comp.props.description)
        args += `, description=${JSON.stringify(comp.props.description)}`;
      if (comp.props.spoiler) args += `, spoiler=True`;
      lines.push(`${indent}${varName} = discord.Thumbnail(${args})`);
      break;
    }

    case "media-gallery": {
      lines.push(`${indent}${varName} = discord.MediaGallery(`);
      lines.push(`${indent}    discord.MediaGalleryItem(url="https://example.com/image1.png"),`);
      lines.push(`${indent}    discord.MediaGalleryItem(url="https://example.com/image2.png"),`);
      lines.push(`${indent})`);
      break;
    }

    case "action-row": {
      lines.push(`${indent}# Action Row`);
      const rowChildren: string[] = [];
      if (comp.children) {
        for (const child of comp.children) {
          const childLines = generateComponent(child, indent);
          lines.push(...childLines);
          rowChildren.push(
            `comp_${child.id.replace(/-/g, "_").slice(0, 8)}`
          );
        }
      }
      lines.push(
        `${indent}${varName} = discord.ActionRow(${rowChildren.join(", ")})`
      );
      break;
    }
  }

  return lines;
}

function collectCallbacks(components: BuilderComponent[], callbacks: string[]) {
  for (const comp of components) {
    if (comp.type === "button" && comp.props.custom_id) {
      const customId = comp.props.custom_id as string;
      const fnName = customId.replace(/[^a-zA-Z0-9_]/g, "_");
      callbacks.push(
        `    @discord.ui.button(label=${JSON.stringify((comp.props.label as string) || "Button")}, custom_id=${JSON.stringify(customId)}, style=discord.ButtonStyle.${(comp.props.style as string) || "primary"})`,
        `    async def ${fnName}_callback(self, button: discord.ui.Button, interaction: discord.Interaction):`,
        `        await interaction.response.send_message("Button ${customId} geklickt!", ephemeral=True)`,
        ""
      );
    }
    if (comp.children) {
      collectCallbacks(comp.children, callbacks);
    }
  }
}

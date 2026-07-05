import type { BuilderComponent } from "@/types/builder";

/**
 * Generates Pycord v2.8 code using discord.ui.DesignerView.
 * Components are declared as class-level attributes (declarative pattern).
 * Interactive components (buttons, selects) get @discord.ui.button / @discord.ui.select callbacks.
 */
export function generateComponentsV2Code(components: BuilderComponent[]): string {
  const lines: string[] = [
    "import discord",
    "from discord.ext import commands",
    "",
    "",
  ];

  const buttons: Array<{ customId: string; label: string; style: string }> = [];
  const selectMenus: Array<{ customId: string; placeholder: string; selectType: string }> = [];
  collectInteractives(components, buttons, selectMenus);

  // ── DesignerView class ──────────────────────────────────────────────────────
  lines.push("class MyView(discord.ui.DesignerView):");
  lines.push('    """FlowWave — Pycord v2.8 Components V2 (DesignerView)"""');
  lines.push("");

  if (components.length === 0) {
    lines.push("    pass");
  } else {
    // Class-level component declarations
    const attrs = buildClassAttributes(components, "    ");
    lines.push(...attrs);
  }

  // ── Button callbacks ────────────────────────────────────────────────────────
  if (buttons.length > 0) {
    lines.push("");
    const styleMap: Record<string, string> = {
      primary: "discord.ButtonStyle.primary",
      secondary: "discord.ButtonStyle.secondary",
      success: "discord.ButtonStyle.success",
      danger: "discord.ButtonStyle.danger",
      link: "discord.ButtonStyle.link",
    };
    for (const btn of buttons) {
      const fnName = sanitize(btn.customId);
      lines.push(
        `    @discord.ui.button(custom_id=${JSON.stringify(btn.customId)}, label=${JSON.stringify(btn.label)}, style=${styleMap[btn.style] ?? "discord.ButtonStyle.primary"})`
      );
      lines.push(
        `    async def ${fnName}(self, button: discord.ui.Button, interaction: discord.Interaction) -> None:`
      );
      lines.push(
        `        await interaction.response.send_message("'${btn.label}' geklickt!", ephemeral=True)`
      );
      lines.push("");
    }
  }

  // ── Select callbacks ────────────────────────────────────────────────────────
  if (selectMenus.length > 0) {
    lines.push("");
    for (const sel of selectMenus) {
      const fnName = sanitize(sel.customId);
      const cls = selectClass(sel.selectType);
      lines.push(
        `    @discord.ui.select(cls=${cls}, custom_id=${JSON.stringify(sel.customId)}, placeholder=${JSON.stringify(sel.placeholder)})`
      );
      lines.push(
        `    async def ${fnName}(self, select: discord.ui.Select, interaction: discord.Interaction) -> None:`
      );
      lines.push(
        `        await interaction.response.send_message(f"Ausgewählt: {select.values}", ephemeral=True)`
      );
      lines.push("");
    }
  }

  // ── Usage ───────────────────────────────────────────────────────────────────
  lines.push("");
  lines.push("");
  lines.push("# ── Verwendung ───────────────────────────────────────────────────────────────");
  lines.push("# view = MyView()");
  lines.push("# await ctx.respond(view=view, flags=discord.MessageFlags.is_components_v2)");
  lines.push("#");
  lines.push("# In einem Cog-Command:");
  lines.push("# @discord.slash_command()");
  lines.push("# async def show(self, ctx: discord.ApplicationContext):");
  lines.push("#     await ctx.respond(view=MyView(), flags=discord.MessageFlags.is_components_v2)");

  return lines.join("\n");
}

// ── Class-level attribute builders ─────────────────────────────────────────────

function buildClassAttributes(components: BuilderComponent[], indent: string): string[] {
  const lines: string[] = [];
  let attrIdx = 0;

  for (const comp of components) {
    const attrName = `component_${attrIdx++}`;
    const expr = componentExpr(comp, indent + "    ");
    if (!expr) continue;

    if (expr.multiline) {
      lines.push(`${indent}${attrName} = ${expr.lines[0]}`);
      for (let i = 1; i < expr.lines.length; i++) {
        lines.push(expr.lines[i]);
      }
    } else {
      lines.push(`${indent}${attrName} = ${expr.lines[0]}`);
    }
    lines.push("");
  }

  return lines;
}

interface Expr {
  lines: string[];
  multiline: boolean;
}

function componentExpr(comp: BuilderComponent, childIndent: string): Expr | null {
  switch (comp.type) {
    case "container": {
      const color = comp.props.accent_color
        ? `discord.Color.from_str(${JSON.stringify(comp.props.accent_color)})`
        : "None";
      const spoiler = comp.props.spoiler ? ",\n" + childIndent + "    spoiler=True" : "";
      const childLines = childExprs(comp.children ?? [], childIndent + "    ");
      return {
        multiline: true,
        lines: [
          `discord.ui.Container(`,
          ...childLines,
          `${childIndent}    accent_colour=${color}${spoiler},`,
          `${childIndent})`,
        ],
      };
    }

    case "section": {
      const childLines = childExprs(comp.children ?? [], childIndent + "    ");
      return {
        multiline: true,
        lines: [
          `discord.ui.Section(`,
          ...childLines,
          `${childIndent})`,
        ],
      };
    }

    case "text-display": {
      const content = JSON.stringify((comp.props.content as string) || "Text");
      return { multiline: false, lines: [`discord.ui.TextDisplay(${content})`] };
    }

    case "separator": {
      const divider = comp.props.divider !== false ? "True" : "False";
      const spacing =
        (comp.props.spacing as string) === "large"
          ? "discord.SeparatorSpacing.large"
          : "discord.SeparatorSpacing.small";
      return {
        multiline: false,
        lines: [`discord.ui.Separator(divider=${divider}, spacing=${spacing})`],
      };
    }

    case "thumbnail": {
      const url = JSON.stringify((comp.props.url as string) || "https://example.com/image.png");
      const desc = comp.props.description
        ? `, description=${JSON.stringify(comp.props.description)}`
        : "";
      const spoiler = comp.props.spoiler ? ", spoiler=True" : "";
      return {
        multiline: false,
        lines: [`discord.ui.Thumbnail(url=${url}${desc}${spoiler})`],
      };
    }

    case "media-gallery": {
      return {
        multiline: true,
        lines: [
          `discord.ui.MediaGallery(`,
          `${childIndent}    discord.ui.MediaGalleryItem(url="https://example.com/image1.png"),`,
          `${childIndent}    discord.ui.MediaGalleryItem(url="https://example.com/image2.png"),`,
          `${childIndent})`,
        ],
      };
    }

    case "action-row": {
      const items = actionRowItems(comp.children ?? [], childIndent + "    ");
      return {
        multiline: true,
        lines: [
          `discord.ui.ActionRow(`,
          ...items,
          `${childIndent})`,
        ],
      };
    }

    case "button": {
      // Standalone button → wrap in ActionRow
      return {
        multiline: true,
        lines: [
          `discord.ui.ActionRow(`,
          buttonLine(comp, childIndent + "    ") + ",",
          `${childIndent})`,
        ],
      };
    }

    case "select-menu": {
      // Standalone select → wrap in ActionRow
      return {
        multiline: true,
        lines: [
          `discord.ui.ActionRow(`,
          selectLine(comp, childIndent + "    ") + ",",
          `${childIndent})`,
        ],
      };
    }

    default:
      return null;
  }
}

function childExprs(children: BuilderComponent[], indent: string): string[] {
  const lines: string[] = [];
  for (const child of children) {
    const expr = componentExpr(child, indent + "    ");
    if (!expr) continue;
    if (expr.multiline) {
      lines.push(`${indent}${expr.lines[0]}`);
      for (let i = 1; i < expr.lines.length - 1; i++) {
        lines.push(expr.lines[i]);
      }
      lines.push(expr.lines[expr.lines.length - 1] + ",");
    } else {
      lines.push(`${indent}${expr.lines[0]},`);
    }
  }
  return lines;
}

function actionRowItems(children: BuilderComponent[], indent: string): string[] {
  const lines: string[] = [];
  for (const child of children) {
    if (child.type === "button") {
      lines.push(buttonLine(child, indent) + ",");
    } else if (child.type === "select-menu") {
      lines.push(selectLine(child, indent) + ",");
    }
  }
  if (lines.length === 0) {
    lines.push(
      `${indent}discord.ui.Button(label="Button", style=discord.ButtonStyle.secondary, custom_id="placeholder"),`
    );
  }
  return lines;
}

function buttonLine(comp: BuilderComponent, indent: string): string {
  const label = JSON.stringify((comp.props.label as string) || "Button");
  const style = (comp.props.style as string) || "primary";
  const styleMap: Record<string, string> = {
    primary: "discord.ButtonStyle.primary",
    secondary: "discord.ButtonStyle.secondary",
    success: "discord.ButtonStyle.success",
    danger: "discord.ButtonStyle.danger",
    link: "discord.ButtonStyle.link",
  };
  const parts = [
    `label=${label}`,
    `style=${styleMap[style] ?? "discord.ButtonStyle.secondary"}`,
  ];
  if (comp.props.custom_id) parts.push(`custom_id=${JSON.stringify(comp.props.custom_id)}`);
  if (style === "link" && comp.props.url) parts.push(`url=${JSON.stringify(comp.props.url)}`);
  if (comp.props.emoji) parts.push(`emoji=${JSON.stringify(comp.props.emoji)}`);
  if (comp.props.disabled) parts.push("disabled=True");
  return `${indent}discord.ui.Button(${parts.join(", ")})`;
}

function selectLine(comp: BuilderComponent, indent: string): string {
  const selectType = (comp.props.select_type as string) || "string";
  const cls = selectClass(selectType);
  const parts: string[] = [];
  if (comp.props.custom_id) parts.push(`custom_id=${JSON.stringify(comp.props.custom_id)}`);
  if (comp.props.placeholder) parts.push(`placeholder=${JSON.stringify(comp.props.placeholder)}`);
  if (comp.props.min_values !== undefined) parts.push(`min_values=${comp.props.min_values}`);
  if (comp.props.max_values !== undefined) parts.push(`max_values=${comp.props.max_values}`);

  if (selectType === "string") {
    const options =
      (comp.props.options as Array<{ label: string; value: string; description?: string }>) ?? [];
    const optStr = options
      .map(
        (o) =>
          `discord.SelectOption(label=${JSON.stringify(o.label)}, value=${JSON.stringify(o.value)}${o.description ? `, description=${JSON.stringify(o.description)}` : ""})`
      )
      .join(", ");
    parts.push(`options=[${optStr}]`);
    return `${indent}discord.ui.Select(${parts.join(", ")})`;
  }
  return `${indent}${cls}(${parts.join(", ")})`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function selectClass(selectType: string): string {
  const map: Record<string, string> = {
    string: "discord.ui.Select",
    user: "discord.ui.UserSelect",
    role: "discord.ui.RoleSelect",
    channel: "discord.ui.ChannelSelect",
    mentionable: "discord.ui.MentionableSelect",
  };
  return map[selectType] ?? "discord.ui.Select";
}

function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function collectInteractives(
  components: BuilderComponent[],
  buttons: Array<{ customId: string; label: string; style: string }>,
  selectMenus: Array<{ customId: string; placeholder: string; selectType: string }>
) {
  for (const comp of components) {
    if (comp.type === "button" && comp.props.custom_id) {
      buttons.push({
        customId: comp.props.custom_id as string,
        label: (comp.props.label as string) || "Button",
        style: (comp.props.style as string) || "primary",
      });
    }
    if (comp.type === "select-menu" && comp.props.custom_id) {
      selectMenus.push({
        customId: comp.props.custom_id as string,
        placeholder: (comp.props.placeholder as string) || "Wähle...",
        selectType: (comp.props.select_type as string) || "string",
      });
    }
    if (comp.children) {
      collectInteractives(comp.children, buttons, selectMenus);
    }
  }
}

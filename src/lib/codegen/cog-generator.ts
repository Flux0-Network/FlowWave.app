import type { CogConfig, SlashCommand, Modal, SqliteTable } from "@/types/generator";

export function generateCogCode(config: CogConfig): string {
  const lines: string[] = [];

  lines.push("import discord");
  lines.push("from discord.ext import commands");

  if (config.tables.length > 0) {
    lines.push("import sqlite3");
    lines.push("import os");
  }

  lines.push("");
  lines.push("");

  // Modal classes
  for (const modal of config.modals) {
    lines.push(...generateModalClass(modal));
    lines.push("");
    lines.push("");
  }

  // Cog class
  lines.push(`class ${config.cogName}(commands.Cog):`);
  lines.push(`    def __init__(self, bot: commands.Bot):`);
  lines.push(`        self.bot = bot`);

  if (config.tables.length > 0) {
    lines.push(`        self.db = sqlite3.connect(os.path.join(os.path.dirname(__file__), "${config.cogName.toLowerCase()}.db"))`);
    lines.push(`        self._create_tables()`);
  }

  lines.push("");

  // SQLite table creation
  if (config.tables.length > 0) {
    lines.push(`    def _create_tables(self):`);
    for (const table of config.tables) {
      lines.push(...generateTableCreation(table, "        "));
    }
    lines.push(`        self.db.commit()`);
    lines.push("");
  }

  // Slash commands
  for (const cmd of config.commands) {
    lines.push(...generateSlashCommand(cmd, config));
    lines.push("");
  }

  // Interaction listeners
  for (const listener of config.listeners) {
    lines.push(`    @commands.Cog.listener()`);
    lines.push(`    async def on_interaction(self, interaction: discord.Interaction):`);
    if (listener.customIdPattern) {
      lines.push(`        if interaction.custom_id == ${JSON.stringify(listener.customIdPattern)}:`);
      lines.push(`            await interaction.response.send_message("Handled!", ephemeral=True)`);
    }
    lines.push("");
  }

  // Setup function
  lines.push("");
  lines.push(`def setup(bot: commands.Bot):`);
  lines.push(`    bot.add_cog(${config.cogName}(bot))`);

  return lines.join("\n");
}

function generateModalClass(modal: Modal): string[] {
  const lines: string[] = [];
  const className = modal.title.replace(/[^a-zA-Z0-9]/g, "") + "Modal";

  lines.push(`class ${className}(discord.ui.Modal):`);
  lines.push(`    def __init__(self):`);
  lines.push(`        super().__init__(title=${JSON.stringify(modal.title)})`);
  lines.push("");

  for (const field of modal.fields) {
    const style = field.style === "paragraph"
      ? "discord.InputTextStyle.long"
      : "discord.InputTextStyle.short";

    let args = `label=${JSON.stringify(field.label)}, style=${style}`;
    args += `, custom_id=${JSON.stringify(field.custom_id)}`;
    if (field.placeholder) args += `, placeholder=${JSON.stringify(field.placeholder)}`;
    args += `, required=${field.required ? "True" : "False"}`;
    if (field.min_length) args += `, min_length=${field.min_length}`;
    if (field.max_length) args += `, max_length=${field.max_length}`;

    lines.push(`        self.${field.custom_id} = discord.ui.InputText(${args})`);
    lines.push(`        self.add_item(self.${field.custom_id})`);
  }

  lines.push("");
  lines.push(`    async def callback(self, interaction: discord.Interaction):`);

  for (const field of modal.fields) {
    lines.push(`        ${field.custom_id}_value = self.${field.custom_id}.value`);
  }

  lines.push(`        await interaction.response.send_message(`);
  lines.push(`            f"Modal submitted!",`);
  lines.push(`            ephemeral=True`);
  lines.push(`        )`);

  return lines;
}

function generateSlashCommand(cmd: SlashCommand, config: CogConfig): string[] {
  const lines: string[] = [];

  // Decorator
  let decorator = `    @discord.slash_command(name=${JSON.stringify(cmd.name)}, description=${JSON.stringify(cmd.description)})`;
  lines.push(decorator);

  // Function signature
  const params = ["self", "ctx: discord.ApplicationContext"];
  for (const opt of cmd.options) {
    const optType = getOptionType(opt.type);
    params.push(
      `${opt.name}: ${optType}`
    );
  }
  lines.push(`    async def ${cmd.name}(${params.join(", ")}):`);

  // Options with descriptions
  for (const opt of cmd.options) {
    // We'll use discord.Option for proper description/choices
  }

  // Body
  if (cmd.hasModal && cmd.modalId) {
    const modal = config.modals.find((m) => m.id === cmd.modalId);
    if (modal) {
      const className = modal.title.replace(/[^a-zA-Z0-9]/g, "") + "Modal";
      lines.push(`        modal = ${className}()`);
      lines.push(`        await ctx.send_modal(modal)`);
    }
  } else if (cmd.hasSqlite && config.tables.length > 0) {
    const table = config.tables[0];
    lines.push(`        cursor = self.db.execute("SELECT * FROM ${table.name}")`);
    lines.push(`        rows = cursor.fetchall()`);
    lines.push(`        await ctx.respond(f"Found {len(rows)} entries.", ephemeral=True)`);
  } else {
    lines.push(`        await ctx.respond("Command ${cmd.name} ausgeführt!", ephemeral=True)`);
  }

  return lines;
}

function generateTableCreation(table: SqliteTable, indent: string): string[] {
  const lines: string[] = [];
  const cols = table.columns.map((col) => {
    let def = `${col.name} ${col.type}`;
    if (col.primary_key) def += " PRIMARY KEY";
    if (col.not_null) def += " NOT NULL";
    if (col.default_value !== undefined) def += ` DEFAULT ${col.default_value}`;
    return def;
  });

  lines.push(`${indent}self.db.execute("""`);
  lines.push(`${indent}    CREATE TABLE IF NOT EXISTS ${table.name} (`);
  for (let i = 0; i < cols.length; i++) {
    const comma = i < cols.length - 1 ? "," : "";
    lines.push(`${indent}        ${cols[i]}${comma}`);
  }
  lines.push(`${indent}    )`);
  lines.push(`${indent}""")`);

  return lines;
}

function getOptionType(type: string): string {
  const map: Record<string, string> = {
    string: "str",
    integer: "int",
    boolean: "bool",
    number: "float",
    user: "discord.Member",
    channel: "discord.TextChannel",
    role: "discord.Role",
    mentionable: "discord.Member",
    attachment: "discord.Attachment",
  };
  return map[type] || "str";
}

import type { CogConfig, SlashCommand, Modal, SqliteTable, EventListener } from "@/types/generator";
import type { AutocompleteConfig } from "@/components/generator/autocomplete-builder";

export function generateCogCode(config: CogConfig, autocompleteConfigs?: AutocompleteConfig[]): string {
  const lines: string[] = [];

  lines.push("import discord");
  lines.push("from discord.ext import commands");

  if (config.tables.length > 0) {
    lines.push("import sqlite3");
    lines.push("import os");
  }

  lines.push("");
  lines.push("");

  for (const modal of config.modals) {
    lines.push(...generateModalClass(modal));
    lines.push("");
    lines.push("");
  }

  lines.push(`class ${config.cogName}(commands.Cog):`);
  lines.push(`    def __init__(self, bot: commands.Bot):`);
  lines.push(`        self.bot = bot`);

  if (config.tables.length > 0) {
    lines.push(`        self.db = sqlite3.connect(os.path.join(os.path.dirname(__file__), "${config.cogName.toLowerCase()}.db"))`);
    lines.push(`        self._create_tables()`);
  }

  lines.push("");

  if (config.tables.length > 0) {
    lines.push(`    def _create_tables(self):`);
    for (const table of config.tables) {
      lines.push(...generateTableCreation(table, "        "));
    }
    lines.push(`        self.db.commit()`);
    lines.push("");
  }

  for (const cmd of config.commands) {
    lines.push(...generateSlashCommand(cmd, config));
    lines.push("");
  }

  // Autocomplete handlers
  if (autocompleteConfigs && autocompleteConfigs.length > 0) {
    for (const ac of autocompleteConfigs) {
      const cmd = config.commands.find((c) => c.id === ac.commandId);
      if (!cmd) continue;
      lines.push(...generateAutocomplete(ac, cmd, config));
      lines.push("");
    }
  }

  // Event listeners
  for (const listener of config.listeners) {
    lines.push(...generateEventListener(listener));
    lines.push("");
  }

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

  lines.push(`    @discord.slash_command(name=${JSON.stringify(cmd.name)}, description=${JSON.stringify(cmd.description)})`);

  const params = ["self", "ctx: discord.ApplicationContext"];
  for (const opt of cmd.options) {
    const optType = getOptionType(opt.type);
    params.push(`${opt.name}: ${optType}`);
  }
  lines.push(`    async def ${cmd.name}(${params.join(", ")}):`);

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

function generateAutocomplete(ac: AutocompleteConfig, cmd: SlashCommand, config: CogConfig): string[] {
  const lines: string[] = [];
  const fnName = `${cmd.name}_${ac.optionName}_autocomplete`;

  lines.push(`    @${cmd.name}.autocomplete(${JSON.stringify(ac.optionName)})`);
  lines.push(`    async def ${fnName}(self, ctx: discord.AutocompleteContext):`);
  lines.push(`        value = ctx.value.lower() if ctx.value else ""`);

  if (ac.source === "static") {
    lines.push(`        choices = [`);
    for (const choice of ac.staticChoices || []) {
      lines.push(`            discord.OptionChoice(name=${JSON.stringify(choice.name)}, value=${JSON.stringify(choice.value)}),`);
    }
    lines.push(`        ]`);
    lines.push(`        return [c for c in choices if value in c.name.lower()][:25]`);
  } else if (ac.source === "database") {
    const table = ac.dbTable || config.tables[0]?.name || "table";
    const column = ac.dbColumn || "name";
    lines.push(`        cursor = self.db.execute(`);
    lines.push(`            "SELECT ${column} FROM ${table} WHERE LOWER(${column}) LIKE ?",`);
    lines.push(`            (f"%{value}%",)`);
    lines.push(`        )`);
    lines.push(`        rows = cursor.fetchall()`);
    lines.push(`        return [`);
    lines.push(`            discord.OptionChoice(name=row[0], value=row[0])`);
    lines.push(`            for row in rows[:25]`);
    lines.push(`        ]`);
  } else {
    lines.push(`        # TODO: Implement API call for autocomplete`);
    lines.push(`        return []`);
  }

  return lines;
}

function generateEventListener(listener: EventListener): string[] {
  const lines: string[] = [];
  const eventHandlers: Record<string, { params: string; body: string[] }> = {
    on_message: {
      params: "self, message: discord.Message",
      body: [
        "        if message.author.bot:",
        "            return",
        '        # Deine Logik hier',
      ],
    },
    on_member_join: {
      params: "self, member: discord.Member",
      body: [
        '        # Willkommensnachricht senden',
        '        channel = member.guild.system_channel',
        '        if channel:',
        '            await channel.send(f"Willkommen {member.mention}!")',
      ],
    },
    on_member_remove: {
      params: "self, member: discord.Member",
      body: [
        '        # Verabschiedung',
        '        channel = member.guild.system_channel',
        '        if channel:',
        '            await channel.send(f"{member.name} hat den Server verlassen.")',
      ],
    },
    on_reaction_add: {
      params: "self, reaction: discord.Reaction, user: discord.User",
      body: [
        "        if user.bot:",
        "            return",
        '        # Reaktions-Logik hier',
      ],
    },
    on_reaction_remove: {
      params: "self, reaction: discord.Reaction, user: discord.User",
      body: [
        '        # Reaktion entfernt',
      ],
    },
    on_voice_state_update: {
      params: "self, member: discord.Member, before: discord.VoiceState, after: discord.VoiceState",
      body: [
        '        # Voice-State Änderung',
      ],
    },
    on_interaction: {
      params: "self, interaction: discord.Interaction",
      body: [],
    },
    on_message_delete: {
      params: "self, message: discord.Message",
      body: ['        # Nachricht gelöscht — z.B. loggen'],
    },
    on_message_edit: {
      params: "self, before: discord.Message, after: discord.Message",
      body: ['        # Nachricht bearbeitet'],
    },
    on_guild_channel_create: {
      params: "self, channel: discord.abc.GuildChannel",
      body: ['        # Neuer Channel erstellt'],
    },
    on_guild_channel_delete: {
      params: "self, channel: discord.abc.GuildChannel",
      body: ['        # Channel gelöscht'],
    },
    on_guild_role_create: {
      params: "self, role: discord.Role",
      body: ['        # Neue Rolle erstellt'],
    },
    on_guild_role_delete: {
      params: "self, role: discord.Role",
      body: ['        # Rolle gelöscht'],
    },
    on_invite_create: {
      params: "self, invite: discord.Invite",
      body: ['        # Einladung erstellt'],
    },
    on_thread_create: {
      params: "self, thread: discord.Thread",
      body: ['        # Thread erstellt'],
    },
  };

  const handler = eventHandlers[listener.event];
  if (!handler) return lines;

  lines.push(`    @commands.Cog.listener()`);
  lines.push(`    async def ${listener.event}(${handler.params}):`);

  if (listener.event === "on_interaction" && listener.customIdPattern) {
    const pattern = listener.customIdPattern;
    if (pattern.includes("*")) {
      const prefix = pattern.replace("*", "");
      lines.push(`        if not interaction.custom_id or not interaction.custom_id.startswith(${JSON.stringify(prefix)}):`);
    } else {
      lines.push(`        if not interaction.custom_id or interaction.custom_id != ${JSON.stringify(pattern)}:`);
    }
    lines.push(`            return`);
    lines.push(`        await interaction.response.send_message("Handled!", ephemeral=True)`);
  } else {
    lines.push(...handler.body);
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

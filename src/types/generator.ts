export type OptionType =
  | "string"
  | "integer"
  | "boolean"
  | "number"
  | "user"
  | "channel"
  | "role"
  | "mentionable"
  | "attachment";

export interface CommandOption {
  id: string;
  name: string;
  description: string;
  type: OptionType;
  required: boolean;
  choices?: { name: string; value: string }[];
}

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  options: CommandOption[];
  hasModal: boolean;
  modalId?: string;
  hasSqlite: boolean;
  responseType: "message" | "embed" | "components_v2";
}

export interface ModalField {
  id: string;
  label: string;
  placeholder: string;
  style: "short" | "paragraph";
  required: boolean;
  custom_id: string;
  min_length?: number;
  max_length?: number;
}

export interface Modal {
  id: string;
  title: string;
  custom_id: string;
  fields: ModalField[];
}

export interface SqliteTable {
  id: string;
  name: string;
  columns: SqliteColumn[];
}

export interface SqliteColumn {
  id: string;
  name: string;
  type: "TEXT" | "INTEGER" | "REAL" | "BLOB";
  primary_key: boolean;
  not_null: boolean;
  default_value?: string;
}

export interface CogConfig {
  cogName: string;
  commands: SlashCommand[];
  modals: Modal[];
  tables: SqliteTable[];
  listeners: EventListener[];
}

export interface EventListener {
  id: string;
  event: string;
  customIdPattern?: string;
}

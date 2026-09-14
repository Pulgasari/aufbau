// @aufbau/gui central type notations

export type FieldType =
  | 'text' | 'color' | 'boolean' | 'integer' | 'number' | 'angle'
  | 'duration' | 'year' | 'date' | 'datetime' | 'time'
  | 'email' | 'password' | 'phone' | 'url';

// a bare value, or an explicit [value, label] pair
export type Option = string | [value: string, label: string];

export interface FieldSpec {
  type?: FieldType;
  label?: string;
  default?: unknown;
  values?: Option[];            // presence turns the field into a picker
  look?: string;                // widget hint, e.g. 'combobox' | 'segments' | 'stepper' | 'swatch'
  min?: number | string;
  max?: number | string;
  step?: number | string;
  unit?: string;
}

export type Spec = Record<string, FieldSpec>;

export interface RenderOptions {
  format?: 'element' | 'html';
  values?: Record<string, unknown>;
  wrap?: string | false;
  onChange?: (values: Record<string, unknown>, name: string | null, event: Event) => void;
}

export function render (spec: Spec, options?: RenderOptions & { format?: 'element' }): DocumentFragment | HTMLElement;
export function render (spec: Spec, options: RenderOptions & { format: 'html' }): string;
export function field (key: string, spec: FieldSpec, value?: unknown, options?: { format?: 'element' | 'html' }): HTMLElement | string;
export function readValues (container: ParentNode, spec: Spec): Record<string, unknown>;

declare const gui: {
  field: typeof field;
  readValues: typeof readValues;
  render: typeof render;
};

export default gui;

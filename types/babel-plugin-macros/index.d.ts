declare module 'babel-plugin-macros' {
  import { NodePath } from '@babel/traverse';
  export interface References {
    [name: string]: NodePath[]
  }
  export type MacroFunction = (inputs: { references: References }) => void;
  export function createMacro(f: MacroFunction): any;
  export class MacroError extends Error {}
}

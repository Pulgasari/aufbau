export declare const TAGS: readonly string[];

export declare function autoloader (options?: { base?: string | URL, root?: Document | Element }): () => void;
export declare function load (tag: string): Promise<unknown | null>;
export declare function pathOf (tag: string): string;
export declare function registerAll (): Promise<unknown[]>;

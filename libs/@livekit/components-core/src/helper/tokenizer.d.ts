export type TokenizeGrammar = {
    [type: string]: RegExp;
};
export declare const createDefaultGrammar: () => {
    email: RegExp;
    url: RegExp;
};
export declare function tokenize<T extends TokenizeGrammar>(input: string, grammar: T): any[];
//# sourceMappingURL=tokenizer.d.ts.map
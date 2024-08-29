import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/nz_com_tact.tact',
    options: {
        debug: false,
    },
};

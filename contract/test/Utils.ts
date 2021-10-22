export const SPACE_INFO: Space = {
  name: 'Yam Finance',
  spec: 'YAM',
  chainId: 42,
};

export interface Space {
  name: string;
  spec: string;
  chainId: number;
}

export const PROPOSAL_INFO: Proposal = {
  title: 'BABY: Buyback and Build Yearn',
  content:
    '"authors": "@lehnberg, @milkyklim",\n' +
    '    "summary": "",\n' +
    '    "abstract": "",\n' +
    '    "motivation": "",\n' +
    '    "specification": "",\n' +
    '    "references": "1. https://gov.yearn.finance/t/yip-54-formalize-operations-funding/"',
  options: ['yes', 'no'],
  privateLevel: 8,
  chainhooks: [], // no callback function provided.
};

export interface Proposal {
  title: string;
  content: string;
  options: Array<string>;
  privateLevel: number;
  chainhooks: Array<CallbackInfo>;
}

export interface CallbackInfo {
  callback_type: string;
  function_name: string;
  function_args: Array<string>;
  function_vals: Array<string>;
}

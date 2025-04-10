// /**
//  * Bitcoin RPC Response Types
//  * @see https://developer.bitcoin.org/reference/rpc/
//  */

// /**
//  * Response type for getblockchaininfo RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getblockchaininfo.html
//  */
// export interface BlockchainInfo {
//   /** The current network name as defined in BIP70 (main, test, regtest) */
//   chain: string;
//   /** The current number of blocks processed in the server */
//   blocks: number;
//   /** The current number of headers we have validated */
//   headers: number;
//   /** The hash of the currently best block */
//   bestblockhash: string;
//   /** The current difficulty */
//   difficulty: number;
//   /** Median time for the current best block */
//   mediantime: number;
//   /** Estimate of verification progress [0..1] */
//   verificationprogress: number;
//   /** Estimate of whether this node is in Initial Block Download mode */
//   initialblockdownload: boolean;
//   /** Total amount of work in active chain, in hexadecimal */
//   chainwork: string;
//   /** The estimated size of the block and undo files on disk */
//   size_on_disk: number;
//   /** If the blocks are subject to pruning */
//   pruned: boolean;
//   /** Lowest-height complete block stored (only present if pruning is enabled) */
//   pruneheight?: number;
//   /** Whether automatic pruning is enabled (only present if pruning is enabled) */
//   automatic_pruning?: boolean;
//   /** The target size used by pruning (only present if automatic pruning is enabled) */
//   prune_target_size?: number;
//   /** Status of softforks in progress */
//   softforks: {
//     [forkName: string]: {
//       /** Name of the softfork */
//       type: string;
//       /** True if the softfork is active */
//       active: boolean;
//       /** Height of the first block which the new rules are enforced */
//       height: number;
//     };
//   };
//   /** Status of BIP9 softforks in progress */
//   bip9_softforks: {
//     [forkName: string]: {
//       /** One of "defined", "started", "locked_in", "active", "failed" */
//       status: string;
//       /** Height of the first block which the new rules are enforced */
//       startTime: number;
//       /** Timeout/expiry block height */
//       timeout: number;
//       /** The length of blocks of the BIP9 signalling period */
//       period: number;
//       /** The number of blocks with the version bit set required to activate the feature */
//       threshold: number;
//       /** Number of blocks remaining in the current period */
//       since: number;
//       /** Array of block heights where the version bit was set */
//       statistics: {
//         period: number;
//         threshold: number;
//         elapsed: number;
//         count: number;
//         possible: boolean;
//       };
//     };
//   };
// }

// /**
//  * Response type for getnetworkinfo RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getnetworkinfo.html
//  */
// export interface NetworkInfo {
//   /** The server version */
//   version: number;
//   /** The server subversion string */
//   subversion: string;
//   /** The protocol version */
//   protocolversion: number;
//   /** The services we offer to the network */
//   localservices: string;
//   /** The services we offer to the network with their reachability status */
//   localservicesnames: string[];
//   /** True if transaction relay is requested from peers */
//   localrelay: boolean;
//   /** Minimum relay fee rate in BTC/kB for transactions we relay and mine */
//   timeoffset: number;
//   /** The number of connections */
//   connections: number;
//   /** The number of inbound connections */
//   connections_in: number;
//   /** The number of outbound connections */
//   connections_out: number;
//   /** Whether p2p networking is enabled */
//   networkactive: boolean;
//   /** Information per network */
//   networks: {
//     /** Network (ipv4, ipv6 or onion) */
//     name: string;
//     /** Is the network limited using -onlynet? */
//     limited: boolean;
//     /** Is the network reachable? */
//     reachable: boolean;
//     /** The proxy that is used for this network, or empty if none */
//     proxy: string;
//     /** Whether randomized credentials are used */
//     proxy_randomize_credentials: boolean;
//   }[];
//   /** Minimum relay fee rate in BTC/kB for transactions we relay and mine */
//   relayfee: number;
//   /** Minimum fee rate increment for mempool limiting or BIP 125 replacement in BTC/kB */
//   incrementalfee: number;
//   /** List of local addresses */
//   localaddresses: {
//     /** Network address */
//     address: string;
//     /** Network port */
//     port: number;
//     /** Relative score */
//     score: number;
//   }[];
//   /** Any network and blockchain warnings */
//   warnings: string;
// }

// /**
//  * Response type for getwalletinfo RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getwalletinfo.html
//  */
// export interface WalletInfo {
//   /** The wallet name */
//   walletname: string;
//   /** The wallet version */
//   walletversion: number;
//   /** The database format (bdb or sqlite) */
//   format: string;
//   /** The total number of transactions in the wallet */
//   txcount: number;
//   /** The UNIX epoch time of the oldest pre-generated key in the key pool */
//   keypoololdest: number;
//   /** How many new keys are pre-generated (only counts external keys) */
//   keypoolsize: number;
//   /** How many new keys are pre-generated for internal use (used for change outputs) */
//   keypoolsize_hd_internal: number;
//   /** The UNIX epoch time until which the wallet is unlocked for transfers, or 0 if the wallet is locked */
//   unlocked_until?: number;
//   /** The transaction fee configuration, set in BTC/kvB */
//   paytxfee: number;
//   /** The Hash160 of the HD seed (only present when HD is enabled) */
//   hdseedid?: string;
//   /** False if privatekeys are disabled for this wallet (enforced watch-only wallet) */
//   private_keys_enabled: boolean;
//   /** Whether this wallet tracks clean/dirty coins in terms of reuse */
//   avoid_reuse: boolean;
//   /** Current scanning details, or false if no scan is in progress */
//   scanning:
//     | {
//         /** Elapsed seconds since scan start */
//         duration: number;
//         /** Scanning progress percentage [0.0, 1.0] */
//         progress: number;
//       }
//     | false;
//   /** Whether this wallet uses descriptors for scriptPubKey management */
//   descriptors: boolean;
// }

// /**
//  * Response type for listwallets RPC
//  * @see https://developer.bitcoin.org/reference/rpc/listwallets.html
//  */
// export type ListWalletsResponse = string[];

// /**
//  * Response type for createwallet RPC
//  * @see https://developer.bitcoin.org/reference/rpc/createwallet.html
//  */
// export interface CreateWalletResponse {
//   /** The wallet name if created successfully */
//   name: string;
//   /** Warning message if any */
//   warning: string;
// }

// /**
//  * Response type for importdescriptors RPC
//  * @see https://developer.bitcoin.org/reference/rpc/importdescriptors.html
//  */
// export interface ImportDescriptorsResponse {
//   /** Whether the import was successful */
//   success: boolean;
//   /** Array of warning messages if any */
//   warnings?: string[];
// }

// /**
//  * Response type for scantxoutset RPC
//  * @see https://developer.bitcoin.org/reference/rpc/scantxoutset.html
//  */
// export interface ScanTxOutSetResponse {
//   /** Whether the scan was successful */
//   success: boolean;
//   /** Number of items searched */
//   searched_items: number;
//   /** Array of unspent transaction outputs */
//   unspents: {
//     /** Transaction ID */
//     txid: string;
//     /** Output index */
//     vout: number;
//     /** Script public key */
//     scriptPubKey: string;
//     /** Descriptor */
//     desc: string;
//     /** Amount in BTC */
//     amount: number;
//     /** Block height */
//     height: number;
//   }[];
//   /** Total amount of found unspent outputs */
//   total_amount: number;
// }

// /**
//  * Response type for getblockhash RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getblockhash.html
//  */
// export type GetBlockHashResponse = string;

// /**
//  * Response type for getblockcount RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getblockcount.html
//  */
// export type GetBlockCountResponse = number;

// /**
//  * Response type for getblock RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getblock.html
//  */
// export interface GetBlockResponse {
//   /** The block hash */
//   hash: string;
//   /** The number of confirmations */
//   confirmations: number;
//   /** The block size */
//   size: number;
//   /** The block weight */
//   weight: number;
//   /** The block height */
//   height: number;
//   /** The block version */
//   version: number;
//   /** The block version in hex */
//   versionHex: string;
//   /** The block merkle root */
//   merkleroot: string;
//   /** The block time */
//   time: number;
//   /** The block median time */
//   mediantime: number;
//   /** The block nonce */
//   nonce: number;
//   /** The block bits */
//   bits: string;
//   /** The block difficulty */
//   difficulty: number;
//   /** The block chainwork */
//   chainwork: string;
//   /** The number of transactions in the block */
//   nTx: number;
//   /** The previous block hash */
//   previousblockhash: string;
//   /** The next block hash */
//   nextblockhash?: string;
//   /** The block stripped size */
//   strippedsize: number;
//   /** The block tx */
//   tx: string[] | GetRawTransactionResponse[]; // for verbosity 2, we get the full tx details
// }

// /**
//  * Response type for getblockheader RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getblockheader.html
//  */
// export interface GetBlockHeaderResponse {
//   /** The block hash */
//   hash: string;
//   /** The number of confirmations */
//   confirmations: number;
//   /** The block height */
//   height: number;
//   /** The block version */
//   version: number;
//   /** The block version in hex */
//   versionHex: string;
//   /** The block merkle root */
//   merkleroot: string;
//   /** The block time */
//   time: number;
//   /** The block median time */
//   mediantime: number;
//   /** The block nonce */
//   nonce: number;
//   /** The block bits */
//   bits: string;
//   /** The block difficulty */
//   difficulty: number;
//   /** The block chainwork */
//   chainwork: string;
//   /** The previous block hash */
//   previousblockhash: string;
//   /** The next block hash */
//   nextblockhash?: string;
// }

// /**
//  * Response type for getmempoolinfo RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getmempoolinfo.html
//  */
// export interface GetMempoolInfoResponse {
//   /** Whether the mempool is loaded */
//   loaded: boolean;
//   /** The current mempool size */
//   size: number;
//   /** The number of transactions in the mempool */
//   bytes: number;
//   /** The mempool usage in bytes */
//   usage: number;
//   /** The maximum mempool size in bytes */
//   maxmempool: number;
//   /** The minimum relay fee for transactions */
//   mempoolminfee: number;
//   /** The minimum fee for transactions to be accepted */
//   minrelaytxfee: number;
// }

// /**
//  * Response type for getrawmempool RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getrawmempool.html
//  */
// export interface GetRawMempoolResponse {
//   /** The transaction id */
//   [txid: string]: {
//     /** The transaction size */
//     size: number;
//     /** The transaction fee */
//     fee: number;
//     /** The transaction time */
//     time: number;
//     /** The transaction height */
//     height: number;
//     /** The transaction descendant count */
//     descendantcount: number;
//     /** The transaction descendant size */
//     descendantsize: number;
//     /** The transaction descendant fees */
//     descendantfees: number;
//     /** The transaction ancestor count */
//     ancestorfees: number;
//     /** The transaction ancestor size */
//     ancestorsize: number;
//     /** The transaction ancestor count */
//     ancestorcount: number;
//     /** The transaction weight */
//     weight: number;
//     /** Whether the transaction depends on unconfirmed inputs */
//     depends: string[];
//   };
// }

// /**
//  * Response type for gettxout RPC
//  * @see https://developer.bitcoin.org/reference/rpc/gettxout.html
//  */
// export interface GetTxOutResponse {
//   /** The transaction output value */
//   value: number;
//   /** The script public key */
//   scriptPubKey: {
//     /** The script public key asm */
//     asm: string;
//     /** The script public key hex */
//     hex: string;
//     /** The required signatures */
//     reqSigs: number;
//     /** The script type */
//     type: string;
//     /** The addresses */
//     addresses: string[];
//   };
//   /** The coinbase flag */
//   coinbase: boolean;
//   /** The confirmations */
//   confirmations: number;
// }

// /**
//  * Response type for gettxoutsetinfo RPC
//  * @see https://developer.bitcoin.org/reference/rpc/gettxoutsetinfo.html
//  */
// export interface GetTxOutSetInfoResponse {
//   /** The current block height */
//   height: number;
//   /** The best block hash */
//   bestblock: string;
//   /** The number of transactions */
//   transactions: number;
//   /** The number of transaction outputs */
//   txouts: number;
//   /** The database format */
//   bogosize: number;
//   /** The hash serialized */
//   hash_serialized_2: string;
//   /** The disk size */
//   disk_size: number;
//   /** The total amount */
//   total_amount: number;
// }

// /**
//  * Response type for getchaintxstats RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getchaintxstats.html
//  */
// export interface GetChainTxStatsResponse {
//   /** The timestamp for the statistics */
//   time: number;
//   /** The number of transactions */
//   txcount: number;
//   /** The window final block hash */
//   window_final_block_hash: string;
//   /** The window block count */
//   window_block_count: number;
//   /** The window tx count */
//   window_tx_count: number;
//   /** The window interval */
//   window_interval: number;
//   /** The tx rate */
//   txrate: number;
// }

// /**
//  * Response type for getmempoolancestors RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getmempoolancestors.html
//  */
// export interface GetMempoolAncestorsResponse {
//   /** The transaction id */
//   [txid: string]: {
//     /** The transaction size */
//     size: number;
//     /** The transaction fee */
//     fee: number;
//     /** The transaction time */
//     time: number;
//     /** The transaction height */
//     height: number;
//     /** The transaction descendant count */
//     descendantcount: number;
//     /** The transaction descendant size */
//     descendantsize: number;
//     /** The transaction descendant fees */
//     descendantfees: number;
//     /** The transaction ancestor count */
//     ancestorfees: number;
//     /** The transaction ancestor size */
//     ancestorsize: number;
//     /** The transaction ancestor count */
//     ancestorcount: number;
//     /** The transaction weight */
//     weight: number;
//     /** Whether the transaction depends on unconfirmed inputs */
//     depends: string[];
//   };
// }

// /**
//  * Response type for getmempooldescendants RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getmempooldescendants.html
//  */
// export interface GetMempoolDescendantsResponse {
//   /** The transaction id */
//   [txid: string]: {
//     /** The transaction size */
//     size: number;
//     /** The transaction fee */
//     fee: number;
//     /** The transaction time */
//     time: number;
//     /** The transaction height */
//     height: number;
//     /** The transaction descendant count */
//     descendantcount: number;
//     /** The transaction descendant size */
//     descendantsize: number;
//     /** The transaction descendant fees */
//     descendantfees: number;
//     /** The transaction ancestor count */
//     ancestorfees: number;
//     /** The transaction ancestor size */
//     ancestorsize: number;
//     /** The transaction ancestor count */
//     ancestorcount: number;
//     /** The transaction weight */
//     weight: number;
//     /** Whether the transaction depends on unconfirmed inputs */
//     depends: string[];
//   };
// }

// /**
//  * Response type for getmempoolentry RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getmempoolentry.html
//  */
// export interface GetMempoolEntryResponse {
//   /** The transaction size */
//   size: number;
//   /** The transaction fee */
//   fee: number;
//   /** The transaction time */
//   time: number;
//   /** The transaction height */
//   height: number;
//   /** The transaction descendant count */
//   descendantcount: number;
//   /** The transaction descendant size */
//   descendantsize: number;
//   /** The transaction descendant fees */
//   descendantfees: number;
//   /** The transaction ancestor count */
//   ancestorfees: number;
//   /** The transaction ancestor size */
//   ancestorsize: number;
//   /** The transaction ancestor count */
//   ancestorcount: number;
//   /** The transaction weight */
//   weight: number;
//   /** Whether the transaction depends on unconfirmed inputs */
//   depends: string[];
// }

// /**
//  * Response type for getrawtransaction RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getrawtransaction.html
//  */
// export interface GetRawTransactionResponse {
//   /** The serialized, hex-encoded data for the transaction */
//   hex: string;
//   /** The transaction id */
//   txid: string;
//   /** The transaction hash (differs from txid for witness transactions) */
//   hash: string;
//   /** The serialized transaction size */
//   size: number;
//   /** The virtual transaction size (differs from size for witness transactions) */
//   vsize: number;
//   /** The transaction's weight (between vsize*4-3 and vsize*4) */
//   weight: number;
//   /** The version */
//   version: number;
//   /** The lock time */
//   locktime: number;
//   /** Array of transaction inputs */
//   vin: {
//     /** The transaction id */
//     txid: string;
//     /** The output number */
//     vout: number;
//     /** The script */
//     scriptSig: {
//       /** The asm */
//       asm: string;
//       /** The hex */
//       hex: string;
//     };
//     /** The script sequence number */
//     sequence: number;
//     /** Whether this is a coinbase transaction */
//     coinbase?: string;
//   }[];
//   /** Array of transaction outputs */
//   vout: {
//     /** The value in BTC */
//     value: number;
//     /** The output number */
//     n: number;
//     /** The script public key */
//     scriptPubKey: {
//       /** The asm */
//       asm: string;
//       /** The hex */
//       hex: string;
//       /** The required signatures */
//       reqSigs?: number;
//       /** The type */
//       type: string;
//       /** The addresses */
//       addresses?: string[];
//     };
//   }[];
//   /** The block hash */
//   blockhash: string;
//   /** The number of confirmations */
//   confirmations: number;
//   /** The transaction time in seconds since epoch */
//   time: number;
//   /** The block time in seconds since epoch */
//   blocktime: number;
// }

// /**
//  * Response type for gettxoutproof RPC
//  * @see https://developer.bitcoin.org/reference/rpc/gettxoutproof.html
//  */
// export type GetTxOutProofResponse = string;

// /**
//  * Response type for importprunedfunds RPC
//  * @see https://developer.bitcoin.org/reference/rpc/importprunedfunds.html
//  */
// export interface ImportPrunedFundsResponse {
//   /** Whether the import was successful */
//   success: boolean;
// }

// /**
//  * Response type for listunspent RPC
//  * @see https://developer.bitcoin.org/reference/rpc/listunspent.html
//  */
// export interface ListUnspentResponseItem {
//   /** The transaction id */
//   txid: string;
//   /** The output number */
//   vout: number;
//   /** The bitcoin address */
//   address: string;
//   /** The associated label, or "" for the default label */
//   label: string;
//   /** The script key */
//   scriptPubKey: string;
//   /** The transaction output amount in BTC */
//   amount: number;
//   /** The number of confirmations */
//   confirmations: number;
//   /** The redeemscript if scriptPubKey is P2SH */
//   redeemScript?: string;
//   /** The witness script if scriptPubKey is P2WSH */
//   witnessScript?: string;
//   /** Whether we have the private keys to spend this output */
//   spendable: boolean;
//   /** Whether we know how to spend this output, ignoring the lack of keys */
//   solvable: boolean;
//   /** Whether this output is reused */
//   reused?: boolean;
//   /** The descriptor if known */
//   desc?: string;
//   /** Whether this output is considered safe to spend */
//   safe: boolean;
// }

// export type ListUnspentResponse = ListUnspentResponseItem[];

// /**
//  * Response type for rescanblockchain RPC
//  * @see https://developer.bitcoin.org/reference/rpc/rescanblockchain.html
//  */
// export interface RescanBlockchainResponse {
//   /** The block height where the rescan started */
//   start_height: number;
//   /** The block height where the rescan stopped */
//   stop_height: number;
// }

// /**
//  * Response type for unloadwallet RPC
//  * @see https://developer.bitcoin.org/reference/rpc/unloadwallet.html
//  */
// export interface UnloadWalletResponse {
//   /** Warning message if any */
//   warning?: string;
// }

// /**
//  * Response type for generatetoaddress RPC
//  * @see https://developer.bitcoin.org/reference/rpc/generatetoaddress.html
//  */
// export type GenerateToAddressResponse = string[];

// /**
//  * Response type for generatetodescriptor RPC
// /**
//  * Response type for getaddressinfo RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getaddressinfo.html
//  */
// export type GenerateToDescriptorResponse = string[];
// export interface GetAddressInfoResponse {
//   /** The bitcoin address validated */
//   address: string;
//   /** The hex-encoded scriptPubKey generated by the address */
//   scriptPubKey: string;
//   /** If the address is yours */
//   ismine: boolean;
//   /** If the address is watch-only */
//   iswatchonly: boolean;
//   /** If the key is a script */
//   isscript: boolean;
//   /** If the script is a witness script */
//   iswitness: boolean;
//   /** The version number of the witness program */
//   witness_version?: number;
//   /** The hex value of the witness program */
//   witness_program?: string;
//   /** The output script type. Only if isscript is true and the redeemscript is known */
//   script?: string;
//   /** The redeemscript for the p2sh address */
//   hex?: string;
//   /** Array of pubkeys associated with the known redeemscript */
//   pubkeys?: string[];
//   /** The number of signatures required to spend multisig output */
//   sigsrequired?: number;
//   /** The hex-encoded public key */
//   pubkey?: string;
//   /** If the address is compressed */
//   iscompressed?: boolean;
//   /** The account this address belongs to */
//   label: string;
//   /** The creation time of the key, if available, seconds since UNIX epoch */
//   timestamp?: number;
//   /** The HD keypath, if the key is HD and available */
//   hdkeypath?: string;
//   /** The HD master key fingerprint */
//   hdseedid?: string;
//   /** The HD master key fingerprint this key was generated with */
//   hdmasterfingerprint?: string;
//   /** Array of labels associated with the address */
//   labels: {
//     /** The label name */
//     name: string;
//     /** The purpose of the address */
//     purpose: string;
//   }[];
// }

// /**
//  * Response type for getbalance RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getbalance.html
//  */
// export type GetBalanceResponse = number; /** The total amount in BTC */

// /**
//  * Response type for fundrawtransaction RPC
//  * @see https://developer.bitcoin.org/reference/rpc/fundrawtransaction.html
//  */
// export interface FundRawTransactionResponse {
//   /** The resulting raw transaction (hex-encoded string) */
//   hex: string;
//   /** Fee in BTC the resulting transaction pays */
//   fee: number;
//   /** Position of the added change output, or -1 */
//   changepos: number;
// }

// /**
//  * Response type for sendrawtransaction RPC
//  * @see https://developer.bitcoin.org/reference/rpc/sendrawtransaction.html
//  */
// export interface SendRawTransactionResponse {
//   /** The transaction hash in hex */
//   txid: string;
// }

// /**
//  * Response type for loadwallet RPC
//  * @see https://developer.bitcoin.org/reference/rpc/loadwallet.html
//  */
// export interface LoadWalletResponse {
//   /** The wallet name if loaded successfully */
//   name: string;
//   /** Warning message if there was a warning */
//   warning?: string;
// }

// /**
//  * Response type for gettransaction RPC
//  * @see https://developer.bitcoin.org/reference/rpc/gettransaction.html
//  */
// export interface GetTransactionResponse {
//   /** The amount in BTC */
//   amount: number;
//   /** The amount of the fee in BTC. This is negative and only available for the 'send' category of transactions */
//   fee?: number;
//   /** The number of confirmations for the transaction. Negative confirmations means the transaction conflicted that many blocks ago */
//   confirmations: number;
//   /** Only present if transaction only input is a coinbase one */
//   generated?: boolean;
//   /** Only present if we consider transaction to be trusted and so safe to spend from */
//   trusted?: boolean;
//   /** The block hash containing the transaction */
//   blockhash?: string;
//   /** The block height containing the transaction */
//   blockheight?: number;
//   /** The index of the transaction in the block that includes it */
//   blockindex?: number;
//   /** The block time expressed in UNIX epoch time */
//   blocktime?: number;
//   /** The transaction id */
//   txid: string;
//   /** Conflicting transaction ids */
//   walletconflicts: string[];
//   /** The transaction time expressed in UNIX epoch time */
//   time: number;
//   /** The time received expressed in UNIX epoch time */
//   timereceived: number;
//   /** If a comment is associated with the transaction, only present if not empty */
//   comment?: string;
//   /** Whether this transaction could be replaced due to BIP125 (replace-by-fee); may be unknown for unconfirmed transactions not in the mempool */
//   'bip125-replaceable': 'yes' | 'no' | 'unknown';
//   /** Transaction details */
//   details: {
//     /** Only returns true if imported addresses were involved in transaction */
//     involvesWatchonly?: boolean;
//     /** The bitcoin address involved in the transaction */
//     address?: string;
//     /** The transaction category */
//     category: 'send' | 'receive' | 'generate' | 'immature' | 'orphan';
//     /** The amount in BTC */
//     amount: number;
//     /** A comment for the address/transaction, if any */
//     label?: string;
//     /** The vout value */
//     vout: number;
//     /** The amount of the fee in BTC. This is negative and only available for the 'send' category of transactions */
//     fee?: number;
//     /** 'true' if the transaction has been abandoned (inputs are respendable). Only available for the 'send' category of transactions */
//     abandoned?: boolean;
//   }[];
//   /** Raw data for transaction */
//   hex: string;
//   /** Optional, the decoded transaction (only present when verbose is passed) */
//   decoded?: GetRawTransactionResponse;
// }

// /**
//  * Response type for estimatesmartfee RPC
//  * @see https://developer.bitcoin.org/reference/rpc/estimatesmartfee.html
//  */
// export interface EstimateSmartFeeResponse {
//   /** Estimate fee rate in BTC/kB (only present if no errors were encountered) */
//   feerate?: number;
//   /** Errors encountered during processing (if there are any) */
//   errors?: string[];
//   /** Block number where estimate was found */
//   blocks: number;
// }

// /**
//  * Response type for getdescriptorinfo RPC
//  * @see https://developer.bitcoin.org/reference/rpc/getdescriptorinfo.html
//  */
// export interface GetDescriptorInfoResponse {
//   /** The descriptor in canonical form, without private keys  */
//   descriptor: string;
//   /** The checksum for the input descriptor */
//   checksum: string;
//   /** Whether the descriptor is ranged */
//   isrange: boolean;
//   /** Whether the descriptor is solvable */
//   issolvable: boolean;
//   /** Whether the input descriptor contained at least one private key */
//   hasprivatekeys: boolean;
// }

// /**
//  * Response type for listlabels RPC
//  * @see https://developer.bitcoin.org/reference/rpc/listlabels.html
//  */
// export type ListLabelsResponse = string[];

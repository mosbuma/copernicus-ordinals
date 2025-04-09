import fs from 'fs';
import path from 'path';
import { NetworkType } from '@/types';

export type AccountLabel = string;

export interface Account {
  label: string;
  address: string;
  privateKey: string;
  pubkeyXOnly: string;
}

interface NetworkAccounts {
  [key: string]: Account | undefined; // Index by accountlabel
}

interface AccountData {
  [network: string]: NetworkAccounts;
}

export default class AccountStorage {
  private static instance: AccountStorage;
  private accountData: AccountData;
  private readonly filePath: string;

  private constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'wallets.json');

    if (!fs.existsSync(this.filePath)) {
      console.log('Creating wallets.json file');
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
    }

    this.accountData = this.loadAccounts();
  }

  public static getInstance(): AccountStorage {
    if (!AccountStorage.instance) {
      AccountStorage.instance = new AccountStorage();
    }
    return AccountStorage.instance;
  }

  private loadAccounts(): AccountData {
    try {
      if (!fs.existsSync(this.filePath)) {
        return {};
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading wallets:', error);
      return {};
    }
  }

  private saveAccounts(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.filePath, JSON.stringify(this.accountData, null, 2));
    } catch (error) {
      console.error('Error saving wallets:', error);
    }
  }

  public getAccount(network: NetworkType, accountlabel: string): Account | null {
    return this.accountData[network]?.[accountlabel] || null;
  }

  public setAccount(network: NetworkType, account: Account): void {
    if (!this.accountData[network]) {
      this.accountData[network] = {};
    }
    this.accountData[network]![account.label] = account;
    this.saveAccounts();
  }

  public resetAccount(network: NetworkType, accountlabel: string): void {
    if (this.accountData[network]) {
      // for safety, log the old account in a disk file
      const oldAccount = this.accountData[network]![accountlabel];
      const timestamp = new Date().toISOString().replace(/[-:Z]/g, '');
      fs.writeFileSync(
        `data/deleted-${timestamp}-${network}-${accountlabel}.json`,
        JSON.stringify(oldAccount, null, 2)
      );
      delete this.accountData[network]![accountlabel];
      this.saveAccounts();
    }
  }
}

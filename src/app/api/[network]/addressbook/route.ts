import { NextResponse } from 'next/server';
import { Network } from '@/app/lib/networkUtils';
import AccountStorage, { AccountLabel } from '@/lib/accountstorage';
export type AddressBook = {
  name: string;
  address: string;
  pubkeyXOnly: string;
}[];
export interface AddressBookResponse {
  success: boolean;
  addresses: AddressBook;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ network: Network }> }
): Promise<NextResponse<AddressBookResponse>> {
  try {
    const { network } = await params;
    const storage = AccountStorage.getInstance();
    const accountTypes: AccountLabel[] = ['bank', 'trusted', 'untrusted'];

    // Get all wallets for the current network
    const addressBook = accountTypes
      .map((type) => {
        const account = storage.getAccount(network, type);
        if (account) {
          return {
            name: type,
            address: account.address,
            pubkeyXOnly: account.pubkeyXOnly,
          };
        }
        return null;
      })
      .filter((entry) => entry !== null);

    console.log('addressBook', addressBook);

    return NextResponse.json({
      success: true,
      addresses: addressBook,
    });
  } catch (error) {
    console.error('Error fetching address book:', error);
    return NextResponse.json(
      { success: false, addresses: [], error: 'Failed to fetch address book' },
      { status: 500 }
    );
  }
}

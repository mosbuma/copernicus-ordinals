import { useState, useEffect } from 'react';
import { useUnisat } from '@/provider/UniSatProvider';
import { abbreviateHash } from './OrderDetail';
import { api } from '@/utils/api';
import { InscriptionUtxoData } from '@/utils/api-types';

interface InscriptionsModalProps {
  address: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InscriptionsModal({ address, isOpen, onClose }: InscriptionsModalProps) {
  const [inscriptions, setInscriptions] = useState<InscriptionUtxoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { network } = useUnisat();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInscriptions() {
      if (!address || !isOpen) return;

      setLoading(true);
      setError(null);
      try {
        const response = await api.getInscriptions(network, address, {
          cursor: '0',
          limit: 256,
        });

        setInscriptions(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inscriptions');
      } finally {
        setLoading(false);
      }
    }

    fetchInscriptions();
  }, [address, isOpen, network]);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(inscriptions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inscriptions_${abbreviateHash(address)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openInscription = (inscriptionId: string) => {
    const url = `https://ordinals.com/inscription/${inscriptionId}`;
    if (viewerUrl) {
      window.open(url, 'ordinals_viewer');
    } else {
      setViewerUrl(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Inscriptions for {abbreviateHash(address)}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="text-gray-600">Total Inscriptions: {inscriptions.length}</div>
          <button
            onClick={handleDownloadJson}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Download JSON
          </button>
        </div>

        {viewerUrl && (
          <div className="mb-4 h-[300px]">
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0 rounded"
              title="Ordinals Viewer"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : inscriptions.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No inscriptions found</div>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {inscriptions.map((inscription, index) => (
                <button
                  key={inscription.inscriptionId}
                  onClick={() => openInscription(inscription.inscriptionId)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-mono"
                  title={`Inscription #${inscription.inscriptionNumber}`}
                >
                  #{index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

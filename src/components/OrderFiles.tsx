import { InscribeOrderData, InscribeOrderFileData } from '../utils/api-types';
import { useUnisat } from '../provider/UniSatProvider';
import { NetworkType } from '../types';

export function OrderFiles({
  order,
  compact = true,
}: {
  order: InscribeOrderData;
  compact: boolean;
}) {
  const { network } = useUnisat();

  function getLink(inscriptionId: string) {
    return `https://${network === NetworkType.testnet ? 'testnet.' : ''}unisat.io/inscription/${inscriptionId}`;
  }

  const groupedFiles = order.files.reduce(
    (acc, file) => {
      const key = file.status;
      acc[key] = acc[key] || [];
      acc[key].push(file);
      return acc;
    },
    {} as Record<string, InscribeOrderFileData[]>
  );

  if (compact) {
    return (
      <div>
        {Object.entries(groupedFiles).map(([status, files]) => (
          <div key={status}>
            <span>
              {status} - {files.length}
            </span>
          </div>
        ))}
      </div>
    );
  } else {
    return (
      <div className="w-full h-1/3 bg-transparent">
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-gray-500">Inscribed Files</span>
          </div>
        </div>

        <div className="flex flex-col space-y-4 overflow-y-auto max-h-[15vh]">
          {order.files.map((file, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>{file.filename}</span>
              <div className="flex items-center gap-4">
                <span>{file.status}</span>
                {file.inscriptionId && (
                  <a
                    href={getLink(file.inscriptionId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Inscription
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

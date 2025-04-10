// 'use client';

// import { useNetwork } from './networkContext';

// export function useApi() {
//   const { network } = useNetwork();

//   const fetchWithNetwork = async (path: string, options: RequestInit = {}) => {
//     const cleanPath = path.startsWith('/') ? path.slice(1) : path;
//     const url = `/api/${network}/${cleanPath}`;
//     const response = await fetch(url, options);
//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.error || 'API request failed');
//     }
//     return response.json();
//   };

//   return { fetchWithNetwork };
// }

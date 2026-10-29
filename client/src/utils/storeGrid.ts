export type StoreGridRow<T> =
  | { type: 'products'; key: string; products: T[] }
  | { type: 'ad'; key: string };

export const buildStoreGridRows = <T,>(
  products: T[],
  getProductKey: (product: T) => string
): StoreGridRow<T>[] => {
  const productRows: StoreGridRow<T>[] = [];

  for (let index = 0; index < products.length; index += 2) {
    const rowProducts = products.slice(index, index + 2);
    productRows.push({
      type: 'products',
      key: `products-${rowProducts.map(getProductKey).join('-')}`,
      products: rowProducts,
    });
  }

  if (productRows.length === 0) {
    return [{ type: 'ad', key: 'ad-empty-results' }];
  }

  const rowsWithAds: StoreGridRow<T>[] = [];
  productRows.forEach((row, index) => {
    rowsWithAds.push(row);
    const rowNumber = index + 1;
    if (rowNumber % 3 === 0) {
      rowsWithAds.push({ type: 'ad', key: `ad-after-row-${rowNumber}` });
    }
  });

  if (productRows.length < 3) {
    rowsWithAds.push({ type: 'ad', key: 'ad-after-last-product' });
  }

  return rowsWithAds;
};

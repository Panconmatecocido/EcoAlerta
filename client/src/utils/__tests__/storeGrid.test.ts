import { buildStoreGridRows } from '../storeGrid';

const products = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `product-${index + 1}` }));

describe('buildStoreGridRows', () => {
  it('inserts a full-width banner after each three product rows', () => {
    const rows = buildStoreGridRows(products(12), (product) => product.id);

    expect(rows.map((row) => row.type)).toEqual([
      'products',
      'products',
      'products',
      'ad',
      'products',
      'products',
      'products',
      'ad',
    ]);
  });

  it('places a banner one row after the products when there are fewer than three rows', () => {
    const rows = buildStoreGridRows(products(4), (product) => product.id);

    expect(rows.map((row) => row.type)).toEqual(['products', 'products', 'ad']);
    expect(rows[1]).toMatchObject({
      type: 'products',
      products: [{ id: 'product-3' }, { id: 'product-4' }],
    });
  });

  it('shows an ad row when a filter has no matching products', () => {
    expect(buildStoreGridRows([], (product: { id: string }) => product.id)).toEqual([
      { type: 'ad', key: 'ad-empty-results' },
    ]);
  });
});

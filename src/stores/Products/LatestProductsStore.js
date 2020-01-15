import { types } from 'mobx-state-tree';
import Api from 'src/api';
import { ProductModel } from './ProductModel';
import { asyncModel, safeReference } from '../utils';
import { PAGE_SIZE } from '../../constants/product';
import { LatestProductCollection } from '../schema';

export const LatestProductsStore = types
  .model('LatestProductsStore', {
    items: types.array(safeReference(ProductModel)),
    hasNoMore: false,
    fetchLatest: asyncModel(fetchLatest),
    fetchMore: asyncModel(fetchMore, false),
  })
  .actions((store) => ({
    setItems(items) {
      store.items = items;
    },
    setHasNoMore(isHasNoMore) {
      store.hasNoMore = isHasNoMore;
    },
    append(items) {
      if (!Array.isArray(items)) {
        items = [items];
      }

      store.items.push(...items);
    },
  }))
  .views((store) => ({
    searchProducts(searchStr) {
      if (store.items.length) {
        const newArr = store.items.filter((item) =>
          item.title.match(new RegExp(searchStr, 'i')),
        );
        return newArr;
      }
      return [{ title: 'not found', id: 'not found' }];
    },
  }));

function fetchLatest() {
  return async function fetchLatestFlow(flow, store) {
    store.setHasNoMore(false);

    const res = await Api.Products.fetchLatest();

    const results = flow.merge(res.data, LatestProductCollection);

    store.setHasNoMore(res.data.length < PAGE_SIZE);

    store.setItems(results);
  };
}

function fetchMore() {
  return async function fetchMoreFlow(flow, store) {
    if (
      store.fetchLatest.isLoading ||
      store.fetchMore.isLoading ||
      flow.isLoading ||
      store.hasNoMore ||
      store.items.length === 0
    ) {
      return;
    }
    try {
      flow.start();

      const from = store.items[store.items.length - 1];

      const res = await Api.Products.fetchMore({
        from: from.id,
        limit: PAGE_SIZE,
      });

      const results = flow.merge(res.data, LatestProductCollection);

      if (res.data.length < PAGE_SIZE) {
        store.setHasNoMore(true);
      }

      store.append(results);

      flow.success();
    } catch (err) {
      flow.error();
      console.log(err);
    }
  };
}

import {
  applySnapshot,
  getIdentifier,
  getParent,
  getRoot,
  onSnapshot,
  types,
  isStateTreeNode,
  resolveIdentifier,
} from 'mobx-state-tree';
import { normalize } from 'normalizr';
import { AsyncStorage } from 'react-native';
import { useStore } from './createStore';

export function asyncModel(thunk, auto = true) {
  const model = types
    .model('AsyncModel', {
      isLoading: false,
      isError: false,
    })

    .actions((store) => ({
      run(...args) {
        const promise = thunk(...args)(
          store,
          getParent(store),
          getRoot(store),
        );

        if (auto) {
          return store._auto(promise);
        }

        return promise;
      },

      merge(data, schema) {
        const { entities, result } = normalize(data, schema);

        getRoot(store).entities.merge(entities);

        return result;
      },

      async _auto(promise) {
        try {
          store.start();

          await promise;

          store.success();
        } catch (err) {
          store.error(err);
          console.log(err);
        }
      },

      success() {
        store.isLoading = false;
        store.isError = false;
      },

      error() {
        store.isLoading = false;
        store.isError = true;
      },

      start() {
        store.isLoading = true;
        store.isError = false;
      },
    }));

  return types.optional(model, {});
}

export function safeReference(T) {
  return types.reference(T, {
    get(identifier, parent) {
      if (isStateTreeNode(identifier)) {
        identifier = getIdentifier(identifier);
      }

      return resolveIdentifier(T, parent, identifier);
    },
    set(value) {
      return value;
    },
  });
}

export function createPersist(store) {
  onSnapshot(store, (snapshot) => {
    try {
      AsyncStorage.setItem(
        '__persist',
        JSON.stringify({
          auth: {
            isLoggedIn: snapshot.auth.isLoggedIn,
          },
          viewer: {
            user: snapshot.viewer.user,
          },
        }),
      );
    } catch (err) {
      console.log(err);
    }
  });
  async function rehydrate() {
    const snapshot = await AsyncStorage.getItem('__persist');

    if (snapshot) {
      applySnapshot(store, JSON.parse(snapshot));
    }
  }

  return {
    rehydrate,
  };
}

export function createCollection(ofModel, asyncModels = {}) {
  const collection = types
    .model('CollectionModel', {
      collection: types.map(ofModel),
      ...asyncModels,
    })
    .actions((store) => ({
      add(key, value) {
        store.collection.set(String(key), value);
      },

      get(key) {
        return store.collection.get(String(key));
      },
    }));
  return types.optional(collection, {});
}

export function useProductCollection() {
  const store = useStore();
  return store.entities.products;
}

export function useUserCollection() {
  const store = useStore();
  return store.entities.users;
}

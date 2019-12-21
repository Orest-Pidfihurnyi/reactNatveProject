import {
  applySnapshot,
  getParent,
  getRoot,
  onSnapshot,
  types,
} from 'mobx-state-tree';
import { AsyncStorage } from 'react-native';

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
    }))
    .views((store) => ({
      get(key) {
        return store.collection.get(String(key));
      },
    }));

  return types.optional(collection, {});
}

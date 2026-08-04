import type { TExistedEntity } from "~/types/base.type";
import type { TPaginateRequest, TPaginateResponse } from "~/types/fetch.type";

const repositoryFactory = {
  create<T extends TExistedEntity>($api: typeof $fetch, endpoint: string) {
    return {
      getOne(id: string | number) {
        return $api<T>(`${endpoint}/${id}`, {
          method: "get",
        });
      },

      createOne(data: Partial<T>) {
        return $api<T>(endpoint, {
          method: "post",
          body: data,
        });
      },

      updateOne(data: Partial<T>) {
        return $api<T>(`${endpoint}/${data._id}`, {
          method: "patch",
          body: data,
        });
      },

      getAll() {
        return $api<T[]>(endpoint, {
          method: "get",
        });
      },

      getMany(params: any) {
        return $api<TPaginateResponse<T>>(endpoint, {
          method: "get",
          params,
        });
      },

      deleteOne(id: string | number) {
        return $api<void>(`${endpoint}/${id}`, {
          method: "delete",
        });
      },
    };
  },
};

export default repositoryFactory;

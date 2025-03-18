import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

export type ServerNodeResult = {
  success: boolean;
  data: any;
};

/** 添加服务器节点 */
export const addServerNode = (data?: object) => {
  return http.request<ServerNodeResult>("post", baseUrlApi("server/node"), {
    data
  });
};

/** 获取服务器节点列表 */
export const getServerNodes = (params?: object) => {
  return http.request<ServerNodeResult>("get", baseUrlApi("server/nodes"), {
    params
  });
};

/** 更新服务器节点 */
export const updateServerNode = (data?: object) => {
  return http.request<ServerNodeResult>("put", baseUrlApi("server/node"), {
    data
  });
};

/** 删除服务器节点 */
export const deleteServerNode = (id: string) => {
  return http.request<ServerNodeResult>(
    "delete",
    baseUrlApi(`server/node/${id}`)
  );
};

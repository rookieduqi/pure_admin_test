import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

export type ServerNodeResult = {
  success: boolean;
  data: any;
};

export type ServerViewResult = {
  success: boolean;
  data: any;
};

export type ConsoleOutputResult = {
  success: boolean;
  data: any;
};

export type PipelineResult = {
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
  return http.request<ServerNodeResult>("get", baseUrlApi("server/node"), {
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

/** 获取节点视图列表 */
export const getNodeViews = (nodeId: string, data?: object) => {
  return http.request<ServerViewResult>(
    "post",
    baseUrlApi(`server/node_view/get/view`),
    {
      data
    }
  );
};

/** 添加节点视图 */
export const addNodeView = (nodeId: string, data?: object) => {
  return http.request<ServerViewResult>(
    "post",
    baseUrlApi(`server/node_view/${nodeId}/view`),
    {
      data
    }
  );
};

/** 更新节点视图 */
export const updateNodeView = (
  nodeId: string,
  viewId: string,
  data?: object
) => {
  return http.request<ServerViewResult>(
    "put",
    baseUrlApi(`server/node_view/${nodeId}/view/${viewId}`),
    {
      data
    }
  );
};

/** 删除节点视图 */
export const deleteNodeView = (nodeId: string, viewId: string) => {
  return http.request<ServerViewResult>(
    "delete",
    baseUrlApi(`server/node_view/${nodeId}/view/${viewId}`)
  );
};

/** 获取视图Jobs列表 */
export const getViewJobs = (nodeId: string, viewId: string, data?: object) => {
  return http.request<ServerViewResult>(
    "post",
    baseUrlApi(`server/view_jobs/get/job`),
    { params: { nodeId, viewId, ...data } }
  );
};

/** 播放节点视图 */
export const playNodeView = (
  nodeId: string,
  viewId: string,
  jobName?: string,
  host?: string,
  port?: string,
  account?: string,
  password?: string
) => {
  return http.request<ServerViewResult>(
    "post",
    baseUrlApi(`server/view_jobs/start/job`),
    { data: { jobName, viewId, host, port, account, password } }
  );
};

/** 暂停节点视图 */
export const pauseNodeView = (
  nodeId: string,
  viewId: string,
  jobName?: string,
  host?: string,
  port?: string,
  account?: string,
  password?: string
) => {
  return http.request<ServerViewResult>(
    "post",
    baseUrlApi(`server/view_jobs/stop/job`),
    { data: { jobName, viewId, host, port, account, password } }
  );
};

/** 获取控制台输出 */
export const getConsoleOutput = (
  nodeId: string,
  viewId: string,
  viewName?: string,
  host?: string,
  port?: string,
  account?: string,
  password?: string,
  jobName?: string
) => {
  return http.request<ConsoleOutputResult>(
    "post",
    baseUrlApi(`server/view_console/get`),
    {
      data: {
        nodeId,
        viewId,
        viewName,
        host,
        port,
        account,
        password,
        jobName
      }
    }
  );
};

/** 删除构建 */
export const deleteBuild = (
  nodeId: string,
  viewId: string,
  buildId: string
) => {
  return http.request<ServerViewResult>(
    "delete",
    baseUrlApi(`server/node_view/${nodeId}/view/${viewId}/build/${buildId}`)
  );
};

/** 获取Pipeline概览 */
export const getPipelineOverview = (nodeId: string, viewId: string) => {
  return http.request<PipelineResult>(
    "get",
    baseUrlApi(`server/node_view/${nodeId}/view/${viewId}/pipeline/overview`)
  );
};

/** 获取Pipeline控制台 */
export const getPipelineConsole = (nodeId: string, viewId: string) => {
  return http.request<PipelineResult>(
    "get",
    baseUrlApi(`server/node_view/${nodeId}/view/${viewId}/pipeline/console`)
  );
};

/** 获取上一次构建 */
export const getPreviousBuild = (nodeId: string, viewId: string) => {
  return http.request<ServerViewResult>(
    "get",
    baseUrlApi(`server/node_view/${nodeId}/view/${viewId}/build/previous`)
  );
};

/** 获取下一次构建 */
export const getNextBuild = (nodeId: string, viewId: string) => {
  return http.request<ServerViewResult>(
    "get",
    baseUrlApi(`server/node_view/${nodeId}/view/${viewId}/build/next`)
  );
};

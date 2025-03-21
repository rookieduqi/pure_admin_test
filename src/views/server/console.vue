<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Refresh,
  Delete,
  Document,
  Connection
} from "@element-plus/icons-vue";
import {
  getConsoleOutput,
  deleteBuild,
  getPipelineOverview,
  getPipelineConsole,
  getPreviousBuild,
  getNextBuild
} from "@/api/server";

defineOptions({
  name: "ServerConsolePage"
});

// 获取路由参数
const route = useRoute();
const router = useRouter();

// 获取节点ID和视图ID
const nodeId = ref(route.params.nodeId as string);
const viewId = ref(route.params.viewId as string);
const viewName = ref(route.query.name as string);
const jobName = ref(route.query.jobName as string);

// 获取节点连接信息
const nodeHost = ref(route.query.host as string);
const nodePort = ref(route.query.port as string);
const nodeAccount = ref(route.query.account as string);
const nodePassword = ref(route.query.password as string);

// 加载状态
const loading = ref(false);

// 控制台输出内容
const consoleOutput = ref<string[]>([]);

// 自动刷新
const autoRefresh = ref(false);
const refreshInterval = ref<number | null>(null);

// 当前构建ID
const currentBuildId = ref("#45"); // 示例构建ID，实际应从路由或API获取

// 当前活动的内容类型
const activeContent = ref("console"); // console, pipeline-overview, pipeline-console

// 控制台容器引用
const consoleContainer = ref<HTMLElement | null>(null);

// 获取控制台输出
const fetchConsoleOutput = async () => {
  loading.value = true;
  try {
    // 调用获取控制台输出的API
    const res = await getConsoleOutput(
      nodeId.value,
      viewId.value,
      viewName.value,
      nodeHost.value,
      nodePort.value,
      nodeAccount.value,
      nodePassword.value,
      jobName.value
    );
    if (res.success) {
      // 将返回的字符串按换行符分割成数组
      consoleOutput.value = (res.data || "")
        .split("\n")
        .filter(line => line.trim() !== "");

      // 滚动到底部
      setTimeout(() => {
        if (consoleContainer.value) {
          consoleContainer.value.scrollTop =
            consoleContainer.value.scrollHeight;
        }
      }, 100);
    } else {
      ElMessage.error(res.data || "获取控制台输出失败");
    }
  } catch (error) {
    console.error("获取控制台输出失败:", error);
    ElMessage.error("获取控制台输出失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 删除构建
const handleDeleteBuild = () => {
  if (!nodeId.value || !viewId.value || !currentBuildId.value) return;

  // 从构建ID中提取数字部分
  const buildId = currentBuildId.value.replace("#", "");

  // 确保所有必需的连接参数都存在
  if (
    !nodeHost.value ||
    !nodePort.value ||
    !nodeAccount.value ||
    !nodePassword.value
  ) {
    ElMessage.error("缺少必要的连接参数");
    return;
  }

  ElMessageBox.confirm(`确定要删除构建 ${currentBuildId.value} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = await deleteBuild(
          nodeId.value,
          viewId.value,
          viewName.value,
          nodeHost.value,
          nodePort.value,
          nodeAccount.value,
          nodePassword.value,
          jobName.value
        );
        if (res.success) {
          ElMessage.success("删除成功");
          // 删除成功后可能需要返回上一页或刷新数据
          goBack();
        } else {
          ElMessage.error(res.data || "删除失败");
        }
      } catch (error) {
        console.error("删除构建失败:", error);
        ElMessage.error("删除失败，请检查网络连接");
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// Pipeline数据类型定义
interface PipelineStage {
  name: string;
  state: string;
  completePercent: number;
  type: string;
  title: string;
  id: string;
  pauseDurationMillis: string;
  totalDurationMillis: string;
  children: any[];
  seqContainerName: string | null;
  nextSibling: string | null;
  synthetic: boolean;
  isSequential: boolean;
  startTimeMillis: string;
}

interface PipelineData {
  stages: PipelineStage[];
  complete: boolean;
}

// 获取Pipeline概览
const pipelineOverviewData = ref<string>("");
const pipelineData = ref<PipelineData | null>(null);
const fetchPipelineOverview = async () => {
  loading.value = true;
  try {
    const res = await getPipelineOverview(
      nodeId.value,
      viewId.value,
      viewName.value,
      nodeHost.value,
      nodePort.value,
      nodeAccount.value,
      nodePassword.value,
      jobName.value
    );
    if (res.success) {
      try {
        // 尝试解析返回的数据
        if (typeof res.data === "string") {
          pipelineOverviewData.value = res.data;
          try {
            const parsedData = JSON.parse(res.data);
            if (
              parsedData &&
              parsedData.data &&
              Array.isArray(parsedData.data.stages)
            ) {
              pipelineData.value = parsedData.data;
            }
          } catch (parseError) {
            console.error("解析Pipeline数据失败:", parseError);
          }
        } else if (typeof res.data === "object") {
          pipelineData.value = res.data;
          pipelineOverviewData.value = JSON.stringify(res.data, null, 2);
        } else {
          pipelineOverviewData.value = "Pipeline概览数据加载中...";
        }
      } catch (parseError) {
        console.error("处理Pipeline数据失败:", parseError);
        pipelineOverviewData.value = res.data || "Pipeline概览数据加载中...";
      }
      activeContent.value = "pipeline-overview";
    } else {
      ElMessage.error(res.data || "获取Pipeline概览失败");
    }
  } catch (error) {
    console.error("获取Pipeline概览失败:", error);
    ElMessage.error("获取Pipeline概览失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 获取Pipeline控制台
const pipelineConsoleData = ref(null);
const fetchPipelineConsole = async () => {
  loading.value = true;
  try {
    const res = await getPipelineConsole(
      nodeId.value,
      viewId.value,
      viewName.value,
      nodeHost.value,
      nodePort.value,
      nodeAccount.value,
      nodePassword.value,
      jobName.value
    );
    if (res.success) {
      // 确保数据是对象格式
      if (typeof res.data === "string") {
        try {
          pipelineConsoleData.value = JSON.parse(res.data);
        } catch (e) {
          pipelineConsoleData.value = { data: { steps: [] } };
          console.error("解析Pipeline控制台数据失败:", e);
        }
      } else {
        pipelineConsoleData.value = res.data;
      }
      activeContent.value = "pipeline-console";
    } else {
      ElMessage.error(res.data || "获取Pipeline控制台失败");
    }
  } catch (error) {
    console.error("获取Pipeline控制台失败:", error);
    ElMessage.error("获取Pipeline控制台失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 获取上一次构建
const handlePreviousBuild = async () => {
  try {
    const res = await getPreviousBuild(
      nodeId.value,
      viewId.value,
      viewName.value,
      nodeHost.value,
      nodePort.value,
      nodeAccount.value,
      nodePassword.value,
      jobName.value
    );
    if (res.success && res.data) {
      // 假设返回的数据中包含构建ID
      currentBuildId.value = `#${res.data.id || ""}`;
      // 刷新控制台输出
      fetchConsoleOutput();
    } else {
      ElMessage.info("没有上一次构建");
    }
  } catch (error) {
    console.error("获取上一次构建失败:", error);
    ElMessage.error("获取上一次构建失败，请检查网络连接");
  }
};

// 获取下一次构建
const handleNextBuild = async () => {
  try {
    const res = await getNextBuild(
      nodeId.value,
      viewId.value,
      viewName.value,
      nodeHost.value,
      nodePort.value,
      nodeAccount.value,
      nodePassword.value,
      jobName.value
    );
    if (res.success && res.data) {
      // 假设返回的数据中包含构建ID
      currentBuildId.value = `#${res.data.id || ""}`;
      // 刷新控制台输出
      fetchConsoleOutput();
    } else {
      ElMessage.info("没有下一次构建");
    }
  } catch (error) {
    console.error("获取下一次构建失败:", error);
    ElMessage.error("获取下一次构建失败，请检查网络连接");
  }
};

// 显示控制台输出
const showConsoleOutput = () => {
  activeContent.value = "console";
  fetchConsoleOutput();
};

// 返回节点视图页面
const goBack = () => {
  router.push({
    path: `/server/view/${nodeId.value}`,
    query: {
      name: route.query.nodeName as string,
      host: route.query.host as string,
      port: route.query.port as string,
      account: route.query.account as string,
      password: route.query.password as string
    }
  });
};

// 刷新控制台输出
const refreshOutput = () => {
  fetchConsoleOutput();
};

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;

  if (autoRefresh.value) {
    // 启动自动刷新，每5秒刷新一次
    refreshInterval.value = window.setInterval(() => {
      refreshOutput();
    }, 5000);
  } else {
    // 停止自动刷新
    if (refreshInterval.value !== null) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
  }
};

// 组件挂载时初始化数据
onMounted(() => {
  if (!nodeId.value || !viewId.value) {
    ElMessage.error("参数不完整");
    goBack();
    return;
  }

  fetchConsoleOutput();
});

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
});
</script>

<template>
  <div>
    <p class="mb-2">
      <el-button type="primary" size="small" @click="goBack">
        <el-icon>
          <arrow-left />
        </el-icon>
        返回视图列表
      </el-button>
      <span class="ml-2">视图 {{ viewName }} 的控制台输出</span>
    </p>

    <el-card shadow="never" class="w-[85vw]">
      <template #header>
        <div class="card-header">
          <span>{{
            activeContent === "console"
              ? "控制台输出"
              : activeContent === "pipeline-overview"
                ? "Pipeline概览"
                : "Pipeline控制台"
          }}</span>
          <div>
            <el-button
              type="primary"
              :icon="Refresh"
              size="small"
              :loading="loading"
              @click="refreshOutput"
            >
              刷新
            </el-button>
            <el-switch
              v-model="autoRefresh"
              class="ml-2"
              active-text="自动刷新"
              inactive-text="手动刷新"
              @change="toggleAutoRefresh"
            />
          </div>
        </div>
      </template>

      <div class="console-layout">
        <!-- 左侧按钮区域 -->
        <div class="left-buttons">
          <el-button
            class="left-button"
            :class="{ active: activeContent === 'console' }"
            @click="showConsoleOutput"
          >
            Console Output
          </el-button>

          <el-button class="left-button" @click="handleDeleteBuild">
            Delete the build "{{ currentBuildId }}"?
          </el-button>

          <el-button
            class="left-button"
            :class="{ active: activeContent === 'pipeline-overview' }"
            @click="fetchPipelineOverview"
          >
            Pipeline Overview
          </el-button>

          <el-button
            class="left-button"
            :class="{ active: activeContent === 'pipeline-console' }"
            @click="fetchPipelineConsole"
          >
            Pipeline Console
          </el-button>

          <el-button class="left-button" @click="handlePreviousBuild">
            Previous Build
          </el-button>

          <el-button class="left-button" @click="handleNextBuild">
            Next Build
          </el-button>
        </div>

        <!-- 右侧内容区域 -->
        <div class="right-content">
          <!-- 控制台输出 -->
          <div
            v-if="activeContent === 'console'"
            v-loading="loading"
            class="console-container"
          >
            <div v-if="consoleOutput.length" class="console-output">
              <pre
                v-for="(line, index) in consoleOutput"
                :key="index"
                class="console-line"
              >
                {{ line }}
              </pre>
            </div>
            <div v-else class="empty-text">暂无控制台输出</div>
          </div>

          <!-- Pipeline概览 -->
          <div
            v-else-if="activeContent === 'pipeline-overview'"
            v-loading="loading"
            class="console-container"
          >
            <!-- Pipeline流程图 -->
            <div
              v-if="
                pipelineData &&
                pipelineData.stages &&
                pipelineData.stages.length > 0
              "
              class="pipeline-graph"
            >
              <div class="pipeline-steps">
                <div class="pipeline-step-item">
                  <div class="step-node start-node">Start</div>
                  <div class="step-line" />
                </div>

                <div
                  v-for="(stage, index) in pipelineData.stages"
                  :key="stage.id"
                  class="pipeline-step-item"
                >
                  <div
                    class="step-node"
                    :class="{
                      'success-node': stage.state === 'success',
                      'failed-node': stage.state === 'failed',
                      'aborted-node': stage.state === 'aborted',
                      'running-node': stage.state === 'running'
                    }"
                  >
                    <el-icon
                      v-if="stage.state === 'success'"
                      class="status-icon"
                    >
                      <el-icon-check />
                    </el-icon>
                    <el-icon
                      v-else-if="stage.state === 'failed'"
                      class="status-icon"
                    >
                      <el-icon-close />
                    </el-icon>
                    <el-icon
                      v-else-if="stage.state === 'aborted'"
                      class="status-icon"
                    >
                      <el-icon-close />
                    </el-icon>
                    <el-icon v-else class="status-icon">
                      <el-icon-loading />
                    </el-icon>
                  </div>
                  <div class="step-title">{{ stage.name }}</div>
                  <div
                    v-if="index < pipelineData.stages.length - 1"
                    class="step-line"
                  />
                </div>

                <div class="pipeline-step-item">
                  <div class="step-node end-node">End</div>
                </div>
              </div>

              <!-- Pipeline详情 -->
              <div class="pipeline-details">
                <el-card shadow="never" class="details-card">
                  <template #header>
                    <div class="details-header">Details</div>
                  </template>
                  <div class="details-content">
                    <div
                      v-for="stage in pipelineData.stages"
                      :key="stage.id"
                      class="stage-detail"
                    >
                      <div class="stage-name">{{ stage.title }}</div>
                      <div class="stage-info">
                        <div class="info-item">
                          <el-icon>
                            <el-icon-timer />
                          </el-icon>
                          <span>{{ stage.startTimeMillis }}</span>
                        </div>
                        <div class="info-item">
                          <el-icon>
                            <el-icon-stopwatch />
                          </el-icon>
                          <span>{{ stage.totalDurationMillis }}</span>
                        </div>
                        <div class="info-item">
                          <el-icon>
                            <el-icon-time />
                          </el-icon>
                          <span>{{ stage.pauseDurationMillis }}</span>
                        </div>
                        <div
                          class="info-item status-item"
                          :class="{
                            'success-text': stage.state === 'success',
                            'failed-text': stage.state === 'failed',
                            'aborted-text': stage.state === 'aborted',
                            'running-text': stage.state === 'running'
                          }"
                        >
                          <span>Status: {{ stage.state }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>

            <!-- 原始数据展示 -->
            <div v-else-if="pipelineOverviewData" class="console-output">
              <pre class="console-line">{{ pipelineOverviewData }}</pre>
            </div>
            <div v-else class="empty-text">暂无Pipeline概览数据</div>
          </div>

          <!-- Pipeline控制台 -->
          <div
            v-else-if="activeContent === 'pipeline-console'"
            v-loading="loading"
            class="console-container"
          >
            <div
              v-if="
                pipelineConsoleData &&
                typeof pipelineConsoleData === 'object' &&
                pipelineConsoleData.data &&
                pipelineConsoleData.data.steps
              "
              class="pipeline-steps"
            >
              <div
                v-for="step in pipelineConsoleData.data.steps"
                :key="step.id"
                class="pipeline-step"
              >
                <div
                  class="step-header"
                  :class="{
                    success: step.state === 'success',
                    aborted: step.state === 'aborted',
                    failed: step.state === 'failed',
                    running: step.state === 'running'
                  }"
                >
                  <el-icon class="status-icon">
                    <el-icon-check v-if="step.state === 'success'" />
                    <el-icon-close
                      v-else-if="
                        step.state === 'aborted' || step.state === 'failed'
                      "
                    />
                    <el-icon-loading v-else />
                  </el-icon>
                  <span class="step-name">{{ step.name }}</span>
                  <span class="step-state">{{ step.state }}</span>
                </div>
                <div class="step-info">
                  <div class="info-item">
                    <el-icon>
                      <el-icon-timer />
                    </el-icon>
                    <span>{{ step.startTimeMillis }}</span>
                  </div>
                  <div class="info-item">
                    <el-icon>
                      <el-icon-stopwatch />
                    </el-icon>
                    <span>{{ step.totalDurationMillis }}</span>
                  </div>
                  <div class="info-item">
                    <el-icon>
                      <el-icon-time />
                    </el-icon>
                    <span>{{ step.pauseDurationMillis }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-text">暂无Pipeline控制台数据</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.console-container {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  background-color: #f5f7fa;
  color: #333;
  border-radius: 4px;
  padding: 10px;
}

.console-output {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.console-line {
  margin: 0;
  padding: 2px 0;
  line-height: 1.5;
}

.empty-text {
  text-align: center;
  color: #888;
  padding: 20px;
}

.console-layout {
  display: flex;
  gap: 20px;
}

.left-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 220px;
  flex-shrink: 0;
}

.left-button {
  text-align: left;
  padding: 10px;
  border-radius: 4px;
  transition: all 0.3s;
  white-space: normal;
  height: auto;
  line-height: 1.5;
}

.left-button.active {
  background-color: #409eff;
  color: white;
}

.right-content {
  flex-grow: 1;
}

/* Pipeline流程图样式 */
.pipeline-graph {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

.pipeline-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.pipeline-step {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.step-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 1px solid #eee;
}

.step-header.success {
  background-color: #f0f9eb;
  border-left: 4px solid #67c23a;
}

.step-header.aborted {
  background-color: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.step-header.failed {
  background-color: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.step-header.running {
  background-color: #e6f1fc;
  border-left: 4px solid #409eff;
}

.status-icon {
  font-size: 18px;
}

.step-name {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}

.step-state {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
}

.step-info {
  padding: 12px 16px;
  display: flex;
  gap: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 13px;
}

.info-item .el-icon {
  font-size: 16px;
}

.pipeline-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-node {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
}

.start-node,
.end-node {
  background-color: #909399;
  color: white;
  font-size: 12px;
}

.success-node {
  background-color: #67c23a;
  color: white;
}

.failed-node {
  background-color: #f56c6c;
  color: white;
}

.aborted-node {
  background-color: #e6a23c;
  color: white;
}

.running-node {
  background-color: #409eff;
  color: white;
}

.step-line {
  height: 2px;
  width: 100px;
  background-color: #dcdfe6;
  position: relative;
  z-index: 1;
}

.step-title {
  font-size: 12px;
  text-align: center;
  max-width: 120px;
  word-break: break-word;
}

/* Pipeline详情样式 */
.pipeline-details {
  margin-top: 20px;
}

.details-card {
  background-color: #f5f7fa;
}

.details-header {
  font-weight: bold;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stage-detail {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: white;
}

.stage-name {
  font-weight: bold;
  margin-bottom: 10px;
}

.stage-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.status-item {
  font-weight: bold;
}

.success-text {
  color: #67c23a;
}

.failed-text {
  color: #f56c6c;
}

.aborted-text {
  color: #e6a23c;
}

.running-text {
  color: #409eff;
}
</style>

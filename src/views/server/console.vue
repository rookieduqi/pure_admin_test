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

// 获取控制台输出
const fetchConsoleOutput = async () => {
  loading.value = true;
  try {
    // 调用获取控制台输出的API
    const res = await getConsoleOutput(nodeId.value, viewId.value);
    if (res.success) {
      // 假设API返回的是字符串数组
      consoleOutput.value = res.data || [
        `[${new Date().toLocaleString()}] 正在初始化任务...`,
        `[${new Date().toLocaleString()}] 开始执行任务`,
        `[${new Date().toLocaleString()}] 任务执行中...`,
        `[${new Date().toLocaleString()}] 任务执行完成`
      ];
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

  ElMessageBox.confirm(`确定要删除构建 ${currentBuildId.value} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = await deleteBuild(nodeId.value, viewId.value, buildId);
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

// 获取Pipeline概览
const pipelineOverviewData = ref("");
const fetchPipelineOverview = async () => {
  loading.value = true;
  try {
    const res = await getPipelineOverview(nodeId.value, viewId.value);
    if (res.success) {
      pipelineOverviewData.value = res.data || "Pipeline概览数据加载中...";
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
const pipelineConsoleData = ref("");
const fetchPipelineConsole = async () => {
  loading.value = true;
  try {
    const res = await getPipelineConsole(nodeId.value, viewId.value);
    if (res.success) {
      pipelineConsoleData.value = res.data || "Pipeline控制台数据加载中...";
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
    const res = await getPreviousBuild(nodeId.value, viewId.value);
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
    const res = await getNextBuild(nodeId.value, viewId.value);
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
    query: { name: route.query.nodeName as string }
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
        <el-icon><arrow-left /></el-icon> 返回视图列表
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
            <div v-if="pipelineOverviewData" class="console-output">
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
            <div v-if="pipelineConsoleData" class="console-output">
              <pre class="console-line">{{ pipelineConsoleData }}</pre>
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
  background-color: #1e1e1e;
  color: #f0f0f0;
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
</style>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Edit,
  Search,
  Plus,
  RefreshRight,
  VideoPlay,
  VideoPause,
  More,
  ArrowDown
} from "@element-plus/icons-vue";
import {
  getNodeViews,
  addNodeView,
  updateNodeView,
  deleteNodeView,
  playNodeView,
  pauseNodeView
} from "@/api/server";

defineOptions({
  name: "ServerViewPage"
});

// 获取路由参数
const route = useRoute();
const router = useRouter();

// 获取节点ID
const nodeId = ref(route.params.id as string);
const nodeName = ref(route.query.name as string);

// 当前活动的标签页
const activeTab = ref("view");

// 加载状态
const loading = ref(false);

// 视图数据接口
interface NodeView {
  id: string;
  weather: string;
  name: string;
  lastSuccess?: string;
  lastFailure?: string;
  lastDuration?: string;
  createTime?: string;
  expanded?: boolean;
}

// 视图数据
const viewData = ref<NodeView[]>([]);

// 搜索表单
const searchForm = ref({ name: "" });

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 计算属性 - 过滤并分页数据
const filteredViewData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return viewData.value.slice(startIndex, endIndex);
});

// 处理分页变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

// 获取视图列表
const fetchNodeViews = async () => {
  if (!nodeId.value) return;

  loading.value = true;
  try {
    const res = await getNodeViews(nodeId.value);
    if (res.success) {
      viewData.value = res.data || [];
    } else {
      ElMessage.error(res.data || "获取视图列表失败");
    }
  } catch (error) {
    console.error("获取视图列表失败:", error);
    ElMessage.error("获取视图列表失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 搜索视图
const handleSearch = async () => {
  if (!nodeId.value) return;
  if (!searchForm.value.name.trim()) {
    ElMessage.warning("请输入搜索关键词");
    return;
  }

  loading.value = true;
  try {
    const res = await getNodeViews(nodeId.value, {
      name: searchForm.value.name.trim()
    });
    if (res.success) {
      viewData.value = res.data || [];
    } else {
      ElMessage.error(res.data || "搜索视图失败");
    }
  } catch (error) {
    console.error("搜索视图失败:", error);
    ElMessage.error("搜索失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 重置搜索
const handleReset = () => {
  searchForm.value.name = "";
  fetchNodeViews();
};

// 返回节点列表
const goBack = () => {
  router.push("/server/index");
};

// 表单对话框可见性
const dialogVisible = ref(false);

// 表单数据
const formData = reactive<NodeView>({
  id: "",
  weather: "",
  name: ""
});

// 表单规则
const formRules = {
  weather: [{ required: true, message: "请选择天气", trigger: "change" }],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
};

// 表单引用
const formRef = ref();

// 提交加载状态
const submitLoading = ref(false);

// 编辑模式标记
const isEdit = ref(false);

// 打开新增对话框
const handleAdd = () => {
  Object.assign(formData, {
    id: "",
    weather: "",
    name: ""
  });
  isEdit.value = false;
  dialogVisible.value = true;
};

// 打开编辑对话框
const handleEdit = (row: NodeView) => {
  Object.assign(formData, { ...row });
  isEdit.value = true;
  dialogVisible.value = true;
};

// 提交表单
const submitForm = () => {
  if (!nodeId.value) return;

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const submitData = { ...formData };
        const res = isEdit.value
          ? await updateNodeView(nodeId.value, formData.id, submitData)
          : await addNodeView(nodeId.value, submitData);

        if (res.success) {
          ElMessage.success(isEdit.value ? "更新成功" : "添加成功");
          dialogVisible.value = false;
          fetchNodeViews(); // 刷新数据
        } else {
          ElMessage.error(res.data || (isEdit.value ? "更新失败" : "添加失败"));
        }
      } catch (error) {
        console.error(isEdit.value ? "更新视图失败:" : "添加视图失败:", error);
        ElMessage.error(
          (isEdit.value ? "更新" : "添加") + "失败，请检查网络连接"
        );
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 删除视图
const handleDelete = (row: NodeView) => {
  if (!nodeId.value) return;

  ElMessageBox.confirm("确定要删除该视图吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = await deleteNodeView(nodeId.value, row.id);
        if (res.success) {
          ElMessage.success("删除成功");
          fetchNodeViews(); // 刷新数据
        } else {
          ElMessage.error(res.data || "删除失败");
        }
      } catch (error) {
        console.error("删除视图失败:", error);
        ElMessage.error("删除失败，请检查网络连接");
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// 播放操作
const handlePlay = async (row: NodeView) => {
  if (!nodeId.value) return;
  try {
    // 调用播放相关的API
    const res = await playNodeView(nodeId.value, row.id);
    if (res.success) {
      ElMessage.success("播放成功");
      fetchNodeViews(); // 刷新数据
    } else {
      ElMessage.error(res.data || "播放失败");
    }
  } catch (error) {
    console.error("播放失败:", error);
    ElMessage.error("播放失败，请检查网络连接");
  }
};

// 暂停操作
const handlePause = async (row: NodeView) => {
  if (!nodeId.value) return;
  try {
    // 调用暂停相关的API
    const res = await pauseNodeView(nodeId.value, row.id);
    if (res.success) {
      ElMessage.success("暂停成功");
      fetchNodeViews(); // 刷新数据
    } else {
      ElMessage.error(res.data || "暂停失败");
    }
  } catch (error) {
    console.error("暂停失败:", error);
    ElMessage.error("暂停失败，请检查网络连接");
  }
};

// 更多操作 - 跳转到控制台输出页面
const handleMore = (row: NodeView) => {
  // 跳转到控制台输出页面
  router.push({
    path: `/server/console/${nodeId.value}/${row.id}`,
    query: { name: row.name }
  });
};

// 处理下拉菜单命令
const handleCommand = (command: string, row: NodeView) => {
  switch (command) {
    case "play":
      handlePlay(row);
      break;
    case "pause":
      handlePause(row);
      break;
    case "more":
      handleMore(row);
      break;
    default:
      break;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  if (!nodeId.value) {
    ElMessage.error("节点ID不存在");
    goBack();
  }
  fetchNodeViews();
});
</script>

<template>
  <div>
    <p class="mb-2">
      <el-button type="primary" size="small" @click="goBack"
        >返回节点列表
      </el-button>
      <span class="ml-2">节点 {{ nodeName }} 的详细信息</span>
    </p>

    <el-card shadow="never" class="w-[85vw]">
      <template #header>
        <div class="card-header">
          <span>节点视图</span>
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="search-container mb-4">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入名称搜索"
              clearable
              class="w-[200px]"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch"
              >查询
            </el-button>
            <el-button
              type="info"
              :icon="RefreshRight"
              class="ml-2"
              @click="handleReset"
              >重置
            </el-button>
            <el-button
              type="success"
              :icon="Plus"
              class="ml-2"
              @click="handleAdd"
              >新增
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-tabs v-model="activeTab" class="mt-4">
        <el-tab-pane label="视图" name="view">
          <!-- 表格 -->
          <div class="table-container">
            <el-table
              v-loading="loading"
              :data="filteredViewData"
              border
              stripe
              style="width: 100%"
              @row-click="row => (row.expanded = !row.expanded)"
            >
              <el-table-column type="selection" width="55" align="center" />

              <el-table-column
                prop="id"
                label="序号"
                width="80"
                align="center"
              />
              <el-table-column prop="weather" label="天气" width="100" />
              <el-table-column prop="name" label="名字" min-width="120" />
              <el-table-column
                prop="lastSuccess"
                label="Last Success"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column
                prop="lastFailure"
                label="Last Failure"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column
                prop="lastDuration"
                label="Last Duration"
                width="120"
                align="center"
              />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <el-button
                      type="primary"
                      :icon="Edit"
                      link
                      @click.stop="handleEdit(row)"
                      >编辑
                    </el-button>
                    <el-button
                      type="danger"
                      :icon="Delete"
                      link
                      @click.stop="handleDelete(row)"
                      >删除
                    </el-button>
                    <el-dropdown
                      trigger="click"
                      @command="command => handleCommand(command, row)"
                    >
                      <el-button type="primary" link>
                        更多<el-icon class="el-icon--right"
                          ><arrow-down
                        /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="play">
                            <el-icon><video-play /></el-icon> 播放
                          </el-dropdown-item>
                          <el-dropdown-item command="pause">
                            <el-icon><video-pause /></el-icon> 暂停
                          </el-dropdown-item>
                          <el-dropdown-item command="more">
                            <el-icon><more /></el-icon> 更多
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <p v-if="!filteredViewData.length" class="empty-text">暂无数据</p>

            <!-- 分页 -->
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="viewData.length"
              :current-page="currentPage"
              :page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              class="mt-4"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="Jobs" name="jobs">
          <div class="empty-text">Jobs功能正在开发中...</div>
        </el-tab-pane>
      </el-tabs>

      <!-- 新增视图对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '编辑视图' : '新增视图'"
        width="500px"
        destroy-on-close
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="80px"
          label-position="right"
        >
          <el-form-item label="天气" prop="weather">
            <el-select
              v-model="formData.weather"
              placeholder="请选择天气"
              style="width: 100%"
            >
              <el-option label="晴天" value="晴天" />
              <el-option label="阴天" value="阴天" />
              <el-option label="多云" value="多云" />
              <el-option label="雨天" value="雨天" />
              <el-option label="无" value="无" />
            </el-select>
          </el-form-item>
          <el-form-item label="名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入名称" />
          </el-form-item>
        </el-form>

        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="submitLoading"
              @click="submitForm"
              >确定</el-button
            >
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-text {
  text-align: center;
  color: gray;
  padding: 20px;
}

.expand-controls {
  display: flex;
  gap: 10px;
  padding: 10px 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>

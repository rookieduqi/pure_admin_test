<script setup lang="ts">
import { ref, computed, reactive, type CSSProperties, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Edit,
  Search,
  Plus,
  View,
  RefreshRight,
  Hide,
  View as EyeIcon
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import {
  addServerNode,
  getServerNodes,
  updateServerNode,
  deleteServerNode
} from "@/api/server";

defineOptions({
  name: "ServerPage"
});

// 路由
const router = useRouter();

// 加载状态
const loading = ref(false);

// 获取服务器节点列表
const fetchServerNodes = async () => {
  loading.value = true;
  try {
    const res = await getServerNodes();
    if (res.success) {
      tableData.value = res.data || [];
    } else {
      ElMessage.error(res.data || "获取节点列表失败");
    }
  } catch (error) {
    console.error("获取节点列表失败:", error);
    ElMessage.error("获取节点列表失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchServerNodes();
});

const elStyle = computed((): CSSProperties => {
  return {
    width: "85vw",
    justifyContent: "start"
  };
});

interface ServerNode {
  id: string;
  name: string;
  host: string;
  port: string;
  account: string;
  password: string;
  status: boolean;
  remark: string;
  addTime: string;
}

const searchForm = ref({ name: "" });

const tableData = ref<ServerNode[]>([]); // 初始化为空数组

// 密码显示状态映射，用于控制每行密码的显示/隐藏
const passwordVisibleMap = ref<Record<string, boolean>>({});

// 切换密码显示/隐藏状态
const togglePasswordVisibility = (id: string) => {
  passwordVisibleMap.value[id] = !passwordVisibleMap.value[id];
};

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 计算属性 - 过滤并分页数据
const filteredData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return tableData.value.slice(startIndex, endIndex);
});

// 处理分页变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1; // 重置到第一页
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

const handleSearch = async () => {
  if (!searchForm.value.name.trim()) {
    ElMessage.warning("请输入搜索关键词");
    return;
  }

  loading.value = true;
  try {
    const res = await getServerNodes({ name: searchForm.value.name.trim() });
    if (res.success) {
      tableData.value = res.data || [];
    } else {
      ElMessage.error(res.data || "搜索节点失败");
    }
  } catch (error) {
    console.error("搜索节点失败:", error);
    ElMessage.error("搜索失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 重置搜索
const handleReset = () => {
  searchForm.value.name = "";
  fetchServerNodes();
};

// 查看节点视图
const handleView = (row: ServerNode) => {
  router.push({
    path: `/server/view/${row.id}`,
    query: {
      name: row.name,
      host: row.host,
      port: row.port,
      account: row.account,
      password: row.password
    }
  });
};

// 表单对话框可见性
const dialogVisible = ref(false);

// 表单数据
const formData = reactive<ServerNode>({
  id: "",
  name: "",
  host: "",
  port: "",
  account: "",
  password: "",
  status: true,
  remark: "",
  addTime: ""
});

// 表单规则
const formRules = {
  name: [
    { required: true, message: "请输入节点名称", trigger: "blur" },
    { max: 50, message: "节点名称长度不能超过50个字符", trigger: "blur" }
  ],
  host: [{ required: true, message: "请输入主机地址", trigger: "blur" }],
  port: [{ pattern: /^\d*$/, message: "端口必须为数字", trigger: "blur" }],
  account: [{ required: true, message: "请输入账户", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

// 表单引用
const formRef = ref();

// 提交加载状态
const submitLoading = ref(false);

// 打开新增对话框
const handleAdd = () => {
  // 重置表单数据
  Object.assign(formData, {
    name: "",
    host: "",
    port: "",
    account: "",
    password: "",
    status: true,
    remark: "",
    addTime: ""
  });
  // 重置编辑模式
  isEdit.value = false;
  dialogVisible.value = true;
};

// 提交表单
const submitForm = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        // 准备提交的数据
        const submitData = { ...formData };
        // 发送请求到后端
        const res = isEdit.value
          ? await updateServerNode(submitData)
          : await addServerNode(submitData);

        if (res.success) {
          if (isEdit.value) {
            ElMessage.success("更新成功");
            // 重新获取最新数据
            fetchServerNodes();
          } else {
            // 添加到表格数据中
            tableData.value.unshift({
              ...formData,
              addTime: new Date().toLocaleString()
            });
            ElMessage.success("添加成功");
          }
          dialogVisible.value = false;
        } else {
          ElMessage.error(res.data || (isEdit.value ? "更新失败" : "添加失败"));
        }
      } catch (error) {
        console.error(isEdit.value ? "更新节点失败:" : "添加节点失败:", error);
        ElMessage.error(
          (isEdit.value ? "更新" : "添加") + "失败，请检查网络连接"
        );
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleEdit = (row: ServerNode) => {
  // 复制数据到表单
  Object.assign(formData, { ...row });
  dialogVisible.value = true;
  // 标记为编辑模式
  isEdit.value = true;
};

// 编辑模式标记
const isEdit = ref(false);

const handleDelete = (row: ServerNode) => {
  ElMessageBox.confirm("确定要删除该节点吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      const res = await deleteServerNode(row.id);
      if (res.success) {
        tableData.value = tableData.value.filter(
          item => item.name !== row.name
        );
        ElMessage.success("删除成功");
      } else {
        ElMessage.error(res.data || "删除失败");
      }
    } catch (error) {
      console.error("删除节点失败:", error);
      ElMessage.error("删除失败，请检查网络连接");
    }
  });
};

const handleStatusChange = (row: ServerNode) => {
  ElMessage.success(`状态已${row.status ? "启用" : "禁用"}`);
};
</script>

<template>
  <div>
    <p class="mb-2">
      服务器节点管理，可以添加、编辑、删除服务器节点，并可以启用或禁用节点状态
    </p>
    <el-card shadow="never" :style="elStyle">
      <template #header>
        <div class="card-header">
          <span>节点管理</span>
        </div>
        <!-- 新增节点对话框 -->
        <el-dialog
          v-model="dialogVisible"
          :title="isEdit ? '编辑服务器节点' : '新增服务器节点'"
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
            <el-form-item label="节点名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入节点名称" />
            </el-form-item>
            <el-form-item label="主机地址" prop="host">
              <el-input v-model="formData.host" placeholder="请输入主机地址" />
            </el-form-item>
            <el-form-item label="端口" prop="port">
              <el-input v-model="formData.port" placeholder="请输入端口号" />
            </el-form-item>
            <el-form-item label="账户" prop="account">
              <el-input v-model="formData.account" placeholder="请输入账户" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-switch v-model="formData.status" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="formData.remark"
                type="textarea"
                placeholder="请输入备注信息"
                :rows="2"
              />
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
      </template>

      <!-- 搜索框 -->
      <div class="search-container mb-4">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入节点名称"
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

      <!-- 表格 -->
      <div class="table-container">
        <el-table v-if="filteredData.length" :data="filteredData" border stripe>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="name" label="节点" min-width="120" />
          <el-table-column prop="host" label="Host" min-width="120" />
          <el-table-column prop="port" label="端口" width="80" align="center" />
          <el-table-column prop="account" label="账户" min-width="100" />
          <el-table-column label="密码" min-width="100" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="password-cell">
                <span>{{
                  passwordVisibleMap[row.id] ? row.password : "••••••••"
                }}</span>
                <el-button
                  type="primary"
                  link
                  @click.stop="togglePasswordVisibility(row.id)"
                >
                  <el-icon>
                    <EyeIcon v-if="passwordVisibleMap[row.id]" />
                    <Hide v-else />
                  </el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                @change="handleStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="remark"
            label="备注"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column prop="addTime" label="添加时间" min-width="160" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                :icon="Edit"
                link
                @click="handleEdit(row)"
                >编辑
              </el-button>
              <el-button type="info" :icon="View" link @click="handleView(row)"
                >视图
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                link
                @click="handleDelete(row)"
                >删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <p v-else class="empty-text">暂无数据</p>

        <!-- 分页 -->
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="tableData.length"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          class="mt-4"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
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

.empty-text {
  text-align: center;
  color: gray;
  padding: 20px;
}

.password-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.password-cell .el-button {
  margin-left: 8px;
  padding: 2px;
}
</style>

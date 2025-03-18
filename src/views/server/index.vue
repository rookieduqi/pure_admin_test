<script setup lang="ts">
import { ref, computed, type CSSProperties } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Edit, Search, Plus } from "@element-plus/icons-vue";

defineOptions({
  name: "ServerPage"
});

const elStyle = computed((): CSSProperties => {
  return {
    width: "85vw",
    justifyContent: "start"
  };
});

export interface SearchParams {
  name: string;
  page: number;
  pageSize: number;
}

interface ServerNode {
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

const tableData = ref<ServerNode[]>([
  {
    name: "Mac主机",
    host: "127.0.0.1",
    port: "22",
    account: "1111",
    password: "222",
    status: true,
    remark: "Mac构建",
    addTime: "2020/09/08 10:45"
  },
  {
    name: "Win主机",
    host: "127.0.0.2",
    port: "22",
    account: "1111",
    password: "222",
    status: true,
    remark: "Win构建",
    addTime: "2020/09/08 10:45"
  },
  {
    name: "Ubuntu主机",
    host: "无",
    port: "",
    account: "1111",
    password: "222",
    status: true,
    remark: "Ubuntu构建",
    addTime: "2020/09/08 10:45"
  },
  {
    name: "Centos主机",
    host: "无",
    port: "",
    account: "1111",
    password: "222",
    status: true,
    remark: "Centos构建",
    addTime: "2020/09/08 10:45"
  },
  {
    name: "其他主机",
    host: "无",
    port: "",
    account: "1111",
    password: "222",
    status: true,
    remark: "其他",
    addTime: "2020/09/08 10:45"
  }
]);

// 计算属性 - 过滤数据
const filteredData = computed(() => {
  const keyword = searchForm.value.name.trim().toLowerCase();
  return keyword
    ? tableData.value.filter(item => item.name.toLowerCase().includes(keyword))
    : tableData.value;
});

const handleSearch = () => {
  if (!searchForm.value.name.trim()) {
    ElMessage.warning("请输入搜索关键词");
  }
};

const handleAdd = () => {
  ElMessageBox.prompt("请输入节点名称", "新增节点", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^.{1,50}$/,
    inputErrorMessage: "节点名称不能为空且长度不能超过50个字符"
  })
    .then(({ value }) => {
      tableData.value.unshift({
        name: value,
        host: "",
        port: "",
        account: "",
        password: "",
        status: true,
        remark: "",
        addTime: new Date().toLocaleString()
      });
      ElMessage.success("添加成功");
    })
    .catch(() => {});
};

const handleEdit = (row: ServerNode) => {
  ElMessageBox.confirm("确定要编辑该节点吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => ElMessage.success("进入编辑模式"));
};

const handleDelete = (row: ServerNode) => {
  ElMessageBox.confirm("确定要删除该节点吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    tableData.value = tableData.value.filter(item => item.name !== row.name);
    ElMessage.success("删除成功");
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
          <el-table-column
            prop="password"
            label="密码"
            min-width="100"
            show-overflow-tooltip
          />
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
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                :icon="Edit"
                link
                @click="handleEdit(row)"
                >编辑
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
          :total="filteredData.length"
          class="mt-4"
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
</style>

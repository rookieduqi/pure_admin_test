<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";

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

// 视图数据
const viewData = ref([
  { id: 1, weather: "晴天", name: "1111", lastDuration: "2020/09/08 10:45" },
  { id: 2, weather: "阴天", name: "1111", lastDuration: "2020/09/08 10:45" },
  { id: 3, weather: "多云", name: "1111", lastDuration: "2020/09/08 10:45" },
  { id: 4, weather: "雨天", name: "1111", lastDuration: "2020/09/08 10:45" },
  { id: 5, weather: "无", name: "1111", lastDuration: "2020/09/08 10:45" }
]);

// Jobs数据
const jobsData = ref([
  {
    id: 1,
    name: "任务1",
    status: "运行中",
    startTime: "2020/09/08 10:45",
    duration: "00:30:00"
  },
  {
    id: 2,
    name: "任务2",
    status: "已完成",
    startTime: "2020/09/08 11:45",
    duration: "01:15:00"
  },
  {
    id: 3,
    name: "任务3",
    status: "等待中",
    startTime: "2020/09/08 12:45",
    duration: "--"
  },
  {
    id: 4,
    name: "任务4",
    status: "失败",
    startTime: "2020/09/08 13:45",
    duration: "00:05:23"
  }
]);

// 返回节点列表
const goBack = () => {
  router.push("/server/index");
};

// 组件挂载时获取数据
onMounted(() => {
  if (!nodeId.value) {
    ElMessage.error("节点ID不存在");
    goBack();
  }
  // 这里可以根据nodeId获取节点的详细信息
  console.log("获取节点详情:", nodeId.value);
});
</script>

<template>
  <div>
    <p class="mb-2">
      <el-button type="primary" size="small" @click="goBack"
        >返回节点列表</el-button
      >
      <span class="ml-2">节点 {{ nodeName }} 的详细信息</span>
    </p>
    <el-card shadow="never" class="w-[85vw]">
      <template #header>
        <div class="card-header">
          <span>节点视图</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="demo-tabs">
        <el-tab-pane label="视图" name="view">
          <div class="table-container">
            <el-table :data="viewData" border stripe>
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column
                prop="id"
                label="序号"
                width="80"
                align="center"
              />
              <el-table-column prop="weather" label="天气" min-width="120" />
              <el-table-column prop="name" label="名字" min-width="120" />
              <el-table-column
                prop="lastDuration"
                label="Last Duration"
                min-width="160"
              />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link>编辑</el-button>
                  <el-button type="danger" link>删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="viewData.length"
              class="mt-4"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="Jobs" name="jobs">
          <div class="table-container">
            <el-table :data="jobsData" border stripe>
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column prop="id" label="ID" width="80" align="center" />
              <el-table-column prop="name" label="任务名称" min-width="120" />
              <el-table-column prop="status" label="状态" min-width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="
                      row.status === '运行中'
                        ? 'primary'
                        : row.status === '已完成'
                          ? 'success'
                          : row.status === '等待中'
                            ? 'info'
                            : 'danger'
                    "
                  >
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="startTime"
                label="开始时间"
                min-width="160"
              />
              <el-table-column
                prop="duration"
                label="持续时间"
                min-width="120"
              />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link>查看</el-button>
                  <el-button type="success" link>重启</el-button>
                  <el-button type="danger" link>停止</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="jobsData.length"
              class="mt-4"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
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

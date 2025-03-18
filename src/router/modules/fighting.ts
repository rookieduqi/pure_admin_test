export default {
  path: "/fighting",
  redirect: "/fighting/effort",
  meta: {
    icon: "ri:information-line",
    // showLink: false,
    title: "励志",
    rank: 9
  },
  children: [
    {
      path: "/fighting/index",
      name: "Fighting",
      component: () => import("@/views/fighting/index.vue"),
      meta: {
        title: "加油",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    },
    {
      path: "/fighting/effort",
      name: "Effort",
      component: () => import("@/views/fighting/effort.vue"),
      meta: {
        title: "努力"
      }
    }
  ]
} as RouteConfigsTable;

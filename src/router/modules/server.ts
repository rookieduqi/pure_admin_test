export default {
  path: "/server",
  redirect: "/server/index",
  meta: {
    icon: "ri:server-line",
    title: "部署管理",
    rank: 8
  },
  children: [
    {
      path: "/server/index",
      name: "Server",
      component: () => import("@/views/server/index.vue"),
      meta: {
        title: "节点管理",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    }
    // {
    //   path: "/server/node",
    //   name: "Server",
    //   component: () => import("@/views/server/node.vue"),
    //   meta: {
    //     title: "视图管理"
    //   }
    // }
  ]
};

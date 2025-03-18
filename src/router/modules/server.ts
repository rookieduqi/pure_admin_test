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
    },
    {
      path: "/server/view/:id",
      name: "ServerView",
      component: () => import("@/views/server/view.vue"),
      meta: {
        title: "节点视图",
        // 隐藏该路由在菜单中的显示
        showLink: false
      }
    },
    {
      path: "/server/console/:nodeId/:viewId",
      name: "ServerConsole",
      component: () => import("@/views/server/console.vue"),
      meta: {
        title: "控制台输出",
        // 隐藏该路由在菜单中的显示
        showLink: false
      }
    }
  ]
};

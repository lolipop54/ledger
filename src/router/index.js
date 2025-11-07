import Home from '../views/Home.vue';
import Add from '../views/Add.vue';
import Stats from '../views/Stats.vue';

const routes = [
  {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { title: '首页' }
  },
  {
      path: '/add',
      name: 'Add',
      component: Add,
      meta: { title: '记一笔' }
  },
  {
      path: '/stats',
      name: 'Stats',
      component: Stats,
      meta: { title: '统计' }
  }
];

export default routes;



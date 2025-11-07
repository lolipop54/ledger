import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import routes from './router';
import 'vant/lib/index.css';
import {
  Button,
  Cell,
  CellGroup,
  SwipeCell,
  Tabbar,
  TabbarItem,
  NavBar,
  Row,
  Col,
  Form,
  Field,
  DatePicker,
  Picker,
  Popup,
  Tabs,
  Tab,
  Grid,
  GridItem,
  NumberKeyboard,
  Icon,
  Radio,
  RadioGroup,
  Dialog,
  Toast
} from 'vant';

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

const app = createApp(App)
.use(router)
.use(Button)
.use(Cell)
.use(CellGroup)
.use(SwipeCell)
.use(Tabbar)
.use(TabbarItem)
.use(NavBar)
.use(Row)
.use(Col)
.use(Form)
.use(Field)
.use(Picker)
.use(Popup)
.use(Tabs)
.use(Tab)
.use(Grid)
.use(GridItem)
.use(NumberKeyboard)
.use(Icon)
.use(Radio)
.use(RadioGroup)
.use(Dialog)
.use(Toast)
.use(DatePicker)
.mount('#app');


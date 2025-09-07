import { Routes } from '@angular/router';
import { LoginComponent } from './user/login/login';
import { RegisterComponent } from './user/register/register';
import { PostsComponent } from './user/posts/posts';
import { AdminReportsComponent } from './admin/reports/reports/reports';
import { AdminPostsApproveComponent } from './admin/posts-approve/posts-approve';
import { AdminUsersComponent } from './admin/users/users';
import { AdminGroupsComponent } from './admin/groups/groups';
import { ChatComponent } from './chat/chat';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'posts', component: PostsComponent },
  { path: 'chat/:username', component: ChatComponent },
  { path: 'admin/reports', component: AdminReportsComponent },
  { path: 'admin/posts', component: AdminPostsApproveComponent },
  { path: 'admin/users', component: AdminUsersComponent },
  { path: 'admin/groups', component: AdminGroupsComponent },


  { path: 'admin', redirectTo: 'admin/posts', pathMatch: 'full' }, 

  
  { path: 'admin', redirectTo: 'admin/reports', pathMatch: 'full' },

  
  { path: '', redirectTo: 'posts', pathMatch: 'full' },
  { path: '**', redirectTo: 'posts' }
];

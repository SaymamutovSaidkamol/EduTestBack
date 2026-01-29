import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BotUpdate } from './bot.update';
import { RegisterScene } from './scenes/auth/register.scene';
import { AdminGetUserScene } from './scenes/admin/get_user.scene';
import { AdminActivateUserScene } from './scenes/admin/activate_user.scene';
import { AdminExportUsersScene } from './scenes/admin/export_users.scene';
import { AdminUserStatsScene } from './scenes/admin/user_stats.scene';
import { AdminGetCategoryScene } from './scenes/admin/get_category.scene';
import { AdminCreateCategoryScene } from './scenes/admin/create_category.scene';
import { AdminUpdateCategoryScene } from './scenes/admin/update_category.scene';
import { AdminDeleteCategoryScene } from './scenes/admin/delete_category.scene';
import { AdminCreateAdsScene } from './scenes/ads/create_ads.scene';
import { ViewTestsScene } from './scenes/tests/view_tests.scene';
import { SolveTestScene } from './scenes/tests/solve_test.scene';
import { TeacherMyTestsScene } from './scenes/tests/teacher_my_tests.scene';
import { StudentResultsScene } from './scenes/tests/student_results.scene';

@Module({
  imports: [PrismaModule],
  providers: [
    BotUpdate,
    RegisterScene,
    AdminGetUserScene,
    AdminActivateUserScene,
    AdminExportUsersScene,
    AdminUserStatsScene,
    AdminGetCategoryScene,
    AdminCreateCategoryScene,
    AdminUpdateCategoryScene,
    AdminDeleteCategoryScene,
    AdminCreateAdsScene,
    ViewTestsScene,
    SolveTestScene,
    TeacherMyTestsScene,
    StudentResultsScene
  ],
})
export class BotModule { }
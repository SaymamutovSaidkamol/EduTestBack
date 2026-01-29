import { Update, Start, Action, On, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { OnModuleInit } from '@nestjs/common';

@Update()
export class BotUpdate implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  onModuleInit() {
    console.log('✅ Telegram bot muvaffaqiyatli ishga tushdi!');
  }

  @Start()
  async onStart(@Ctx() ctx: Scenes.WizardContext) {
    const userId = ctx.from?.id;
    const CHANNEL_ID_1 = '@Saidkamol_Saymamutov';

    // Clear scene if any
    if (ctx.scene) {
      await ctx.scene.leave();
    }

    try {
      const member = await ctx.telegram.getChatMember(CHANNEL_ID_1, userId!);
      const statuses = ['member', 'administrator', 'creator'];

      const user = await this.prisma.user.findFirst({
        where: { telegramId: String(userId) },
      });

      if (!user) {
        if (ctx.scene) await ctx.scene.enter('create_product');
        return;
      }

      if (!statuses.includes(member.status)) {
        await this.showChannels(ctx);
        return;
      }

      await this.showMainMenu(ctx, user.role);

    } catch (error) {
      console.error('Start error:', error);
      await ctx.reply('Xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.');
    }
  }

  private async showMainMenu(ctx: any, role: string) {
    if (role === 'ADMIN') {
      await ctx.reply(
        'Asosiy menyu (Admin Panel):',
        Markup.keyboard([
          ['Userlar', 'TestCategory'],
          ['Reklamalar', 'Testlar', 'Details'],
        ]).resize(),
      );
    } else if (role === 'TEACHER') {
      await ctx.reply(
        'Asosiy menyu:',
        Markup.keyboard([
          ['My Tests', 'Tests', 'Details'],
        ]).resize(),
      );
    } else {
      await ctx.reply(
        'Asosiy menyu:',
        Markup.keyboard([
          ['Tests', 'Details', 'My Results'],
        ]).resize(),
      );
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Scenes.WizardContext) {
    const text = (ctx.message as any)?.text;
    if (!text) return;

    // Global navigation
    if (text === 'Orqaga' || text === 'Asosiy menyu') {
      const user = await this.prisma.user.findFirst({ where: { telegramId: String(ctx.from?.id) } });
      if (user) {
        if (ctx.scene) await ctx.scene.leave();
        return this.showMainMenu(ctx, user.role);
      }
    }

    if (text === 'Boshlash') {
      await this.onStart(ctx);
    } else if (text === 'Userlar') {
      await ctx.reply('Userlar bo\'limi:', Markup.keyboard([
        ["Userlarni ko'rish", 'Userni aktivlashtirish'],
        ['Excelga eksport', 'Statistika'],
        ['Orqaga']
      ]).resize());
    } else if (text === 'TestCategory') {
      await ctx.reply('Test Kategoriyalari bo\'limi:', Markup.keyboard([
        ["Kategoriya ko'rish", "Kategoriya yaratish"],
        ["Kategoriya tahrirlash", "Kategoriya o'chirish"],
        ['Orqaga']
      ]).resize());
    } else if (text === 'Reklamalar') {
      await ctx.reply('Reklama bo\'limi:', Markup.keyboard([
        ['Yangi reklama yaratish'],
        ['Orqaga']
      ]).resize());
    } else if (text === 'Testlar' || text === 'Tests') {
      const user = await this.prisma.user.findFirst({ where: { telegramId: String(ctx.from?.id) } });
      await ctx.reply('Testlar bo\'limi:', Markup.keyboard([
        ["Testlarni ko'rish"],
        ['Orqaga']
      ]).resize());
    } else if (text === "Userlarni ko'rish") {
      if (ctx.scene) await ctx.scene.enter('admin-get-user');
    } else if (text === 'Userni aktivlashtirish') {
      if (ctx.scene) await ctx.scene.enter('admin-activate-user');
    } else if (text === 'Excelga eksport') {
      if (ctx.scene) await ctx.scene.enter('admin-export-users');
    } else if (text === 'Statistika') {
      if (ctx.scene) await ctx.scene.enter('admin-user-stats');
    } else if (text === 'My Tests') {
      if (ctx.scene) await ctx.scene.enter('teacher-my-tests');
    } else if (text === 'My Results') {
      if (ctx.scene) await ctx.scene.enter('student-my-results');
    } else if (text === "Kategoriya ko'rish") {
      if (ctx.scene) await ctx.scene.enter('admin-get-category');
    } else if (text === 'Kategoriya yaratish') {
      if (ctx.scene) await ctx.scene.enter('admin-create-category');
    } else if (text === 'Kategoriya tahrirlash') {
      if (ctx.scene) await ctx.scene.enter('admin-update-category');
    } else if (text === "Kategoriya o'chirish") {
      if (ctx.scene) await ctx.scene.enter('admin-delete-category');
    } else if (text === 'Yangi reklama yaratish') {
      if (ctx.scene) await ctx.scene.enter('admin-create-ads');
    } else if (text === "Testlarni ko'rish") {
      if (ctx.scene) await ctx.scene.enter('view-tests');
    } else if (text === 'Details') {
      const user = await this.prisma.user.findFirst({ where: { telegramId: String(ctx.from?.id) } });
      if (user) {
        let msg = `<b>Sizning ma'lumotlaringiz:</b>\n\n`;
        msg += `👤 Ism: ${user.firstName}\n`;
        msg += `👤 Familya: ${user.lastName}\n`;
        msg += `📧 Email: ${user.email}\n`;
        msg += `📞 Telefon: ${user.phone || 'Biriktirilmagan'}\n`;
        msg += `🎭 Rol: ${user.role}\n`;
        msg += `✅ Holat: ${user.isActive ? 'Faol' : 'Nofaol'}\n`;

        await ctx.replyWithHTML(msg);
      }
    }
  }

  @Action(/^solve_(.+)$/)
  async onSolveTest(@Ctx() ctx: any) {
    const testId = ctx.match[1];
    await ctx.scene.enter('solve-test', { testId });
  }

  @Action('check_subscribe')
  async onCheckSubscribe(@Ctx() ctx: Scenes.WizardContext) {
    await this.onStart(ctx);
  }

  private async showChannels(ctx: any) {
    const CHANNEL_ID_1 = '@Saidkamol_Saymamutov';
    await ctx.reply(
      '❌ Siz hali kanallarga obuna bo‘lmadingiz. Iltimos, obuna bo‘ling!',
      Markup.inlineKeyboard([
        [Markup.button.url('📢 Obuna bo‘lish', `https://t.me/${CHANNEL_ID_1.replace('@', '')}`)],
        [Markup.button.callback('✅ Obuna bo‘ldim', 'check_subscribe')],
      ]),
    );
  }
}

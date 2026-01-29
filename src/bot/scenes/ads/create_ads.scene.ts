import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-create-ads')
export class AdminCreateAdsScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply(
            "Reklama xabarini yuboring (Text, Rasm yoki Video):",
            Markup.keyboard([['Orqaga']]).resize()
        );
        ctx.wizard.next();
    }

    @WizardStep(2)
    async onGetAdContent(@Ctx() ctx: Scenes.WizardContext) {
        const msg = ctx.message as any;
        if (msg?.text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        try {
            const users = await this.prisma.user.findMany({ where: { telegramId: { not: null } } });
            const chatId = ctx.chat?.id;
            if (!chatId) return ctx.scene.leave();

            await ctx.reply(`Reklama ${users.length}ta foydalanuvchiga yuborilmoqda...`);

            let count = 0;
            for (const user of users) {
                try {
                    if (user.telegramId) {
                        await ctx.telegram.copyMessage(user.telegramId, chatId, msg.message_id);
                        count++;
                    }
                } catch (e) { }
            }
            await ctx.reply(`✅ Tayyor! ${count}ta foydalanuvchiga yuborildi.`);
        } catch (error) {
            await ctx.reply("❌ Xatolik yuz berdi.");
        }

        await this.backToMenu(ctx);
        return ctx.scene.leave();
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Reklama bo\'limi:', Markup.keyboard([
            ['Yangi reklama yaratish'],
            ['Orqaga']
        ]).resize());
    }
}

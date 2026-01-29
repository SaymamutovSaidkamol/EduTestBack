import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-get-category')
export class AdminGetCategoryScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        try {
            const categories = await this.prisma.testCategory.findMany();

            if (categories.length === 0) {
                await ctx.reply("Hozircha test kategoriyalari yo'q.");
            } else {
                let message = "<b>Barcha test kategoriyalari:</b>\n\n";
                categories.forEach((cat, index) => {
                    message += `${index + 1}. ${cat.categoryName}\n`;
                    message += `ID: <code>${cat.id}</code>\n`;
                    message += `----------------------------\n`;
                });
                await ctx.replyWithHTML(message);
            }
        } catch (error) {
            console.error('Admin get categories error:', error);
            await ctx.reply("Kategoriyalarni yuklashda xatolik yuz berdi.");
        }

        await this.backToMenu(ctx);
        return ctx.scene.leave();
    }

    private async backToMenu(ctx: Scenes.WizardContext) {
        await ctx.reply('Test Kategoriyalari bo\'limi:', Markup.keyboard([
            ["Kategoriya ko'rish", "Kategoriya yaratish"],
            ["Kategoriya tahrirlash", "Kategoriya o'chirish"],
            ['Orqaga']
        ]).resize());
    }
}

import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-delete-category')
export class AdminDeleteCategoryScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply("O'chirish uchun kategoriya ID sini kiriting:", Markup.keyboard([['Orqaga']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(2)
    async onGetId(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (!text || text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        try {
            const category = await this.prisma.testCategory.findUnique({ where: { id: text } });
            if (!category) {
                await ctx.reply("❌ Bunday ID ga ega kategoriya topilmadi.");
                return;
            }

            await this.prisma.testCategory.delete({ where: { id: text } });
            await ctx.reply(`✅ "${category.categoryName}" kategoriyasi o'chirildi!`);
        } catch (e) {
            await ctx.reply("❌ Xatolik yuz berdi. Bu kategoriyaga bog'liq testlar bo'lishi mumkin.");
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

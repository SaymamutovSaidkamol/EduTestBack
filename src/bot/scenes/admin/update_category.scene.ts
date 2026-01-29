import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-update-category')
export class AdminUpdateCategoryScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply("Tahrirlash uchun kategoriya ID sini kiriting:", Markup.keyboard([['Orqaga']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(2)
    async onGetId(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (!text || text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        const category = await this.prisma.testCategory.findUnique({ where: { id: text } });
        if (!category) {
            await ctx.reply("❌ Kategoriya topilmadi. Qaytadan kiriting:");
            return;
        }

        ctx.scene.state['cat_id'] = text;
        await ctx.reply(`Hozirgi nomi: ${category.categoryName}\nYangisini kiriting (yoki 'Skip'):`);
        ctx.wizard.next();
    }

    @WizardStep(3)
    async onGetNewName(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        if (text !== 'Skip') {
            ctx.scene.state['new_name'] = text;
        }
        await ctx.reply("Yangi rasm URL kiriting (yoki 'Skip'):");
        ctx.wizard.next();
    }

    @WizardStep(4)
    async onUpdate(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        const s = ctx.scene.state;

        const data: any = {};
        if (s['new_name']) data.categoryName = s['new_name'];
        if (text !== 'Skip') data.image = text;

        try {
            if (Object.keys(data).length > 0) {
                await this.prisma.testCategory.update({
                    where: { id: s['cat_id'] },
                    data
                });
                await ctx.reply("✅ Kategoriya yangilandi!");
            } else {
                await ctx.reply("Hech narsa o'zgartirilmadi.");
            }
        } catch (e) {
            await ctx.reply("❌ Xatolik yuz berdi.");
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

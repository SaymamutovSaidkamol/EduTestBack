import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-create-category')
export class AdminCreateCategoryScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply("Yangi kategoyiya nomini kiriting:", Markup.keyboard([['Orqaga']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(2)
    async onGetName(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (!text || text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        const exists = await this.prisma.testCategory.findUnique({
            where: { categoryName: text }
        });

        if (exists) {
            await ctx.reply("❌ Bu kategoriya allaqachon mavjud. Iltimos boshqa nom kiriting:");
            return;
        }

        ctx.scene.state['cat_name'] = text;
        await ctx.reply("Kategoriya uchun rasm URL manzini kiriting (yoki 'Skip'):");
        ctx.wizard.next();
    }

    @WizardStep(3)
    async onGetImage(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        const catName = ctx.scene.state['cat_name'];
        const image = text === 'Skip' ? '' : text;

        try {
            await this.prisma.testCategory.create({
                data: {
                    categoryName: catName,
                    image: image
                }
            });
            await ctx.reply("✅ Kategoriya muvaffaqiyatli yaratildi!");
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

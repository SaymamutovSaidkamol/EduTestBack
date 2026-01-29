import { Wizard, WizardStep, Ctx, Action } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('view-tests')
export class ViewTestsScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        try {
            const tests = await this.prisma.test.findMany({
                where: { isActive: true },
                include: { category: true }
            });

            if (tests.length === 0) {
                await ctx.reply("Hozircha testlar mavjud emas.");
                return ctx.scene.leave();
            }

            const buttons = tests.map(test => [
                Markup.button.callback(`${test.title} (${test.category.categoryName})`, `solve_${test.id}`)
            ]);

            await ctx.reply(
                "Mavjud testlar ro'yxati. Yechish uchun testni tanlang:",
                Markup.inlineKeyboard(buttons)
            );
        } catch (e) {
            await ctx.reply("Xatolik yuz berdi.");
        }
        return ctx.scene.leave();
    }
}

import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('student-my-results')
export class StudentResultsScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        try {
            const studentTelegramId = String(ctx.from?.id);
            const student = await this.prisma.user.findFirst({ where: { telegramId: studentTelegramId } });

            if (!student) return ctx.scene.leave();

            const results = await this.prisma.result.findMany({
                where: { studentId: student.id },
                include: {
                    test: {
                        include: {
                            Teacher: true,
                            questions: true
                        }
                    }
                }
            });

            const totalActiveTests = await this.prisma.test.count({ where: { isActive: true } });

            if (results.length === 0) {
                await ctx.reply("Siz hali test topshirmagansiz.");
            } else {
                const completionRate = totalActiveTests > 0 ? Math.round((results.length / totalActiveTests) * 100) : 0;

                let message = `<b>🧑‍🎓 Sizning natijalaringiz va samaradorligingiz:</b>\n`;
                message += `📊 Umumiy qamrov: ${completionRate}% (mavjud testlardan)\n\n`;

                results.forEach(res => {
                    const total = res.test.questions.length;
                    const correct = res.score ?? 0;
                    const correctPercent = total > 0 ? Math.round((correct / total) * 100) : 0;
                    const incorrectPercent = 100 - correctPercent;

                    message += `📝 <b>Test: ${res.test.title}</b>\n`;
                    message += `👨‍🏫 Ustoz: ${res.test.Teacher.firstName} ${res.test.Teacher.lastName}\n`;
                    message += `✅ To'g'ri javoblar: ${correctPercent}%\n`;
                    message += `❌ Noto'g'ri javoblar: ${incorrectPercent}%\n`;
                    message += `----------------------------\n`;
                });

                await ctx.replyWithHTML(message);
            }
        } catch (error) {
            console.error('Student results error:', error);
            await ctx.reply("Natijalarni yuklashda xatolik.");
        }

        await this.backToMenu(ctx);
        return ctx.scene.leave();
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Siz Asosiy menyudasiz', Markup.keyboard([
            ['Tests', 'Details', 'My Results']
        ]).resize());
    }
}

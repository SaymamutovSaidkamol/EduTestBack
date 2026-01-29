import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('teacher-my-tests')
export class TeacherMyTestsScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        try {
            const teacherTelegramId = String(ctx.from?.id);
            const teacher = await this.prisma.user.findFirst({ where: { telegramId: teacherTelegramId } });

            if (!teacher) return ctx.scene.leave();

            const tests = await this.prisma.test.findMany({
                where: { teacherId: teacher.id },
                include: {
                    results: { include: { student: true } },
                    questions: true
                }
            });

            if (tests.length === 0) {
                await ctx.reply("Siz yaratgan testlar topilmadi.");
            } else {
                const totalStudentsCount = await this.prisma.user.count({ where: { role: 'STUDENT' } });

                let message = "<b>👨‍🏫 Mening testlarim statistikasi:</b>\n\n";

                for (const test of tests) {
                    const takenCount = test.results.length;
                    const participationPercent = totalStudentsCount > 0 ? (takenCount / totalStudentsCount) * 100 : 0;

                    let totalCorrect = 0;
                    let totalPossible = 0;

                    message += `📝 <b>Test: ${test.title}</b>\n`;
                    message += `📈 Qamrov: ${takenCount} talaba (${Math.round(participationPercent)}%)\n`;

                    if (takenCount > 0) {
                        message += `👥 Topshirganlar:\n`;
                        test.results.forEach(res => {
                            const score = res.score ?? 0;
                            const totalQ = test.questions.length;
                            const percent = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;

                            totalCorrect += score;
                            totalPossible += totalQ;

                            message += `  ▪️ ${res.student.firstName} ${res.student.lastName}: ${percent}%\n`;
                        });

                        const avgSuccess = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
                        message += `🏆 O'rtacha muvaffaqiyat: ${avgSuccess}%\n`;
                        message += `✅ To'g'ri javoblar: ${avgSuccess}%\n`;
                        message += `❌ Noto'g'ri javoblar: ${100 - avgSuccess}%\n`;
                    } else {
                        message += `ℹ️ Hali hech kim topshirmagan.\n`;
                    }

                    message += `----------------------------\n`;

                    if (message.length > 3500) {
                        await ctx.replyWithHTML(message);
                        message = "";
                    }
                }

                if (message) await ctx.replyWithHTML(message);
            }
        } catch (error) {
            console.error('Teacher stats error:', error);
            await ctx.reply("Statistikani yuklashda xatolik yuz berdi.");
        }

        await this.backToMenu(ctx);
        return ctx.scene.leave();
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Asosiy menyu:', Markup.keyboard([
            ['My Tests', 'Tests', 'Details']
        ]).resize());
    }
}

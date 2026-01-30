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
                where: {
                    studentId: student.id
                },
                include: {
                    test: {
                        include: {
                            Teacher: true,
                            questions: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (results.length === 0) {
                await ctx.reply("Siz hali birorta ham test boshlamagansiz.");
            } else {
                let message = `<b>🧑‍🎓 Sizning testlardagi ishtirokingiz:</b>\n\n`;

                results.forEach(res => {
                    const isFinished = res.status === 'FINISHED';
                    const total = res.test.questions.length;

                    message += `📝 <b>Test: ${res.test.title}</b>\n`;
                    message += `👨‍🏫 Ustoz: ${res.test.Teacher.firstName} ${res.test.Teacher.lastName}\n`;

                    if (isFinished) {
                        const correct = res.score ?? 0;
                        const correctPercent = total > 0 ? Math.round((correct / total) * 100) : 0;
                        message += `✅ Holat: Yakunlangan\n`;
                        message += `📊 Natija: ${correct}/${total} (${correctPercent}%)\n`;
                    } else {
                        message += `⏳ Holat: Davom etmoqda (Yakunlanmagan)\n`;
                        message += `ℹ️ Testni oxiriga yetkazsangiz natijangiz ko'rinadi.\n`;
                    }
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

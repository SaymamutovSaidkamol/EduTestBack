import { Wizard, WizardStep, Ctx, On } from 'nestjs-telegraf';
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
                const allStudents = await this.prisma.user.findMany({ where: { role: 'STUDENT' } });
                const totalStudentsCount = allStudents.length;

                let message = "<b>👨‍🏫 Mening testlarim statistikasi:</b>\n\n";

                for (const test of tests) {
                    const finishedResults = test.results.filter(r => r.status === 'FINISHED');
                    const takenCount = finishedResults.length;
                    const participationPercent = totalStudentsCount > 0 ? (takenCount / totalStudentsCount) * 100 : 0;

                    let totalCorrect = 0;
                    let totalPossible = 0;

                    message += `📝 <b>Test: ${test.title}</b>\n`;
                    message += `📈 Qamrov: ${takenCount} / ${totalStudentsCount} talaba (${Math.round(participationPercent)}%)\n`;

                    if (totalStudentsCount > 0) {
                        message += `👥 Talabalar holati:\n`;

                        allStudents.forEach(student => {
                            const studentResult = test.results.find(r => r.studentId === student.id);
                            if (studentResult) {
                                if (studentResult.status === 'FINISHED') {
                                    const score = studentResult.score ?? 0;
                                    const totalQ = test.questions.length;
                                    const percent = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;
                                    totalCorrect += score;
                                    totalPossible += totalQ;
                                    message += `  ✅ ${student.firstName} ${student.lastName}: ${percent}%\n`;
                                } else {
                                    message += `  ⏳ ${student.firstName} ${student.lastName}: Davom etmoqda\n`;
                                }
                            } else {
                                message += `  ❌ ${student.firstName} ${student.lastName}: Topshirmagan\n`;
                            }
                        });

                        const avgSuccess = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
                        message += `\n🏆 O'rtacha muvaffaqiyat: ${avgSuccess}%\n`;
                    } else {
                        message += `ℹ️ Talabalar mavjud emas.\n`;
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

        await this.showInternalMenu(ctx);
        ctx.wizard.next();
    }

    @WizardStep(2)
    @On('text')
    async onMenuAction(@Ctx() ctx: any) {
        const text = ctx.message.text;
        const teacherTelegramId = String(ctx.from?.id);
        const teacher = await this.prisma.user.findFirst({ where: { telegramId: teacherTelegramId } });

        if (!teacher) {
            ctx.scene.leave();
            return;
        }

        if (text === 'Create New Test') {
            ctx.scene.enter('teacher-create-test');
            return;
        } else if (text === 'Update Test') {
            const tests = await this.prisma.test.findMany({
                where: { teacherId: teacher.id }
            });

            if (tests.length === 0) {
                await ctx.reply("Sizda hali testlar yo'q.");
                return;
            }

            const buttons = tests.map(test => [
                Markup.button.callback(
                    `${test.isActive ? '✅' : '❌'} ${test.title}`,
                    `toggle_status_${test.id}`
                )
            ]);

            await ctx.reply("Qaysi testni aktivlashtirmoqchi yoki deaktivlashtirmoqchisiz?", Markup.inlineKeyboard(buttons));
            ctx.wizard.next();
            return;
        } else if (text === 'Orqaga' || text === 'Asosiy menyu') {
            ctx.scene.leave();
            return;
        }
        await ctx.reply("Iltimos, pastdagi tugmalardan foydalaning.");
    }

    @WizardStep(3)
    async onUpdateToggle(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) {
            if (ctx.message?.text === 'Orqaga' || ctx.message?.text === 'Asosiy menyu') {
                ctx.scene.leave();
                return;
            }
            await ctx.reply("Iltimos, testni tanlang.");
            return;
        }

        const data = ctx.callbackQuery.data;
        if (data.startsWith('toggle_status_')) {
            const testId = data.replace('toggle_status_', '');
            const test = await this.prisma.test.findUnique({ where: { id: testId } });

            if (!test) {
                await ctx.answerCbQuery("Test topilmadi.");
                return;
            }

            const newStatus = !test.isActive;
            await this.prisma.test.update({
                where: { id: testId },
                data: { isActive: newStatus }
            });

            await ctx.answerCbQuery(`Test ${newStatus ? 'aktivlashtirildi' : 'deaktivlashtirildi'}`);

            // Refresh the list
            const teacherId = test.teacherId;
            const tests = await this.prisma.test.findMany({
                where: { teacherId }
            });

            const buttons = tests.map(t => [
                Markup.button.callback(
                    `${t.isActive ? '✅' : '❌'} ${t.title}`,
                    `toggle_status_${t.id}`
                )
            ]);

            await ctx.editMessageText(
                "Test holati o'zgartirildi. Yana birontasini o'zgartirasizmi?",
                Markup.inlineKeyboard(buttons)
            );
        }
    }

    private async showInternalMenu(ctx: any) {
        await ctx.reply('Siz "Mening testlarim" bo\'limidasiz. Amalni tanlang:', Markup.keyboard([
            ['Create New Test', 'Update Test'],
            ['Orqaga']
        ]).resize());
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Asosiy menyu:', Markup.keyboard([
            ['My Tests', 'Tests', 'Details']
        ]).resize());
    }
}

import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('view-tests')
export class ViewTestsScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: any) {
        try {
            const teachers = await this.prisma.user.findMany({
                where: {
                    role: 'TEACHER',
                    tests: { some: { isActive: true } }
                }
            });

            if (teachers.length === 0) {
                await ctx.reply("Hozircha test yaratgan ustozlar mavjud emas.");
                ctx.scene.leave();
                return;
            }

            const buttons = teachers.map(teacher => [
                Markup.button.callback(`👨‍🏫 ${teacher.firstName} ${teacher.lastName}`, `select_teacher_${teacher.id}`)
            ]);
            buttons.push([Markup.button.callback('❌ Bekor qilish', 'cancel')]);

            const msg = "<b>Foydalanuvchini tanlang:</b>\n\nQaysi ustozning testlarini topshirmoqchisiz?";
            if (ctx.callbackQuery) {
                await ctx.editMessageText(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
            } else {
                await ctx.replyWithHTML(msg, Markup.inlineKeyboard(buttons));
            }
            ctx.wizard.next();
        } catch (e) {
            console.error('List teachers error:', e);
            await ctx.reply("Xatolik yuz berdi.");
            ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async onTeacherSelect(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) return;

        const data = ctx.callbackQuery.data;
        if (data === 'cancel') {
            await ctx.answerCbQuery();
            await ctx.editMessageText("Amal bekor qilindi.");
            ctx.scene.leave();
            return;
        }

        if (data === 'back_to_teachers') {
            await ctx.answerCbQuery();
            ctx.wizard.selectStep(0); // Go to Step 1
            return;
        }

        if (data.startsWith('select_teacher_')) {
            const teacherId = data.replace('select_teacher_', '');
            ctx.wizard.state.selectedTeacherId = teacherId;

            const telegramId = String(ctx.from?.id);
            const user = await this.prisma.user.findFirst({ where: { telegramId } });
            if (!user) {
                ctx.scene.leave();
                return;
            }

            const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
            const tests = await this.prisma.test.findMany({
                where: { teacherId, isActive: true },
                include: {
                    category: true,
                    results: { where: { studentId: user.id, status: 'FINISHED' } }
                }
            });

            if (tests.length === 0) {
                await ctx.answerCbQuery("Ushbu ustozda hozircha faol testlar yo'q.");
                return;
            }

            await ctx.answerCbQuery();
            const buttons = tests.map(test => {
                const isCompleted = test.results.length > 0;
                const statusIcon = isCompleted ? '✅ ' : '📝 ';
                const label = `${statusIcon}${test.title} (${test.category?.categoryName || 'Kategoriyasiz'})`;
                return [Markup.button.callback(label, `info_${test.id}`)];
            });
            buttons.push([Markup.button.callback('⬅️ Ustozlarga qaytish', 'back_to_teachers')]);

            await ctx.editMessageText(
                `<b>👨‍🏫 Ustoz: ${teacher?.firstName} ${teacher?.lastName}</b>\n\nTestni tanlang:`,
                { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
            );
            return; // Stay in Step 2 to handle test selection or back button
        }

        if (data.startsWith('info_')) {
            const testId = data.replace('info_', '');
            const telegramId = String(ctx.from?.id);
            const user = await this.prisma.user.findUnique({ where: { telegramId: String(telegramId) } });

            const test = await this.prisma.test.findUnique({
                where: { id: testId },
                include: {
                    category: true,
                    questions: true,
                    results: { where: { studentId: user?.id, status: 'FINISHED' } }
                }
            });

            if (!test) {
                await ctx.answerCbQuery("Test topilmadi.");
                return;
            }

            await ctx.answerCbQuery();
            const isCompleted = test.results.length > 0;
            let msg = `<b>Test: ${test.title}</b>\n`;
            msg += `📂 Kategoriya: ${test.category?.categoryName || 'Kategoriyasiz'}\n`;
            msg += `📝 Savollar soni: ${test.questions.length}\n`;
            msg += `📄 Tavsif: ${test.description}\n\n`;

            const buttons: any[][] = [];
            if (isCompleted) {
                msg += `✅ <b>Siz ushbu testni topshirgansiz.</b>\n`;
                msg += `📊 Natija: ${test.results[0].score}/${test.questions.length}`;
            } else {
                buttons.push([Markup.button.callback('🚀 Testni boshlash', `solve_${test.id}`)]);
            }
            buttons.push([Markup.button.callback('⬅️ Testlarga qaytish', `select_teacher_${ctx.wizard.state.selectedTeacherId}`)]);

            await ctx.editMessageText(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
            return;
        }

        if (data.startsWith('solve_')) {
            const testId = data.replace('solve_', '');
            await ctx.answerCbQuery();
            ctx.scene.enter('solve-test', { testId });
            return;
        }
    }
}

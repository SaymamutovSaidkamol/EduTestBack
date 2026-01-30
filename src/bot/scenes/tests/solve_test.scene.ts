import { Scene, SceneEnter, On, Ctx, Action } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Scene('solve-test')
export class SolveTestScene {
    constructor(private readonly prisma: PrismaService) { }

    @SceneEnter()
    async onEnter(@Ctx() ctx: any) {
        const testId = ctx.scene.state.testId;
        if (!testId) {
            await ctx.reply("Test tanlanmagan.");
            return ctx.scene.leave();
        }

        const telegramId = String(ctx.from?.id);
        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            await ctx.reply("Foydalanuvchi topilmadi. Iltimos, ro'yxatdan o'ting.");
            return ctx.scene.leave();
        }

        const test = await this.prisma.test.findUnique({
            where: { id: testId },
            include: {
                questions: {
                    include: { options: true }
                },
                testVariants: true
            }
        });

        if (!test || test.questions.length === 0) {
            await ctx.reply("Testda savollar topilmadi.");
            return ctx.scene.leave();
        }

        let variantId: string;
        if (test.testVariants && test.testVariants.length > 0) {
            variantId = test.testVariants[0].id;
        } else {
            const newVariant = await this.prisma.testVariants.create({
                data: {
                    name: 'Default Variant',
                    testId: test.id
                }
            });
            variantId = newVariant.id;
        }

        ctx.scene.state.test = test;
        ctx.scene.state.questions = test.questions;
        ctx.scene.state.currentIdx = 0;
        ctx.scene.state.score = 0;
        ctx.scene.state.total = test.questions.length;
        ctx.scene.state.userId = user.id;
        ctx.scene.state.variantId = variantId;
        ctx.scene.state.chatId = ctx.chat?.id;

        await ctx.reply(`<b>Test: ${test.title}</b>\nSavollar soni: ${test.questions.length}\n\nTayyormisiz?`, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('Boshlash', 'start_now')],
                [Markup.button.callback('Bekor qilish', 'cancel_test')]
            ])
        });
    }

    @Action('start_now')
    async startTest(@Ctx() ctx: any) {
        await ctx.deleteMessage();

        const result = await this.prisma.result.create({
            data: {
                studentId: ctx.scene.state.userId,
                testId: ctx.scene.state.test.id,
                variantId: ctx.scene.state.variantId,
                score: 0,
                status: 'IN_PROGRESS'
            }
        });
        ctx.scene.state.resultId = result.id;

        await this.sendQuestion(ctx);
    }

    @Action('cancel_test')
    async cancel(@Ctx() ctx: any) {
        await ctx.reply("Test bekor qilindi.");
        return ctx.scene.leave();
    }

    async sendQuestion(ctx: any) {
        const { questions, currentIdx } = ctx.scene.state;
        const question = questions[currentIdx];

        const options = question.options.map((o: any) => o.optionText);
        const correctOptionIdx = question.options.findIndex((o: any) => o.isCorrect);

        const poll = await ctx.telegram.sendQuiz(
            ctx.scene.state.chatId || ctx.from.id,
            `${currentIdx + 1}. ${question.questionText}`,
            options,
            {
                is_anonymous: false,
                correct_option_id: correctOptionIdx,
                open_period: 60,
            }
        );

        ctx.scene.state.currentPollId = poll.poll.id;
    }

    @On('poll_answer')
    async onPollAnswer(@Ctx() ctx: any) {
        const pollAnswer = ctx.pollAnswer;
        const userId = String(pollAnswer.user.id);
        let state = ctx.scene.state;

        console.log(`Poll Answer received from user ${userId} for poll ${pollAnswer.poll_id}`);

        // Force reload state from DB if questions are missing (session recovery)
        if (!state.questions || !state.resultId) {
            console.log(`Session state missing for user ${userId}, attempting recovery...`);
            const user = await this.prisma.user.findUnique({
                where: { telegramId: userId },
                include: {
                    results: {
                        where: { status: 'IN_PROGRESS' },
                        include: { test: { include: { questions: { include: { options: true } }, testVariants: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });

            if (!user || user.results.length === 0) {
                console.log(`No in-progress test found for user ${userId}.`);
                return;
            }
            const res = user.results[0];

            ctx.scene.state.test = res.test;
            ctx.scene.state.questions = res.test.questions;
            ctx.scene.state.resultId = res.id;
            ctx.scene.state.total = res.test.questions.length;
            ctx.scene.state.userId = user.id;
            ctx.scene.state.chatId = userId;
            ctx.scene.state.variantId = res.variantId;

            const answersCount = await this.prisma.resultAnswer.count({
                where: { resultId: res.id }
            });
            ctx.scene.state.currentIdx = answersCount;
            state = ctx.scene.state;
            console.log(`Recovery successful. Current index: ${state.currentIdx}`);
        }

        const question = state.questions[state.currentIdx];
        if (!question) {
            console.log(`No question found at index ${state.currentIdx}. Total: ${state.total}`);
            return;
        }

        const correctOptionIdx = question.options.findIndex((o: any) => o.isCorrect);
        const selectedOptionIdx = pollAnswer.option_ids[0];
        const isCorrect = selectedOptionIdx === correctOptionIdx;

        console.log(`User selected option ${selectedOptionIdx}. Correct is ${correctOptionIdx}. Saving...`);

        try {
            await this.prisma.resultAnswer.create({
                data: {
                    resultId: state.resultId,
                    questionId: question.id,
                    selectOptionId: question.options[selectedOptionIdx]?.id,
                    isCorrect: isCorrect ? 'CORRECT' : 'WRONG'
                }
            });
            console.log('Answer saved to database.');
        } catch (dbError) {
            console.error('Error saving answer to database:', dbError);
        }

        state.currentIdx++;

        if (state.currentIdx < state.total) {
            console.log(`Moving to next question (${state.currentIdx + 1}/${state.total})...`);
            setTimeout(async () => {
                try {
                    await this.sendQuestion(ctx);
                } catch (e) {
                    console.error('Send next question error:', e);
                }
            }, 1000);
        } else {
            console.log('All questions answered. Fetching next test options...');
            try {
                // Check if there is a next test
                const nextTest = await this.prisma.test.findFirst({
                    where: {
                        isActive: true,
                        id: { not: state.test.id },
                        results: {
                            none: {
                                studentId: state.userId,
                                status: 'FINISHED'
                            }
                        }
                    }
                });

                const chatId = state.chatId || userId;
                if (nextTest) {
                    await ctx.telegram.sendMessage(chatId, `Ushbu test yakunlandi. Navbatdagisiga o'tasizmi yoki to'xtatasizmi?`, {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "➡️ Keyingi test", callback_data: `next_test_${nextTest.id}` }],
                                [{ text: "❌ Bekor qilish", callback_data: `cancel_post_test` }]
                            ]
                        }
                    });
                } else {
                    await ctx.telegram.sendMessage(chatId, `Barcha savollar tugadi. Test natijalarini saqlashni xohlaysizmi?`, {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "✅ Ha, saqlash", callback_data: `save_final_yes` }],
                                [{ text: "❌ Yo'q, saqlamaslik", callback_data: `save_final_no` }]
                            ]
                        }
                    });
                }
                console.log('Options sent to user.');
            } catch (error) {
                console.error('Error checking next test or sending options:', error);
            }
        }
    }

    @Action('finish_test_now')
    async onFinishAction(@Ctx() ctx: any) {
        await ctx.answerCbQuery();
        await this.finish(ctx, String(ctx.from.id));
    }

    @Action(/^next_test_(.+)$/)
    async onNextTest(@Ctx() ctx: any) {
        const nextTestId = ctx.match[1];
        const { resultId, score, total } = ctx.scene.state;

        // Save current test as finished before moving on
        await this.finalizeTest(resultId);

        await ctx.answerCbQuery("Test saqlandi. Keyingisiga o'tilmoqda...");
        await ctx.editMessageText("⏳ Keyingi test yuklanmoqda...");
        return ctx.scene.enter('solve-test', { testId: nextTestId });
    }

    @Action('cancel_post_test')
    async onCancelPostTest(@Ctx() ctx: any) {
        await ctx.answerCbQuery();
        await ctx.editMessageText("Ushbu testni yakunlagan natijangizni saqlashni xohlaysizmi?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Ha, saqlash", callback_data: `save_final_yes` }],
                    [{ text: "❌ Yo'q, saqlamaslik", callback_data: `save_final_no` }]
                ]
            }
        });
    }

    @Action('save_final_yes')
    async onSaveYes(@Ctx() ctx: any) {
        const { resultId } = ctx.scene.state;
        await this.finalizeTest(resultId);

        const answers = await this.prisma.resultAnswer.findMany({ where: { resultId } });
        const score = answers.filter(a => a.isCorrect === 'CORRECT').length;
        const total = answers.length;

        await ctx.answerCbQuery("Natijalar saqlandi!");
        await ctx.editMessageText(`✅ Test yakunlandi va saqlandi!\n📊 Natija: ${score}/${total}\n📈 Foiz: ${Math.round((score / (total || 1)) * 100)}%`);
        return ctx.scene.leave();
    }

    @Action('save_final_no')
    async onSaveNo(@Ctx() ctx: any) {
        await ctx.answerCbQuery("Saqlanmadi.");
        await ctx.editMessageText("❌ Test natijalari saqlanmadi.");
        return ctx.scene.leave();
    }

    private async finalizeTest(resultId: string) {
        if (!resultId) return;

        const answers = await this.prisma.resultAnswer.findMany({ where: { resultId } });
        const score = answers.filter(a => a.isCorrect === 'CORRECT').length;

        await this.prisma.result.update({
            where: { id: resultId },
            data: {
                score,
                status: 'FINISHED',
                completed_at: new Date()
            }
        });
    }

    async finish(ctx: any, telegramId: string) {
        // This is now replaced by granular actions above, but kept as fallback
        const resultId = ctx.scene.state.resultId;
        await this.finalizeTest(resultId);
        await ctx.telegram.sendMessage(telegramId, "Test yakunlandi.");
        return ctx.scene.leave();
    }
}

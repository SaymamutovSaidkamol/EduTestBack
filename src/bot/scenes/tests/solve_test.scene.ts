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

        const test = await this.prisma.test.findUnique({
            where: { id: testId },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!test || test.questions.length === 0) {
            await ctx.reply("Testda savollar topilmadi.");
            return ctx.scene.leave();
        }

        ctx.scene.state.questions = test.questions;
        ctx.scene.state.currentIdx = 0;
        ctx.scene.state.score = 0;
        ctx.scene.state.total = test.questions.length;

        await ctx.reply(`<b>Test: ${test.title}</b>\nSavollar soni: ${test.questions.length}\nHar bir savol uchun 30 soniya beriladi.\n\nTayyormisiz?`, {
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

        const poll = await ctx.replyWithPoll(
            `${currentIdx + 1}. ${question.questionText}`,
            options,
            {
                is_anonymous: false,
                type: 'quiz',
                correct_option_id: correctOptionIdx,
                open_period: 30, // 30 seconds
            }
        );

        ctx.scene.state.currentPollId = poll.poll.id;
    }

    @On('poll_answer')
    async onPollAnswer(@Ctx() ctx: any) {
        const state = ctx.scene.state;
        if (!state.questions) return;

        const pollAnswer = ctx.pollAnswer;
        if (pollAnswer.poll_id !== state.currentPollId) return;

        const question = state.questions[state.currentIdx];
        const correctOptionIdx = question.options.findIndex((o: any) => o.isCorrect);

        if (pollAnswer.option_ids[0] === correctOptionIdx) {
            state.score++;
        }

        state.currentIdx++;

        if (state.currentIdx < state.total) {
            // Wait a bit before next question
            setTimeout(() => this.sendQuestion(ctx), 1000);
        } else {
            await this.finish(ctx);
        }
    }

    async finish(ctx: any) {
        const { score, total } = ctx.scene.state;
        await ctx.reply(`Test yakunlandi!\nNatija: ${score}/${total}\nFoiz: ${Math.round((score / total) * 100)}%`);
        return ctx.scene.leave();
    }
}

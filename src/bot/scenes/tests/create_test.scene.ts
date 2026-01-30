import { Wizard, WizardStep, Ctx, On, Action } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('teacher-create-test')
export class TeacherCreateTestScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: any) {
        ctx.wizard.state.testData = {
            questions: []
        };
        await ctx.reply("Yangi test nomini kiriting:", Markup.keyboard([['Bekor qilish']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(2)
    @On('text')
    async onTitle(@Ctx() ctx: any) {
        const text = ctx.message.text;
        if (text === 'Bekor qilish') return this.cancel(ctx);

        ctx.wizard.state.testData.title = text;
        await ctx.reply("Test tavsifini kiriting:");
        ctx.wizard.next();
    }

    @WizardStep(3)
    @On('text')
    async onDescription(@Ctx() ctx: any) {
        const text = ctx.message.text;
        if (text === 'Bekor qilish') return this.cancel(ctx);

        ctx.wizard.state.testData.description = text;

        const categories = await this.prisma.testCategory.findMany();
        if (categories.length === 0) {
            await ctx.reply("Kategoriyalar topilmadi. Admin bilan bog'laning.");
            return this.cancel(ctx);
        }

        const buttons = categories.map(cat => [
            Markup.button.callback(cat.categoryName, `cat_${cat.id}`)
        ]);

        await ctx.reply("Kategoriyani tanlang:", Markup.inlineKeyboard(buttons));
        ctx.wizard.next();
    }

    @WizardStep(4)
    async onCategory(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) {
            await ctx.reply("Iltimos, kategoriyani tanlang.");
            return;
        }
        const categoryId = ctx.callbackQuery.data.replace('cat_', '');
        ctx.wizard.state.testData.categoryId = categoryId;
        await ctx.answerCbQuery();

        await ctx.reply("Endi savollarni qo'shamiz.\n1-savol matnini kiriting:");
        ctx.wizard.next();
    }

    @WizardStep(5)
    @On('text')
    async onQuestionText(@Ctx() ctx: any) {
        const text = ctx.message.text;
        if (text === 'Bekor qilish') return this.cancel(ctx);

        ctx.wizard.state.currentQuestion = {
            questionText: text,
            options: []
        };
        await ctx.reply("Ushbu savol uchun 1-variant matnini kiriting:");
        ctx.wizard.next();
    }

    @WizardStep(6)
    @On('text')
    async onOptionText(@Ctx() ctx: any) {
        const text = ctx.message.text;
        if (text === 'Bekor qilish') return this.cancel(ctx);

        ctx.wizard.state.currentOptionText = text;
        await ctx.reply(
            `"${text}" - to'g'ri javobmi?`,
            Markup.inlineKeyboard([
                [Markup.button.callback('Ha', 'correct_true'), Markup.button.callback('Yo\'q', 'correct_false')]
            ])
        );
        ctx.wizard.next();
    }

    @WizardStep(7)
    async onOptionCorrect(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) {
            await ctx.reply("Iltimos, tanlang (Ha/Yo'q).");
            return;
        }
        const isCorrect = ctx.callbackQuery.data === 'correct_true';
        await ctx.answerCbQuery();

        ctx.wizard.state.currentQuestion.options.push({
            optionText: ctx.wizard.state.currentOptionText,
            isCorrect: isCorrect
        });

        await ctx.reply(
            "Yana variant qo'shasizmi?",
            Markup.inlineKeyboard([
                [Markup.button.callback('Yana variant qo\'shish', 'add_option')],
                [Markup.button.callback('Variantlarni yakunlash', 'finish_options')]
            ])
        );
        ctx.wizard.next();
    }

    @WizardStep(8)
    async onNextActionOptions(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) {
            await ctx.reply("Iltimos, tugmalardan birini tanlang.");
            return;
        }
        const action = ctx.callbackQuery.data;
        await ctx.answerCbQuery();

        if (action === 'add_option') {
            await ctx.reply(`${ctx.wizard.state.currentQuestion.options.length + 1}-variant matnini kiriting:`);
            ctx.wizard.selectStep(5); // Go back to Step 6 (0-indexed 5)
        } else {
            ctx.wizard.state.testData.questions.push(ctx.wizard.state.currentQuestion);
            await ctx.reply(
                "Savol saqlandi. Yana savol qo'shasizmi?",
                Markup.inlineKeyboard([
                    [Markup.button.callback('Yana savol qo\'shish', 'add_question')],
                    [Markup.button.callback('Testni yakunlash va saqlash', 'finish_test')]
                ])
            );
            ctx.wizard.next();
        }
    }

    @WizardStep(9)
    async onNextActionQuestions(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) {
            await ctx.reply("Iltimos, tugmalardan birini tanlang.");
            return;
        }
        const action = ctx.callbackQuery.data;
        await ctx.answerCbQuery();

        if (action === 'add_question') {
            await ctx.reply(`${ctx.wizard.state.testData.questions.length + 1}-savol matnini kiriting:`);
            ctx.wizard.selectStep(4); // Go back to Step 5 (0-indexed 4)
        } else {
            await this.saveTest(ctx);
        }
    }

    async saveTest(ctx: any) {
        try {
            const userId = ctx.from.id;
            const user = await this.prisma.user.findUnique({ where: { telegramId: String(userId) } });
            if (!user) {
                await ctx.reply("Foydalanuvchi topilmadi.");
                return this.cancel(ctx);
            }

            const { testData } = ctx.wizard.state;

            await this.prisma.test.create({
                data: {
                    title: testData.title,
                    description: testData.description,
                    categoryId: testData.categoryId,
                    teacherId: user.id,
                    isActive: true,
                    questions: {
                        create: testData.questions.map((q: any) => ({
                            questionText: q.questionText,
                            options: {
                                create: q.options.map((o: any) => ({
                                    optionText: o.optionText,
                                    isCorrect: o.isCorrect
                                }))
                            }
                        }))
                    }
                }
            });

            await ctx.reply("✅ Test muvaffaqiyatli yaratildi!");
        } catch (error) {
            console.error('Create test error:', error);
            await ctx.reply("❌ Test yaratishda xatolik yuz berdi.");
        }
        await this.backToMenu(ctx);
        ctx.scene.leave();
    }

    async cancel(ctx: any) {
        await ctx.reply("Bekor qilindi.");
        await this.backToMenu(ctx);
        ctx.scene.leave();
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Asosiy menyu:', Markup.keyboard([
            ['My Tests', 'Tests', 'Details']
        ]).resize());
    }
}
